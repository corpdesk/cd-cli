#!/bin/bash

# Ensure arguments are provided
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "❌ Usage: $0 <domain> <project-name>"
    exit 1
fi

DOMAIN=$1
PROJ_NAME=$2
SITE_DIR="/var/www/$PROJ_NAME"

echo "🛠️ Updating remote application: $PROJ_NAME.$DOMAIN"

# Ensure the web root exists
if [[ ! -d "$SITE_DIR" ]]; then
    echo "📂 Creating site directory: $SITE_DIR"
    sudo mkdir -p "$SITE_DIR"
fi
sudo chown -R www-data:www-data "$SITE_DIR"
sudo chmod -R 755 "$SITE_DIR"

# Sync files from dist
rsync -avz --delete /home/devops/"$PROJ_NAME"-dist/ "$SITE_DIR"/

echo "🔄 Restarting Apache..."
sudo systemctl restart apache2

echo "✅ Update complete!"
