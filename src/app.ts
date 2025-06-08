/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable node/prefer-global/process */
/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable node/prefer-global/process */
import repl from 'node:repl';
/* eslint-disable style/brace-style */
import chalk from 'chalk';    
import { createCommand } from 'commander';
import nodeCleanup from 'node-cleanup';
import updateNotifier from 'update-notifier'; 
// import pkg from '../package.json' with { type: 'json' };
import { readFile } from 'fs/promises';
import { CdCli } from './CdCli/sys/cd-cli/models/cd-cli.model.js';
import CdLog from './CdCli/sys/cd-comm/controllers/cd-logger.controller.js';
import { setLogLevel } from './CdCli/sys/cd-comm/controllers/cd-winston.js';
import config from './config.js';
import 'zx/globals'; 

const pkg = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf-8')
);


export class App {
  async run() {
    const startAt = Date.now();
    const { name, version } = pkg;
    // Cleanup handler
    nodeCleanup((exitCode) => {
      const message = exitCode
        ? `${chalk.red.bold('error')} Command failed with exit code ${exitCode}.`
        : `✨ Done in ${((Date.now() - startAt) / 1000).toFixed(2)}s.`;
      console.log(message);
    });

    const program = createCommand(config.meta.name);
    program
      .version(config.meta.version)
      .description(config.meta.description)
      .showHelpAfterError('(add --help for additional information)');

    // Global --debug flag
    program.option(
      '--debug <level>',
      'Set the debug level dynamically during production',
      (level) => {
        setLogLevel(level);
        CdLog.setDebugLevel(Number(level));
        return level;
      },
      'info',
    );

    // Pre-action hook for update notifier
    program.hook('preAction', () => {
      updateNotifier({ pkg: { name, version } }).notify({ isGlobal: true });
    });

    for (const command of CdCli.commands) {
      const cmd = program
        .command(command.name)
        .description(command.description)
        .action(async (...args) => {
          if (command.name === 'dev' && args.length === 1) {
            // Only 'dev' was provided, no additional arguments or subcommands
            console.log(
              chalk.green(
                'Entering REPL mode (no extra arguments detected)...',
              ),
            );
            const replServer = repl.start({
              prompt: chalk.blueBright('cd-dev> '),
              eval: async (input, context, filename, callback) => {
                try {
                  const [command, ...rest] = input.trim().split(/\s+/);

                  if (command === 'exit') {
                    console.log(chalk.yellow('Exiting development mode...'));
                    process.exit(0);
                  } else {
                    callback(
                      new Error(`Unknown command: ${command}`),
                      undefined,
                    );
                  }
                } catch (error) {
                  callback(
                    error instanceof Error ? error : new Error(String(error)),
                    undefined,
                  );
                }
              },
            });

            replServer.on('exit', () => {
              console.log(chalk.yellow('Exited development mode.'));
              process.exit(0);
            });

            return; // Skip further processing for `dev`
          }

          if (command.action && command.action.execute) {
            try {
              const options = args.pop(); // Extract options passed to the command
              await command.action.execute(options);
            } catch (error) {
              console.error(chalk.red('Error executing command:'), error);
            }
          }
        });

      if (command.options) {
        for (const option of command.options) {
          cmd.option(option.flags, option.description);
        }
      }

      if (command.subcommands) {
        for (const subcommand of command.subcommands) {
          const subCmd = cmd
            .command(subcommand.name)
            .description(subcommand.description)
            .action(async (...args) => {
              if (subcommand.action && subcommand.action.execute) {
                try {
                  const options = args.pop();
                  await subcommand.action.execute(options);
                } catch (error) {
                  console.error(
                    chalk.red('Error executing subcommand:'),
                    error,
                  );
                }
              }
            });

          if (subcommand.options) {
            for (const option of subcommand.options) {
              subCmd.option(option.flags, option.description);
            }
          }
        }
      }
    }

    // Parse CLI arguments
    await program.parse();
  }
}
