// import { SqliteStore } from "../store/SqliteStore";
// import { SessionModel } from "../entities/SessionModel";

import { ObjectLiteral } from 'typeorm';
import {
  CD_FX_FAIL,
  CdFxReturn,
  IQuery,
  IServiceInput,
  ISessionDataExt,
  ISessResp,
} from '../../base/IBase.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import { BaseService } from '../../base/base.service.js';
import config from '../../../../config.js';
import { GenericService } from '../../base/generic-service.js';
import { SessionModel } from '../models/session.model.js';
import { Logging } from '../../base/winston.log.js';
import { RedisService } from '../../base/redis-service.js';
import { UserModel } from '../models/user.model.js';
import { ConsumerModel } from '../../moduleman/models/consumer.model.js';
import { CompanyModel } from '../../moduleman/models/company.model.js';
import { UserService } from './user.service.js';
import { ConsumerService } from '../../moduleman/services/consumer.service.js';

export class SessionService extends GenericService<SessionModel> {
  // private b = new BaseService<SessionModel>();

  logger: Logging = new Logging();
  private redisService: RedisService;
  sessModel: SessionModel = new SessionModel();
  sessIsSet = false;
  sessData = {
    cuid: 1000,
    cdToken: '',
    consumerGuid: '',
    deviceNetId: null,
    userData: null,
  };

  sessResp: ISessResp = {
    cd_token: '',
    jwt: null,
    ttl: 600,
  };

  currentUserData: UserModel = new UserModel();
  currentUserProfile;
  currentSessData: SessionModel[] = [];
  currentConsumerData: ConsumerModel[] = [];
  currentCompanyData: CompanyModel[] = [];

  defaultDs = config.ds.sqlite;
  // Define validation rules
  cRules: any = {
    required: ['sessionName', 'sessionTypeGuid', 'sessionGuid'],
    noDuplicate: ['sessionName', 'sessionTypeGuid'],
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////
  // ADAPTATION FROM GENERIC SERVICE
  constructor() {
    super(SessionModel);
    this.redisService = new RedisService();
  }

  /**
   * Validate input before processing create
   */
  async validateCreate(pl: SessionModel): Promise<CdFxReturn<boolean>> {
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
        cdToken: pl.cdToken,
      },
    };
    const serviceInput = {
      serviceModel: SessionModel,
      docName: 'Validate Duplicate Session',
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
    pl: SessionModel,
  ): Promise<CdFxReturn<SessionModel | ObjectLiteral | null >> {
    const query = {
      where: { cdToken: pl.cdToken },
    };

    const serviceInput = {
      serviceModel: SessionModel,
      docName: 'Fetch Created Session',
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

  async getSession(
    q: IQuery,
  ): Promise<CdFxReturn<SessionModel[] | ObjectLiteral[] | unknown>> {
    // Validate query input
    if (!q || !q.where || Object.keys(q.where).length === 0) {
      return {
        data: null,
        state: false,
        message: 'Invalid query: "where" condition is required',
      };
    }

    const serviceInput = {
      serviceModel: SessionModel,
      docName: 'SessionService::getSession',
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
      CdLog.error(`SessionService.getSession() - Error: ${e.message}`);
      return {
        data: null,
        state: false,
        message: `Error retrieving Session: ${e.message}`,
      };
    }
  }

  beforeUpdate(q: any) {
    if (q.update.CoopEnabled === '') {
      q.update.CoopEnabled = null;
    }
    return q;
  }

  getTtl() {
    return 600;
  }

  async getSessionDataExt(
    req,
    res,
    ignoreCache?: boolean,
  ): Promise<ISessionDataExt | null> {
    console.log('SessionService::getSessionDataExt()/01');
    let cacheKey;

    if (!ignoreCache) {
      console.log('SessionService::getSessionDataExt()/02');
      // Define a unique cache key based on session ID or user-specific identifier
      cacheKey = `session_data_${req.post.dat.token}`;

      // Try to retrieve session data from Redis cache
      let sessionStr = await this.redisService.get(cacheKey);

      if (sessionStr) {
        console.log('SessionService::getSessionDataExt()/03');
        // Parse cached session data and return it
        return JSON.parse(sessionStr);
      }
    }

    // If cache miss, proceed to retrieve data from the database as usual
    const svUser = new UserService();
    const svConsumer = new ConsumerService();

    const sessResult = await this.getSession({
      where: { currentUserId: this.b.cuid },
    });

    if (
      !sessResult.state ||
      !sessResult.data ||
      !Array.isArray(sessResult.data) ||
      sessResult.data.length === 0
    ) {
      return null; // Ensure `this.sessData` is fully initialized
    }

    // Assign the session data properly
    this.currentSessData = sessResult.data as SessionModel[];

    let consumerGuid = '';
    if (this.currentSessData[0].consumerGuid) {
      consumerGuid = this.currentSessData[0].consumerGuid;
    }

    const cuid = this.currentSessData[0].currentUserId;
    const userData = await svUser.getUserByID(req, res, cuid);
    this.currentUserData = userData[0];

    this.currentUserProfile = await svUser.existingUserProfile(req, res, cuid);

    const consumer = await svConsumer.getConsumerI(req, res, {
      where: { consumerGuid: consumerGuid },
    });
    if (consumer) {
      this.currentConsumerData = consumer;
    }

    const consumerData = await svConsumer.getCompanyData(
      req,
      res,
      consumerGuid,
    );

    if (consumerData) {
      this.currentCompanyData = consumerData;
    }

    // Compose session data object
    const retSessionData = {
      currentUser: userData[0],
      currentUserProfile: this.currentUserProfile,
      currentSession: this.currentSessData[0],
      currentConsumer: this.currentConsumerData[0],
      currentCompany: this.currentCompanyData[0],
    };

    if (!ignoreCache) {
      // Set the TTL to 1 hour (3600 seconds)
      const ttl = Number(config.cacheTtl);
      // Store the session data in Redis for future requests (set a TTL of 1 hour)
      await this.redisService.set(
        cacheKey,
        JSON.stringify(retSessionData),
        ttl,
      );
    }
    // Return the freshly fetched session data
    return retSessionData;
  }
}
