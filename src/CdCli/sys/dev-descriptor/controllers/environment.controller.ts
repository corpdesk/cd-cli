/**
 * This class should be able to cover:
 * - development environment
 * - production environment
 * - sandbox environment
 * - other custom environment
 *
 * The difference can be enforced with the BaseDescriptor.context
 * The context be be in the name of the application or profile name at the cd-cli.config.json
 */
/* eslint-disable style/operator-linebreak */
import type { CdDescriptor } from '../models/dev-descriptor.model.js';
import { CD_FX_FAIL, type CdFxReturn, type IQuery } from '../../base/i-base.js';
import { CdCliProfileController } from '../../cd-cli/controllers/cd-cli-profile.cointroller.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import {} from '../models/environment.model.js';
import { CiCdService } from '../services/ci-cd.service.js';
import { EnvironmentService } from '../services/environment.service.js';
import { DevDescriptorController } from './dev-descriptor.controller.js';

export class EnvironmentController {
  svEnvironment: EnvironmentService;
  ctlDevDescriptor: DevDescriptorController;
  // ctlCdCliProfile: CdCliProfileController;
  svCiCd: CiCdService;
  constructor() {
    this.svEnvironment = new EnvironmentService();
    this.ctlDevDescriptor = new DevDescriptorController();
    // ctlCdCliProfile = new CdCliProfileController();
    this.svCiCd = new CiCdService();
  }

  /**
   * Creates a development environment for a given workstation.
   *
   * @param {string} name - The name of the application (e.g., cd-api, cd-frontend).
   *                        This is also referred to as 'context' in BaseDescriptor.
   *                        Since all descriptors inherit BaseDescriptor, this property
   *                        is used to pull descriptors set for a given application.
   *                        The data type for `context` is `string[]`, allowing
   *                        a descriptor to be associated with multiple applications.
   * @param {string} workstationName - The name of the workstation to set
   *                                   the development environment for.
   * @returns {Promise<CdFxReturn<null>>} - A promise resolving to a CdFxReturn object
   *                                        indicating success or failure.
   */
  async createEnvironment(
    name: string,
    workstation: string,
  ): Promise<CdFxReturn<null>> {
    CdLog.debug(`EnvironmentController::createEnvironment()/name:${name}`);
    CdLog.debug(
      `EnvironmentController::createEnvironment()/workstation:${workstation}`,
    );
    /**
     * construct environment data via constructDevEnvironment()
     * that will be used to set up the environment
     */
    const resultEnv = await this.svEnvironment.buildEnvironmentData(
      name,
      workstation,
    );
    CdLog.debug(
      `EnvironmentController::createEnvironment()/resultEnv:${resultEnv}`,
    );
    if (!resultEnv.state || !resultEnv.data) {
      return CD_FX_FAIL;
    }

    /**
     * use the above result to set up the environment
     */
    const result = await this.svEnvironment.setupEnvironment(resultEnv.data);
    CdLog.debug(`EnvironmentController::createEnvironment()/result:${result}`);

    CdLog.debug('result:', result);
    return result;
  }

  /**
   * Create a new development environment
   * - scripts to setup development environment.
   *    - npm
   *    - mysql
   *    - redis
   * - idempotency
   *
   * @param ;d: json data for descriptor for EnvironmentService in the format of CdDescriptor
   * @returns
   */
  async create(d: CdDescriptor): Promise<CdFxReturn<null>> {
    return this.svEnvironment.create(d);
  }

  async read(q?: IQuery): Promise<CdFxReturn<CdDescriptor[] | null >> {
    return this.svEnvironment.read(q);
  }

  async update(q: IQuery): Promise<CdFxReturn<null>> {
    return this.svEnvironment.update(q);
  }

  async delete(q: IQuery): Promise<CdFxReturn<null>> {
    return this.svEnvironment.delete(q);
  }

  // Get all applications
  async getAllApps(): Promise<CdFxReturn<CdDescriptor[]>> {
    return this.svEnvironment.getAllApps();
  }

  // Get a single app by name
  async getAppByName(name: string): Promise<CdFxReturn<CdDescriptor[] | null >> {
    return this.svEnvironment.getAppByName(name);
  }
}
