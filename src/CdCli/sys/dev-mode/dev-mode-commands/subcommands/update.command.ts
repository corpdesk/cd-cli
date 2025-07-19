// src/CdCli/sys/dev-mode/dev-mode-commands/subcommands/update.command.ts
import { DevModeAction, SHARED_OPTIONS } from '../../models/dev-mode.model.js';
import { DevModeService } from '../../services/dev-mode.service.js';

export const updateCommand = {
  name: 'update',
  description: 'Update environments, modules, controllers, or models.',
  options: SHARED_OPTIONS,
  action: {
    execute: async (options: any) => {
      const svDevMode = new DevModeService();
      const result = await svDevMode.executeCrudCommand(DevModeAction.UPDATE, options);
      if (result.state) {
        console.log(result.message);
      } else {
        console.error(result.message);
        // optionally exit process for CLI with error code
        // process.exit(1);
      }
    },
  },
};
