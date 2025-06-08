/* eslint-disable style/operator-linebreak */
/* eslint-disable no-case-declarations */
import CdLog from '../../../../sys/cd-comm/controllers/cd-logger.controller.js';
import { DevDescriptorController } from '../../../../sys/dev-descriptor/controllers/dev-descriptor.controller.js';
import { DevModeController } from '../../controllers/dev-mode.controller.js';

export const showCommand = {
  name: 'show',
  description: 'List items within the current context.',
  options: [
    { flags: '--apps', description: 'List all registered applications.' },
    {
      flags: '--modules',
      description: 'List all modules within the current app.',
    },
    {
      flags: '--controllers',
      description: 'List all controllers within the current module.',
    },
    { flags: '--json', description: 'Display output in JSON format.' },
    { flags: '--pretty', description: 'Pretty-print JSON output.' },
    {
      flags: '--names <descriptor-names>',
      description: 'Filter descriptors by one or more names (comma-separated).',
    },
  ],
  action: {
    execute: async (options: any) => {
      const ctlDevMode = new DevModeController();
      const ctlDevDescriptor = new DevDescriptorController();
      CdLog.debug(
        `DevModeModel::eval()/subcommands/options:${JSON.stringify(options)}`,
      );

      const command =
        options._[0] || Object.keys(options).find((key) => options[key]);

      switch (command) {
        case 'apps':
          console.log('Showing registered apps...');
          await ctlDevMode.showApps();
          break;
        case 'modules':
          console.log('Showing modules...');
          await ctlDevMode.showModules();
          break;
        case 'controllers':
          console.log('Showing controllers...');
          await ctlDevMode.showControllers();
          break;
        case 'descriptors':
          console.log('Showing descriptors...');
          CdLog.debug(
            `DEV_MODE_COMMANDS::execute()/show/options?.names:${options.names}`,
          );
          const descriptorNames = options.names
            ? options.names.split(',').map((n) => n.trim())
            : null;
          CdLog.debug(
            `DEV_MODE_COMMANDS::execute()/show/descriptorNames:${descriptorNames}`,
          );
          await ctlDevDescriptor.showSrcDescriptors({
            names: descriptorNames,
            json: options.json,
            pretty: options.pretty,
          });
          break;
        default:
          throw new Error(
            'Specify a valid option: apps, modules, controllers, or descriptors.',
          );
      }
    },
  },
};
