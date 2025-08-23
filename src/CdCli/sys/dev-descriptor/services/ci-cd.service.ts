import chalk from 'chalk';
import Table from 'cli-table3';

import {
  type CiCdDescriptor,
  CICdPipeline,
  CICdStage,
  CiCdTaskResult,
  getCiCdByName,
  knownCiCds,
} from '../models/cicd-descriptor.model.js';
/* eslint-disable style/brace-style */
import { CD_FX_FAIL, CdFxStateLevel, type CdFxReturn } from '../../base/IBase.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import { CdObjModel } from '../../moduleman/models/cd-obj.model.js';
import { GenericService } from '../../base/generic-service.js';
import { executeCommand } from '../../utils/cmd.util.js';
import { join } from 'path';
import { MOD_CRAFT_WORKSHOP_DIR } from '../../../app/app-craft/models/app-craft.model.js';
import { DevModeAction } from '../../dev-mode/index.js';
import { AppType } from '../models/cd-app.model.js';
import { CdObjTypeModel } from '../../moduleman/index.js';
import { pathToFileURL } from 'url';
import { toCamelCase, toPascalCase } from '../../utils/cd-naming.util.js';
import { VersionService } from './version.service.js';
import { inspect } from 'util';
import { writePrettyFile } from '../../utils/fs.util.js';
import { CdAutoGitService } from '../../../app/cd-auto-git/services/cd-auto-git.service.js';

export class CiCdService extends GenericService<CdObjModel> {
  svCdAutoGit = new CdAutoGitService();
  constructor() {
    super(CdObjModel);
  }
  static async initializeStepMap<T extends { ciCd: CiCdDescriptor[] }>(
    context: any, // Service context (EnvironmentService, EnvironmentService, etc.)
    input: T,
    progressTracker: any, // Progress tracking service
  ): Promise<CdFxReturn<null>> {
    let allSuccessful = true; // Track overall success
    for (const ciCdDescriptor of input.ciCd) {
      if (!ciCdDescriptor.cICdPipeline || !ciCdDescriptor.cICdPipeline.stages) {
        CdLog.warning(`Skipping descriptor: cICdPipeline or its stages are undefined.`);
        allSuccessful = false;
        continue;
      }
      for (const stage of ciCdDescriptor.cICdPipeline.stages) {
        for (const task of stage.tasks) {
          const methodName = task.methodName;
          if (methodName && typeof context[methodName] === 'function') {
            // Resolve method dynamically
            const method = context[methodName] as (input?: T) => Promise<CdFxReturn<null>>;

            progressTracker.registerStep(
              task.name,
              async () => {
                try {
                  const result = await method(input); // ✅ Await method call
                  if (!result.state) {
                    allSuccessful = false; // If any task fails, mark overall failure
                    CdLog.error(`Task "${task.name}" failed: ${result.message || 'Unknown error'}`);
                  }
                  return result;
                } catch (error) {
                  allSuccessful = false; // Mark failure on exception
                  CdLog.error(`Task "${task.name}" encountered an error: ${error}`);
                  return {
                    state: false,
                    data: null,
                    message: `Exception: ${error}`,
                  };
                }
              },
              0,
            );
          } else {
            CdLog.warning(`Skipping task "${task.name}": No valid method found.`);
            allSuccessful = false;
          }
        }
      }
    }

    // Return aggregated success/failure response
    return {
      state: allSuccessful,
      data: null,
      message: allSuccessful
        ? 'All tasks executed successfully'
        : 'Some tasks failed. Check logs for details.',
    };
  }

