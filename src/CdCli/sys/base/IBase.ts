import {
  DataSource,
  DeleteResult,
  FindOptionsWhere,
  ObjectLiteral,
  UpdateResult,
} from "typeorm";
import { CompanyModel } from "../moduleman/models/company.model.js";
import { ConsumerModel } from "../moduleman/models/consumer.model.js";
import { SessionModel } from "../user/models/session.model.js";
import { IUserProfile, UserModel } from "../user/models/user.model.js";
import { MenuViewModel } from "../moduleman/models/menu-view.model.js";
import { AclModuleViewModel } from "../moduleman/models/acl-module-view.model.js";
import { Observable } from "rxjs";

export interface BaseServiceInterface<T> {
  create: (
    req: Request | null,
    res: Response | null,
    serviceInput: IServiceInput<T>
  ) => Promise<CdFxReturn<T> | T | ICdResponse>;
  read: (
    req: Request | null,
    res: Response | null,
    serviceInput: IServiceInput<T>
  ) => Promise<CdFxReturn<T[]> | T[] | ICdResponse>;
  update: (
    req: Request | null,
    res: Response | null,
    serviceInput: IServiceInput<T>
  ) => Promise<CdFxReturn<UpdateResult> | UpdateResult | ICdResponse>;
  delete: (
    req: Request | null,
    res: Response | null,
    serviceInput: IServiceInput<T>
  ) => Promise<CdFxReturn<DeleteResult> | DeleteResult | ICdResponse>;
}

export abstract class AbstractBaseService<T>
  implements BaseServiceInterface<T>
{
  abstract create(
    req: Request | null,
    res: Response | null,
    serviceInput: IServiceInput<T>
  ): Promise<CdFxReturn<T> | T | ICdResponse>;
  abstract read(
    req: Request | null,
    res: Response | null,
    serviceInput: IServiceInput<T>
  ): Promise<CdFxReturn<T[]> | T[] | ICdResponse>;
  abstract update(
    req: Request | null,
    res: Response | null,
    serviceInput: IServiceInput<T>
  ): Promise<CdFxReturn<UpdateResult> | UpdateResult | ICdResponse>;
  abstract delete(
    req: Request | null,
    res: Response | null,
    serviceInput: IServiceInput<T>
  ): Promise<CdFxReturn<DeleteResult> | DeleteResult | ICdResponse>;
}

/**
 * This is an effort to standardize corpdesk return by a function or method.
 * All corpdesk functions and methods are expected to implement CdFxReturn (progressively)
 * - Consistency Across All Corpdesk Applications
 * - Safer Type Handling
 * - Improved Error Handling
 * interface as a return type.
 * Proposed: 6th Feb 2025
 * Adoption is meant to be progressive over time.
 * The principle if borrowed from Go's tuple returns
 * @data: T | null;
 * @state: boolean;
 * @message?: string; // Optional error/success message
 */
export interface CdFxReturn<T> {
  data?: T | null;
  state: boolean | CdFxStateLevel; // Interpreted through semantic map
  message?: string | null;
}

export enum CdFxStateLevel {
  Error = 0,
  Success = 1,
  PartialSuccess = 2,
  LogicalFailure = 3,
  Warning = 4,
  Recoverable = 5,
  Info = 6,
  Pending = 7,
  Cancelled = 8,
  NotFound = 9,
  NotImplemented = 10,
  SystemError = 11,
  Fatal = 12,
  Unknown = 13,
}

export interface FxStateMeta {
  key: string;
  label: string;
  color?: string;
  icon?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: 'error' | 'success' | 'warning' | 'info';
}

export interface FxStateSemantics {
  mapping: Record<keyof typeof CdFxStateLevel, FxStateMeta>;
}

// ✅ Default returns for each CdFxStateLevel

export const CD_FX_SUCCESS: CdFxReturn<null> = {
  data: null,
  state: CdFxStateLevel.Success,
  message: "Success!",
};

export const CD_FX_FAIL: CdFxReturn<null> = {
  data: null,
  state: CdFxStateLevel.Error,
  message: "Failed!",
};

