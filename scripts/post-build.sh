#!/bin/bash

# Define source and destination base directories
SRC_DIR="src/CdCli/app/mod-craft/workshop"
DIST_DIR="dist/CdCli/app/mod-craft/workshop"
OUTPUT_DIR="dist/CdCli/app/mod-craft/workshop/cd-api/output"

echo "🔧 Running post-build tasks..."

# Create destination directory if it doesn't exist
mkdir -p "$DIST_DIR"
mkdir -p "$OUTPUT_DIR"

# Copy ONLY .json files from all subdirectories (preserving structure)
find "$SRC_DIR" -name "*.json" | while read -r json_file; do
  # Get relative path
  rel_path="${json_file#$SRC_DIR/}"
  # Make sure the destination directory exists
  mkdir -p "$(dirname "$DIST_DIR/$rel_path")"
  # Copy the JSON file
  cp "$json_file" "$DIST_DIR/$rel_path"
  echo "✅ Copied: $rel_path"
done

echo "✅ Post-build tasks completed."
