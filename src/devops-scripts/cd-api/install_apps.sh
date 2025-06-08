#!/bin/bash

set -e  # Exit on error

declare -A APP_REPOS=(
    ["coops"]="https://github.com/corpdesk/coops.git"
    ["cd-geo"]="https://github.com/corpdesk/cd-geo.git"
)

# Directories to update
APP_DIRECTORIES=(
    "/home/devops/cd-api/src/CdApi/app"
    "/home/devops/cd-sio/src/CdApi/app"
)

for APPS_DIR in "${APP_DIRECTORIES[@]}"; do
    echo "📦 Installing/updating apps in $APPS_DIR..."

    # Ensure the apps directory exists
    mkdir -p "$APPS_DIR"

    cd "$APPS_DIR"

    for APP in "${!APP_REPOS[@]}"; do
        if [ -d "$APP/.git" ]; then
            echo "🔄 Updating $APP in $APPS_DIR..."
            cd "$APP"
            git pull origin main
            cd ..
        else
            echo "📥 Cloning $APP in $APPS_DIR..."
            git clone "${APP_REPOS[$APP]}" "$APP"
        fi
    done

    echo "✅ Apps updated in $APPS_DIR!"
done

echo "🚀 All apps installed/updated in both cd-api and cd-sio!"