export const CD_FX_PARTIAL_SUCCESS: CdFxReturn<null> = {
  data: null,
  state: CdFxStateLevel.PartialSuccess,
  message: "Partial success.",
};

export const CD_FX_LOGICAL_FAILURE: CdFxReturn<null> = {
  data: null,
  state: CdFxStateLevel.LogicalFailure,
  message: "Logical failure.",
};

export const CD_FX_WARNING: CdFxReturn<null> = {
  data: null,
  state: CdFxStateLevel.Warning,
  message: "Warning issued.",
};

export const CD_FX_RECOVERABLE: CdFxReturn<null> = {
  data: null,
  state: CdFxStateLevel.Recoverable,
  message: "Recoverable state.",
};

export const CD_FX_INFO: CdFxReturn<null> = {
  data: null,
  state: CdFxStateLevel.Info,
  message: "Informational message.",
};

export const CD_FX_PENDING: CdFxReturn<null> = {
  data: null,
  state: CdFxStateLevel.Pending,
  message: "Pending operation.",
};

export const CD_FX_CANCELLED: CdFxReturn<null> = {
  data: null,
  state: CdFxStateLevel.Cancelled,
  message: "Operation cancelled.",
};

export const CD_FX_NOT_FOUND: CdFxReturn<null> = {
  data: null,
  state: CdFxStateLevel.NotFound,
  message: "Not found.",
};

export const CD_FX_NOT_IMPLEMENTED: CdFxReturn<null> = {
  data: null,
  state: CdFxStateLevel.NotImplemented,
  message: "Not implemented yet.",
};

export const CD_FX_SYSTEM_ERROR: CdFxReturn<null> = {
  data: null,
  state: CdFxStateLevel.SystemError,
  message: "System-level error occurred.",
};

export const CD_FX_FATAL: CdFxReturn<null> = {
  data: null,
  state: CdFxStateLevel.Fatal,
  message: "Fatal error.",
};

export const CD_FX_UNKNOWN: CdFxReturn<null> = {
  data: null,
  state: CdFxStateLevel.Unknown,
  message: "Unknown state or error.",
};

// cd request format
export interface ICdRequest {
  ctx: string;
  m: string;
  c: string;
  a: string;
  dat: EnvelopDat;
  args: any | null;
}

export interface EnvelopDat {
  f_vals: EnvelopFValItem[];
  token: string | null;
}

export interface EnvelopFValItem {
  query?: IQuery | null;
  data?: any;
  extData?: any;
  jsonUpdate?: any;
}

export interface ICdResponse {
  app_state: IAppState;
  data: any;
}

export interface IAppState {
  success: boolean;
  info: IRespInfo | null;
  sess: ISessResp | null;
  cache: object | null;
  sConfig?: IServerConfig;
}

export interface IServerConfig {
  usePush: boolean;
  usePolling: boolean;
  useCacheStore: boolean;
}

export interface IRespInfo {
  messages: string[];
  code: string | null;
  app_msg: string | null;
}

export interface ISessResp {
  cd_token?: string;
  userId?: number | string | null;
  jwt: {
    jwtToken: string | null;
    checked: boolean;
    checkTime: number | null;
    authorized: boolean;
    ttl: number | null;
  } | null;
  ttl: number;
  initUuid?: string;
  initTime?: string;
}

export interface EnvConfig {
  clientAppGuid: string;
  appId: string;
  production: boolean;
  apiEndpoint: string;
  sioEndpoint: string;
  wsEndpoint: string;
  wsMode: string;
  pushConfig: any;
  consumerToken?: string; // current company consumer. To depricate in favour of clientContext which will include consumerToken, entity:eg company name or project name eg ASDAP, MPEP etc
  clientContext: any;
  USER_RESOURCES: string;
  apiHost: string;
  shellHost: string;
  sioHost: string;
  CD_PORT?: number; // optional setting for apiEndpoint
  consumer: string;
  clientAppId: number; // this client application identifies itself to the server with this id
  SOCKET_IO_PORT: number; // push server port
  defaultauth?: string;
  mfManifestPath?: string;
  apiOptions?: any;
  sioOptions?: any;
  wsOptions?: any;
  initialPage?: string;
  firebaseConfig?: any;
}

