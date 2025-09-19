import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { validateOrReject } from 'class-validator';

@Entity({
  name: 'module',
  synchronize: false,
})
// @CdModel
export class ModuleModel {
  @PrimaryGeneratedColumn({
    name: 'module_id',
  })
  moduleId?: number;

  @Column({
    name: 'module_guid',
    length: 36,
    default: uuidv4(),
  })
  moduleGuid?: string;

  @Column('varchar', {
    name: 'module_name',
    length: 50,
    nullable: true,
  })
  moduleName?: string;

  @Column('varchar', {
    name: 'module_description',
    length: 50,
    nullable: true,
  })
  moduleDescription?: string;

  @Column({
    name: 'doc_id',
    nullable: true,
  })
  docId?: number;

  @Column({
    name: 'module_is_public',
    nullable: true,
  })
  moduleIsPublic?: boolean;

  @Column({
    name: 'is_sys_module',
    nullable: true,
  })
  isSysModule?: boolean;

  @Column({
    name: 'module_enabled',
    nullable: true,
  })
  moduleEnabled?: boolean;

  @Column('datetime', {
    name: 'last_modification_date',
    nullable: true,
  })
  lastModificationDate?: string;

  @Column({
    name: 'group_guid',
    length: 36,
    default: null,
  })
  groupGuid?: string;

  @Column({
    name: 'module_type_id',
    nullable: true,
  })
  moduleTypeId?: number;

  @Column({
    name: 'order',
    nullable: true,
  })
  order?: number;
}

export const EnvCreate = {
  ctx: 'Sys',
  m: 'Moduleman',
  c: 'Module',
  a: 'Create',
  dat: {
    token: '',
    f_vals: [
      {
        data: {
          moduleName: '',
          isSysModule: false,
        },
        cdObj: {
          cdObjName: '',
          cdObjTypeGuid: '809a6e31-9fb1-4874-b61a-38cf2708a3bb',
          parentModuleGuid: '04060dfa-fc94-4e3a-98bc-9fbd739deb87',
        },
      },
    ],
  },
  args: null,
};

export const EnvPurge = {
  ctx: 'Sys',
  m: 'Moduleman',
  c: 'Module',
  a: 'PurgeModule',
  dat: {
    token: '',
    f_vals: [
      {
        data: {
          moduleName: '',
        },
      },
    ],
  },
  args: null,
};
