import { CacheContainer } from 'node-ts-cache';
import { MemoryStorage } from 'node-ts-cache-storage-memory';
import {
  Observable,
  map,
  mergeMap,
  of,
  bufferCount,
  tap,
  forkJoin,
  switchMap,
  defaultIfEmpty,
} from 'rxjs';
import { SessionService } from '../../user/services/session.service.js';
import { AclService } from '../../moduleman/services/acl.service.js';
import { GroupMemberService } from '../../user/services/group-member.service.js';
import { BaseService } from '../../base/base.service.js';
import { GroupService } from '../../user/services/group.service.js';
// import { MenuViewModel } from '../models/menu-view.model';
import {
  CreateIParams,
  IAllowedModules,
  IMenuRelations,
  ISelectedMenu,
  IServiceInput,
  ISessionDataExt,
} from '../../base/IBase.js';
// import { MenuModel } from '../models/menu.model';
// import { CdObjService } from './cd-obj.service';
// import { CdObjModel } from '../models/cd-obj.model';
import { Logging } from '../../base/winston.log.js';
import { MenuModel } from '../../moduleman/models/menu.model.js';
import { CdObjService } from '../../moduleman/services/cd-obj.service.js';
import { CdObjModel } from '../../moduleman/models/cd-obj.model.js';
import { MenuViewModel } from '../../moduleman/models/menu-view.model.js';

const menuCache = new CacheContainer(new MemoryStorage());

export class MenuService {
  logger: Logging;
  b: BaseService<MenuModel>;
  srvGroup?: GroupService;
  srvGroupMember: GroupMemberService;
  srvAcl: AclService;
  cuid;
  userGroupsArr = [];
  menuArrDb = [];
  serviceModel: MenuModel;

  /*
   * create rules
   */
  cRules = {
    required: ['menuName', 'menuParentId'],
    noDuplicate: ['menuName', 'menuParentId'],
  };

  constructor() {
    this.b = new BaseService();
    this.logger = new Logging();
    this.srvGroupMember = new GroupMemberService();
    this.srvAcl = new AclService();
    this.serviceModel = new MenuModel();
  }

  /**
     * {
            "ctx": "Sys",
            "m": "Moduleman",
            "c": "MenuController",
            "a": "actionCreate",
            "dat": {
                "f_vals": [{
                    "cd_obj": {
                        "cd_obj_name": "moduleName-controllerName-menuName",
                        "cd_obj_type_guid": "574c73a6-7e5b-40fe-aa89-e52ce1640f42",
                        "parent_module_guid": "a06f881e-41f1-45b9-87f4-8475fef7fcba"
                    },
                    "data": {
                        "menu_name": "reservation",
                        "menu_closet_file": "",
                        "menu_parent_id": "982",
                        "module_id": "258",
                        "menu_order": "11",
                        "path": "reservation",
                        "menu_description": "reservation",
                        "menu_lable": "reservation",
                        "menu_icon": "cog",
                        "active": true
                    }
                }],
                "token": "mT6blaIfqWhzNXQLG8ksVbc1VodSxRZ8lu5cMgda"
            },
            "args": null
        }
     */
  async create(req, res): Promise<void> {
    const svSess = new SessionService();
    if (await this.validateCreate(req, res)) {
      if (await this.beforeCreate(req, res)) {
        const serviceInput = {
          serviceInstance: this,
          serviceModel: MenuModel,
          serviceModelInstance: this.serviceModel,
          docName: 'Create Menu',
          dSource: 1,
        };
        console.log('MenuService::create()/');
        const respData = await this.b.create(req, res, serviceInput);
        this.b.i.app_msg = 'new menu created';
        this.b.setAppState(true, this.b.i, svSess.sessResp);
        this.b.cdResp.data = await respData;
        const r = await this.b.respond(req, res);
      } else {
        const i = {
          messages: this.b.err,
          code: 'MenuService:create',
          app_msg: 'validation failed',
        };
        await this.b.serviceErr(req, res, i.app_msg, i.code);
        const r = await this.b.respond(req, res);
      }
    } else {
      svSess.sessResp.cd_token = req.post.dat.token;
      await this.b.setAppState(false, this.b.i, svSess.sessResp);
      const r = await this.b.respond(req, res);
    }
  }

  async createI(req, res, createIParams: CreateIParams<MenuModel>) {
    return await this.b.createI(req, res, createIParams);
  }

