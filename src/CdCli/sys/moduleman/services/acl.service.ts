import {
  Observable,
  from,
  map,
  mergeMap,
  of,
  distinct,
  bufferCount,
  share,
  forkJoin,
} from 'rxjs';
import { GroupMemberService } from '../../user/services/group-member.service.js';
import { BaseService } from '../../base/base.service.js';
import { AclModel } from '../models/acl.model.js';
import { DocModel } from '../models/doc.model.js';
import {
  IAclCtx,
  ICdRequest,
  IQuery,
  IServiceInput,
  ISessionDataExt,
} from '../../base/i-base.js';
import { ModuleService } from './module.service.js';
import { SessionService } from '../../user/services/session.service.js';
import { ConsumerService } from './consumer.service.js';
import { AclUserViewModel } from '../models/acluserview.model.js';
import { AclModuleViewModel } from '../models/acl-module-view.model.js';
import { AclModuleMemberViewModel } from '../models/acl-module-member-view.model.js';
import { Logging } from '../../base/winston.log.js';

/**
 * AclService is used by Corpdesk api to manage privilege access to modules.
 * Modules use MenuModel as handles to its facilities. So menus are also subject to AclService
 */
export class AclService {
  logger: Logging;
  b: BaseService<AclModel>;
  nestedMembers = [];
  aclRet;
  cuid;
  arrDoc;
  moduleIndexName;
  staticModel;
  validated;
  aclCtx;
  currentModule;
  srvSess;
  srvConsumer;
  consumerGuid;
  consumer;
  isPublicModule = (m: any) => m.moduleIsPublic;
  trimmedModule = (m: any) => {
    return {
      moduleGuid: m.moduleGuid,
      moduleEnabled: m.moduleEnabled,
      moduleIsPublic: m.moduleIsPublic,
      moduleId: m.moduleId,
      moduleName: m.moduleName,
      isSysModule: m.isSysModule,
      moduleTypeId: m.moduleTypeId,
      groupGuid: m.groupGuid,
    };
  };

  constructor() {
    this.b = new BaseService();
    this.logger = new Logging();
    this.srvSess = new SessionService();
    this.srvConsumer = new ConsumerService();
  }

  /**
   * Consumer is a company that is registred as Consumer consumer.
   * All clients are expected to call api in the context of a given consumer.
   * One of the Coprdesk ways of assessing access level is by registering users who have access to a given consumer resources.
   * Consumer resources are managed by ConsumerResourceService and storage managed by ConsumerResourceModel
   *
   * @param req
   * @param res
   * @param params
   */
  async getAclModule(req, res, sessionDataExt: ISessionDataExt) {
    this.b.logTimeStamp(
      `AclService::getAclModule/sessionDataExt:${JSON.stringify(sessionDataExt)}`,
    );
    console.log(
      'AclService::getAclModule(req, res,params)/sessionDataExt:',
      sessionDataExt,
    );
    console.log(
      'AclService::getAclModule/this.consumerGuid:',
      this.consumerGuid,
    );
    const result$ = of(
      /**
       * query from consumer_resource_view for users who are members of active consumer
       * and in respect of their roles: consumer_root, consumer_user, consumer_tech
       */
      this.aclUser$(req, res, sessionDataExt).pipe(
        map((u: any) => {
          return { useRoles: u };
        }),
      ),
      /**
       * query from consumer_resource_view for modules which are
       *  - members of active consumer and
       *  - modules that are enabled
       */
      this.aclModule$(req, res).pipe(
        map((u: any) => {
          return { modules: u };
        }),
      ),
      /**
       * Get modules where user belongs or has access to:
       * This is queried from acl_module_member_view
       * acl_module_member_view aggregates related group, group_members and modules
       * In essence it implements Access Level policy
       */
      this.aclModuleMembers$(req, res, sessionDataExt).pipe(
        map((u: any) => {
          return { moduleParents: u };
        }),
      ),
    ).pipe(
      mergeMap((obs$: any) => obs$),
      bufferCount(3),
    );

    result$.subscribe((r: any) => {
      // console.log(`AclService::getAclModule/subscribe/01`)
      // this.b.logTimeStamp(`AclService::getAclModule/r:${JSON.stringify(r)}`)
      // console.log(`AclService::getAclModule/r:${JSON.stringify(r)}`)
      const modules = r.filter((m: any) => {
        if (typeof m.modules === 'object') {
          return m;
        }
      });

      const moduleParents = r.filter((m: any) => {
        if (typeof m.moduleParents === 'object') {
          return m;
        }
      });

      // console.log(`AclService::getAclModule/modules:${JSON.stringify(modules)}`)
      // console.log(`AclService::getAclModule/moduleParents:${JSON.stringify(moduleParents)}`)
      // console.log('modules[0]:', modules[0]);
      // console.log('moduleParents[0]:', moduleParents[0]);
      const matchedObjects = (a, b) => JSON.stringify(a) === JSON.stringify(b);
      const intersect = modules[0].modules.filter((module) => {
        return moduleParents[0].moduleParents.filter((mp) => {
          if (JSON.stringify(mp) === JSON.stringify(module)) {
            return module;
          }
        });
      });
      this.b.cdResp = intersect;
      this.b.respond(req, res);
    });
  }

