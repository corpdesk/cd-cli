/* eslint-disable style/indent */
/* eslint-disable style/operator-linebreak */
/* eslint-disable style/brace-style */
import type { CdFxReturn } from '../../base/i-base.js';
import type { DependencyDescriptor } from '../models/dependancy-descriptor.model.js';
import type {
  OperatingSystemDescriptor,
  WorkstationAccessDescriptor,
  WorkstationDescriptor,
} from '../models/workstations.model.js';
import { ProgressTrackerService } from '../../cd-cli/services/progress-tracker.service.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import { WorkstationAccessController } from '../controllers/workstation-access.controller.js';
import { SshService } from './ssh.service.js';
import { WorkstationService } from './workstation.service.js';
import { WorkstationAccessService } from './workstation-access.service.js';
import { CdObjModel } from '../../moduleman/models/cd-obj.model.js';
import { GenericService } from '../../base/generic-service.js';
import { DevModeAction } from '../../dev-mode/index.js';
import { CdModuleDescriptor } from '../models/cd-module-descriptor.model.js';
import { ComponentType } from '../models/component-descriptor.model.js';
import { AppType, CdCtx, CdModelDescriptor, CdServiceDescriptor } from '../index.js';
import { toPascalCase } from '../../utils/cd-naming.util.js';

export class DependencyDescriptorService extends GenericService<CdObjModel> {
  svWorkstation: WorkstationService;
  progressTracker: ProgressTrackerService;
  svSsh: SshService;
  svWorkstationAccess: WorkstationAccessService;
  ctlWorkstationAccess: WorkstationAccessController;
  constructor() {
    super(CdObjModel);
    this.svWorkstation = new WorkstationService();
    this.progressTracker = new ProgressTrackerService();
    this.svSsh = new SshService();
    this.svWorkstationAccess = new WorkstationAccessService();
    this.ctlWorkstationAccess = new WorkstationAccessController();
  }

  async installDependencies(workstation: WorkstationDescriptor): Promise<CdFxReturn<null>> {
    const stepKey = 'installDependencies';
    const totalTasks = workstation.requiredSoftware?.length || 0;
    let completedTasks = 0;

    this.progressTracker.updateProgress(stepKey, 'in-progress', totalTasks, completedTasks);

    try {
      if (
        !workstation.workstationAccess.accessScope ||
        !workstation.workstationAccess.physicalAccess ||
        !workstation.workstationAccess.transport
      ) {
        this.progressTracker.updateProgress(stepKey, 'completed', totalTasks, totalTasks);
        return {
          data: null,
          state: true,
          message: 'No software is registered for installation',
        };
      }

      const result: CdFxReturn<{ completedTasks: number }> = this.svSsh.requiresSSH(
        workstation.workstationAccess.accessScope,
        workstation.workstationAccess.physicalAccess,
        workstation.workstationAccess.transport,
      )
        ? await this.handleRemoteInstallation(workstation, totalTasks, completedTasks)
        : await this.handleLocalInstallation(workstation, totalTasks, completedTasks);

      completedTasks = result.data?.completedTasks ?? completedTasks;

      this.progressTracker.updateProgress(stepKey, 'completed', totalTasks, completedTasks);
      return {
        data: null,
        state: true,
        message: 'Dependency installation completed',
      };
    } catch (error) {
      this.progressTracker.updateProgress(stepKey, 'failed');
      return {
        data: null,
        state: false,
        message: `Dependency installation failed: ${(error as Error).message}`,
      };
    }
  }

  async handleRemoteInstallation(
    workstation: WorkstationDescriptor,
    totalTasks: number,
    completedTasks: number,
  ): Promise<CdFxReturn<{ completedTasks: number }>> {
    for (const dependency of workstation.requiredSoftware) {
      console.log(`Installing ${dependency.name} on remote workstation...`);
      await this.installDependencyRemotely(dependency, workstation.workstationAccess);

      completedTasks++; // ✅ Increment progress
      this.progressTracker.updateProgress(
        'installDependencies',
        'in-progress',
        totalTasks,
        completedTasks,
      );
    }

    return {
      data: { completedTasks },
      state: true,
      message: 'Remote installation completed',
    };
  }

