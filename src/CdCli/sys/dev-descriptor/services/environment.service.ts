/* eslint-disable style/indent */
/* eslint-disable antfu/if-newline */

import type { DependencyDescriptor } from '../models/dependancy-descriptor.model.js';
import type { CdDescriptor } from '../models/dev-descriptor.model.js';
import { CdAutoGitController } from '../../../app/cd-auto-git/controllers/cd-auto-git.controller.js';
import { BaseService } from '../../base/base.service.js';
import { HttpService } from '../../base/http.service.js';
import { getCiCdByName, knownCiCds } from '../models/cicd-descriptor.model.js';
import { CdEnvName, type EnvironmentDescriptor } from '../models/environment.model.js';
import {
  type BaseServiceDescriptor,
  getServiceByName,
  services,
} from '../models/service-descriptor.model.js';
import {
  getWorkstationByName,
  type WorkstationDescriptor,
  workstations,
} from '../models/workstations.model.js';
/* eslint-disable style/operator-linebreak */
/* eslint-disable style/brace-style */
import { CD_FX_FAIL, type CdFxReturn, type IQuery } from '../../base/IBase.js';
import { CdCliProfileController } from '../../cd-cli/controllers/cd-cli-profile.cointroller.js';
import { ProgressTrackerService } from '../../cd-cli/services/progress-tracker.service.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import { ServiceController } from '../controllers/service.controller.js';
import { WorkstationAccessController } from '../controllers/workstation-access.controller.js';
import { getEnvironmentVariablesByContext } from '../models/os.model.js';
import {
  getTestingFrameworkByContext,
  testingFrameworks,
} from '../models/testing-framework.model.js';
import {
  getVersionControlByContext,
  repoRegistry,
} from '../models/version-control.model.js';
import { CiCdService } from './ci-cd.service.js';
import { DependencyDescriptorService } from './dependency-descriptor.service.js';
import { DevDescriptorService } from './dev-descriptor.service.js';
import { SshService } from './ssh.service.js';
import { WorkstationService } from './workstation.service.js';
import { ProfileModel } from '../../cd-cli/models/cd-cli-profile.model.js';
import { CdObjModel } from '../../moduleman/models/cd-obj.model.js';
import { GenericService } from '../../base/generic-service.js';

export class EnvironmentService extends GenericService<CdObjModel> {
  cdToken: string = '';
  svDevDescriptors: DevDescriptorService;
  svWorkstation: WorkstationService;
  svDependency: DependencyDescriptorService;
  ctlWorkstationAccess: WorkstationAccessController;
  svSsh: SshService;
  progressTracker = new ProgressTrackerService();
  ctlService: ServiceController;
  // ctlCdCliProfile: CdCliProfileController;
  svCiCd: CiCdService;

  stepMap: {
    key: string;
    method: () => Promise<CdFxReturn<null>>;
    totalTasks: number;
    completedTasks: number;
  }[] = [];

  constructor() {
    super(CdObjModel);
    this.svDevDescriptors = new DevDescriptorService();
    this.svWorkstation = new WorkstationService();
    this.svDependency = new DependencyDescriptorService();
    this.ctlWorkstationAccess = new WorkstationAccessController();
    this.svSsh = new SshService();
    this.ctlService = new ServiceController();
    this.svCiCd = new CiCdService();
    // ctlCdCliProfile = new CdCliProfileController();
  }

