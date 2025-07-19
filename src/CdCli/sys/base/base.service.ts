/* eslint-disable brace-style */
/* eslint-disable style/indent */
/* eslint-disable style/brace-style */
/* eslint-disable antfu/if-newline */
import {
  ObjectLiteral,
  DeepPartial,
  UpdateResult,
  DeleteResult,
  FindOptionsWhere,
  FindManyOptions,
  EntityMetadata,
  getConnection,
} from 'typeorm';
import { SessionService } from '../user/services/session.service.js';
import * as Lá from 'lodash';
import {
  AbstractBaseService,
  CacheData,
  CD_FX_FAIL,
  CreateIParams,
  IQbFilter,
  IQbInput,
  ObjectItem,
  type BaseServiceInterface,
  type CdFxReturn,
  type ICdRequest,
  type ICdResponse,
  type IJsonUpdate,
  type IQuery,
  type IRespInfo,
  type IServiceInput,
  type ISessResp,
} from './IBase.js';
import { SessionModel } from '../user/models/session.model.js';
import { RedisService } from './redis-service.js';
import { EntityAdapter } from '../utilities/entity-adapter.js';
import config from '../../../config.js';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from 'winston';
import moment from 'moment';
import { Logging } from './winston.log.js';
import CdLog from '../cd-comm/controllers/cd-logger.controller.js';
import { DocModel } from '../moduleman/models/doc.model.js';
import { DocService } from '../moduleman/services/doc.service.js';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';
import { createClient } from 'redis';
import { from, Observable } from 'rxjs';
import { SocketStore } from '../cd-push/models/cd-push-socket.model.js';
import { QueryBuilderHelper } from '../utilities/query-builder-helper.js';
import { TypeOrmDatasource } from './type-orm-connect.js';
import { toKebabCase } from '../utilities/cd-naming.util.js';

const USER_ANON = 1000;
const INVALID_REQUEST = 'invalid request';

export class BaseService<T extends ObjectLiteral> extends AbstractBaseService<T> {
  logTimeStamp(arg0: string) {
    throw new Error('Method not implemented.');
  }
  err: string[] = []; // error messages
  cuid = 1000;
  cdToken = '';
  cdResp!: ICdResponse; // cd response
  pl;
  i: IRespInfo = {
    messages: [],
    code: '',
    app_msg: '',
  };
  isRegRequest = false;
  // svSess: SessionService = new SessionService();
  sess: SessionModel | any;
  logger: Logging;

  redisClient;
  svRedis!: RedisService;
  db;
  ds: any = null;
  sqliteConn;
  private repo: any;
  isInvalidFields: string[] = [];
  entityAdapter!: EntityAdapter;

  constructor() {
    super();
    this.logger = new Logging();
    this.entityAdapter = new EntityAdapter();
    this.cdResp = this.initCdResp();
  }

  // async init(req: any, res: any) {
  //   this.logger.logInfo("BaseService::init()/01:");
  //   if (!this.db) {
  //     const db = await new Database();
  //     // client expected to input the required models
  //     this.models.forEach(async (model) => {
  //       this.logger.logInfo("BaseService::init()/forEach/model:", model);
  //       await db.setConnEntity(model);
  //     });
  //     await db.getConnection();
  //     // console.log("BaseService::init()/this.cuid1:", this.cuid)
  //     // if (this.cuid > 1000) {
  //     //     console.log("BaseService::init()/this.cuid2:", this.cuid)
  //     //     const svSess = new SessionService();
  //     //     this.sessDataExt = await svSess.getSessionDataExt(req, res);
  //     // }
  //   }
  //   this.logger.logInfo("BaseService::init()/this.models:", this.models);
  // }

  async init(req: any, res: any) {
    this.logger.logDebug('BaseService::init()/01:');
    try {
      if (!this.db) {
        this.db = new TypeOrmDatasource();
        this.ds = await this.db.getConnection(); // ✅ Store DataSource
      }
      // this.logger.logDebug('BaseService::init()/this.models:', this.models);
    } catch (e) {
      this.logger.logDebug('BaseService::init()/02:');
      this.logger.logDebug(`BaseService::init() failed:${(e as Error).message}`);
      this.err.push(`BaseService::init() failed:${(e as Error).message}`);
    }
  }

  async setRepo(serviceInput: IServiceInput<T>) {
    // const AppDataSource = await getDataSource();
    // this.repo = AppDataSource.getRepository(serviceInput.serviceModel);
    this.repo = this.ds.getRepository(serviceInput.serviceModel);
  }

  async initSqlite(req: any, res: any) {
    const iMax = 5;
    const i = 1;
    try {
      this.logger.logDebug('BaseService::initSqlite()/01');
      if (this.sqliteConn) {
        this.logger.logDebug('BaseService::initSqlite()/02');
      } else {
        this.logger.logDebug('BaseService::initSqlite()/03');
        // await this.setSLConn(i)
        this.sqliteConn = await this.db;
      }
    } catch (e) {
      this.logger.logDebug('BaseService::initSqlite()/04');
      // this.logger.logDebug('initSqlite()/Error:', e);
      // const p = (e as Error).toString().search('AlreadyHasActiveConnectionError');
      // if (p === -1 && i < iMax) {
      //     i++;
      //     await this.setSLConn(i);
      // }
      this.err.push((e as Error).toString());
    }
  }

  initCdResp(): ICdResponse {
    return {
      app_state: {
        success: false,
        info: {
          messages: [],
          code: '',
          app_msg: '',
        },
        sess: {
          cd_token: this.getGuid(),
          jwt: null,
          ttl: 0,
        },
        cache: {},
        sConfig: {
          usePush: config.usePolling,
          usePolling: config.usePush,
          useCacheStore: config.useCacheStore,
        },
      },
      data: null,
    };
  }

  async resolveCls(req, res, clsCtx) {
    try {
      this.logger.logDebug('BaseService::resolveCls()/01:');
      this.logger.logDebug('BaseService::resolveCls/clsCtx.path:', clsCtx.path);
      const eImport = await import(clsCtx.path);
      this.logger.logDebug('BaseService::resolveCls()/02:');
      const eCls = eImport[clsCtx.clsName];
      this.logger.logDebug('BaseService::resolveCls()/03:');
      const cls = new eCls();
      this.ds = clsCtx.dataSource;
      this.logger.logDebug('BaseService::resolveCls()/04:');
      if (this.sess) {
        // set sessData in req so it is available thoughout the bootstrap
        req.post.sessData = this.sess;
      }
      await cls[clsCtx.action](req, res);
    } catch (e) {
      this.serviceErr(req, res, e, 'BaseService:resolveCls');
    }
  }

  async invokeCdRequest<T = any>(cdRequest?: ICdRequest): Promise<CdFxReturn<T>> {
    this.logger.logDebug('BaseService::invokeCdRequest() → Starting dispatch...');

    if (!cdRequest) {
      return { state: false, message: 'cdRequest is undefined or null.' };
    }

    const { ctx, m, c, a, args, dat } = cdRequest;

    try {
      const contextRoot = ctx.toLowerCase() === 'sys' ? 'sys' : 'app';
      // const moduleName = `${m}`;
      const controllerName = `${c}Controller`;
      const controllerkebab = toKebabCase(c);
      const modulePath = `../../${contextRoot}/${m}/controllers/${controllerkebab}.controller.js`;

      this.logger.logDebug(`BaseService::invokeCdRequest() → Importing: ${modulePath}`);

      const importedModule = await import(modulePath);
      const ControllerClass = importedModule?.[controllerName];

      if (!ControllerClass) {
        return {
          state: false,
          message: `Controller not found: ${controllerName} at ${modulePath}`,
        };
      }

      const controllerInstance = new ControllerClass();

      if (typeof controllerInstance[a] !== 'function') {
        return { state: false, message: `Action method not found: ${a}` };
      }

      const result = await controllerInstance[a](...(args ? Object.values(args) : []), dat);
      // const { _, ...cleanArgs } = args || {};
      // const result = await controllerInstance[a](...Object.values(cleanArgs), dat);

      if (!result?.state) {
        this.logger.logError(`BaseService::invokeCdRequest() → Task failed: ${result.message}`);
        return result;
      }

      return result as CdFxReturn<T>;
    } catch (err: any) {
      const message = `Error executing cdRequest: ${err.message}`;
      this.logger.logError(`BaseService::invokeCdRequest() → ${message}`);
      return {
        state: false,
        message,
      };
    }
  }

