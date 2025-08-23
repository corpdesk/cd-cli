/**
 * Converts a PascalCase or camelCase name to kebab-case filename format.
 * Optionally appends a suffix (e.g., "controller", "service") with `.js` extension.
 *
 * Example: CdAutoGit -> cd-auto-git.controller.js
 */
export function toDashedFileName(
  name: string,
  suffix = "",
  ext = ".js"
): string {
  const dashed = name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();

  return suffix ? `${dashed}.${suffix}${ext}` : `${dashed}${ext}`;
}
