// src/CdCli/sys/dev-mode/dev-mode-commands/subcommands/delete.command.ts
import { DevModeAction } from '../../models/dev-mode.model.js';
import { DevModeService } from '../../services/dev-mode.service.js';

export const deleteCommand = {
  name: 'delete',
  description: 'Delete environments, modules, controllers, or models.',
  options: [
    { flags: 'name', description: 'Name of the item to delete' },
    { flags: 'type', description: 'Type of the module (e.g. cd-api, cd-ui)' },
    { flags: 'json-file', description: 'Path to JSON module descriptor file' },
    { flags: 'model-file', description: 'Path to JSON workflow model file' },
    { flags: 'workstation', description: 'Target workstation' },
  ],
  action: {
    execute: async (options: any) => {
      const svDevMode = new DevModeService();
      const result = await svDevMode.executeCrudCommand(DevModeAction.DELETE, options);
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
