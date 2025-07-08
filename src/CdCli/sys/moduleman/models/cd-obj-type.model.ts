import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity({
  name: 'cd_obj_type',
  synchronize: false,
})
// @CdModel
export class CdObjTypeModel {
  @PrimaryGeneratedColumn({
    name: 'cd_obj_type_id',
  })
  cdObjTypeId?: number;

  @Column({
    name: 'cd_obj_type_guid',
    length: 36,
  })
  cdObjTypeGuid?: string;

  @Column('varchar', {
    name: 'cd_obj_type_name',
    length: 50,
    nullable: true,
  })
  cdObjTypeName!: string;

  @Column({
    name: 'doc_id',
  })
  docId?: number;

  @Column( {
    name: 'mod_craft_controller',
  })
  modCraftController?: string;

}
