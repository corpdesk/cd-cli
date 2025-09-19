import { CdCliProfileController } from '../../../sys/cd-cli/index.js';
import { CdFxReturn, CdFxStateLevel, ICdRequest, ICdResponse } from '../../../sys/base/i-base.js';
import { CdCtx, CdModuleDescriptor } from '../../../sys/dev-descriptor/index.js';
import { SessonController } from '../../user/index.js';
import config from '../../../../config.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import { BaseService } from '../../base/base.service.js';
import { HttpService } from '../../base/http.service.js';
import { EnvCreate, EnvPurge } from '../models/module.model.js';
import { inspect } from 'node:util';

export class ModuleRegisterService {
  b = new BaseService();
  http = new HttpService();
  ctlSession = new CdCliProfileController();
  cdToken = '';

  constructor() {}

  async init() {
    const ctlSession = new SessonController();
    const ctlCdCliProfile = new CdCliProfileController();
    const profileRet = await ctlCdCliProfile.loadProfiles();
    if (!profileRet.state) {
      // CdLog.error(`Failed to load profiles: ${profileRet.message}`);
      return null; // Handle the failure case properly
    }

    const r = await ctlSession.getSession(config.cdApiLocal);
    if (r && r.cd_token) {
      this.cdToken = r.cd_token;
      CdLog.info(`GenEntityService: this.cdToken:${this.cdToken}`);
      CdLog.info('cdToken has been set');
    } else {
      CdLog.error('There is a problem setting cdToken');
    }
  }

  setCdToken(token: string): this {
    EnvCreate.dat.token = token;
    EnvPurge.dat.token = token;
    this.b.logWithContext(this, `setCdToken:token`, token, 'debug');
    return this;
  }

  setModuleName(name: string): this {
    EnvCreate.dat.f_vals[0].data.moduleName = name;
    EnvCreate.dat.f_vals[0].cdObj.cdObjName = name;
    EnvPurge.dat.f_vals[0].data.moduleName = name;
    return this;
  }

  setRequestCtx(ctx: CdCtx): this {
    EnvCreate.ctx = ctx;
    EnvPurge.ctx = ctx;
    return this;
  }

  setModuleCtx(ctx: CdCtx): this {
    EnvCreate.dat.f_vals[0].data.isSysModule = ctx === CdCtx.Sys;
    return this;
  }

  build(): ICdRequest {
    return EnvCreate;
  }

  async registerModuleInCdInstance(moduleData: CdModuleDescriptor): Promise<CdFxReturn<null>> {
    try {
      this.b.logWithContext(
        this,
        `registerModuleInCdInstance:start`,
        {
          module: moduleData.name,
        },
        'debug',
      );

      await this.init();

      // 1️⃣ Build ICdRequest envelope for module registration
      this.setCdToken(this.cdToken)
        .setModuleName(moduleData.name)
        .setRequestCtx(CdCtx.Sys)
        .setModuleCtx(moduleData.ctx)
        .build();

      this.b.logWithContext(
        this,
        `registerModuleInCdInstance:envCreate`,
        inspect(EnvCreate, { depth: 4 }),
        'debug',
      );

      // 2️⃣ send request to cd-api
      const response = await this.http.proc(EnvCreate, 'cdApiLocal');

      this.b.logWithContext(
        this,
        `registerModuleInCdInstance:responseRaw`,
        inspect(response, { depth: 4 }),
        'debug',
      );

      if (!response.state || !response.data) {
        const msg = `Failed to contact cd-api for module '${moduleData.name}'`;
        this.b.logWithContext(this, `registerModuleInCdInstance:networkError`, { msg }, 'error');
        return {
          state: CdFxStateLevel.NetworkError,
          data: null,
          message: msg,
        };
      }

      const cdResp: ICdResponse = response.data;

      // 3️⃣ Validate app_state
      if (!cdResp.app_state.success) {
        const appMsg =
          cdResp.app_state.info?.app_msg ||
          cdResp.app_state.info?.messages?.join('; ') ||
          'Unknown error during module registration';

        this.b.logWithContext(
          this,
          `registerModuleInCdInstance:failed`,
          {
            module: moduleData.name,
            appMsg,
          },
          'error',
        );

        return {
          state: CdFxStateLevel.Error,
          data: null,
          message: `Module '${moduleData.name}' registration failed: ${appMsg}`,
        };
      }

      // 4️⃣ If successful
      const successMsg =
        cdResp.app_state.info?.app_msg || `Module '${moduleData.name}' registered successfully.`;

      this.b.logWithContext(
        this,
        `registerModuleInCdInstance:success`,
        {
          module: moduleData.name,
          msg: successMsg,
        },
        'debug',
      );

      return {
        state: CdFxStateLevel.Success,
        data: null,
        message: successMsg,
      };
    } catch (e: any) {
      const msg = `Failed to register module '${moduleData.name}': ${e.message || e}`;
      this.b.logWithContext(this, `registerModuleInCdInstance:exception`, { error: e }, 'error');
      return {
        state: CdFxStateLevel.SystemError,
        data: null,
        message: msg,
      };
    }
  }

  // async deRegisterModuleFromCdInstance(moduleData: CdModuleDescriptor): Promise<CdFxReturn<null>> {
  //   try {
  //     this.b.logWithContext(
  //       this,
  //       `registerModuleInCdInstance:start`,
  //       {
  //         module: moduleData.name,
  //       },
  //       'debug',
  //     );

