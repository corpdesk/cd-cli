import { Observable, of, forkJoin, iif, from, filter } from 'rxjs';
import { map, mergeMap } from 'rxjs';
import { BaseService } from '../../base/base.service.js';
import { SessionService } from '../../user/services/session.service.js';
import { UserService } from '../../user/services/user.service.js';
// import { CalendarService } from '../../scheduler/services/calendar.services.js';
import { ConsumerService } from './consumer.service.js';
import {
  CdFxReturn,
  CreateIParams,
  IAclCtx,
  ICdRequest,
  IQuery,
  IRespInfo,
  IServiceInput,
  ISessionDataExt,
  ObjectItem,
} from '../../base/i-base.js';
import { Logging } from '../../base/winston.log.js';
import { CdObjModel } from '../models/cd-obj.model.js';
import { CdObjService } from './cd-obj.service.js';
import { GroupMemberModel } from '../../user/models/group-member.model.js';
import { SessionModel } from '../../user/models/session.model.js';
import { ModuleModel } from '../models/module.model.js';
import { GenericService } from '../../base/generic-service.js';
import { DocModel } from '../models/doc.model.js';
import { GroupService } from '../../user/services/group.service.js';
import { GroupMemberService } from '../../user/services/group-member.service.js';
import { MemoService } from '../../cd-comm/services/memo.service.js';
import { MenuService } from './menu.service.js';
import { NotificationService } from '../../cd-comm/services/notification.service.js';
import { AclService } from './acl.service.js';
import { MenuModel } from '../models/menu.model.js';
import { ConsumerResourceModel } from '../models/consumer-resource.model.js';
import { GroupModel } from '../../user/models/group.model.js';
import { ConsumerResourceService } from './consumer-resource.service.js';
import { ConsumerModel } from '../models/consumer.model.js';
import { ModuleViewModel } from '../models/module-view.model.js';

export class ModuleService extends GenericService<ModuleModel> {
  logger: Logging;
  cdToken;
  serviceModel;
  b: BaseService<ModuleModel>;
  svSess: SessionService = new SessionService();
  svUser: UserService = new UserService();
  svGroup!: GroupService;
  svGroupMember!: GroupMemberService;
  svMemo!: MemoService;
  svMenu!: MenuService;
  svNotif!: NotificationService;
  // svCalnd: CalendarService = new CalendarService();
  svConsumer: ConsumerService = new ConsumerService();
  svAcl!: AclService;
  consumerGuid!: string;
  sessDataExt!: ISessionDataExt | null;
  retMenuCollection: MenuModel[] = [];

  newModule: ModuleModel = new ModuleModel();
  newModCdObj: CdObjModel | boolean = false;
  newModConsumRecource!: ConsumerResourceModel | boolean;
  newGroup;
  newModMenus: MenuModel[] | boolean = false;
  moduleGroupMembers: GroupMemberModel | boolean = false;

  /*
   * create rules
   */
  cRules: any = {
    required: ['moduleName', 'isSysModule'],
    noDuplicate: ['moduleName'],
  };

  constructor() {
    super(ModuleModel);
    this.b = new BaseService();
    this.logger = new Logging();
    this.serviceModel = new ModuleModel();
    // this.svSess = new SessionService();
    // this.svConsumer = new ConsumerService();
  }

  /**
     *
     * {
          "ctx": "Sys",
          "m": "Moduleman",
          "c": "Module",
          "a": "Create",
          "dat": {
              "f_vals": [
                  {
                      "data": {
                          "moduleName": "xxx30102021",
                          "isSysModule": false
                      }
                  }
              ],
              "token": "3ffd785f-e885-4d37-addf-0e24379af338"
          },
          "args": {}
      }
     */
  // async create(req, res, serviceInput:IServiceInput<ModuleModel>): Promise<void> {
  //   const svSess = new SessionService();
  //   if (await this.validateCreate(req, res)) {
  //     await this.beforeCreate(req, res);
  //     const serviceInput = {
  //       serviceInstance: this,
  //       serviceModel: ModuleModel,
  //       serviceModelInstance: this.serviceModel,
  //       docName: 'Create Module',
  //       dSource: this.defaultDs,
  //     };
  //     this.newModule = await this.b.create(req, res, serviceInput);
  //     const respData = this.afterCreate(req, res);
  //     this.b.i.app_msg = 'new module created';
  //     this.b.setAppState(true, this.b.i, svSess.sessResp);
  //     this.b.cdResp.data = await respData;
  //     const r = await this.b.respond(req, res);
  //   } else {
  //     svSess.sessResp.cd_token = req.post.dat.token;
  //     const r = await this.b.respond(req, res);
  //   }
  // }

  async validateCreate(req: any, res: any) {
    // const params = {
    //   serviceInstance: this,
    //   model: ModuleModel,
    // }
    const serviceInput: IServiceInput<ModuleModel> = {
      serviceInstance: this,
      serviceModel: ModuleModel,
      docName: `Validate ModuleModel`,
      dSource: this.defaultDs,
      data: {},
    };
    this.b.i.code = 'ModuleService::validateCreate';
    if (await this.b.validateUnique(req, res, serviceInput)) {
      if (await this.b.validateRequired(req, res, this.cRules)) {
        return true;
      } else {
        this.b.i.app_msg = `you must provide ${this.cRules.required.join(', ')}`;
        this.b.err.push(this.b.i.app_msg);
        return false;
      }
    } else {
      this.b.i.app_msg = `duplication of ${this.cRules.noDuplicate.join(', ')} not allowed`;
      this.b.err.push(this.b.i.app_msg);
      return false;
    }
  }

  async beforeCreate(req, res): Promise<boolean> {
    const svSess = new SessionService();
    this.sessDataExt = await svSess.getSessionDataExt(req, res);
    this.b.setPlData(req, { key: 'moduleGuid', value: this.b.getGuid() });
    this.b.setPlData(req, { key: 'moduleEnabled', value: true });
    return true;
  }