  /**
   * Determines the next CICdStage in the pipeline relative to the currentVersion and milestone.
   * @param currentVersion e.g. 'rm-0.9.0'
   * @param pipeline The full CICdPipeline (e.g. from CiCdDescriptor.cICdPipeline)
   * @param currentMilestone Optional name or ID of the current milestone
   */
  async determineNextVersion(
    pipeline: CICdPipeline,
    currentVersion?: string,
  ): Promise<
    CdFxReturn<{
      nextStage: CICdStage | null;
      currentStage: CICdStage | null;
      currentVersion?: string;
      currentIndex: number;
      nextIndex: number;
    }>
  > {
    try {
      // Step 1: If version is not given, try to infer from Git
      if (!currentVersion) {
        const resolvedVersion = await this.resolveCurrentVersionFromGit();
        currentVersion = resolvedVersion === null ? undefined : resolvedVersion;
      }

      if (!currentVersion) {
        return {
          state: false,
          data: null,
          message: 'Current version could not be determined from Git.',
        };
      }

      // Step 2: Find current index in the pipeline
      const currentIndex = this.findStageIndexByName(pipeline, currentVersion);
      if (currentIndex === -1) {
        return {
          state: false,
          data: null,
          message: `Current version "${currentVersion}" not found in pipeline stages.`,
        };
      }

      // Step 3: Get current and next stages
      const currentStage = pipeline.stages[currentIndex];
      const nextStage = this.getNextStage(pipeline, currentIndex);

      return {
        state: true,
        data: {
          nextStage,
          currentStage,
          currentVersion,
          currentIndex,
          nextIndex: nextStage ? currentIndex + 1 : -1,
        },
        message: 'Successfully determined next stage in roadmap.',
      };
    } catch (err: any) {
      return {
        state: false,
        data: null,
        message: `Error determining next version: ${err.message}`,
      };
    }
  }

  private async resolveCurrentVersionFromGit(): Promise<string | null> {
    try {
      const tags = await executeCommand('git tag --sort=-creatordate');
      const tagList = tags.split('\n').filter(Boolean);
      return tagList.length > 0 ? tagList[0].trim() : null;
    } catch (err: any) {
      CdLog.warning(`Could not retrieve tags from Git: ${err.message}`);
      return null;
    }
  }

  private findStageIndexByName(pipeline: CICdPipeline, stageName: string): number {
    return pipeline.stages.findIndex(
      (stage) => stage.name.trim().toLowerCase() === stageName.trim().toLowerCase(),
    );
  }

  private getNextStage(pipeline: CICdPipeline, index: number): CICdStage | null {
    return index + 1 < pipeline.stages.length ? pipeline.stages[index + 1] : null;
  }

  async getCiCdByName(name): Promise<CdFxReturn<CiCdDescriptor>> {
    const ret = getCiCdByName(name, knownCiCds);
    if (!ret) {
      return {
        data: null,
        state: false,
        message: 'The data is invalid',
      };
    } else {
      return {
        data: ret,
        state: true,
      };
    }
  }

