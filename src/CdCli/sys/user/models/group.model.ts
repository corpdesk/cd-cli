import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { validateOrReject } from 'class-validator';

@Entity({
  name: 'group',
  synchronize: false,
})
// @CdModel
export class GroupModel {
  @PrimaryGeneratedColumn({
    name: 'group_id',
  })
  groupId?: number;

  @Column({
    name: 'group_guid',
    length: 36,
    default: uuidv4(),
  })
  groupGuid?: string;

  @Column('varchar', {
    name: 'group_name',
    length: 50,
    nullable: true,
  })
  groupName?: string;

  @Column('varchar', {
    name: 'group_description',
    length: 50,
    nullable: true,
  })
  groupDescription?: string;

  @Column({
    name: 'doc_id',
    nullable: true,
  })
  docId?: number;

  @Column({
    name: 'group_owner_id',
    nullable: true,
  })
  groupOwnerId?: number;

  @Column({
    name: 'group_type_id',
    nullable: true,
  })
  groupTypeId?: number;

  @Column({
    name: 'module_guid',
    length: 36,
    default: uuidv4(),
  })
  moduleGuid?: string;

  @Column({
    name: 'company_id',
    nullable: true,
  })
  companyId?: number;

  @Column({
    name: 'consumer_guid',
    length: 36,
    default: uuidv4(),
  })
  consumerGuid?: string;

  @Column({
    name: 'group_is_public',
    nullable: true,
  })
  groupIsPublic?: boolean;

  @Column({
    name: 'group_enabled',
    nullable: true,
  })
  groupEnabled?: boolean;
}