  /**
   *
   * afterCreate is used to automate post module creation which includes:
   *  - registration of module group
   *  - registration of the module as a cd-object
   *  - registration of the module as consumer-resource to the current
   *  - registration of module menu items (if requested for)
   *
   * @param req
   * @param res
   * @param createResult
   * @returns
   */
  async afterCreate(req, res): Promise<any> {
    console.log('ModuleService::afterCreate()/01');
    console.log('ModuleService::afterCreate()/this.newModule:', this.newModule);
    console.log(
      'ModuleService::afterCreate()/this.sessDataExt:',
      this.sessDataExt,
    );
    /**
     * create a new group for the module
     */
    this.newGroup = await this.registerModuleGroup(req, res);
    console.log('ModuleService::afterCreate()/this.newGroup:', this.newGroup);
    /**
     * update new module with new group data
     */
    let updatedModule: any;
    if (this.newGroup) {
      updatedModule = await this.setGroupId(req, res);
      console.log('ModuleService::afterCreate()/updatedModule:', updatedModule);
    } else {
      // Handle the case where newGroup is null, if needed
    }

    /**
     * let the current user to join the group
     */
    this.moduleGroupMembers = await this.joinModuleGroup(req, res);

    /**
     * create new cdObje
     */
    if ('cdObj' in req.post.dat.f_vals[0]) {
      console.log('ModuleService::afterCreate()/cdOb is available');
      this.newModCdObj = await this.registerModCdObj(req, res);
      console.log(
        'ModuleService::afterCreate()/this.newModCdObj:',
        this.newModCdObj,
      );
    } else {
      // handle if cdObj component is not supplied
    }

    /**
     * register the module as a consumer resource
     */
    this.newModConsumRecource = await this.registerModConsumRecource(req, res);
    console.log(
      'ModuleService::afterCreate()/this.newModConsumRecource:',
      this.newModConsumRecource,
    );

    /**
     * create module menus
     */

    if (req) {
      this.newModMenus = (await this.registerModMenu(req, res)) as MenuModel[];
    } else {
      const result = (await this.registerModMenu(req, res)) as CdFxReturn<
        MenuModel[]
      >;
      if (!result.state || !result.data) {
        this.newModMenus = [];
      }
      this.newModMenus = result.data!;
    }

    console.log(
      'ModuleService::afterCreate()/this.newModMenus:',
      await this.newModMenus,
    );

    /**
     * extract the latest state of new module and return to client
     */
    const serviceInput: IServiceInput<ModuleModel> = {
      serviceInstance: this,
      serviceModel: ModuleModel,
      docName: 'ModuleService::afterCreate',
      cmd: {
        action: 'find',
        query: { where: { moduleId: this.newModule.moduleId } },
      },
      dSource: this.defaultDs,
    };
    console.log('ModuleService::afterCreate/serviceInput:', serviceInput);
    const ret = await this.b.read(req, res, serviceInput);
    console.log('ModuleService::afterCreate/ret:', ret);
    return await {
      moduleData: ret,
      moduleGroup: this.newGroup,
      moduleCdObj: this.newModCdObj,
      moduleConsumerResource: this.newModConsumRecource,
      moduleMenu: this.newModMenus,
    };
    // return ret;
  }

  async setGroupId(req: any, res: any) {
    console.log('ModuleService::setGroupId/01');
    // const groupData: GroupModel;
    if (this.newModule && this.newModule) {
      // const g = groupData;
      const q = {
        update: {
          groupGuid: this.newModule.moduleGuid,
          moduleGuid: this.newModule.moduleGuid,
        },
        where: {
          moduleId: this.newModule.moduleId,
        },
      };
      console.log('ModuleService::setGroupId/q:', q);
      return await this.updateI(req, res, q);
    } else {
      const e = 'could not get invoice data';
      this.b.err.push(e);
      const i = {
        messages: this.b.err,
        code: 'ModuleService:setGroupId',
        app_msg: '',
      };
      await this.b.serviceErr(req, res, e, i.code);
      await this.b.respond(req, res);
    }
  }

  async registerModuleGroup(req: any, res: any) {
    const svGroup = new GroupService();

    /**
     *  - confirm bill is not double entry on moduleGroup
     *  - create or update accts/moduleGroup while creating a bill
     */
    const moduleGroup: GroupModel = {
      groupGuid: this.newModule.moduleGuid,
      groupName: this.newModule.moduleName ?? '',
      groupOwnerId: this.sessDataExt?.currentUser.userId!,
      groupTypeId: 2,
      groupEnabled: true,
      moduleGuid: this.newModule.moduleGuid!,
      companyId: this.sessDataExt?.currentCompany.companyId!, // this.b.sessDataExt.currentCompany.companyId
    };
    console.log(
      'ModuleService::registerModuleGroup()/moduleGroup:',
      moduleGroup,
    );
    const si: IServiceInput<GroupModel> = {
      serviceInstance: svGroup,
      serviceModel: GroupModel,
      serviceModelInstance: svGroup.serviceModel,
      docName: 'ModuleService/registerModuleGroup',
      dSource: this.defaultDs,
    };
    const createIParams: CreateIParams<GroupModel> = {
      serviceInput: si,
      controllerData: moduleGroup,
    };
    console.log('ModuleService::registerModuleGroup()/02');
    /**
     * create new group from new module data
     */
    return await svGroup.createI(req, res, createIParams);
  }