  /**
   *
   * @param cdObjName
   * @param appType
   * @param extraParams {action: DevModeAction,cdObjTypeName: CdObjType,descriptor:any}
   * @returns
   */
  async getWorkflow(
    // action: DevModeAction,
    cdObjName: string,
    appType: AppType,
    // cdObjTypeName: CdObjType,
    extraParams: any, // {action: DevModeAction,cdObjTypeName: CdObjType,descriptor:any}
  ): Promise<CdFxReturn<CICdPipeline>> {
    CdLog.debug(`CiCdService::getWorkflow()/cdObjName:${cdObjName}`);
    CdLog.debug(`CiCdService::getWorkflow()/appType:${appType}`);
    CdLog.debug(`CiCdService::getWorkflow()/extraParams:${inspect(extraParams, { depth: 2 })}`);
    CdLog.debug(
      `CiCdService::getWorkflow()/extraParams.cdObjType:${inspect(extraParams.cdObjType, { depth: 2 })}`,
    );
    CdLog.debug(
      `CiCdService::getWorkflow()/extraParams.cdObjType.cdObjTypeName: ${extraParams.cdObjType.cdObjTypeName}`,
    );
    // /home/emp-12/cd-cli/src/CdCli/app/app-craft/workshop/cd-api/workflow/cd-app/cd-api.workflow.ts
    //                     src/CdCli/app/app-craft/workshop/cd-api/workflow/cd-module/cd-ai.workflow.ts

    try {
      const cdObjCamel = toCamelCase(cdObjName);
      const svVersion = new VersionService();
      const versionDescriptor = await svVersion.getVersionControl(
        cdObjName,
        extraParams.cdObjType.cdObjTypeName,
        extraParams.appType,
        extraParams.oEnv,
      );
      CdLog.debug(
        `CiCdService::getWorkflow()/versionDescriptor:${inspect(versionDescriptor, { depth: 2 })}`,
      );
      extraParams.versionDescriptor = versionDescriptor;
      const pascalName = toPascalCase(cdObjName);
      let aType = '';
      if (extraParams.actionTargetName === 'cd-app') {
        aType = 'cd-app';
      } else {
        aType = appType;
      }
      // /home/emp-12/cd-cli/src/CdCli/app/app-craft/workshop/cd-app/workflow/test-bed/cd-api.workflow.ts
      const workflowPath = join(
        MOD_CRAFT_WORKSHOP_DIR,
        aType,
        'workflow',
        extraParams.cdObjType.cdObjTypeName,
        `${cdObjName}.workflow.js`,
      );
      CdLog.debug(`CiCdService::getWorkflow()/workflowPath:${workflowPath}`);
      CdLog.debug(`CiCdService::getWorkflow()/pascalName:${pascalName}`);
      // const workFlowModule = await import(workflowPath);
      // assign dynamically retrieved version control data
      CdLog.debug(`CiCdService::getWorkflow()/x01`);
      const workflowModule = await import(pathToFileURL(workflowPath).href);
      CdLog.debug(`CiCdService::getWorkflow()/x02`);
      const WorkflowClass = workflowModule[`${pascalName}WorkFlow`];
      CdLog.debug(`CiCdService::getWorkflow()/x03`);
      const workflowInstance = new WorkflowClass();
      CdLog.debug(`CiCdService::getWorkflow()/x04`);
      let workflowModel;
      switch (extraParams.action) {
        case DevModeAction.CREATE:
          CdLog.debug(`CICdService::loadModuleDescriptorAndWorkflow()/switch/case:create`);
          workflowModel = workflowInstance.createWorkFlow(
            extraParams.descriptor,
            extraParams.cdObjType.cdObjTypeName,
            extraParams,
          );
          break;
        case DevModeAction.READ:
          CdLog.debug(`CICdService::loadModuleDescriptorAndWorkflow()/switch/case:read`);
          workflowModel = workflowInstance.readWorkFlow(
            extraParams.descriptor,
            extraParams.cdObjType.cdObjTypeName,
            extraParams,
          );
          break;
        case DevModeAction.UPDATE:
          CdLog.debug(`CICdService::loadModuleDescriptorAndWorkflow()/switch/case:update`);
          workflowModel = workflowInstance.updateWorkFlow(
            extraParams.descriptor,
            extraParams.cdObjType.cdObjTypeName,
            extraParams,
          );
          break;
        case DevModeAction.DELETE:
          CdLog.debug(`CICdService::loadModuleDescriptorAndWorkflow()/switch/case:delete`);
          workflowModel = workflowInstance.deleteWorkFlow(
            extraParams.descriptor,
            extraParams.cdObjType.cdObjTypeName,
            extraParams,
          );
          break;
        case DevModeAction.DERIVE:
          CdLog.debug(`CiCdService::getWorkflow()/x04`);
          CdLog.debug(`CICdService::loadModuleDescriptorAndWorkflow()/switch/case:derive`);
          // deriveWorkFlow
          workflowModel = workflowInstance.deriveWorkFlow(
            extraParams.descriptor,
            extraParams.cdObjType.cdObjTypeName,
            extraParams,
          );
          break;
        case DevModeAction.UPGRADE:
          CdLog.debug(`CICdService::loadModuleDescriptorAndWorkflow()/switch/case:upgrade`);
          workflowModel = workflowInstance.upgradeWorkFlow(
            extraParams.descriptor,
            extraParams.cdObjType.cdObjTypeName,
            extraParams,
          );
          break;
        case DevModeAction.MIGRATE:
          CdLog.debug(`CICdService::loadModuleDescriptorAndWorkflow()/switch/case:migrate`);
          workflowModel = workflowInstance.migrateWorkFlow(
            extraParams.descriptor,
            extraParams.cdObjType.cdObjTypeName,
            extraParams,
          );
          break;
      }

      return {
        state: true,
        data: workflowModel,
      };
    } catch (e) {
      CdLog.error(`Error getting workflow by name: ${(e as Error).message}`);
      return {
        data: null,
        state: false,
        message: `Error getting workflow by name: ${(e as Error).message}`,
      };
    }
  }

