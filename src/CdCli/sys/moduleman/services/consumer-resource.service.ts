/**
 * Entity that consumes corpdesk services is refered to as consumer
 * Resources that the consumer has subscribed to are consumerResources
 * An entity can consume resources are root, developer, user etc. These are managed by consumerTypes
 */

//  consumer_resource_id, consumer_resource_guid, doc_id, cd_obj_type_id,
//  consumer_resource_enabled, consumer_id, obj_id, cd_obj_id, consumer_resource_type_id,
//  consumer_guid, obj_guid, cd_obj_guid, consumer_resource_type_guid

import { BaseService } from '../../base/base.service.js';
import { SessionService } from '../../user/services/session.service.js';
import { UserService } from '../../user/services/user.service.js';
import {
  CdFxReturn,
  CreateIParams,
  IServiceInput,
  IUser,
} from '../../base/IBase.js';
import { ConsumerResourceModel } from '../models/consumer-resource.model.js';
import { ConsumerResourceViewModel } from '../models/consumer-resource-view.model.js';
import { ConsumerResourceTypeModel } from '../models/consumer-resource-type.model.js';
import { ConsumerModel } from '../models/consumer.model.js';
import { CdObjModel } from '../models/cd-obj.model.js';
import { GenericService } from '../../base/generic-service.js';
import { CompanyModel } from '../models/company.model.js';

export class ConsumerResourceService extends GenericService<ConsumerResourceModel> {
  // b: BaseService<CdGeoProximityService>; // instance of BaseService
  cdToken!: string;
  srvSess!: SessionService;
  srvUser!: UserService;
  user!: IUser;
  serviceModel: ConsumerResourceModel;
  sessModel;
  // moduleModel: ModuleModel;

  /*
   * create rules
   */
  cRules: any = {
    required: ['consumerGuid', 'cdObjGuid'],
    noDuplicate: ['consumerGuid', 'cdObjGuid'],
  };
  uRules!: any[];
  dRules!: any[];

  constructor() {
    super(ConsumerResourceModel);
    this.b = new BaseService();
    this.serviceModel = new ConsumerResourceModel();
  }

  /**
     * 
     * The consumer resource to list as resource must
     * 1. be registered in cdobj table
     * 2. it is the cdobj reference that is used to register it as a resource to a given consumer
     * 3. As a cdobj type, the recource can be as varied as cdobj type allows. Eg company, user, module, controller etc
     * 
     * In the example below we are registering booking module as a resource to emp services
     * This allows users registered under empservices to access booking module when appropriate privileges are given
     * {
            "ctx": "Sys",
            "m": "Moduleman",
            "c": "ConsumerResource",
            "a": "Create",
            "dat": {
                "f_vals": [
                    {
                        "data": {
                             "cdObjTypeGuid": "8b4cf8de-1ffc-4575-9e73-4ccf45a7756b", // module
                             "consumerId": "B0B3DA99-1859-A499-90F6-1E3F69575DCD", // emp services
                             "cdObjGuid": "8D4ED6A9-398D-32FE-7503-740C097E4F1F" // resource (module) guid...in this case: booking module
                        }
                    }
                ],
                "token": "3ffd785f-e885-4d37-addf-0e24379af338"
            },
            "args": {}
        }
     * @param req
     * @param res
     */
  //   async create(req: any, res: any) {
  //     console.log('ConsumerResourceService::create::validateCreate()/01');
  //     const svSess = new SessionService();
  //     if (await this.validateCreate(req, res)) {
  //       await this.beforeCreate(req, res);
  //       const serviceInput = {
  //         serviceModel: ConsumerResourceModel,
  //         serviceModelInstance: this.serviceModel,
  //         docName: 'Create company',
  //         dSource: this.defaultDs,
  //       };
  //       console.log(
  //         'ConsumerResourceService::create()/serviceInput:',
  //         serviceInput,
  //       );
  //       console.log(
  //         'ConsumerResourceService::create()/req.post:',
  //         JSON.stringify(req.post),
  //       );
  //       const respData = await this.b.create(req, res, serviceInput);
  //       this.b.i.app_msg = 'new company created';
  //       this.b.setAppState(true, this.b.i, svSess.sessResp);
  //       this.b.cdResp.data = await respData;
  //       const r = await this.b.respond(req, res);
  //     } else {
  //       console.log('moduleman/create::validateCreate()/02');
  //       const r = await this.b.respond(req, res);
  //     }
  //   }