  async joinModuleGroup(req: any, res: any) {
    const svGroupMember = new GroupMemberService();

    /**
     *  - confirm bill is not double entry on moduleGroup
     *  - create or update accts/moduleGroup while creating a bill
     */
    const moduleMember: GroupMemberModel = {
      userIdMember: this.sessDataExt?.currentUser.userId!,
      memberGuid: this.sessDataExt?.currentUser.userGuid!,
      groupMemberGuid: this.sessDataExt?.currentUser.userGuid,
      memberId: this.sessDataExt?.currentUser.userId,
      groupGuidParent: this.newGroup['groupGuid'],
      cdObjTypeId: 9,
      groupMemberEnabled: true,
      groupIdParent: this.newGroup['groupId'],
    };
    console.log(
      'ModuleService::registerModuleGroup()/moduleMember:',
      moduleMember,
    );
    const si: IServiceInput<GroupMemberModel> = {
      serviceInstance: svGroupMember,
      serviceModel: GroupMemberModel,
      docName: 'ModuleService/joinModuleGroup',
      dSource: this.defaultDs,
    };
    const createIParams: CreateIParams<GroupMemberModel> = {
      serviceInput: si,
      controllerData: moduleMember,
    };
    console.log('ModuleService::joinModuleGroup()/02');
    /**
     * create new group from new module data
     */
    return await svGroupMember.createI(req, res, createIParams);
  }

  async registerModCdObj(req: any, res: any) {
    const svCdObj = new CdObjService();
    const cdObj: CdObjModel = await this.b.getPlData(req, 'cdObj');
    // cd_obj_guid, parent_module_guid(confirmed as file_sys), cd_obj_enabled, obj_guid, obj_id
    cdObj.parentModuleGuid = '48753f8a-b262-471f-b175-1f0ec9e5206d';
    cdObj.objId = this.newModule.moduleId;
    cdObj.objGuid = this.b.getGuid();
    cdObj.cdObjDispName = this.newModule.moduleName;
    cdObj.cdObjEnabled = true;
    cdObj.objGuid = this.newModule.moduleGuid;
    cdObj.objId = this.newModule.moduleId;

    console.log('ModuleService::afterCreate()/cdObj:', cdObj);
    const si = {
      serviceInstance: svCdObj,
      serviceModel: CdObjModel,
      docName: 'ModuleService/registerModCdObj',
      dSource: this.defaultDs,
    };
    const createIParams: CreateIParams<CdObjModel> = {
      serviceInput: si,
      controllerData: cdObj,
    };
    console.log('ModuleService::registerModCdObj()/02');
    /**
     * create new group from new module data
     */
    return await svCdObj.createI(req, res, createIParams);
  }

  async registerModConsumRecource(req: any, res: any) {
    const svConsumerResource = new ConsumerResourceService();
    console.log(
      'MosuleService::registerModConsumRecource()/this.b.sessDataExt:',
      this.sessDataExt,
    );
    // console.log("MosuleService::registerModConsumRecource()/this.newModConsumRecource:", this.newModConsumRecource)
    const consumerModuleResource: ConsumerResourceModel = {
      consumerId: this.sessDataExt?.currentConsumer.consumerId,
      consumerGuid: this.sessDataExt?.currentConsumer.consumerGuid,
      consumerResourceGuid: this.b.getGuid(),
      consumerResourceName: this.newModule.moduleName,
      consumerResourceLink: 'javascript: void(0);',
      consumerResourceEnabled: true,
      objId: this.newModule.moduleId,
      objGuid: this.newModule.moduleGuid,
      cdObjTypeId: 3,
      cdObjId: this.newModCdObj['cdObjId'],
      cdObjGuid: this.newModCdObj['cdObjGuid'],
    };
    console.log(
      'ModuleService::registerModConsumRecource()/consumerModuleResource:',
      consumerModuleResource,
    );
    const si: IServiceInput<ConsumerResourceModel> = {
      serviceInstance: svConsumerResource,
      serviceModel: ConsumerResourceModel,
      serviceModelInstance: svConsumerResource.serviceModel,
      docName: 'ModuleService/registerModConsumRecource',
      dSource: this.defaultDs,
    };
    const createIParams: CreateIParams<ConsumerResourceModel> = {
      serviceInput: si,
      controllerData: consumerModuleResource,
    };
    console.log('ModuleService::registerModConsumRecource()/02');
    /**
     * create new group from new module data
     */
    return svConsumerResource.createI(req, res, createIParams);
  }

