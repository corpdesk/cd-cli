// src/CdCli/sys/dev-mode/dev-mode-commands/subcommands/upgrade.command.ts
import { DevModeAction } from '../../models/dev-mode.model.js';
import { DevModeService } from '../../services/dev-mode.service.js';

export const upgradeCommand = {
  name: 'upgrade',
  description: 'Upgrade environments, modules, controllers, or models.',
  options: [
    { flags: 'name', description: 'Name of the item to upgrade' },
    { flags: 'type', description: 'Type of the module (e.g. cd-api, cd-ui)' },
    { flags: 'json-file', description: 'Path to JSON module descriptor file' },
    { flags: 'model-file', description: 'Path to JSON workflow model file' },
    { flags: 'workstation', description: 'Target workstation' },
  ],
  action: {
    execute: async (options: any) => {
      const svDevMode = new DevModeService();
      const result = await svDevMode.executeCrudCommand(DevModeAction.UPGRADE, options);
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
