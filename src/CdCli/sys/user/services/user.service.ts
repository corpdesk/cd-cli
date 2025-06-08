// import { SqliteStore } from "../store/SqliteStore";
// import { UserModel } from "../entities/UserModel";

import { ObjectLiteral } from 'typeorm';
import {
  CD_FX_FAIL,
  CdFxReturn,
  IQuery,
  IServiceInput,
} from '../../base/IBase.js';
import { UserModel } from '../models/user.model.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import { BaseService } from '../../base/base.service.js';
import config from '../../../../config.js';
import { GenericService } from '../../base/generic-service.js';
import { DocModel } from '../../moduleman/models/doc.model.js';
import { ProfileServiceHelper } from '../../utilities/profile-service-helper.js';

export class UserService extends GenericService<UserModel> {
  // private b = new BaseService<UserModel>();

  defaultDs = config.ds.sqlite;
  // Define validation rules
  cRules: any = {
    required: ['userName', 'email', 'password'],
    noDuplicate: ['userName', 'email'],
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////
  // ADAPTATION FROM GENERIC SERVICE
  constructor() {
    super(UserModel);
  }

  /**
   * Validate input before processing create
   */
  async validateCreate(pl: UserModel): Promise<CdFxReturn<boolean>> {
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
        userName: pl.userName,
        email: pl.email,
      },
    };
    const serviceInput: IServiceInput<UserModel> = {
      serviceModel: UserModel,
      docName: 'Validate Duplicate User',
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
    pl: UserModel,
  ): Promise<CdFxReturn<UserModel | ObjectLiteral>> {
    const query = {
      where: { userGuid: pl.userGuid },
    };

    const serviceInput = {
      serviceModel: UserModel,
      docName: 'Fetch Created User',
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

  async getUser(
    q: IQuery,
  ): Promise<CdFxReturn<UserModel[] | ObjectLiteral[] | unknown>> {
    // Validate query input
    if (!q || !q.where || Object.keys(q.where).length === 0) {
      return {
        data: null,
        state: false,
        message: 'Invalid query: "where" condition is required',
      };
    }

    const serviceInput = {
      serviceModel: UserModel,
      docName: 'UserService::getUser',
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
      CdLog.error(`UserService.getUser() - Error: ${e.message}`);
      return {
        data: null,
        state: false,
        message: `Error retrieving User: ${e.message}`,
      };
    }
  }

  beforeUpdate(q: any) {
    if (q.update.CoopEnabled === '') {
      q.update.CoopEnabled = null;
    }
    return q;
  }

  async getUserByID(req, res, uid) {
    const serviceInput = {
      serviceInstance: this,
      serviceModel: UserModel,
      docModel: DocModel,
      docName: 'UserService::getUserByID',
      cmd: {
        action: 'find',
        query: { where: { userId: uid } },
      },
      dSource: config.ds.sqlite,
    };
    return await this.read(req, res, serviceInput);
  }

  async existingUserProfile(req, res, cuid) {
    const si: IServiceInput<UserModel> = {
      serviceInstance: this,
      serviceModel: UserModel,
      docName: 'UserService::existingUserProfile',
      cmd: {
        query: { where: { userId: cuid } },
      },
      mapping: { profileField: 'userProfile' },
    };
    return ProfileServiceHelper.fetchProfile(req, res, si);
  }

  async modifyProfile(existingData, profileConfig) {
    return await ProfileServiceHelper.modifyProfile(
      existingData,
      profileConfig,
    );
  }

  // Helper method to validate profile data
  async validateProfileData(req, res, profileData: any): Promise<boolean> {
    CdLog.debug('UserService::validateProfileData()/profileData:', profileData);
    // const profileData: IUserProfile = updateData.update.userProfile
    // CdLog.debug("UserService::validateProfileData()/profileData:", profileData)
    // Check if profileData is null or undefined
    if (!profileData) {
      CdLog.debug('UserService::validateProfileData()/01');
      return false;
    }

    // Validate that the required fields of IUserProfile exist
    if (!profileData.fieldPermissions || !profileData.userData) {
      CdLog.debug('UserService::validateProfileData()/02');
      return false;
    }

    // Example validation for bio length
    if (profileData.bio && profileData.bio.length > 500) {
      CdLog.debug('UserService::validateProfileData()/03');
      const e = 'Bio data is too long';
      this.b.err.push(e);
      const i = {
        messages: this.b.err,
        code: 'UserService:validateProfileData',
        app_msg: '',
      };
      await this.b.serviceErr(req, res, e, i.code);
      return false; // Bio is too long
    }
    return true;
  }
}
