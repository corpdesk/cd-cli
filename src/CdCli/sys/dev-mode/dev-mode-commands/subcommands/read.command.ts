// src/CdCli/sys/dev-mode/dev-mode-commands/subcommands/read.command.ts
import { DevModeAction, SHARED_OPTIONS } from '../../models/dev-mode.model.js';
import { DevModeService } from '../../services/dev-mode.service.js';

export const readCommand = {
  name: 'read',
  description: 'Read environments, modules, controllers, or models.',
  options: SHARED_OPTIONS,
  action: {
    execute: async (options: any) => {
      const svDevMode = new DevModeService();
      const result = await svDevMode.executeCrudCommand(DevModeAction.READ, options);
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
