import chalk from 'chalk';
import CdLog from '../../../../sys/cd-comm/controllers/cd-logger.controller.js';
import { DevModeModel } from '../../models/dev-mode.model.js';
import { CdModuleController } from '../../../../app/mod-craft/controllers/cd-module.controller.js';
import { CICdRunnerService } from '../../../../sys/dev-descriptor/services/cd-ci-runner.service.js';
import { SessionService } from '../../../../sys/user/services/session.service.js';
import { CdAiModel } from '../../../../app/mod-craft/workshop/cd-api/model/cd-ai-module.model.js';
import { BaseService, ICdRequest } from '../../../../sys/base/index.js';
import { migrateItemRegistry, ICdMigrateRequest } from './migrate.registry.js';

export const migrateCommand = {
  name: 'migrate',
  description: 'Setup environments, modules, controllers, or models dynamically.',
  options: [
    { flags: 'module', description: 'Migrate a module' },
    { flags: 'controller', description: 'Migrate a controller' },
    { flags: 'model', description: 'Migrate a model' },
    { flags: 'test-bed', description: 'Migrate a developer test-bed environment' },
    { flags: 'prod', description: 'Migrate a production deployment environment' },
    { flags: 'package', description: 'Migrate a package for registry' },
    { flags: 'sandbox', description: 'Migrate a sandbox environment' },
    { flags: 'name', description: 'Name of the item to migrate' },
    { flags: 'type', description: 'Type of the module (e.g. cd-api, cd-ui)' },
    {
      flags: 'method',
      description: 'Creation method (json, context, wizard, ai)',
    },
    { flags: 'json-file', description: 'Path to JSON module descriptor file' },
    { flags: 'model-file', description: 'Path to JSON workflow model file' },
    { flags: 'workstation', description: 'Target workstation' },
  ],

  action: {
    execute: async (options: any) => {
      const selectedItem = getSelectedMigrateItem(options);

      if (!selectedItem) {
        console.log(chalk.red('❌ Invalid item to migrate.'));
        return;
      }

      const missing = validateRequiredOptions(selectedItem, options);
      if (missing.length > 0) {
        console.log(chalk.red(`❌ Missing required options: ${missing.join(', ')}`));
        return;
      }

      try {
        const sessionService = new SessionService();
        const cdToken = await sessionService.sessData.cdToken;

        // Clone and inject values into the cdRequest
        const request: ICdRequest = {
          ...selectedItem.cdRequest,
          dat: {
            ...selectedItem.cdRequest.dat,
            token: cdToken,
          },
          args: {
            name: options.name,
            type: options.type,
            ...(options.method && { method: options.method }),
          },
        };

        const b = new BaseService();
        const response = await b.invokeCdRequest(request);

        if (response?.state) {
          console.log(
            chalk.green(`✔ ${selectedItem.label} "${options.name}" migrated successfully.`),
          );
        } else {
          console.log(chalk.red(`❌ Failed to migrate ${selectedItem.label}: ${response.message}`));
        }
      } catch (err: any) {
        console.error(chalk.red(`❌ Error during migrate: ${err.message}`));
      }
    },
  },
};
// function getSelectedMigrateItem(options: any) {
//   throw new Error('Function not implemented.');
// }

// Returns active flag and descriptor (e.g., { flag: 'module', item: {...} })
function getSelectedMigrateItem(options: any) {
  return migrateItemRegistry.find((item) => options[item.flag]);
}

// Validates required options
function validateRequiredOptions(item: ICdMigrateRequest, options: any): string[] {
  return item.required.filter((key) => !options[key]);
}