  /**
   * 1. create new doc
   * 2. use docId to complete create
   * 3. for any error, save the error using serviceErr()
   *    process is expected to return the encountered errors back to requesting entity
   * 4. Returning data is encpsulated in corpdesk http request object this.cdResp.
   * @param req
   * @param res
   * @param serviceInput
   * @returns
   */
  async create(
    req: Request | null,
    res: Response | null,
    serviceInput: IServiceInput<T>,
  ): Promise<CdFxReturn<T> | T | ICdResponse> {
    try {
      if (!serviceInput.serviceModel || !serviceInput.data || !this.db) {
        return { data: null, state: false, message: 'Invalid input' };
      }

      /**
       * Doc is the component that saves meta data of create tranaction
       * Create a Doc associated with this insertion
       */
      let newDocData;
      try {
        newDocData = await this.saveDoc(req, res, serviceInput);
      } catch (e: any) {
        this.serviceErr(req, res, e, 'BaseService:create/savDoc');
      }

      /**
       * set docId from new Doc
       */
      if (req) {
        await this.setPlData(req, {
          key: 'docId',
          value: newDocData.docId,
        }); // set docId
      } else {
        (serviceInput.data as any).docId = newDocData.docId;
      }

      const repository = this.db.getRepository(serviceInput.serviceModel);
      const entityInstance = repository.create(serviceInput.data as DeepPartial<T>);
      const savedEntity = await repository.save(entityInstance);
      if (req) {
        return savedEntity;
      } else {
        return {
          data: savedEntity,
          state: true,
          message: 'Created successfully',
        };
      }
    } catch (e: any) {
      this.err.push((e as Error).toString());
      const i = {
        messages: this.err,
        code: 'BaseService:create/getConnection',
        app_msg: '',
      };
      await this.serviceErr(req, res, e, 'BaseService:create');
      if (req) {
        return this.cdResp;
      } else {
        return { state: false, data: null, message: (e as Error).toString() };
      }
    }
  }

  /**
   * similar to create() but
   * used where create is called internally
   * Note that both create and createI, are tagged with
   * doc data which has dates, user and other application information
   * used in document tracking
   * @param req
   * @param res
   * @param createIParams
   */
  async createI(req, res, createIParams: CreateIParams<T>): Promise<any> {
    if (!createIParams || !createIParams.controllerData) {
      return { data: null, state: false, message: 'Invalid input' };
    }

    const serviceInput = createIParams.serviceInput;

    /**
     * Doc is the component that saves meta data of create tranaction
     * Create a Doc associated with this insertion
     */
    let ret: any;
    let newDocData;
    try {
      newDocData = await this.saveDoc(req, res, serviceInput);
    } catch (e: any) {
      this.serviceErr(req, res, e, 'BaseService:createI/savDoc');
    }

    /**
     * set docId
     */
    (createIParams.controllerData as any).docId = newDocData.docId;

    let serviceRepository = null;

    try {
      const repository = this.db.getRepository(createIParams.serviceInput.serviceModel);
      const entityInstance = repository.create(serviceInput.data as DeepPartial<T>);
      const savedEntity = await repository.save(entityInstance);
      if (req) {
        return savedEntity;
      } else {
        return {
          data: savedEntity,
          state: true,
          message: 'Created successfully',
        };
      }
    } catch (e: any) {
      this.err.push((e as Error).toString());
      const i = {
        messages: this.err,
        code: 'BaseService:create/getConnection',
        app_msg: '',
      };
      await this.serviceErr(req, res, e, 'BaseService:createI');
      if (req) {
        return this.cdResp;
      } else {
        return { state: false, data: null, message: (e as Error).toString() };
      }
    }
  }

  async createSL(req, res, serviceInput: IServiceInput<T>) {
    try {
      const repo: any = await this.sqliteConn.getRepository(serviceInput.serviceModel);
      const pl = this.getPlData(req);
      return await repo.save(pl);
    } catch (e) {
      this.err.push((e as Error).toString());
      const i = {
        messages: this.err,
        code: 'BillService:create',
        app_msg: '',
      };
      await this.serviceErr(req, res, e, 'BillService:create');
      return this.cdResp;
    }
  }

  connSLClose() {
    if (this.sqliteConn) {
      this.sqliteConn.close();
    }
  }

  async saveDoc(req, res, serviceInput: IServiceInput<T>) {
    const doc: DocModel = await this.setDoc(req, res, serviceInput);
    const docRepository = this.db.getRepository(DocModel);
    return await docRepository.save(doc);
  }

  async setDoc(req, res, serviceInput) {
    if (!this.cdToken) {
      await this.setSess(req, res);
    }
    const dm: DocModel = new DocModel();
    const svDoc = new DocService();
    dm.docFrom = this.cuid; // current corpdesk user
    dm.docName = serviceInput.docName;
    dm.docTypeId = await svDoc.getDocTypeId(req, res, dm);
    dm.docDate = await this.mysqlNow();
    return await dm;
  }

  // async setPlData(req, item: ObjectItem, extData?: string): Promise<void> {
  //   if (extData) {
  //     req.post.dat.f_vals[0][extData][item.key] = item.value;
  //   } else {
  //     req.post.dat.f_vals[0].data[item.key] = item.value;
  //   }
  // }

  async read(
    req: Request | null,
    res: Response | null,
    serviceInput: IServiceInput<T>,
  ): Promise<CdFxReturn<T[]> | T[] | ICdResponse> {
    try {
      if (!serviceInput.serviceModel || !serviceInput.cmd?.query || !this.db) {
        return { data: null, state: false, message: 'Invalid query' };
      }

      const repository = this.db.getRepository(serviceInput.serviceModel);
      const results = await repository.find(serviceInput.cmd.query);

      if (req) {
        return results;
      } else {
        return { data: results, state: true, message: 'Read successfully' };
      }
    } catch (e: any) {
      await this.serviceErr(req, res, e, 'BaseService:read');
      if (req) {
        return this.cdResp;
      } else {
        return { state: false, data: null, message: (e as Error).toString() };
      }
    }
  }

  read$(req, res, serviceInput): Observable<any> {
    return from(this.read(req, res, serviceInput));
  }

  async readCount(req, res, serviceInput: IServiceInput<T>): Promise<any> {
    try {
      if (!serviceInput.serviceModel || !serviceInput.cmd?.query || !this.db) {
        return { data: null, state: false, message: 'Invalid query' };
      }

      const repo = this.db.getRepository(serviceInput.serviceModel);
      let q: IQuery;
      if (req) {
        q = this.getQuery(req);
      } else {
        q = serviceInput.cmd.query;
      }

      this.logger.logDebug(`BaseService::readCount()/q:`, q);
      const [result, total] = await repo.findAndCount(q);
      return {
        items: result,
        count: total,
      };
    } catch (err) {
      return await this.serviceErr(req, res, err, 'BaseService:readCount');
    }
  }

  async feildMapSL(req, res, serviceInput: IServiceInput<T>) {
    await this.initSqlite(req, res);
    // this.logger.logDebug('BaseService::feildMapSL()/this.sqliteConn:', this.sqliteConn)
    this.logger.logDebug('BaseService::feildMapSL()/serviceInput:', serviceInput.serviceModel);
    const meta = await this.ds.getMetadata(serviceInput.serviceModel).columns;
    return await meta.map(async (c) => {
      return {
        propertyPath: await c.propertyPath,
        givenDatabaseName: await c.givenDatabaseName,
        dType: await c.type,
      };
    });
  }

  async readSL(req, res, serviceInput: IServiceInput<T>): Promise<any> {
    try {
      this.initSqlite(req, res);
      // const repo = this.sqliteConn.getRepository(serviceInput.serviceModel);
      await this.setRepo(serviceInput);
      // this.setRepo(serviceInput.serviceModel)
      const repo: any = this.repo;
      const svSess = new SessionService();
      // const billRepository = this.sqliteConn.getRepository(BillModel)
      // const allBills = await billRepository.find()
      // this.logger.logDebug('allBills:', allBills)
      // this.i.app_msg = '';
      // this.setAppState(true, this.i, svSess.sessResp);
      // this.cdResp.data = allBills;
      // const r = await this.respond(req, res);

      let r: any = null;
      switch (serviceInput.cmd?.action) {
        case 'find':
          try {
            r = await repo.find(serviceInput.cmd.query);
            if (serviceInput.extraInfo) {
              return {
                result: r,
                fieldMap: await this.feildMapSL(req, res, serviceInput),
              };
            } else {
              return await r;
            }
          } catch (err) {
            return await this.serviceErr(req, res, err, 'BillService:read');
          }
          break;
        case 'count':
          try {
            r = await repo.count(serviceInput.cmd.query);
            this.logger.logDebug('BillService::read()/r:', r);
            return r;
          } catch (err) {
            return await this.serviceErr(req, res, err, 'BillService:read');
          }
          break;
      }
      // this.serviceErr(res, err, 'BaseService:read');
    } catch (e) {
      return await this.serviceErr(req, res, e, 'BillService:read');
    }
  }

