import { homedir } from 'os';
import path from 'path';
import prettier from 'prettier';
import fs, { access } from 'fs/promises';
import { formatterConfig } from '../base/IBase.js';

export const HOME = homedir();

/**
 * Finds the root directory of a project by searching for common root markers.
 * @param startDir (Optional) The directory to start searching from (defaults to __dirname).
 * @param maxDepth (Optional) Maximum levels to traverse up (defaults to 10).
 * @returns The root directory path, or null if not found.
 */
export async function getProjectRoot(
  startDir?: string,
  maxDepth: number = 10,
): Promise<string | null> {
  let currentDir = startDir ? path.resolve(startDir) : __dirname;
  let depth = 0;

  while (currentDir !== path.parse(currentDir).root && depth < maxDepth) {
    const markers = ['package.json', '.git', 'node_modules'];
    const checks = markers.map((marker) =>
      access(path.join(currentDir, marker))
        .then(() => true)
        .catch(() => false),
    );
    const results = await Promise.all(checks);
    if (results.some((valid) => valid)) return currentDir;
    currentDir = path.dirname(currentDir);
    depth++;
  }
  return null;
}

/**
 * Gets the parent directory of a given module path
 * @param modulePath The full path to a module file or directory
 * @returns The parent directory of the input path
 */
export function getParentDirectory(modulePath: string): string {
    // Normalize the path to handle different OS path separators
    const normalizedPath = path.normalize(modulePath);
    
    // Get the parent directory by going up one level
    return path.dirname(normalizedPath);
}

export function resolveUserPath(p: string): string {
  if (!p) return p;

  // Replace Unix-style home
  if (p.startsWith('~/')) {
    p = path.join(homedir(), p.slice(2));
  }

  // Replace env vars like $HOME or %USERPROFILE%
  p = p.replace(/\$HOME/g, homedir());
  p = p.replace(/%USERPROFILE%/gi, homedir());

  return path.resolve(p);
}

export function resolvePath(p: string): string {
  if (!p) return p;

  // Resolve user path first
  p = resolveUserPath(p);

  // Resolve relative paths
  if (!path.isAbsolute(p)) {
    p = path.resolve(process.cwd(), p);
  }

  return p;
}
export function resolvePathFromBase(p: string): string {
  if (!p) return p;

  // Resolve user path first
  p = resolveUserPath(p);

  // Resolve relative paths from the base directory
  if (!path.isAbsolute(p)) {
    p = path.resolve(import.meta.dirname, p);
  }

  return p;
}
export function resolvePathFromBaseToUser(p: string): string {
  if (!p) return p;

  // Resolve user path first
  p = resolveUserPath(p);

  // Resolve relative paths from the base directory to user home
  if (!path.isAbsolute(p)) {
    p = path.resolve(import.meta.dirname, p);
    p = path.resolve(homedir(), p);
  }

  return p;
}
export function resolvePathFromUser(p: string): string {
  if (!p) return p;

  // Resolve user path first
  p = resolveUserPath(p);

  // Resolve relative paths from the user home directory
  if (!path.isAbsolute(p)) {
    p = path.resolve(homedir(), p);
  }

  return p;
}
export function resolvePathFromUserToBase(p: string): string {
  if (!p) return p;

  // Resolve user path first
  p = resolveUserPath(p);

  // Resolve relative paths from the user home directory to the base directory
  if (!path.isAbsolute(p)) {
    p = path.resolve(homedir(), p);
    p = path.resolve(import.meta.dirname, p);
  }

  return p;
}

/**
 * Ensures the target directory exists and safely writes the file.
 * Skips write if file already exists.
 *
 * @param fullPath Absolute or relative file path (e.g., 'src/CdApi/app/coop/models/coop-member.model.ts')
 * @param content Text content to write into the file
 */
export async function writeFileSafely(fullPath: string, content: string): Promise<void> {
  const dir = path.dirname(fullPath);

  try {
    // Create directories recursively if they don't exist
    await fs.mkdir(dir, { recursive: true });

    // Check if file exists
    try {
      await fs.access(fullPath);
      console.warn(`⚠️ File already exists: ${fullPath}. Skipping write.`);
    } catch {
      // File doesn't exist; proceed with writing
      await fs.writeFile(fullPath, content, { encoding: 'utf-8' });
      console.log(`✅ File written: ${fullPath}`);
    }
  } catch (err) {
    console.error(`❌ Failed to write file: ${fullPath}`, err);
    throw err;
  }
}

/**
 * Formats content with Prettier and overwrites file even if it exists.
 *
 * @param fullPath Absolute or relative file path (e.g., 'src/CdApi/app/coop/models/coop-member.model.ts')
 * @param content Text content to format and write
 */
// export async function writePrettyFile(fullPath: string, content: string): Promise<void> {
//   const dir = path.dirname(fullPath);

//   try {
//     await fs.mkdir(dir, { recursive: true });

//     const formatted = await prettier.format(content, { parser: 'typescript' });

//     await fs.writeFile(fullPath, formatted, 'utf-8');
//     console.log(`✅ Pretty file written (overwrite): ${fullPath}`);
//   } catch (err) {
//     console.error(`❌ Failed to write pretty file: ${fullPath}`, err);
//     throw err;
//   }
// }
function getParserFromExtension(ext: string): prettier.BuiltInParserName {
  const entry = formatterConfig[ext];
  if (!entry) throw new Error(`Unsupported file extension: ${ext}`);
  return entry.parser;
}

export async function writePrettyFile(fullPath: string, content: string): Promise<void> {
  const ext = path.extname(fullPath);
  const parser = getParserFromExtension(ext);

  await fs.mkdir(path.dirname(fullPath), { recursive: true });

  const formatted = await prettier.format(content, { parser });
  await fs.writeFile(fullPath, formatted, 'utf-8');

  console.log(`✅ Pretty file written: ${fullPath}`);
}

export async function writePrettyFileSafely(path: string, content: string): Promise<void> {
  const formatted = await prettier.format(content, { parser: 'typescript' });
  await fs.writeFile(path, formatted, 'utf8');
}


