import path, { join } from 'path';
import ora from 'ora';
import { pathToFileURL } from 'url';
import { CdAssertReturn, CdFxReturn, CdFxStateLevel, ICdRequest } from '../../base/i-base.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import { CdCtx, CdModuleDescriptor } from '../models/cd-module-descriptor.model.js';
import {
  CiCdDescriptor,
  CICdPipeline,
  CICdTask,
  isCdFxReturnPipeline,
} from '../models/cicd-descriptor.model.js';
import { toDashedFileName } from '../../utils/request-helper.js';
import { inspect } from 'util';
import {
  ExecutionEnvironmentType,
  WFNext,
  WFNextRef,
} from '../../cd-scheduler/models/cd-scheduler.model.js';
// import { MOD_CRAFT_WORKSHOP_DIR } from "../../../app/app-craft/index.js";
import { DEV_DESCRIPTORS_SERVICE_DIR } from '../models/dev-descriptor.model.js';
import { CdModuleDescriptorService } from './cd-module-descriptor.service.js';
// import { MOD_CRAFT_WORKSHOP_DIR } from '../../../app/app-craft/index.js';
import { BaseService } from '../../base/base.service.js';
import { DevModeAction, getActionString } from '../../dev-mode/index.js';
import { MOD_CRAFT_WORKSHOP_DIR } from '../../../app/app-craft/models/app-craft.model.js';
import { CdAppService } from './cd-app.service.js';
import { AppType, repoRegistry, VersionControlDescriptor } from '../index.js';
import { executeCommand } from '../../utils/cmd.util.js';
import { checkIfRepoExists } from '../../../app/cd-auto-git/tests/cd-auto-git.test.js';
import { isAssertSuccessful, isCdFxReturnBoolean, runAssert } from '../../utils/cd-assert-utils.js';
import { VersionService } from './version.service.js';

/** Runner responsible for executing CICdTask logic */
export class CICdRunnerService {
  private b = new BaseService();
  currentPipelineName = '';
  currentStageName = '';

  /**
   * Sample Input for loadModuleDescriptorAndWorkflow()
   * DevModeAction.CREATE,
      cdObjType,
      moduleName,
      oEnv,
      {
        actionTargetName: actionTargetName,
        descriptor: 'CdModuleDescriptor',
        cdToken: '', // Pass the cdToken if needed
        repoName: repoName,
      },
   * 
      Sample input design for getting workflow file:
   * input: {
      cdObjName: 'cd-ai',
      cdObjType: 'cd-module', // actionTarget
      oEnv: 'workshop', // 'workshop' or 'test-bed'	
    }
   * @param action 
   * @param cdObjType 
   * @param cdObjName 
   * @param oEnv 
   * @param extraParams 
   * @returns 
   */
  async loadModuleDescriptorAndWorkflow(
    action: DevModeAction,
    cdObjType: string,
    cdObjName: string,
    oEnv: string,
    extraParams?: any,
  ): Promise<{
    descriptor: any;
    workflowModel: CiCdDescriptor | null;
    extraParams?: any;
  }> {
    CdLog.debug('Starting CICdRunnerService::loadModuleDescriptorAndWorkflow()');

    // CdLog.debug(
    //   `CICdRunnerService::loadModuleDescriptorAndWorkflow()/actiion:${action}, cdObjType: ${cdObjType}, actionTargetName: ${extraParams.actionTargetName} cdObjName:${cdObjName}, oEnv:${oEnv}, extraParams:${inspect(extraParams, { depth: 2 })}`,
    // );

    const dashedName = cdObjName.toLowerCase();
    CdLog.debug(`CICdRunnerService::loadModuleDescriptorAndWorkflow()/dashedName:${dashedName}`);
    const pascalName = dashedName
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join('');

    CdLog.debug(`CICdRunnerService::loadModuleDescriptorAndWorkflow()/pascalName:${pascalName}`);

    CdLog.debug(
      `CICdRunnerService::loadModuleDescriptorAndWorkflow()/DEV_DESCRIPTORS_SERVICE_DIR:${DEV_DESCRIPTORS_SERVICE_DIR}`,
    );

    CdLog.debug(`CICdRunnerService::loadModuleDescriptorAndWorkflow()/gwf-01-0`);
    const workflowFileResult = await this.getWorkFlow(
      action,
      cdObjType,
      cdObjName,
      oEnv,
      extraParams,
    );

    // CdLog.debug(
    //   `CICdRunnerService::loadModuleDescriptorAndWorkflow()/workflowFileResult:${inspect(workflowFileResult, { depth: 2 })}`,
    // );

    if (!workflowFileResult || !workflowFileResult.state) {
      CdLog.debug(`CICdRunnerService::loadModuleDescriptorAndWorkflow()/gwf-01-1`);
      return {
        descriptor: null,
        workflowModel: null,
        extraParams: null,
      };
    }

    if (!workflowFileResult.data) {
      CdLog.debug(`CICdRunnerService::loadModuleDescriptorAndWorkflow()/gwf-02`);
      return {
        descriptor: null,
        workflowModel: null,
        extraParams: null,
      };
    }
    CdLog.debug(`CICdRunnerService::loadModuleDescriptorAndWorkflow()/gwf-03`);
    const workflowFile = workflowFileResult.data.path;
    const descriptor = workflowFileResult.data.descriptor;

    // descriptor = result.data;

    CdLog.debug(
      `CICdRunnerService::loadModuleDescriptorAndWorkflow()/workflowFile:${workflowFile}`,
    );

    CdLog.debug(`CICdRunnerService::loadModuleDescriptorAndWorkflow()/descriptor:${descriptor}`);

    CdLog.debug(`CICdRunnerService::loadModuleDescriptorAndWorkflow()/pascalName:${pascalName}`);
    // Dynamically import workflow module and instantiate
    if (!workflowFile || typeof workflowFile !== 'string') {
      throw new Error('Workflow file path is not defined or not a string.');
    }

    const workflowModule = await import(pathToFileURL(workflowFile).href);
    const WorkflowClass = workflowModule[`${pascalName}WorkFlow`];
    const workflowInstance = new WorkflowClass();
    let workflowModel;
    switch (action) {
      case DevModeAction.CREATE:
        CdLog.debug(`CICdRunnerService::loadModuleDescriptorAndWorkflow()/switch/case:create`);
        workflowModel = workflowInstance.createWorkFlow(descriptor, oEnv, extraParams);
        break;
      case DevModeAction.READ:
        CdLog.debug(`CICdRunnerService::loadModuleDescriptorAndWorkflow()/switch/case:read`);
        workflowModel = workflowInstance.readWorkFlow(descriptor, oEnv, extraParams);
        break;
      case DevModeAction.UPDATE:
        CdLog.debug(`CICdRunnerService::loadModuleDescriptorAndWorkflow()/switch/case:update`);
        workflowModel = workflowInstance.updateWorkFlow(descriptor, oEnv, extraParams);
        break;
      case DevModeAction.DELETE:
        CdLog.debug(`CICdRunnerService::loadModuleDescriptorAndWorkflow()/switch/case:delete`);
        workflowModel = workflowInstance.deleteWorkFlow(descriptor, oEnv, extraParams);
        break;
      case DevModeAction.DERIVE:
        CdLog.debug(`CICdRunnerService::loadModuleDescriptorAndWorkflow()/switch/case:derive`);
        workflowModel = workflowInstance.deriveWorkFlow(descriptor, oEnv, extraParams);
        break;
      case DevModeAction.UPGRADE:
        CdLog.debug(`CICdRunnerService::loadModuleDescriptorAndWorkflow()/switch/case:upgrade`);
        workflowModel = workflowInstance.upgradeWorkFlow(descriptor, oEnv, extraParams);
        break;
      case DevModeAction.MIGRATE:
        CdLog.debug(`CICdRunnerService::loadModuleDescriptorAndWorkflow()/switch/case:migrate`);
        workflowModel = workflowInstance.migrateWorkFlow(descriptor, oEnv, extraParams);
        break;
    }

    return {
      descriptor,
      workflowModel,
      extraParams,
    };
  }

