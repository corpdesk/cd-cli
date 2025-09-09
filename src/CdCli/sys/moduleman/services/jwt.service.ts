// import { SqliteStore } from "../store/SqliteStore";
// import { JwtModel } from "../entities/JwtModel";

import { ObjectLiteral } from 'typeorm';
import { CD_FX_FAIL, CdFxReturn, IQuery } from '../../base/i-base.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import { BaseService } from '../../base/base.service.js';
import config from '../../../../config.js';
import { GenericService } from '../../base/generic-service.js';
import { DocModel } from '../models/doc.model.js';
import { JwtModel } from '../models/jwt.model.js';

export class JwtService extends GenericService<JwtModel> {
  // private b = new BaseService<JwtModel>();

  defaultDs = config.ds.sqlite;
  // Define validation rules
  cRules: any = {
    required: ['jwtName', 'jwtTypeGuid', 'jwtGuid'],
    noDuplicate: ['jwtName', 'jwtTypeGuid'],
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////
  // ADAPTATION FROM GENERIC SERVICE
  constructor() {
    super(JwtModel);
  }

  /**
   * Validate input before processing create
   */
  async validateCreate(pl: JwtModel): Promise<CdFxReturn<boolean>> {
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
        jwtName: pl.jwtName,
        jwtTypeId: pl.jwtTypeId,
      },
    };
    const serviceInput = {
      serviceModel: JwtModel,
      docName: 'Validate Duplicate Jwt',
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
    pl: JwtModel,
  ): Promise<CdFxReturn<JwtModel | ObjectLiteral | null >> {
    const query = {
      where: { jwtGuid: pl.jwtGuid },
    };

    const serviceInput = {
      serviceModel: JwtModel,
      docName: 'Fetch Created Jwt',
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

  async getJwt(
    q: IQuery,
  ): Promise<CdFxReturn<JwtModel[] | ObjectLiteral[] | unknown>> {
    // Validate query input
    if (!q || !q.where || Object.keys(q.where).length === 0) {
      return {
        data: null,
        state: false,
        message: 'Invalid query: "where" condition is required',
      };
    }

    const serviceInput = {
      serviceModel: JwtModel,
      docName: 'JwtService::getJwt',
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
      CdLog.error(`JwtService.getJwt() - Error: ${e.message}`);
      return {
        data: null,
        state: false,
        message: `Error retrieving Jwt: ${e.message}`,
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
