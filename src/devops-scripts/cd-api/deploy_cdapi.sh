#!/bin/bash

set -e  # Exit on error

echo "📂 Setting up cd-api and cd-sio..."

API_DIR="/home/devops/cd-api"
SIO_DIR="/home/devops/cd-sio"
GIT_REPO="https://github.com/corpdesk/cd-api.git"

if [ "$(whoami)" != "devops" ]; then
    echo "⚠️ This script must be run as the 'devops' user. Exiting."
    exit 1
fi

# Ensure NVM is installed and sourced
export NVM_DIR="$HOME/.nvm"

if [ ! -d "$NVM_DIR" ]; then
    echo "📥 Installing NVM..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
fi

# Load NVM
if [ -s "$NVM_DIR/nvm.sh" ]; then
    source "$NVM_DIR/nvm.sh"
else
    echo "❌ Failed to load NVM. Exiting."
    exit 1
fi

# Install and use Node.js v18
echo "🔄 Ensuring Node.js is at version 18..."
nvm install 18
nvm use 18

echo "✅ Using Node.js $(node -v)"
echo "✅ Using npm $(npm -v)"

# Ensure TypeScript and ts-node are installed globally
echo "📦 Installing TypeScript and ts-node globally..."
npm install -g typescript ts-node

echo "✅ TypeScript version: $(tsc -v)"
echo "✅ ts-node version: $(ts-node -v)"

# Step 1: Update or clone repository
if [ -d "$API_DIR" ]; then
    echo "✅ cd-api directory exists."
    if [ -d "$API_DIR/.git" ]; then
        cd "$API_DIR"
        REMOTE_URL=$(git config --get remote.origin.url)
        if [ "$REMOTE_URL" == "$GIT_REPO" ]; then
            echo "🔄 Pulling latest changes..."
            git fetch --all
            git reset --hard origin/main
            git clean -fd
        else
            echo "⚠️ Directory is not connected to $GIT_REPO!"
            exit 1
        fi
    else
        echo "⚠️ cd-api exists but is not a Git repository!"
        exit 1
    fi
else
    echo "📥 Cloning cd-api repository..."
    git clone "$GIT_REPO" "$API_DIR"
fi

# Step 2: Install project dependencies
cd "$API_DIR"
echo "📦 Installing project dependencies..."
npm install --legacy-peer-deps

# Step 3: Ensure correct environment files are in place
echo "📂 Moving uploaded environment files..."
if [ -f "/home/devops/env_api.txt" ]; then
    mv "/home/devops/env_api.txt" "$API_DIR/.env"
    echo "✅ Moved env_api.txt to $API_DIR/.env"
else
    echo "⚠️ env_api.txt not found in /home/devops"
fi

if [ -f "/home/devops/env_sio.txt" ]; then
    mv "/home/devops/env_sio.txt" "$SIO_DIR/.env"
    echo "✅ Moved env_sio.txt to $SIO_DIR/.env"
else
    echo "⚠️ env_sio.txt not found in /home/devops"
fi

# Load environment variables
if [ -f "/home/devops/cd-api/.env" ]; then
    export $(grep -v '^#' /home/devops/cd-api/.env | xargs)
    echo "✅ Environment variables loaded."
else
    echo "⚠️ .env file not found! Exiting."
    exit 1
fi

# Ensure the SSL directory and key exist before updating permissions
# if sudo test -d "$SSL_DIR" && sudo test -f "$KEY_PATH"; then
    echo "🔍 Checking SSL file permissions..."
    
    # Debugging output to check ownership & permissions
    sudo ls -l "$SSL_DIR"
    sudo ls -l "/etc/letsencrypt/archive/$HOST_NAME/"

    # Fix ownership & permissions automatically
    echo "🔒 Adjusting SSL permissions..."
    sudo chown root:devops "$SSL_DIR/privkey.pem" "/etc/letsencrypt/archive/$HOST_NAME/privkey1.pem"
    sudo chmod 640 "$SSL_DIR/privkey.pem" "/etc/letsencrypt/archive/$HOST_NAME/privkey1.pem"

    # # ----------------------------------------------------------------
    # # Create group with root and devops as members
    # sudo addgroup nodecert
    # sudo adduser devops nodecert
    # sudo adduser root nodecert

    # # Make the relevant letsencrypt folders owned by said group.
    # sudo chgrp -R nodecert /etc/letsencrypt/live
    # sudo chgrp -R nodecert /etc/letsencrypt/archive

    # # Allow group to open relevant folders
    # sudo chmod -R 750 /etc/letsencrypt/live
    # sudo chmod -R 750 /etc/letsencrypt/archive

    # # ----------------------------------------------------------------

    # Re-check permissions after fix
    echo "✅ Updated SSL permissions:"
    sudo ls -l "$SSL_DIR"
    sudo ls -l "/etc/letsencrypt/archive/$HOST_NAME/"

# else
    # echo "⚠️ SSL directory or key not found: $KEY_PATH"
# fi

echo "✅ Continuing script execution..."


if [ -f "/home/devops/install_apps.sh" ]; then
    echo "🔍 Ensuring correct ownership and permissions for install_apps.sh..."
    
    # Fix ownership in case the file is not owned by devops
    sudo chown devops:devops /home/devops/install_apps.sh
    
    # Ensure the script is executable
    chmod +x /home/devops/install_apps.sh
    
    # Execute the script
    bash /home/devops/install_apps.sh
else
    echo "⚠️ install_apps.sh not found. Skipping app installation."
fi



# Step 4: Restart application
echo "🚀 Starting API server..."
npm start