  /**
   * 
   * 
   * expected input: {
      cdObjName: 'cd-ai',
      cdObjType: 'cd-module', // actionTarget
      oEnv: 'workshop', // 'workshop' or 'test-bed'	
    }
      
    cd-cli/dist/CdCli/app/app-craft/workshop/<cdObjType>/workflow/<oEnv>/<cdObjName>.workflow.js

   * @param action 
   * @param cdObjType 
   * @param cdObjName 
   * @param oEnv 
   * @param extraParams 
   * @returns 
   */
  async getWorkFlow(
    action: DevModeAction,
    cdObjType: string,
    cdObjName: string,
    oEnv: string,
    extraParams?: any,
  ): Promise<CdFxReturn<{ path: string; descriptor: any }>> {
    // CdLog.debug(
    //   `CICdRunnerService::getWorkFlow()/actiion:${action}, cdObjType: ${cdObjType}, actionTargetName: ${extraParams.actionTargetName} cdObjName:${cdObjName}, oEnv:${oEnv}, extraParams:${inspect(extraParams, { depth: 2 })}`,
    // );
    try {
      extraParams.oEnv = oEnv;
      const dashedName = cdObjName.toLowerCase();
      CdLog.debug(`CICdRunnerService::getWorkFlow()/dashedName:${dashedName}`);
      const svVersion = new VersionService();
      const appType = svVersion.getAppTypeFromRepoName(extraParams.repoName, repoRegistry);
      CdLog.debug(`CICdRunnerService::getWorkFlow()/appType:${appType}`);

      // Examples:
      // /home/emp-12/cd-cli/src/CdCli/app/app-craft/workshop/cd-module/workflow/test-bed/cd-ai.workflow.ts
      // /home/emp-12/cd-cli/src/CdCli/app/app-craft/workshop/cd-app/workflow/test-bed/cd-api.workflow.ts
      let aType = '';
      if (extraParams.actionTargetName === 'cd-app') {
        aType = 'cd-app';
      } else {
        aType = appType ?? '';
      }
      const workflowFile = join(
        MOD_CRAFT_WORKSHOP_DIR,
        aType,
        'workflow',
        oEnv,
        `${dashedName}.workflow.js`,
      );

      // CdLog.debug(`Model Path: ${modelFile}`);
      CdLog.debug(
        `CICdRunnerService::loadModuleDescriptorAndWorkflow()/workflowFile: ${workflowFile}`,
      );

      let descriptor: any;
      let result: CdFxReturn<any>;

      /**
       * Load module descriptor based on type
       * - CdModuleDescriptor
       * - CdAppDescriptor
       */
      // CdLog.debug(
      //   `CICdRunnerService::loadModuleDescriptorAndWorkflow()/Loading descriptor for type: ${extraParams?.descriptor}`,
      // );
      switch (extraParams.descriptor) {
        case 'CdModuleDescriptor':
          CdLog.debug(
            `CICdRunnerService::loadModuleDescriptorAndWorkflow()/case:CdModuleDescriptor-01`,
          );
          const svCdModuleDescriptor = new CdModuleDescriptorService();
          CdLog.debug(
            `CICdRunnerService::loadModuleDescriptorAndWorkflow()/case:CdModuleDescriptor-02`,
          );
          result = await svCdModuleDescriptor.cdApiModuleData(cdObjName, cdObjType, extraParams);
          if (!result || !result.state) {
            CdLog.debug(
              `CICdRunnerService::loadModuleDescriptorAndWorkflow()/Failed to load module descriptor: ${result.message}`,
            );
            throw new Error(`Failed to load module descriptor: ${result.message}`);
          }
          descriptor = result.data;
          // check for conuterparts...
          CdLog.debug(`CICdRunnerService::loadModuleDescriptorAndWorkflow()/descriptor.models:${inspect(descriptor.models, {depth: 4})}`,);
          CdLog.debug(`CICdRunnerService::loadModuleDescriptorAndWorkflow()/descriptor.models[0]:${inspect(descriptor.models[0], {depth: 4})}`,);
          CdLog.debug(`CICdRunnerService::loadModuleDescriptorAndWorkflow()/descriptor.models[0].relationships:${inspect(descriptor.models[0].relationships, {depth: 4})}`,);
          this.b.logWithContext(
            this,
            'loadModuleDescriptorAndWorkflow()/descriptor.models[0]3',
            descriptor.models[0],
            'debug',
          );
          // check for dependencies...
          this.b.logWithContext(
            this,
            'cdApiModuleData:cdApiModuleData.descriptor[0].dependencies',
            descriptor.controllers[0].dependencies,
            'debug',
          );

          break;
        case 'CdAppDescriptor':
          if (!appType) {
            throw new Error('appType is required and must be of type AppType.');
          }
          const svCdAppDescriptor = new CdAppService();
          result = await svCdAppDescriptor.deriveCdAppDescriptor(
            DevModeAction.DERIVE,
            cdObjName,
            appType,
            oEnv,
            extraParams,
          );
          // CdLog.debug(
          //   `CICdRunnerService::loadModuleDescriptorAndWorkflow()/moduleDescriptor3:${inspect(
          //     result,
          //     {
          //       depth: 2,
          //     },
          //   )}`,
          // );
          if (!result || !result.state) {
            CdLog.debug(
              `CICdRunnerService::loadModuleDescriptorAndWorkflow()/Failed to load module descriptor: ${result.message}`,
            );
            throw new Error(`Failed to load module descriptor: ${result.message}`);
          }

          if (!result.data) {
            CdLog.debug(
              `CICdRunnerService::loadModuleDescriptorAndWorkflow()/No module descriptor data returned.`,
            );
            throw new Error(`No module descriptor data returned.`);
          }

          // CdLog.debug(
          //   `CICdRunnerService::loadModuleDescriptorAndWorkflow()/moduleDescriptor4:${inspect(result.data.controllers, { depth: 2 })}`,
          // );
          descriptor = result.data;
          // CdLog.debug(
          //   `CICdRunnerService::loadModuleDescriptorAndWorkflow()/descriptor:${inspect(descriptor, { depth: 2 })}`,
          // );
          break;
      }
      if (!workflowFile) {
        return {
          state: false,
          data: null,
          message: `CiCdRunnerService::getWorkFlowPath: could not resolve the location of the workflow file.`,
        };
      }

      // if(workflowFile){
      //   throw new Error(`Process stoped for observation!`);
      // }
      return {
        state: true,
        data: { path: workflowFile, descriptor: descriptor },
      };
    } catch (e) {
      return {
        state: false,
        data: null,
        message: `CiCdRunnerService::getWorkFlowPath: Error:${(e as Error).message}`,
      };
    }
  }

