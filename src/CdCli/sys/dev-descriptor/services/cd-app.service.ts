/* eslint-disable style/brace-style */
import { CD_FX_FAIL, type CdFxReturn, type CdRequest, type IQuery } from '../../base/i-base.js';
import type { CdDescriptor } from '../models/dev-descriptor.model.js';
import { HttpService } from '../../base/http.service.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import { CdObjModel } from '../../moduleman/models/cd-obj.model.js';
import { DevDescriptorService } from './dev-descriptor.service.js';
import { GenericService } from '../../base/generic-service.js';
import { CdAutoGitService } from '../../../app/cd-auto-git/services/cd-auto-git.service.js';
import { AppType, CdAppDescriptor } from '../models/cd-app.model.js';
import { VersionService } from './version.service.js';
import { join } from 'path';
// import {
//   MOD_CRAFT_WORKFLOW_DIR,
//   MOD_CRAFT_WORKSHOP_DIR,
// } from '../../../app/app-craft/workshop/cd-api/workflow/default.model.js';
import { readdirSync, readFileSync, statSync } from 'fs';
import { toCamelCase, toPascalCase } from '../../utils/cd-naming.util.js';
import { CdCtx, CdModuleDescriptor } from '../models/cd-module-descriptor.model.js';
import { inspect } from 'util';
import {
  CiCdDescriptor,
  CICdRunnerService,
  CiCdService,
  envCdApi,
  VersionControlDescriptor,
} from '../index.js';
import { CdModuleDescriptorService } from './cd-module-descriptor.service.js';
import { actionTargets, DevModeAction } from '../../dev-mode/index.js';
// import { App } from '~/app.js';
import { MOD_CRAFT_WORKFLOW_APP_DIR } from '../../../app/app-craft/models/default.model.js';
import { MOD_CRAFT_WORKSHOP_DIR } from '../../../app/app-craft/models/app-craft.model.js';

export class CdAppService extends GenericService<CdObjModel> {
  cdToken;
  svDevDescriptors;
  constructor() {
    super(CdObjModel);
    this.svDevDescriptors = new DevDescriptorService();
  }

  async cdAppData(
    action: DevModeAction,
    cdObjName: string,
    appType: AppType,
    oEnv: string,
    extraParams: any,
  ): Promise<CdFxReturn<CdAppDescriptor>> {
    try {
      CdLog.debug('CdModuleDescritorService::cdAppData()/01');
      CdLog.debug(
        `CdModuleDescritorService::cdAppData()/extraParams:${inspect(extraParams, { depth: 2 })}`,
      );
      // Build full path to the JSON descriptor
      const workflowPath = join(MOD_CRAFT_WORKFLOW_APP_DIR, `${cdObjName}.create.module.json`);

      // Read and parse custom module descriptor
      const fileContents = readFileSync(workflowPath, 'utf-8');
      // const custom: CdAppDescriptor = JSON.parse(fileContents);
      CdLog.debug('CdModuleDescritorService::cdAppData()/02');

      // set version control for the module
      // custom.versionControl = cdAiVersionControl;
      const svVersion = new VersionService();
      const vcResult = await svVersion.getVersionControl(
        cdObjName,
        extraParams.actionTargetName,
        extraParams.appType,
        oEnv,
      );
      if (!vcResult || !vcResult.state || !vcResult.data) {
        return {
          state: false,
          data: null,
          message: `Could not get a valid version controll for the module`,
        };
      }
      const cdAppVersionControl = vcResult.data;
      const cdAppDescriptorResult = await this.deriveCdAppDescriptor(
        action,
        cdObjName,
        appType,
        oEnv,
        extraParams,
      );
      if (!cdAppDescriptorResult || !cdAppDescriptorResult.state || !cdAppDescriptorResult.data) {
        return {
          state: false,
          data: null,
          message: `Could not derive CdAppDescriptor for ${cdObjName}`,
        };
      }
      const cdAppDescriptor = cdAppDescriptorResult.data;

      // Merge custom descriptor with derived descriptor
      CdLog.debug('CdModuleDescritorService::cdAppData()/03');

      return {
        state: true,
        message: 'Descriptors merged successfully.',
        data: cdAppDescriptor,
      };
    } catch (error: any) {
      return {
        state: false,
        message: `Failed to merge descriptors1: ${error.message}`,
        data: null,
      };
    }
  }

