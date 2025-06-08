import { Observable } from 'rxjs';
import { BaseService } from '../../base/base.service.js';
import {
  CD_FX_FAIL,
  CdFxReturn,
  CreateIParams,
  IQbInput,
  IQuery,
  IServiceInput,
} from '../../base/IBase.js';
import { CdObjTypeModel } from '../../moduleman/models/cd-obj-type.model.js';
import { CompanyModel } from '../../moduleman/models/company.model.js';
import { ConsumerModel } from '../../moduleman/models/consumer.model.js';
import { CompanyService } from '../../moduleman/services/company.service.js';
import { ConsumerService } from '../../moduleman/services/consumer.service.js';
import { GroupTypeModel } from '../models/group-type.model.js';
import { GroupModel } from '../models/group.model.js';
import { SessionModel } from '../models/session.model.js';
import { UserModel } from '../models/user.model.js';
import { SessionService } from './session.service.js';
import { UserService } from './user.service.js';
import { GenericService } from '../../base/generic-service.js';
import { ObjectLiteral } from 'typeorm';

export class GroupService extends GenericService<ObjectLiteral> {
  cdToken!: string;
  srvSess: SessionService = new SessionService();
  // b: BaseService<GroupModel>;
  b: BaseService<ObjectLiteral>; // 👈 Allowing it to work with any entity
  serviceModel: GroupModel;

  /*
   * create rules
   */
  cRules = {
    required: ['groupName', 'groupTypeId'],
    noDuplicate: ['groupName', 'groupOwnerId'],
  };
  uRules: any[] = [];
  dRules: any[] = [];
  constructor() {
    super(GroupModel);
    this.b = new BaseService();
    this.serviceModel = new GroupModel();
  }

  getMemoSummary(cuid) {
    return [{}];
  }

  async getModuleGroup(req, res, moduleName): Promise<GroupModel[] | null> {
    const serviceInput: IServiceInput<GroupModel> = {
      serviceInstance: this,
      serviceModel: GroupModel,
      docName: 'GroupService::getGroupByName',
      cmd: {
        action: 'find',
        query: { where: { groupName: moduleName } },
      },
      dSource: this.defaultDs,
    };
    const resultModGroup = await this.read(req, res, serviceInput);
    if (!resultModGroup.state || !resultModGroup.data) {
      return null;
    } else {
    }
    return resultModGroup.data as GroupModel[];
  }

  getModuleGroup$(req, res, moduleName): Observable<GroupModel[]> {
    const serviceInput = {
      serviceModel: GroupModel,
      docName: 'GroupService::getGroupByName',
      cmd: {
        action: 'find',
        query: { where: { groupName: moduleName } },
      },
      dSource: this.defaultDs,
    };
    return this.b.read$(req, res, serviceInput);
  }

  async getGroupByName(req, res, groupParams) {
    // console.log('starting GroupService::getGroupByName(req, res, groupParams)');
    // console.log('GroupService::getGroupByName/groupParams:', groupParams);
    if (groupParams.groupName) {
      const serviceInput = {
        serviceInstance: this,
        serviceModel: GroupModel,
        docName: 'GroupService::getGroupByName',
        cmd: {
          action: 'find',
          query: {
            where: {
              groupName: groupParams.groupName,
              groupTypeId: groupParams.groupTypeId,
            },
          },
        },
        dSource: this.defaultDs,
      };
      return await this.b.read(req, res, serviceInput);
    } else {
      console.log('groupParams.groupName is invalid');
    }
  }