  async registerModMenu(req: any, res: any) {
    console.log(
      'ModuleService::registerModMenu()/this.sessDataExt:',
      this.sessDataExt,
    );
    const svMenu = new MenuService();
    const svCdObj = new CdObjService();

    if ('moduleMenu' in req.post.dat.f_vals[0]) {
      /**
       * extract requested menu data
       */
      const moduleMenu: MenuModel[] = await this.b.getPlData(req, 'moduleMenu');
      console.log('ModuleService::registerModMenu()/moduleMenu:', moduleMenu);

      // Using for...of instead of forEach to handle async properly
      for (let i = 0; i < moduleMenu.length; i++) {
        const menuItem = moduleMenu[i];
        console.log('ModuleService::registerModMenu()/i:', i);
        console.log('ModuleService::registerModMenu()/menuItem:', menuItem);

        /**
         * register cdObj and use the data to fill menu data
         */
        const cdObj: CdObjModel = {
          cdObjName: menuItem.menuName ?? '',
          cdObjTypeGuid: '574c73a6-7e5b-40fe-aa89-e52ce1640f42', // menu_item
          parentModuleGuid: this.newModule.moduleGuid,
          cdObjDispName: menuItem.menuName,
          icon: 'ri-circle-lines',
          objId: this.newModule.moduleId,
          cdObjEnabled: true,
          objGuid: this.newModule.moduleGuid,
        };
        const moduleMenuCdObj: CdObjModel | boolean =
          await this.registerModCdObj(req, res);
        console.log(
          'ModuleService::registerModMenu()/this.newModule:',
          this.newModule,
        );
        console.log(
          'ModuleService::registerModMenu()/moduleMenuCdObj:',
          moduleMenuCdObj,
        );

        /**
         * prepare and save menu data
         */
        console.log('ModuleService::registerModMenu()1/i:', i);
        console.log(
          'ModuleService::registerModMenu()/this.retMenuCollection:',
          this.retMenuCollection,
        );
        let menuParentId: number | undefined = 0;

        if (i === 0) {
          console.log(
            'ModuleService::registerModMenu()/i=0, setting menuParentId to -1:',
          );
          menuParentId = -1; // First item as parent
        } else {
          console.log('ModuleService::registerModMenu()2/i:', i);
          console.log('ModuleService::registerModMenu()/i>0:');
          if (this.retMenuCollection.length > 0) {
            console.log('ModuleService::registerModMenu()3/i:', i);
            console.log(
              'ModuleService::registerModMenu()/i>0 && this.retMenuCollection.length > 0 :',
            );
            const rootMenu = this.retMenuCollection.find(
              (menu) => menu.menuParentId === -1,
            );
            console.log('ModuleService::registerModMenu()/rootMenu:', rootMenu);
            menuParentId = rootMenu?.menuId;
            console.log(
              'ModuleService::registerModMenu()/menuParentId:',
              menuParentId,
            );
          } else {
            console.log(
              'ModuleService::registerModMenu()/problem with insertion to retMenuCollection:',
            );
            this.b.i.app_msg = `problem adding menu item:${menuItem.menuName}`;
            this.b.err.push(this.b.i.app_msg);
          }
        }

        console.log('ModuleService::registerModMenu()4/i:', i);
        console.log(
          'ModuleService::registerModMenu()/menuParentId:',
          menuParentId,
        );
        const newMenuItem: MenuModel = {
          menuName: menuItem.menuName,
          menuLable: menuItem.menuName,
          menuGuid: this.b.getGuid(),
          menuActionId: moduleMenuCdObj['cdObjId'],
          menuParentId: menuParentId!,
          moduleId: this.newModule.moduleId!,
          path: menuItem.path,
          menuIcon: menuItem.menuIcon,
          iconType: menuItem.iconType,
          cdObjId: moduleMenuCdObj['cdObjId'],
          menuEnabled: true,
        };

        console.log('ModuleService::registerModMenu()5/i:', i);
        console.log(
          'ModuleService::registerModMenu()/newMenuItem:',
          newMenuItem,
        );

        const si: IServiceInput<MenuModel> = {
          serviceInstance: svMenu,
          serviceModel: MenuModel,
          serviceModelInstance: svMenu.serviceModel,
          docName: 'ModuleService/registerModMenu',
          dSource: this.defaultDs,
        };

        const createIParams: CreateIParams<MenuModel> = {
          serviceInput: si,
          controllerData: newMenuItem,
        };

        /**
         * create new group from new module data
         */
        console.log(
          'ModuleService::registerModMenu()/this.retMenuCollection...before:',
          this.retMenuCollection,
        );
        const newMenuRet: MenuModel = await svMenu.createI(
          req,
          res,
          createIParams,
        );
        console.log('ModuleService::registerModMenu()/newMenuRet:', newMenuRet);
        // this.retMenuCollection.push(newMenuRet);
        this.retMenuCollection.push({ ...newMenuRet });
        console.log(
          'ModuleService::registerModMenu()/this.retMenuCollection...after:',
          this.retMenuCollection,
        );

        /**
         * update cdObj for objId and objGuid with menuItemId, and menuItemGuid
         */
        const q = {
          update: {
            objId: newMenuRet.menuId,
            objGuid: newMenuRet.menuGuid,
          },
          where: {
            cdObjId: moduleMenuCdObj['cdObjId'],
          },
        };
        console.log('ModuleService::setGroupId/createIParams:', createIParams);
        const siCdObj: IServiceInput<CdObjModel> = {
          serviceModel: CdObjModel,
          docName: 'ModuleService/registerModMenu',
          dSource: this.defaultDs,
        };

        const createIParamsCdObj: CreateIParams<CdObjModel> = {
          serviceInput: siCdObj,
          controllerData: newMenuItem,
        };
        const updatedCdObj = svCdObj.updateI(req, res, createIParamsCdObj);

        console.log(
          'ModuleService::registerModMenu()/this.retMenuCollection.length:',
          this.retMenuCollection.length,
        );
      }

      console.log(
        'ModuleService::registerModMenu()/this.retMenuCollection:',
        this.retMenuCollection,
      );
    }

    const serviceInput: IServiceInput<MenuModel> = {
      serviceInstance: svMenu,
      serviceModel: MenuModel,
      docName: 'ModuleService::registerModMenu',
      cmd: {
        action: 'find',
        query: { where: { moduleId: this.newModule.moduleId } },
      },
      dSource: this.defaultDs,
    };

    const b = new BaseService<MenuModel>();

    /**
     * if cd-api
     */
    if (req) {
      return await b.read(req, res, serviceInput);
    } else {
      /**
       * if cd-cli
       */
      const result = (await b.read(req, res, serviceInput)) as CdFxReturn<
        MenuModel[]
      >;
      if (!result.state || !result.data) {
        return [];
      }
      return result.data as MenuModel[];
    }
  }

  async createI(
    req,
    res,
    createIParams: CreateIParams<ModuleModel>,
  ): Promise<ModuleModel | boolean> {
    console.log('ModuleService::create()/createIParams:', createIParams);
    const newModule = await this.b.createI(req, res, createIParams);
    // const ret = await this.afterCreate(req, res, newModule)
    return newModule;
  }