  //     await this.init();

  //     // 1️⃣ Build ICdRequest envelope for module registration
  //     this.setCdToken(this.cdToken).setModuleName(moduleData.name).setRequestCtx(CdCtx.Sys).build();

  //     this.b.logWithContext(this, `registerModuleInCdInstance:this.cdToken`, this.cdToken, 'debug');
  //     this.b.logWithContext(this, `registerModuleInCdInstance:EnvPurge`, inspect(EnvPurge, {depth: 4}), 'debug');

  //     // 2️⃣ send request to cd-api
  //     const response = await this.http.proc(EnvPurge, 'cdApiLocal');

  //     this.b.logWithContext(this, `registerModuleInCdInstance:responseRaw`, response, 'debug');

  //     if (!response.state || !response.data) {
  //       const msg = `Failed to contact cd-api for module '${moduleData.name}'`;
  //       this.b.logWithContext(this, `registerModuleInCdInstance:networkError`, { msg }, 'error');
  //       return {
  //         state: CdFxStateLevel.NetworkError,
  //         data: null,
  //         message: msg,
  //       };
  //     }

  //     const cdResp: ICdResponse = response.data;

  //     // 3️⃣ Validate app_state
  //     if (!cdResp.app_state.success) {
  //       const appMsg =
  //         cdResp.app_state.info?.app_msg ||
  //         cdResp.app_state.info?.messages?.join('; ') ||
  //         'Unknown error during module registration';

  //       this.b.logWithContext(
  //         this,
  //         `registerModuleInCdInstance:failed`,
  //         {
  //           module: moduleData.name,
  //           appMsg,
  //         },
  //         'error',
  //       );

  //       return {
  //         state: CdFxStateLevel.Error,
  //         data: null,
  //         message: `Module '${moduleData.name}' registration failed: ${appMsg}`,
  //       };
  //     }

  //     // 4️⃣ If successful
  //     const successMsg =
  //       cdResp.app_state.info?.app_msg || `Module '${moduleData.name}' registered successfully.`;

  //     this.b.logWithContext(
  //       this,
  //       `registerModuleInCdInstance:success`,
  //       {
  //         module: moduleData.name,
  //         msg: successMsg,
  //       },
  //       'debug',
  //     );

  //     return {
  //       state: CdFxStateLevel.Success,
  //       data: null,
  //       message: successMsg,
  //     };
  //   } catch (e: any) {
  //     const msg = `Failed to register module '${moduleData.name}': ${e.message || e}`;
  //     this.b.logWithContext(this, `registerModuleInCdInstance:exception`, { error: e }, 'error');
  //     return {
  //       state: CdFxStateLevel.SystemError,
  //       data: null,
  //       message: msg,
  //     };
  //   }
  // }
  async deRegisterModuleFromCdInstance(moduleData: CdModuleDescriptor): Promise<CdFxReturn<null>> {
    try {
      this.b.logWithContext(
        this,
        `deRegisterModuleFromCdInstance:start`,
        { module: moduleData.name },
        'debug',
      );

      await this.init();

      this.setCdToken(this.cdToken).setModuleName(moduleData.name).setRequestCtx(CdCtx.Sys).build();

      const response = await this.http.proc(EnvPurge, 'cdApiLocal');
      this.b.logWithContext(this, `deRegisterModuleFromCdInstance:responseRaw`, response, 'debug');

      if (!response.state || !response.data) {
        const msg = `Failed to contact cd-api for module '${moduleData.name}'`;
        return {
          state: CdFxStateLevel.NetworkError,
          data: null,
          message: msg,
        };
      }

      const cdResp: ICdResponse = response.data;

      // 3️⃣ Validate app_state
      if (!cdResp.app_state.success) {
        const appMsg =
          cdResp.app_state.info?.app_msg ||
          cdResp.app_state.info?.messages?.join('; ') ||
          'Unknown error during module deregistration';

        // 🔎 Detect the idempotency case
        if (/not found/i.test(appMsg)) {
          const skipMsg = `Module '${moduleData.name}' already absent, skipping purge.`;
          this.b.logWithContext(
            this,
            `deRegisterModuleFromCdInstance:notFound`,
            { appMsg },
            'warn',
          );

          return {
            state: CdFxStateLevel.LogicalFailure, // workflow will proceed
            data: null,
            message: skipMsg,
          };
        }

        // 🚨 Other failures remain actual errors
        this.b.logWithContext(
          this,
          `deRegisterModuleFromCdInstance:failed`,
          { module: moduleData.name, appMsg },
          'error',
        );
        return {
          state: CdFxStateLevel.Error,
          data: null,
          message: `Module '${moduleData.name}' deregistration failed: ${appMsg}`,
        };
      }

      // 4️⃣ If successful
      const successMsg =
        cdResp.app_state.info?.app_msg || `Module '${moduleData.name}' deregistered successfully.`;

      return {
        state: CdFxStateLevel.Success,
        data: null,
        message: successMsg,
      };
    } catch (e: any) {
      const msg = `Failed to deregister module '${moduleData.name}': ${e.message || e}`;
      this.b.logWithContext(
        this,
        `deRegisterModuleFromCdInstance:exception`,
        { error: e },
        'error',
      );
      return {
        state: CdFxStateLevel.SystemError,
        data: null,
        message: msg,
      };
    }
  }
}
