#!/bin/bash

# Ensure arguments are provided
if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
    echo "❌ Usage: $0 <domain> <project-name> <ngVersion>"
    exit 1
fi

DOMAIN=$1
PROJ_NAME=$2
PROJ_VERSION=$3  # Capture ngVersion
SITE_DIR="/var/www/$PROJ_NAME"
BRANCH="$PROJ_NAME-dist-$PROJ_VERSION"

sudo chown -R www-data:www-data $SITE_DIR
sudo chmod -R 755 $SITE_DIR
echo "Check permissions for $SITE_DIR"
sudo ls -l "$SITE_DIR/"

rm -f $SITE_DIR/.htaccess

# Navigate to a temporary directory
echo "\n----------------------------------------------------------------------------"
echo "Navigate to a temporary directory"
echo "----------------------------------------------------------------------------"
cd /tmp

# Clone the specified branch from the repository
echo "\n----------------------------------------------------------------------------"
echo "Clone the specified branch from the repository"
echo "----------------------------------------------------------------------------"
sudo mkdir -p /tmp/temp-site-$PROJ_NAME
sudo chown -R devops:devops /tmp/temp-site-$PROJ_NAME
git clone -b $BRANCH https://github.com/corpdesk/$PROJ_NAME-dist.git /tmp/temp-site-$PROJ_NAME
echo "cloned files:"
sudo ls -l /tmp/temp-site-$PROJ_NAME/

# Remove the old site files
echo "\n----------------------------------------------------------------------------"
echo "Remove the old site files from $SITE_DIR"
echo "----------------------------------------------------------------------------"
sudo rm -rf $SITE_DIR/*

# Copy the new site files
echo "\n----------------------------------------------------------------------------"
echo "Copy the new site files"
echo "----------------------------------------------------------------------------"
cp /home/devops/.htaccess $SITE_DIR/
sudo cp -r /tmp/temp-site-$PROJ_NAME/* $SITE_DIR/
echo "new content of site directory: $SITE_DIR"
sudo ls -l $SITE_DIR/
sudo chown -R www-data:www-data $SITE_DIR
sudo chmod -R 755 $SITE_DIR
sudo chmod 644 $SITE_DIR/.htaccess

# Clean up
echo "\n----------------------------------------------------------------------------"
echo "Clean up"
echo "----------------------------------------------------------------------------"
rm -rf /tmp/temp-site-$PROJ_NAME

echo "✅ Site updated to branch $BRANCH"
