import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { validateOrReject } from 'class-validator';

@Entity({
  name: 'menu',
  synchronize: false,
})
// @CdModel
export class MenuModel {
  @PrimaryGeneratedColumn({
    name: 'menu_id',
  })
  menuId?: number;

  @Column({
    name: 'menu_guid',
    length: 36,
    default: uuidv4(),
  })
  menuGuid?: string;

  @Column('varchar', {
    name: 'menu_name',
    length: 50,
    nullable: true,
  })
  menuName?: string;

  @Column('varchar', {
    name: 'menu_description',
    length: 500,
    nullable: true,
  })
  menuDescription?: string;

  @Column('varchar', {
    name: 'menu_closet_file',
    length: 300,
    nullable: true,
  })
  menuClosetFile?: string;

  @Column({
    name: 'menu_action_id',
    nullable: true,
  })
  menuActionId?: number;

  @Column({
    name: 'cd_obj_id',
    nullable: true,
  })
  cdObjId?: number;

  @Column({
    name: 'menu_enabled',
    nullable: true,
  })
  menuEnabled?: boolean;

  @Column({
    name: 'menu_parent_id',
    nullable: true,
  })
  menuParentId?: number;

  @Column({
    name: 'doc_id',
    nullable: true,
  })
  docId?: number;

  @Column({
    name: 'module_id',
    nullable: true,
  })
  moduleId?: number;

  @Column({
    name: 'menu_order',
    nullable: true,
  })
  menuOrder?: number;

  @Column('varchar', {
    name: 'path',
    length: 50,
    nullable: true,
  })
  path?: string;

  @Column('varchar', {
    name: 'menu_description',
    length: 300,
    nullable: true,
  })
  @Column('varchar', {
    name: 'menu_lable',
    length: 300,
    nullable: true,
  })
  menuLable?: string;

  @Column('varchar', {
    name: 'menu_icon',
    length: 300,
    nullable: true,
  })
  menuIcon?: string;

  @Column({
    name: 'icon_type',
    nullable: true,
  })
  iconType?: string;

  @Column({
    name: 'group',
    nullable: true,
  })
  group?: number;

  @Column({
    name: 'is_title',
    nullable: true,
  })
  isTitle?: boolean;

  @Column({
    name: 'badge',
    nullable: true,
  })
  badge?: string;

  @Column({
    name: 'is_layout',
    nullable: true,
  })
  isLayout?: boolean;

  // @Column(
  //     {
  //         name: 'menu_is_public',
  //         nullable: true
  //     }
  // )
  // menuIsPublic?: boolean | number;

  @Column({
    name: 'menu_is_public',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  menuIsPublic?: number;
}
