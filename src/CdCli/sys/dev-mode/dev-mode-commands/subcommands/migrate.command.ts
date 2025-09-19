import { DevModeAction, SHARED_OPTIONS } from '../../models/dev-mode.model.js';
import { DevModeService } from '../../services/dev-mode.service.js';
import { handleCommandResponse } from '../utils/post-execution.utils.js';

export const migrateCommand = {
  name: 'migrate',
  description: 'Migrate environments, modules, controllers, or models.',
  options: SHARED_OPTIONS,
  action: {
    execute: async (options: any) => {
      const svDevMode = new DevModeService();
      const result = await svDevMode.executeCrudCommand(DevModeAction.MIGRATE, options);
      handleCommandResponse(result);
    },
  },
};
