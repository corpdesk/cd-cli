import { EntityTarget, ObjectLiteral } from 'typeorm';
import { BaseService } from './base.service.js';
import config from '../../../config.js';
import {
  CD_FX_FAIL,
  CdFxReturn,
  CreateIParams,
  IQuery,
  IServiceInput,
} from './i-base.js';

export class GenericService<T extends ObjectLiteral> {
  b: BaseService<T>;
  protected defaultDs = config.ds.sqlite;

  constructor(private model: new () => T) {
    this.b = new BaseService<T>();
  }

  async create(
    req,
    res,
    serviceInput: any,
  ): Promise<CdFxReturn<T | ObjectLiteral | null>> {
    // const modelName =
    //   typeof this.model === 'function' ? this.model.name : String(this.model);
    // const serviceInput = {
    //   serviceModel: this.model,
    //   docName: `Create ${modelName}`,
    //   dSource: this.defaultDs,
    //   data: pl,
    // };


    const result = await this.b.create(req, res, serviceInput);

    if ('state' in result && result.state) {
      return result as CdFxReturn<T | ObjectLiteral | null>;
    } else {
      return CD_FX_FAIL;
    }
  }

  async createI(
    req,
    res,
    createIParams: CreateIParams<T>,
  ): Promise<T | boolean> {
    return await this.b.createI(req, res, createIParams);
  }

  async read(
    req,
    res,
    serviceInput: IServiceInput<T>,
  ): Promise<CdFxReturn<T[] | ObjectLiteral[] | unknown>> {
    // const serviceInput = {
    //   serviceModel: this.model,
    //   docName: `Read ${this.model.name}`,
    //   cmd: { action: 'find', query: q },
    //   dSource: this.defaultDs,
    // };

    const result = await this.b.read(req, req, serviceInput);

    return 'state' in result ? result : CD_FX_FAIL;
  }

  async update(
    req,
    res,
    serviceInput: any,
  ): Promise<CdFxReturn<T | ObjectLiteral | null>> {
    // const serviceInput = {
    //   serviceModel: this.model,
    //   docName: `Update ${this.model.name}`,
    //   cmd: { action: 'update', query: q },
    //   dSource: this.defaultDs,
    // };

    const result = await this.b.update(req, req, serviceInput);
    return 'state' in result ? result : CD_FX_FAIL;
  }

  async updateI(req, res, createIParams: CreateIParams<T>): Promise<any> {
    return this.b.updateI(req, res, createIParams);
  }

  async delete(
    req,
    res,
    serviceInput: IServiceInput<T>,
  ): Promise<CdFxReturn<ObjectLiteral[] | unknown>> {
    // const serviceInput = {
    //   serviceModel: this.model,
    //   docName: `Delete ${this.model.name}`,
    //   cmd: { action: 'delete', query: q },
    //   dSource: this.defaultDs,
    // };

    const result = await this.b.delete(req, req, serviceInput);
    return 'state' in result ? result : CD_FX_FAIL;
  }
}