export const SYS_CTX = "Sys";
export const DEFAULT_DAT: EnvelopDat = {
  f_vals: [
    {
      query: null,
      data: null,
    },
  ],
  token: null,
};

export const DEFAULT_ARGS = {};

export const DEFAULT_ENVELOPE_CREATE: ICdRequest = {
  ctx: SYS_CTX,
  m: "",
  c: "",
  a: "Create",
  dat: DEFAULT_DAT,
  args: DEFAULT_ARGS,
};

export const DEFAULT_ENVELOPE_GET: ICdRequest = {
  ctx: SYS_CTX,
  m: "",
  c: "",
  a: "Get",
  dat: DEFAULT_DAT,
  args: DEFAULT_ARGS,
};

export const DEFAULT_ENVELOPE_GET_PAGED: ICdRequest = {
  ctx: SYS_CTX,
  m: "",
  c: "",
  a: "GetCount",
  dat: DEFAULT_DAT,
  args: DEFAULT_ARGS,
};

export const DEFAULT_ENVELOPE_GET_TYPE: ICdRequest = {
  ctx: SYS_CTX,
  m: "",
  c: "",
  a: "GetCount",
  dat: DEFAULT_DAT,
  args: DEFAULT_ARGS,
};

export const DEFAULT_ENVELOPE_UPDATE: ICdRequest = {
  ctx: SYS_CTX,
  m: "",
  c: "",
  a: "Update",
  dat: DEFAULT_DAT,
  args: DEFAULT_ARGS,
};

export const DEFAULT_ENVELOPE_DELETE: ICdRequest = {
  ctx: SYS_CTX,
  m: "",
  c: "",
  a: "Delete",
  dat: DEFAULT_DAT,
  args: DEFAULT_ARGS,
};

export interface CdResponse {
  app_state: IAppState;
  data: any[];
}

////////////////////

export const DEFAULT_CD_RESPONSE: ICdResponse = {
  app_state: {
    success: false,
    info: {
      messages: [],
      code: "",
      app_msg: "",
    },
    sess: {
      cd_token: "",
      jwt: null,
      ttl: 600,
    },
    cache: {},
  },
  data: [],
};

export const DEFAULT_CD_REQUEST: ICdRequest = {
  ctx: "Sys",
  m: "",
  c: "",
  a: "",
  dat: DEFAULT_DAT,
  args: DEFAULT_ARGS,
};

// cd request format
export interface CdRequest {
  ctx: string;
  m: string;
  c: string;
  a: string;
  dat: object;
  args: object;
}

export interface IControllerContext {
  path: string;
  clsName: string;
  action: string;
}

export interface IModelRules {
  create: object;
  update: object;
  remove: object;
}

// custom json update
export interface IJsonUpdate {
  modelField?; // name of the json column. Capacity to update multiple json columns in a given row
  path: any; // path to a target item in JSON data
  value: any; // value to apply to a tarteg item
}

export enum ModuleScope {
  Sys = 0,
  App = 1,
}

export interface ICdPushEnvelop {
  pushData: {
    appId?: string;
    appSockets?: ISocketItem[];
    pushGuid: string;
    m?: any;
    pushRecepients: ICommConversationSub[];
    triggerEvent: string;
    emittEvent: string;
    token: string;
    commTrack: CommTrack;
    isNotification: boolean | null;
    isAppInit?: boolean | null;
  };
  req: ICdRequest | null;
  resp: ICdResponse | null;
}

export interface ISocketItem {
  socketId: string;
  name: string;
  socketGuid?: string;
}

export interface LsFilter {
  storageType: StorageType;
  cdObjId?: CdObjId;
  appState?: IAppState;
}

