
// src/CdCli/sys/dev-mode/dev-mode-commands/index.ts
import { getSubcommand } from './utils/command-utils.js';
import repl from 'node:repl';
import chalk from 'chalk';
import minimist from 'minimist';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import { CdAiController } from '../../../app/cd-ai-pwa/controllers/cd-ai.controller.js';

// Branding utility for reusable prompt designs
export const Branding = {
  getPrompt: (mode: 'default' | 'py' | 'js' = 'default') => {
    const branding = {
      cd: chalk.bgHex('#FF6A00').white.bold('cd'),
      separator: chalk.white(''),
    };

    const modes = {
      default: chalk.bgGray.black.bold(' dev '),
      py: chalk.bgBlue.white.bold(' py '),
      js: chalk.bgYellow.black.bold(' js '),
    };

    const modeLabel = modes[mode] || modes.default;
    return `${branding.cd}${branding.separator}${modeLabel} ${chalk.greenBright('>')} `;
  },
};

let inputBuffer: string = '';
let isCommandIncomplete = false;

export const DEV_MODE_COMMANDS = {
  name: 'dev',
  description: 'Enter development mode to manage applications.',
  action: {
    execute: async () => {
      console.log(chalk.green('[dev-mode] Entering development mode...'));

      // 👇 Initialize AI services with timeout and safe fallback
      try {
        const aiTimeout = 8000; // 8 seconds timeout cap
        const initAi = CdAiController.initAiRuntime();

        await Promise.race([
          initAi,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('AI init timeout')), aiTimeout),
          ),
        ]);

        console.log(chalk.cyan('[dev-mode] AI services initialized.'));
      } catch (e) {
        CdLog.warning(`⚠ Failed to initialize AI services: ${(e as Error).message}`);
        console.log(chalk.yellow('⚠ Proceeding without AI enhancements.'));
      }

      let currentMode: 'default' | 'py' | 'js' = 'default';

      const replServer = repl.start({
        prompt: Branding.getPrompt(currentMode),
        eval: async (input, context, filename, callback) => {
          try {
            CdLog.debug(`DevMode::eval()/input:${input}`);
            input = input.trim();
            inputBuffer += input;

            const hasDelimiterAtEnd = inputBuffer.endsWith(';');
            const lastPart = inputBuffer.split(';').pop();
            const hasTextAfterLastDelimiter =
              lastPart && lastPart.trim().length > 0;

            if (!hasDelimiterAtEnd || hasTextAfterLastDelimiter) {
              callback(null, '...');
              return;
            }

            const commands = inputBuffer.split(';').filter((cmd) => cmd.trim());
            inputBuffer = '';

            const executionResults = await Promise.all(
              commands.map((cmd) => handleInput(`${cmd.trim()};`)),
            );

            callback(null, `✅ Executed ${commands.length} command(s).`);
            replServer.displayPrompt();
          } catch (err) {
            callback(err instanceof Error ? err : new Error(String(err)), undefined);
            replServer.displayPrompt();
          }
        },
      });

      replServer.defineCommand('mode', {
        help: 'Switch between modes (default, py, js).',
        action(newMode: string) {
          if (['default', 'py', 'js'].includes(newMode)) {
            currentMode = newMode as 'default' | 'py' | 'js';
            replServer.setPrompt(Branding.getPrompt(currentMode));
            replServer.displayPrompt();
            this.write(`Switched to ${newMode} mode.\n`);
          } else {
            this.write(`❌ Unknown mode: ${newMode}. Available modes: default, py, js.\n`);
          }
        },
      });

      replServer.on('exit', () => {
        console.log(chalk.yellow('[dev-mode] Exited development mode.'));
        process.exit(0);
      });
    },
  },

  subcommands: [
    getSubcommand('show'),
    getSubcommand('sync'),
    getSubcommand('exit'),
    getSubcommand('create'),
    getSubcommand('read'),
    getSubcommand('update'),
    getSubcommand('delete'),
    getSubcommand('test'),
    getSubcommand('upgrade'),
    getSubcommand('migrate'),
    getSubcommand('derive'),
  ],
};

export async function handleInput(input: string) {
  CdLog.debug(`DevModeModel::handleInput()/input:${input}`);

  if (input.endsWith(';')) {
    const commands = input.split(';').filter((cmd) => cmd.trim());
    for (const command of commands) {
      await executeCommand(command.trim());
    }
    inputBuffer = '';
  } else {
    inputBuffer += input;
    console.log('...');
    isCommandIncomplete = true;
  }
}

export async function executeCommand(command: string) {
  CdLog.debug(`DevModeModel::executeCommand()/command:${command}`);
  command = command.replace(/;$/, '');
  const [cmdName, ...args] = command.split(/\s+/);

  const subcommand = DEV_MODE_COMMANDS.subcommands.find(
    (sub) => sub.name === cmdName,
  );

  if (!subcommand) {
    console.log(`Unknown command: ${cmdName}`);
    return;
  }

  const options = minimist(args);
  CdLog.debug(`DevModeModel::executeCommand()/options:${JSON.stringify(options)}`);

  try {
    if (subcommand.action?.execute) {
      await subcommand.action.execute({
        ...options,
        _: args,
      });
    } else {
      console.log(`No action defined for command: ${cmdName}`);
    }
  } catch (error) {
    console.error(`Error executing command "${cmdName}":`, error);
    throw error;
  }
}