  readCount$(req, res, serviceInput): Observable<any> {
    this.logger.logDebug('BaseService::readCount$()/serviceInput:', serviceInput);
    return from(this.readCount(req, res, serviceInput));
  }

  async readCountSL(req, res, serviceInput): Promise<any> {
    await this.initSqlite(req, res);
    try {
      // const repo = this.sqliteConn.getRepository(serviceInput.serviceModel);
      await this.setRepo(serviceInput);
      // this.setRepo(serviceInput.serviceModel)
      const repo: any = this.repo;
      const meta = await this.getEntityPropertyMapSL(req, res, serviceInput.serviceModel);
      const [result, total] = await repo.findAndCount(this.getQuery(req));
      return {
        metaData: meta,
        items: result,
        count: total,
      };
    } catch (err) {
      return await this.serviceErr(req, res, err, 'BaseService:readCount');
    }
  }

  async getEntityPropertyMapSL(req, res, model) {
    await this.initSqlite(req, res);
    const entityMetadata: EntityMetadata = await this.ds.getMetadata(model);
    const cols = await entityMetadata.columns;
    // this.logger.logDebug('BaseService::getEntityPropertyMapSL()/cols:', cols)
    const colsFiltdArr: {
      propertyAliasName: string;
      databaseNameWithoutPrefixes: string;
      type: any;
    }[] = [];
    const colsFiltd = await cols.map(async (col) => {
      const ret = {
        propertyAliasName: await col.propertyAliasName,
        databaseNameWithoutPrefixes: await col.databaseNameWithoutPrefixes,
        type: await col.type,
      };
      // this.logger.logDebug('getEntityPropertyMapSL()/ret:', {ret: JSON.stringify(ret)});
      colsFiltdArr.push(ret);
      return ret;
    });
    // this.logger.logDebug('BaseService::getEntityPropertyMapSL()/colsFiltd:', await colsFiltd)
    // this.logger.logDebug('BaseService::getEntityPropertyMapSL()/colsFiltdArr:', await colsFiltdArr)
    return colsFiltdArr;
  }

  readCountSL$(req, res, serviceInput): Observable<any> {
    return from(this.readCountSL(req, res, serviceInput));
  }

  readSL$(req, res, serviceInput): Observable<any> {
    return from(this.readSL(req, res, serviceInput));
  }

  /**
   *
   *
   * This method makes use of QueryBuilderHelper to allow query to still be structured as earlier then this
   * class converts them to typeorm query builder.
   */
  async readQB(req, res, serviceInput: IServiceInput<T>): Promise<any> {
    if (!serviceInput.serviceModel || !serviceInput.cmd?.query || !this.db) {
      return { data: null, state: false, message: 'Invalid query' };
    }

    const repo = this.db.getRepository(serviceInput.serviceModel);
    // Create the helper instance
    const queryBuilderHelper = new QueryBuilderHelper(repo);

    try {
      // let q: any = this.getQuery(req);
      // const map = this.entityAdapter.registerMappingFromEntity(serviceInput.serviceModel);

      // // clean up the where clause...especially for request from browsers
      // const q = this.transformQueryInput(serviceInput.cmd.query, queryBuilderHelper);
      // serviceInput.cmd.query.where = q.where;
      // this.logger.logDebug(`BaseService::readQB()/q:`, { q: JSON.stringify(q) });
      // console.log('BaseService::readQB()/q:', q);

      const queryBuilder = queryBuilderHelper.createQueryBuilder(serviceInput);

      console.log('BaseService::readQB/sql:', queryBuilder.getSql());
      // Fetching items
      // const items = await queryBuilder.getMany();
      let items = await queryBuilder.getRawMany();
      console.log('BaseService::readQB()/items:', items);
      const entityName = this.entityAdapter.getEntityName(serviceInput.serviceModel);
      items = this.entityAdapter.mapRawToEntity(entityName, items);

      console.log('BaseService::readQB()/Fetched-Items:', items); // Debug logging for items

      // Fetching count
      const count = await queryBuilder.getCount();
      console.log('Fetched Count:', count); // Debug logging for count

      // Combine results
      return {
        items,
        count,
      };
    } catch (err) {
      console.error('Error in readQB:', err); // Debug logging for errors
      return await this.serviceErr(req, res, err, 'BaseService:readQB');
    }
  }

  readQB$(req, res, serviceInput): Observable<any> {
    this.logger.logDebug('BaseService::readQB$()/serviceInput:', serviceInput);
    return from(this.readQB(req, res, serviceInput));
  }

  async readJSONColumnQB(
    req,
    res,
    serviceInput: IServiceInput<ObjectLiteral>,
    jsonField: string,
    keys: string[],
  ): Promise<any> {
    if (!serviceInput.serviceModel || !serviceInput.cmd?.query || !this.db) {
      return { data: null, state: false, message: 'Invalid query' };
    }

    const repo = this.db.getRepository(serviceInput.serviceModel);
    const queryBuilderHelper = new QueryBuilderHelper(repo);
    const queryBuilder = queryBuilderHelper.createQueryBuilder(serviceInput);

    // Use MySQL JSON_EXTRACT to extract specific fields from the JSON column
    keys.forEach((key) => {
      queryBuilder.addSelect(`JSON_UNQUOTE(JSON_EXTRACT(${jsonField}, '$.${key}'))`, key);
    });

    try {
      const items = await queryBuilder.getRawMany();
      const entityName = this.entityAdapter.getEntityName(serviceInput.serviceModel);
      const processedItems = this.entityAdapter.mapRawToEntity(entityName, items);

      return {
        items: processedItems,
        count: await queryBuilder.getCount(),
      };
    } catch (err) {
      return await this.serviceErr(req, res, err, 'BaseService:readJSONColumnQB');
    }
  }

  transformFilters<T>(filters: IQbFilter[]): FindOptionsWhere<T> {
    const where: FindOptionsWhere<T> = {};

    filters.forEach((filter) => {
      const { field, operator, val, dataType } = filter;

      // Convert value to correct data type
      let parsedValue: any = val;
      if (dataType === 'number') parsedValue = Number(val);
      else if (dataType === 'boolean') parsedValue = val === 'true';

      // Map custom operators to TypeORM syntax
      switch (operator) {
        case '=':
          where[field] = parsedValue;
          break;
        case 'LIKE':
          where[field] = { like: `%${parsedValue}%` };
          break;
        case '>':
          where[field] = { gt: parsedValue };
          break;
        case '<':
          where[field] = { lt: parsedValue };
          break;
        case 'IN':
          where[field] = { in: val.split(',') };
          break;
        default:
          throw new Error(`Unsupported operator: ${operator}`);
      }
    });

    return where;
  }

  async update(
    req: Request | null,
    res: Response | null,
    serviceInput: IServiceInput<T>,
  ): Promise<CdFxReturn<UpdateResult> | UpdateResult | ICdResponse> {
    try {
      if (
        !serviceInput.serviceModel ||
        !serviceInput.cmd?.query ||
        !this.db ||
        !serviceInput.cmd.query.update // Ensure update is present
      ) {
        return { data: null, state: false, message: 'Invalid update request' };
      }

      const repository = this.db.getRepository(serviceInput.serviceModel);

      // Ensure update is cast to the correct TypeORM update type
      const updateData = serviceInput.cmd.query.update as unknown as QueryDeepPartialEntity<T>;

      const updateResult = await repository.update(serviceInput.cmd.query.where, updateData);

      if (req) {
        return updateResult;
      } else {
        return {
          data: updateResult,
          state: true,
          message: 'Updated successfully',
        };
      }
    } catch (e: any) {
      await this.serviceErr(req, res, e, 'BaseService:update');
      if (req) {
        return this.cdResp;
      } else {
        return { state: false, data: null, message: (e as Error).toString() };
      }
    }
  }

  update$(req, res, serviceInput) {
    return from(this.update(req, res, serviceInput));
  }

  async updateI(
    req: Request | null,
    res: Response | null,
    createIParams: CreateIParams<T>,
  ): Promise<CdFxReturn<UpdateResult> | UpdateResult | ICdResponse> {
    try {
      if (!createIParams || !createIParams.controllerData) {
        return { data: null, state: false, message: 'Invalid input' };
      }

      const serviceInput = createIParams.serviceInput;

      const repository = this.db.getRepository(serviceInput.serviceModel);

      // Ensure update is cast to the correct TypeORM update type
      const updateData = serviceInput.cmd!.query.update as unknown as QueryDeepPartialEntity<T>;

      const updateResult = await repository.update(serviceInput.cmd!.query.where, updateData);

      if (req) {
        return updateResult;
      } else {
        return {
          data: updateResult,
          state: true,
          message: 'Updated successfully',
        };
      }
    } catch (e: any) {
      await this.serviceErr(req, res, e, 'BaseService:updateI');
      if (req) {
        return this.cdResp;
      } else {
        return { state: false, data: null, message: (e as Error).toString() };
      }
    }
  }