  /**
   * The function of this module is to return Corpdesk facilities that are available to a given user.
   * This is applicable before and after login.
   * Before login the current user is considered anonimous and has a userName of 'anon'.
   * When login is successfull the current user aquires the userName based on user registered values.
   * This method uses getAclModule$ to fetch allowedModules$.
   * allowedModules$ is a set of modules that the requesting user is allowed access.
   * allowedModules$ is generated using this.getAclModule$(req, res, { currentUser: cUser, consumerGuid: cguid });
   * These modules are then used to generate menu data.
   * To fetch menu, this method calls this.svMenu.getAclMenu$(req, res, { modules$: allowedModules$, modulesCount: am.length }) from MenuService.
   * In all these proceses, AclService is consulted to facilitate privilage access logics.
   *
   * @param req // request handle from the api client
   * @param res // response handle
   * @param cUser // the handle for the current user accessing the api
   * @returns:
   * Even through the return is currently marked as any, the return format is curretly an object of the structure below:
   * {
   *      consumer: ConsumerModel, // request to corpdesk api are made in the context of a given consumer organization entity.
   *      menuData: MenuItem[], // unlike MenuModel, it has an attribute children: MenuItem[],
   *      userData: UserModel // object of current user
   * }
   *
   */
  // getModulesUserData_$(req, res, cUser: ModuleModel): Observable<any> {
  //     this.b.logTimeStamp('ModuleService::getModulesUserData$/01')
  //     this.svSess = new SessionService();
  //     this.svUser = new UserService();
  //     this.svMemo = new MemoService();
  //     this.svNotif = new NotificationService();
  //     this.svCalnd = new CalendarService();
  //     this.svGroup = new GroupService();
  //     this.svGroupMember = new GroupMemberService();
  //     this.svConsumer = new ConsumerService();
  //     this.svMenu = new MenuService();
  //     this.svAcl = new AclService();

  //     /**
  //      * extract the request consumer guid
  //      */
  //     const cguid = this.svConsumer.getConsumerGuid(req);
  //     // this.logger.logInfo("ModuleService::getModulesUserData$/02/cguid:", cguid)

  //     /**
  //      * use consumer guid to get the associated consumer
  //      */
  //     const clientConsumer$ = this.svConsumer.getConsumerByGuid$(req, res, cguid);
  //     const allowedModules$ = this.getAclModule$(req, res, { currentUser: cUser, consumerGuid: cguid });
  //     const menuData$ = allowedModules$
  //         .pipe(
  //             mergeMap(
  //                 (am: any[]) => iif(
  //                     () => {
  //                         this.logger.logInfo('ModuleService::getModulesUserData$/am:', am)
  //                         return am.length > 0
  //                     },
  //                     this.svMenu.getAclMenu$(req, res, { modules$: allowedModules$, modulesCount: am.length }),
  //                     []
  //                 )
  //             )
  //         )
  //     /**
  //      * Add more user data
  //      * - notifications
  //      * - memos
  //      * - calender
  //      */
  //     // const acoid = this.svUser.getUserActiveCo();
  //     // const notifdata = this.svNotif.getsvNotifications(cuid);
  //     // const notifsumm = this.svNotif.getsvNotifications_summary(cuid);
  //     // const memosumm = this.svMemo.getMemoSummary(cuid);
  //     // const calndsumm = this.svCalnd.getCalendarSumm(cuid);
  //     // const userContacts = this.svUser.getContacts(cuid);
  //     // const userPals = this.svGroupMember.getPals(cuid);

  //     const result$ = forkJoin({
  //         consumer: clientConsumer$,
  //         menuData: menuData$
  //         // .pipe(
  //         //     map(menu => menu.flat())
  //         //   )
  //         ,
  //         userData: of(cUser),
  //         /////////////////////
  //         // OPTIONAL ADDITIVES:
  //         // notifData: notifdata,
  //         // notifSumm: notifsumm,
  //         // memoSumm: memosumm,
  //         // calndSumm: calndsumm,
  //         // contacts: userContacts,
  //         // pals: userPals,
  //         // aCoid: acoid,
  //     });
  //     return result$;
  // }

  // getModulesUserData$(req, res, cUser: ModuleModel): Observable<any> {
  //     this.b.logTimeStamp('ModuleService::getModulesUserData$/01');

  //     // Initialize necessary services
  //     this.svSess = new SessionService();
  //     this.svUser = new UserService();
  //     this.svMemo = new MemoService();
  //     this.svNotif = new NotificationService();
  //     this.svCalnd = new CalendarService();
  //     this.svGroup = new GroupService();
  //     this.svGroupMember = new GroupMemberService();
  //     this.svConsumer = new ConsumerService();
  //     this.svMenu = new MenuService();
  //     this.svAcl = new AclService();

  //     // Use 'from()' to convert the async method to an Observable
  //     return from(this.svSess.getSessionDataExt(req, res)).pipe(
  //         mergeMap((sessionDataExt:ISessionDataExt) => {
  //             // After retrieving session data, proceed with other logic
  //             this.sessDataExt = sessionDataExt;
  //             console.log("ModuleService::getModulesUserData$()/sessionDataExt:", sessionDataExt);

  //             /**
  //              * Extract the request consumer guid
  //              */
  //             const cguid = this.svConsumer.getConsumerGuid(req);

  //             /**
  //              * Use consumer guid to get the associated consumer
  //              */
  //             // const clientConsumer$ = this.svConsumer.getConsumerByGuid$(req, res, cguid);
  //             /**
  //              * derive allowed modules
  //              */
  //             const allowedModules$ = this.getAclModule$(req, res, { currentUser: cUser, consumerGuid: cguid });
  //             /**
  //              * use allowed modules to process menu generation
  //              */
  //             const menuData$ = allowedModules$.pipe(
  //                 mergeMap((am: any[]) =>
  //                     iif(
  //                         () => {
  //                             this.logger.logInfo('ModuleService::getModulesUserData$/am:', am);
  //                             return am.length > 0;
  //                         },
  //                         this.svMenu.getAclMenu$(req, res, { modules$: allowedModules$, modulesCount: am.length }),
  //                         []
  //                     )
  //                 )
  //             );

