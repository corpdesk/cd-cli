import type { CdFxReturn, CdRequest, IQuery } from '../../base/i-base.js';
import type { CdDescriptor } from '../models/dev-descriptor.model.js';
import { CdAppService } from '../services/cd-app.service.js';
import { CdAppDescriptor } from '../models/cd-app.model.js';

export class CdAppController {
  svCdApp;
  constructor() {
    this.svCdApp = new CdAppService();
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
    return this.svCdApp.create(d);
  }

  async read(q?: IQuery): Promise<CdFxReturn<CdDescriptor[]>> {
    return this.svCdApp.read(q);
  }

  async update(q: IQuery): Promise<CdFxReturn<null>> {
    return this.svCdApp.update(q);
  }

  async delete(q: IQuery): Promise<CdFxReturn<null>> {
    return this.svCdApp.delete(q);
  }

  // Get all applications
  async getAllApps(): Promise<CdFxReturn<CdDescriptor[]>> {
    return this.svCdApp.getAllApps();
  }

  // Get a single app by name
  async getAppByName(name: string): Promise<CdFxReturn<CdDescriptor[]>> {
    return this.svCdApp.getAppByName(name);
  }

  async upgrade(appDescriptor: CdAppDescriptor, version: string): Promise<CdFxReturn<null>> {
    const svApp = new CdAppService();
    return await svApp.upgrade(appDescriptor, version);
  }
}
