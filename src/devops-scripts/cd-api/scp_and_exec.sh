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

# Upload files
for FILE in "$@"; do
    LOCAL_PATH="$SCRIPT_DIR/$FILE"
    REMOTE_PATH="$DEST_DIR/$FILE"

    if [[ ! -f "$LOCAL_PATH" ]]; then
        echo "❌ File $FILE not found in $SCRIPT_DIR. Skipping..."
    else
        echo "📤 Uploading $FILE to droplet ($DO_ASDAP_IP:$DEST_DIR)..."
        scp -o StrictHostKeyChecking=no "$LOCAL_PATH" root@"$DO_ASDAP_IP":"$REMOTE_PATH"

        if [[ "$UPLOAD_ONLY" == false ]]; then
            echo "🚀 Executing $FILE as $EXEC_USER on droplet..."
            ssh -o StrictHostKeyChecking=no root@"$DO_ASDAP_IP" "chown $EXEC_USER:$EXEC_USER $REMOTE_PATH && chmod +x $REMOTE_PATH && sudo -u $EXEC_USER bash -c '$REMOTE_PATH'"
            echo "✅ Execution of $FILE completed!"
        else
            echo "✅ Upload of $FILE completed (no execution)."
        fi
    fi
done
