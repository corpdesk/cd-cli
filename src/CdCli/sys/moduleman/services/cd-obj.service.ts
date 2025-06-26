// import { SqliteStore } from "../store/SqliteStore";
// import { CdObjModel } from "../entities/CdObjModel";

import { ObjectLiteral } from 'typeorm';
import { CD_FX_FAIL, CdFxReturn, CreateIParams, IQuery, IServiceInput } from '../../base/IBase.js';
import { CdObjModel } from '../models/cd-obj.model.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import { BaseService } from '../../base/base.service.js';
import config from '../../../../config.js';
import { GenericService } from '../../base/generic-service.js';
import { SessionService } from '../../user/services/session.service.js';

export class CdObjService extends GenericService<CdObjModel> {
  // private b = new BaseService<CdObjModel>();
  serviceModel?: CdObjModel;
  defaultDs = config.ds.sqlite;
  // Define validation rules
  cRules: any = {
    required: ['cdObjName', 'cdObjTypeGuid', 'cdObjGuid'],
    noDuplicate: ['cdObjName', 'cdObjTypeGuid'],
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////
  // ADAPTATION FROM GENERIC SERVICE
  constructor() {
    super(CdObjModel);
  }

  // async create(req, res, serviceInput: IServiceInput<CdObjModel>) {
  //   console.log("CdObjService::create()/01");
  //   const svSess = new SessionService();
  //   if (await this.validateCreate(req)) {
  //     console.log("CdObjService::create()/02");
  //     await this.beforeCreate(req, res);
  //     const serviceInput = {
  //       serviceInstance: this,
  //       serviceModel: CdObjModel,
  //       serviceModelInstance: this.serviceModel,
  //       docName: "Create cdObj",
  //       dSource: 1,
  //     };
  //     console.log("CdObjService::create()/req.post:", req.post);
  //     const respData = await this.b.create(req, res, serviceInput);
  //     this.b.i.app_msg = "new cdObj created";
  //     this.b.setAppState(true, this.b.i, svSess.sessResp);
  //     this.b.cdResp.data = await respData;
  //     const r = await this.b.respond(req, res);
  //   } else {
  //     console.log("CdObjService::create()/03");
  //     const e = new Error("The input could not be validated");
  //     console.log("CdObjService::create()/e:", e);

  //     this.b.err.push(e.message); // Use e.message instead of e.toString()

  //     const i = {
  //       messages: this.b.err,
  //       code: "CdObjService:create",
  //       app_msg: "",
  //     };

  //     await this.b.serviceErr(req, res, e, i.code);
  //     await this.b.respond(req, res);
  //   }
  // }

  // async createI(
  //   req,
  //   res,
  //   createIParams: CreateIParams<CdObjModel>
  // ): Promise<CdObjModel | boolean> {
  //   // const params = {
  //   //   controllerInstance: this,
  //   //   model: CdObjModel,
  //   // };

  //   // console.log("CdObjService::createI()/this.cRules:", this.cRules);
  //   // // console.log("CdObjService::createI()/params:", params);
  //   // console.log("CdObjService::createI()/createIParams:", createIParams);
  //   // if (await this.b.validateUniqueI(req, res, createIParams)) {
  //   //   if (await this.b.validateRequiredI(req, res, createIParams)) {
  //   //     return await this.b.createI(req, res, createIParams);
  //   //   } else {
  //   //     this.b.i.app_msg = `the required fields ${this.cRules.required.join(
  //   //       ", "
  //   //     )} is missing`;
  //   //     this.b.err.push(this.b.i.app_msg);
  //   //     return false;
  //   //   }
  //   // } else {
  //   //   this.b.i.app_msg = `duplicate for ${this.cRules.noDuplicate.join(
  //   //     ", "
  //   //   )}   is not allowed`;
  //   //   this.b.err.push(this.b.i.app_msg);
  //   //   return false;
  //   // }
  //   createIParams.controllerData.cdObjGuid = this.b.getGuid();
  //   if (await this.validateCreate(req, res, createIParams.controllerData)) {
  //     return await this.b.createI(req, res, createIParams);
  //   } else {
  //     this.b.i.app_msg = `Error validating CdObj create`;
  //     this.b.err.push(this.b.i.app_msg);
  //     return false;
  //   }
  // }

  // async cdObjectExists(req, res, params): Promise<boolean> {
  //   const serviceInput: IServiceInput<CdObjModel> = {
  //     serviceInstance: this,
  //     serviceModel: CdObjModel,
  //     docName: "CdObjService::cdObjectExists",
  //     cmd: {
  //       action: "find",
  //       query: { where: params.filter },
  //     },
  //     dSource: 1,
  //   };
  //   return this.b.read(req, res, serviceInput);
  // }

  async beforeCreate(req, res): Promise<any> {
    this.b.setPlData(req, { key: "cdObjGuid", value: this.b.getGuid() });
    this.b.setPlData(req, { key: "cdObjEnabled", value: true });
    return true;
  }

  /**
   * Validate input before processing create
   */
  async validateCreate(pl: CdObjModel): Promise<CdFxReturn<boolean>> {
    const retState = true;
    // Ensure required fields exist
    for (const field of this.cRules.required) {
      if (!pl[field]) {
        return {
          data: false,
          state: false,
          message: `Missing required field: ${field}`,
        };
      }
    }

    // Check for duplicates
    const query = {
      where: {
        cdObjName: pl.cdObjName,
        cdObjTypeId: pl.cdObjTypeGuid,
      },
    };
    const serviceInput = {
      serviceModel: CdObjModel,
      docName: 'Validate Duplicate CdObj',
      dSource: this.defaultDs,
      cmd: { query },
    };

    const existingRecords = await this.b.read(null, null, serviceInput);
    if ('state' in existingRecords && 'data' in existingRecords) {
      if (!existingRecords.state || !existingRecords.data) {
        return { data: false, state: false, message: 'Validation failed' };
      }

      if (existingRecords.data.length > 0) {
        return { data: true, state: true, message: 'Validation passed' };
      } else {
        return { data: false, state: false, message: 'Validation failed' };
      }
    }

    return { data: false, state: false, message: 'Validation failed' };
  }

  /**
   * Fetch newly created record by guid
   */
  async afterCreate(
    pl: CdObjModel,
  ): Promise<CdFxReturn<CdObjModel | ObjectLiteral | null >> {
    const query = {
      where: { cdObjGuid: pl.cdObjGuid },
    };

    const serviceInput = {
      serviceModel: CdObjModel,
      docName: 'Fetch Created CdObj',
      dSource: this.defaultDs,
      cmd: { query },
    };

    const retResult = await this.b.read(null, null, serviceInput);
    if ('state' in retResult) {
      return retResult;
    } else {
      return CD_FX_FAIL;
    }
  }

  async getCdObj(
    q: IQuery,
  ): Promise<CdFxReturn<CdObjModel[] | ObjectLiteral[] | unknown>> {
    // Validate query input
    if (!q || !q.where || Object.keys(q.where).length === 0) {
      return {
        data: null,
        state: false,
        message: 'Invalid query: "where" condition is required',
      };
    }

    const serviceInput = {
      serviceModel: CdObjModel,
      docName: 'CdObjService::getCdObj',
      cmd: {
        action: 'find',
        query: q,
      },
      dSource: this.defaultDs,
    };

    try {
      const retResult = await this.b.read(null, null, serviceInput);

      if ('state' in retResult) {
        return retResult;
      } else {
        return CD_FX_FAIL;
      }
    } catch (e: any) {
      CdLog.error(`CdObjService.getCdObj() - Error: ${e.message}`);
      return {
        data: null,
        state: false,
        message: `Error retrieving CdObj: ${e.message}`,
      };
    }
  }

  beforeUpdate(q: any) {
    if (q.update.CoopEnabled === '') {
      q.update.CoopEnabled = null;
    }
    return q;
  }
}
