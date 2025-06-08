#!/bin/bash

# Create a droplet for asdap.africa and map existing asdap.africa to the droplet.

# DigitalOcean settings
PROJECT_NAME="asdap"
DROPLET_NAME="asdap-droplet"
REGION="sfo3"  # Updated to San Francisco Datacenter 3
SIZE="s-2vcpu-4gb"
IMAGE="ubuntu-22-04-x64"
SSH_KEYS=$(doctl compute ssh-key list --format ID --no-header | tr '\n' ',' | sed 's/,$//')

# Ensure doctl is authenticated
export DIGITALOCEAN_ACCESS_TOKEN="$DO_ASDAP_TOKEN"

# Step 1: Check if Droplet already exists
EXISTING_DROPLET_ID=$(doctl compute droplet list --format ID,Name --no-header | grep "$DROPLET_NAME" | awk '{print $1}')

if [ -n "$EXISTING_DROPLET_ID" ]; then
    echo "⚠️ Droplet '$DROPLET_NAME' already exists with ID: $EXISTING_DROPLET_ID. Skipping creation."
    DROPLET_ID=$EXISTING_DROPLET_ID
else
    echo "🚀 Creating droplet: $DROPLET_NAME in region $REGION..."
    DROPLET_ID=$(doctl compute droplet create "$DROPLET_NAME" \
        --region "$REGION" \
        --size "$SIZE" \
        --image "$IMAGE" \
        --ssh-keys "$SSH_KEYS" \
        --format ID --no-header --wait)

    if [ -z "$DROPLET_ID" ]; then
        echo "❌ Failed to create droplet."
        exit 1
    fi

    echo "✅ Droplet created successfully! ID: $DROPLET_ID"
fi

# Step 2: Find Project ID for "asdap"
PROJECT_ID=$(doctl projects list --format ID,Name --no-header | grep "$PROJECT_NAME" | awk '{print $1}')

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Project '$PROJECT_NAME' not found!"
    exit 1
fi

echo "📁 Project '$PROJECT_NAME' found! ID: $PROJECT_ID"

# Step 3: Assign Droplet to Project if not already assigned
ASSIGNED=$(doctl projects resources list "$PROJECT_ID" --no-header | grep "do:droplet:$DROPLET_ID" || true)
if [ -z "$ASSIGNED" ]; then
    echo "🔄 Assigning Droplet to project '$PROJECT_NAME'..."
    doctl projects resources assign "$PROJECT_ID" --resource "do:droplet:$DROPLET_ID"
    echo "✅ Droplet successfully assigned to project '$PROJECT_NAME'!"
else
    echo "✅ Droplet is already assigned to project '$PROJECT_NAME'."
fi

# Step 4: Fetch Droplet Public IP
echo "🌍 Fetching droplet public IP..."
PUBLIC_IP=$(doctl compute droplet get "$DROPLET_ID" --format PublicIPv4 --no-header)

if [ -z "$PUBLIC_IP" ]; then
    echo "❌ Failed to fetch droplet IP."
    exit 1
fi

echo "✅ Public IP assigned: $PUBLIC_IP"

# Step 5: Configure DNS for asdap.africa
DOMAIN="asdap.africa"

echo "🔄 Checking existing DNS records for $DOMAIN..."
EXISTING_RECORD=$(doctl compute domain records list "$DOMAIN" --format ID,Type,Name,Data --no-header | grep -w "A" | grep -w "@")

if [ -n "$EXISTING_RECORD" ]; then
    RECORD_ID=$(echo "$EXISTING_RECORD" | awk '{print $1}')
    CURRENT_IP=$(echo "$EXISTING_RECORD" | awk '{print $4}')
    
    if [ "$CURRENT_IP" == "$PUBLIC_IP" ]; then
        echo "✅ DNS already pointing to $PUBLIC_IP. No update needed."
    else
        echo "📝 Updating existing A record (ID: $RECORD_ID) from $CURRENT_IP to $PUBLIC_IP..."
        doctl compute domain records update "$DOMAIN" --record-id "$RECORD_ID" --record-data "$PUBLIC_IP"
        echo "✅ DNS updated!"
    fi
else
    echo "🆕 No existing A record found. Creating new A record..."
    doctl compute domain records create "$DOMAIN" --record-type "A" --record-name "@" --record-data "$PUBLIC_IP" --record-ttl 1800
    echo "✅ DNS created! Allow a few minutes for propagation."
fi

# Step 6: Verify DNS
echo "🔍 Verifying DNS resolution..."
sleep 10  # Give it a moment for propagation
RESOLVED_IP=$(dig +short "$DOMAIN")

if [ "$RESOLVED_IP" == "$PUBLIC_IP" ]; then
    echo "🚀 Setup complete! Your domain is now pointing to: $PUBLIC_IP"
else
    echo "⚠️ DNS propagation may take longer. Current resolved IP: $RESOLVED_IP"
fi

# Step 7: Save environment variables to .bashrc
echo "💾 Saving droplet details to .bashrc..."
echo "export DO_ASDAP_IP=$PUBLIC_IP" >> ~/.bashrc
echo "export DO_ASDAP_HOST_NAME=$DOMAIN" >> ~/.bashrc
echo "source ~/.bashrc" >> ~/.bashrc
echo "✅ Environment variables saved!"

# Step 8: Apply the environment variables immediately
source ~/.bashrc
echo "🌍 DO_ASDAP_IP: $DO_ASDAP_IP"
echo "🌍 DO_ASDAP_HOST_NAME: $DO_ASDAP_HOST_NAME"
