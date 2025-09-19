
import { printTaskSummary } from '../../../../sys/utils/taks.utils.js';
import { CiCdService } from '../../../../sys/dev-descriptor/index.js';
import { DevModeAction, SHARED_OPTIONS } from '../../models/dev-mode.model.js';
import { DevModeService } from '../../services/dev-mode.service.js';
import { inspect } from 'util';
import { handleCommandResponse } from '../utils/post-execution.utils.js';



export const createCommand = {
  name: 'create',
  description: 'Setup environments, modules, controllers, or models dynamically.',
  options: SHARED_OPTIONS,
  action: {
    execute: async (options: any) => {
      const svDevMode = new DevModeService();
      console.log(`create.command::execute()/starting`);
      const result = await svDevMode.executeCrudCommand(DevModeAction.CREATE, options);
      console.log(`create.command::execute()/ending`);
      console.log(`create.command::execute()/result:${inspect(result, { depth: 2 })}`);
      handleCommandResponse(result)
    },
  },
};
