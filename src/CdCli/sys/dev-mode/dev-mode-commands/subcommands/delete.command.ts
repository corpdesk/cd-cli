import chalk from 'chalk';
import { SessionService } from '../../../user/services/session.service.js';
import { BaseService, ICdRequest } from '../../../base/index.js';
import { deleteItemRegistry, ICdDeleteRequest } from './delete.registry.js';

export const deleteCommand = {
  name: 'delete',
  description: 'Delete modules, environments, packages, or sandboxed apps.',
  options: deleteItemRegistry.map((item) => ({ flags: item.flag, description: item.description }))
    .concat([
      { flags: 'name', description: 'Name of the item to delete' },
      { flags: 'type', description: 'Type of the module (e.g. cd-api, cd-ui)' },
    ]),

  action: {
    execute: async (options: any) => {
      const selectedItem = getSelectedItem(options, deleteItemRegistry);
      if (!selectedItem) {
        console.log(chalk.red('❌ Invalid item to delete.'));
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
          console.log(chalk.green(`✔ ${selectedItem.label} "${options.name}" delete successfully.`));
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          console.log(chalk.red(`❌ Failed to delete ${selectedItem.label}: ${response.message}`));
        }
      } catch (err: any) {
        console.error(chalk.red(`❌ Error during delete: ${err.message}`));
      }
    },
  },
};

function getSelectedItem(options: any, registry: ICdDeleteRequest[]): ICdDeleteRequest | undefined {
  return registry.find((item) => options[item.flag]);
}

function validateRequiredOptions(item: ICdDeleteRequest, options: any): string[] {
  return item.required.filter((key) => !options[key]);
}
