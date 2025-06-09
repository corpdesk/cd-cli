// /* eslint-disable style/operator-linebreak */
// /* eslint-disable no-case-declarations */

// /**
//  * dev-mode.model.ts main role is to manage the interactive commands that are applicable after executes the command
//  * > cd-cli dev
//  * Simiar to sql inteructive session, you have the following commands:
//  * > show <recource>
//  * > use <recource-name>
//  *
//  */

// /* eslint-disable style/brace-style */
// /* eslint-disable node/prefer-global/process */
// /* eslint-disable unused-imports/no-unused-vars */

// import repl from 'node:repl';
// import chalk from 'chalk';
// import minimist from 'minimist';
// import { CdCli } from '../../cd-cli/models/cd-cli.model.js';
// import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
// import { DevDescriptorController } from '../../dev-descriptor/controllers/dev-descriptor.controller.js';
// import { DevModeController } from '../controllers/dev-mode.controller.js';
// import { CiCdDescriptor } from '../../dev-descriptor/models/cicd-descriptor.model.js';

// // let chalk: any;

// export interface DevModeModel {
//   method: 'wizard' | 'manual' | 'ai' | 'json' | 'context';
//   process: 'create' | 'read' | 'update' | 'delete';
//   workflow: CiCdDescriptor;
// }

// // Branding utility for reusable prompt designs
// export const Branding = {
//   getPrompt: (mode: 'default' | 'py' | 'js' = 'default') => {
//     const branding = {
//       cd: chalk.bgHex('#FF6A00').white.bold('cd'), // Orange background, white text
//       separator: chalk.white(''), // White separator
//     };

//     const modes = {
//       default: chalk.bgGray.black.bold(' dev '), // Gray background, black text
//       py: chalk.bgBlue.white.bold(' py '), // Blue background, white text
//       js: chalk.bgYellow.black.bold(' js '), // Yellow background, black text
//     };

//     const modeLabel = modes[mode] || modes.default;
//     return `${branding.cd}${branding.separator}${modeLabel} ${chalk.greenBright('>')} `;
//   },
// };

// // Main Development Mode Commands
// let inputBuffer: string = '';
// let isCommandIncomplete = false;

// export const DEV_MODE_COMMANDS_old = {
//   name: 'dev',
//   description: 'Enter development mode to manage applications.',
//   action: {
//     execute: async () => {
//       console.log('Entering development mode...');
//       let currentMode: 'default' | 'py' | 'js' = 'default';

//       const replServer = repl.start({
//         prompt: Branding.getPrompt(currentMode),
//         eval: async (input, context, filename, callback) => {
//           try {
//             CdLog.debug(`DevModeModel::eval()/input:${input}`);
//             input = input.trim();
//             inputBuffer += input;
//             CdLog.debug(`DevModeModel::eval()/inputBuffer:${inputBuffer}`);

//             const hasDelimiterAtEnd = inputBuffer.endsWith(';');
//             const lastPart = inputBuffer.split(';').pop();
//             const hasTextAfterLastDelimiter = lastPart
//               ? lastPart.trim().length > 0
//               : false;

//             if (!hasDelimiterAtEnd || hasTextAfterLastDelimiter) {
//               callback(null, '...'); // Show continuation prompt
//               return;
//             }

//             const commands = inputBuffer.split(';').filter((cmd) => cmd.trim());
//             CdLog.debug(`DevModeModel::eval()/commands:${commands}`);
//             inputBuffer = '';

//             // **Create an array of promises** to track command execution
//             const executionPromises = commands.map(async (fullCommand) => {
//               CdLog.debug(`DevModeModel::eval()/fullCommand:${fullCommand}`);
//               return handleInput(`${fullCommand.trim()};`);
//             });

//             // **Wait for all commands to complete**
//             // await Promise.all(executionPromises);
//             try {
//               await Promise.all(executionPromises);
//             } catch (error) {
//               console.error('Error executing commands:', error);
//             }

//             // **Now call callback, ensuring the REPL is notified only after execution is finished**
//             callback(
//               null,
//               `Executed ${commands.length} commands successfully.`,
//             );

//             // **Manually trigger REPL prompt after execution is complete**
//             replServer.displayPrompt();
//           } catch (error) {
//             callback(
//               error instanceof Error ? error : new Error(String(error)),
//               undefined,
//             );
//             replServer.displayPrompt();
//           }
//         },
//       });

//       // Handle REPL mode switching
//       replServer.defineCommand('mode', {
//         help: 'Switch between modes (default, py, js).',
//         action(newMode: string) {
//           if (['default', 'py', 'js'].includes(newMode)) {
//             currentMode = newMode as 'default' | 'py' | 'js';
//             replServer.setPrompt(Branding.getPrompt(currentMode));
//             replServer.displayPrompt();
//             this.write(`Switched to ${newMode} mode.\n`);
//           } else {
//             this.write(
//               `Unknown mode: ${newMode}. Available modes: default, py, js.\n`,
//             );
//           }
//         },
//       });

