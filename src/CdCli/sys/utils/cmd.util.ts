import { exec } from 'child_process';
import { promisify } from 'util';
import { CdErrorRecognition, CdFxReturn, CdFxStateLevel } from '../base/i-base.js';

const execAsync = promisify(exec);

/**
 * A simple shell utility object to manage current working directory context.
 */
export const $ = {
  cwd: process.cwd(),
};

/**
 * Executes a shell command in the context of current working directory.
 * Optionally, overrides the working directory.
 *
 * @param cmd Shell command to run
 * @param cwdOverride Optional path to run the command in
 * @returns Resolves to stdout string or throws on error with stderr and code
 */
// export async function run(cmd: string, cwdOverride?: string): Promise<string> {
//   const cwdToUse = cwdOverride || $.cwd;

//   try {
//     const { stdout, stderr } = await execAsync(cmd, { cwd: cwdToUse });

//     if (stderr && stderr.trim()) {
//       console.warn(`[cmd.util] Stderr from "${cmd}":`, stderr.trim());
//     }

//     return stdout.trim();
//   } catch (error: any) {
//     const err = new Error(`[cmd.util] Failed: ${cmd}`);
//     (err as any).stderr = error.stderr;
//     (err as any).code = error.code;
//     throw err;
//   }
// }
export async function run(cmd: string, cwdOverride?: string): Promise<string> {
  const cwdToUse = cwdOverride || $.cwd;

  try {
    const { stdout, stderr } = await execAsync(cmd, { cwd: cwdToUse });

    if (stderr && stderr.trim()) {
      console.warn(`[cmd.util] Stderr from "${cmd}":`, stderr.trim());
    }

    return stdout.trim();
  } catch (error: any) {
    const fullMessage = [
      `[cmd.util] Failed: ${cmd}`,
      error.stderr?.trim() ? `\n\n${error.stderr.trim()}` : '',
    ].join('');

    const err = new Error(fullMessage);
    (err as any).stderr = error.stderr;
    (err as any).code = error.code;
    throw err;
  }
}

export async function run2(cmd: string, cwdOverride?: string): Promise<string> {
  const cwdToUse = cwdOverride || process.cwd();

  try {
    const { stdout, stderr } = await execAsync(cmd, {
      cwd: cwdToUse,
      shell: '/bin/bash', // Ensures bash shell with env expansion
      env: {
        ...process.env, // Preserve current env
        PATH: process.env.PATH || '', // Ensure PATH exists
        HOME: process.env.HOME || '', // Required for expansion if used in child processes
      },
    });

    if (stderr && stderr.trim()) {
      console.warn(`[cmd.util] Stderr from "${cmd}":`, stderr.trim());
    }

    return stdout.trim();
  } catch (error: any) {
    const fullMessage = [
      `[cmd.util] Failed: ${cmd}`,
      error.stderr?.trim() ? `\n\n${error.stderr.trim()}` : '',
    ].join('');

    const err = new Error(fullMessage);
    (err as any).stderr = error.stderr;
    (err as any).code = error.code;
    throw err;
  }
}

export async function runExt<T>(
  cmd: string,
  cwd: string,
  options?: {
    knownErrors?: CdErrorRecognition[];
  },
): Promise<CdFxReturn<T>> {
  try {
    const output = await exec(cmd, { cwd });
    return {
      state: CdFxStateLevel.Success,
      message: 'Command executed successfully.',
      data: output.stdout as any,
    };
  } catch (err: any) {
    const errOutput = `${err.message || ''}\n${err.stderr || ''}`;
    const knownMatch = options?.knownErrors?.find((e) =>
      typeof e.pattern === 'string' ? errOutput.includes(e.pattern) : e.pattern.test(errOutput),
    );

    if (knownMatch) {
      return {
        state: knownMatch.state,
        message: knownMatch.message || knownMatch.pattern.toString(),
        data: null,
      };
    }

    // If not matched
    return {
      state: CdFxStateLevel.Error,
      message: `Unknown error: ${errOutput}`,
      data: null,
    };
  }
}

/**
 * Executes a shell command and returns the result.
 * This is a wrapper around the `run` function to provide a more convenient interface.
 *
 * @param cmd The command to execute
 * @param cwdOverride Optional override for the current working directory
 * @returns A promise that resolves with the command output
 */
export async function executeCommand(cmd: string, cwdOverride?: string): Promise<string> {
  try {
    const result = await run(cmd, cwdOverride);
    return result;
  } catch (error: any) {
    console.error(`[cmd.util] Error executing command "${cmd}":`, error);
    throw error;
  }
}

export function executeCommand2(cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, { env: process.env }, (error, stdout, stderr) => {
      if (error) {
        console.log(`❌ ERROR: ${stderr}`);
        return reject(new Error(stderr || error.message));
      }
      resolve(stdout);
    });
  });
}
/**
 * Executes a shell command and returns the result.
 * This is a wrapper around the `run` function to provide a more convenient interface.
 *
 * @param cmd The command to execute
 * @param cwdOverride Optional override for the current working directory
 * @returns A promise that resolves with the command output
 */
export async function execute(cmd: string, cwdOverride?: string): Promise<string> {
  try {
    const result = await run(cmd, cwdOverride);
    return result;
  } catch (error: any) {
    console.error(`[cmd.util] Error executing command "${cmd}":`, error);
    throw error;
  }
}
// ///////////////////////////////////////////////////////////

// import { exec } from "child_process";
// import { promisify } from "util";

// const execAsync = promisify(exec);

// /**
//  * A simple shell utility object to manage current working directory context.
//  */
// export const $ = {
//   cwd: process.cwd()
// };

// /**
//  * Executes a shell command in the context of current working directory.
//  * Optionally, overrides the working directory.
//  *
//  * @param cmd Shell command to run
//  * @param cwdOverride Optional path to run the command in
//  * @param fullOutput Optional flag to return full stdout/stderr object
//  * @returns Resolves to stdout string, or { stdout, stderr } if fullOutput is true
//  */
// export async function run(
//   cmd: string,
//   cwdOverride?: string,
//   fullOutput: boolean = false
// ): Promise<string | { stdout: string; stderr: string }> {
//   const cwdToUse = cwdOverride || $.cwd;

//   try {
//     const { stdout, stderr } = await execAsync(cmd, { cwd: cwdToUse });

//     if (stderr?.trim()) {
//       console.warn(`[cmd.util] Stderr from "${cmd}":`, stderr.trim());
//     }

//     return fullOutput ? { stdout: stdout.trim(), stderr: stderr.trim() } : stdout.trim();
//   } catch (error: any) {
//     const err = new Error(`[cmd.util] Failed: ${cmd}`);
//     (err as any).stderr = error.stderr;
//     (err as any).code = error.code;
//     throw err;
//   }
// }

// /**
//  * Executes a shell command and returns the result.
//  *
//  * @param cmd The command to execute
//  * @param cwdOverride Optional override for the current working directory
//  * @param fullOutput Optional flag to include stderr
//  * @returns A promise that resolves with stdout or { stdout, stderr }
//  */
// export async function executeCommand(
//   cmd: string,
//   cwdOverride?: string,
//   fullOutput: boolean = false
// ): Promise<string | { stdout: string; stderr: string }> {
//   try {
//     return await run(cmd, cwdOverride, fullOutput);
//   } catch (error: any) {
//     console.error(`[cmd.util] Error executing command "${cmd}":`, error);
//     throw error;
//   }
// }

// /**
//  * Alias for `executeCommand()` to maintain legacy support.
//  */
// export const execute = executeCommand;
