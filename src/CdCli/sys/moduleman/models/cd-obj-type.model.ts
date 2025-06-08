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

  @Column('char', {
    name: 'doc_id',
    length: 60,
    default: null,
  })
  docId?: string;

  // HOOKS
  // @BeforeInsert()
  // @BeforeUpdate()
  // async validate() {
  //     await validateOrReject(this);
  // }
}