  // /**
  //  * In the example below we are registering booking module as a resource to emp services
  //  * This allows users registered under empservices to access booking module when appropriate privileges are given
  //  * {
  //         "ctx": "Sys",
  //         "m": "Moduleman",
  //         "c": "Group",
  //         "a": "Create",
  //         "dat": {
  //             "f_vals": [
  //                 {
  //                     "data": {
  //                          "cd_obj_type_id": "8b4cf8de-1ffc-4575-9e73-4ccf45a7756b", // module
  //                          "group_id": "B0B3DA99-1859-A499-90F6-1E3F69575DCD", // emp services
  //                          "obj_id": "8D4ED6A9-398D-32FE-7503-740C097E4F1F" // recource (module) id...in this case: booking module
  //                     }
  //                 }
  //             ],
  //             "token": "3ffd785f-e885-4d37-addf-0e24379af338"
  //         },
  //         "args": {}
  //     }
  //  * @param req
  //  * @param res
  //  */
  // async create(req: any, res: any) {
  //   console.log('GroupService::create::validateCreate()/01');
  //   const svSess = new SessionService();
  //   if (await this.validateCreate(req, res)) {
  //     await this.beforeCreate(req, res);
  //     const serviceInput = {
  //       serviceModel: GroupModel,
  //       serviceModelInstance: this.serviceModel,
  //       docName: 'Create group',
  //       dSource: this.defaultDs,
  //     };
  //     console.log('GroupService::create()/serviceInput:', serviceInput);
  //     console.log('GroupService::create()/req.post:', JSON.stringify(req.post));
  //     const respData = await this.b.create(req, res, serviceInput);
  //     this.b.i.app_msg = 'new group created';
  //     this.b.setAppState(true, this.b.i, svSess.sessResp);
  //     this.b.cdResp.data = await respData;
  //     const r = await this.b.respond(req, res);
  //   } else {
  //     console.log('moduleman/create::validateCreate()/02');
  //     const r = await this.b.respond(req, res);
  //   }
  // }

  // async createI(
  //   req,
  //   res,
  //   createIParams: CreateIParams<GroupModel>,
  // ): Promise<GroupModel | boolean> {
  //   return await this.b.createI(req, res, createIParams);
  // }

  async createPalsGroup(req, res, userData: UserModel) {
    console.log('GroupService::createPalsGroup()/01');
    // const svGroup = new GroupService()
    const svConsumer = new ConsumerService();
    svConsumer.b = this.b;
    const svCompany = new CompanyService();
    svCompany.b = this.b;
    // const svSess = new SessionService()
    let coId = -1;
    let consGuid = '';
    // const co = await svConsumer.activeCompany(req, res);

    ////////////
    const plData = await this.b.getPlData(req);
    consGuid = plData.consumerGuid;
    const consumerData: ConsumerModel[] = await svConsumer.getConsumerByGuid(
      req,
      res,
      consGuid,
    );
    console.log('GroupService::createPalsGroup()/consumerData:', consumerData);
    // const consumerData = await svConsumer.activeConsumer(req, res);

    if (consumerData[0].companyId && consumerData.length > 0) {
      coId = consumerData[0].companyId;
    }
    const co: CompanyModel[] = await svCompany.getCompanyI(req, res, {
      where: { companyId: coId },
    });
    console.log('GroupService::createPalsGroup()/co:', co);

    if (co[0].companyId && consumerData[0].consumerGuid && co.length > 0) {
      coId = co[0].companyId;
      consGuid = consumerData[0].consumerGuid;
      // const cUser = await svSess.getCurrentUser(req)
      console.log('GroupService::createPalsGroup()/userData:', userData);
      console.log(
        'GroupService::createPalsGroup()/co[0].consumerGuid:',
        co[0].consumerGuid,
      );
      console.log('GroupService::createPalsGroup()/consGuid:', consGuid);
      const groupData = {
        groupGuid: this.b.getGuid(),
        groupName: `${userData.userGuid}-pals`,
        groupOwnerId: userData.userId,
        groupTypeId: 7,
        moduleGuid: '-dkkm6',
        companyId: coId,
        consumerGuid: consGuid,
        isPublic: false,
        enabled: true,
      };
      console.log('GroupService::createPalsGroup()/groupData:', groupData);
      const si = {
        serviceInstance: this,
        serviceModel: GroupModel,
        serviceModelInstance: this.serviceModel,
        docName: 'UserService/afterCreate',
        dSource: this.defaultDs,
      };
      const createIParams: CreateIParams<GroupModel> = {
        serviceInput: si,
        controllerData: groupData,
      };
      console.log(
        'GroupService::createPalsGroup()/createIParams:',
        createIParams,
      );
      return await this.createI(req, res, createIParams);
    } else {
      // console.log('CompanyService::read$()/e:', e)
      const e = 'unable to associate user with any company';
      this.b.err.push(e);
      const i = {
        messages: this.b.err,
        code: 'BaseService:update',
        app_msg: '',
      };
      await this.b.serviceErr(req, res, e, i.code);
    }
  }

  async groupExists(req, res, params): Promise<boolean> {
    let ret = false;
    const serviceInput: IServiceInput<GroupModel> = {
      serviceInstance: this,
      serviceModel: GroupModel,
      docName: 'GroupService::groupExists',
      cmd: {
        action: 'find',
        query: { where: params.filter },
      },
      dSource: this.defaultDs,
    };
    const result = (await this.read(
      req,
      res,
      serviceInput,
    )) as CdFxReturn<ObjectLiteral>;
    if (!result.state || !result.data) {
      ret = false;
    } else if (result.data.length > 0) {
      ret = true;
    }
    return ret;
  }

