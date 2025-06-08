#!/bin/bash

# Variables
ORG=$1          # Git organization or username
REPO_NAME=$2    # Repository name
BASE_DIR=${3:-$HOME} # Base directory, default to home directory

# Target Directory
TARGET_DIR="$BASE_DIR/$REPO_NAME"

# Create directory if it doesn't exist
mkdir -p "$TARGET_DIR"

# Change to the target directory
cd "$TARGET_DIR" || exit 1

# Initialize Git repository
echo "# $REPO_NAME" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main

# Add remote origin and push to GitHub
git remote add origin "https://github.com/$ORG/$REPO_NAME.git"
git push -u origin main