  async defaultCdAppData(customCdAppData: CdAppDescriptor): Promise<CdAppDescriptor> {
    // const cdObjName = customCdAppData.name;
    // const modulePascal = toPascalCase(cdObjName);
    // const cdObjTypeName = customCdAppData.cdModuleType;
    // const moduleCtx = customCdAppData.ctx;

    const cdObjName = customCdAppData.name ?? '';
    const cdObjTypeName = customCdAppData.cdObjTypeName ?? '';
    const modulesResult = await this.getAppModules(cdObjName, cdObjTypeName);
    const modules = modulesResult.state && modulesResult.data ? modulesResult.data : [];
    const workflowFile = join(MOD_CRAFT_WORKFLOW_APP_DIR, `${cdObjName}.create.module.json`);
    const workFlowResult = await this.svDevDescriptors.getCiCdDescriptor(cdObjName, cdObjTypeName, {
      descriptor: 'CiCdDescriptor',
      cdToken: this.cdToken, // Pass the cdToken if needed
    });

    if (!workFlowResult || !workFlowResult.state || !workFlowResult.data) {
      throw new Error(`Failed to get CI/CD descriptor for ${cdObjName}`);
    }

    CdLog.debug(`CdAppService::defaultCdAppData()/modules:${inspect(modules, { depth: 2 })}`);
    CdLog.debug(
      `CdAppService::defaultCdAppData()/workFlowResult:${inspect(workFlowResult.data, { depth: 2 })}`,
    );
    const workFlow = workFlowResult.data;
    return {
      // $schema?: string;
      name: customCdAppData.name,
      projectGuid: '123abd', // Placeholder for project GUID
      parentProjectGuid: null,
      modules: modules,
      cdCi: workFlow,
      description: '', // Provide a default value or use customCdAppData.description
      // language?: LanguageDescriptor, // getLanguageByName(name: string,languages: LanguageDescriptor[],)
      environments: [], // Provide a default value or use customCdAppData.environments
      versionControl: customCdAppData.versionControl, // Use the value from customCdAppData
    };
  }

  async getAppModules(
    cdObjName: string,
    cdObjTypeName: string,
  ): Promise<CdFxReturn<CdModuleDescriptor[]>> {
    try {
      CdLog.debug(
        `CdAppService::getAppModules()/cdObjName: ${cdObjName}, cdObjTypeName: ${cdObjTypeName}`,
      );
      /**
       * Iterate over the project directory and autogenerate module descriptors
       * based on the module directories found
       * - Read the module directory
       * - Read the module descriptor file
       * - Parse the descriptor file
       * - Validate the descriptor
       * - Return the descriptor
       */
      const moduleDescriptor = await this.svDevDescriptors.getModuleDescriptor(
        cdObjName,
        cdObjTypeName,
        {
          descriptor: 'CdModuleDescriptor',
          cdToken: this.cdToken, // Pass the cdToken if needed
        },
      );

      if (!moduleDescriptor || !moduleDescriptor.state || !moduleDescriptor.data) {
        return {
          state: false,
          data: null,
          message: `Failed to get module descriptor for ${cdObjName}`,
        };
      }
      return {
        state: true,
        data: [moduleDescriptor.data],
        message: 'Module descriptors retrieved successfully.',
      };
    } catch (error) {
      return {
        state: false,
        data: null,
        message: `Error retrieving app modules: ${(error as Error).message}`,
      };
    }
  }