  async validateCreate(req: any, res: any) {
    console.log('starting validateCreate()');
    console.log('validateCreate()/01');
    let ret = false;
    const params = {
      serviceInstance: this,
      model: MenuModel,
    };
    this.b.i.code = 'MenuService::validateCreate';
    if (await this.b.validateUnique(req, res, params)) {
      // console.log('validateCreate()/02')
      if (await this.b.validateRequired(req, res, this.cRules)) {
        // console.log('validateCreate()/03')
        ret = true;
      } else {
        console.log('validateCreate()/04');
        this.b.i.app_msg = `you must provide ${this.cRules.required.join(', ')}`;
        this.b.err.push(this.b.i.app_msg);
        ret = false;
      }
      // console.log('validateCreate()/05')
    } else {
      // console.log('validateCreate()/06')
      const msg = `duplication of ${this.cRules.noDuplicate.join(', ')} not allowed`;
      this.b.i.app_msg = msg;
      this.b.i.messages.push(msg);
      ret = false;
    }
    // console.log('validateCreate()/07')
    return await ret;
  }

  async beforeCreate(req: any, res: any) {
    const cdObjQuery = req.post.dat.f_vals[0].cdObj;
    const svCdObj = new CdObjService();
    const si: IServiceInput<CdObjModel> = {
      serviceInstance: svCdObj,
      serviceModel: CdObjModel,
      serviceModelInstance: svCdObj.serviceModel,
      docName: 'Create Menu/beforeCreate',
      dSource: 1,
    };
    const createIParams: CreateIParams<CdObjModel> = {
      serviceInput: si,
      controllerData: cdObjQuery,
    };
    let ret = false;
    const cdObjData: any = await svCdObj.createI(req, res, createIParams);
    if (cdObjData) {
      console.log('MenuService::beforeCreate()/cdObjData:', cdObjData);
      this.b.setPlData(req, { key: 'menuGuid', value: this.b.getGuid() });
      this.b.setPlData(req, { key: 'cdObjId', value: cdObjData.cdObjId });
      this.b.setPlData(req, { key: 'menuEnabled', value: true });
      ret = true;
    } else {
      this.b.i.app_msg = `duplication of ${this.cRules.noDuplicate.join(', ')} not allowed`;
      this.b.err.push(this.b.i.app_msg);
      ret = false;
    }
    return ret;
  }

  getMenu(req: any, res: any) {
    const f = this.b.getQuery(req);
    this.logger.logInfo('MenuService::getMenu/f:', f);
    const serviceInput: IServiceInput<MenuViewModel> = {
      serviceModel: MenuViewModel,
      docName: 'MenuService::getMenu',
      cmd: {
        action: 'find',
        query: f,
      },
      dSource: 1,
    };
    this.b.read$(req, res, serviceInput).subscribe((r) => {
      this.b.i.code = 'MenuController::Get';
      const svSess = new SessionService();
      svSess.sessResp.cd_token = req.post.dat.token;
      svSess.sessResp.ttl = svSess.getTtl();
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = r;
      this.b.respond(req, res);
    });
  }

  /**
   *
   * @param req
   * @param res
   * @param params // allowed module to use in generating menu
   * @returns
   */
  getAclMenu$(
    req,
    res,
    allowedModules: IAllowedModules,
    sessionDataExt: ISessionDataExt,
  ): Observable<any> {
    this.logger.logInfo(
      'MenuService::getAclMenu$()/allowedModules:',
      allowedModules,
    );

    return allowedModules.modules$.pipe(
      mergeMap((m) => {
        return m.map((mod) => {
          this.logger.logInfo('MenuService::getAclMenu$()/mod:', mod);
          const moduleMenuData$ = this.getModuleMenu$(
            req,
            res,
            mod,
            sessionDataExt,
          );
          this.logger.logInfo(
            'MenuService::getAclMenu$()/moduleMenuData:',
            moduleMenuData$,
          );
          return forkJoin({
            modules: allowedModules.modules$,
            menu: this.buildNestedMenu(
              this.getRootMenuIds(moduleMenuData$, sessionDataExt),
              moduleMenuData$,
              sessionDataExt,
            ),
          }).pipe(
            map(({ menu, modules }) => {
              this.logger.logInfo('MenuService::getAclMenu$()/menu:', menu);
              this.logger.logInfo(
                'MenuService::getAclMenu$()/modules:',
                modules,
              );
              return menu; // menu now contains an array of nested menu trees
            }),
          );
        });
      }),
      mergeMap((m) => {
        this.logger.logInfo('MenuService::getAclMenu$()/m:', m);
        return m.pipe(map((modules) => modules));
      }),
      bufferCount(allowedModules.modulesCount),
      map((bufferedMenus) => bufferedMenus.flat()), // Flatten the buffered menus
    );
  }

