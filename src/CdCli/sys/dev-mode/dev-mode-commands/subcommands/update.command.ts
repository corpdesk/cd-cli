import chalk from 'chalk';
import { SessionService } from '../../../user/services/session.service.js';
import { BaseService, ICdRequest } from '../../../base/index.js';
import { updateItemRegistry, ICdUpdateRequest } from './update.registry.js';

export const updateCommand = {
  name: 'update',
  description: 'Update modules, environments, packages, or sandboxed apps.',
  options: updateItemRegistry.map((item) => ({ flags: item.flag, description: item.description }))
    .concat([
      { flags: 'name', description: 'Name of the item to update' },
      { flags: 'type', description: 'Type of the module (e.g. cd-api, cd-ui)' },
    ]),

  action: {
    execute: async (options: any) => {
      const selectedItem = getSelectedItem(options, updateItemRegistry);
      if (!selectedItem) {
        console.log(chalk.red('❌ Invalid item to update.'));
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

        const request: ICdRequest = {
          ...selectedItem.cdRequest,
          dat: {
            ...selectedItem.cdRequest.dat,
            token: cdToken,
          },
          args: {
            name: options.name,
            type: options.type,
          },
        };

        const b = new BaseService();
        const response = await b.invokeCdRequest(request);

        if (response?.state) {
          console.log(chalk.green(`✔ ${selectedItem.label} "${options.name}" update successfully.`));
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          console.log(chalk.red(`❌ Failed to update ${selectedItem.label}: ${response.message}`));
        }
      } catch (err: any) {
        console.error(chalk.red(`❌ Error during update: ${err.message}`));
      }
    },
  },
};

function getSelectedItem(options: any, registry: ICdUpdateRequest[]): ICdUpdateRequest | undefined {
  return registry.find((item) => options[item.flag]);
}

function validateRequiredOptions(item: ICdUpdateRequest, options: any): string[] {
  return item.required.filter((key) => !options[key]);
}
