#!/bin/bash

# NOTES:

set -e  # Exit immediately if a command exits with a non-zero status

# Update package list
sudo apt update

# Install required packages
sudo apt install -y git jq apache2 certbot python3-certbot-apache

# Enable Apache modules
sudo a2enmod rewrite ssl headers

# Restart Apache to apply changes
sudo systemctl restart apache2

# Verify installations
if command -v git &>/dev/null && command -v apache2ctl &>/dev/null && command -v certbot &>/dev/null; then
    echo "✅ Installation successful: Git, Apache, and Certbot are installed."
else
    echo "❌ Installation failed. Please check the logs."
    exit 1
fi