  async installDependencyRemotely(
    dependency: DependencyDescriptor,
    workstationAccess: WorkstationAccessDescriptor,
  ): Promise<CdFxReturn<null>> {
    try {
      this.validateDependency(dependency);
      this.svWorkstationAccess.validateWorkstationAccess(workstationAccess);

      const packageManager = this.getPackageManager(dependency);
      const command =
        dependency.installCommand || `${packageManager} install -y ${dependency.name}`;

      const result = await this.svWorkstationAccess.executeRemoteCommand(
        workstationAccess,
        command,
      );

      if (!result.state) {
        throw new Error(result.message ?? 'Unknown error');
      }

      return {
        data: null,
        state: true,
        message: `Remote installation of ${dependency.name} completed successfully.`,
      };
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Failed to install ${dependency.name} remotely: ${(error as Error).message}`,
      };
    }
  }

  async handleLocalInstallation(
    workstation: WorkstationDescriptor,
    totalTasks: number,
    completedTasks: number,
  ): Promise<CdFxReturn<{ completedTasks: number }>> {
    for (const dependency of workstation.requiredSoftware) {
      console.log(`Installing ${dependency.name} locally...`);
      await this.installDependencyLocally(dependency);

      completedTasks++; // ✅ Increment progress
      this.progressTracker.updateProgress(
        'installDependencies',
        'in-progress',
        totalTasks,
        completedTasks,
      );
    }

    return {
      data: { completedTasks },
      state: true,
      message: 'Local installation completed',
    };
  }

  async installDependencyLocally(dependency: DependencyDescriptor): Promise<CdFxReturn<null>> {
    try {
      this.validateDependency(dependency);

      console.log(`Starting local installation of ${dependency.name}...`);

      const packageManager = this.getPackageManager(dependency);
      const command =
        dependency.installCommand || `${packageManager} install -y ${dependency.name}`;

      const result = await this.ctlWorkstationAccess.execute(command);

      if (!result.state) {
        throw new Error(`Local installation failed: ${result.message}`);
      }

      console.log(`Successfully installed ${dependency.name} locally.`);

      return {
        data: null,
        state: true,
        message: `Local installation of ${dependency.name} completed successfully.`,
      };
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Failed to install ${dependency.name} locally: ${(error as Error).message}`,
      };
    }
  }

  private validateDependency(dependency: DependencyDescriptor): void {
    if (!dependency.name) {
      throw new Error('Dependency name is required.');
    }
    if (!dependency.source) {
      throw new Error(`Dependency source is required for ${dependency.name}.`);
    }
  }

  async isDependencyInstalled(
    workstation: WorkstationDescriptor,
    dependency: DependencyDescriptor,
  ): Promise<CdFxReturn<boolean>> {
    CdLog.debug('isDependencyInstalled()/workstation:', workstation);
    CdLog.debug('isDependencyInstalled()/dependency:', dependency);

    try {
      // Simulate checking for dependency installation
      const isInstalled = false; // Replace with actual SSH command execution

      return {
        data: isInstalled,
        state: true,
        message: `Checked installation status for ${dependency.name}`,
      };
    } catch (error) {
      CdLog.error(`isDependencyInstalled()/error:${error}`);
      return {
        data: null,
        state: false,
        message: `Failed to check dependency installation: ${(error as Error).message}`,
      };
    }
  }

  async getInstallationScript(
    dependency: DependencyDescriptor,
    os: OperatingSystemDescriptor,
  ): Promise<CdFxReturn<string>> {
    CdLog.debug('getInstallationScript()/dependency:', dependency);
    CdLog.debug('getInstallationScript()/os:', os);

    try {
      // Simulate fetching script from database
      const script = `sudo apt-get install -y ${dependency.name}`; // Example script

      return {
        data: script,
        state: true,
        message: `Fetched installation script for ${dependency.name}`,
      };
    } catch (error) {
      CdLog.error(`getInstallationScript()/error:${error}`);
      return {
        data: null,
        state: false,
        message: `Failed to get installation script: ${(error as Error).message}`,
      };
    }
  }

  async getPackageManager(dependency: DependencyDescriptor): Promise<CdFxReturn<string>> {
    if (!dependency.source) {
      return {
        data: null,
        state: false,
        message: 'Dependency source is missing.',
      };
    }

    let packageManager: string | null = null;

    switch (dependency.source) {
      case 'npm':
        packageManager = 'npm';
        break;
      case 'cdn':
        packageManager = 'unpkg / jsDelivr';
        break;
      case 'repository':
        packageManager = 'git / custom registry';
        break;
      case 'local':
        packageManager = 'local file system';
        break;
      case 'system':
        packageManager = 'system package manager (apt, yum, brew)';
        break;
      case 'custom':
      case 'external':
        packageManager = 'custom / external installer';
        break;
      default:
        return {
          data: null,
          state: false,
          message: 'Unknown dependency source.',
        };
    }

    return {
      data: packageManager,
      state: true,
      message: `Package manager resolved: ${packageManager}`,
    };
  }

  /**
   * NOTES:
   * This class needs to be able to process setting of the default dependency for components in a module.
   * It relies primarily on corpdesk-rfc-0002 supported by corpdesk-rfc-0001
  
  1. Imports for Controller where ComponentType === ComponentType.Controller:
      - BaseService
      - s of s.ComponentType.Service and 
      - s.ComponentType.ServiceType.
  
  2. Imports for Controller where ComponentType === ComponentType.ControllerType:
      - BaseService
      - s of s.ComponentType.Service  
      - s of s.ComponentType.ServiceType
  
  3. Imports for Service where ComponentType === ComponentType.Service:
      - BaseService
      - mod of mod.ComponentType.Model  
      - mod of mod.ComponentType.ModType
      - mod of mod.ComponentType.ModView
      Other imports:
      import {
          CreateIParams,
          IQuery,
          IServiceInput,
          IUser,
          ISessionDataExt,
      } from "../../../sys/base/i-base";
      import { BaseService } from "../../../sys/base/base.service";
      import { CdService } from "../../../sys/base/cd.service";
      import { Logging } from "../../../sys/base/winston.log";
      import { ValidationRulesBuilder } from "../../../sys/base/validation-rules-builder";
      import { QueryTransformer } from "../../../sys/utils/query-transformer";
      import { SessionService } from "../../../sys/user/services/session.service";
      import { UserService } from "../../../sys/user/services/user.service";
      import { CompanyService } from "../../../sys/moduleman/services/company.service";
      import { CompanyModel } from "../../../sys/moduleman/models/company.model";
  
  
  4. Imports for Service where ComponentType === ComponentType.Servicetype:
      - BaseService
      - mod of mod.ComponentType.Model 
      - mod of mod.ComponentType.ModType
      - mod of mod.ComponentType.ModView
      Other imports:
      import {
          CreateIParams,
          IQuery,
          IServiceInput,
          IUser,
          ISessionDataExt,
      } from "../../../sys/base/i-base";
      import { BaseService } from "../../../sys/base/base.service";
      import { CdService } from "../../../sys/base/cd.service";
      import { Logging } from "../../../sys/base/winston.log";
      import { ValidationRulesBuilder } from "../../../sys/base/validation-rules-builder";
      import { QueryTransformer } from "../../../sys/utils/query-transformer";
      import { SessionService } from "../../../sys/user/services/session.service";
      import { UserService } from "../../../sys/user/services/user.service";
      import { CompanyService } from "../../../sys/moduleman/services/company.service";
      import { CompanyModel } from "../../../sys/moduleman/models/company.model";
  
  5. Imports for Model where ComponentType === ComponentType.Model:
      - BaseService
      - typeorm
      - uuid
      - mod of mod.ComponentType.Model  
      - mod of mod.ComponentType.ModType
      - mod of mod.ComponentType.ModView
  
  6. Imports for Model where ComponentType === ComponentType.ModelType:
      - BaseService
      - typeorm
      - uuid
      - mod of mod.ComponentType.Model  
      - mod of mod.ComponentType.ModType
      - mod of mod.ComponentType.ModView
  
  7. Another opportunity for automation would be:
  - Allowing methods descriptors to have dependancy.
  So if a method is dependent on say 'lodash', it would prompt the process to insert an import header of 'lodash'.
  A method can also depend on corpdesk module and the same would apply.
  The import setting would them be happending during json build up of the CdModuleDescriptor.
   */
  /**
   * Entrypoint: reset & rebuild all dependencies
   */
  async rebuildDependencyData(
    moduleData: CdModuleDescriptor,
  ): Promise<CdFxReturn<CdModuleDescriptor>> {
    this.b.logWithContext(this, 'rebuildDependencies:start', { moduleData });

    // 0. reset all
    this.resetAllDependencies(moduleData);

    // 1. controllers (Controller + ControllerType)
    this.applyControllerDeps(moduleData);

    // 2. services (Service + ServiceType)
    this.applyServiceDeps(moduleData);

    // 3. models (Model + ModelType)
    this.applyModelDeps(moduleData);

    this.b.logWithContext(this, 'rebuildDependencies:end', { moduleData });
    this.b.logWithContext(this, 'rebuildDependencies:controller[0]Dependencies', {
      controllerData: moduleData.controllers[0].dependencies,
    });
    return { state: true, data: moduleData };
  }

  /**
   * Reset all dependencies in all component types
   */
  private resetAllDependencies(moduleData: CdModuleDescriptor) {
    for (const controller of moduleData.controllers || []) {
      controller.dependencies = [];
    }
    for (const service of moduleData.services || []) {
      service.dependencies = [];
    }
    for (const model of moduleData.models || []) {
      model.dependencies = [];
    }
  }

  // =============================
  // CONTROLLER CASES (1 & 2)
  // =============================
  private applyControllerDeps(moduleData: CdModuleDescriptor) {
    this.b.logWithContext(this, `applyControllerDeps:moduleData:`, moduleData, 'debug');
    this.b.logWithContext(
      this,
      `applyControllerDeps:moduleData.controllers[0]:`,
      moduleData.controllers[0],
      'debug',
    );
    for (const controller of moduleData.controllers || []) {
      if (
        controller.type === ComponentType.Controller ||
        controller.type === ComponentType.ControllerType
      ) {
        controller.dependencies?.push(...this.buildBaseServiceDependency());
        this.b.logWithContext(
          this,
          `applyControllerDeps:controller.dependencies1:`,
          controller.dependencies,
          'debug',
        );

        for (const service of moduleData.services || []) {
          if (
            service.type === ComponentType.Service ||
            service.type === ComponentType.ServiceType
          ) {
            controller.dependencies?.push(this.buildServiceDependency(service));
          }
          this.b.logWithContext(
            this,
            `applyControllerDeps:controller.dependencies2:`,
            controller.dependencies,
            'debug',
          );
        }
        this.b.logWithContext(
          this,
          `applyControllerDeps:controller.dependencies3:`,
          controller.dependencies,
          'debug',
        );
      }
    }
  }

  // =============================
  // SERVICE CASES (3 & 4)
  // =============================
  private applyServiceDeps(moduleData: CdModuleDescriptor) {
    for (const service of moduleData.services || []) {
      if (service.type === ComponentType.Service || service.type === ComponentType.ServiceType) {
        // services depend on BaseService
        service.dependencies?.push(...this.buildBaseServiceDependency());
        service.dependencies?.push(...this.buildSysServiceDependency());

        // services may depend on models
        for (const model of moduleData.models || []) {
          if (model.type === ComponentType.Model || model.type === ComponentType.ModelType || model.type === ComponentType.ModelView) {
            service.dependencies?.push(this.buildModelDependency(model));
          }
        }
      }
    }
  }

  // =============================
  // MODEL CASES (5 & 6)
  // =============================
  private applyModelDeps(moduleData: CdModuleDescriptor) {
    for (const model of moduleData.models || []) {
      if (model.type === ComponentType.Model || model.type === ComponentType.ModelType) {
        // models always depend on BaseService
        model.dependencies?.push(...this.buildBaseServiceDependency());
      }
    }
  }

  // =============================
  // BUILDERS
  // =============================

  // private buildBaseServiceDependency(): DependencyDescriptor {
  //   return {
  //     name: 'BaseService',
  //     category: 'core',
  //     source: 'local',
  //     scope: 'module',
  //     targetApp: AppType.CdApi,
  //     isCdModule: true,
  //     cdCtx: CdCtx.Sys,
  //     resolution: {
  //       method: 'import',
  //       path: '../../../sys/base/base.service',
  //     },
  //     usage: { usageContext: 'core', classesUsed: ['BaseService'] },
  //   };
  // }
  private buildBaseServiceDependency(): DependencyDescriptor[] {
    return [
      {
        name: 'BaseService',
        category: 'core',
        source: 'local',
        scope: 'module',
        targetApp: AppType.CdApi,
        isCdModule: true,
        cdCtx: CdCtx.Sys,
        resolution: {
          method: 'import',
          path: '../../../sys/base/base.service',
        },
        usage: { usageContext: 'core', classesUsed: ['BaseService'] },
      },
      {
        name: 'BaseInterfaces',
        category: 'core',
        source: 'local',
        scope: 'module',
        targetApp: AppType.CdApi,
        isCdModule: true,
        cdCtx: CdCtx.Sys,
        resolution: {
          method: 'import',
          path: '../../../sys/base/i-base',
        },
        usage: { usageContext: 'core', classesUsed: ['IQuery', 'IRespInfo','ICdRequest', 'IServiceInput'] },
      },
      {
        name: 'Logging',
        category: 'core',
        source: 'local',
        scope: 'module',
        targetApp: AppType.CdApi,
        isCdModule: true,
        cdCtx: CdCtx.Sys,
        resolution: {
          method: 'import',
          path: '../../../sys/base/winston.log',
        },
        usage: { usageContext: 'core', classesUsed: ['Logging'] },
      },
    ];
  }

  private buildSysServiceDependency(): DependencyDescriptor[] {
    return [
      {
        name: 'SessionService',
        category: 'sys',
        source: 'local',
        scope: 'module',
        targetApp: AppType.CdApi,
        isCdModule: true,
        cdCtx: CdCtx.Sys,
        resolution: {
          method: 'import',
          path: '../../../sys/user/services/session.service',
        },
        usage: { usageContext: 'service', classesUsed: ['SessionService'] },
      },
      {
        name: 'ValidationRulesBuilder',
        category: 'sys',
        source: 'local',
        scope: 'module',
        targetApp: AppType.CdApi,
        isCdModule: true,
        cdCtx: CdCtx.Sys,
        resolution: {
          method: 'import',
          path: '../../../sys/base/validation-rules-builder',
        },
        usage: { usageContext: 'service', classesUsed: ['ValidationRulesBuilder'] },
      },
    ];
  }

  private buildServiceDependency(service: CdServiceDescriptor): DependencyDescriptor {
    this.b.logWithContext(
      this,
      `buildServiceDependancy:service.name:`,
      { servieName: service.name },
      'debug',
    );
    this.b.logWithContext(
      this,
      `buildServiceDependancy:service.fileName:`,
      { fileName: service.fileName },
      'debug',
    );

    let path = '';
    if (service.fileName) {
      path = `../services/${service.fileName}`;
    } else {
      path = `../services/${service.name}.service`;
    }

    const ret = {
      name: service.name,
      category: 'custom',
      source: 'local',
      scope: 'module',
      targetApp: AppType.CdApi,
      isCdModule: true,
      cdCtx: CdCtx.App,
      resolution: {
        method: 'import',
        path: path,
      },
      usage: {
        usageContext: 'controller',
        classesUsed: [`${toPascalCase(service.name)}Service`],
      },
    };
    this.b.logWithContext(this, `buildServiceDependancy:ret:`, { ret }, 'debug');
    return ret as DependencyDescriptor;
  }

  private buildModelDependency(model: CdModelDescriptor): DependencyDescriptor {
    let path = '';
    if (model.fileName) {
      path = `../models/${model.fileName}`;
    } else {
      path = `../models/${model.name}.model`;
    }
    const ret = {
      name: model.name,
      category: 'custom',
      source: 'local',
      scope: 'module',
      targetApp: AppType.CdApi,
      isCdModule: true,
      cdCtx: CdCtx.App,
      resolution: {
        method: 'import',
        // path: `../models/${model.fileName ?? model.name}.model`,
        path: path,
      },
      usage: {
        usageContext: 'service',
        classesUsed: [`${toPascalCase(model.name)}Model`],
      },
    };
    return ret as DependencyDescriptor;
  }
}