  /**
      cdObjName: string,
      modulePascal: string,

  /**
   * Create a new application
   * CdApi:
   * - setup development environment
   *    - npm
   *    - mysql
   *    - redis
   *    - ssl
   * - migration files
   * - clone corpdesk if not yet done
   * - create repository for new module
   * - sync workstation to repository
   * - sync db data
   *
   * @param appDescriptor
   * @returns
   */
  async create(d: CdDescriptor): Promise<CdFxReturn<null>> {
    try {
      // const payload = this.svDevDescriptors.setEnvelope('Create', { data: d });
      // const httpService = new HttpService();
      // await httpService.init(); // Ensure this is awaited
      // httpService.headers.data = payload;
      // return await httpService.proc3(httpService.headers);
      return CD_FX_FAIL;
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Creation failed: ${(error as Error).message}`,
      };
    }
  }

  async read(q?: IQuery): Promise<CdFxReturn<CdDescriptor[] | null>> {
    try {
      /**
       * The q is allowed to be null
       * If null it is substituted by { where: {} }
       * Which would then fetch all the data
       */
      // const payload = this.svDevDescriptors.setEnvelope('Read', {
      //   query: q ?? { where: {} },
      // });
      // const httpService = new HttpService();
      // await httpService.init(); // Ensure this is awaited
      // httpService.headers.data = payload;
      // return await httpService.proc3(httpService.headers);
      return CD_FX_FAIL;
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Read failed: ${(error as Error).message}`,
      };
    }
  }

  async update(q: IQuery): Promise<CdFxReturn<null>> {
    try {
      // const payload = this.svDevDescriptors.setEnvelope('Update', { query: q });
      // const httpService = new HttpService();
      // await httpService.init(); // Ensure this is awaited
      // httpService.headers.data = payload;
      // return await httpService.proc3(httpService.headers);
      return CD_FX_FAIL;
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Update failed: ${(error as Error).message}`,
      };
    }
  }

  async delete(q: IQuery): Promise<CdFxReturn<null>> {
    try {
      // const payload = this.svDevDescriptors.setEnvelope('Delete', { query: q });
      // const httpService = new HttpService();
      // await httpService.init(); // Ensure this is awaited
      // httpService.headers.data = payload;
      // return await httpService.proc3(httpService.headers);
      return CD_FX_FAIL;
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Update failed: ${(error as Error).message}`,
      };
    }
  }

  async deriveCdAppDescriptor(
    action: DevModeAction,
    cdObjName: string,
    appType: AppType,
    oEnv: string,
    extraParams?: any,
  ): Promise<CdFxReturn<CdAppDescriptor>> {
    try {
      CdLog.debug(`CdAppService::deriveCdAppDescriptor()/action:${action}`);
      CdLog.debug(`CdAppService::deriveCdAppDescriptor()/cdObjName:${cdObjName}`);
      CdLog.debug(`CdAppService::deriveCdAppDescriptor()/appType:${appType}`);
      const appNamePascal = toCamelCase(cdObjName);
      // /home/emp-12/cd-cli/src/CdCli/app/app-craft/workshop/cd-app/workflow/test-bed/cd-ai-workshop.model.ts
      const cdAppWorkshopModelPath = join(
        MOD_CRAFT_WORKSHOP_DIR,
        extraParams.actionTargetName,
        'workflow',
        oEnv,
        `${cdObjName}-workshop.model.js`, // For app descriptors, use the cdObjName to point to the very app descriptor.
      );
      CdLog.debug(
        `CdAppService::deriveCdAppDescriptor()/cdAppWorkshopModelPath:${cdAppWorkshopModelPath}`,
      );
      CdLog.debug(`CdAppService::deriveCdAppDescriptor()/appNamePascal:${appNamePascal}`);
      // const cdApiWorkshopModel = await import(cdApiWorkshopModelPath);
      const cdAppWorkshopModelModule = await import(cdAppWorkshopModelPath);
      const cdAppVersionControl: VersionControlDescriptor =
        cdAppWorkshopModelModule[`${appNamePascal}VersionControl`];

      CdLog.debug(
        `CdAppService::deriveCdAppDescriptor()/cdAppVersionControl:${inspect(cdAppVersionControl, { depth: 2 })}`,
      );
      // derive cdAppPath from envCdApi
      const cdAppPath = cdAppVersionControl.repository?.directories?.find(
        (dir) => dir.environment === envCdApi,
      )?.path;

      if (!cdAppPath) {
        return {
          state: false,
          data: null,
          message: `cdAppPath is undefined. Cannot derive app modules.`,
        };
      }

      // derive app modules
      // const svCdModuleDescriptor = new CdModuleDescriptorService();
      // const svCdCiRunner = new CICdRunnerService();
      const appModulesResult = await this.deriveCdAppModules(cdObjName, appType, cdAppPath);
      CdLog.debug(
        `CdAppService::deriveCdAppDescriptor()/appModulesResult:${inspect(appModulesResult, {
          depth: 2,
        })}`,
      );

      if (!appModulesResult.state || !appModulesResult.data) {
        return {
          state: false,
          data: null,
          message: `Failed to derive module descriptor: ${appModulesResult.message}`,
        };
      }
      const appModules = appModulesResult.data;
      CdLog.debug(
        `CdAppService::deriveCdAppDescriptor()/appModules:${inspect(appModules, { depth: 2 })}`,
      );
      const cdObjType = actionTargets.find((cdObjType) => cdObjType.cdObjTypeName === 'cd-app');
      if (!cdObjType) {
        return {
          state: false,
          data: null,
          message: `cdObjType is undefined. Cannot derive app descriptor.`,
        };
      }
      CdLog.debug(
        `CdAppService::deriveCdAppDescriptor()/cdObjType:${inspect(cdObjType, { depth: 2 })}`,
      );
      // Create the CdAppDescriptor
      const basePath = join(MOD_CRAFT_WORKFLOW_APP_DIR, appType);
      CdLog.debug(`CdAppService::deriveCdAppDescriptor()/basePath:${basePath}`);

      const descriptor: CdAppDescriptor = {
        // $schema?: string;
        name: path.basename(basePath),
        projectGuid: '',
        parentProjectGuid: null,
        modules: appModules,
        // cdCi: workflowModel,
        description: '',
        versionControl: cdAppVersionControl, // Version control details
      };

      /**
       * extraParams:{
          actionTargetName: 'cd-app',
          descriptor: 'CdAppDescriptor',
          cdToken: '',
          repoName: 'cd-api',
          appType: 'cd-api',
          version: { major: 0, minor: 8, patch: 0 },
          testTasks: 'true'
        }
       */
      extraParams.action = action;
      extraParams.cdObjType = cdObjType;
      // const extraParams = { action: action, cdObjType: cdObjType, descriptor: descriptor };

      /**
       * Get the workflow resonsible for managing the the derivation process:
       * - set and save cd-app descriptor
       * - save data for eg cd-api/.cd/ json files
       * - create and update files for app-craft/workshop files
       */
      const svCiCd = new CiCdService();
      const workflowModelResult = await svCiCd.getWorkflow(cdObjName, appType, extraParams);
      CdLog.debug(
        `CdAppService::deriveCdAppDescriptor()/workflowModelResult:${inspect(workflowModelResult, {
          depth: 2,
        })}`,
      );
      if (!workflowModelResult || !workflowModelResult.state) {
        return {
          state: false,
          message: 'workflowModelResult is invalid',
        };
      }

      if (!workflowModelResult.data) {
        return {
          state: false,
          message: 'workflow data is invalid',
        };
      }
      const workflowModel = workflowModelResult.data;
      return {
        state: true,
        data: descriptor,
      };
    } catch (err: any) {
      return {
        state: false,
        data: null,
        message: `❌ Failed to derive module descriptor: ${err.message}`,
      };
    }
  }

  async deriveCdAppModules(
    cdObjName: string,
    appType: AppType,
    cdAppPath: string,
  ): Promise<CdFxReturn<CdModuleDescriptor[]>> {
    const appNamePascal = toPascalCase(cdObjName);
    const sysPath = join(cdAppPath, 'src', appNamePascal, 'sys');
    const appPath = join(cdAppPath, 'src', appNamePascal, 'app');

    const pathsToScan = [sysPath, appPath];
    const availableModules: CdModuleDescriptor[] = [];

    try {
      const svCdModuleDescriptor = new CdModuleDescriptorService();

      for (const scanPath of pathsToScan) {
        const entries = readdirSync(scanPath);

        for (const entry of entries) {
          const modulePath = join(scanPath, entry);
          if (!statSync(modulePath).isDirectory()) continue;
          CdLog.debug(`CdAppService::deriveCdAppModules()/modulePath:${modulePath}`);
          const moduleResult = await svCdModuleDescriptor.deriveCdModuleDescriptor(modulePath);
          if (!moduleResult.state || !moduleResult.data) {
            return {
              state: false,
              data: null,
              message: `Failed to derive module descriptor for ${modulePath}: ${moduleResult.message}`,
            };
          }

          availableModules.push(moduleResult.data);
        }
      }

      return {
        state: true,
        data: availableModules,
      };
    } catch (err: any) {
      return {
        state: false,
        data: null,
        message: `❌ Failed to derive modules from the app: ${err.message}`,
      };
    }
  }

  protected getTypeId(): number {
    return 1; // CdApp type
  }

  // Get all applications
  async getAllApps(): Promise<CdFxReturn<CdDescriptor[] | null>> {
    try {
      return await this.read(); // Fetch all applications
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Failed to retrieve all apps: ${(error as Error).message}`,
      };
    }
  }

  // Get a single app by name
  async getAppByName(name: string): Promise<CdFxReturn<CdDescriptor[] | null>> {
    try {
      // Validate input
      if (!name.trim()) {
        return {
          data: null,
          state: false,
          message: 'Application name is required.',
        };
      }

      // Define the query
      const q: IQuery = {
        select: ['cdObjId', 'cdObjName', 'cdObjGuid', 'jDetails'], // Fields to select
        where: { cdObjName: name }, // Fetch apps by name
      };

      return await this.read(q);
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Failed to retrieve app by name: ${(error as Error).message}`,
      };
    }
  }

  async upgrade(appDescriptor: CdAppDescriptor, version: string): Promise<CdFxReturn<null>> {
    const versionService = new VersionService();
    const svCdAutoGit = new CdAutoGitService();
    await svCdAutoGit.init();

    const versionControl = appDescriptor.versionControl;
    if (!versionControl || !versionControl.repository.url) {
      return {
        state: false,
        data: null,
        message: '❌ Version control details are missing or incomplete.',
      };
    }

    const repoStatus = await svCdAutoGit.getRepoStatus(versionControl.repository.url);
    if (!repoStatus || !!repoStatus.data) {
      return {
        state: false,
        data: null,
        message:
          '❌ Git working directory is not clean. Commit or stash changes before proceeding.',
      };
    }

    const parsed = await versionService.parseVersionInput(version);
    if (!parsed.state || !parsed.data) {
      return {
        state: parsed.state,
        data: null,
        message: parsed.message,
      };
    }

    const { roadmapId, milestoneId } = parsed.data;

    const currentVersion = await svCdAutoGit.getCurrentVersionTag(versionControl.repository.url);
    const nextVersionResult = await svCdAutoGit.determineNextVersion(roadmapId, milestoneId);

    if (!nextVersionResult?.state || !nextVersionResult.data) {
      return {
        state: false,
        data: null,
        message: nextVersionResult.message || '❌ Failed to determine next version.',
      };
    }

    const nextVersion = nextVersionResult.data;

    const roadmapExists = await svCdAutoGit.verifyRoadmap(roadmapId);
    if (!roadmapExists) {
      return {
        state: false,
        data: null,
        message: `❌ Roadmap ${roadmapId} does not exist.`,
      };
    }

    const milestoneValid = await svCdAutoGit.verifyMilestoneInRoadmap(roadmapId, milestoneId);
    if (!milestoneValid) {
      return {
        state: false,
        data: null,
        message: `❌ Milestone ${milestoneId} is not found in roadmap ${roadmapId}.`,
      };
    }

    const upgradeResult = await svCdAutoGit.performUpgrade(versionControl.repository.url);
    if (!upgradeResult.state) return upgradeResult;

    const tagResult = await svCdAutoGit.tagProject(versionControl.repository.url, nextVersion);
    if (!tagResult.state) return tagResult;

    return await svCdAutoGit.pushChangesWithTags(versionControl.repository.url);
  }
}
