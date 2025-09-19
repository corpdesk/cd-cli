import {
  DevModeAction,
  SHARED_OPTIONS,
  UPGRADE_EXTRA_OPTIONS,
} from '../../models/dev-mode.model.js';
import { DevModeService } from '../../services/dev-mode.service.js';
import { handleCommandResponse } from '../utils/post-execution.utils.js';

const UPGRADE_OPTIONS = [...SHARED_OPTIONS, ...UPGRADE_EXTRA_OPTIONS];

export const upgradeCommand = {
  name: 'upgrade',
  description: 'Upgrade cd-apps, modules, controllers, or models.',
  options: UPGRADE_OPTIONS,
  action: {
    execute: async (options: any) => {
      const svDevMode = new DevModeService();
      const result = await svDevMode.executeCrudCommand(DevModeAction.UPGRADE, options);
      handleCommandResponse(result);
    },
  },
};