// export interface ICdPushEnvelop {
//     pushData: {
//         appId: string;
//         socketScope: string;
//         pushGuid: string;
//         m?: string;
//         pushRecepients: ICommConversationSub[];
//         triggerEvent: string;
//         emittEvent: string;
//         token: string;
//         commTrack: CommTrack;
//         isNotification: boolean | null;
//     },
//     req: ICdRequest | null,
//     resp: ICdResponse | null
// };

// export interface IPushRecepient {
//     userId: number;
//     subTypeId: number;
//     room?: string;
// }

// export interface IServiceInput {
//   primaryKey?: string; // primary key of the subject model
//   serviceInstance?: any; // handle of the subject service
//   serviceModel: any; // subject model
//   mapping?: any;
//   serviceModelInstance?: any; // instance of subject model
//   docName?: string;
//   cmd?: Cmd;
//   data?: any;
//   dSource?: DataSource;
//   extraInfo?: boolean;
//   modelName?: string;
//   modelPath?: string;
//   fetchInput?: IFetchInput;
// }
export interface IServiceInput<T> {
  primaryKey?: string;
  serviceInstance?: any;
  serviceModel: new () => T; // Ensure serviceModel is a class
  mapping?: any;
  serviceModelInstance?: T;
  docName?: string;
  cmd?: Cmd<T>;
  data?: Partial<T>;
  dSource?: number | DataSource; // Now accepts a TypeORM DataSource instance
  extraInfo?: boolean;
  modelName?: string;
  modelPath?: string;
  fetchInput?: IFetchInput;
}

export interface IFetchInput {
  url: string;
  optins?: {
    method?: string;
    body?: string;
    headers?: {
      "Content-Type"?: string;
      "X-Parse-Application-Id"?: string;
      "X-Parse-REST-API-Key"?: string;
    };
  };
}

export interface Cmd<T> {
  action?: string;
  query: IQuery | IQbInput<T>;
}

// export interface IQuery {
//   select?: string[];
//   update?: object | null;
//   where: object;
//   take?: number;
//   skip?: number;
// }
// export interface IQuery {
//   select?: string[];
//   update?: Partial<ObjectLiteral> | null;
//   where: Partial<ObjectLiteral>;
//   distinct?: boolean;
//   take?: number;
//   skip?: number;
// }
export interface IQuery {
  select?: string[];
  update?: ObjectLiteral | null;
  where: IQueryWhere;
  jsonUpdate?: IJsonUpdate[];
  distinct?: boolean;
  take?: number;
  skip?: number;
  jFilters?: IJFilter[];
  order?: any;
  class?: string;
  extData?: any; // any extra data
}

// Recursive support for nested 'andWhere' and 'orWhere'
export interface IQueryWhere {
  andWhere?: Array<IQueryWhere | { [field: string]: any }>;
  orWhere?: Array<IQueryWhere | { [field: string]: any }>;

  // legacy-compatible flat conditions
  [field: string]: any;
}

// custom json update
export interface IJsonUpdate {
  modelField?; // name of the json column. Capacity to update multiple json columns in a given row
  path: any; // path to a target item in JSON data
  value: any; // value to apply to a tarteg item
}

// json field filter
export interface IJFilter {
  jField: string;
  jPath: string;
  pathValue: any;
}

export interface QueryInput {
  select?: string[];
  where?: any; // Already exists, but we'll use it for dynamic WHERE conditions
  update?: Record<string, any>; // New property to specify which fields to update
  take?: number;
  skip?: number;
}

// query builder input
// export interface IQbInput {
//   select?: string[];
//   update?: object;
//   where: IQbFilter[];
//   distinct?: boolean;
//   take?: number;
//   skip?: number;
// }

/**
 * This interface was designed to handle QueryBuilder based input
 * 10/10/2025
 * Note that FindOptionsWhere<T>; has replaced IQbFilter[]
 * At the time of writing this, the modification is yet to be tested.
 * Confirmation of this change will be done after testing.
 */
export interface IQbInput<T> {
  select?: string[];
  update?: object;
  where: FindOptionsWhere<T>; // Change from IQbFilter[] to FindOptionsWhere<T>
  distinct?: boolean;
  take?: number;
  skip?: number;
}

