import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import type { ICdRequest } from '../../base/i-base.js';

export const defaultCdObjEnv: ICdRequest = {
  ctx: 'Sys',
  m: 'Moduleman',
  c: 'CdObj',
  a: '',
  dat: {
    f_vals: [],
    token: '',
  },
  args: {},
};

@Entity({
  name: 'cd_obj',
  synchronize: false,
})
// @CdModel
export class CdObjModel {
  // b?: BaseService;

  @PrimaryGeneratedColumn({
    name: 'cd_obj_id',
  })
  cdObjId?: number;

  @Column({
    name: 'cd_obj_guid',
    length: 36,
  })
  cdObjGuid?: string;

  @Column('varchar', {
    name: 'cd_obj_name',
    length: 50,
    nullable: true,
  })
  cdObjName!: string;

  @Column('char', {
    name: 'cd_obj_type_guid',
    length: 60,
    default: null,
  })
  cdObjTypeGuid!: string;

  @Column('datetime', {
    name: 'last_sync_date',
    default: null,
  })
  // @IsInt()
  lastSyncDate?: string;

  @Column('datetime', {
    name: 'last_modification_date',
    default: null,
  })
  // @IsInt()
  lastModificationDate?: string;

  @Column({
    name: 'parent_module_guid',
    default: null,
  })
  parentModuleGuid?: string;

  @Column({
    name: 'parent_module_id',
    default: null,
  })
  parentModuleId?: string;

  @Column({
    name: 'parent_class_guid',
    default: null,
  })
  // @IsInt()
  parentClassGuid?: string;

  @Column({
    name: 'parent_obj',
    default: null,
  })
  // @IsInt()
  parentObj?: string;

  @Column('datetime', {
    name: 'cd_obj_disp_name',
    default: null,
  })
  // @IsInt()
  cdObjDispName?: string;

  @Column({
    name: 'obj_id',
    default: null,
  })
  objId?: number;

  @Column({
    name: 'obj_guid',
    default: null,
  })
  objGuid?: string;

  @Column({
    name: 'doc_id',
    default: null,
  })
  docId?: number;

  @Column('bit', {
    name: 'show_name',
    default: null,
  })
  // @IsInt()
  showName?: boolean;

  @Column('varchar', {
    name: 'icon',
    default: null,
  })
  icon?: string;

  @Column('bit', {
    name: 'show_icon',
    default: null,
  })
  showIcon?: boolean;

  @Column('varchar', {
    name: 'curr_val',
    default: null,
  })
  currVal?: string;

  @Column('bit', {
    name: 'cd_obj_enabled',
    default: null,
  })
  cdObjEnabled?: boolean;

  @Column({
    name: 'j_details',
    default: null,
  })
  jDetails?: string | object | null;
}
