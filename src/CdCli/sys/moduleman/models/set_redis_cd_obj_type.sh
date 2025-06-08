#!/bin/bash

# Define CSV file location (assumed to be in the same directory as this script)
CSV_FILE="$(dirname "$0")/cd_obj_type.csv"

# Redis host (modify if needed)
REDIS_HOST="127.0.0.1"
REDIS_PORT="6379"

# Define field mapping from database fields to camelCase application fields
declare -A FIELD_MAP=(
    ["cd_obj_type_id"]="cdObjTypeId"
    ["cd_obj_type_guid"]="cdObjTypeGuid"
    ["cd_obj_type_name"]="cdObjTypeName"
    ["doc_id"]="docId"
)

# Function to generate a UUID (if needed)
generate_uuid() {
    cat /proc/sys/kernel/random/uuid
}

# Function to check if Redis Search index exists, if not, create it
setup_redis_search() {
    local index_name="idx_cd_obj_type"
    local exists=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" INFO keyspace | grep "$index_name")
    
    if [ -z "$exists" ]; then
        echo "Creating Redis Search Index..."
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" FT.CREATE idx_cd_obj_type ON HASH PREFIX 1 "cd_obj_type:" \
            SCHEMA cdObjTypeId NUMERIC SORTABLE \
                   cdObjTypeGuid TAG SORTABLE \
                   cdObjTypeName TEXT SORTABLE \
                   docId NUMERIC SORTABLE
        echo "Redis Search Index Created."
    else
        echo "Redis Search Index already exists."
    fi
}

# Check if Redis is available
if ! redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping &>/dev/null; then
    echo "Error: Redis server is not running at $REDIS_HOST:$REDIS_PORT"
    exit 1
fi

# Setup Redis Search Index
setup_redis_search

# Read the CSV file line by line
{
    read -r HEADER_LINE  # Read the first line (header)
    IFS=',' read -ra HEADERS <<< "$HEADER_LINE"

    while IFS=',' read -ra ROW; do
        if [ "${#ROW[@]}" -eq 0 ]; then
            continue
        fi

        # Extract GUID
        GUID="${ROW[1]}"
        if [ -z "$GUID" ] || [ "$GUID" == "NULL" ]; then
            GUID=$(generate_uuid)
            echo "Generated new GUID: $GUID"
        fi

        # Redis key
        REDIS_KEY="cd_obj_type:$GUID"

        # Check if the key already exists in Redis
        EXISTS=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" EXISTS "$REDIS_KEY")
        if [ "$EXISTS" -eq 1 ]; then
            echo "Skipping $GUID - Already exists in Redis."
            continue  # Skip this entry if it already exists
        fi

        # Extract cdObjTypeName for indexing
        cdObjTypeName="${ROW[2]}"
        [[ "$cdObjTypeName" == "NULL" ]] && cdObjTypeName=""

        # Build Redis HSET command
        CMD="HSET $REDIS_KEY"
        for ((i=0; i<${#HEADERS[@]}; i++)); do
            DB_FIELD="${HEADERS[i]}"
            APP_FIELD="${FIELD_MAP[$DB_FIELD]}"
            VALUE="${ROW[i]}"
            [[ "$VALUE" == "NULL" ]] && VALUE=""  # Convert NULLs to empty strings

            # Append field-value pair to Redis command
            CMD+=" $APP_FIELD \"$VALUE\""
        done

        # Store in Redis
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" $CMD
        echo "Stored: $REDIS_KEY"

        # Store additional index for fast lookup by cdObjTypeName
        if [ -n "$cdObjTypeName" ]; then
            redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" SADD "cd_obj_type_index:$cdObjTypeName" "$GUID"
        fi

    done
} < "$CSV_FILE"

echo "CSV data successfully stored in Redis."