  /**
   * Executes a terminal command, optionally within a custom working directory.
   * Useful for CI/CD automation workflows.
   */
  async execCmd(cmd: string, cwdOverride?: string): Promise<CdFxReturn<null>> {
    CdLog.debug(
      `[CICdRunnerService.execCmd] Running command: ${cmd} in ${cwdOverride || 'default cwd'}`,
    );
    try {
      const output = await executeCommand(cmd, cwdOverride);
      CdLog.debug(`[CICdRunnerService.execCmd] Command output:\n${output}`);
      return {
        state: CdFxStateLevel.Success,
        message: `Command executed successfully.`,
        data: null,
      };
    } catch (error: any) {
      CdLog.debug(
        `[CICdRunnerService.execCmd] Command failed with error: ${error?.message || error}`,
      );
      return {
        state: CdFxStateLevel.SystemError,
        message: `Failed to execute command: ${error?.message || 'Unknown error'}`,
        data: null,
      };
    }
  }

  /**
   * Creates a file at the specified path with the given contents.
   */
  async createFile(path: string, contents: string): Promise<CdFxReturn<null>> {
    const fs = await import('fs/promises');
    CdLog.debug(`[CICdRunnerService.createFile] Writing file at: ${path}`);
    try {
      // await fs.writeFile(path, contents, 'utf-8');
      await writePrettyFile(path, contents);
      CdLog.debug(`[CICdRunnerService.createFile] File written successfully.`);
      return {
        state: CdFxStateLevel.Success,
        message: `File created at ${path}`,
        data: null,
      };
    } catch (error: any) {
      CdLog.debug(
        `[CICdRunnerService.createFile] Failed to write file: ${error?.message || error}`,
      );
      return {
        state: CdFxStateLevel.SystemError,
        message: `Failed to create file: ${error?.message || 'Unknown error'}`,
        data: null,
      };
    }
  }

  printTaskSummary(tasks: CiCdTaskResult[]) {
    this.b.logWithContext(this, 'tasts', tasks, 'debug');
    const table = new Table({
      head: ['Stage', 'Task', 'Status', 'Message'],
      colWidths: [30, 30, 12, 60],
      wordWrap: true,
    });

    let successCount = 0;
    let failCount = 0;
    this.b.logWithContext(this, 'index', '01', 'debug');
    tasks.forEach((t) => {
      let status = '';
      if (t.state === true || t.state === 1) {
        status = chalk.green('✅ Success');
        successCount++;
      } else if (t.state === false || t.state === 0 || t.state === 2) {
        status = chalk.red('❌ Failed');
        failCount++;
      } else {
        status = chalk.yellow('⚠ Partial/Other');
      }

      table.push([t.stage, t.task, status, t.message]);
    });
    this.b.logWithContext(this, 'index', '02', 'debug');
    console.log('\n' + table.toString());
    console.log(
      chalk.bold(`\nSummary:`) +
        chalk.green(` ${successCount} succeeded`) +
        ', ' +
        chalk.red(`${failCount} failed`) +
        ', ' +
        chalk.yellow(`${tasks.length - successCount - failCount} warnings/other`) +
        '\n',
    );
    this.b.logWithContext(this, 'index', '03', 'debug');
    return { successCount, failCount, total: tasks.length };
  }
}
