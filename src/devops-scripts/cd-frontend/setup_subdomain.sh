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
APACHE_ENABLED="/etc/apache2/sites-enabled/$SUBDOMAIN.conf"
HTACCESS_FILE="$WEB_ROOT/.htaccess"

echo "🔧 Setting up subdomain: $SUBDOMAIN.$DOMAIN"

# Step 1: Create the web root directory
if [[ ! -d "$WEB_ROOT" ]]; then
    echo "📂 Creating web root: $WEB_ROOT"
    sudo mkdir -p "$WEB_ROOT"
fi
sudo chown -R www-data:www-data "$WEB_ROOT"
sudo chmod -R 755 "$WEB_ROOT"

# Step 2: Create/update .htaccess with CORS fix
echo "🛠️ Setting up .htaccess for CORS support..."
sudo tee "$HTACCESS_FILE" > /dev/null <<EOF
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, OPTIONS"
    Header set Access-Control-Allow-Headers "Origin, Content-Type, Accept"
</IfModule>
EOF
sudo chown www-data:www-data "$HTACCESS_FILE"
sudo chmod 644 "$HTACCESS_FILE"

# Step 3: Create/update Apache virtual host for HTTP (port 80)
echo "📝 Creating Apache configuration: $APACHE_AVAILABLE"
sudo tee "$APACHE_AVAILABLE" > /dev/null <<EOF
<VirtualHost *:80>
    ServerName $SUBDOMAIN.$DOMAIN
    DocumentRoot $WEB_ROOT

    <Directory $WEB_ROOT>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog \${APACHE_LOG_DIR}/$SUBDOMAIN-error.log
    CustomLog \${APACHE_LOG_DIR}/$SUBDOMAIN-access.log combined

    # Redirect HTTP to HTTPS
    RewriteEngine on
    RewriteCond %{SERVER_NAME} =$SUBDOMAIN.$DOMAIN
    RewriteRule ^ https://%{SERVER_NAME}%{REQUEST_URI} [END,NE,R=permanent]
</VirtualHost>
EOF

# Step 4: Enable the HTTP site
echo "🌐 Enabling HTTP site..."
sudo a2ensite "$SUBDOMAIN.conf"

# Step 5: Obtain or renew the SSL certificate
if ! sudo certbot certificates | grep -q "Certificate Name: $SUBDOMAIN.$DOMAIN"; then
    echo "🔐 Obtaining SSL certificate for $SUBDOMAIN.$DOMAIN..."
    sudo certbot certonly --webroot -w "$WEB_ROOT" -d "$SUBDOMAIN.$DOMAIN" --non-interactive --agree-tos --email admin@$DOMAIN
else
    echo "🔄 Renewing SSL certificate for $SUBDOMAIN.$DOMAIN..."
    sudo certbot renew --quiet
fi

# Step 6: Create/update Apache virtual host for HTTPS (port 443)
echo "📝 Creating SSL Apache configuration: $APACHE_SSL_AVAILABLE"
sudo tee "$APACHE_SSL_AVAILABLE" > /dev/null <<EOF
<VirtualHost *:443>
    ServerName $SUBDOMAIN.$DOMAIN
    DocumentRoot $WEB_ROOT

    <Directory $WEB_ROOT>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog \${APACHE_LOG_DIR}/$SUBDOMAIN-error.log
    CustomLog \${APACHE_LOG_DIR}/$SUBDOMAIN-access.log combined

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/$SUBDOMAIN.$DOMAIN/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/$SUBDOMAIN.$DOMAIN/privkey.pem
</VirtualHost>
EOF

# Step 7: Enable the HTTPS site and reload Apache
echo "🌍 Enabling SSL site..."
sudo a2ensite "$SUBDOMAIN-ssl.conf"
sudo systemctl reload apache2

# Step 8: Test CORS Configuration
echo "🧪 Testing CORS configuration..."
TEST_RESULT=$(curl -s -o /dev/null -w "%{http_code}" -I -H "Origin: https://asdap.africa" "https://$SUBDOMAIN.$DOMAIN/remoteEntry.js")

if [[ "$TEST_RESULT" == "200" ]]; then
    echo "✅ CORS Test Passed for $SUBDOMAIN.$DOMAIN"
else
    echo "❌ CORS Test Failed for $SUBDOMAIN.$DOMAIN (Response: $TEST_RESULT)"
    exit 1
fi

echo "🎉 Subdomain $SUBDOMAIN.$DOMAIN setup complete!"
