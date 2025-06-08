#!/bin/bash

# How to Use the Script
# ---------------------------------------------
# Upload & Execute in /home/devops/ as devops
# bash scp_and_exec.sh --dest-dir /home/devops --user devops my_script.sh arg1 arg2

# Upload to /root/ & Execute as root (default behavior)
# bash scp_and_exec.sh my_script.sh arg1 arg2

# Run Multiple Scripts with Different Args
# bash scp_and_exec.sh --dest-dir /home/devops --user devops my_script1.sh argA argB -- my_script2.sh argX argY

# Upload Files Without Executing
# bash scp_and_exec.sh --dest-dir /home/devops --user devops --upload-only env_api.txt env_sio.txt config.ts
# ---------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ -z "$DO_ASDAP_IP" ]; then
    echo "❌ DO_ASDAP_IP is not set. Run do_init_asdap.sh first!"
    exit 1
fi

DEST_DIR="/root"  # Default destination directory
EXEC_USER="root"
UPLOAD_ONLY=false  # Flag to determine if files should only be uploaded

# Function to check if a string is a valid file
is_valid_file() {
    local filename="$1"

    # If it's explicitly mentioned after '--', treat it as an argument
    if [[ "$AFTER_SEPARATOR" == true ]]; then
        return 1  # Not a file
    fi

    # If the file exists in the script directory, it's a valid file
    if [[ -f "$SCRIPT_DIR/$filename" ]]; then
        return 0  # It's a file
    fi

    # If it has an extension (e.g., .sh, .txt), consider it a file
    if [[ "$filename" == *.* ]]; then
        return 0
    fi

    # Otherwise, treat it as an argument
    return 1
}

# Parse optional parameters
while [[ "$1" == "--dest-dir" || "$1" == "--user" || "$1" == "--upload-only" ]]; do
    case "$1" in
        --dest-dir)
            DEST_DIR="$2"
            shift 2
            ;;
        --user)
            EXEC_USER="$2"
            shift 2
            ;;
        --upload-only)
            UPLOAD_ONLY=true
            shift 1
            ;;
    esac
done

# Ensure at least one file is specified
if [ "$#" -lt 1 ]; then
    echo "❌ No files specified. Usage: $0 [--dest-dir /path] [--user username] [--upload-only] file1 file2 ..."
    exit 1
fi

# Track if we have reached the '--' separator
AFTER_SEPARATOR=false

# Process all arguments
for FILE in "$@"; do
    if [[ "$FILE" == "--" ]]; then
        AFTER_SEPARATOR=true
        continue  # Ignore '--' itself
    fi

    # Check if it's a valid file
    if is_valid_file "$FILE"; then
        LOCAL_PATH="$SCRIPT_DIR/$FILE"
        REMOTE_PATH="$DEST_DIR/$FILE"

        echo "📤 Uploading $FILE to droplet ($DO_ASDAP_IP:$DEST_DIR)..."
        scp -o StrictHostKeyChecking=no "$LOCAL_PATH" root@"$DO_ASDAP_IP":"$REMOTE_PATH"

        if [[ "$UPLOAD_ONLY" == false ]]; then
            echo "🚀 Executing $FILE as $EXEC_USER on droplet..."
            ssh -o StrictHostKeyChecking=no root@"$DO_ASDAP_IP" "chown $EXEC_USER:$EXEC_USER $REMOTE_PATH && chmod +x $REMOTE_PATH && sudo -u $EXEC_USER bash -c '$REMOTE_PATH ${@:2}'"
            echo "✅ Execution of $FILE completed!"
        else
            echo "✅ Upload of $FILE completed (no execution)."
        fi
    else
        echo "🔹 Treating $FILE as an argument (not a file)."
    fi
done

