#!/bin/bash

# This script regenerates the index.ts file by exporting all .ts files from subdirectories.

MODULE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INDEX_FILE="$MODULE_DIR/index.ts"

echo "// Auto-generated index.ts" > "$INDEX_FILE"
echo "// Do not edit manually. Run generate-index.sh to regenerate." >> "$INDEX_FILE"
echo "" >> "$INDEX_FILE"

# Find all .ts files excluding index.ts and *.spec.ts
find "$MODULE_DIR" -type f -name "*.ts" ! -name "index.ts" ! -name "*.spec.ts" | while read file; do
  # Convert absolute path to relative module path
  relPath="${file#$MODULE_DIR/}"        # Remove root prefix
  importPath="${relPath%.ts}"           # Remove .ts extension
  importPath="${importPath//\\/\/}"     # Convert Windows-style backslashes to forward slashes (if any)

  echo "export * from './$importPath';" >> "$INDEX_FILE"
done

# Final newline
echo "" >> "$INDEX_FILE"

echo "✅ index.ts has been regenerated at $INDEX_FILE"
