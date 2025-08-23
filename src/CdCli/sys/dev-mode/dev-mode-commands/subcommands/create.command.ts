
import { printTaskSummary } from '../../../../sys/utils/taks.utils.js';
import { CiCdService } from '../../../../sys/dev-descriptor/index.js';
import { DevModeAction, SHARED_OPTIONS } from '../../models/dev-mode.model.js';
import { DevModeService } from '../../services/dev-mode.service.js';
import { inspect } from 'util';

// export const createCommand = {
//   name: 'create',
//   description: 'Setup environments, modules, controllers, or models dynamically.',
//   options: [
//     { flags: 'name', description: 'Name of the item to create' },
//     { flags: 'type', description: 'Type of the module (e.g. cd-api, cd-ui)' },
//     { flags: 'json-file', description: 'Path to JSON module descriptor file' },
//     { flags: 'model-file', description: 'Path to JSON workflow model file' },
//     { flags: 'workstation', description: 'Target workstation' },
//   ],
//   action: {
//     execute: async (options: any) => {
//       const svDevMode = new DevModeService();
//       await svDevMode.executeCrudCommand(DevModeAction.CREATE, options);
//     },
//   },
// };

// export const createCommand = {
//   name: 'create',
//   description: 'Setup environments, modules, controllers, or models dynamically.',
//   options: SHARED_OPTIONS,
//   action: {
//     execute: async (options: any) => {
//       const svDevMode = new DevModeService();
//       const result = await svDevMode.executeCrudCommand(DevModeAction.CREATE, options);
//       if (result.state) {
//         console.log(result.message);
//       } else {
//         console.error(result.message);
//         // optionally exit process for CLI with error code
//         // process.exit(1);
//       }
//     },
//   },
// };

export const createCommand = {
  name: 'create',
  description: 'Setup environments, modules, controllers, or models dynamically.',
  options: SHARED_OPTIONS,
  action: {
    execute: async (options: any) => {
      const svCiCdService = new CiCdService();
      const svDevMode = new DevModeService();
      console.log(`create.command::execute()/starting`);
      const response = await svDevMode.executeCrudCommand(DevModeAction.CREATE, options);
      console.log(`create.command::execute()/ending`);
      console.log(`create.command::execute()/response:${inspect(response, { depth: 2 })}`);
      if (Array.isArray(response?.data)) {
        console.log(`create.command::execute()/isArray-01`);
        const { failCount } = svCiCdService.printTaskSummary(response.data);
        if (failCount > 0) {
          console.log(`create.command::execute()/isArray-02`);
          console.error(chalk.red(`❌ Some tasks failed`));
          process.exit(1);
        } else {
          console.log(`create.command::execute()/isArray-03`);
          console.log(chalk.green(`✅ All tasks completed successfully`));
        }
      } else {
        console.log(`create.command::execute()/isNotArray-01`);
        // Fallback to old behavior
        if (response.state) {
          console.log(response.message);
        } else {
          console.error(response.message);
          process.exit(1);
        }
      }
    },
  },
};
