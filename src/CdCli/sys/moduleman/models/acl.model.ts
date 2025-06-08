import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { validateOrReject } from 'class-validator';

@Entity({
  name: 'acl',
  synchronize: false,
})
// @CdModel
export class AclModel {
  @PrimaryGeneratedColumn({
    name: 'acl_id',
  })
  aclId?: number;

  @Column({
    name: 'acl_guid',
    length: 36,
    default: uuidv4(),
  })
  aclGuid?: string;

  @Column('varchar', {
    name: 'acl_name',
    length: 50,
    nullable: true,
  })
  aclName?: string;

  @Column('char', {
    name: 'acl_type_guid',
    length: 60,
    default: null,
  })
  cdObjTypeGuid?: string;

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
  // @IsInt()
  parentModuleGuid?: string;

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
    name: 'acl_disp_name',
    default: null,
  })
  // @IsInt()
  cdObjDispName?: string;

  @Column({
    name: 'doc_id',
    default: null,
  })
  // @IsInt()
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
  // @IsInt()
  icon?: string;

  @Column('bit', {
    name: 'show_icon',
    default: null,
  })
  // @IsInt()
  showIcon?: boolean;

  @Column('varchar', {
    name: 'curr_val',
    default: null,
  })
  // @IsInt()
  currVal?: string;

  @Column('bit', {
    name: 'enabled',
    default: null,
  })
  // @IsInt()
  enabled?: boolean;

  // @OneToMany(type => DocModel, doc => doc.user) // note: we will create user property in the Docs class
  // docs: DocModel[];

  // // HOOKS
  // @BeforeInsert()
  // @BeforeUpdate()
  // async validate() {
  //     await validateOrReject(this);
  // }
}
