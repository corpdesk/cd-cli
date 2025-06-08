#!/bin/bash

# Define JSON file location
JSON_FILE="$(dirname "$0")/cd_obj.json"

# Redis connection details
REDIS_HOST="127.0.0.1"
REDIS_PORT="6379"

# Field mapping from database fields to camelCase application fields
declare -A FIELD_MAP=(
    ["cd_obj_id"]="cdObjId"
    ["cd_obj_guid"]="cdObjGuid"
    ["cd_obj_name"]="cdObjName"
    ["cd_obj_type_guid"]="cdObjTypeGuid"
    ["last_sync_date"]="lastSyncDate"
    ["last_modification_date"]="lastModificationDate"
    ["parent_module_guid"]="parentModuleGuid"
    ["parent_class_guid"]="parentClassGuid"
    ["parent_obj"]="parentObj"
    ["cd_obj_disp_name"]="cdObjDispName"
    ["doc_id"]="docId"
    ["show_name"]="showName"
    ["icon"]="icon"
    ["show_icon"]="showIcon"
    ["curr_val"]="currVal"
    ["cd_obj_enabled"]="cdObjEnabled"
    ["obj_guid"]="objGuid"
    ["icon_type"]="iconType"
    ["parent_module_id"]="parentModuleId"
    ["obj_id"]="objId"
    ["j_details"]="jDetails"
)

# Check if Redis is available
if ! redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping &>/dev/null; then
    echo "Error: Redis server is not running at $REDIS_HOST:$REDIS_PORT"
    exit 1
fi

# Read and process JSON data
jq -c '.[]' "$JSON_FILE" | while read -r obj; do
    # Extract GUID
    GUID=$(echo "$obj" | jq -r '.cd_obj_guid')
    [ -z "$GUID" ] || [ "$GUID" == "null" ] && continue  # Skip invalid GUIDs

    # Redis key
    REDIS_KEY="cd_obj:$GUID"

    # Check if key already exists in Redis
    EXISTS=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" EXISTS "$REDIS_KEY")
    if [ "$EXISTS" -eq 1 ]; then
        echo "Skipping $GUID - Already exists in Redis."
        continue
    fi

    # Extract cdObjName for indexing
    cdObjName=$(echo "$obj" | jq -r '.cd_obj_name // empty')

    # Convert JSON object to Redis-friendly format
    CMD="HSET $REDIS_KEY"
    for DB_FIELD in "${!FIELD_MAP[@]}"; do
        APP_FIELD=${FIELD_MAP[$DB_FIELD]}
        VALUE=$(echo "$obj" | jq -r ".${DB_FIELD} // empty")

        # Skip unmapped fields
        [ -z "$APP_FIELD" ] && continue

        # Convert "null" values to empty strings
        [ "$VALUE" == "null" ] && VALUE=""

        # Ensure jDetails is stored as a valid JSON array without enclosing quotes
        if [ "$APP_FIELD" == "jDetails" ]; then
            VALUE=$(echo "$VALUE" | jq -c . 2>/dev/null)  # Convert to JSON array
            if [ $? -ne 0 ]; then
                echo "Skipping invalid JSON for $REDIS_KEY"
                continue
            fi
            CMD+=" \"$APP_FIELD\" $VALUE"  # Store as JSON array (without quotes)
        else
            CMD+=" \"$APP_FIELD\" \"$VALUE\""
        fi
    done

    # Run HSET only if there are valid fields
    if [[ "$CMD" != "HSET $REDIS_KEY" ]]; then
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" $CMD
        echo "Stored: $REDIS_KEY"
    else
        echo "Skipping empty entry: $REDIS_KEY"
    fi

    # Store additional index for fast lookup by cdObjName
    if [ -n "$cdObjName" ]; then
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ZADD cd_obj_index 0 "$cdObjName:$GUID"
    fi

done

echo "JSON Data Import Completed!"
