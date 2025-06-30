import chalk from 'chalk';
import { SessionService } from '../../../../sys/user/services/session.service.js';
import { BaseService, ICdRequest } from '../../../../sys/base/index.js';
import { readItemRegistry, ICdReadRequest } from './read.registry.js';

export const readCommand = {
  name: 'read',
  description: 'Read modules, environments, packages, or sandboxed apps.',
  options: readItemRegistry.map((item) => ({ flags: item.flag, description: item.description }))
    .concat([
      { flags: 'name', description: 'Name of the item to read' },
      { flags: 'type', description: 'Type of the module (e.g. cd-api, cd-ui)' },
    ]),

  action: {
    execute: async (options: any) => {
      const selectedItem = getSelectedItem(options, readItemRegistry);
      if (!selectedItem) {
        console.log(chalk.red('❌ Invalid item to read.'));
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
          console.log(chalk.green(`✔ ${selectedItem.label} "${options.name}" read successfully.`));
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          console.log(chalk.red(`❌ Failed to read ${selectedItem.label}: ${response.message}`));
        }
      } catch (err: any) {
        console.error(chalk.red(`❌ Error during read: ${err.message}`));
      }
    },
  },
};

function getSelectedItem(options: any, registry: ICdReadRequest[]): ICdReadRequest | undefined {
  return registry.find((item) => options[item.flag]);
}

function validateRequiredOptions(item: ICdReadRequest, options: any): string[] {
  return item.required.filter((key) => !options[key]);
}