// query builder filter
export interface IQbFilter {
  field: string;
  operator: string;
  val: string;
  conjType?: string;
  dataType: string;
  jPath?: string;
}

export interface IFetchInput {
  url: string;
  optins?: {
    method?: string;
    body?: string;
    headers?: {
      "Content-Type"?: string;
      "X-Parse-Application-Id"?: string;
      "X-Parse-REST-API-Key"?: string;
    };
  };
}

export interface IDoc {
  docId?: number;
  docGuid?: string;
  docName?: string;
  docDescription?: string;
  companyId?: number;
  docFrom: number;
  docTypeId: number;
  docDate?: Date;
  attachGuid?: string;
  docExpireDate?: Date;
}

export type ClassRef = new (...args: any[]) => any;
export type Fn = () => void;

export interface IUser {
  userID: number;
  userGUID: string;
  userName: string;
}
export interface IBase {
  cdToken?: string;
  cRules: object;
  uRules: object;
  dRules: object;
}

// export interface ICommConversationSub {
//     userId: number; // subscriber userId
//     subTypeId: number; // type of subscriber
//     commconversationId?: number;
//     commconversationsubId?: number;
//     commconversationsubInvited?: boolean;
//     commconversationsubAccepted?: boolean;
//     groupId?: number; // can be used to represent chat room in websocket service
//     // commTrack: CommTrack;
//     cdObjId: CdObjId;
// }
export interface ICommConversationSub {
  userId: number; // subscriber userId
  subTypeId: number; // type of subscriber
  commconversationId?: number;
  commconversationsubId?: number;
  commconversationsubInvited?: boolean;
  commconversationsubAccepted?: boolean;
  groupId?: number; // can be used to represent chat room in websocket service
  // commTrack: CommTrack;
  cdObjId: CdObjId;
}

// export interface CommTrack {
//     initTime: number | null,
//     relayTime: number | null,
//     relayed: boolean,
//     deliveryTime: number | null,
//     deliverd: boolean,
// }

export interface CommTrack {
  initTime: number | string | null;
  relayTime: number | string | null;
  pushed: boolean;
  pushTime: number | string | null;
  relayed: boolean;
  deliveryTime: number | string | null;
  delivered: boolean;
  completed?: boolean;
  completedTime?: number | string | null;
  cached?: boolean;
  cachedTime?: number | string | null;
  saved?: boolean;
  savedTime?: number | string | null;
}

export interface CdObjId {
  appId: string;
  ngModule: string | null;
  resourceName: string | null;
  resourceGuid: string | null;
  jwtToken: string | null;
  socket: any;
  socketId?: string;
  commTrack: CommTrack | null;
}

export enum StorageType {
  CdObjId = 0,
  IAppState = 1,
}

export interface LsFilter {
  storageType: StorageType;
  cdObjId?: CdObjId;
  appState?: IAppState;
}

export const DEFAULT_COMM_TRACK = {
  initTime: null,
  relayTime: null,
  relayed: false,
  deliveryTime: null,
  deliverd: false,
  pushed: false,
  pushTime: null,
  delivered: false,
};

export interface IAclCtx {
  memberGuid: string;
  moduleGroupGuid: any;
  consumerId: number;
  moduleName: string;
  currentUser: any;
  module: any;
}

export interface IAclRole {
  aclRoleName?: string;
  permissions?: IAclPermission;
}

export interface IAclPermission {
  userPermissions: IPermissionData[];
  groupPermissions: IPermissionData[];
}

/**
 * Improved versin should have just one interface and
 * instead of userId or groupId, cdObjId is applied.
 * This would then allow any object permissions to be set
 * Automation and 'role' concept can then be used to manage permission process
 */
export interface IPermissionData {
  cdObjId: number;
  hidden: boolean;
  field: string;
  read: boolean;
  write: boolean;
  execute: boolean;
}

