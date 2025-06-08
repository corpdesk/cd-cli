import { getSubcommand } from './utils/command-utils.js';
import repl from 'node:repl';
import chalk from 'chalk';
import minimist from 'minimist';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import { CdAiController } from '../../../app/cd-ai/controllers/cd-ai.controller.js';

// let chalk: any;

// Branding utility for reusable prompt designs
export const Branding = {
  getPrompt: (mode: 'default' | 'py' | 'js' = 'default') => {
    const branding = {
      cd: chalk.bgHex('#FF6A00').white.bold('cd'), // Orange background, white text
      separator: chalk.white(''), // White separator
    };

    const modes = {
      default: chalk.bgGray.black.bold(' dev '), // Gray background, black text
      py: chalk.bgBlue.white.bold(' py '), // Blue background, white text
      js: chalk.bgYellow.black.bold(' js '), // Yellow background, black text
    };

    const modeLabel = modes[mode] || modes.default;
    return `${branding.cd}${branding.separator}${modeLabel} ${chalk.greenBright('>')} `;
  },
};

// Main Development Mode Commands
// 👇 Internal buffer to accumulate multi-line or compound command input.
let inputBuffer: string = '';
let isCommandIncomplete = false;

export const DEV_MODE_COMMANDS = {
  name: 'dev',
  description: 'Enter development mode to manage applications.',
  action: {
    execute: async () => {
      console.log(chalk.green('[dev-mode] Entering development mode...'));

      // 👇 Initialize AI services required during development runtime.
      await CdAiController.initAiRuntime();

      // 👇 Tracks the current language mode for REPL prompt customization.
      let currentMode: 'default' | 'py' | 'js' = 'default';

      // 👇 Start a REPL session for developer interaction.
      const replServer = repl.start({
        prompt: Branding.getPrompt(currentMode), // Show context-aware prompt.
        eval: async (input, context, filename, callback) => {
          try {
            CdLog.debug(`DevMode::eval()/input:${input}`);
            input = input.trim();
            inputBuffer += input;

            const hasDelimiterAtEnd = inputBuffer.endsWith(';');

            const lastPart = inputBuffer.split(';').pop();
            const hasTextAfterLastDelimiter =
              lastPart && lastPart.trim().length > 0;

            // 👇 Support for multi-line or compound commands. Await final delimiter before executing.
            if (!hasDelimiterAtEnd || hasTextAfterLastDelimiter) {
              callback(null, '...'); // Continue input on next line
              return;
            }

            // 👇 Once full command input is captured, split and execute each part.
            const commands = inputBuffer.split(';').filter((cmd) => cmd.trim());
            inputBuffer = '';

            const executionResults = await Promise.all(
              commands.map((cmd) => handleInput(`${cmd.trim()};`)),
            );

            callback(null, `✅ Executed ${commands.length} commands.`);
            replServer.displayPrompt();
          } catch (err) {
            callback(
              err instanceof Error ? err : new Error(String(err)),
              undefined,
            );
            replServer.displayPrompt();
          }
        },
      });

      // 👇 Dynamically switch between available modes.
      replServer.defineCommand('mode', {
        help: 'Switch between modes (default, py, js).',
        action(newMode: string) {
          if (['default', 'py', 'js'].includes(newMode)) {
            currentMode = newMode as 'default' | 'py' | 'js';
            replServer.setPrompt(Branding.getPrompt(currentMode));
            replServer.displayPrompt();
            this.write(`Switched to ${newMode} mode.\n`);
          } else {
            this.write(
              `❌ Unknown mode: ${newMode}. Available modes: default, py, js.\n`,
            );
          }
        },
      });

      // 👇 Graceful shutdown of REPL
      replServer.on('exit', () => {
        console.log(chalk.yellow('[dev-mode] Exited development mode.'));
        process.exit(0);
      });
    },
  },

  // 👇 Predefined subcommands available while in development mode.
  subcommands: [
    getSubcommand('show'), // View application state/configs
    getSubcommand('sync'), // Sync files or state
    getSubcommand('exit'), // Exit the dev mode REPL
    getSubcommand('create'), // Trigger code creation/generation tools
  ],
};

export async function handleInput(input: string) {
  CdLog.debug(`DevModeModel::handleInput()/input:${input}`);

  if (input.endsWith(';')) {
    const commands = input.split(';').filter((cmd) => cmd.trim());
    for (const command of commands) {
      await executeCommand(command.trim()); // Ensure this is awaited
    }
    inputBuffer = ''; // Clear buffer after processing
  } else {
    inputBuffer += input; // Append incomplete command
    console.log('...');
    isCommandIncomplete = true;
  }
}

export async function executeCommand(command: string) {
  CdLog.debug(`DevModeModel::executeCommand()/command:${command}`);
  command = command.replace(/;$/, ''); // Remove trailing semicolon
  const [cmdName, ...args] = command.split(/\s+/);

  const subcommand = DEV_MODE_COMMANDS.subcommands.find(
    (sub) => sub.name === cmdName,
  );

  CdLog.debug(`DevModeModel::executeCommand()/subcommand:${subcommand}`);
  if (!subcommand) {
    console.log(`Unknown command: ${cmdName}`);
    return;
  }

  // Handle options differently based on subcommand
  const options = minimist(args);
  CdLog.debug(
    `DevModeModel::executeCommand()/options:${JSON.stringify(options)}`,
  );

  try {
    // Call action.execute with proper options
    if (subcommand.action?.execute) {
      await subcommand.action.execute({
        // Ensure this is awaited
        ...options,
        _: args, // Ensure positional arguments are passed
      });
    } else {
      console.log(`No action defined for command: ${cmdName}`);
    }
  } catch (error) {
    console.error(`Error executing command "${cmdName}":`, error);
    throw error; // Propagate the error to the eval function
  }
}