  //             /**
  //              * use forkJoin to prepare Observable results containing various categories of data in an object.
  //              * Current categories include:
  //              *      - consumer // the current organization/company that runs Corpdesk
  //              *      - menuData // hierarchial menu for modules where current user have access
  //              *      - userData // current user
  //              *      - note from the comments below that there are several options for future categories of data to integrate.
  //              *      - The design is also to have possibilities of configuring which data is included or not or automate based on prevailing circumstances
  //              */
  //             const result$ = forkJoin({
  //                 consumer: of(sessionDataExt.currentConsumer),
  //                 menuData: menuData$,
  //                 userData: of(cUser),
  //                 /////////////////////
  //                 // OPTIONAL ADDITIVES:
  //                 // notifData: notifdata,
  //                 // notifSumm: notifsumm,
  //                 // memoSumm: memosumm,
  //                 // calndSumm: calndsumm,
  //                 // contacts: userContacts,
  //                 // pals: userPals,
  //                 // aCoid: acoid,
  //             });

  //             // Return the forkJoin result as an Observable
  //             return result$;
  //         })
  //     );
  // }

  getModulesUserData$(req, res, sessData: SessionModel): Observable<any> {
    // this.b.logTimeStamp('ModuleService::getModulesUserData$/01');
    console.log('ModuleService::getModulesUserData$/sessData:', sessData);
    console.log(
      'ModuleService::getModulesUserData$/req.post.dat.token:',
      req.post.dat.token,
    );

    // Initialize necessary services
    this.svSess = new SessionService();
    this.svUser = new UserService();
    this.svMemo = new MemoService();
    this.svNotif = new NotificationService();
    // this.svCalnd = new CalendarService();
    this.svGroup = new GroupService();
    this.svGroupMember = new GroupMemberService();
    this.svConsumer = new ConsumerService();
    this.svMenu = new MenuService();
    this.svAcl = new AclService();

    // const cdReq: ICdRequest = req.post;
    // cdReq.
    // Use 'from()' to convert the async method to an Observable
    return from(this.svSess.getSessionDataExt(req, res)).pipe(
      filter(Boolean), // Ensures only non-null values pass through
      mergeMap((sessionDataExt: ISessionDataExt) => {
        // After retrieving session data, proceed with other logic
        this.sessDataExt = sessionDataExt;
        /**
         * Extract the request consumer guid
         */
        // const cguid = this.svConsumer.getConsumerGuid(req);
        const cguid = sessionDataExt.currentConsumer.consumerGuid;

        /**
         * Use consumer guid to get the associated consumer
         */
        // const clientConsumer$ = this.svConsumer.getConsumerByGuid$(req, res, cguid);
        /**
         * derive allowed modules
         */
        // const allowedModules$ = this.getAclModule$(req, res, { currentUser: cUser, consumerGuid: cguid });
        const allowedModules$ = this.getAclModule$(req, res, sessionDataExt);
        /**
         * use allowed modules to process menu generation
         */
        const menuData$ = allowedModules$.pipe(
          mergeMap((am: any[]) =>
            iif(
              () => {
                this.logger.logInfo(
                  'ModuleService::getModulesUserData$/am:',
                  am,
                );
                return am.length > 0;
              },
              this.svMenu.getAclMenu$(
                req,
                res,
                { modules$: allowedModules$, modulesCount: am.length },
                sessionDataExt,
              ),
              [],
            ),
          ),
        );

        /**
         * use forkJoin to prepare Observable results containing various categories of data in an object.
         * Current categories include:
         *      - consumer // the current organization/company that runs Corpdesk
         *      - menuData // hierarchial menu for modules where current user have access
         *      - userData // current user
         *      - note from the comments below that there are several options for future categories of data to integrate.
         *      - The design is also to have possibilities of configuring which data is included or not or automate based on prevailing circumstances
         */
        const result$ = forkJoin({
          consumer: of(sessionDataExt.currentConsumer),
          menuData: menuData$,
          userData: of(sessionDataExt.currentUser),
          userProfile: of(sessionDataExt.currentUserProfile),
          /////////////////////
          // OPTIONAL ADDITIVES:
          // notifData: notifdata,
          // notifSumm: notifsumm,
          // memoSumm: memosumm,
          // calndSumm: calndsumm,
          // contacts: userContacts,
          // pals: userPals,
          // aCoid: acoid,
        });

        // Return the forkJoin result as an Observable
        return result$;
      }),
    );
  }