  async beforeCreate(req, res): Promise<any> {
    const q: any = { where: { cdToken: req.post.dat.token } };
    const serviceInput: IServiceInput<SessionModel> = {
      serviceModel: SessionModel,
      modelName: 'SessionModel',
      serviceModelInstance: new SessionModel(),
      cmd: {
        action: 'find',
        query: q,
      },
      docName: 'beforeCreate',
      dSource: this.defaultDs,
    };
    this.b.sess = await this.b.read(req, res, serviceInput);
    if (this.b.sess.length > 0) {
      this.b.setPlData(req, {
        key: 'groupOwnerId',
        value: this.b.sess[0].currentUserId,
      });
    }
    this.b.setPlData(req, {
      key: 'consumerGuid',
      value: this.b.sess[0].consumerGuid,
    });
    this.b.setPlData(req, { key: 'groupGuid', value: this.b.getGuid() });
    this.b.setPlData(req, { key: 'groupEnabled', value: true });
    return true;
  }

  // update(req: any, res: any) {
  //   // console.log('GroupService::update()/01');
  //   let q = this.b.getQuery(req);
  //   q = this.beforeUpdate(q);
  //   const serviceInput = {
  //     serviceModel: GroupModel,
  //     docName: 'GroupService::update',
  //     cmd: {
  //       action: 'update',
  //       query: q,
  //     },
  //     dSource: this.defaultDs,
  //   };
  //   // console.log('GroupService::update()/02')
  //   this.b.update$(req, res, serviceInput).subscribe((ret) => {
  //     this.b.cdResp.data = ret;
  //     this.b.respond(req, res);
  //   });
  // }

  /**
   * harmonise any data that can
   * result in type error;
   * @param q
   * @returns
   */
  beforeUpdate(q: any) {
    if (q.update.groupResourceEnabled === '') {
      q.update.groupResourceEnabled = null;
    }
    return q;
  }

  async remove(req: any, res: any) {
    //
  }

  /**
   * methods for transaction rollback
   */
  rbCreate(): number {
    return 1;
  }

  rbUpdate(): number {
    return 1;
  }

  rbDelete(): number {
    return 1;
  }

