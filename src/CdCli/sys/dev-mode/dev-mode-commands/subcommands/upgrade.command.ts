import chalk from 'chalk';
import CdLog from '../../../../sys/cd-comm/controllers/cd-logger.controller.js';
import { DevModeModel } from '../../models/dev-mode.model.js';
import { CdModuleController } from '../../../../app/mod-craft/controllers/cd-module.controller.js';
import { CICdRunnerService } from '../../../../sys/dev-descriptor/services/cd-ci-runner.service.js';
import { SessionService } from '../../../../sys/user/services/session.service.js';
import { CdAiModel } from '../../../../app/mod-craft/workshop/cd-api/model/cd-ai-module.model.js';
import { BaseService, ICdRequest } from '../../../../sys/base/index.js';
import { upgradeItemRegistry, ICdUpgradeRequest } from './upgrade.registry.js';

export const upgradeCommand = {
  name: 'upgrade',
  description: 'Setup environments, modules, controllers, or models dynamically.',
  options: [
    { flags: 'module', description: 'Upgrade a module' },
    { flags: 'controller', description: 'Upgrade a controller' },
    { flags: 'model', description: 'Upgrade a model' },
    { flags: 'test-bed', description: 'Upgrade a developer test-bed environment' },
    { flags: 'prod', description: 'Upgrade a production deployment environment' },
    { flags: 'package', description: 'Upgrade a package for registry' },
    { flags: 'sandbox', description: 'Upgrade a sandbox environment' },
    { flags: 'name', description: 'Name of the item to upgrade' },
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
      const selectedItem = getSelectedUpgradeItem(options);

      if (!selectedItem) {
        console.log(chalk.red('❌ Invalid item to upgrade.'));
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
            chalk.green(`✔ ${selectedItem.label} "${options.name}" upgraded successfully.`),
          );
        } else {
          console.log(chalk.red(`❌ Failed to upgrade ${selectedItem.label}: ${response.message}`));
        }
      } catch (err: any) {
        console.error(chalk.red(`❌ Error during upgrade: ${err.message}`));
      }
    },
  },
};
// function getSelectedUpgradeItem(options: any) {
//   throw new Error('Function not implemented.');
// }

// Returns active flag and descriptor (e.g., { flag: 'module', item: {...} })
function getSelectedUpgradeItem(options: any) {
  return upgradeItemRegistry.find((item) => options[item.flag]);
}

// Validates required options
function validateRequiredOptions(item: ICdUpgradeRequest, options: any): string[] {
  return item.required.filter((key) => !options[key]);
}

