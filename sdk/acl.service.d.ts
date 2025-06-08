import { Observable } from 'rxjs';
import { BaseService } from '../src/CdCli/sys/base/base.service';
import { AclModel } from '../src/CdCli/sys/moduleman/models/acl.model';
import { ISessionDataExt } from '../src/CdCli/sys/base/IBase';
import { AclModuleMemberViewModel } from '../src/CdCli/sys/moduleman/models/acl-module-member-view.model';
import { Logging } from '../src/CdCli/sys/base/winston.log';
/**
 * AclService is used by Corpdesk api to manage privilege access to modules.
 * Modules use MenuModel as handles to its facilities. So menus are also subject to AclService
 */
export declare class AclService {
    logger: Logging;
    b: BaseService<AclModel>;
    nestedMembers: never[];
    aclRet: any;
    cuid: any;
    arrDoc: any;
    moduleIndexName: any;
    staticModel: any;
    validated: any;
    aclCtx: any;
    currentModule: any;
    srvSess: any;
    srvConsumer: any;
    consumerGuid: any;
    consumer: any;
    isPublicModule: (m: any) => any;
    trimmedModule: (m: any) => {
        moduleGuid: any;
        moduleEnabled: any;
        moduleIsPublic: any;
        moduleId: any;
        moduleName: any;
        isSysModule: any;
        moduleTypeId: any;
        groupGuid: any;
    };
    constructor();
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
    getAclModule(req: any, res: any, sessionDataExt: ISessionDataExt): Promise<void>;
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
    aclUser$(req: any, res: any, sessionDataExt: ISessionDataExt): Observable<any>;
    /**
     * stream of modules based on AclModuleViewModel and
     * filtered by isEnabled, isPublicModule and isConsumerResource
     * @param req
     * @param res
     * @returns
     */
    aclModule$(req: any, res: any): Observable<Partial<AclModuleMemberViewModel>[]>;
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
    aclModuleMembers$(req: any, res: any, params: any): Observable<any>;
}
//# sourceMappingURL=acl.service.d.ts.map