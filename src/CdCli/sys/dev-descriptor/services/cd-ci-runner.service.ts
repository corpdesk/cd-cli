import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname } from 'path';
import { CdAiModel } from '../../../app/mod-craft/workshop/cd-api/model/cd-ai-module.model.js';
import { CdFxReturn, ICdRequest } from '../../base/IBase.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import { CdControllerDescriptor } from '../models/cd-controller-descriptor.model.js';
import { CdModuleDescriptor } from '../models/cd-module-descriptor.model.js';
import {
  CiCdDescriptor,
  CICdTask,
  ExecutionEnvironmentType,
} from '../models/cicd-descriptor.model.js';
import { CdAiWorkFlow } from '../../../app/mod-craft/workshop/cd-api/workflow/cd-ai.create.workflow.js';

/** Runner responsible for executing CICdTask logic */
export class CICdRunnerService {
  // async loadModuleDescriptorAndWorkflow(
  //   moduleName: string,
  //   moduleType: string,
  //   token: string,
  // ): Promise<{
  //   moduleDescriptor: CdModuleDescriptor;
  //   workflowModel: CiCdDescriptor;
  // }> {
  //   CdLog.debug(
  //     'Starting CICdRunnerService::loadModuleDescriptorAndWorkflow()',
  //   );
  //   // Normalize
  //   const dashedName = moduleName.toLowerCase(); // e.g. cd-ai
  //   const pascalName = dashedName
  //     .split('-')
  //     .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
  //     .join(''); // e.g. CdAi

  //   CdLog.debug(
  //     `Starting CICdRunnerService::loadModuleDescriptorAndWorkflow()/moduleType:${moduleType}`,
  //   );
  //   CdLog.debug(
  //     `Starting CICdRunnerService::loadModuleDescriptorAndWorkflow()/dashedName:${dashedName}`,
  //   );

  //   const modelPath = `../../../app/mod-craft/workshop/${moduleType}/model/${dashedName}-module.model`;
  //   const workflowPath = `../../../app/mod-craft/workshop/${moduleType}/workflow/${dashedName}.create.workflow`;

  //   CdLog.debug('CICdRunnerService::loadModuleDescriptorAndWorkflow()/01:');
  //   // Dynamically import model file and get moduleDescriptor
  //   const modelModule = await import(modelPath);
  //   CdLog.debug('CICdRunnerService::loadModuleDescriptorAndWorkflow()/02:');
  //   const moduleDescriptor: CdModuleDescriptor = modelModule.getModuleModel();
  //   CdLog.debug('CICdRunnerService::loadModuleDescriptorAndWorkflow()/03:');

  //   // Dynamically import workflow class and generate workflow
  //   const workflowModule = await import(workflowPath);
  //   const WorkflowClass = workflowModule[`${pascalName}WorkFlow`];
  //   const workflowInstance = new WorkflowClass();
  //   const workflowModel: CiCdDescriptor = workflowInstance.createWorkFlow(
  //     moduleDescriptor,
  //     moduleType,
  //     token,
  //   );

  //   return { moduleDescriptor, workflowModel };
  // }
  async loadModuleDescriptorAndWorkflow(
    moduleName: string,
    moduleType: string,
    token: string,
  ): Promise<{
    moduleDescriptor: CdModuleDescriptor;
    workflowModel: CiCdDescriptor;
  }> {
    CdLog.debug(
      'Starting CICdRunnerService::loadModuleDescriptorAndWorkflow()',
    );

    const dashedName = moduleName.toLowerCase();
    const pascalName = dashedName
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join('');

    // Convert __dirname equivalent in ESM
    // const __filename = fileURLToPath(import.meta.url);
    // const __dirname = dirname(__filename);

    // Build real absolute paths
    const modelFile = path.resolve(
      __dirname,
      `CdCli/app/mod-craft/workshop/${moduleType}/model/${dashedName}-module.model.js`,
    );
    const workflowFile = path.resolve(
      __dirname,
      `CdCli/app/mod-craft/workshop/${moduleType}/workflow/${dashedName}.create.workflow.js`,
    );

    CdLog.debug(`Model Path: ${modelFile}`);
    CdLog.debug(`Workflow Path: ${workflowFile}`);

    // Import dynamically using pathToFileURL
    const modelModule = await import(pathToFileURL(modelFile).href);
    const moduleDescriptor: CdModuleDescriptor = modelModule.getModuleModel();

    const workflowModule = await import(pathToFileURL(workflowFile).href);
    const WorkflowClass = workflowModule[`${pascalName}WorkFlow`];
    const workflowInstance = new WorkflowClass();
    const workflowModel: CiCdDescriptor = workflowInstance.createWorkFlow(
      moduleDescriptor,
      moduleType,
      token,
    );

    return { moduleDescriptor, workflowModel };
  }

