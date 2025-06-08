#!/bin/bash

set -e  # Exit on error

DOMAIN="asdap.africa"
SUBDOMAINS=("cd-user" "cd-moduleman" "cd-comm" "coops")

# Function to check if DNS resolves correctly
check_dns_resolution() {
    local subdomain="$1.$DOMAIN"
    local resolved_ip=$(dig +short "$subdomain")

    if [[ -n "$resolved_ip" ]]; then
        echo "✅ DNS for $subdomain is resolving correctly ($resolved_ip)."
        return 0
    else
        echo "❌ DNS for $subdomain is not resolving yet."
        return 1
    fi
}

# Function to set up Apache virtual host for subdomains
setup_apache() {
    local subdomain="$1.$DOMAIN"
    local doc_root="/var/www/$subdomain"
    local conf_file="/etc/apache2/sites-available/$subdomain.conf"

    # Skip if already configured
    if [ -f "$conf_file" ]; then
        echo "✅ Apache config already exists for $subdomain."
        return
    fi

    echo "🚀 Setting up Apache virtual host for $subdomain..."
    sudo mkdir -p "$doc_root"
    echo "<h1>Welcome to $subdomain</h1>" | sudo tee "$doc_root/index.html"
    sudo chown -R www-data:www-data "$doc_root"

    sudo bash -c "cat > $conf_file" <<EOF
<VirtualHost *:80>
    ServerName $subdomain
    DocumentRoot $doc_root

    <Directory $doc_root>
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog \${APACHE_LOG_DIR}/$subdomain-error.log
    CustomLog \${APACHE_LOG_DIR}/$subdomain-access.log combined
</VirtualHost>
EOF

    # Enable site and reload Apache
    sudo a2ensite "$subdomain"
    sudo systemctl reload apache2
    echo "✅ Apache configured for $subdomain."
}

# Function to enable SSL for subdomains
enable_ssl() {
    local subdomain="$1.$DOMAIN"
    local ssl_conf_file="/etc/apache2/sites-available/$subdomain-le-ssl.conf"

    if [ -f "$ssl_conf_file" ]; then
        echo "✅ SSL is already set up for $subdomain."
        return
    fi

    echo "🔐 Enabling SSL for $subdomain..."
    sudo certbot --apache --non-interactive --agree-tos --redirect -m admin@$DOMAIN -d "$subdomain"
    echo "✅ SSL setup complete for $subdomain!"
}

# Step 1: Loop through subdomains
for SUB in "${SUBDOMAINS[@]}"; do
    echo "🔎 Checking DNS for $SUB.$DOMAIN..."
    until check_dns_resolution "$SUB"; do
        echo "⏳ Waiting for DNS to propagate for $SUB.$DOMAIN..."
        sleep 30
    done

    setup_apache "$SUB"
    enable_ssl "$SUB"
done

echo "✅ All subdomains configured successfully!"