  async updateSL(req, res, serviceInput: IServiceInput<T>) {
    this.logger.logDebug('BillService::updateSL()/01');
    await this.initSqlite(req, res);
    const svSess = new SessionService();
    // const repo: any = await this.sqliteConn.getRepository(serviceInput.serviceModel);
    // this.setRepo(serviceInput.serviceModel)
    await this.setRepo(serviceInput);
    const repo: any = this.repo;
    const result = await repo.update(
      serviceInput.cmd?.query.where,
      await this.fieldsAdaptorSL(req, res, serviceInput.cmd?.query.update, serviceInput),
    );
    this.logger.logDebug('result:', result);
    // this.cdResp.data = ret;
    svSess.sessResp.ttl = svSess.getTtl();
    this.setAppState(true, this.i, svSess.sessResp);
    this.cdResp.data = result;
    this.respond(req, res);
  }

  updateSL$(req, res, serviceInput) {
    return from(this.updateSL(req, res, serviceInput));
  }

  async fieldsAdaptorSL(req, res, fieldsData: any, serviceInput) {
    // get model properties
    const propMap = await this.feildMapSL(req, res, serviceInput);
    for (const fieldName in fieldsData) {
      if (fieldName) {
        const fieldMapData: any = propMap.filter((f: any) => f.propertyPath === fieldName);

        /**
         * adapt boolean values as desired
         * in the current case, typeorm rejects 1, "1" as boolean so
         * we convert them as desired;
         */
        if (fieldMapData[0]) {
          if (this.fieldIsBoolean(fieldMapData[0].dType)) {
            if (this.isTrueish(fieldsData[fieldName])) {
              fieldsData[fieldName] = true;
            } else {
              fieldsData[fieldName] = false;
            }
          }
        }
      }
    }
    return fieldsData;
  }

  // fieldIsBoolean(fieldType): boolean {
  //   return (
  //     fieldTyp(e as Error).toString() === 'function Boolean() { [native code] }'
  //   );
  // }
  fieldIsBoolean(fieldType): boolean {
    return fieldType.toString() === 'function Boolean() { [native code] }';
  }

  isTrueish(val) {
    let ret = false;
    switch (val) {
      case true:
        ret = true;
        break;
      case 'true':
        ret = true;
        break;
      case 1:
        ret = true;
        break;
      case '1':
        ret = true;
        break;
    }
    return ret;
  }

  async delete(
    req: Request | null,
    res: Response | null,
    serviceInput: IServiceInput<T>,
  ): Promise<CdFxReturn<DeleteResult> | DeleteResult | ICdResponse> {
    try {
      if (!serviceInput.serviceModel || !serviceInput.cmd?.query || !this.db) {
        return { data: null, state: false, message: 'Invalid delete request' };
      }

      const repository = this.db.getRepository(serviceInput.serviceModel);
      const deleteResult = await repository.delete(serviceInput.cmd.query.where);

      if (req) {
        return deleteResult;
      } else {
        return {
          data: deleteResult,
          state: true,
          message: 'Updated successfully',
        };
      }
    } catch (e: any) {
      await this.serviceErr(req, res, e, 'BaseService:delete');
      if (req) {
        return this.cdResp;
      } else {
        return { state: false, data: null, message: (e as Error).toString() };
      }
    }
  }

  delete$(req, res, serviceInput) {
    return from(this.delete(req, res, serviceInput));
  }

  async deleteSL(req, res, serviceInput: IServiceInput<T>) {
    this.logger.logDebug('BillService::updateSL()/01');
    let ret: any = [];
    // await this.initSqlite(req, res);
    const repo = await this.sqliteConn.getRepository(serviceInput.serviceModel);
    const result = await repo.delete(serviceInput.cmd?.query.where);
    this.logger.logDebug('BaseService::deleteSL()/result:', result);
    if ('affected' in result) {
      this.cdResp.app_state.success = true;
      if (this.cdResp.app_state.info) {
        this.cdResp.app_state.info.app_msg = `${result.affected} record/s deleted`;
      }
      ret = result;
    } else {
      this.cdResp.app_state.success = false;
      if (this.cdResp.app_state.info) {
        this.cdResp.app_state.info.app_msg = `some error occorred`;
      }
    }
    return ret;
  }

  deleteSL$(req, res, serviceInput) {
    return from(this.deleteSL(req, res, serviceInput));
  }

  isEmptyObject(obj: any): boolean {
    return Object.keys(obj).length === 0;
  }

