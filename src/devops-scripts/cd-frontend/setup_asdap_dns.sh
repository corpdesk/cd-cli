#!/bin/bash

set -e  # Exit on error

# Ensure required environment variables are set
if [[ -z "$DO_ASDAP_TOKEN" ]]; then
    echo "❌ DO_ASDAP_TOKEN is not set. Export it before running this script."
    exit 1
fi

if [[ -z "$DO_ASDAP_IP" ]]; then
    echo "❌ DO_ASDAP_IP is not set. Ensure the droplet is created and its IP is stored."
    exit 1
fi

if [[ -z "$DO_ASDAP_HOST_NAME" ]]; then
    echo "❌ DO_ASDAP_HOST_NAME is not set."
    exit 1
fi

# Set domain and subdomains
DOMAIN="$DO_ASDAP_HOST_NAME"
SUBDOMAINS=("cd-user" "cd-moduleman" "cd-comm" "coops")

# Authenticate `doctl` using the saved DigitalOcean token
export DIGITALOCEAN_ACCESS_TOKEN="$DO_ASDAP_TOKEN"

# Function to get the record ID of a subdomain
get_dns_record_id() {
    local subdomain="$1"
    doctl compute domain records list "$DOMAIN" --format ID,Type,Name,Data --no-header | awk -v subdomain_name="$subdomain" '$3 == subdomain_name {print $1}' | head -n 1
}

# Function to delete a DNS record (Only for subdomains)
delete_dns_record() {
    local subdomain="$1"
    local record_id
    record_id=$(get_dns_record_id "$subdomain")

    if [[ -n "$record_id" ]]; then
        echo "🗑️ Deleting existing DNS record for $subdomain (ID: $record_id)..."
        doctl compute domain records delete "$DOMAIN" "$record_id" --force
    fi
}

# Function to create a new A record
create_dns_record() {
    local subdomain="$1"
    echo "🚀 Creating DNS record for $subdomain pointing to $DO_ASDAP_IP..."
    doctl compute domain records create "$DOMAIN" --record-type A --record-name "$subdomain" --record-data "$DO_ASDAP_IP" --record-ttl 300
}

# Process subdomains
for sub in "${SUBDOMAINS[@]}"; do
    delete_dns_record "$sub"
    create_dns_record "$sub"
done

# Handle root domain (@)
root_record_id=$(get_dns_record_id "@")
if [[ -n "$root_record_id" ]]; then
    echo "🔄 Updating A record for root domain ($DOMAIN) to $DO_ASDAP_IP..."
    doctl compute domain records update "$DOMAIN" --record-id "$root_record_id" --record-name "@" --record-type A --record-data "$DO_ASDAP_IP"
else
    echo "🚀 Creating A record for root domain ($DOMAIN) pointing to $DO_ASDAP_IP..."
    doctl compute domain records create "$DOMAIN" --record-type A --record-name "@" --record-data "$DO_ASDAP_IP" --record-ttl 300
fi

echo "✅ DNS records updated successfully for $DOMAIN."