  // async run(
  //   descriptor: any, // CdModuleDescriptor or CdAppDescriptor or other descriptor type
  //   workflowData: CiCdDescriptor,
  //   extraParams?: any,
  // ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
  //   CdLog.debug('Starting CICdRunnerService::run()');
  //   CdLog.debug('CICdRunnerService::run()/01');

  //   const pipeline = workflowData?.cICdPipeline;
  //   this.currentPipelineName = pipeline?.name ?? '';

  //   if (!pipeline?.stages?.length) {
  //     CdLog.debug('CICdRunnerService::run()/02');
  //     return { state: false, message: 'No pipeline stages defined.' };
  //   }

  //   const taskMap = new Map<string, CICdTask>();
  //   for (const stage of pipeline.stages) {
  //     CdLog.debug('CICdRunnerService::run()/03');
  //     for (const task of stage.tasks) {
  //       CdLog.debug('CICdRunnerService::run()/04');
  //       const key = `${stage.name}/${task.name}`;
  //       taskMap.set(key, task);
  //     }
  //   }

  //   let currentStage = pipeline.stages[0];
  //   let currentTask = currentStage.tasks[0];
  //   this.currentStageName = currentStage.name;

  //   const visited = new Set<string>();

  //   while (currentTask) {
  //     CdLog.debug('CICdRunnerService::run()/05');
  //     const taskKey = `${this.currentStageName}/${currentTask.name}`;
  //     if (visited.has(taskKey)) {
  //       CdLog.debug('CICdRunnerService::run()/06');
  //       return {
  //         state: false,
  //         message: `Loop detected at task: ${currentTask.name}`,
  //       };
  //     }
  //     CdLog.debug('CICdRunnerService::run()/07');
  //     visited.add(taskKey);

