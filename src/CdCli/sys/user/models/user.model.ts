import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { ICdRequest } from '../../base/IBase.js';
import { DEFAULT_ARGS, DEFAULT_DAT, SYS_CTX } from '../../base/IBase.js';
import { UserController } from '../controllers/user.controller.js';
import { BaseService } from '../../base/base.service.js';

// export const SESSION_FILE_STORE = 'session.json';

export interface IUserModel {
  userId?: number;
  userGuid?: string;
  userName: string;
  password?: string;
  email?: string;
  companyId?: number;
  docId?: number;
  mobile?: string;
  gender?: number;
  birthDate?: string;
  postalAddr?: string;
  fName?: string;
  mName?: string;
  lName?: string;
  nationalId?: number;
  passportId?: number;
  userEnabled?: boolean | number;
  zipCode?: string;
  activationKey?: string;
  userTypeId?: number;
  userProfile?: string;
}

DEFAULT_DAT.f_vals[0].data = {
  userName: '',
  password: '',
} as IUserModel;

export const DEFAULT_ENVELOPE_LOGIN: ICdRequest = {
  ctx: SYS_CTX,
  m: 'User',
  c: 'User',
  a: 'Login',
  dat: DEFAULT_DAT,
  args: DEFAULT_ARGS,
};

// user.controller.ts
export const LOGIN_CMD = {
  name: 'login',
  description: 'Log in to the system.',
  options: [
    { flags: '-u, --user <username>', description: 'Username' },
    { flags: '-p, --password <password>', description: 'Password' },
  ],
  action: {
    execute: async (options: any) => {
      const userController = new UserController();
      const { user, password } = options;
      await userController.auth(user, password); // Password is now optional
    },
  },
};

export const LOGOUT_CMD = {
  name: 'logout',
  description: 'Log out from the system.',
  action: {
    execute: () => {
      const userController = new UserController();
      userController.logout();
    },
  },
};

//////////////////////////////////////////////////////
@Entity({
  name: 'user',
  synchronize: false,
})

export class UserModel {
  @PrimaryGeneratedColumn({
    name: 'user_id',
  })
  userId?: number;

  @Column({
    name: 'user_guid',
    length: 36,
  })
  userGuid?: string;

  @Column('varchar', {
    name: 'user_name',
    length: 50,
    nullable: true,
  })
  userName!: string;

  @Column('char', {
    name: 'password',
    length: 60,
    default: null,
  })
  password?: string;

  @Column('varchar', {
    length: 60,
    unique: true,
    nullable: true,
  })
  @Column()
  email?: string;

  @Column({
    name: 'company_id',
    default: null,
  })
  // @IsInt()
  companyId?: number;

  @Column({
    name: 'doc_id',
    default: null,
  })
  // @IsInt()
  docId?: number;

  @Column({
    name: 'mobile',
    default: null,
  })
  mobile?: string;

  @Column({
    name: 'gender',
    default: null,
  })
  gender?: number;

  @Column({
    name: 'birth_date',
    default: null,
  })
  // @IsDate()
  birthDate?: Date;

  @Column({
    name: 'postal_addr',
    default: null,
  })
  postalAddr?: string;

  @Column({
    name: 'f_name',
    default: null,
  })
  fName?: string;

  @Column({
    name: 'm_name',
    default: null,
  })
  mName?: string;

  @Column({
    name: 'l_name',
    default: null,
  })
  lName?: string;

  @Column({
    name: 'national_id',
    default: null,
  })
  // @IsInt()
  nationalId?: number;

  @Column({
    name: 'passport_id',
    default: null,
  })
  // @IsInt()
  passportId?: number;

  @Column({
    name: 'user_enabled',
    default: null,
  })
  userEnabled?: boolean;

  @Column('char', {
    name: 'zip_code',
    length: 5,
    default: null,
  })
  zipCode?: string;

  @Column({
    name: 'activation_key',
    length: 36,
  })
  activationKey?: string;

  @Column({
    name: 'user_type_id',
    default: null,
  })
  userTypeId?: number;

  @Column({
    name: 'user_profile',
    default: null,
  })
  userProfile?: string;

  // @OneToMany((type) => DocModel, (doc) => doc.user) // note: we will create user property in the Docs class
  // docs?: DocModel[];

  // HOOKS
  // @BeforeInsert()
  // @BeforeUpdate()
  // async validate?() {
  //   await validateOrReject(this);
  // }
}

export interface IUserProfileAccess {
  userPermissions?: IProfileUserAccess[];
  groupPermissions?: IProfileGroupAccess[];
}

/**
 * Improved versin should have just one interface and
 * instead of userId or groupId, cdObjId is applied.
 * This would then allow any object permissions to be set
 * Automation and 'role' concept can then be used to manage permission process
 */
export interface IProfileUserAccess {
  userId: number;
  hidden: boolean;
  field: string;
  read: boolean;
  write: boolean;
  execute: boolean;
}

export interface IProfileGroupAccess {
  groupId: number;
  field: string;
  hidden: boolean;
  read: boolean;
  write: boolean;
  execute: boolean;
}

export interface IUserProfile {
  fieldPermissions?: IUserProfileAccess;
  avatar?: string; // URL or base64-encoded image
  userData: UserModel;
  areasOfInterest?: string[];
  bio?: string;
  affiliatedInstitutions?: string[];
  following?: string[]; // Limit to X entries (e.g., 1000) to avoid abuse
  followers?: string[]; // Limit to X entries (e.g., 1000)
  friends?: string[]; // Limit to X entries (e.g., 500)
  groups?: string[]; // Limit to X entries (e.g., 100)
}

export const profileDefaultConfig = [
  {
    path: ['fieldPermissions', 'userPermissions', ['userName']],
    value: {
      userId: 1000,
      field: 'userName',
      hidden: false,
      read: true,
      write: false,
      execute: false,
    },
  },
  {
    path: ['fieldPermissions', 'groupPermissions', ['userName']],
    value: {
      groupId: 0,
      field: 'userName',
      hidden: false,
      read: true,
      write: false,
      execute: false,
    },
  },
];

/**
 * the data below can be managed under with 'roles'
 * there needs to be a function that set the default 'role' for a user
 */
export const userProfileDefault: IUserProfile = {
  fieldPermissions: {
    /**
     * specified permission setting for given users to specified fields
     */
    userPermissions: [
      {
        userId: 1000,
        field: 'userName',
        hidden: false,
        read: true,
        write: false,
        execute: false,
      },
    ],
    groupPermissions: [
      {
        groupId: 0, // "_public"
        field: 'userName',
        hidden: false,
        read: true,
        write: false,
        execute: false,
      },
    ],
  },
  userData: {
    userName: '',
    fName: '',
    lName: '',
  },
};
function uuidv4(): any {
  throw new Error('Function not implemented.');
}