  //   async createI(
  //     req,
  //     res,
  //     createIParams: CreateIParams,
  //   ): Promise<ConsumerResourceModel | boolean> {
  //     return await this.b.createI(req, res, createIParams);
  //   }

  async companyExists(req, res, params): Promise<boolean> {
    const serviceInput: IServiceInput<ConsumerResourceModel> = {
      serviceInstance: this,
      serviceModel: ConsumerResourceModel,
      docName: 'ConsumerResourceService::companyExists',
      cmd: {
        action: 'find',
        query: { where: params.filter },
      },
      dSource: this.defaultDs,
    };
    if (req) {
      const consumerRec = (await this.b.read(
        req,
        res,
        serviceInput,
      )) as ConsumerResourceModel[];
      if (consumerRec.length > 0) {
        return true;
      } else {
        return false;
      }
    } else {
      const resultConsumerRec = (await this.b.read(
        req,
        res,
        serviceInput,
      )) as CdFxReturn<ConsumerResourceModel[]>;
      if (!resultConsumerRec.state || !resultConsumerRec.data) {
        return false;
      }
      if (resultConsumerRec.data.length > 0) {
        return true;
      } else {
        return false;
      }
    }
  }

  async beforeCreate(req, res, pl: ConsumerResourceModel): Promise<any> {
    // cRules: any = {
    //     required: ['cd_obj_type_id', 'consumer_id', 'obj_id'],
    //     noDuplicate: ['obj_id', 'consumer_id']
    // };
    // consumer_resource_id, consumer_resource_guid, doc_id, cd_obj_type_id,
    // consumer_resource_enabled, consumer_id, obj_id, cd_obj_id, consumer_resource_type_id,
    // consumer_guid, obj_guid, cd_obj_guid, consumer_resource_type_guid

    // const pl: ConsumerModel = this.b.getPlData(req);
    // console.log('moduleman/create::beforeCreate()/this.company:', this.company);
    // this.b.setPlData(req, { key: 'consumerName', value: this.company.companyName });
    // this.b.setPlData(req, { key: 'companyId', value: this.company.companyId });
    // this.b.setPlData(req, { key: 'companyGuid', value: pl.companyGuid });
    // this.b.setPlData(req, { key: 'consumerGuid', value: this.b.getGuid()});
    // this.b.setPlData(req, { key: 'consumerEnabled', value: true });

    console.log('ConsumerResourceService::beforeCreate::validateCreate()/01');
    this.b.setPlData(req, {
      key: 'consumerResourceGuid',
      value: this.b.getGuid(),
    });
    this.b.setPlData(req, { key: 'consumerResourceEnabled', value: true });

    if (req) {
      // get cdObj:
      pl = (await this.b.getPlData(req)) as ConsumerResourceModel;
    }

    // let q: any = { where: { cdObjGuid: pl.cdObjGuid } }
    let serviceInput: IServiceInput<CdObjModel> = {
      serviceModel: CdObjModel,
      cmd: {
        action: 'find',
        query: { where: { cdObjGuid: pl.cdObjGuid } },
      },
      dSource: this.defaultDs,
    };
    console.log(
      'moduleman/ConsumerResourceService::beforeCreate()/serviceInput:',
      serviceInput,
    );
    const b = new BaseService<CdObjModel>();
    if (req) {
      // let q: IQuery = { where: { cdObjGuid: pl.cdObjGuid } };
      const cdObjData = (await b.read(req, res, serviceInput)) as CdObjModel[];
      console.log('ConsumerResourceService::beforeCreate::validateCreate()/02');
      console.log(
        'ConsumerResourceService::beforeCreate::validateCreate()/cdObjData:',
        cdObjData,
      );
      this.b.setPlData(req, {
        key: 'consumberResourceName',
        value: cdObjData[0].cdObjName,
      });
      this.b.setPlData(req, { key: 'cdObjId', value: cdObjData[0].cdObjId });
    } else {
      const result = (await b.read(req, res, serviceInput)) as CdFxReturn<
        CdObjModel[]
      >;
      if (!result.state || !result.data || !result.data) {
        pl.cdObjId = -1;
      } else {
        pl.cdObjId = result.data[0].cdObjId;
      }
    }

    // get consumer
    // const consumerModel = ConsumerModel;
    let serviceInputCdObj: IServiceInput<ConsumerModel> = {
      serviceModel: ConsumerModel,
      cmd: {
        action: 'find',
        query: {
          select: ['consumerId'],
          where: { consumerGuid: pl.consumerGuid },
        },
      },
      dSource: this.defaultDs,
    };
    // serviceInput.serviceModel = ConsumerModel;
    // serviceInput.cmd.query = {
    //   select: ['consumerId'],
    //   where: { consumerGuid: pl.consumerGuid },
    // };
    const bConsumer = new BaseService<ConsumerModel>();
    if (req) {
      const consumerData: ConsumerModel[] = (await bConsumer.read(
        req,
        res,
        serviceInputCdObj,
      )) as ConsumerModel[];
      console.log('ConsumerResourceService::beforeCreate::validateCreate()/03');
      this.b.setPlData(req, {
        key: 'consumerId',
        value: consumerData[0].consumerId,
      });
    }

    return true;
  }

