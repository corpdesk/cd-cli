/**
 * sync descriptor-data --name knownCiCds  --type CiCdDescriptor --db redis;
 */
import CdLog from '../../../../sys/cd-comm/controllers/cd-logger.controller.js';
import { DevDescriptorController } from '../../../../sys/dev-descriptor/controllers/dev-descriptor.controller.js';
import chalk from 'chalk';

// let chalk: any;

export const syncCommand = {
  name: 'sync',
  description: 'Synchronize different resources.',
  options: [
    { flags: 'descriptors', description: 'Sync descriptors.' },
    { flags: 'apps', description: 'Sync apps.' },
    { flags: 'modules', description: 'Sync modules.' },
    {
      flags: '--db <type>',
      description: "Specify database type: 'mysql', 'redis', or 'all'.",
    },
    {
      flags: '--name <name>',
      description: 'Specify the name of the descriptor to sync.',
    },
    {
      flags: '--type <type>',
      description: 'Specify the descriptor type (e.g., CiCdDescriptor).',
    },
  ],
  action: {
    execute: async (options: any) => {
      const resource = options._[0]; // First positional argument (resource type)
      const db = options.db || 'all'; // Get the --db flag value, default to 'all'
      const name = options.name || null;
      const type = options.type || null;

      if (!resource) {
        console.log(chalk.red('Error: Please specify a resource to sync.'));
        return;
      }

      if (!['mysql', 'redis', 'all'].includes(db)) {
        console.log(
          chalk.red(
            "Error: Invalid database type. Use 'mysql', 'redis', or 'all'.",
          ),
        );
        return;
      }

      CdLog.debug(
        `DevModeModel::syncCommand()/resource:${resource}, name:${name}, type:${type}, dbType:${db}`,
      );

      const devDescriptor = new DevDescriptorController();

      switch (resource.toLowerCase()) {
        case 'descriptors':
          await devDescriptor.syncDescriptors([name], db);
          console.log(chalk.green('✔ Synced descriptors successfully.'));
          break;
        case 'descriptor-data':
          if (!name || !type) {
            console.log(
              chalk.red(
                'Error: --name and --type are required for descriptor-data.',
              ),
            );
            return;
          }
          await devDescriptor.syncDescriptorData(name, type, db);
          console.log(
            chalk.green(
              `✔ Synced descriptor data for ${name} of type ${type}.`,
            ),
          );
          break;
        case 'apps':
          await devDescriptor.syncApps([name], db);
          console.log(chalk.green('✔ Synced apps successfully.'));
          break;
        case 'modules':
          await devDescriptor.syncModules([name], db);
          console.log(chalk.green('✔ Synced modules successfully.'));
          break;
        default:
          console.log(`resource length: ${resource.length}`);
          console.log(chalk.red(`Unknown sync resource: '${resource}'`));
          break;
      }
    },
  },
};
