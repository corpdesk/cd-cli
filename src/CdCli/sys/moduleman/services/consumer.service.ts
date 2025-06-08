// import { SqliteStore } from "../store/SqliteStore";
// import { ConsumerModel } from "../entities/ConsumerModel";

import { ObjectLiteral } from 'typeorm';
import {
  CD_FX_FAIL,
  CdFxReturn,
  IQuery,
  IServiceInput,
} from '../../base/IBase.js';
import { ConsumerModel } from '../models/consumer.model.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import { BaseService } from '../../base/base.service.js';
import config from '../../../../config.js';
import { GenericService } from '../../base/generic-service.js';
import { Logger } from 'winston';
import { CompanyService } from './company.service.js';
import { CompanyModel } from '../models/company.model.js';
import { Observable } from 'rxjs';

export class ConsumerService extends GenericService<ObjectLiteral> {
  // b = new BaseService<ConsumerModel>();
  logger: Logger;
  defaultDs = config.ds.sqlite;
  // Define validation rules
  cRules: any = {
    required: ['consumerName', 'consumerTypeGuid', 'consumerGuid'],
    noDuplicate: ['consumerName', 'consumerTypeGuid'],
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////
  // ADAPTATION FROM GENERIC SERVICE
  constructor() {
    super(ConsumerModel);
    this.logger = new Logger();
  }

  /**
   * Validate input before processing create
   * If generated automatically, should depend on cdRules/create
   */
  async validateCreate(pl: ConsumerModel): Promise<CdFxReturn<boolean>> {
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
        companyId: pl.companyId,
      },
    };
    const serviceInput = {
      serviceModel: ConsumerModel,
      docName: 'Validate Duplicate Consumer',
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
    pl: ConsumerModel,
  ): Promise<CdFxReturn<ConsumerModel | ObjectLiteral>> {
    const query = {
      where: { consumerGuid: pl.consumerGuid },
    };

    const serviceInput = {
      serviceModel: ConsumerModel,
      docName: 'Fetch Created Consumer',
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

  async getConsumer(
    q: IQuery,
  ): Promise<CdFxReturn<ConsumerModel[] | ObjectLiteral[] | unknown>> {
    // Validate query input
    if (!q || !q.where || Object.keys(q.where).length === 0) {
      return {
        data: null,
        state: false,
        message: 'Invalid query: "where" condition is required',
      };
    }

    const serviceInput = {
      serviceModel: ConsumerModel,
      docName: 'ConsumerService::getConsumer',
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
      CdLog.error(`ConsumerService.getConsumer() - Error: ${e.message}`);
      return {
        data: null,
        state: false,
        message: `Error retrieving Consumer: ${e.message}`,
      };
    }
  }

  beforeUpdate(q: any) {
    if (q.update.CoopEnabled === '') {
      q.update.CoopEnabled = null;
    }
    return q;
  }

  async getConsumerI(req, res, q: IQuery): Promise<ConsumerModel[] | null> {
    this.logger.info('ConsumerService::getConsumerI()/query:', { query: q });
    const serviceInput: IServiceInput<ConsumerModel> = {
      serviceInstance: this,
      serviceModel: ConsumerModel,
      docName: 'ConsumerService::getConsumerI',
      cmd: {
        action: 'find',
        query: q,
      },
      dSource: config.ds.sqlite,
    };
    const resultConsumer = await this.read(req, res, serviceInput);
    if (!resultConsumer.state || !resultConsumer.data) {
      return null;
    }
    return resultConsumer.data as ConsumerModel[];
  }

  async getCompanyData(
    req,
    res,
    consGuid: string,
  ): Promise<CompanyModel[] | null> {
    const svCompany = new CompanyService();
    console.log('moduleman/create::getCompanyData()/coGuid:', consGuid);
    const serviceInput: IServiceInput<ConsumerModel> = {
      serviceInstance: this,
      serviceModel: ConsumerModel,
      docName: 'CompanyService::getCompanyData',
      cmd: {
        action: 'find',
        query: { where: { consumerGuid: consGuid } },
      },
      dSource: config.ds.sqlite,
    };
    const resultConsumer = await this.read(req, res, serviceInput);
    if (!resultConsumer.state || !resultConsumer.data) {
      return null;
    }
    const consumerData = resultConsumer.data;
    return await svCompany.getCompanyI(req, res, {
      where: { companyId: consumerData[0].companyId },
    });
  }

  getConsumerByGuid$(req, res, consmGuid): Observable<ConsumerModel[]> {
    // this.logger.logInfo('starting getConsumerByGuid(req, res, consmGuid)');
    const serviceInput: IServiceInput<ConsumerModel> = {
      serviceInstance: this,
      serviceModel: ConsumerModel,
      docName: 'ConsumerService::getConsumerByGuid',
      cmd: {
        action: 'find',
        query: { where: { consumerGuid: consmGuid } },
      },
      dSource: this.defaultDs,
    };
    return this.b.read$(req, res, serviceInput);
  }

  async getConsumerByGuid(req, res, consmGuid): Promise<any> {
    // this.logger.logInfo('starting getConsumerByGuid(req, res, consmGuid)');
    const serviceInput: IServiceInput<ConsumerModel> = {
      serviceInstance: this,
      serviceModel: ConsumerModel,
      docName: 'ConsumerService::getConsumerByGuid',
      cmd: {
        action: 'find',
        query: { where: { consumerGuid: consmGuid } },
      },
      dSource: this.defaultDs,
    };
    return this.b.read(req, res, serviceInput);
  }
}