  //     currentTask.status = 'running';
  //     const result = await this.executeTaskWithPolicies(currentTask, descriptor);
  //     CdLog.debug('CICdRunnerService::run()/result:' + inspect(result, { depth: 2 }));
  //     CdLog.debug('CICdRunnerService::run()/08');
  //     currentTask.status = result.state ? 'completed' : 'failed';

  //     const nextRef = this.resolveNextTask(currentTask, result.state as CdFxStateLevel);
  //     CdLog.debug(`CICdRunnerService::run()/nextRef:${inspect(nextRef, { depth: 2 })}`);
  //     if (!nextRef) break;

  //     CdLog.debug('CICdRunnerService::run()/09');
  //     const pipelineName = nextRef.pipelineName ?? this.currentPipelineName;
  //     const stageName = nextRef.stageName ?? this.currentStageName;
  //     const taskName = nextRef.taskName;

  //     if (pipelineName !== this.currentPipelineName) {
  //       CdLog.debug('CICdRunnerService::run()/10');
  //       return {
  //         state: false,
  //         message: `Cross-pipeline transition not supported: ${pipelineName}`,
  //       };
  //     }

  //     const nextKey = `${stageName}/${taskName}`;
  //     const nextTask = taskMap.get(nextKey);

  //     if (!nextTask) {
  //       CdLog.debug('CICdRunnerService::run()/11');
  //       return {
  //         state: false,
  //         message: `Next task "${taskName}" in stage "${stageName}" not found.`,
  //       };
  //     }

  //     this.currentStageName = stageName;
  //     currentTask = nextTask;
  //   }

  //   CdLog.debug('CICdRunnerService::run()/12');
  //   if (extraParams?.testTasks != null) {
  //     CdLog.debug('🔍 testTasks=true — Initiating CICdRunnerService::test()');
  //     const testResult = await this.test(descriptor, extraParams);
  //     return {
  //       state: testResult.state === CdFxStateLevel.Success,
  //       message: `Run complete. ${testResult.message}`,
  //       data: testResult.data,
  //     };
  //   }

  //   return { state: true, message: 'Pipeline executed successfully.' };
  // }
  async run(
    descriptor: any,
    workflowData: CiCdDescriptor,
    extraParams?: any,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    CdLog.debug('Starting CICdRunnerService::run()');

    const pipeline = workflowData?.cICdPipeline;
    this.currentPipelineName = pipeline?.name ?? '';

    if (!pipeline?.stages?.length) {
      return { state: false, message: 'No pipeline stages defined.' };
    }

    const taskMap = new Map<string, CICdTask>();
    for (const stage of pipeline.stages) {
      for (const task of stage.tasks) {
        const key = `${stage.name}/${task.name}`;
        taskMap.set(key, task);
      }
    }

    let currentStage = pipeline.stages[0];
    let currentTask = currentStage.tasks[0];
    this.currentStageName = currentStage.name;

    const visited = new Set<string>();
    const taskResults: { stage: string; task: string; state: CdFxStateLevel; message: string }[] =
      [];

    while (currentTask) {
      const taskKey = `${this.currentStageName}/${currentTask.name}`;
      if (visited.has(taskKey)) {
        return {
          state: false,
          message: `Loop detected at task: ${currentTask.name}`,
        };
      }
      visited.add(taskKey);

      currentTask.status = 'running';
      const result = await this.executeTaskWithPolicies(currentTask, descriptor);
      CdLog.debug('CICdRunnerService::run()/result:' + inspect(result, { depth: 2 }));

      taskResults.push({
        stage: this.currentStageName,
        task: currentTask.name,
        state: result.state as CdFxStateLevel,
        message: result.message ?? '',
      });

      currentTask.status = result.state ? 'completed' : 'failed';

      const nextRef = this.resolveNextTask(currentTask, result.state as CdFxStateLevel);
      if (!nextRef) break;

      if ((nextRef.pipelineName ?? this.currentPipelineName) !== this.currentPipelineName) {
        return {
          state: false,
          message: `Cross-pipeline transition not supported: ${nextRef.pipelineName}`,
        };
      }

      const nextKey = `${nextRef.stageName ?? this.currentStageName}/${nextRef.taskName}`;
      const nextTask = taskMap.get(nextKey);

      if (!nextTask) {
        return {
          state: false,
          message: `Next task "${nextRef.taskName}" not found in stage "${nextRef.stageName}"`,
        };
      }

      this.currentStageName = nextRef.stageName ?? this.currentStageName;
      currentTask = nextTask;
    }

    // 🔍 Summary logging
    CdLog.debug('CICdRunnerService::run() — Task Summary:');
    taskResults.forEach((r) => {
      CdLog.debug(`Stage: ${r.stage}, Task: ${r.task}, State: ${r.state}, Message: ${r.message}`);
    });

    const hasFailure = taskResults.some((r) => r.state !== CdFxStateLevel.Success);
    if (hasFailure) {
      return {
        state: CdFxStateLevel.LogicalFailure,
        message: 'One or more tasks failed.',
        data: taskResults,
      };
    }

    return {
      state: true,
      message: 'Pipeline executed successfully.',
      data: taskResults,
    };
  }