  getModuleMenu$(
    req,
    res,
    moduleData,
    sessionDataExt: ISessionDataExt,
  ): Observable<MenuViewModel[]> {
    this.logger.logInfo(
      'MenuService::getModuleMenu$()/moduleData:',
      moduleData,
    );
    this.b.entityAdapter.registerMappingFromEntity(MenuViewModel);
    let filter = {};
    if (sessionDataExt.currentUser.userId === 1000) {
      filter = {
        moduleGuid: moduleData.moduleGuid,
        menuEnabled: true,
        menuIsPublic: true,
      };
    } else {
      filter = { moduleGuid: moduleData.moduleGuid, menuEnabled: true };
    }
    const serviceInput: IServiceInput<MenuViewModel> = {
      // serviceInstance: this,
      serviceModel: MenuViewModel,
      docName: 'MenuService::getModuleMenu$',
      cmd: {
        action: 'find',
        query: {
          where: { moduleGuid: moduleData.moduleGuid, menuEnabled: 1 },
          distinct: true,
        },
      },
      dSource: 1,
    };
    return this.b.read$(req, res, serviceInput);
    // return this.b.readQB$(req, res, serviceInput)
  }

  buildNestedMenu(
    rootMenuIds$: Observable<number[]>,
    moduleMenuData$: Observable<MenuViewModel[]>,
    sessionDataExt: ISessionDataExt,
  ): Observable<any[]> {
    return rootMenuIds$.pipe(
      switchMap((rootMenuIds) => {
        const menuTrees$ = rootMenuIds.map((rootMenuId) =>
          this.buildSingleMenuTree(rootMenuId, moduleMenuData$, sessionDataExt),
        );
        return forkJoin(menuTrees$);
      }),
    );
  }

  // Updated helper method to build a single menu tree
  // private buildSingleMenuTree(rootMenuId: number, moduleMenuData$: Observable<MenuViewModel[]>, sessionDataExt:ISessionDataExt): Observable<any> {
  //     /**
  //      * cuid is current user
  //      * special users include:
  //      * anon, cuid=1000
  //      * root, cuid=1001
  //      */
  //     const cuid = sessionDataExt.currentUser.userId
  //     console.log("MenuService::buildSingleMenuTree()/cuid:", cuid)
  //     return moduleMenuData$.pipe(
  //         map((menuData) => {
  //             console.log("MenuService::buildSingleMenuTree()/menuData1:", menuData)
  //             // Recursive function to build the tree structure
  //             const buildTree = (parentId: number): any => {
  //                 return menuData
  //                     .filter((m) => {
  //                         if(cuid===1000 && m.menuParentId === parentId && m.menuIsPublic === true){
  //                             return m;
  //                         }

  //                         else if(m.menuParentId === parentId) {
  //                             return m;
  //                         }

  //                     })
  //                     .map((m) => ({
  //                         ...m,
  //                         children: buildTree(m.menuId)
  //                     }));
  //             };

  //             console.log("MenuService::buildSingleMenuTree()/menuData2:", menuData)
  //             // Start building the tree from the root node
  //             const rootNode = menuData.find((m) => m.menuId === rootMenuId);
  //             if (rootNode) {
  //                 return {
  //                     ...rootNode,
  //                     children: buildTree(rootMenuId)
  //                 };
  //             } else {
  //                 return null; // Handle cases where root node is not found
  //             }
  //         })
  //     );
  // }

  private buildSingleMenuTree(
    rootMenuId: number,
    moduleMenuData$: Observable<MenuViewModel[]>,
    sessionDataExt: ISessionDataExt,
  ): Observable<any> {
    const cuid = sessionDataExt.currentUser.userId;

    return moduleMenuData$.pipe(
      map((menuData) => {
        console.log('MenuService::buildSingleMenuTree()/menuData1:', menuData);

        // Filter menu data if the user is 'anon' (cuid=1000)
        if (cuid === 1000) {
          menuData = menuData.filter((m) => m.menuIsPublic == 1);
        }

        // Recursive function to build the tree structure
        const buildTree = (parentId: number): any => {
          return menuData
            .filter((m) => m.menuParentId === parentId)
            .map((m) => ({
              ...m,
              children: m.menuId !== undefined ? buildTree(m.menuId) : [],
            }));
        };

        console.log('MenuService::buildSingleMenuTree()/menuData2:', menuData);

        // Start building the tree from the root node
        const rootNode = menuData.find((m) => m.menuId === rootMenuId);
        if (rootNode) {
          return {
            ...rootNode,
            children: buildTree(rootMenuId),
          };
        } else {
          return null; // Handle cases where root node is not found
        }
      }),
    );
  }

