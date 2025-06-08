#!/bin/bash

set -e  # Exit on error

DOMAIN="asdap.africa"
DOC_ROOT="/var/www/$DOMAIN"
CONF_FILE="/etc/apache2/sites-available/$DOMAIN.conf"

# Function to update DO_ASDAP_IP persistently in ~/.bashrc
update_ip() {
    local new_ip=$(curl -s ifconfig.me) # Fetch external IP dynamically

    if [[ -z "$new_ip" ]]; then
        echo "❌ Failed to fetch external IP."
        exit 1
    fi

    echo "🌍 Updating DO_ASDAP_IP in ~/.bashrc to $new_ip..."

    # Remove existing entry before adding a new one
    sed -i '/^export DO_ASDAP_IP=/d' ~/.bashrc

    # Append new value
    echo "export DO_ASDAP_IP=$new_ip" >> ~/.bashrc

    # Apply changes immediately
    export DO_ASDAP_IP="$new_ip"

    echo "✅ DO_ASDAP_IP updated to $new_ip"
}

# Ensure Apache is installed
if ! command -v apache2 &>/dev/null; then
    echo "🔧 Installing Apache..."
    sudo apt update && sudo apt install -y apache2
fi

# Ensure Certbot is installed
if ! command -v certbot &>/dev/null; then
    echo "🔧 Installing Certbot..."
    sudo apt update && sudo apt install -y certbot python3-certbot-apache
fi

# Set up Apache for the main domain
setup_main_domain() {
    echo "🚀 Setting up Apache virtual host for $DOMAIN..."

    sudo mkdir -p "$DOC_ROOT"
    echo "<h1>Welcome to $DOMAIN</h1>" | sudo tee "$DOC_ROOT/index.html"
    sudo chown -R www-data:www-data "$DOC_ROOT"

    sudo bash -c "cat > $CONF_FILE" <<EOF
<VirtualHost *:80>
    ServerName $DOMAIN
    DocumentRoot $DOC_ROOT

    <Directory $DOC_ROOT>
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog \${APACHE_LOG_DIR}/$DOMAIN-error.log
    CustomLog \${APACHE_LOG_DIR}/$DOMAIN-access.log combined
</VirtualHost>
EOF

    # Enable site and reload Apache
    sudo a2ensite "$DOMAIN"
    sudo systemctl reload apache2
    echo "✅ Apache configured for $DOMAIN."
}

# Function to enable SSL for the main domain
enable_ssl_main() {
    local ssl_conf_file="/etc/apache2/sites-available/$DOMAIN-le-ssl.conf"

    if [ -f "$ssl_conf_file" ]; then
        echo "✅ SSL is already set up for $DOMAIN."
        return
    fi

    echo "🔐 Enabling SSL for $DOMAIN..."
    sudo certbot --apache --non-interactive --agree-tos --redirect -m admin@$DOMAIN -d "$DOMAIN"
    echo "✅ SSL setup complete for $DOMAIN!"
}

# Update IP and setup domain
update_ip
setup_main_domain
enable_ssl_main

echo "✅ Main domain setup completed successfully!"
