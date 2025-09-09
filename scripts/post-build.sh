# # #!/bin/bash

# # # Define source and destination base directories
# # SRC_DIR="src/CdCli/app/app-craft/workshop"
# # DIST_DIR="dist/CdCli/app/app-craft/workshop"
# # OUTPUT_DIR="dist/CdCli/app/app-craft/workshop/cd-api/output"

# # echo "🔧 Running post-build tasks..."

# # # Create destination directory if it doesn't exist
# # mkdir -p "$DIST_DIR"
# # mkdir -p "$OUTPUT_DIR"

# # # Copy ONLY .json files from all subdirectories (preserving structure)
# # find "$SRC_DIR" -name "*.json" | while read -r json_file; do
# #   # Get relative path
# #   rel_path="${json_file#$SRC_DIR/}"
# #   # Make sure the destination directory exists
# #   mkdir -p "$(dirname "$DIST_DIR/$rel_path")"
# #   # Copy the JSON file
# #   cp "$json_file" "$DIST_DIR/$rel_path"
# #   echo "✅ Copied: $rel_path"
# # done

# # echo "✅ Post-build tasks completed."

# #!/bin/bash

# # Define source and destination base directories
# SRC_DIR="src/CdCli/app/app-craft/workshop"
# DIST_DIR="dist/CdCli/app/app-craft/workshop"
# OUTPUT_DIR="dist/CdCli/app/app-craft/workshop/cd-api/output"
# CONFIG_SRC="src/configs"
# CONFIG_DIST="dist/configs"

# echo "🔧 Running post-build tasks..."

# # Create destination directories if they don't exist
# mkdir -p "$DIST_DIR"
# mkdir -p "$OUTPUT_DIR"
# mkdir -p "$CONFIG_DIST"

# # Copy ONLY .json files from all subdirectories in the workshop directory (preserving structure)
# find "$SRC_DIR" -name "*.json" | while read -r json_file; do
#   # Get relative path
#   rel_path="${json_file#$SRC_DIR/}"
#   # Make sure the destination directory exists
#   mkdir -p "$(dirname "$DIST_DIR/$rel_path")"
#   # Copy the JSON file
#   cp "$json_file" "$DIST_DIR/$rel_path"
#   echo "✅ Copied: $rel_path"
# done

# # Copy entire config directory to dist/config
# cp -r "$CONFIG_SRC/." "$CONFIG_DIST"
# echo "✅ Copied config directory to dist/config"

# echo "✅ Post-build tasks completed."

#!/bin/bash
# post-build.sh

# Define source and destination base directories
SRC_DIR="src/CdCli/app/app-craft/workshop"
DIST_DIR="dist/CdCli/app/app-craft/workshop"
OUTPUT_DIR="$DIST_DIR/cd-api/output"
CONFIG_SRC="src/configs"
CONFIG_DIST="dist/configs"

# Template source and destination
TEMPLATE_SRC="$SRC_DIR/cd-module/template/abcd"
TEMPLATE_DIST="$DIST_DIR/cd-module/template/abcd"

echo "🔧 Running post-build tasks..."

# Create destination directories if they don't exist
mkdir -p "$DIST_DIR"
mkdir -p "$OUTPUT_DIR"
mkdir -p "$CONFIG_DIST"

# Copy ONLY .json files from all subdirectories in the workshop directory (preserving structure)
find "$SRC_DIR" -name "*.json" | while read -r json_file; do
  # Get relative path
  rel_path="${json_file#$SRC_DIR/}"
  # Make sure the destination directory exists
  mkdir -p "$(dirname "$DIST_DIR/$rel_path")"
  # Copy the JSON file
  cp "$json_file" "$DIST_DIR/$rel_path"
  echo "✅ Copied: $rel_path"
done

# Copy entire config directory to dist/config
cp -r "$CONFIG_SRC/." "$CONFIG_DIST"
echo "✅ Copied config directory to dist/config"

# Overwrite template (restore original TS files)
rm -rf "$TEMPLATE_DIST"
cp -r "$TEMPLATE_SRC" "$TEMPLATE_DIST"
echo "✅ Restored template directory: $TEMPLATE_DIST"

echo "🎉 Post-build tasks completed."