  // Helper method to retrieve root menu IDs
  getRootMenuIds(
    moduleMenuData$: Observable<MenuViewModel[]>,
    sessionDataExt: ISessionDataExt,
  ): Observable<number[]> {
    return moduleMenuData$.pipe(
      map((menuData) => {
        console.log('MenuService::getRootMenuIds()/menuData:', menuData);
        return menuData
          .filter((m) => m.menuParentId === -1)
          .map((m) => m.menuId)
          .filter((id): id is number => id !== undefined);
      }),
    );
  }

  getMenuItem(
    menuId$: Observable<number>,
    moduleMenuData$: Observable<MenuViewModel[]>,
    sessionDataExt: ISessionDataExt,
  ): Observable<ISelectedMenu> {
    this.b.logTimeStamp('MenuService::getMenuItem$/01');
    return moduleMenuData$.pipe(
      tap((m) => {
        console.log('MenuService::getMenuItem/m:', m);
        menuId$.pipe(
          map((mId) => {
            this.b.logTimeStamp('MenuService::getMenuItem$/02');
            return mId;
          }),
        );
      }),
      mergeMap((mData: MenuViewModel[]) =>
        forkJoin({
          menuData: of(mData),
          menuId: menuId$,
        }).pipe(defaultIfEmpty(null)),
      ),
      map((m) => {
        console.log('MenuService::getMenuItem/m:', m);
        if (m) {
          return m.menuData.filter((menuItem: MenuViewModel) => {
            if (menuItem.menuId === m.menuId) {
              return menuItem;
            }
          });
        } else {
          return [];
        }
      }),
      tap((m) => {
        // this.b.logTimeStamp('MenuService::getMenuItem$/03')
      }),
      mergeMap((menuItem: MenuViewModel[]) =>
        forkJoin({
          moduleMenuData: moduleMenuData$,
          selectedItem: of(menuItem[0]),
        }),
      ),
      tap((m) => {
        // this.b.logTimeStamp('MenuService::getMenuItem$/04')
      }),
    );
  }

  getChildren(
    menuParentId: number,
    selectedMenu: ISelectedMenu,
  ): MenuViewModel[] {
    // console.log('MenuService::getChildren/01:');
    const moduleMenuData = selectedMenu.moduleMenuData;
    if (!moduleMenuData) {
      return [];
    }
    const data = moduleMenuData.filter((m) => {
      if (m.menuParentId === menuParentId) {
        return m;
      }
    });
    return data;
  }

  getMenuCount(req: any, res: any) {
    console.log('MenuService::getMenuCount()/reached 1');
    const q = this.b.getQuery(req);
    // console.log('MenuService::getModuleCount/q:', q);
    const serviceInput = {
      serviceModel: MenuViewModel,
      docName: 'MenuService::getMenu$',
      cmd: {
        action: 'find',
        query: q,
      },
      dSource: 1,
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

  getMenuQB(req: any, res: any) {
    console.log('MenuService::getMenuCount()/reached 1');
    this.b.entityAdapter.registerMappingFromEntity(MenuViewModel);
    const q = this.b.getQuery(req);
    // console.log('MenuService::getModuleCount/q:', q);
    const serviceInput = {
      serviceModel: MenuViewModel,
      docName: 'MenuService::getMenu$',
      cmd: {
        action: 'find',
        query: q,
      },
      dSource: 1,
    };

    this.b.readQB$(req, res, serviceInput).subscribe((r) => {
      this.b.i.code = 'ModulesController::Get';
      const svSess = new SessionService();
      svSess.sessResp.cd_token = req.post.dat.token;
      svSess.sessResp.ttl = svSess.getTtl();
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = r;
      this.b.respond(req, res);
    });
  }

  update(req: any, res: any) {
    const serviceInput = {
      serviceModel: MenuModel,
      docName: 'MenuService::update',
      cmd: {
        action: 'update',
        query: req.post.dat.f_vals[0].query,
      },
      dSource: 1,
    };

    this.b.update$(req, res, serviceInput).subscribe((ret) => {
      this.b.cdResp.data = ret;
      this.b.respond(req, res);
    });
  }

  delete(req: any, res: any) {
    const serviceInput = {
      serviceModel: MenuModel,
      docName: 'MenuService::delete',
      cmd: {
        action: 'delete',
        query: req.post.dat.f_vals[0].query,
      },
      dSource: 1,
    };

    this.b.delete$(req, res, serviceInput).subscribe((ret) => {
      this.b.cdResp.data = ret;
      this.b.respond(req, res);
    });
  }
}