  async bFetch(req, res, serviceInput: IServiceInput<T>) {
    try {
      this.logger.logDebug('BaseService::fetch()/01');

      if (!serviceInput.fetchInput) {
        throw new Error('fetchInput is undefined');
      }
      const response: any = await fetch(
        serviceInput.fetchInput.url,
        serviceInput.fetchInput.optins,
      );
      // If using node-fetch or undici, .json() is available; otherwise, parse manually
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = text;
      }
      // this.logger.logDebug(JSON.stringify(data, null, 2));
      return data;
    } catch (e) {
      this.err.push((e as Error).toString());
      const i = {
        messages: this.err,
        code: 'BaseService:update',
        app_msg: '',
      };
      // await this.setAppState(false, i, null);
      await this.serviceErr(req, res, e, i.code);
      return this.cdResp;
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////

  async serviceErr(req, res, e, eCode, lineNumber = null) {
    const svSess = new SessionService();
    try {
      svSess.sessResp.cd_token = req.post.dat.token;
    } catch (e) {
      svSess.sessResp.cd_token = '';
      this.err.push((e as Error).toString());
    }

    svSess.sessResp.ttl = svSess.getTtl();
    this.setAppState(true, this.i, svSess.sessResp);
    this.err.push((e as Error).toString());
    const i = {
      messages: await this.err,
      code: eCode,
      app_msg: `Error at ${eCode}: ${(e as Error).toString()}`,
    };
    await this.setAppState(false, i, svSess.sessResp);
    this.cdResp.data = [];
    return await this.respond(req, res);
  }

  async returnErr(req, res, i: IRespInfo) {
    const sess = this.getSess(req, res);
    await this.setAppState(false, i, sess);
    return await this.respond(req, res);
  }

  entryPath(pl: ICdRequest) {
    console.log('BaseService::entryPath/pl:', pl);
    const ret = `../../${pl.ctx.toLowerCase()}/${this.toCdName(
      pl.m,
    )}/controllers/${this.toCdName(pl.c)}.controller`;
    console.log('BaseService::entryPath()/ret:', ret);
    return ret;
  }

  // from camel to hyphen seperated then to lower case
  toCdName(camel) {
    console.log('BaseService::entryPath/camel:', camel);
    const ret = camel.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    console.log('BaseService::toCdName()/ret:', ret);
    return ret;
  }

  async valid(req, res): Promise<boolean> {
    const pl = req.post;
    // // this.logger.logInfo('BaseService::valid()req.post:', {
    //   pl: JSON.stringify(req.post),
    // });
    this.pl = pl;
    if (await this.noToken(req, res)) {
      return true;
    } else {
      if (!this.cdToken) {
        await this.setSess(req, res);
      }
      if (!this.instanceOfCdResponse(pl)) {
        return false;
      }
      if (!this.validFields(req, res)) {
        return false;
      }
    }
    return true;
  }

  async noToken(req: any, res: any) {
    // // this.logger.logInfo('BaseService::noToken()/01');
    // // this.logger.logInfo('BaseService::noToken()/req.post:', {
    //   pl: JSON.stringify(req.post),
    // });
    const pl = req.post;
    const ctx = pl.ctx;
    const m = pl.m;
    const c = pl.c;
    const a = pl.a;
    let ret: boolean = false;
    if (!ctx || !m || !c || !a) {
      this.setInvalidRequest(req, res, 'BaseService:noTocken:01');
    }
    if (m === 'User' && (a === 'Login' || a === 'Register')) {
      // // this.logger.logInfo('BaseService::noToken()/02');
      if (m === 'User' && a === 'Register') {
        // // this.logger.logInfo('BaseService::noToken()/03');
        this.isRegRequest = true;
      }
      ret = true;
    }
    // exempt reading list of consumers. Required during registration when token is not set yet
    if (m === 'Moduleman' && c === 'Consumer' && a === 'GetAll') {
      ret = true;
    }
    // exempt anon menu calls
    if (m === 'Moduleman' && c === 'Modules' && a === 'GetAll') {
      ret = true;
    }

    // exempt websocket initialization calls
    if (m === 'CdPush' && c === 'Websocket' && a === 'Create') {
      ret = true;
    }

    // exampt mpesa call backs
    if ('MSISDN' in pl) {
      ret = true;
    }
    // // this.logger.logInfo('BaseService::noToken()/returning ret:', {
    //   return: ret,
    // });
    return ret;
  }

  isRegisterRequest() {
    return this.isRegRequest;
  }

  /**
   * implement validation of fields
   * @param req
   * @param res
   * @returns
   */
  validFields(req: any, res: any) {
    /**
     * 1. deduce model directory from the req.post
     * 2. import model
     * 3. verify if fields exists
     */
    return true;
  }

  siGet<T>(q: IQuery, dn: string, model: new () => T): IServiceInput<T> {
    return {
      serviceModel: model,
      docName: dn,
      cmd: {
        action: 'find',
        query: q,
      },
      dSource: 1,
    };
  }

  async validateUnique(req, res, serviceInput) {
    this.logger.logDebug('BaseService::validateUnique()/01');
    this.logger.logDebug('BaseService::validateUnique()/req.post:', {
      reqPost: JSON.stringify(req.post),
    });

    if (!serviceInput.serviceModel || !serviceInput.cmd?.query || !this.db) {
      return { data: null, state: false, message: 'Invalid query' };
    }

    const baseRepository = this.db.getRepository(serviceInput.serviceModel);

    // const baseRepository: any = await this.repo(req, res, params.model)
    // const baseRepository: any = await this.repo
    // get model properties
    const propMap = await this.getEntityPropertyMap(req, res, serviceInput).then((result) => {
      // console.log('validateUnique()/result:', result)
      return result;
    });
    // console.log('validateUnique()/propMap:', await propMap)
    // const strQueryItems = await this.getQueryItems(req, propMap, params)
    const strQueryItems = await this.getQueryItems(req, serviceInput);
    this.logger.logDebug('BaseService::validateUnique()/strQueryItems:', strQueryItems);
    // convert the string items into JSON objects
    // const arrQueryItems = await strQueryItems.map(async (item) => {
    //     console.log('validateUnique()/item:', await item)
    //     return await JSON.parse(item);
    // });

    // console.log('validateUnique()/arrQueryItems:', arrQueryItems)
    // const filterItems = await JSON.parse(strQueryItems)
    const filterItems = await strQueryItems;
    this.logger.logDebug('BaseService::validateUnique()/filterItems:', filterItems);
    // execute the query
    const results = await baseRepository.count({
      where: await filterItems,
    });
    this.logger.logDebug('BaseService::validateUnique()/results:', {
      result: results,
    });
    // return boolean result
    let ret = false;
    if (results === 0) {
      ret = true;
    } else {
      this.err.push('duplicate not allowed');
      // console.log('BaseService::create()/Error:', (e as Error).toString())
      const i = {
        messages: this.err,
        code: 'BaseService:validateUnique',
        app_msg: '',
      };
      await this.setAppState(false, i, null);
    }
    this.logger.logDebug('BaseService::validateUnique()/ret:', { return: ret });
    return ret;
  }

  async validateUniqueI(req, res, params: CreateIParams<T>) {
    this.logger.logDebug('BaseService::validateUniqueI()/01');
    this.logger.logDebug('BaseService::validateUniqueI()/req.post:', req.post);
    this.logger.logDebug(
      'BaseService::validateUniqueI()/req.post.dat.f_vals[0]:',
      req.post.dat.f_vals[0],
    );
    this.logger.logDebug('BaseService::validateUniqueI()/params:', params);
    await this.init(req, res);
    // assign payload data to this.userModel
    //** */ params.controllerInstance.userModel = this.getPlData(req);
    // set connection
    const baseRepository = this.db.getRepository(params.serviceInput.serviceModel);
    this.logger.logDebug('BaseService::validateUniqueI()/repo/model:', {
      model: params.serviceInput.serviceModel,
    });

    this.logger.logDebug(
      'BaseService::validateUniqueI()/params.serviceInput:',
      params.serviceInput,
    );
    // const filterItems = await JSON.parse(strQueryItems)
    const filterItems = await this.duplicateFilter(
      params.controllerData,
      params.serviceInput.serviceInstance.cRules.noDuplicate,
    );
    this.logger.logDebug('BaseService::validateUniqueI()/filterItems:', filterItems);
    // execute the query
    const results = await baseRepository.count({
      where: await filterItems,
    });
    this.logger.logDebug('BaseService::validateUniqueI()/results:', results);
    // return boolean result
    let ret = false;
    if (results === 0) {
      ret = true;
    } else {
      this.err.push('duplicate not allowed');
      // this.logger.logDebug('BaseService::create()/Error:', (e as Error).toString())
      const i = {
        messages: this.err,
        code: 'BaseService:validateUniqueI',
        app_msg: '',
      };
      await this.setAppState(false, i, null);
    }
    this.logger.logDebug('BaseService::validateUniqueI()/ret:', {
      return: ret,
    });
    return ret;
  }

  async duplicateFilter<T extends Record<string, any>>(
    controllerData: T,
    noDuplicate: string[],
  ): Promise<Partial<T>> {
    this.logger.logDebug('BaseService::duplicateFilter()/controllerData:', controllerData);
    this.logger.logDebug('BaseService::duplicateFilter()/noDuplicate:', noDuplicate);
    const filteredData = {} as Partial<T>;

    for (const field of noDuplicate) {
      if (Object.prototype.hasOwnProperty.call(controllerData, field)) {
        (filteredData as Record<string, any>)[field] = controllerData[field];
      }
    }

    return filteredData;
  }

  async validateRequired(req, res, cRules): Promise<boolean> {
    const svSess = new SessionService();
    const rqFieldNames = cRules.required as string[];
    this.isInvalidFields = await rqFieldNames.filter((fieldName) => {
      if (!(fieldName in this.getPlData(req))) {
        // required field is missing
        return fieldName;
      }
    });
    if (this.isInvalidFields.length > 0) {
      this.i.app_msg = `the required fields ${this.isInvalidFields.join(', ')} is missing`;
      this.i.messages.push(this.i.app_msg);
      this.setAppState(false, this.i, svSess.sessResp);
      return false;
    } else {
      return true;
    }
  }

  async getEntityPropertyMap(req, res, serviceInput: IServiceInput<T>) {
    // await this.init(req, res);
    // console.log('BaseService::getEntityPropertyMap()/model:', model)
    // const entityMetadata: EntityMetadata =
    //   await getConnection().getMetadata(model);
    const entityMetadata = this.db?.getMetadata(serviceInput.serviceModel);
    if (!entityMetadata) {
      return;
    }
    // console.log('BaseService::getEntityPropertyMap()/entityMetadata:', entityMetadata)
    const cols = await entityMetadata.columns;
    const colsFiltd = await cols.map(async (col) => {
      return await {
        propertyAliasName: col.propertyAliasName,
        databaseNameWithoutPrefixes: col.databaseNameWithoutPrefixes,
        type: col.type,
      };
    });
    return colsFiltd;
  }

  async getQueryItems(req, params, fields?) {
    ////////////////////////////////////////////////
    this.logger.logDebug('BaseService::getQueryItems()/params:', params);
    this.logger.logDebug(
      'BaseService::getQueryItems()/req.post.dat.f_vals[0].data:',
      req.post.dat.f_vals[0].data,
    );
    if (fields === null) {
      fields = req.post.dat.f_vals[0].data;
    }
    const entries = Object.entries(fields);
    // console.log('getQueryItems()/entries:', entries)
    const entryObjArr = entries.map((e) => {
      // console.log('getQueryItems()/e:', e)
      const k = e[0];
      const v = e[1];
      const ret = JSON.parse(`[{"key":"${k}","val":"${v}","obj":{"${k}":"${v}"}}]`);
      // console.log('getQueryItems()/ret:', ret)
      return ret;
    });
    // console.log('getQueryItems()/entryObjArr:', entryObjArr)
    const cRules = params.serviceInstance.cRules.noDuplicate;
    const qItems = entryObjArr.filter((f) => this.isNoDuplicate(f, cRules));
    // console.log('getQueryItems()/qItems:', qItems)
    const result: any = {};
    qItems.forEach(async (f: any) => {
      result[f[0].key] = f[0].val;
    });
    return await result;
  }

  isNoDuplicate(fData, cRules = []) {
    return cRules.filter((fieldName) => fieldName === fData[0].key).length > 0;
  }

  instanceOfCdResponse(object: any): boolean {
    return (
      'ctx' in object &&
      'm' in object &&
      'c' in object &&
      'a' in object &&
      'dat' in object &&
      'args' in object
    );
  }

  /**
   * for setting up response details
   * @param Success
   * @param Info
   * @param Sess
   */
  async setAppState(succ: boolean, i: IRespInfo | null, ss: ISessResp | null) {
    if (succ === false) {
      this.cdResp!.data = [];
    }
    this.cdResp!.app_state = {
      success: succ,
      info: i,
      sess: ss,
      cache: {},
      sConfig: {
        usePush: config.usePolling,
        usePolling: config.usePush,
        useCacheStore: config.useCacheStore,
      },
    };
  }

  setInvalidRequest(req, res, eCode: string) {
    this.err.push(INVALID_REQUEST);
    const i: IRespInfo = {
      messages: this.err,
      code: eCode,
      app_msg: '',
    };
    const sess = this.getSess(req, res);
    this.setAppState(false, i, sess);
    res.status(200).json(this.cdResp);
  }

  getSess(req: any, res: any) {
    return null; // yet to implement
  }

  sessIsValid(pl) {
    // const sess = new SessionService()
  }

  async respond(req: any, res: any) {
    // // this.logger.logInfo('**********starting respond(res)*********');
    // res.status(200).json(this.cdResp);
    let ret;
    try {
      // // this.logger.logInfo('BaseService::respond(res)/this.pl:', {
      //   post: JSON.stringify(req.post),
      // });
      // // this.logger.logInfo('BaseService::respond(res)/this.cdResp:', {
      //   cdResp: JSON.stringify(this.cdResp),
      // });
      ret = res.status(200).json(this.cdResp);
    } catch (e: any) {
      this.err.push((e as Error).toString());
    }
    return ret;
  }

  async setSess(req: any, res: any) {
    // this.logger.logDebug('BaseService::setSess()/01');
    const svSess = new SessionService();
    if (await !this.cdToken) {
      // this.logger.logDebug('BaseService::setSess()/02');
      try {
        // this.logger.logDebug('BaseService::setSess()/req.post:', req.post);
        if ('sessData' in req.post) {
          // this.logger.logDebug('BaseService::setSess()/021');
          // this.logger.logDebug(
          //   'BaseService::setSess()/req.post.sessData:',
          //   req.post.sessData,
          // );
          this.sess = [req.post.sessData];
        } else {
          // this.logger.logDebug('BaseService::setSess()/022');
          const sessResult = await svSess.getSession({
            where: { cdToken: this.cdToken },
          });
          if (!sessResult.state || !sessResult.data) {
            return;
          }
          const sess = sessResult.data;
          if (sess) {
            this.sess = sess;
          }
        }
        // this.logger.logDebug('BaseService::setSess()/03');
        // this.logger.logDebug('BaseService::setSess()/this.sess:', this.sess);
        if (this.sess) {
          // this.logger.logDebug('BaseService::setSess()/04');
          if (this.sess.length > 0) {
            // this.logger.logDebug('BaseService::setSess()/05');
            // this.logger.logDebug('this.sess:', this.sess);
            this.setCuid(this.sess[0].currentUserId);
            this.cdToken = await this.sess[0].cdToken;
          } else {
            // this.logger.logDebug('BaseService::setSess()/06');
            const noToken = await this.noToken(req, res);
            // this.logger.logDebug('BaseService::setSess()/noToken:', {
            //   noToken: noToken,
            // });
            if (noToken === false) {
              this.i = {
                messages: this.err,
                code: 'BaseService:setSess1',
                app_msg: 'invalid session',
              };
              // do not report 'invalid session' if the session is 'noToken' required.
              await this.serviceErr(req, res, this.i.app_msg, this.i.code);
              // this.respond(req, res);
            }
          }
        } else {
          // this.logger.logDebug('BaseService::setSess()/07');
          this.i = {
            messages: this.err,
            code: 'BaseService:setSess2',
            app_msg: 'invalid session',
          };
          await this.serviceErr(req, res, this.i.app_msg, this.i.code);
          this.respond(req, res);
        }
      } catch (e: any) {
        // this.logger.logDebug('BaseService::setSess()/08');
        this.i = {
          messages: this.err,
          code: 'BaseService:setSess3',
          app_msg: (e as Error).toString(),
        };
        // await this.serviceErr(req, res, this.i.app_msg, this.i.code)
        await this.setAlertMessage((e as Error).toString(), svSess, false);
        // this.respond(req, res);
      }
    }
  }

  async setAlertMessage(msg: string, svSess: SessionService, success: boolean) {
    this.i.app_msg = msg;
    this.err.push(this.i.app_msg);
    await this.setAppState(success, this.i, svSess.sessResp);
  }

  async mysqlNow() {
    this.logger.logDebug('BaseService::mysqlNow()/01');
    const now = new Date();
    const date = await moment(now, 'ddd MMM DD YYYY HH:mm:ss');
    this.logger.logDebug('BaseService::mysqlNow()/02');
    const ret = await date.format('YYYY-MM-DD HH:mm:ss'); // convert to mysql date
    this.logger.logDebug('BaseService::mysqlNow()/03');
    return ret;
  }

  getGuid() {
    return uuidv4();
  }

  setCuid(cuid: number) {
    this.cuid = cuid;
  }

  /**
   * For validating IJsonUpdate array
   * @param jsonUpdate
   * @param rootInterface
   * @returns
   */
  validateJsonUpdate<T>(
    jsonUpdate: IJsonUpdate[],
    rootInterface: T,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    function traversePath(currentPath: string[], currentInterface: any): boolean {
      // If no path left to validate, return true
      if (currentPath.length === 0) return true;

      const [currentKey, ...remainingPath] = currentPath;

      if (Array.isArray(currentInterface) && currentKey === '[0]') {
        // Check if the interface is an array and the key indicates an index
        return traversePath(remainingPath, currentInterface[0]);
      } else if (currentInterface && typeof currentInterface === 'object') {
        // Check if the key exists in the interface
        if (!(currentKey in currentInterface)) {
          errors.push(`Invalid path key '${currentKey}' at '${currentPath.join('.')}'`);
          return false;
        }
        // Continue traversing the remaining path
        return traversePath(remainingPath, currentInterface[currentKey]);
      } else {
        // If the structure doesn't match, log an error
        errors.push(`Unexpected type at '${currentPath.join('.')}'. Expected object or array.`);
        return false;
      }
    }

    // Validate each update item
    jsonUpdate.forEach((update) => {
      if (!update.modelField || update.modelField !== 'cdDevProjectData') {
        errors.push(`Invalid modelField: '${update.modelField}'`);
        return;
      }

      const { path } = update;
      if (!Array.isArray(path) || path.length === 0) {
        errors.push(`Invalid path: '${JSON.stringify(path)}'`);
        return;
      }

      // Start traversal from the root interface
      traversePath(path, rootInterface);
    });

    return { valid: errors.length === 0, errors };
  }

  updateJsonData(jsonUpdate: IJsonUpdate, jsonData: any): any {
    console.log('BaseService::updateJsonData()/jsonUpdate1:', jsonUpdate);
    console.log('BaseService::updateJsonData()/jsonData1:', jsonData);

    try {
      // Validate `jsonUpdate` structure
      if (!jsonUpdate || typeof jsonUpdate !== 'object') {
        this.err.push('Invalid jsonUpdate object.');
        return null;
      }
      if (!Array.isArray(jsonUpdate.path) || jsonUpdate.path.length === 0) {
        this.err.push('Invalid jsonUpdate path: Must be a non-empty array.');
        return null;
      }

      // Validate `jsonData`
      if (typeof jsonData !== 'object' || jsonData === null) {
        this.err.push('Invalid jsonData: Must be a non-null object.');
        return null;
      }

      // Traverse the path to reach the target node
      let target = jsonData;
      const pathLength = jsonUpdate.path.length;

      for (let i = 0; i < pathLength - 1; i++) {
        const key = jsonUpdate.path[i];
        console.log('BaseService::updateJsonData()/key0:', key);

        if (key.startsWith('[') && key.endsWith(']')) {
          console.log('BaseService::updateJsonData()/key1:', key);
          // Handle array index
          const index = parseInt(key.slice(1, -1), 10);
          if (isNaN(index) || !Array.isArray(target)) {
            this.err.push(`Invalid path at '${key}': Expected a valid array index in an array.`);
            return null;
          }
          target = target[index];
        } else {
          // Handle object key
          console.log('BaseService::updateJsonData()/key2:', key);
          console.log('BaseService::updateJsonData()/target:', target);
          if (!Object.prototype.hasOwnProperty.call(target, key)) {
            this.err.push(`Path error: Key '${key}' does not exist.`);
            return null;
          }
          target = target[key];
        }
      }

      // Set the value at the target node
      const finalKey = jsonUpdate.path[pathLength - 1];
      console.log('BaseService::updateJsonData()/finalKey1:', finalKey);
      if (finalKey.startsWith('[') && finalKey.endsWith(']')) {
        console.log('BaseService::updateJsonData()/finalKey2:', finalKey);
        const index = parseInt(finalKey.slice(1, -1), 10);
        if (isNaN(index) || !Array.isArray(target)) {
          this.err.push(
            `Invalid path at final key '${finalKey}': Expected a valid array index in an array.`,
          );
          return null;
        }
        console.log('BaseService::updateJsonData()/target2:', target);
        target[index] = jsonUpdate.value; // Update the value at the specified index
      } else {
        console.log('BaseService::updateJsonData()/jsonUpdate.value:', jsonUpdate.value);
        console.log('BaseService::updateJsonData()/target3:', target);
        console.log('BaseService::updateJsonData()/finalKey3:', finalKey);
        target[finalKey] = jsonUpdate.value; // Update the value at the specified key
      }

      console.log('BaseService::updateJsonData()/jsonData3:', jsonData);
      return jsonData; // Return the updated JSON data
    } catch (e: any) {
      // Catch unexpected errors and log them
      this.err.push((e as Error).toString());
      return null;
    }
  }

  async updateJSONColumnQB(
    req,
    res,
    serviceInput: IServiceInput<any>,
    jsonField: string,
    updates: Record<string, any>,
  ): Promise<any> {
    await this.init(req, res);
    this.logger.logDebug(
      'BaseService::updateJSONColumnQB()/repo/model:',
      serviceInput.serviceModel,
    );
    await this.setRepo(serviceInput);

    // Helper function to generate JSON_SET paths recursively
    // const buildJsonSetPaths = (jsonField: string, obj: any, prefix: string = ''): string[] => {
    //     return Object.keys(obj).map(key => {
    //         const path = `${prefix}${prefix ? '.' : ''}${key}`;
    //         if (typeof obj[key] === 'object' && obj[key] !== null) {
    //             // Recursively handle nested objects
    //             return buildJsonSetPaths(jsonField, obj[key], path).join(', ');
    //         } else {
    //             return `JSON_SET(${jsonField}, '$.${path}', '${obj[key]}')`;
    //         }
    //     }).filter(Boolean);
    // };
    const buildJsonSetPaths = (jsonField: string, obj: any, prefix: string = ''): string[] => {
      return Object.keys(obj)
        .map((key) => {
          const path = `${prefix}${prefix ? '.' : ''}${key}`;
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            // Recursively handle nested objects
            return buildJsonSetPaths(jsonField, obj[key], path).join(', ');
          } else {
            // Use COALESCE to ensure JSON is initialized if null
            return `JSON_SET(COALESCE(${jsonField}, '{}'), '$.${path}', '${obj[key]}')`;
          }
        })
        .filter(Boolean);
    };

    // Generate the JSON_SET update query for the jsonField
    const updateFields = buildJsonSetPaths(jsonField, updates).join(', ');

    // this.logger.logDebug(
    //   "BaseService::updateJSONColumnQB()/updates:",
    //   JSON.stringify(updates)
    // );
    // this.logger.logDebug(
    //   "BaseService::updateJSONColumnQB()/updateFields:",
    //   JSON.stringify(updateFields)
    // );

    // Start building the query using the input provided in serviceInput.cmd.query
    const queryBuilder = this.repo.createQueryBuilder().update(serviceInput.serviceModel);

    // Handle dynamic update fields using the update property from QueryInput
    if (serviceInput.cmd?.query.update) {
      queryBuilder.set(serviceInput.cmd.query.update);
    } else {
      // Fallback: use the JSON field update if no generic update is provided
      queryBuilder.set({ [jsonField]: () => updateFields });
    }

    // Dynamically handle where conditions from QueryInput or use dynamic primary key
    if (serviceInput.cmd?.query.where) {
      Object.keys(serviceInput.cmd.query.where).forEach((key) => {
        queryBuilder.andWhere(`${key} = :${key}`, {
          [key]: serviceInput.cmd?.query.where[key],
        });
      });
    } else {
      // Fallback: Use the primary key based on the service model's convention <controller>_id
      const primaryKey = serviceInput.primaryKey; // Dynamically get primary key
      if (primaryKey) {
        queryBuilder.where(`${primaryKey} = :${primaryKey}`, {
          [primaryKey]: serviceInput.cmd?.query[primaryKey],
        });
      }
    }

    try {
      // Execute the query
      return await queryBuilder.execute();
    } catch (err) {
      return await this.serviceErr(req, res, err, 'BaseService:updateJSONColumnQB');
    }
  }

