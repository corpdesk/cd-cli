import chalk from 'chalk';
import CdLog from '../../../../sys/cd-comm/controllers/cd-logger.controller.js';
import { DevModeModel } from '../../models/dev-mode.model.js';
import { CdModuleController } from '../../../../app/mod-craft/controllers/cd-module.controller.js';
import { CICdRunnerService } from '../../../../sys/dev-descriptor/services/cd-ci-runner.service.js';
import { SessionService } from '../../../../sys/user/services/session.service.js';
import { CdAiModel } from '../../../../app/mod-craft/workshop/cd-api/model/cd-ai-module.model.js';

// let chalk: any;

export const createCommand = {
  name: 'create',
  description:
    'Setup environments, modules, controllers, or models dynamically.',
  options: [
    { flags: 'module', description: 'Create a module' },
    { flags: 'controller', description: 'Create a controller' },
    { flags: 'model', description: 'Create a model' },
    { flags: 'name', description: 'Name of the item to create' },
    { flags: 'type', description: 'Type of the module (e.g. cd-api, cd-ui)' },
    {
      flags: 'method',
      description: 'Creation method (json, context, wizard, ai)',
    },
    { flags: 'json-file', description: 'Path to JSON module descriptor file' },
    { flags: 'model-file', description: 'Path to JSON workflow model file' },
    { flags: 'workstation', description: 'Target workstation' },
  ],
  action: {
    execute: async (options: any) => {
      const name = options.name;
      const type = options.type;
      const isModule = options.module;
      const isController = options.controller;
      const isModel = options.model;

      CdLog.debug('createCommand::execute()/name:', name);
      CdLog.debug('createCommand::execute()/type:', type);

      if (!name) {
        console.log(chalk.red('❌ You must specify the name.'));
        return;
      }

      CdLog.debug('createCommand::execute()/01');
      const cdaiModel = new CdAiModel();
      const sess = new SessionService();
      const cdToken = await sess.sessData.cdToken;
      CdLog.debug('createCommand::execute()/02');
      const devModel: DevModeModel = cdaiModel.getDefaultModuleModel();
      CdLog.debug('createCommand::execute()/03');

      const runner = new CICdRunnerService();

      if (isModule) {
        CdLog.debug('createCommand::execute()/04');
        CdLog.debug('createCommand::execute()/type:', type);
        if (!type) {
          console.log(
            chalk.red('❌ You must specify the type for module creation.'),
          );
          return;
        }

        CdLog.debug('createCommand::execute()/05');
        const { moduleDescriptor, workflowModel } =
          await runner.loadModuleDescriptorAndWorkflow(name, type, cdToken);

        CdLog.debug('createCommand::execute()/06');
        devModel.workflow = workflowModel;

        const ctlModuleController = new CdModuleController();
        CdLog.debug('createCommand::execute()/07');
        await ctlModuleController.create(moduleDescriptor, devModel);
        console.log(
          chalk.green(`✔ Module "${moduleDescriptor.name}" created.`),
        );
      } else if (isController) {
        // const controllerDescriptor =
        //   await runner.loadControllerDescriptor(name); // Placeholder for logic
        // const ctlControllerController = new CdControllerController();
        // await ctlControllerController.create(controllerDescriptor, devModel);
        // console.log(chalk.green(`✔ Controller "${name}" created.`));
      } else if (isModel) {
        // const modelDescriptor = await runner.loadModelDescriptor(name); // Placeholder for logic
        // const ctlModelController = new CdModelController();
        // await ctlModelController.create(modelDescriptor, devModel);
        // console.log(chalk.green(`✔ Model "${name}" created.`));
      } else {
        console.log(
          chalk.red(
            '❌ You must specify either --module, --controller, or --model.',
          ),
        );
      }
    },
  },
};
