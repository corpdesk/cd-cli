// src/CdCli/sys/dev-mode/dev-mode-commands/subcommands/migrate.command.ts
import { DevModeAction } from '../../models/dev-mode.model.js';
import { DevModeService } from '../../services/dev-mode.service.js';

export const migrateCommand = {
  name: 'migrate',
  description: 'Migrate environments, modules, controllers, or models.',
  options: [
    { flags: 'name', description: 'Name of the item to migrate' },
    { flags: 'type', description: 'Type of the module (e.g. cd-api, cd-ui)' },
    { flags: 'json-file', description: 'Path to JSON module descriptor file' },
    { flags: 'model-file', description: 'Path to JSON workflow model file' },
    { flags: 'workstation', description: 'Target workstation' },
  ],
  action: {
    execute: async (options: any) => {
      const svDevMode = new DevModeService();
      const result = await svDevMode.executeCrudCommand(DevModeAction.MIGRATE, options);
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