  async test(
    descriptor: { versionControl?: VersionControlDescriptor; ctx: CdCtx; moduleName?: string },
    // appType: AppType,
    extraParams?: any,
  ): Promise<CdFxReturn<CdAssertReturn[]>> {
    const results: CdAssertReturn[] = [];

    try {
      CdLog.debug(`🔍 CICdRunnerService::test() called`);

      if (!descriptor.versionControl) {
        CdLog.warning(`⚠️ Descriptor missing 'versionControl' property.`);
        return {
          state: CdFxStateLevel.LogicalFailure,
          message: `Descriptor missing versionControl`,
          data: results,
        };
      }

      let roadmapResult: any = null;
      const svVersion = new VersionService();
      CdLog.debug(`ICdRunnerService::test()/descriptor: ${inspect(descriptor, { depth: 2 })}`);
      CdLog.debug(`ICdRunnerService::test()/extraParams: ${inspect(extraParams, { depth: 2 })}`);
      switch (extraParams.descriptor) {
        case 'CdModuleDescriptor':
          CdLog.debug(`CICdRunnerService::test()/case:CdModuleDescriptor`);
          /**
           * If module descriptor is provided, ctx and moduleName are used to fetch roadmap data.
           */
          roadmapResult = await svVersion.getRoadMapData(
            descriptor.versionControl,
            extraParams.appType,
            {
              ctx: descriptor.ctx,
              moduleName: descriptor.moduleName || '',
            },
          );
          break;
        case 'CdAppDescriptor':
          CdLog.debug(`CICdRunnerService::test()/case:CdAppDescriptor`);
          /**
           * If app descriptor is provided, ctx and moduleName are NOT required to fetch roadmap data.
           */
          roadmapResult = await svVersion.getRoadMapData(
            descriptor.versionControl,
            extraParams.appType,
          );
          break;
        default:
          CdLog.warning(`⚠️ Unsupported descriptor type: ${extraParams.descriptor}`);
          return {
            state: CdFxStateLevel.LogicalFailure,
            message: `Unsupported descriptor type: ${extraParams.descriptor}`,
            data: results,
          };
      }

      if (!isCdFxReturnPipeline(roadmapResult)) {
        CdLog.warning(`⚠️ Roadmap result is not a valid CICdPipeline response`);
        return {
          state: CdFxStateLevel.SystemError,
          message: `Invalid roadmap result format`,
          data: results,
        };
      }

      const pipeline = roadmapResult.data;

      if (!pipeline?.stages?.length) {
        CdLog.warning(`⚠️ No pipeline stages found in roadmap`);
        return {
          state: CdFxStateLevel.NotFound,
          message: `No pipeline stages found in roadmap`,
          data: results,
        };
      }

      CdLog.debug(`🛠 Total Stages: ${pipeline.stages.length}`);

      for (const stage of pipeline.stages) {
        CdLog.debug(`🔄 Executing Stage: ${stage.name}, Tasks: ${stage.tasks.length}`);

        for (const task of stage.tasks) {
          CdLog.debug(`➡️ Task: ${task.name}`);

          if (!task.assert) {
            CdLog.debug(`⏭ Task skipped (no assertion defined)`);
            continue;
          }

          CdLog.debug(`⚙️ Running assertion for task: ${task.name}`);
          const result = await this.executeAssertTest(task.assert, task);

          if (!isCdFxReturnBoolean(result)) {
            CdLog.warning(`❌ Invalid result format returned for task '${task.name}'`);
            results.push({
              data: false,
              state: CdFxStateLevel.SystemError,
              message: 'Invalid assertion result format.',
            });
            task.status = 'failed';
            continue;
          }

          CdLog.debug(`📥 Assertion result for '${task.name}': ${result.data}`);
          results.push(result);
          task.status = isAssertSuccessful(result) ? 'completed' : 'failed';
          CdLog.debug(`📌 Task '${task.name}' marked as '${task.status}'`);
        }
      }

      const failedCount = results.filter((r) => !isAssertSuccessful(r)).length;
      const passedCount = results.length - failedCount;
      const state = failedCount === 0 ? CdFxStateLevel.Success : CdFxStateLevel.PartialSuccess;

      CdLog.debug(`✅ All assertions completed → Passed: ${passedCount}, Failed: ${failedCount}`);

      return {
        state,
        message: `Test assertions complete: ${passedCount} passed, ${failedCount} failed.`,
        data: results,
      };
    } catch (error: any) {
      CdLog.warning(`💥 Fatal error during test(): ${error.message}`);
      return {
        state: CdFxStateLevel.Fatal,
        message: `Assertion test error: ${error.message}`,
        data: results,
      };
    }
  }

  // private async executeTaskWithPolicies(
  //   task: CICdTask,
  //   moduleDescriptor: CdModuleDescriptor,
  // ): Promise<CdFxReturn<null>> {
  //   CdLog.debug('Starting CICdRunnerService::executeTaskWithPolicies()');
  //   CdLog.debug('CICdRunnerService::executeTaskWithPolicies()/01');
  //   let attempts = 0;
  //   const maxAttempts = task.retryCount ?? 1;

  //   while (attempts < maxAttempts) {
  //     try {
  //       const timeout = task.timeout ?? 60000; // default 60s
  //       const result = await Promise.race([
  //         this.executeTask(task, moduleDescriptor),
  //         new Promise<CdFxReturn<null>>((_, reject) =>
  //           setTimeout(() => reject(new Error('Timeout')), timeout),
  //         ),
  //       ]);