  /**
   *
   * @param req
   * @param extData // used to target any property of 'f_vals' other than 'data'
   * @param fValsIndex // used if f_val items are multiple
   * @returns
   */
  async getPlData(
    req,
    extData: string | null = null,
    fValsIndex: number | null = null,
  ): Promise<any> {
    this.logger.logInfo('BaseService::getPlData()/01');
    let ret = null;
    const svSess = new SessionService();
    if (await this.validatePlData(req, extData)) {
      try {
        if (extData) {
          this.logger.logInfo('BaseService::getPlData()/02');
          if (fValsIndex) {
            ret = req.post.dat.f_vals[fValsIndex][extData];
          } else {
            ret = req.post.dat.f_vals[0][extData];
          }
        } else {
          this.logger.logInfo('BaseService::getPlData()/03');
          if (fValsIndex) {
            ret = req.post.dat.f_vals[fValsIndex].data;
          } else {
            ret = req.post.dat.f_vals[0].data;
          }
        }
        this.logger.logInfo('BaseService::getPlData()/04');
        console.log('BaseService::getData()/ret:', ret);
        return ret;
      } catch (e: any) {
        this.setAlertMessage((e as Error).toString(), svSess, false);
        return {};
      }
    } else {
      this.setAlertMessage('invalid validation request', svSess, false);
      return {};
    }
  }

