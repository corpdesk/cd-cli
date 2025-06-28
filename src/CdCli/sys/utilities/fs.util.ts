import { homedir } from "os";
import path from "path";
import prettier from 'prettier';
import fs from 'fs/promises';

export const HOME = homedir();

export function resolveUserPath(p: string): string {
  if (!p) return p;

  // Replace Unix-style home
  if (p.startsWith("~/")) {
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

export async function writePrettyFileSafely(path: string, content: string): Promise<void> {
  const formatted = await prettier.format(content, { parser: 'typescript' });
  await fs.writeFile(path, formatted, 'utf8');
}