//       replServer.on('exit', () => {
//         console.log(chalk.yellow('Exited development mode.'));
//         process.exit(0);
//       });
//     },
//   },
//   subcommands: [
//     {
//       name: 'show',
//       description: 'List items within the current context.',
//       options: [
//         { flags: '--apps', description: 'List all registered applications.' },
//         {
//           flags: '--modules',
//           description: 'List all modules within the current app.',
//         },
//         {
//           flags: '--controllers',
//           description: 'List all controllers within the current module.',
//         },
//         { flags: '--json', description: 'Display output in JSON format.' },
//         { flags: '--pretty', description: 'Pretty-print JSON output.' },
//         {
//           flags: '--names <descriptor-names>',
//           description:
//             'Filter descriptors by one or more names (comma-separated).',
//         },
//       ],
//       action: {
//         execute: async (options: any) => {
//           const ctlDevMode = new DevModeController();
//           const ctlDevDescriptor = new DevDescriptorController();
//           CdLog.debug(
//             `DevModeModel::eval()/subcommands/options:${JSON.stringify(options)}`,
//           );

//           const command =
//             options._[0] || Object.keys(options).find((key) => options[key]);

//           switch (command) {
//             case 'apps':
//               console.log('Showing registered apps...');
//               await ctlDevMode.showApps();
//               break;
//             case 'modules':
//               console.log('Showing modules...');
//               await ctlDevMode.showModules();
//               break;
//             case 'controllers':
//               console.log('Showing controllers...');
//               await ctlDevMode.showControllers();
//               break;
//             case 'descriptors':
//               console.log('Showing descriptors...');
//               CdLog.debug(
//                 `DEV_MODE_COMMANDS::execute()/show/options?.names:${options.names}`,
//               );
//               const descriptorNames = options.names
//                 ? options.names.split(',').map((n) => n.trim())
//                 : null;
//               CdLog.debug(
//                 `DEV_MODE_COMMANDS::execute()/show/descriptorNames:${descriptorNames}`,
//               );
//               await ctlDevDescriptor.showSrcDescriptors({
//                 names: descriptorNames,
//                 json: options.json,
//                 pretty: options.pretty,
//               });
//               break;
//             default:
//               throw new Error(
//                 'Specify a valid option: apps, modules, controllers, or descriptors.',
//               );
//           }
//         },
//       },
//     },

//     {
//       name: 'exit',
//       description: 'Exit development mode.',
//       action: {
//         execute: () => {
//           console.log(chalk.yellow('Exiting development mode...'));
//           process.exit(0);
//         },
//       },
//     },
//   ],
// };

// export async function handleInput(input: string) {
//   CdLog.debug(`DevModeModel::handleInput()/input:${input}`);

//   if (input.endsWith(';')) {
//     const commands = input.split(';').filter((cmd) => cmd.trim());
//     for (const command of commands) {
//       await executeCommand(command.trim()); // Ensure this is awaited
//     }
//     inputBuffer = ''; // Clear buffer after processing
//   } else {
//     inputBuffer += input; // Append incomplete command
//     console.log('...');
//     isCommandIncomplete = true;
//   }
// }

// export async function executeCommand(command: string) {
//   CdLog.debug(`DevModeModel::executeCommand()/command:${command}`);
//   command = command.replace(/;$/, ''); // Remove trailing semicolon
//   const [cmdName, ...args] = command.split(/\s+/);

//   const subcommand = DEV_MODE_COMMANDS_old.subcommands.find(
//     (sub) => sub.name === cmdName,
//   );

//   CdLog.debug(`DevModeModel::executeCommand()/subcommand:${subcommand}`);
//   if (!subcommand) {
//     console.log(`Unknown command: ${cmdName}`);
//     return;
//   }

//   // Handle options differently based on subcommand
//   const options = minimist(args);
//   CdLog.debug(
//     `DevModeModel::executeCommand()/options:${JSON.stringify(options)}`,
//   );

//   try {
//     // Call action.execute with proper options
//     if (subcommand.action?.execute) {
//       await subcommand.action.execute({
//         // Ensure this is awaited
//         ...options,
//         _: args, // Ensure positional arguments are passed
//       });
//     } else {
//       console.log(`No action defined for command: ${cmdName}`);
//     }
//   } catch (error) {
//     console.error(`Error executing command "${cmdName}":`, error);
//     throw error; // Propagate the error to the eval function
//   }
// }