  /**
     * Acl modules or allowed modules are modules that are accessible to the current user.
     * For this to be aggregated, 3 datasets are retreived from database to an object as below:
     *  {
            // unfilteredModules: this.getAll$(req, res).pipe(map((m) => { return m })), // for isRoot
            userRoles: this.svAcl.aclUser$(req, res, params).pipe(map((m) => { return m })),
            consumerModules: this.svAcl.aclModule$(req, res).pipe(map((m) => { return m })),
            moduleParents: this.svAcl.aclModuleMembers$(req, res, params).pipe(map((m) => { return m }))
        }

     *  1. User Roles:
        The current user must be registered as a resource to the current consumer in session.
     *  Exceptions is modules that are marked as public.
     *  Apart from being registered as a resource to a consumer, the consumer type is 
     *  used to mark user roles eg consumer_root, consumer_user, consumer_tech, consumer_admin
     *  The above are fetched using consumer_resources_view
     * 
     *  2. Consumer Modules:
     *  These are modules that the current user has acces to.
     *  Must be a module registed as a resource for a given consumer.
     *  The data is also fetched from consumer_resources_view
     * 
     *  3. ModuleParents:
     *  
     * 
     * 
     * @param req 
     * @param res 
     * @param params 
     * @returns 
     */
  // getAclModule$(req, res, sessionDataExt: ISessionDataExt): Observable<any> {
  //     this.b.logTimeStamp('ModuleService::getAclModule$/01')
  //     this.consumerGuid = sessionDataExt.currentConsumer.consumerGuid;
  //     this.svAcl.consumerGuid = sessionDataExt.currentConsumer.consumerGuid;
  //     this.logger.logInfo('ModuleService::getAclModule$()/sessionDataExt:', sessionDataExt)
  //     this.logger.logInfo('ModuleService::getAclModule$()/this.svAcl.consumerGuid:', this.svAcl.consumerGuid)
  //     // this.logger.logInfo('ModuleService::getAclModule$()/01:');
  //     return forkJoin({
  //         // unfilteredModules: this.getAll$(req, res).pipe(map((m) => { return m })), // for isRoot
  //         userRoles: this.svAcl.aclUser$(req, res, sessionDataExt).pipe(map((m) => { return m })),
  //         consumerModules: this.svAcl.aclModule$(req, res).pipe(map((m) => { return m })),
  //         moduleParents: this.svAcl.aclModuleMembers$(req, res, sessionDataExt).pipe(map((m) => { return m }))
  //     })
  //         .pipe(
  //             map((acl: any) => {
  //                 this.b.logTimeStamp('ModuleService::getModulesUserData$/02')
  //                 this.logger.logInfo('ModuleService::getAclModule$()/acl:', acl)
  //                 /**
  //                  * - Public modules are included without acl filtering
  //                  * - Based on acl result, return appropirate modules
  //                  */
  //                 const publicModules = acl.consumerModules.filter(m => m.moduleIsPublic);
  //                 this.logger.logInfo('ModuleService::getAclModule$()/publicModules:', publicModules)
  //                 /**
  //                  * - if userIsConsumerRoot then return all consumerModules
  //                  */
  //                 if (acl.userRoles.isConsumerRoot.length > 0) {
  //                     // this.b.logTimeStamp('ModuleService::getModulesUserData$/03')
  //                     return acl.consumerModules;
  //                 }
  //                 else if (acl.userRoles.isConsumerUser.length > 0) { // if user is registered as consumer user then filter consumer modules
  //                     // this.b.logTimeStamp('ModuleService::getModulesUserData$/04')
  //                     // this.logger.logInfo('ModuleService::getModulesUserData$/acl.userRoles.isConsumerUser:', acl.userRoles.isConsumerUser);
  //                     // this.logger.logInfo('ModuleService::getModulesUserData$/acl.moduleParents:', acl.moduleParents);
  //                     // this.logger.logInfo('ModuleService::getModulesUserData$/acl.consumerModules:', acl.consumerModules);
  //                     const userModules = this.b.intersect(acl.consumerModules, acl.moduleParents, 'moduleGuid');
  //                     this.logger.logInfo('ModuleService::getModulesUserData$/userModules:', userModules);
  //                     this.logger.logInfo('ModuleService::getModulesUserData$/publicModules:', publicModules);

  //                     /**
  //                      * create a union of userModules and publicModules
  //                      */
  //                     return userModules.concat(publicModules); // return user modules and public modules
  //                 }
  //                 else {  // if is neither of the above, return zero modules
  //                     // this.logger.logInfo('ModuleService::getAclModule$()/publicModules:', publicModules)
  //                     return publicModules; // return only public modules
  //                 }
  //             })
  //         );
  // }

  getAclModule$(req, res, sessionDataExt: ISessionDataExt): Observable<any> {
    // this.b.logTimeStamp('ModuleService::getAclModule$/01');
    this.consumerGuid = sessionDataExt.currentConsumer.consumerGuid!;
    this.svAcl.consumerGuid = sessionDataExt.currentConsumer.consumerGuid;
    this.logger.logInfo(
      'ModuleService::getAclModule$()/sessionDataExt:',
      sessionDataExt,
    );
    this.logger.logInfo(
      'ModuleService::getAclModule$()/this.svAcl.consumerGuid:',
      this.svAcl.consumerGuid,
    );

    return forkJoin({
      userRoles: this.svAcl.aclUser$(req, res, sessionDataExt).pipe(
        map((m) => {
          return m;
        }),
      ),
      consumerModules: this.svAcl.aclModule$(req, res).pipe(
        map((m) => {
          return m;
        }),
      ),
      moduleParents: this.svAcl
        .aclModuleMembers$(req, res, sessionDataExt)
        .pipe(
          map((m) => {
            return m;
          }),
        ),
    }).pipe(
      map((acl: any) => {
        // this.b.logTimeStamp('ModuleService::getModulesUserData$/02');
        this.logger.logInfo('ModuleService::getAclModule$()/acl:', acl);

        const publicModules = acl.consumerModules.filter(
          (m) => m.moduleIsPublic,
        );
        this.logger.logInfo(
          'ModuleService::getAclModule$()/publicModules:',
          publicModules,
        );

        if (acl.userRoles.isConsumerRoot.length > 0) {
          return acl.consumerModules;
        } else if (acl.userRoles.isConsumerUser.length > 0) {
          const userModules = this.b.intersect(
            acl.consumerModules,
            acl.moduleParents,
            'moduleGuid',
          );
          this.logger.logInfo(
            'ModuleService::getModulesUserData$/userModules:',
            userModules,
          );
          this.logger.logInfo(
            'ModuleService::getModulesUserData$/publicModules:',
            publicModules,
          );

          /**
           * Combine userModules and publicModules and remove duplicates based on moduleGuid
           */
          const combinedModules = userModules.concat(publicModules);
          const uniqueModules = Array.from(
            new Set(combinedModules.map((a) => a.moduleGuid)),
          ).map((guid) => combinedModules.find((a) => a.moduleGuid === guid));

          return uniqueModules;
        } else {
          return publicModules;
        }
      }),
    );
  }