  async getPlQuery(
    req,
    extData: string | null = null,
    fValsIndex: number | null = null,
  ): Promise<any> {
    this.logger.logInfo('BaseService::getPlQuery()/01');
    let ret = null;
    const svSess = new SessionService();
    if (await this.validatePlData(req, extData)) {
      try {
        if (extData) {
          this.logger.logInfo('BaseService::getPlQuery()/02');
          if (fValsIndex) {
            ret = req.post.dat.f_vals[fValsIndex][extData];
          } else {
            ret = req.post.dat.f_vals[0][extData];
          }
        } else {
          this.logger.logInfo('BaseService::getPlQuery()/03');
          if (fValsIndex) {
            ret = req.post.dat.f_vals[fValsIndex].query;
          } else {
            ret = req.post.dat.f_vals[0].query;
          }
        }
        this.logger.logInfo('BaseService::getPlQuery()/04');
        console.log('BaseService::getQuery()/ret:', ret);
        return ret;
      } catch (e: any) {
        this.setAlertMessage((e as Error).toString(), svSess, false);
        return {};
      }
    } else {
      this.setAlertMessage('invalid validation request', svSess, false);
      return {};
    }
  }

  async setPlData(req, item: ObjectItem, extData?: string): Promise<void> {
    this.logger.logInfo('BaseService::setPlData()/item:', item);
    if (extData) {
      this.logger.logInfo('BaseService::setPlData()/extData:', {
        extData: extData,
      });
      this.logger.logInfo(
        'BaseService::setPlData()/req.post.dat.f_vals[0][extData]:',
        req.post.dat.f_vals[0][extData],
      );
      req.post.dat.f_vals[0][extData][item.key] = item.value;
    } else {
      req.post.dat.f_vals[0].data[item.key] = item.value;
    }
    this.logger.logInfo('BaseService::setPlData()/req.post.dat.f_vals[0]:', req.post.dat.f_vals[0]);
  }

  /**
   *
   * @param req
   * @param item
   * @param extData
   */
  async setPlDataM(req, data: any, item: ObjectItem, extData?: string): Promise<void> {
    this.logger.logInfo('BaseService::setPlDataM()/item:', item);
    if (extData) {
      console.log('BaseService::setPlDataM()/extData:', { context: extData });
      console.log('BaseService::setPlDataM()/data:', data[extData]);
      data[extData][item.key] = item.value;
    }
    this.logger.logInfo('BaseService::setPlDataM()/data:', data);
  }