  // async loadControllerDescriptor(name: string): Promise<CdControllerDescriptor> {
  //   // Load and return a controller descriptor dynamically
  // }

  // async loadModelDescriptor(name: string): Promise<CdControllerDescriptor> {
  //   // Load and return a model descriptor dynamically
  // }

  async run(
    moduleDescriptor: CdModuleDescriptor,
    descriptor: CiCdDescriptor,
  ): Promise<CdFxReturn<null>> {
    CdLog.debug('Starting CICdRunnerService::run()');
    const pipeline = descriptor?.cICdPipeline;

    if (!pipeline || !pipeline.stages) {
      return {
        state: false,
        message: 'No pipeline stages defined in workflow.',
      };
    }

    for (const stage of pipeline.stages) {
      for (const task of stage.tasks) {
        const result = await this.executeTask(task, moduleDescriptor);
        if (!result.state) {
          return {
            state: false,
            message: `Failed at task: ${task.name}`,
          };
        }
      }
    }

    return { state: true, message: 'Pipeline executed successfully.' };
  }

  /**
   * Executes a single CICdTask based on its type.
   * @param task - The task to execute.
   * @param descriptor - The module descriptor for context.
   * @returns A promise resolving to the result of the task execution.
   */
  async executeTask(
    task: CICdTask,
    descriptor: CdModuleDescriptor,
  ): Promise<CdFxReturn<null>> {
    CdLog.debug('Starting CICdRunnerService::executeTask()');
    try {
      switch (task.type) {
        case 'script-inline':
          return await this.runScript(task.executor, task.script);
        case 'script-file':
          return await this.runScriptFromFile(task.executor, task.scriptFile);
        case 'method':
          return await this.callMethod(
            task.className,
            task.methodName,
            task.input,
          );
        case 'cdRequest':
          return await this.invokeCdRequest(task.cdRequest);
        default:
          return { state: false, message: `Unknown task type: ${task.type}` };
      }
    } catch (err) {
      return {
        state: false,
        message: `Exception in task: ${task.name}. Error: ${(err as Error).message}`,
      };
    }
  }

  private async runScript(
    executor: ExecutionEnvironmentType,
    script?: string,
  ): Promise<CdFxReturn<null>> {
    CdLog.debug('Starting CICdRunnerService::runScript()');
    if (!script) return { state: false, message: 'No inline script provided.' };
    // Placeholder: implement real script runner
    console.log(`[${executor}] Running script: ${script}`);
    return { state: true, message: 'Script executed.' };
  }

  private async runScriptFromFile(
    executor: ExecutionEnvironmentType,
    scriptFile?: string,
  ): Promise<CdFxReturn<null>> {
    CdLog.debug('Starting CICdRunnerService::runScriptFromFile()');
    if (!scriptFile)
      return { state: false, message: 'No script file path provided.' };
    // Placeholder: simulate reading and running the script
    console.log(`[${executor}] Executing script file: ${scriptFile}`);
    return { state: true, message: 'Script file executed.' };
  }

  private async callMethod(
    className?: string,
    methodName?: string,
    input?: any,
  ): Promise<CdFxReturn<null>> {
    CdLog.debug('Starting CICdRunnerService::callMethod()');
    if (!className || !methodName)
      return { state: false, message: 'Missing class or method name.' };
    // Placeholder: simulate reflection call to service
    console.log(
      `[cd-cli] Calling ${className}.${methodName} with input:`,
      input,
    );
    return { state: true, message: 'Method called successfully.' };
  }

  private async invokeCdRequest(
    cdRequest?: ICdRequest,
  ): Promise<CdFxReturn<null>> {
    CdLog.debug('Starting CICdRunnerService::invokeCdRequest()');
    if (!cdRequest) {
      return { state: false, message: 'cdRequest is undefined or null.' };
    }

    const { ctx, m, c, a, args, dat } = cdRequest;

    try {
      // Resolve context directory
      const contextRoot = ctx === 'Sys' ? 'sys' : 'app';
      const moduleName = `${m}Module`;
      const controllerName = `${c}Controller`;

      // Construct full path
      const modulePath = `../../${contextRoot}/${moduleName}/controllers/${controllerName}`;
      const ControllerClass = (await import(modulePath))[controllerName];

      if (!ControllerClass) {
        return {
          state: false,
          message: `Controller not found: ${controllerName}`,
        };
      }

      const controllerInstance = new ControllerClass();

      if (typeof controllerInstance[a] !== 'function') {
        return { state: false, message: `Action method not found: ${a}` };
      }

      // Call the controller method with args and dat
      await controllerInstance[a](...(args ? Object.values(args) : []), dat);
      return { state: true, message: `cdRequest ${c}.${a} executed.` };
    } catch (err) {
      return {
        state: false,
        message: `Error executing cdRequest: ${(err as Error).message}`,
      };
    }
  }
}