// export const controlFormatt = {
//   text: ['', [Validators.required]],
//   textDisabled: ['', [Validators.required]],
//   email: [
//     '',
//     [
//       Validators.required,
//       Validators.pattern('[a-z0-9._%+-]+@[a-z0-9.-]+.[a-z]{2,3}$'),
//     ],
//   ],
//   url: ['', [Validators.required, Validators.pattern('https?://.+')]],
//   digits: ['', [Validators.required, Validators.pattern('[0-9]+')]],
//   number: ['', [Validators.required, Validators.pattern('[0-9]+')]],
//   alphanum: ['', [Validators.required, Validators.pattern('[a-zA-Z0-9]+')]],
//   textarea: ['', [Validators.required]],
//   password: ['', [Validators.required, Validators.minLength(6)]],
//   confirmpwd: ['', Validators.required],
// };

export enum FieldType {
  number = 0,
  string = 1,
  boolean = 2,
  date = 3,
  json = 4,
  enum = 5,
  action = 6,
  geoLocation = 7,
  decimal = 8,
  any = 9,
}

export const INIT_CD_RESP = {
  app_state: {
    success: false,
    info: {
      messages: [],
      code: "",
      app_msg: "",
    },
    sess: {
      cd_token: null,
      jwt: null,
      ttl: 0,
    },
    cache: {},
  },
  data: null,
};

export interface CacheData {
  key: string;
  value?: string;
  initUuid?: string;
  initTime?: string;
}

export interface ILoginData {
  consumer: IConsumer[];
  menuData: IMenuItem[];
  userData: IUserData;
}

export interface ISelectedMenu {
  moduleMenuData?: MenuViewModel[];
  selectedItem: MenuViewModel;
  selectedId?: number;
}

export interface IAllowedModules {
  modules$: Observable<AclModuleViewModel[]>;
  modulesCount: number;
}

export interface IMenuRelations {
  menuParent: MenuViewModel;
  menuChildren: MenuViewModel[];
}

export interface IConsumer {
  consumerId: number | string;
  consumerGuid: string;
  consumerName: string;
  consumerEnabled: number | string | null;
  docId: number | string | null;
  companyId: number | string | null;
  companyGuid: string | null;
}

export interface IMenuItem {
  menuLabel: string | null;
  menuId: number;
  icon: string | null;
  path: string | null;
  isTitle: string | null;
  badge: string | null;
  menuParentId: number | string | null;
  isLayout: number | boolean | null;
  moduleIsPublic: number | string | null;
  moduleGuid: string | null;
  children: IMenuItem[];
}

export interface IUserData {
  userId: number | string;
  userGuid: string | null;
  userName: string | null;
  email: string | null;
  companyId: number | string | null;
  docId: number | string | null;
  mobile: number | string | null;
  gender: number | string | null;
  birthDate: string | null;
  postalAddr: string | null;
  fName: string | null;
  mName: string | null;
  lName: string | null;
  nationalId: number | string | null;
  passportId: number | string | null;
  userEnabled: boolean | number | null;
  zipCode: string | null;
  activationKey: string | null;
  userTypeId: number | string | null;
}

export type SearchTerm = { term: string } | string;

export interface ExecOptions {
  cwd?: string; // Optional working directory
  env?: NodeJS.ProcessEnv; // Optional environment variables
  mode?: "sync" | "async"; // Execution mode
}

export interface ISessionDataExt {
  currentUser: UserModel;
  currentUserProfile: IUserProfile;
  currentSession: SessionModel;
  currentConsumer: ConsumerModel;
  currentCompany: CompanyModel;
}

export interface CreateIParams<T> {
  serviceInput: IServiceInput<T>;
  controllerData: any;
}

export interface ObjectItem {
  key: string;
  value: any;
}

/**
 * triggerEvent: the servier event to handle a given message
 * emittEvent: the event that handles message at the client
 * sFx: server function that handles a given message
 * cFx: client function that handles a given message
 * extDat: extra data
 */
export interface PushEvent {
  triggerEvent: string;
  emittEvent: string;
  sFx?: string;
  cFx?: string;
}

/// ColumnNumericTransformer
export class ColumnNumericTransformer {
  to(data: number): number {
    return data;
  }
  from(data: string): number {
    return parseFloat(data);
  }
}
