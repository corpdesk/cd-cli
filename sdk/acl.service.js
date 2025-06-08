import { from, map, mergeMap, of, distinct, bufferCount, share, forkJoin, } from 'rxjs';
import { BaseService } from '../src/CdCli/sys/base/base.service';
// import { ModuleService } from './module.service';
import { SessionService } from '../src/CdCli/sys/user/services/session.service';
// import { ConsumerService } from './consumer.service';
import { AclUserViewModel } from '../src/CdCli/sys/moduleman/models/acluserview.model';
import { AclModuleViewModel } from '../src/CdCli/sys/moduleman/models/acl-module-view.model';
import { AclModuleMemberViewModel } from '../src/CdCli/sys/moduleman/models/acl-module-member-view.model';
import { Logging } from '../src/CdCli/sys/base/winston.log';
import { ConsumerService } from '../src/CdCli/sys/moduleman/services/consumer.service';
/**
 * AclService is used by Corpdesk api to manage privilege access to modules.
 * Modules use MenuModel as handles to its facilities. So menus are also subject to AclService
 */
export class AclService {
    constructor() {
        this.nestedMembers = [];
        this.isPublicModule = (m) => m.moduleIsPublic;
        this.trimmedModule = (m) => {
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
    async getAclModule(req, res, sessionDataExt) {
        this.b.logTimeStamp(`AclService::getAclModule/sessionDataExt:${JSON.stringify(sessionDataExt)}`);
        console.log('AclService::getAclModule(req, res,params)/sessionDataExt:', sessionDataExt);
        console.log('AclService::getAclModule/this.consumerGuid:', this.consumerGuid);
        const result$ = of(
        /**
         * query from consumer_resource_view for users who are members of active consumer
         * and in respect of their roles: consumer_root, consumer_user, consumer_tech
         */
        this.aclUser$(req, res, sessionDataExt).pipe(map((u) => {
            return { useRoles: u };
        })), 
        /**
         * query from consumer_resource_view for modules which are
         *  - members of active consumer and
         *  - modules that are enabled
         */
        this.aclModule$(req, res).pipe(map((u) => {
            return { modules: u };
        })), 
        /**
         * Get modules where user belongs or has access to:
         * This is queried from acl_module_member_view
         * acl_module_member_view aggregates related group, group_members and modules
         * In essence it implements Access Level policy
         */
        this.aclModuleMembers$(req, res, sessionDataExt).pipe(map((u) => {
            return { moduleParents: u };
        }))).pipe(mergeMap((obs$) => obs$), bufferCount(3));
        result$.subscribe((r) => {
            // console.log(`AclService::getAclModule/subscribe/01`)
            // this.b.logTimeStamp(`AclService::getAclModule/r:${JSON.stringify(r)}`)
            // console.log(`AclService::getAclModule/r:${JSON.stringify(r)}`)
            const modules = r.filter((m) => {
                if (typeof m.modules === 'object') {
                    return m;
                }
            });
            const moduleParents = r.filter((m) => {
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
    aclUser$(req, res, sessionDataExt) {
        // this.b.logTimeStamp(`AclService::aclUser$/params:${JSON.stringify(params)}`)
        const b = new BaseService();
        this.consumerGuid = sessionDataExt.currentConsumer.consumerGuid;
        const q = { where: {} };
        const serviceInput = {
            serviceModel: AclUserViewModel,
            modelName: 'AclUserViewModel',
            docName: 'AclService::aclUser$',
            cmd: {
                action: 'find',
                query: q,
            },
            dSource: 1,
        };
        const user$ = from(b.read(req, res, serviceInput)).pipe(share());
        const isRoot = (u) => u.userId === 1001;
        const isAnon = (u) => u.userId === 1000;
        const isConsumerRoot = (u) => u.consumerResourceTypeId === 4 &&
            u.consumerGuid === this.consumerGuid &&
            u.objGuid === sessionDataExt.currentUser.userGuid;
        const isConsumerTechie = (u) => u.consumerResourceTypeId === 5 &&
            u.consumerGuid === this.consumerGuid &&
            u.objGuid === sessionDataExt.currentUser.userGuid;
        const isConsumerUser = (u) => u.consumerResourceTypeId === 6 &&
            u.consumerGuid === this.consumerGuid &&
            u.objGuid === sessionDataExt.currentUser.userGuid;
        const isAnon$ = user$.pipe(map((u) => {
            const ret = u.filter(isRoot);
            // this.b.logTimeStamp(`AclService::aclUser$/u[isRoot$]:${JSON.stringify(u)}`)
            // this.b.logTimeStamp(`AclService::aclUser$/ret[isRoot$]:${JSON.stringify(ret)}`)
            return ret;
        }), distinct());
        const isRoot$ = user$.pipe(map((u) => {
            const ret = u.filter(isRoot);
            // this.b.logTimeStamp(`AclService::aclUser$/u[isRoot$]:${JSON.stringify(u)}`)
            // this.b.logTimeStamp(`AclService::aclUser$/ret[isRoot$]:${JSON.stringify(ret)}`)
            return ret;
        }), distinct());
        const isConsumerRoot$ = user$.pipe(map((u) => {
            const ret = u.filter(isConsumerRoot);
            // this.b.logTimeStamp(`AclService::aclUser$/u[isConsumerRoot$]:${JSON.stringify(u)}`)
            // this.b.logTimeStamp(`AclService::aclUser$/ret[isConsumerRoot$]:${JSON.stringify(ret)}`)
            return ret;
        }), distinct());
        const isConsumerTechie$ = user$.pipe(map((u) => {
            const ret = u.filter(isConsumerTechie);
            // this.b.logTimeStamp(`AclService::aclUser$/u[isConsumerTechie$]:${JSON.stringify(u)}`)
            // this.b.logTimeStamp(`AclService::aclUser$/ret[isConsumerTechie$]:${JSON.stringify(ret)}`)
            return ret;
        }), distinct());
        const isConsumerUser$ = user$.pipe(map((u) => {
            const ret = u.filter(isConsumerUser);
            // this.b.logTimeStamp(`AclService::aclUser$/u[isConsumerUser$]:${JSON.stringify(u)}`)
            // this.b.logTimeStamp(`AclService::aclUser$/ret[isConsumerUser$]:${JSON.stringify(ret)}`)
            return ret;
        }), distinct());
        return forkJoin({
            isAnon: isAnon$.pipe(map((u) => {
                return u;
            })),
            isRoot: isRoot$.pipe(map((u) => {
                return u;
            })),
            isConsumerRoot: isConsumerRoot$.pipe(map((u) => {
                return u;
            })),
            isConsumerUser: isConsumerUser$.pipe(map((u) => {
                return u;
            })),
        });
    }
    /**
     * stream of modules based on AclModuleViewModel and
     * filtered by isEnabled, isPublicModule and isConsumerResource
     * @param req
     * @param res
     * @returns
     */
    aclModule$(req, res) {
        // this.logger.logInfo('AclService::aclModule$()/req.post:', req.post)
        this.logger.logInfo('AclService::aclModule$()/this.consumerGuid:', this.consumerGuid);
        // console.log('AclService::aclModule$()/01:');
        // this.b.logTimeStamp(':AclService::aclModule$()/01')
        const b = new BaseService();
        const isEnabled = (m) => m.moduleEnabled;
        const isPublicModule = (m) => m.moduleIsPublic;
        const isConsumerResource = (m) => m.moduleIsPublic || m.consumerGuid === this.consumerGuid;
        const serviceInput = {
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
            .pipe(map((m) => {
            // this.b.logTimeStamp(':AclService::aclModule$()/02')
            console.log('AclService::aclModule$()/m1:', m);
            return m.filter(isEnabled);
        }), map((m) => {
            console.log('AclService::aclModule$()/m2:', m);
            // console.log('AclService::aclModule$()/03:');
            // this.b.logTimeStamp(':AclService::aclModule$()/03')
            return m.filter(isConsumerResource);
        }), distinct())
            .pipe(map((modules) => {
            // this.b.logTimeStamp(':AclService::aclModule$()/04')
            // console.log('AclService::aclModule$()/03:');
            console.log('aclModuleMembers/modules3:', modules);
            const mArr = [];
            modules.forEach((m) => {
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
        }), distinct());
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
    aclModuleMembers$(req, res, params) {
        // this.b.logTimeStamp('AclService::aclModuleMembers$/01')
        // console.log('AclService::aclModuleMembers$/01:');
        const b = new BaseService();
        /**
         * define filter for extracting modules where current user belongs
         * @param m
         * @returns
         */
        const isModuleMember = (m) => m.memberGuid === params.currentUser.userGuid;
        const serviceInput = {
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
        const modules$ = from(b.read(req, res, serviceInput)).pipe(share());
        return modules$
            .pipe(map((m) => {
            if (m.isPublicModule) {
                return m; // waive filtering if the module is public
            }
            else {
                return m.filter(isModuleMember);
            }
        }), distinct())
            .pipe(map((modules) => {
            // this.b.logTimeStamp('AclService::aclModuleMembers$/02')
            // console.log('AclService::aclModuleMembers$/02:');
            // console.log('aclModuleMembers/modules:', modules);
            const mArr = [];
            modules.forEach((m) => {
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
        }), distinct());
    }
}
//# sourceMappingURL=acl.service.js.map