#!/bin/bash

set -e  # Exit on error

echo "🔧 Setting up user 'devops' and installing dependencies..."

# Step 1: Create 'devops' user with a home directory
if ! id "devops" &>/dev/null; then
    echo "👤 Creating user 'devops'..."
    sudo useradd -m -s /bin/bash devops
    echo "devops:yU0B14NC1PdE" | sudo chpasswd
    echo "✅ User 'devops' created with default password."
else
    echo "✅ User 'devops' already exists."
fi

# Step 2: Ensure home directory has default files
echo "📂 Ensuring a proper home directory for 'devops'..."
sudo cp -r /etc/skel/. /home/devops/
sudo chown -R devops:devops /home/devops/

# Step 3: Grant sudo privileges without password
echo "🛠 Configuring sudo access for 'devops'..."
echo "devops ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/devops

# Step 4: Update system and install required packages
echo "📦 Updating system and installing dependencies..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y net-tools nodejs npm redis-server 

# Step 5: Install TypeScript globally
echo "⚙️ Installing TypeScript..."
sudo npm install -g typescript

# Step 6: Enable and start Redis (required for cd-sio)
echo "🛠 Configuring Redis..."
sudo systemctl enable redis-server
sudo systemctl start redis-server

echo "🚀 Setup complete! 'devops' user is ready."