  // /**
  //  * {
  //         "ctx": "Sys",
  //         "m": "Moduleman",
  //         "c": "Module",
  //         "a": "Get",
  //         "dat": {
  //             "f_vals": [
  //                 {
  //                     "filter": {
  //                         "select":["moduleId","moduleGuid"],
  //                         "where": { "moduleId":98}
  //                         }
  //                 }
  //             ],
  //             "token": "29947F3F-FF52-9659-F24C-90D716BC77B2"
  //         },
  //         "args": null
  //     }
  //  * @param req
  //  * @param res
  //  */
  getModule(req: any, res: any) {
    const f = this.b.getQuery(req);
    // this.logger.logInfo('ModuleService::getModule/f:', f);
    const serviceInput = {
      serviceModel: ModuleViewModel,
      docName: 'MenuService::getModuleMenu$',
      cmd: {
        action: 'find',
        query: f,
      },
      dSource: this.defaultDs,
    };
    this.b.read$(req, res, serviceInput).subscribe((r) => {
      this.b.i.code = 'ModulesController::Get';
      const svSess = new SessionService();
      svSess.sessResp.cd_token = req.post.dat.token;
      svSess.sessResp.ttl = svSess.getTtl();
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = r;
      this.b.respond(req, res);
    });
  }

  getModuleCount(req: any, res: any) {
    const q = this.b.getQuery(req);
    this.logger.logInfo('ModuleService::getModuleCount/q:', q);
    const serviceInput = {
      serviceModel: ModuleViewModel,
      docName: 'MenuService::getModuleCount$',
      cmd: {
        action: 'find',
        query: q,
      },
      dSource: this.defaultDs,
    };
    this.b.readCount$(req, res, serviceInput).subscribe((r) => {
      this.b.i.code = 'ModulesController::Get';
      const svSess = new SessionService();
      svSess.sessResp.cd_token = req.post.dat.token;
      svSess.sessResp.ttl = svSess.getTtl();
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = r;
      this.b.respond(req, res);
    });
  }

  getModuleQB(req: any, res: any) {
    console.log('ModuleService::getModuleQB()/1');
    this.b.entityAdapter.registerMappingFromEntity(ModuleViewModel);
    const q = this.b.getQuery(req);
    // console.log('MenuService::getModuleCount/q:', q);
    const serviceInput = {
      serviceModel: ModuleViewModel,
      docName: 'ModuleService::getModuleQB',
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

  async getModuleByName(
    req,
    res,
    moduleName,
  ): Promise<ModuleViewModel[] | null> {
    const b = new BaseService<ModuleViewModel>();
    const f = { where: { moduleName: `${moduleName}` } };
    const serviceInput: IServiceInput<ModuleViewModel> = {
      serviceModel: ModuleViewModel,
      docName: 'ModuleService::getModuleByName',
      cmd: {
        action: 'find',
        query: f,
      },
      dSource: this.defaultDs,
    };
    if (req) {
      return (await b.read(req, res, serviceInput)) as ModuleViewModel[];
    } else {
      const result = (await b.read(req, res, serviceInput)) as CdFxReturn<
        ModuleViewModel[]
      >;
      if (!result.state || !result.data) {
        return null;
      }
      return result.data;
    }
  }

  /**
   * Use BaseService for simple search
   * @param req
   * @param res
   */
  async read(req, res, serviceInput: IServiceInput<ModuleModel>): Promise<any> {
    return await this.b.read(req, res, serviceInput);
  }

  // remove(req, res): Promise<void> {
  //   // this.logger.logInfo(`starting SessionService::remove()`);
  //   return null;
  // }

  /**
   * harmonise any data that can
   * result in type error;
   * @param q
   * @returns
   */
  beforeUpdate(q: any): IQuery {
    if (q.update.moduleEnabled === '') {
      q.update.moduleEnabled = null;
    }
    return q;
  }

  // update(req: any, res: any) {
  //   const serviceInput = {
  //     serviceModel: ModuleModel,
  //     docName: 'MenuService::update',
  //     cmd: {
  //       action: 'update',
  //       query: req.post.dat.f_vals[0].query,
  //     },
  //     dSource: this.defaultDs,
  //   };
  //   this.b.update$(req, res, serviceInput).subscribe((ret) => {
  //     this.b.cdResp.data = ret;
  //     this.b.respond(req, res);
  //   });
  // }

  async updateI(req, res, q): Promise<any> {
    console.log('ModuleService::updateI()/01');
    // let q = this.b.getQuery(req);
    q = this.beforeUpdate(q);
    const serviceInput = {
      serviceModel: ModuleModel,
      docName: 'ModuleService::updateI',
      cmd: {
        action: 'update',
        query: q,
      },
      dSource: this.defaultDs,
    };
    console.log('ModuleService::update()/02');
    return this.b.update(req, res, serviceInput);
  }

  // delete(req: any, res: any) {
  //   const serviceInput = {
  //     serviceModel: ModuleModel,
  //     docName: 'ModuleService::delete',
  //     cmd: {
  //       action: 'delete',
  //       query: req.post.dat.f_vals[0].query,
  //     },
  //     dSource: this.defaultDs,
  //   };

  //   this.b.delete$(req, res, serviceInput).subscribe((ret) => {
  //     /**
  //      * TODO:
  //      * implemement svGroup.deletI(req,res)
  //      * then use it to delet group associated with this module
  //      */
  //     this.b.cdResp.data = ret;
  //     this.b.respond(req, res);
  //   });
  // }
}