  // async read(req, res, serviceInput: IServiceInput<ConsumerResourceModel>): Promise<any> {
  //   //
  // }

  // update(req: any, res: any) {
  //   // console.log('ConsumerResourceService::update()/01');
  //   let q = this.b.getQuery(req);
  //   q = this.beforeUpdate(q);
  //   const serviceInput = {
  //     serviceModel: ConsumerResourceModel,
  //     docName: 'ConsumerResourceService::update',
  //     cmd: {
  //       action: 'update',
  //       query: q,
  //     },
  //     dSource: this.defaultDs,
  //   };
  //   // console.log('ConsumerResourceService::update()/02')
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
    if (q.update.consumerResourceEnabled === '') {
      q.update.consumerResourceEnabled = null;
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

  async validateCreate(req, res, pl: ConsumerResourceModel) {
    console.log('moduleman/ConsumerResourceService::validateCreate()/01');
    const svSess = new SessionService();
    ///////////////////////////////////////////////////////////////////
    // 1. Validate against duplication
    // const params = {
    //   controllerInstance: this,
    //   model: ConsumerResourceModel,
    // };
    // let serviceInput: IServiceInput<ConsumerResourceModel> = {
    //   serviceModel: ConsumerResourceModel,
    //   cmd: {
    //     action: 'find',
    //     query: {
    //       select: ['consumerId'],
    //       where: { consumerGuid: pl.consumerGuid },
    //     },
    //   },
    //   dSource: this.defaultDs,
    // };

    const params: any = {
      controllerInstance: this,
      model: ConsumerResourceModel,
    };
    this.b.i.code = 'ConsumerResourceService::validateCreate';
    let ret = false;
    if (await this.b.validateUnique(req, res, params)) {
      console.log('moduleman/ConsumerResourceService::validateCreate()/02');
      if (await this.b.validateRequired(req, res, this.cRules)) {
        console.log('moduleman/ConsumerResourceService::validateCreate()/03');
        ret = true;
      } else {
        console.log('moduleman/ConsumerResourceService::validateCreate()/04');
        ret = false;
        this.b.i.app_msg = `the required fields ${this.b.isInvalidFields.join(', ')} is missing`;
        this.b.err.push(this.b.i.app_msg);
        this.b.setAppState(false, this.b.i, svSess.sessResp);
      }
    } else {
      console.log('moduleman/ConsumerResourceService::validateCreate()/05');
      ret = false;
      this.b.i.app_msg = `duplicate for ${this.cRules.noDuplicate.join(', ')} is not allowed`;
      this.b.err.push(this.b.i.app_msg);
      this.b.setAppState(false, this.b.i, svSess.sessResp);
    }
    console.log('moduleman/ConsumerResourceService::validateCreate()/06');
    const b = new BaseService<ConsumerModel>();
    if (req) {
      ///////////////////////////////////////////////////////////////////
      // 2. confirm the cdObjTypeId referenced exists
      pl = await this.b.getPlData(req);
    }

    //////////////////////////////////////////////////////////////////////////
    // 3. confirm the consumerId referenced exists
    if ('consumerGuid' in pl) {
      console.log('moduleman/ConsumerResourceService::validateCreate()/12');
      console.log(
        'moduleman/ConsumerResourceService::validateCreate()/pl:',
        pl,
      );
      const serviceInput: IServiceInput<ConsumerModel> = {
        serviceModel: ConsumerModel,
        docName: 'ConsumerResourceService::validateCreate',
        cmd: {
          action: 'find',
          query: { where: { consumerGuid: pl.consumerGuid } },
        },
        dSource: this.defaultDs,
      };
      console.log(
        'moduleman/ConsumerResourceService::validateCreate()/serviceInput:',
        JSON.stringify(serviceInput),
      );
      const r: any = await b.read(req, res, serviceInput);
      console.log('moduleman/ConsumerResourceService::validateCreate()/r:', r);
      if (r.length > 0) {
        console.log('moduleman/ConsumerResourceService::validateCreate()/13');
        ret = true;
      } else {
        console.log('moduleman/ConsumerResourceService::validateCreate()/14');
        ret = false;
        this.b.i.app_msg = `consumer reference is invalid`;
        this.b.err.push(this.b.i.app_msg);
        this.b.setAppState(false, this.b.i, svSess.sessResp);
      }
    } else {
      console.log('moduleman/ConsumerResourceService::validateCreate()/15');
      // this.b.i.app_msg = `parentModuleGuid is missing in payload`;
      // this.b.err.push(this.b.i.app_msg);
      //////////////////
      this.b.i.app_msg = `consumerGuid is missing in payload`;
      this.b.err.push(this.b.i.app_msg);
      this.b.setAppState(false, this.b.i, svSess.sessResp);
    }
    // //////////////////////////////////////////////////////////////////////////
    // 4. confirm the objGuid referenced exists
    if ('cdObjGuid' in pl) {
      console.log('moduleman/ConsumerResourceService::validateCreate()/16');
      console.log(
        'moduleman/ConsumerResourceService::validateCreate()/pl:',
        pl,
      );
      const serviceInput = {
        serviceModel: CdObjModel,
        docName: 'ConsumerResourceService::validateCreate',
        cmd: {
          action: 'find',
          query: { where: { cdObjGuid: pl.cdObjGuid } },
        },
        dSource: this.defaultDs,
      };
      console.log(
        'moduleman/ConsumerResourceService::validateCreate()/serviceInput:',
        JSON.stringify(serviceInput),
      );
      const r: any = await this.b.read(req, res, serviceInput);
      console.log('moduleman/ConsumerResourceService::validateCreate()/r:', r);
      if (r.length > 0) {
        console.log('moduleman/ConsumerResourceService::validateCreate()/17');
        ret = true;
      } else {
        console.log('moduleman/ConsumerResourceService::validateCreate()/18');
        ret = false;
        this.b.i.app_msg = `cd-obj reference is invalid`;
        this.b.err.push(this.b.i.app_msg);
        this.b.setAppState(false, this.b.i, svSess.sessResp);
      }
    } else {
      console.log('moduleman/ConsumerResourceService::validateCreate()/19');
      // this.b.i.app_msg = `parentModuleGuid is missing in payload`;
      // this.b.err.push(this.b.i.app_msg);
      //////////////////
      this.b.i.app_msg = `cdObjGuid is missing in payload`;
      this.b.err.push(this.b.i.app_msg);
      this.b.setAppState(false, this.b.i, svSess.sessResp);
    }

    // //////////////////////////////////////////////////////////////////////////
    console.log('ConsumerResourceService::getConsumerResource/20');
    if (this.b.err.length > 0) {
      console.log('moduleman/ConsumerResourceService::validateCreate()/21');
      ret = false;
    }
    return ret;
  }

  async getConsumerResource(req: any, res: any) {
    const q = this.b.getQuery(req);
    console.log('ConsumerResourceService::getConsumerResource/f:', q);
    const serviceInput = {
      serviceModel: ConsumerResourceModel,
      docName: 'ConsumerResourceService::getConsumerResource$',
      cmd: {
        action: 'find',
        query: q,
      },
      dSource: this.defaultDs,
    };
    try {
      this.b.read$(req, res, serviceInput).subscribe((r) => {
        console.log('ConsumerResourceService::read$()/r:', r);
        this.b.i.code = 'ConsumerResourceController::Get';
        const svSess = new SessionService();
        svSess.sessResp.cd_token = req.post.dat.token;
        svSess.sessResp.ttl = svSess.getTtl();
        this.b.setAppState(true, this.b.i, svSess.sessResp);
        this.b.cdResp.data = r;
        this.b.respond(req, res);
      });
    } catch (e) {
      console.log('ConsumerResourceService::read$()/e:', e);
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

  async getConsumerResourceType(req: any, res: any) {
    const q = this.b.getQuery(req);
    console.log('ConsumerResourceService::getConsumerResource/f:', q);
    const serviceInput = {
      serviceModel: ConsumerResourceTypeModel,
      docName: 'ConsumerResourceService::getConsumerResourceType$',
      cmd: {
        action: 'find',
        query: q,
      },
      dSource: this.defaultDs,
    };
    try {
      this.b.read$(req, res, serviceInput).subscribe((r) => {
        console.log('ConsumerResourceService::read$()/r:', r);
        this.b.i.code = 'ConsumerResourceController::Get';
        const svSess = new SessionService();
        svSess.sessResp.cd_token = req.post.dat.token;
        svSess.sessResp.ttl = svSess.getTtl();
        this.b.setAppState(true, this.b.i, svSess.sessResp);
        this.b.cdResp.data = r;
        this.b.respond(req, res);
      });
    } catch (e) {
      console.log('ConsumerResourceService::read$()/e:', e);
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

  getConsumerResourceCount(req: any, res: any) {
    const q = this.b.getQuery(req);
    console.log('ConsumerResourceService::getConsumerResourceCount/q:', q);
    const serviceInput = {
      serviceModel: ConsumerResourceViewModel,
      docName: 'ConsumerResourceService::getConsumerResourceCount$',
      cmd: {
        action: 'find',
        query: q,
      },
      dSource: this.defaultDs,
    };
    this.b.readCount$(req, res, serviceInput).subscribe((r) => {
      this.b.i.code = 'ConsumerResourceController::Get';
      const svSess = new SessionService();
      svSess.sessResp.cd_token = req.post.dat.token;
      svSess.sessResp.ttl = svSess.getTtl();
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = r;
      this.b.respond(req, res);
    });
  }

  getConsumerResourceQB(req: any, res: any) {
    console.log('ConsumerResourceService::getConsumerResourceQB()/1');
    this.b.entityAdapter.registerMappingFromEntity(ConsumerResourceViewModel);
    const q = this.b.getQuery(req);
    // console.log('MenuService::getModuleCount/q:', q);
    const serviceInput = {
      serviceModel: ConsumerResourceViewModel,
      docName: 'ConsumerResourceService::getConsumerResourceQB',
      cmd: {
        action: 'find',
        query: q,
      },
      dSource: this.defaultDs,
    };

    this.b.readQB$(req, res, serviceInput).subscribe((r) => {
      this.b.i.code = serviceInput.docName;
      const svSess = new SessionService();
      svSess.sessResp.cd_token = req.post.dat.token;
      svSess.sessResp.ttl = svSess.getTtl();
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = r;
      this.b.respond(req, res);
    });
  }

  async getConsumerResourcesMap(req, res): Promise<any> {
    // Initialize the service
    // await this.b.init(req, res);

    const b = new BaseService<ConsumerResourceViewModel>();

    // Register the mapping from the entity to ensure the data is correctly transformed
    b.entityAdapter.registerMappingFromEntity(ConsumerResourceViewModel);

    // Prepare the query to fetch all consumer resources
    const query = b.getQuery(req);

    // Define the service input structure
    const serviceInput: IServiceInput<ConsumerResourceViewModel> = {
      serviceModel: ConsumerResourceViewModel,
      docName: 'ConsumerResourceService::getConsumerResources',
      cmd: {
        action: 'find',
        query: query,
      },
      dSource: this.defaultDs,
    };

    // Fetch data using the base service's readQB method
    const result = await b.readQB(req, res, serviceInput);

    // Transform the flat data structure into a hierarchical structure
    const consumerResourceMap = this.transformToConsumerResourceTree(
      result.items,
    );

    // Set the response data
    this.b.cdResp.data = { consumers: consumerResourceMap };
    this.b.respond(req, res);
  }

  /**
   * Transform the flat list of consumer resources into a hierarchical structure.
   */
  private transformToConsumerResourceTree(
    items: ConsumerResourceViewModel[],
  ): any[] {
    const consumerMap = {};

    items.forEach((item) => {
      // Skip items with undefined consumerGuid
      if (typeof item.consumerGuid === 'undefined') {
        return;
      }
      // Ensure the consumer entry exists in the map
      if (!consumerMap[item.consumerGuid]) {
        consumerMap[item.consumerGuid] = {
          consumerName: item.consumerName,
          consumerGuid: item.consumerGuid,
          consumerId: item.consumerId,
          consumerResourceIcon: item.consumerResourceIcon,
          consumerResourceLink: item.consumerResourceLink,
          resources: [],
        };
      }

      // Add the resource to the consumer's resources array
      consumerMap[item.consumerGuid].resources.push({
        consumerResourceGuid: item.consumerResourceGuid,
        consumerResourceName: item.consumerResourceName,
        cdObjTypeId: item.cdObjTypeId,
        cdObjId: item.cdObjId,
        objGuid: item.objGuid,
        docId: item.docId,
        consumerResourceEnabled: item.consumerResourceEnabled,
        consumerResourceTypeGuid: item.consumerResourceTypeGuid,
        consumerResourceIcon: item.consumerResourceIcon,
        consumerResourceLink: item.consumerResourceLink,
        consumerResourceId: item.consumerResourceId,
        cdObjName: item.cdObjName,
      });
    });

    // Convert the map to an array
    return Object.values(consumerMap);
  }

  getConsumerResourceTypeCount(req: any, res: any) {
    const q = this.b.getQuery(req);
    console.log('ConsumerResourceService::getConsumerResourceCount/q:', q);
    const serviceInput = {
      serviceModel: ConsumerResourceTypeModel,
      docName: 'ConsumerResourceService::getConsumerResourceCount$',
      cmd: {
        action: 'find',
        query: q,
      },
      dSource: this.defaultDs,
    };
    this.b.readCount$(req, res, serviceInput).subscribe((r) => {
      this.b.i.code = 'ConsumerResourceController::Get';
      const svSess = new SessionService();
      svSess.sessResp.cd_token = req.post.dat.token;
      svSess.sessResp.ttl = svSess.getTtl();
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = r;
      this.b.respond(req, res);
    });
  }

  async delete(
    req: any,
    res: any,
    serviceInput: IServiceInput<ConsumerResourceModel>,
  ): Promise<CdFxReturn<unknown>> {
    const q = this.b.getQuery(req);
    console.log('ConsumerResourceService::delete()/q:', q);
    if (!serviceInput) {
      serviceInput = {
        serviceModel: ConsumerResourceModel,
        docName: 'ConsumerResourceService::delete',
        cmd: {
          action: 'delete',
          query: q,
        },
        dSource: this.defaultDs,
      };
    }

    try {
      const result = await this.b.delete(req, res, serviceInput);
      this.b.cdResp.data = result;
      this.b.respond(req, res);

      // Ensure the return value is always of type CdFxReturn<unknown>
      if (result && typeof result === 'object' && 'state' in result) {
        return result as CdFxReturn<unknown>;
      } else {
        return {
          data: result ?? null,
          state: true,
          message: null,
        } as CdFxReturn<unknown>;
      }
    } catch (error) {
      console.error('ConsumerResourceService::delete()/error:', error);
      throw error;
    }
  }
}