  //       CdLog.debug(
  //         `CICdRunnerService::executeTaskWithPolicies()/result:${inspect(result, { depth: 2 })}`,
  //       );
  //       CdLog.debug('CICdRunnerService::executeTaskWithPolicies()/02');

  //       if (result.state as CdFxStateLevel) return result;
  //       attempts++;
  //       if (attempts < maxAttempts && task.retryDelay) {
  //         CdLog.debug('CICdRunnerService::executeTaskWithPolicies()/03');
  //         await this.sleep(task.retryDelay);
  //       }
  //     } catch (e) {
  //       CdLog.debug('CICdRunnerService::executeTaskWithPolicies()/04');
  //       CdLog.debug(
  //         `CICdRunnerService::executeTaskWithPolicies()/Task ${
  //           task.name
  //         } failed with error: ${(e as Error).message}`,
  //       );
  //       attempts++;
  //     }
  //   }
  //   CdLog.debug('CICdRunnerService::executeTaskWithPolicies()/05');
  //   return {
  //     state: false,
  //     message: `Task ${task.name} failed after ${maxAttempts} attempts.`,
  //   };
  // }
  private async executeTaskWithPolicies(
    task: CICdTask,
    moduleDescriptor: CdModuleDescriptor,
  ): Promise<CdFxReturn<null>> {
    CdLog.debug('▶️ Starting CICdRunnerService::executeTaskWithPolicies()');
    let attempts = 0;
    const maxAttempts = task.retryCount ?? 1;
    const timeout = task.timeout ?? 60000;

    while (attempts < maxAttempts) {
      const spinner = ora(
        `⏳ Running task '${task.name}' (Attempt ${attempts + 1}/${maxAttempts})...`,
      ).start();
      try {
        const result = await Promise.race([
          this.executeTask(task, moduleDescriptor),
          new Promise<CdFxReturn<null>>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout: Task exceeded allowed time')), timeout),
          ),
        ]);

        CdLog.debug(
          `CICdRunnerService::executeTaskWithPolicies()/result:${inspect(result, { depth: 2 })}`,
        );

        const stateCode =
          result.state === true
            ? CdFxStateLevel.Success
            : result.state === false
              ? CdFxStateLevel.Error
              : result.state; // already a number (enum)

        if (stateCode === CdFxStateLevel.Success) {
          spinner.succeed(`✅ Task '${task.name}' succeeded.`);
        } else if (stateCode === CdFxStateLevel.Error) {
          spinner.fail(`❌ Task '${task.name}' failed`);
          return {
            state: false,
            message: result.message || `Task '${task.name}' failed.`,
          };
        } else {
          spinner.info(`🔁 Task '${task.name}' processed.`);
        }

        if (result.state as CdFxStateLevel) return result;

        attempts++;
        if (attempts < maxAttempts && task.retryDelay) {
          spinner.info(`🔁 Retrying task '${task.name}' in ${task.retryDelay}ms...`);
          await this.sleep(task.retryDelay);
        }
      } catch (e) {
        spinner.fail(`❌ Task '${task.name}' failed: ${(e as Error).message}`);
        CdLog.error(
          `Task '${task.name}' failed on attempt ${attempts + 1}: ${(e as Error).message}`,
        );
        attempts++;

        if (attempts < maxAttempts && task.retryDelay) {
          CdLog.debug(`Waiting ${task.retryDelay}ms before next attempt...`);
          await this.sleep(task.retryDelay);
        }
      }
    }

