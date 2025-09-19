import config from '../../../../config.js';
import { CdFxReturn } from '../../base/i-base.js';
import { CdCliProfileController } from '../controllers/cd-cli-profile.cointroller.js';
import { ProfileContainer } from '../models/cd-cli-profile.model.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import { SessonController } from '../../user/index.js';
import { HttpService } from '../../base/http.service.js';

export class ProfileStoreService {
  private static profilesRet: CdFxReturn<ProfileContainer> | null = null;
  private static cdTokenRet: CdFxReturn<string> | null = null;
  private static baseUrl = '';

  /** Load profilesRet only once */
  static async init(): Promise<CdFxReturn<ProfileContainer>> {
    if (!this.profilesRet) {
      console.log(`ProfileStoreService::init()/loading profilesRet...`);
      const controller = new CdCliProfileController();
      this.profilesRet = await controller.loadProfiles();
      // this.profilesRet = await controller.getProfileByName(config.cdApiLocal)

      const ctlSession = new SessonController();
      const r = await ctlSession.getSession(config.cdApiLocal);

      const httpService = new HttpService(true); // Enable debug mode
      this.baseUrl = (await httpService.getCdApiUrl(config.cdApiLocal)) ?? '';
      if (r && r.cd_token) {
        this.cdTokenRet = { state: true, data: r.cd_token};
        CdLog.info(`GenEntityService: this.cdTokenRet:${this.cdTokenRet}`);
        CdLog.info('cdTokenRet has been set');
      } else {
        CdLog.error('There is a problem setting cdTokenRet');
      }
      console.log(`ProfileStoreService::init()/profilesRet loaded`);
    }
    return this.profilesRet;
  }

  /** Get already loaded profilesRet */
  static getProfiles(): CdFxReturn<ProfileContainer> {
    if (!this.profilesRet) {
      return {
        data: null,
        state: false,
        message: `ProfileStoreService not initialized. Call ProfileStoreService.init() first.`,
      };
    }
    return this.profilesRet;
  }

  /** Get already loaded profilesRet */
  static getCdToken(): CdFxReturn<string> {
    if (!this.cdTokenRet) {
      return {
        data: null,
        state: false,
        message: `ProfileStoreService not initialized. Call ProfileStoreService.init() first.`,
      };
    }
    return this.cdTokenRet;
  }

  static getBaseUrl(): string {
    return this.baseUrl;
  }

  /** Reload profilesRet if needed (e.g. after updates) */
  static async reload(): Promise<CdFxReturn<ProfileContainer>> {
    console.log(`ProfileStoreService::reload()/reloading profilesRet...`);
    const controller = new CdCliProfileController();
    // this.profilesRet = await controller.getProfileByName(config.cdApiLocal);
    this.profilesRet = await controller.loadProfiles();
    if (!this.profilesRet) {
      return {
        data: null,
        state: false,
        message: `ProfileStoreService reload failed. No profilesRet found.`,
      };
    }
    return this.profilesRet;
  }
}
