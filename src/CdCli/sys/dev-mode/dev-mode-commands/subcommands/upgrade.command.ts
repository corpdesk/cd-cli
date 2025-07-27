// src/CdCli/sys/dev-mode/dev-mode-commands/subcommands/upgrade.command.ts
import {
  DevModeAction,
  SHARED_OPTIONS,
  UPGRADE_EXTRA_OPTIONS,
} from '../../models/dev-mode.model.js';
import { DevModeService } from '../../services/dev-mode.service.js';

const UPGRADE_OPTIONS = [...SHARED_OPTIONS, ...UPGRADE_EXTRA_OPTIONS];

export const upgradeCommand = {
  name: 'upgrade',
  description: 'Upgrade cd-apps, modules, controllers, or models.',
  options: UPGRADE_OPTIONS,
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
