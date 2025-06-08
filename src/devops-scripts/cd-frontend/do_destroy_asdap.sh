#!/bin/bash

# Ensure doctl is authenticated
export DIGITALOCEAN_ACCESS_TOKEN="$DO_ASDAP_TOKEN"

# DigitalOcean settings
DROPLET_NAME="asdap-droplet"
DOMAIN="asdap.africa"

# Step 1: Get Droplet ID
DROPLET_ID=$(doctl compute droplet list --format ID,Name --no-header | grep "$DROPLET_NAME" | awk '{print $1}')

if [ -z "$DROPLET_ID" ]; then
    echo "✅ Droplet '$DROPLET_NAME' does not exist. No action required."
    exit 0  # Exit gracefully
fi

echo "🛑 Droplet '$DROPLET_NAME' found with ID: $DROPLET_ID"

# Step 2: Get Public IP
PUBLIC_IP=$(doctl compute droplet get "$DROPLET_ID" --format PublicIPv4 --no-header)

# Step 3: Remove DNS Record (If Exists)
if [ -n "$PUBLIC_IP" ]; then
    echo "🔄 Checking for existing DNS records..."
    RECORD_ID=$(doctl compute domain records list "$DOMAIN" --format ID,Type,Name,Data --no-header | grep "A" | grep "@ " | awk '{print $1}')
    
    if [ -n "$RECORD_ID" ]; then
        echo "🗑️ Removing A record (ID: $RECORD_ID)..."
        doctl compute domain records delete "$DOMAIN" --record-id "$RECORD_ID" --force
        echo "✅ DNS record deleted!"
    else
        echo "ℹ️ No matching A record found for $DOMAIN."
    fi
else
    echo "ℹ️ No public IP found. Skipping DNS cleanup."
fi

# Step 4: Graceful Shutdown (If Running)
echo "⚠️ Gracefully shutting down droplet..."
doctl compute droplet-action shutdown "$DROPLET_ID" || echo "ℹ️ Droplet may already be off."

# Step 5: Destroy Droplet
echo "⚠️ Are you sure you want to destroy droplet '$DROPLET_NAME'? (y/n)"
read -r CONFIRM
if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "🔥 Destroying droplet..."
    doctl compute droplet delete "$DROPLET_ID" --force
    echo "✅ Droplet successfully destroyed!"
else
    echo "❌ Droplet deletion aborted."
fi