  /**
   * Example Usage
    Run Full Setup:
    await devEnvService.setupEnvironment(devEnviron);
    Run Only Step 2 (Clone Repositories):
    await devEnvService.setupEnvironment(devEnviron, [2]);
    Run Steps 2 & 4:
    await devEnvService.setupEnvironment(devEnviron, [2, 4]);
   * @param devEnviron
   * @param steps
   * @returns
   */
  async setupEnvironment(
    devEnviron: EnvironmentDescriptor,
    steps?: number[],
  ): Promise<CdFxReturn<null>> {
    CdLog.debug(`EnvironmentService::setupEnvironment()/devEnviron:${devEnviron}`);
    CdLog.debug(`EnvironmentService::setupEnvironment()/steps:${steps}`);
    try {
      if (!devEnviron.ciCd) {
        return CD_FX_FAIL;
      }
      // ✅ Ensure steps are registered first
      // this.initializeStepMap(devEnviron);
      const resInitStepMap = await CiCdService.initializeStepMap(
        this,
        { ciCd: devEnviron.ciCd },
        this.progressTracker,
      );

      CdLog.debug(`EnvironmentService::setupEnvironment()/resInitStepMap:${resInitStepMap}`);

      if (!resInitStepMap.state) {
        return {
          data: null,
          state: false,
          message: 'Failed to initialize the step map',
        };
      }

      const registeredSteps = this.progressTracker.getSteps();
      CdLog.debug(`EnvironmentService::setupEnvironment()/registeredSteps:${registeredSteps}`);

      for (let i = 0; i < registeredSteps.length; i++) {
        if (steps && !steps.includes(i + 1)) continue; // Skip steps not included

        const { key, method, totalTasks } = registeredSteps[i];

        // Update progress
        this.progressTracker.updateProgress(key, 'in-progress', totalTasks, 0);

        const result = await method();
        CdLog.debug(`EnvironmentService::setupEnvironment()/result:${result}`);

        if (!result.state) {
          this.progressTracker.updateProgress(key, 'failed');
          return result; // Stop execution on failure
        }

        this.progressTracker.updateProgress(key, 'completed', totalTasks, totalTasks);
      }

      return {
        data: null,
        state: true,
        message: 'Environment setup successful',
      };
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Setup failed: ${(error as Error).message}`,
      };
    }
  }

  async installDependencies(workstation: WorkstationDescriptor): Promise<CdFxReturn<null>> {
    const retValidWS = this.svWorkstation.validateWorkstation(workstation);
    if (!retValidWS) {
      CdLog.error('This workstation is invalid!');
      return CD_FX_FAIL;
    }
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
        ? await this.svDependency.handleRemoteInstallation(workstation, totalTasks, completedTasks)
        : await this.svDependency.handleLocalInstallation(workstation, totalTasks, completedTasks);

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

  getPackageManager(dependency: DependencyDescriptor): string {
    switch (dependency.source) {
      case 'npm':
        return 'npm';
      case 'cdn':
        return 'wget';
      case 'repository':
        return 'git';
      case 'system':
      case 'local':
        return 'apt'; // Default for Linux, can be extended for macOS (brew) or Windows (choco)
      default:
        return 'custom-installer'; // Fallback for unknown sources
    }
  }

  async installSoftware(
    workstation: WorkstationDescriptor,
    os: any | null,
    sshCredentials: any | null,
    totalTasks: number,
    completedTasks: number,
  ): Promise<CdFxReturn<null>> {
    for (const dependency of workstation.requiredSoftware) {
      console.log(`Checking dependency: ${dependency.name} on ${workstation.name}`);
      const isInstalledResult = await this.svDependency.isDependencyInstalled(
        workstation,
        dependency,
      );

      if (!isInstalledResult.state) {
        console.warn(
          `Failed to check if ${dependency.name} is installed: ${isInstalledResult.message}`,
        );
        continue;
      }

      if (isInstalledResult.data) {
        console.log(`Dependency ${dependency.name} is already installed. Skipping...`);
        completedTasks++;
        continue;
      }

      const scriptResult = await this.svDependency.getInstallationScript(dependency, os);
      if (!scriptResult.state || !scriptResult.data) {
        console.warn(`No installation script found for ${dependency.name}. Skipping...`);
        completedTasks++;
        continue;
      }

      console.log(`Installing ${dependency.name} on ${workstation.name}...`);
      if (sshCredentials) {
        const executionResult = await this.svWorkstation.executeScript(
          sshCredentials,
          scriptResult.data,
        );
        if (!executionResult.state) {
          console.error(`Failed to install ${dependency.name}: ${executionResult.message}`);
        }
      }

      completedTasks++;
      console.log(`Progress: ${completedTasks}/${totalTasks} tasks completed`);
    }

    return {
      data: null,
      state: true,
      message: `Dependency installation completed for ${workstation.name}`,
    };
  }

  async cloneRepositories(devEnviron: EnvironmentDescriptor): Promise<CdFxReturn<null>> {
    const stepKey = 'cloneRepositories';
    this.progressTracker.updateProgress(stepKey, 'in-progress', 1, 0);

    try {
      // Initialize the controller instance manually
      const ctlCdAutoGit = new CdAutoGitController();

      for (const dependancy of devEnviron.workstation.requiredSoftware) {
        const repo = dependancy.dependancyRepository?.repository;

        if (repo && repo.enabled) {
          const repoName = repo.name;
          const repoDirectory = repo.directories?.find(
            (dir) => dir.environment.name === CdEnvName.WORKSHOP,
          )?.path ?? '~'; // Provide fallback if undefined
          const repoHost = repo.credentials.repoHost ?? 'corpdesk'; // Provide fallback if undefined

          await ctlCdAutoGit.cloneRepoToLocal(repoName, repoDirectory, repoHost);
        }
      }

      this.progressTracker.updateProgress(stepKey, 'completed', 1, 1);
      return {
        data: null,
        state: true,
        message: 'Repositories cloned successfully',
      };
    } catch (error) {
      this.progressTracker.updateProgress(stepKey, 'failed');
      return {
        data: null,
        state: false,
        message: `Failed to clone repositories: ${(error as Error).message}`,
      };
    }
  }

  async configureServices(devEnviron: EnvironmentDescriptor): Promise<CdFxReturn<null>> {
    const stepKey = 'configureServices';
    this.progressTracker.updateProgress(stepKey, 'in-progress', 1, 0);

    try {
      if (!devEnviron.services || devEnviron.services.length === 0) {
        return {
          data: null,
          state: true,
          message: 'No services to configure.',
        };
      }

      for (const service of devEnviron.services) {
        CdLog.info(`Configuring service: ${service.serviceName}`);

        if (!service.configuration) {
          CdLog.warning(`Skipping ${service.serviceName}: No configuration found.`);
          continue;
        }

        // Validate credentials (if required)
        if (service.credentials) {
          const isAuthenticated = await this.authenticateService(service);
          if (!isAuthenticated) {
            throw new Error(`Authentication failed for ${service.serviceName}`);
          }
        }

        // Apply configuration (Placeholder for actual implementation)
        await this.applyServiceConfiguration(service);

        CdLog.success(`Successfully configured ${service.serviceName}`);
      }

      this.progressTracker.updateProgress(stepKey, 'completed', 1, 1);

      return {
        data: null,
        state: true,
        message: 'All services configured successfully.',
      };
    } catch (error) {
      this.progressTracker.updateProgress(stepKey, 'failed');
      return {
        data: null,
        state: false,
        message: `Failed to configure services: ${(error as Error).message}`,
      };
    }
  }

  async authenticateService(
    service: BaseServiceDescriptor, // Now accepts BaseServiceDescriptor
  ): Promise<boolean> {
    const { credentials } = service;
    if (!credentials) return true; // No authentication required

    switch (credentials.type) {
      case 'apiKey':
        CdLog.info(`Authenticating ${service.serviceName} using API key...`);
        return !!credentials.apiKey;

      case 'usernamePassword':
        CdLog.info(`Authenticating ${service.serviceName} with username/password...`);
        return !!credentials.username && !!credentials.password;

      case 'oauth':
        CdLog.info(`Authenticating ${service.serviceName} with OAuth token...`);
        return !!credentials.token;

      case 'custom':
        CdLog.info(`Authenticating ${service.serviceName} with custom method...`);
        return !!credentials.customAuthConfig;

      default:
        CdLog.warning(`Unknown authentication method for ${service.serviceName}`);
        return false;
    }
  }

  async applyServiceConfiguration(service: BaseServiceDescriptor): Promise<void> {
    // Placeholder for actual configuration logic
    CdLog.debug(`Applying configuration for ${service.serviceName}:`, service.configuration);
  }

  async startServices(devEnviron: EnvironmentDescriptor): Promise<CdFxReturn<null>> {
    const stepKey = 'startServices';
    await this.progressTracker.updateProgress(stepKey, 'in-progress', 1, 0);

    try {
      if (!devEnviron.services || devEnviron.services.length === 0) {
        return {
          data: null,
          state: true,
          message: 'No services to start.',
        };
      }

      for (const service of devEnviron.services) {
        CdLog.info(`Starting service: ${service.serviceName}`);

        if (!service.configuration) {
          CdLog.warning(`Skipping ${service.serviceName}: No configuration found.`);
          continue;
        }

        // Ensure authentication before starting
        if (service.credentials) {
          const isAuthenticated = await this.authenticateService(service);
          if (!isAuthenticated) {
            throw new Error(`Authentication failed for ${service.serviceName}`);
          }
        }

        // Start service based on its type
        await this.ctlService.startService(service);

        CdLog.success(`Successfully started ${service.serviceName}`);
      }

      this.progressTracker.updateProgress(stepKey, 'completed', 1, 1);

      return {
        data: null,
        state: true,
        message: 'All services started successfully.',
      };
    } catch (error) {
      this.progressTracker.updateProgress(stepKey, 'failed');
      return {
        data: null,
        state: false,
        message: `Failed to start services: ${(error as Error).message}`,
      };
    }
  }

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

  protected getTypeId(): number {
    return 1; // Environment type
  }

  // Get all applications
  async getAllApps(): Promise<CdFxReturn<CdDescriptor[]>> {
    try {
      const result = await this.read(); // Fetch all applications
      return {
        ...result,
        data: result.data ?? [],
      };
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

  /**
   * This method takes in a context name, workstation name and defaultEnvironment to constrct
   * development denvironment data. The output is expected to be used for setting up development environment.
   * Idealy the defaultEnvironment should come from profile data as opposed to the model file (only used for experiments).
   * Most data set up in model files are experimental. In production the data should come from profiles and other nested items saved in redis.
   * @param name // name of application. In descriptors, it is refered to as 'context'
   * @param workstationName // the workstation where the setup is being done
   * @returns // Promise<CdFxReturn<EnvironmentDescriptor>>
   */
  async buildEnvironmentData(
    name: string,
    workstation: string,
  ): Promise<CdFxReturn<EnvironmentDescriptor | null>> {
    CdLog.debug(`EnvironmentService::buildEnvironmentData()/name:${name}`);
    CdLog.debug(`EnvironmentService::buildEnvironmentData()/workstation:${workstation}`);
    /**
     * pull appropriate profile from the cd-cli.config.json (which is a session storage from database)
     */
    const ctlCdCliProfile = new CdCliProfileController();
    const ret = await ctlCdCliProfile.getProfileByName(name);
    CdLog.debug(`EnvironmentService::buildEnvironmentData()/ret:${ret}`);
    if (!ret.state || !ret.data) {
      CdLog.debug('could not load profiles');
      return { state: false, data: null, message: 'could not load profile' };
    }

    const cdCliProfile: ProfileModel = ret.data;
    CdLog.debug('CdAutoGitController::getGitHubProfile()/cdCliProfile:', cdCliProfile);

    const environment = cdCliProfile.cdCliProfileData?.details;
    CdLog.debug(`EnvironmentService::buildEnvironmentData()/environment:${environment}`);
    if (!environment) {
      return {
        data: null,
        state: false,
        message: `Failed to get descriptor with the name ${name}`,
      };
    }

    // const devEnv = { ...defaultEnvironment };
    const devEnv = { ...environment };

    /**
     * The source should eventually be from databse (preferably redis)
     * For experiments, the data will be set at the model files.
     */
    const resCiCd = [getCiCdByName([name], knownCiCds)];
    CdLog.debug(`EnvironmentService::buildEnvironmentData()/resCiCd:${resCiCd}`);
    if (resCiCd) {
      devEnv.ciCd = resCiCd;
    }

    /**
     * Use context to pull the relevant environment variables
     * The source should eventually be from databse (preferably redis)
     * For experiments, the data will be set at the model files.
     */
    const resEnvironmentVariables = getEnvironmentVariablesByContext(name);
    CdLog.debug(
      `EnvironmentService::buildEnvironmentData()/resEnvironmentVariables:${resEnvironmentVariables}`,
    );

    if (resEnvironmentVariables) {
      devEnv.environmentVariables = resEnvironmentVariables;
    }

    const resServices = getServiceByName([name], services);
    CdLog.debug(`EnvironmentService::buildEnvironmentData()/resServices:${resServices}`);
    if (resServices) {
      devEnv.services = resServices;
    }

    const resTestingFrameworks = getTestingFrameworkByContext(name, testingFrameworks);
    CdLog.debug(
      `EnvironmentService::buildEnvironmentData()/resTestingFrameworks:${resTestingFrameworks}`,
    );
    if (resTestingFrameworks) {
      devEnv.testingFrameworks = resTestingFrameworks;
    }

    const resVersionControl = getVersionControlByContext(name, repoRegistry);
    CdLog.debug(
      `EnvironmentService::buildEnvironmentData()/resVersionControl:${resVersionControl}`,
    );
    if (resVersionControl) {
      devEnv.versionControl = resVersionControl;
    }

    const resWorkstation = getWorkstationByName(workstation, workstations);
    CdLog.debug(`EnvironmentService::buildEnvironmentData()/resWorkstation:${resWorkstation}`);
    if (resWorkstation) {
      devEnv.workstation = resWorkstation;
    }
    // Ensure devEnv has a workstation property before validation
    if (!devEnv.workstation) {
      return {
        data: null,
        state: false,
        message: 'Development environment is missing a workstation',
      };
    }
    // Explicitly cast devEnv to EnvironmentDescriptor since workstation is now guaranteed
    const retValidDevEnv = this.validateEnvironment(devEnv as EnvironmentDescriptor);
    CdLog.debug(`EnvironmentService::buildEnvironmentData()/retValidDevEnv:${retValidDevEnv}`);
    if (!retValidDevEnv.state) {
      return CD_FX_FAIL;
    }

    // Ensure the returned object has the required 'workstation' property
    return {
      data: {
        ...devEnv,
        workstation: devEnv.workstation,
      } as EnvironmentDescriptor,
      state: true,
      message: '',
    };
  }

  validateEnvironment(devEnv: EnvironmentDescriptor): CdFxReturn<boolean> {
    if (!devEnv) {
      return {
        data: false,
        state: false,
        message: 'Development environment is missing',
      };
    }

    // Validate workstation
    if (!this.svWorkstation.validateWorkstation(devEnv.workstation)) {
      return { data: false, state: false, message: 'Invalid workstation' };
    }

    // Validate services (if present)
    if (devEnv.services) {
      const hasUnknownService = devEnv.services.some(
        (service) => service.serviceType === 'unknown',
      );
      if (hasUnknownService) {
        return { data: false, state: false, message: 'Invalid service found' };
      }
    }

    // Validate testing frameworks (if present)
    if (devEnv.testingFrameworks) {
      const hasUnknownFramework = devEnv.testingFrameworks.some(
        (framework) => framework.type === 'unknown',
      );
      if (hasUnknownFramework) {
        return {
          data: false,
          state: false,
          message: 'Invalid testing framework found',
        };
      }
    }

    // Validate version control (if present)
    if (devEnv.versionControl) {
      const hasInvalidRepo = devEnv.versionControl.some((vc) => !vc.repository);
      if (hasInvalidRepo) {
        return {
          data: false,
          state: false,
          message: 'Invalid version control repository',
        };
      }
    }

    return {
      data: true,
      state: true,
      message: 'Valid development environment',
    };
  }
}
