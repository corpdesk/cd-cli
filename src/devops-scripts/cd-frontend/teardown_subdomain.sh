#!/bin/bash

set -e  # Exit on error

# Ensure a subdomain is provided
if [[ -z "$1" ]]; then
    echo "❌ No subdomain provided. Usage: $0 <subdomain>"
    exit 1
fi

SUBDOMAIN=$1
DOMAIN="asdap.africa"
WEB_ROOT="/var/www/$SUBDOMAIN"
APACHE_CONFIG_PATH="/etc/apache2/sites-available"
APACHE_AVAILABLE="$APACHE_CONFIG_PATH/$SUBDOMAIN.conf"
APACHE_SSL_AVAILABLE="$APACHE_CONFIG_PATH/${SUBDOMAIN}-ssl.conf"

echo "🗑️ Removing subdomain: $SUBDOMAIN.$DOMAIN"

# Step 1: Disable Apache sites
if [[ -f "$APACHE_AVAILABLE" ]]; then
    echo "🔽 Disabling Apache HTTP site..."
    sudo a2dissite "$SUBDOMAIN.conf"
fi

if [[ -f "$APACHE_SSL_AVAILABLE" ]]; then
    echo "🔽 Disabling Apache SSL site..."
    sudo a2dissite "$SUBDOMAIN-ssl.conf"
fi

# Step 2: Remove Apache config files
echo "🗑️ Removing Apache configuration files..."
sudo rm -f "$APACHE_AVAILABLE" "$APACHE_SSL_AVAILABLE"

# Step 3: Remove the web directory
if [[ -d "$WEB_ROOT" ]]; then
    echo "🗑️ Removing web directory..."
    sudo rm -rf "$WEB_ROOT"
fi

# Step 4: Reload Apache
echo "🔄 Reloading Apache..."
sudo systemctl reload apache2

echo "✅ Subdomain $SUBDOMAIN.$DOMAIN has been removed!"
