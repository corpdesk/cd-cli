#!/bin/bash

if [ -z "$1" ]; then
  echo "Please provide a branch name (ng-15 or ng-18)."
  exit 1
fi

PROJ_NAME="cd-shell"
BRANCH="$PROJ_NAME-dist-$1"
SITE_DIR="/var/www/asdap.africa"

sudo chown -R www-data:www-data $SITE_DIR
sudo chmod -R 755 $SITE_DIR
echo "Check permissions for $SITE_DIR"
sudo ls -l "/var/www/asdap.africa/"

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
git clone -b $BRANCH https://github.com/corpdesk/$PROJ_NAME-dist.git temp-site-$PROJ_NAME

# Remove the old site files
echo "\n----------------------------------------------------------------------------"
echo "Remove the old site files"
echo "----------------------------------------------------------------------------"
sudo rm -rf $SITE_DIR/*

# Copy the new site files
echo "\n----------------------------------------------------------------------------"
echo "Copy the new site files"
echo "----------------------------------------------------------------------------"
sudo cp -r temp-site-$PROJ_NAME/* $SITE_DIR/
sudo chown -R www-data:www-data $SITE_DIR
sudo chmod -R 755 $SITE_DIR

# Clean up
echo "\n----------------------------------------------------------------------------"
echo "Clean up"
echo "----------------------------------------------------------------------------"
rm -rf temp-site-$PROJ_NAME

echo "Site updated to branch $BRANCH"

cp /home/ubuntu/.htaccess $SITE_DIR/
chmod 644 $SITE_DIR/.htaccess
