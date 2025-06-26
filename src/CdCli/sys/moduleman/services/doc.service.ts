// import { SqliteStore } from "../store/SqliteStore";
// import { DocModel } from "../entities/DocModel";

import { ObjectLiteral } from 'typeorm';
import { CD_FX_FAIL, CdFxReturn, IQuery } from '../../base/IBase.js';
import { DocModel } from '../models/doc.model.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import { BaseService } from '../../base/base.service.js';
import config from '../../../../config.js';
import { GenericService } from '../../base/generic-service.js';
import { DocTypeModel } from '../models/doc-type.model.js';

export class DocService extends GenericService<DocModel> {
  //   private b = new BaseService<DocModel>();

  defaultDs = config.ds.sqlite;
  // Define validation rules
  cRules: any = {
    required: ['docName', 'docFrom', 'docTypeId', 'companyId'],
    noDuplicate: [],
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////
  // ADAPTATION FROM GENERIC SERVICE
  constructor() {
    super(DocModel);
  }

  /**
   * Validate input before processing create
   */
  async validateCreate(pl: DocModel): Promise<CdFxReturn<boolean>> {
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
        docName: pl.docName,
        docTypeId: pl.docTypeId,
      },
    };
    const serviceInput = {
      serviceModel: DocModel,
      docName: 'Validate Duplicate Doc',
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
    pl: DocModel,
  ): Promise<CdFxReturn<DocModel | ObjectLiteral | null >> {
    const query = {
      where: { docGuid: pl.docGuid },
    };

    const serviceInput = {
      serviceModel: DocModel,
      docName: 'Fetch Created Doc',
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

  async getDoc(
    q: IQuery,
  ): Promise<CdFxReturn<DocModel[] | ObjectLiteral[] | unknown>> {
    // Validate query input
    if (!q || !q.where || Object.keys(q.where).length === 0) {
      return {
        data: null,
        state: false,
        message: 'Invalid query: "where" condition is required',
      };
    }

    // const serviceInput = {
    //   serviceModel: DocModel,
    //   docName: 'DocService::getDoc',
    //   cmd: {
    //     action: 'find',
    //     query: q,
    //   },
    //   dSource: this.defaultDs,
    // };
    const serviceInput = {
      serviceModel: DocModel,
      docName: `Read Doc`,
      cmd: { action: 'find', query: q },
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
      CdLog.error(`DocService.getDoc() - Error: ${e.message}`);
      return {
        data: null,
        state: false,
        message: `Error retrieving Doc: ${e.message}`,
      };
    }
  }

  /**
   * This method is mostly used during "Create" process of any controller
   * It is used to save meta data of the Create transaction.
   * @param req
   * @param res
   * @returns
   */
  async getDocTypeId(req, res, pl): Promise<number> {
    let ret = 0;
    const m = req.post.m;
    const c = req.post.c;
    const a = req.post.a;
    const resultDocType = await this.getDocTypeByName(req, res, `${c}_${a}`);
    if (!resultDocType.state || !resultDocType.data) {
      return NaN;
    }

    const result = resultDocType.data;
    if (result.length > 0) {
      ret = result[0].docTypeId;
    } else {
      const r: any = await this.createDocType(pl);
      // ret = r[0].docTypeId;
      ret = r.docTypeId;
    }
    return await ret;
  }

  async createDocType(pl: DocTypeModel): Promise<CdFxReturn<DocTypeModel | null >> {
    const b = new BaseService<DocTypeModel>();
    const serviceInput = {
      serviceModel: DocTypeModel,
      docName: `Create DocType`,
      dSource: this.defaultDs,
      data: pl,
    };

    const result = await b.create(null, null, serviceInput);

    if ('state' in result && result.state) {
      return result as CdFxReturn<DocTypeModel>;
    } else {
      return CD_FX_FAIL;
    }
  }

  beforeUpdate(q: any) {
    if (q.update.CoopEnabled === '') {
      q.update.CoopEnabled = null;
    }
    return q;
  }

  async getDocTypeByName(
    req: Request | null,
    res: Request | null,
    docTypeName: string,
  ): Promise<CdFxReturn<DocTypeModel[] | null >> {
    const b = new BaseService<DocTypeModel>();
    const serviceInput = {
      serviceModel: DocTypeModel,
      docName: 'DocService::getDocTypeByName',
      cmd: {
        action: 'find',
        query: { where: { docTypeName: `${docTypeName}` } },
      },
      dSource: this.defaultDs,
    };
    const resultRead = await b.read(null, null, serviceInput);
    if ('state' in resultRead) {
      return await resultRead;
    } else {
      return CD_FX_FAIL;
    }
  }
}