  /**
   * stream of users based on AclUserViewModel
   * This is based on settings at consumer_resource_types
   * ConsumerResourceTypeMode categorizes user based on roles (consumer root user, regular consumer users etc )
   * This is currently experimental and some data are hard coded for demonstrations of use case.
   * filtered by current consumer relationship and user role
   * @param req
   * @param res
   * @param params
   * @returns
   */
  aclUser$(req, res, sessionDataExt: ISessionDataExt): Observable<any> {
    // this.b.logTimeStamp(`AclService::aclUser$/params:${JSON.stringify(params)}`)
    const b = new BaseService();
    this.consumerGuid = sessionDataExt.currentConsumer.consumerGuid;
    const q: IQuery = { where: {} };
    const serviceInput: IServiceInput<AclUserViewModel> = {
      serviceModel: AclUserViewModel,
      modelName: 'AclUserViewModel',
      docName: 'AclService::aclUser$',
      cmd: {
        action: 'find',
        query: q,
      },
      dSource: 1,
    };
    const user$ = from(b.read(req, res, serviceInput)).pipe(
      share(), // to avoid repeated db round trips
    );
    const isRoot = (u: any) => u.userId === 1001;
    const isAnon = (u: any) => u.userId === 1000;

    const isConsumerRoot = (u: any) =>
      u.consumerResourceTypeId === 4 &&
      u.consumerGuid === this.consumerGuid &&
      u.objGuid === sessionDataExt.currentUser.userGuid;

    const isConsumerTechie = (u: any) =>
      u.consumerResourceTypeId === 5 &&
      u.consumerGuid === this.consumerGuid &&
      u.objGuid === sessionDataExt.currentUser.userGuid;

    const isConsumerUser = (u: any) =>
      u.consumerResourceTypeId === 6 &&
      u.consumerGuid === this.consumerGuid &&
      u.objGuid === sessionDataExt.currentUser.userGuid;

    const isAnon$ = user$.pipe(
      map((u: any) => {
        const ret = u.filter(isRoot);
        // this.b.logTimeStamp(`AclService::aclUser$/u[isRoot$]:${JSON.stringify(u)}`)
        // this.b.logTimeStamp(`AclService::aclUser$/ret[isRoot$]:${JSON.stringify(ret)}`)
        return ret;
      }),
      distinct(),
    );
    const isRoot$ = user$.pipe(
      map((u: any) => {
        const ret = u.filter(isRoot);
        // this.b.logTimeStamp(`AclService::aclUser$/u[isRoot$]:${JSON.stringify(u)}`)
        // this.b.logTimeStamp(`AclService::aclUser$/ret[isRoot$]:${JSON.stringify(ret)}`)
        return ret;
      }),
      distinct(),
    );

    const isConsumerRoot$ = user$.pipe(
      map((u: any) => {
        const ret = u.filter(isConsumerRoot);
        // this.b.logTimeStamp(`AclService::aclUser$/u[isConsumerRoot$]:${JSON.stringify(u)}`)
        // this.b.logTimeStamp(`AclService::aclUser$/ret[isConsumerRoot$]:${JSON.stringify(ret)}`)
        return ret;
      }),
      distinct(),
    );

    const isConsumerTechie$ = user$.pipe(
      map((u: any) => {
        const ret = u.filter(isConsumerTechie);
        // this.b.logTimeStamp(`AclService::aclUser$/u[isConsumerTechie$]:${JSON.stringify(u)}`)
        // this.b.logTimeStamp(`AclService::aclUser$/ret[isConsumerTechie$]:${JSON.stringify(ret)}`)
        return ret;
      }),
      distinct(),
    );

    const isConsumerUser$ = user$.pipe(
      map((u: any) => {
        const ret = u.filter(isConsumerUser);
        // this.b.logTimeStamp(`AclService::aclUser$/u[isConsumerUser$]:${JSON.stringify(u)}`)
        // this.b.logTimeStamp(`AclService::aclUser$/ret[isConsumerUser$]:${JSON.stringify(ret)}`)
        return ret;
      }),
      distinct(),
    );

    return forkJoin({
      isAnon: isAnon$.pipe(
        map((u: any) => {
          return u;
        }),
      ),
      isRoot: isRoot$.pipe(
        map((u: any) => {
          return u;
        }),
      ),
      isConsumerRoot: isConsumerRoot$.pipe(
        map((u: any) => {
          return u;
        }),
      ),
      isConsumerUser: isConsumerUser$.pipe(
        map((u: any) => {
          return u;
        }),
      ),
    });
  }

