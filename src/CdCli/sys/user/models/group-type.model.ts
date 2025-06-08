import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { validateOrReject } from 'class-validator';
import { BaseService } from '../../base/base.service.js';

// group_type_id, group_type_name, group_type_guid, doc_id

@Entity({
  name: 'group_type',
  synchronize: false,
})
// @CdModel
export class GroupTypeModel {
  @PrimaryGeneratedColumn({
    name: 'group_type_id',
  })
  groupTypeId?: number;

  @Column({
    name: 'group_type_name',
    length: 20,
  })
  groupTypeName?: string;

  @Column('varchar', {
    name: 'group_type_guid',
    length: 40,
    nullable: true,
  })
  groupTypeGuid?: string;

  @Column({
    name: 'doc_id',
    default: null,
  })
  docId?: number;
}