  /**
   * prevent a situation where either
   * 'data' property is missing or
   * extData property is missing
   * @param req
   * @param res
   * @param extData
   */
  async validatePlData(req, extData): Promise<boolean> {
    const svSess = new SessionService();
    let ret = false;
    if (extData) {
      if (extData in req.post.dat.f_vals[0]) {
        ret = true;
      } else {
        this.setAlertMessage(
          'BaseService::validatePlData/requested property is missing',
          svSess,
          false,
        );
      }
    } else {
      if ('data' in req.post.dat.f_vals[0]) {
        ret = true;
      } else {
        this.setAlertMessage(
          'BaseService::validatePlData/requested property is missing',
          svSess,
          false,
        );
      }
    }
    return ret;
  }

  getReqToken(req) {
    const r: ICdRequest = req.post;
    return r.dat.token;
  }

  /////////////////////////
  // Redis stuff

  async redisInit(req: any, res: any) {
    this.redisClient = createClient();
    this.redisClient.on('error', async (err) => {
      this.logger.logDebug('BaseService::redisCreate()/02');
      this.err.push(err.toString());
      const i = {
        messages: this.err,
        code: 'BaseService:redisCreate',
        app_msg: '',
      };
      await this.serviceErr(req, res, this.err, 'BaseService:redisCreate');
      return this.cdResp;
    });

    await this.redisClient.connect();
  }

  async wsRedisInit() {
    this.logger.logDebug('BaseService::wsRedisInit()/01');
    this.redisClient = createClient();
    this.logger.logDebug('BaseService::wsRedisInit()/this.redisClient:', this.redisClient);
    this.redisClient.on('error', async (err) => {
      this.logger.logDebug('BaseService::redisCreate()/err:', err);
      this.err.push(err.toString());
      const i = {
        messages: this.err,
        code: 'BaseService:redisCreate',
        app_msg: '',
      };
      await this.wsServiceErr(this.err, 'BaseService:redisCreate');
      return this.cdResp;
    });
    await this.redisClient.connect();
  }

  async redisCreate(req: any, res: any) {
    await this.redisInit(req, res);
    this.logger.logDebug('BaseService::redisCreate()/01');
    const pl: CacheData = await this.getPlData(req);
    this.logger.logDebug('BaseService::redisCreate()/pl:', pl);
    try {
      const setRet = await this.redisClient.set(pl.key, pl.value);
      this.logger.logDebug('BaseService::redisCreate()/setRet:', setRet);
      const readBack = await this.redisClient.get(pl.key);
      this.logger.logDebug('BaseService::redisCreate()/readBack:', readBack);
      return {
        status: setRet,
        saved: readBack,
      };
    } catch (e: any) {
      this.logger.logDebug('BaseService::redisCreate()/04');
      this.err.push((e as Error).toString());
      const i = {
        messages: this.err,
        code: 'BaseService:redisCreate',
        app_msg: '',
      };
      await this.serviceErr(req, res, this.err, 'BaseService:redisCreate');
      return this.cdResp;
    }
  }

  async wsRedisCreate(k, v) {
    await this.wsRedisInit();
    try {
      const setRet = await this.redisClient.set(k, v);
      this.logger.logDebug(`BaseService::wsRedisCreate()/setRet:${JSON.stringify(setRet)}`);
      const readBack = await this.redisClient.get(k);
      this.logger.logDebug(`BaseService::wsRedisCreate()/readBack:${JSON.stringify(readBack)}`);
      return {
        status: setRet,
        saved: readBack,
      };
    } catch (e: any) {
      this.logger.logDebug('BaseService::wsRedisCreate()/04');
      this.err.push((e as Error).toString());
      const i = {
        messages: this.err,
        code: 'BaseService:wsRedisCreate',
        app_msg: '',
      };
      await this.wsServiceErr(this.err, 'BaseService:redisCreate');
      return this.cdResp;
    }
  }

  async redisRead(req, res, serviceInput: IServiceInput<T>) {
    this.logger.logDebug('BaseService::redisRead()/01');
    await this.redisInit(req, res);
    this.logger.logDebug('BaseService::redisRead()/02');
    const pl: CacheData = await this.getPlData(req);
    this.logger.logDebug('BaseService::redisRead()/pl:', pl);
    try {
      const getRet = await this.redisClient.get(pl.key);
      this.logger.logDebug('BaseService::redisRead()/getRet:', getRet);
      return getRet;
    } catch (e: any) {
      this.logger.logDebug('BaseService::redisRead()/04');
      this.err.push((e as Error).toString());
      const i = {
        messages: this.err,
        code: 'BaseService:redisRead',
        app_msg: '',
      };
      await this.serviceErr(req, res, this.err, 'BaseService:redisRead');
      return this.cdResp;
    }
  }

  async wsRedisRead(k) {
    this.logger.logDebug('BaseService::wsRedisRead()/k:', k);
    const retData: SocketStore[] = [];
    const ret = {
      r: JSON.stringify(retData),
      error: '',
    };
    // await this.wsRedisInit();
    try {
      // const getRet = await this.redisClient.get(k);
      const getRet = await this.svRedis.get(k);
      if (getRet) {
        ret.r = getRet;
      }
      this.logger.logDebug('BaseService::redisRead()/ret:', { result: ret });
      return ret;
    } catch (e) {
      this.logger.logDebug('BaseService::redisRead()/04');
      this.err.push((e as Error).toString());
      const i = {
        messages: this.err,
        code: 'BaseService:redisRead',
        app_msg: '',
      };
      await this.wsServiceErr(this.err, 'BaseService:redisRead');
      // return this.cdResp;
      ret.error = (e as Error).toString();
      return ret;
    }
  }

  redisDelete(req, res, serviceInput: IServiceInput<T>) {
    this.redisClient.del('foo', (err, reply) => {
      if (err) throw err;
      this.logger.logDebug(reply);
    });
  }

  async redisAsyncRead(req, res, serviceInput: IServiceInput<T>) {
    return new Promise((resolve, reject) => {
      this.redisClient.get('myhash', (err, data) => {
        if (err) {
          reject(err);
        }
        resolve(data);
      });
    });
  }

  async wsServiceErr(e, eCode, cdToken = null) {
    this.logger.logDebug(`Error as BaseService::wsServiceErr, e: ${(e as Error).toString()} `);
    const svSess = new SessionService();
    if (cdToken) {
      svSess.sessResp.cd_token = cdToken;
    }

    svSess.sessResp.ttl = svSess.getTtl();
    this.setAppState(true, this.i, svSess.sessResp);
    this.err.push((e as Error).toString());
    const i = {
      messages: await this.err,
      code: eCode,
      app_msg: `Error at ${eCode}: ${(e as Error).toString()}`,
    };
    await this.setAppState(false, i, svSess.sessResp);
    this.cdResp.data = [];
  }

  // async bFetch(req, res, serviceInput: IServiceInput<T>) {
  //   try {
  //     this.logger.logDebug('BaseService::fetch()/01');

  //     const response = await fetch(
  //       serviceInput.fetchInput.url,
  //       serviceInput.fetchInput.optins,
  //     );
  //     const data = await response.json();
  //     // console.log(JSON.stringify(data, null, 2));
  //     return data;
  //   } catch (e: any) {
  //     this.err.push((e as Error).toString());
  //     const i = {
  //       messages: this.err,
  //       code: 'BaseService:update',
  //       app_msg: '',
  //     };
  //     // await this.setAppState(false, i, null);
  //     await this.serviceErr(req, res, e, i.code);
  //     return this.cdResp;
  //   }
  // }

  successResponse(req, res, result, appMsg = null) {
    if (appMsg) {
      this.i.app_msg = appMsg;
    }
    const svSess = new SessionService();
    svSess.sessResp.cd_token = req.post.dat.token;
    svSess.sessResp.ttl = svSess.getTtl();
    this.setAppState(true, this.i, svSess.sessResp);
    this.cdResp.data = result;
    this.respond(req, res);
  }

  getQuery(req) {
    const q = req.post.dat.f_vals[0].query;

    this.logger.logInfo(`BaseService::getQuery()/q:${q}`);
    this.pl = req.post;
    if (q) {
      return q;
    } else {
      return {};
    }
  }

  intersect(arrA, arrB, intersectionField) {
    return Lá.intersectionBy(arrA, arrB, intersectionField);
  }

  intersectionLegacy = (arr1: any[], arr2: any[]) => {
    const res: any[] = []; // Explicitly define `res` as an array of `any`
    for (const i of arr1) {
      if (!arr2.includes(i)) {
        continue;
      }
      res.push(i);
    }
    return res;
  };

  intersectMany = (...arrs) => {
    let res = arrs[0].slice();
    for (let i = 1; i < arrs.length; i++) {
      res = this.intersectionLegacy(res, arrs[i]);
    }
    return res;
  };

  isEmpty(value) {
    return value == null || value.length === 0;
  }
}