  /**
   * stream of modules based on AclModuleViewModel and
   * filtered by isEnabled, isPublicModule and isConsumerResource
   * @param req
   * @param res
   * @returns
   */
  aclModule$(req: any, res: any) {
    // this.logger.logInfo('AclService::aclModule$()/req.post:', req.post)
    this.logger.logInfo(
      'AclService::aclModule$()/this.consumerGuid:',
      this.consumerGuid,
    );
    // console.log('AclService::aclModule$()/01:');
    // this.b.logTimeStamp(':AclService::aclModule$()/01')
    const b = new BaseService();
    const isEnabled = (m: any) => m.moduleEnabled;
    const isPublicModule = (m: any) => m.moduleIsPublic;
    const isConsumerResource = (m: any) =>
      m.moduleIsPublic || m.consumerGuid === this.consumerGuid;
    const serviceInput: IServiceInput<AclModuleViewModel> = {
      serviceModel: AclModuleViewModel,
      modelName: 'AclModuleViewModel',
      docName: 'AclService::aclModule$',
      cmd: {
        action: 'find',
        query: { where: { consumerGuid: this.consumerGuid } },
      },
      dSource: 1,
    };
    return from(b.read(req, res, serviceInput))
      .pipe(share())
      .pipe(
        map((m: any) => {
          // this.b.logTimeStamp(':AclService::aclModule$()/02')
          console.log('AclService::aclModule$()/m1:', m);
          return m.filter(isEnabled);
        }),
        map((m: any) => {
          console.log('AclService::aclModule$()/m2:', m);
          // console.log('AclService::aclModule$()/03:');
          // this.b.logTimeStamp(':AclService::aclModule$()/03')
          return m.filter(isConsumerResource);
        }),
        distinct(),
      )
      .pipe(
        map((modules) => {
          // this.b.logTimeStamp(':AclService::aclModule$()/04')
          // console.log('AclService::aclModule$()/03:');
          console.log('aclModuleMembers/modules3:', modules);
          const mArr: Partial<AclModuleMemberViewModel>[] = [];
          modules.forEach((m: any) => {
            m = {
              moduleGuid: m.moduleGuid,
              moduleEnabled: m.moduleEnabled,
              moduleIsPublic: m.moduleIsPublic,
              moduleId: m.moduleId,
              moduleName: m.moduleName,
              isSysModule: m.isSysModule,
              moduleTypeId: m.moduleTypeId,
              groupGuid: m.groupGuid,
            };
            mArr.push(m);
          });
          // this.b.logTimeStamp(':AclService::aclModule$()/05')
          // console.log('AclService::aclModule$()/04:');
          console.log('AclService::aclModule$/mArr:', mArr);
          return mArr;
        }),
        distinct(),
      );
  }

  /**
   * When a module is created, it also creates a corresponding group in GroupModel
   * This logical group is used to save members of Corpdesk cd-objects that have access to this module.
   * Members of groups are managed by GroupMembersModel
   * AclModuleMemberViewModel aggregates related group, group_members and modules
   * In other words one can query which users belong to which module (logical association by grouping)
   *
   * @param req
   * @param res
   * @param params
   * @returns
   */
  aclModuleMembers$(req, res, params): Observable<any> {
    // this.b.logTimeStamp('AclService::aclModuleMembers$/01')
    // console.log('AclService::aclModuleMembers$/01:');
    const b = new BaseService();

    /**
     * define filter for extracting modules where current user belongs
     * @param m
     * @returns
     */
    const isModuleMember = (m: any) =>
      m.memberGuid === params.currentUser.userGuid;

    const serviceInput: IServiceInput<AclModuleMemberViewModel> = {
      serviceModel: AclModuleMemberViewModel,
      modelName: 'AclModuleMemberViewModel',
      docName: 'AclService::aclUser$',
      cmd: {
        action: 'find',
        /**
         * query for extracting all the modules where current user belongs or has access to
         */
        query: {
          where: [
            {
              memberGuid: params.currentUser.userGuid,
              moduleEnabled: true,
              groupMemberEnabled: true,
            },
            {
              moduleIsPublic: true,
            },
          ],
        },
      },
      dSource: 1,
    };
    const modules$ = from(b.read(req, res, serviceInput)).pipe(
      share(), // to avoid repeated db round trips
    );
    return modules$
      .pipe(
        map((m: any) => {
          if (m.isPublicModule) {
            return m; // waive filtering if the module is public
          } else {
            return m.filter(isModuleMember);
          }
        }),
        distinct(),
      )
      .pipe(
        map((modules) => {
          // this.b.logTimeStamp('AclService::aclModuleMembers$/02')
          // console.log('AclService::aclModuleMembers$/02:');
          // console.log('aclModuleMembers/modules:', modules);
          const mArr: Partial<AclModuleMemberViewModel>[] = [];
          modules.forEach((m: any) => {
            m = {
              moduleGuid: m.moduleGuid,
              moduleEnabled: m.moduleEnabled,
              moduleIsPublic: m.moduleIsPublic,
              moduleId: m.moduleId,
              moduleName: m.moduleName,
              isSysModule: m.isSysModule,
              moduleTypeId: m.moduleTypeId,
              groupGuid: m.groupGuid,
            };
            mArr.push(m);
          });
          return mArr;
        }),
        distinct(),
      );
  }
}