  // async validateCreate(req: any, res: any) {
  //   console.log('moduleman/GroupService::validateCreate()/01');
  //   const svSess = new SessionService();
  //   ///////////////////////////////////////////////////////////////////
  //   // 1. Validate against duplication
  //   const params = {
  //     serviceInstance: this,
  //     model: GroupModel,
  //   };
  //   this.b.i.code = 'GroupService::validateCreate';
  //   let ret = false;
  //   if (await this.b.validateUnique(req, res, params)) {
  //     console.log('moduleman/GroupService::validateCreate()/02');
  //     if (await this.b.validateRequired(req, res, this.cRules)) {
  //       console.log('moduleman/GroupService::validateCreate()/03');
  //       ret = true;
  //     } else {
  //       console.log('moduleman/GroupService::validateCreate()/04');
  //       ret = false;
  //       this.b.i.app_msg = `the required fields ${this.b.isInvalidFields.join(', ')} is missing`;
  //       this.b.err.push(this.b.i.app_msg);
  //       this.b.setAppState(false, this.b.i, svSess.sessResp);
  //     }
  //   } else {
  //     console.log('moduleman/GroupService::validateCreate()/05');
  //     ret = false;
  //     this.b.i.app_msg = `duplicate for ${this.cRules.noDuplicate.join(', ')} is not allowed`;
  //     this.b.err.push(this.b.i.app_msg);
  //     this.b.setAppState(false, this.b.i, svSess.sessResp);
  //   }
  //   console.log('moduleman/GroupService::validateCreate()/06');
  //   const pl: GroupModel = await this.b.getPlData(req);
  //   //////////////////////////////////////////////////////////////////////////
  //   // 3. confirm the groupId referenced exists
  //   if ('groupTypeId' in pl) {
  //     console.log('moduleman/GroupService::validateCreate()/12');
  //     console.log('moduleman/GroupService::validateCreate()/pl:', pl);
  //     const serviceInput = {
  //       serviceModel: GroupTypeModel,
  //       docName: 'GroupService::validateCreate',
  //       cmd: {
  //         action: 'find',
  //         query: { where: { groupTypeId: pl.groupTypeId } },
  //       },
  //       dSource: this.defaultDs,
  //     };
  //     console.log(
  //       'moduleman/GroupService::validateCreate()/serviceInput:',
  //       JSON.stringify(serviceInput),
  //     );
  //     const r: any = await this.b.read(req, res, serviceInput);
  //     console.log('moduleman/GroupService::validateCreate()/r:', r);
  //     if (r.length > 0) {
  //       console.log('moduleman/GroupService::validateCreate()/13');
  //       ret = true;
  //     } else {
  //       console.log('moduleman/GroupService::validateCreate()/14');
  //       ret = false;
  //       this.b.i.app_msg = `group type reference is invalid`;
  //       this.b.err.push(this.b.i.app_msg);
  //       this.b.setAppState(false, this.b.i, svSess.sessResp);
  //     }
  //   } else {
  //     console.log('moduleman/GroupService::validateCreate()/15');
  //     // this.b.i.app_msg = `parentModuleGuid is missing in payload`;
  //     // this.b.err.push(this.b.i.app_msg);
  //     //////////////////
  //     this.b.i.app_msg = `groupTypeId is missing in payload`;
  //     this.b.err.push(this.b.i.app_msg);
  //     this.b.setAppState(false, this.b.i, svSess.sessResp);
  //   }
  //   console.log('GroupService::getGroup/20');
  //   if (this.b.err.length > 0) {
  //     console.log('moduleman/GroupService::validateCreate()/21');
  //     ret = false;
  //   }
  //   return ret;
  // }
  /**
   * Validate input before processing create
   */
  async validateCreate(pl: GroupModel): Promise<CdFxReturn<boolean>> {
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
        userName: pl.groupName,
        email: pl.groupOwnerId,
      },
    };
    const serviceInput = {
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

  async getGroup(req: any, res: any) {
    const q = this.b.getQuery(req);
    console.log('GroupService::getGroup/f:', q);
    const serviceInput = {
      serviceModel: GroupModel,
      docName: 'GroupService::getGroup$',
      cmd: {
        action: 'find',
        query: q,
      },
      dSource: this.defaultDs,
    };
    try {
      this.b.read$(req, res, serviceInput).subscribe((r) => {
        console.log('GroupService::read$()/r:', r);
        this.b.i.code = 'GroupController::Get';
        const svSess = new SessionService();
        svSess.sessResp.cd_token = req.post.dat.token;
        svSess.sessResp.ttl = svSess.getTtl();
        this.b.setAppState(true, this.b.i, svSess.sessResp);
        this.b.cdResp.data = r;
        this.b.respond(req, res);
      });
    } catch (e: any) {
      console.log('GroupService::read$()/e:', e);
      this.b.err.push((e as Error).toString());
      const i = {
        messages: this.b.err,
        code: 'BaseService:update',
        app_msg: '',
      };
      await this.b.serviceErr(req, res, e, i.code);
      await this.b.respond(req, res);
    }
  }

  async getGroupI(req, res, q?: IQuery): Promise<GroupModel[] | null> {
    if (q == null) {
      q = this.b.getQuery(req);
    }
    console.log('GroupService::getGroupI/f:', q);
    const serviceInput: IServiceInput<GroupModel> = {
      serviceModel: GroupModel,
      docName: 'GroupService::getGroupI',
      cmd: {
        action: 'find',
        query: q as IQuery,
      },
      dSource: this.defaultDs,
    };
    try {
      if (req) {
        /**
         * cd-api return
         */
        return (await this.b.read(req, res, serviceInput)) as GroupModel[];
      } else {
        /**
         * cd-cli return
         */
        const result = (await this.b.read(
          req,
          res,
          serviceInput,
        )) as CdFxReturn<GroupModel[]>;
        if (!result.state || !result.data) {
          return null;
        } else {
          return result.data;
        }
      }
    } catch (e: any) {
      console.log('GroupService::getGroupI()/e:', e);
      if (req) {
        this.b.err.push((e as Error).toString());
        const i = {
          messages: this.b.err,
          code: 'GroupService:getGroupI',
          app_msg: '',
        };
        await this.b.serviceErr(req, res, e, i.code);
        await this.b.respond(req, res);
      }
      return null;
    }
  }

  async getGroupType(req: any, res: any) {
    const q = this.b.getQuery(req);
    console.log('GroupService::getGroup/f:', q);
    const serviceInput = {
      serviceModel: GroupTypeModel,
      docName: 'GroupService::getGroupType$',
      cmd: {
        action: 'find',
        query: q,
      },
      dSource: this.defaultDs,
    };
    try {
      this.b.read$(req, res, serviceInput).subscribe((r) => {
        console.log('GroupService::read$()/r:', r);
        this.b.i.code = 'GroupController::Get';
        const svSess = new SessionService();
        svSess.sessResp.cd_token = req.post.dat.token;
        svSess.sessResp.ttl = svSess.getTtl();
        this.b.setAppState(true, this.b.i, svSess.sessResp);
        this.b.cdResp.data = r;
        this.b.respond(req, res);
      });
    } catch (e: any) {
      console.log('GroupService::getGroupType()/e:', e);
      if (req) {
        this.b.err.push((e as Error).toString());
        const i = {
          messages: this.b.err,
          code: 'GroupService:getGroupType',
          app_msg: '',
        };
        await this.b.serviceErr(req, res, e, i.code);
        await this.b.respond(req, res);
      }
      return null;
    }
  }

  async getGroupTypeI(req, res, q?: IQuery): Promise<GroupTypeModel[] | null> {
    if (q == null) {
      q = this.b.getQuery(req);
    }
    console.log('GroupService::getGroupI/f:', q);
    const serviceInput: IServiceInput<GroupTypeModel> = {
      serviceModel: GroupTypeModel,
      docName: 'GroupService::getGroupI',
      cmd: {
        action: 'find',
        query: q as IQuery,
      },
      dSource: this.defaultDs,
    };
    try {
      if (req) {
        /**
         * cd-api return
         */
        return (await this.b.read(req, res, serviceInput)) as GroupTypeModel[];
      } else {
        /**
         * cd-cli return
         */
        const result = (await this.b.read(
          req,
          res,
          serviceInput,
        )) as CdFxReturn<GroupTypeModel[]>;
        if (!result.state || !result.data) {
          return null;
        } else {
          return result.data;
        }
      }
    } catch (e: any) {
      console.log('GroupService::getGroupTypeI()/e:', e);
      if (req) {
        this.b.err.push((e as Error).toString());
        const i = {
          messages: this.b.err,
          code: 'GroupService:getGroupTypeI',
          app_msg: '',
        };
        await this.b.serviceErr(req, res, e, i.code);
        await this.b.respond(req, res);
      }
      return null;
    }
  }

  getGroupCount(req: any, res: any) {
    const q = this.b.getQuery(req);
    console.log('GroupService::getGroupCount/q:', q);
    const serviceInput = {
      serviceModel: GroupModel,
      docName: 'GroupService::getGroupCount$',
      cmd: {
        action: 'find',
        query: q,
      },
      dSource: this.defaultDs,
    };
    this.b.readCount$(req, res, serviceInput).subscribe((r) => {
      this.b.i.code = 'GroupController::Get';
      const svSess = new SessionService();
      svSess.sessResp.cd_token = req.post.dat.token;
      svSess.sessResp.ttl = svSess.getTtl();
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = r;
      this.b.respond(req, res);
    });
  }

  getGroupTypeCount(req: any, res: any) {
    const q = this.b.getQuery(req);
    console.log('GroupService::getGroupCount/q:', q);
    const serviceInput = {
      serviceModel: GroupTypeModel,
      docName: 'GroupService::getGroupCount$',
      cmd: {
        action: 'find',
        query: q,
      },
      dSource: this.defaultDs,
    };
    this.b.readCount$(req, res, serviceInput).subscribe((r) => {
      this.b.i.code = 'GroupController::Get';
      const svSess = new SessionService();
      svSess.sessResp.cd_token = req.post.dat.token;
      svSess.sessResp.ttl = svSess.getTtl();
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = r;
      this.b.respond(req, res);
    });
  }

  // delete(req: any, res: any) {
  //   const q = this.b.getQuery(req);
  //   console.log('GroupService::delete()/q:', q);
  //   const serviceInput = {
  //     serviceModel: GroupModel,
  //     docName: 'GroupService::delete',
  //     cmd: {
  //       action: 'delete',
  //       query: q,
  //     },
  //     dSource: this.defaultDs,
  //   };

  //   this.b.delete$(req, res, serviceInput).subscribe((ret) => {
  //     this.b.cdResp.data = ret;
  //     this.b.respond(req, res);
  //   });
  // }
}