    const errorMessage = `🚫 Task '${task.name}' failed after ${maxAttempts} attempt(s).`;
    CdLog.error(errorMessage);
    return {
      state: CdFxStateLevel.LogicalFailure,
      message: errorMessage,
    };
  }

  public async executeAssertTest(
    assertRequest: ICdRequest,
    // moduleDescriptor: CdModuleDescriptor,
    task: CICdTask,
  ): Promise<CdAssertReturn> {
    CdLog.debug(`CICdRunnerService::executeAssertTest() → ${task.name}`);

    const maxAttempts = task.retryCount ?? 1;
    const delay = task.retryDelay ?? 0;
    const timeout = task.timeout ?? 30000;

    CdLog.debug(`→ Config: maxAttempts=${maxAttempts}, delay=${delay}ms, timeout=${timeout}ms`);
    CdLog.debug(`→ AssertRequest: ${JSON.stringify(assertRequest)}`);
    // CdLog.debug(`→ ModuleDescriptor: ${JSON.stringify(moduleDescriptor)}`);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        CdLog.debug(`→ Starting attempt ${attempt} of ${maxAttempts}`);

        const result: CdAssertReturn = await Promise.race([
          this.runAssert(assertRequest),
          new Promise<CdAssertReturn>((_, reject) =>
            setTimeout(() => {
              CdLog.debug(`⏱️ Timeout reached after ${timeout}ms`);
              reject(new Error('Timeout'));
            }, timeout),
          ),
        ]);

        CdLog.debug(`→ Result from runAssert(): ${JSON.stringify(result)}`);

        if (result.data === true) {
          CdLog.debug(`✅ Assertion succeeded on attempt ${attempt}`);
          return {
            data: true,
            state: CdFxStateLevel.Success,
            message: `Assertion passed on attempt ${attempt} for task '${task.name}'`,
          };
        } else {
          CdLog.warning(`❌ Assert attempt ${attempt} returned false.`);
        }
      } catch (err) {
        CdLog.warning(`❌ Assert attempt ${attempt} failed: ${(err as Error).message}`);
      }

      if (attempt < maxAttempts && delay > 0) {
        CdLog.debug(`⏳ Waiting for ${delay}ms before next attempt...`);
        await this.sleep(delay);
      }
    }

    CdLog.debug(`❌ All ${maxAttempts} attempts failed for task '${task.name}'`);
    return {
      data: false,
      state: CdFxStateLevel.Error,
      message: `Assertion failed after ${maxAttempts} attempts for task '${task.name}'`,
    };
  }

  private async runAssert(assertRequest: ICdRequest): Promise<CdAssertReturn> {
    const baseService = new BaseService();
    return await baseService.invokeCdRequest<boolean>(assertRequest);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private resolveNextTask(task: CICdTask, success: CdFxStateLevel): WFNext | null {
    const resultKey: CdFxStateLevel = success ? CdFxStateLevel.Success : CdFxStateLevel.Error;

    if (!task.onResult || !Array.isArray(task.onResult)) return null;

    // 1. Try exact match: check single or array match
    for (const rule of task.onResult) {
      const match = Array.isArray(rule.ifState)
        ? rule.ifState.includes(resultKey)
        : rule.ifState === resultKey;

      if (match) {
        return this.normalizeWFNext(rule.toTask, {
          currentPipeline: this.currentPipelineName,
          currentStage: this.currentStageName,
        });
      }
    }

    // 2. Fallback: no ifState means always
    const alwaysRule = task.onResult.find((r) => r.ifState === undefined);
    return alwaysRule
      ? this.normalizeWFNext(alwaysRule.toTask, {
          currentPipeline: this.currentPipelineName,
          currentStage: this.currentStageName,
        })
      : null;
  }

  normalizeWFNext(
    next: WFNextRef,
    context: { currentPipeline: string; currentStage: string },
  ): WFNext {
    if (typeof next === 'string') {
      return {
        pipelineName: context.currentPipeline,
        stageName: context.currentStage,
        taskName: next,
      };
    }
    return {
      pipelineName: next.pipelineName ?? context.currentPipeline,
      stageName: next.stageName ?? context.currentStage,
      taskName: next.taskName,
    };
  }

  /**
   * Executes a single CICdTask based on its type.
   * @param task - The task to execute.
   * @param descriptor - The module descriptor for context.
   * @returns A promise resolving to the result of the task execution.
   */
  async executeTask(task: CICdTask, descriptor: CdModuleDescriptor): Promise<CdFxReturn<null>> {
    CdLog.debug('Starting CICdRunnerService::executeTask()');
    CdLog.debug(`CICdRunnerService::executeTask()/task:${inspect(task, { depth: 1 })}`);
    CdLog.debug(`CICdRunnerService::executeTask()/task.type:${task.type}`);
    // CdLog.debug(`CICdRunnerService::executeTask()/descriptor:${inspect(descriptor, { depth: 1 })}`);
    try {
      switch (task.type) {
        case 'script-inline':
          CdLog.debug('Running case: script-inline');
          return await this.runScript(task.executor, task.script);
        case 'script-file':
          CdLog.debug('Running case: script-file');
          return await this.runScriptFromFile(task.executor, task.scriptFile);
        case 'method':
          CdLog.debug('Running case: method');
          if (!task.cdRequest) {
            return {
              state: false,
              message: 'cdRequest is undefined for method task.',
            };
          }
          return await this.callMethodFromCdRequest(task.cdRequest);
        case 'cdRequest':
          CdLog.debug('Running case: cdRequest');
          const b = new BaseService();
          return await b.invokeCdRequest(task.cdRequest);
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
    if (!scriptFile) return { state: false, message: 'No script file path provided.' };
    // Placeholder: simulate reading and running the script
    console.log(`[${executor}] Executing script file: ${scriptFile}`);
    return { state: true, message: 'Script file executed.' };
  }

  async callMethod(
    className?: string,
    methodName?: string,
    input?: any,
  ): Promise<CdFxReturn<null>> {
    CdLog.debug('Starting CICdRunnerService::callMethod()');
    CdLog.debug(`CICdRunnerService::callMethod()/01`);
    if (!className || !methodName) CdLog.debug(`CICdRunnerService::callMethod()/02`);
    return { state: false, message: 'Missing class or method name.' };
    // // Placeholder: simulate reflection call to service
    // console.log(
    //   `[cd-cli] Calling ${className}.${methodName} with input:`,
    //   input
    // );
    // return { state: true, message: "Method called successfully." };
  }

  // async callMethodFromCdRequest<T = any>(cdRequest: ICdRequest): Promise<CdFxReturn<T>> {
  //   CdLog.debug('Starting CICdRunnerService::callMethodFromCdRequest()');
  //   // CdLog.debug(`CICdRunnerService::callMethodFromCdRequest()/01`);
  //   let { ctx, m, c, a, args, dat } = cdRequest;

  //   if (!ctx || !m || !c || !a) {
  //     // CdLog.debug(`CICdRunnerService::callMethodFromCdRequest()/02`);
  //     return {
  //       state: false,
  //       message: 'Incomplete cdRequest — requires ctx, m, c, and a',
  //     };
  //   }

  //   try {
  //     // CdLog.debug(`CICdRunnerService::callMethodFromCdRequest()/03`);
  //     const ctlDashedName = toDashedFileName(c, 'controller');
  //     // CdLog.debug(`CICdRunnerService::callMethodFromCdRequest()/04`);
  //     // CdLog.debug(`CICdRunnerService::callMethodFromCdRequest()/ctlDashedName:${ctlDashedName}`);
  //     const controllerPath = `../../../${ctx}/${m}/controllers/${ctlDashedName}`;
  //     // CdLog.debug(`CICdRunnerService::callMethodFromCdRequest()/05`);
  //     // CdLog.debug(`CICdRunnerService::callMethodFromCdRequest()/controllerPath:${controllerPath}`);

  //     // Dynamic ESM import (MUST include .js in helper-generated name)
  //     const controllerModule = await import(controllerPath);
  //     // CdLog.debug(`CICdRunnerService::callMethodFromCdRequest()/06`);
  //     // CdLog.debug(
  //     //   `CICdRunnerService::callMethodFromCdRequest()/controllerModule:${inspect(controllerModule, {
  //     //     depth: 3,
  //     //   })}`,
  //     // );
  //     c = `${c}Controller`;
  //     // CdLog.debug(`CICdRunnerService::callMethodFromCdRequest()/c:${c}`);
  //     if (!controllerModule || !controllerModule[c]) {
  //       // CdLog.debug(`CICdRunnerService::callMethodFromCdRequest()/07`);
  //       return {
  //         state: false,
  //         message: `Controller class '${c}' not found in '${controllerPath}'`,
  //       };
  //     }

  //     // CdLog.debug(
  //     //   `CICdRunnerService::callMethodFromCdRequest()/{ctx:${ctx},m:${m},c:${c},a:${a},}`,
  //     // );

  //     const ControllerClass = controllerModule[c];
  //     // CdLog.debug(`CICdRunnerService::callMethodFromCdRequest()/08`);
  //     const controllerInstance = new ControllerClass();
  //     // CdLog.debug(`CICdRunnerService::callMethodFromCdRequest()/09`);
  //     if (typeof controllerInstance[a] !== 'function') {
  //       // CdLog.debug(`CICdRunnerService::callMethodFromCdRequest()/10`);
  //       return {
  //         state: false,
  //         message: `Method '${a}' not found on controller '${c}'`,
  //       };
  //     }

  //     // CdLog.debug(`CICdRunnerService::callMethodFromCdRequest()/11`);
  //     const argValues = args ? Object.values(args) : [];
  //     const resultControllerInstance: CdFxReturn<T> = await controllerInstance[a](
  //       ...argValues,
  //       dat,
  //     );
  //     this.b.logWithContext(this, 'resultControllerInstance', resultControllerInstance, 'debug');
  //     // CdLog.debug(`CICdRunnerService::callMethodFromCdRequest()/12`);
  //     return resultControllerInstance;
  //   } catch (e: any) {
  //     // CdLog.debug(`CICdRunnerService::callMethodFromCdRequest()/13`);
  //     CdLog.error(`CICdRunnerService::callMethodFromCdRequest error: ${(e as Error).message}`);
  //     return {
  //       state: false,
  //       message: 'Failed to invoke method from cdRequest',
  //       data: null,
  //     };
  //   }
  // }

  async callMethodFromCdRequest<T = any>(cdRequest: ICdRequest): Promise<CdFxReturn<T>> {
    CdLog.debug('Starting CICdRunnerService::callMethodFromCdRequest()');
    let { ctx, m, c, a, args, dat } = cdRequest;

    if (!ctx || !m || !c || !a) {
      return {
        state: false,
        message: 'Incomplete cdRequest — requires ctx, m, c, and a',
        data: null,
      };
    }

    try {
      const ctlDashedName = toDashedFileName(c, 'controller');
      const controllerPath = `../../../${ctx}/${m}/controllers/${ctlDashedName}`;

      // Dynamic ESM import (MUST include .js in helper-generated name)
      const controllerModule = await import(controllerPath);

      c = `${c}Controller`;
      if (!controllerModule || !controllerModule[c]) {
        return {
          state: false,
          message: `Controller class '${c}' not found in '${controllerPath}'`,
          data: null,
        };
      }

      const ControllerClass = controllerModule[c];
      const controllerInstance = new ControllerClass();

      // 🔹 Run optional init()
      if (typeof controllerInstance.init === 'function') {
        try {
          this.b.logWithContext(this, `callMethodFromCdRequest:trying init()`, {}, 'debug');
          await controllerInstance.init();
        } catch (initErr: any) {
          CdLog.error(`Init failed in '${c}': ${(initErr as Error).message}`);
          return {
            state: false,
            message: `Initialization failed in controller '${c}'`,
            data: null,
          };
        }
      }
      else{

        // this.b.logWithContext(this, `callMethodFromCdRequest:No init() method detected`, {}, 'debug');
        // this.b.logWithContext(this, `callMethodFromCdRequest:controllerInstance`, inspect(controllerInstance, {depth:2}), 'debug');
      }

      // 🔹 Ensure target method exists
      if (typeof controllerInstance[a] !== 'function') {
        return {
          state: false,
          message: `Method '${a}' not found on controller '${c}'`,
          data: null,
        };
      }

      // 🔹 Invoke target method
      const argValues = args ? Object.values(args) : [];
      const resultControllerInstance: CdFxReturn<T> = await controllerInstance[a](
        ...argValues,
        dat,
      );
      this.b.logWithContext(this, 'resultControllerInstance', resultControllerInstance, 'debug');

      return resultControllerInstance;
    } catch (e: any) {
      CdLog.error(`CICdRunnerService::callMethodFromCdRequest error: ${(e as Error).message}`);
      return {
        state: false,
        message: `Failed to invoke method from cdRequest:${(e as Error).message}`,
        data: null,
      };
    }
  }
}
