import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { validateOrReject } from 'class-validator';

@Entity({
  name: 'consumer_resource',
  synchronize: false,
})
export class ConsumerResourceModel {
  @PrimaryGeneratedColumn({
    name: 'consumer_resource_id',
  })
  consumerResourceId?: number;

  @Column({
    name: 'consumer_resource_guid',
    length: 40,
    default: uuidv4(),
  })
  consumerResourceGuid?: string;

  @Column({
    name: 'consumer_resource_name',
    default: null,
  })
  consumerResourceName?: string;

  @Column({
    name: 'doc_id',
    default: null,
  })
  docId?: number;

  @Column({
    name: 'cd_obj_type_id',
    default: null,
  })
  cdObjTypeId?: number;

  @Column({
    name: 'consumer_resource_enabled',
    default: null,
  })
  consumerResourceEnabled?: boolean;

  @Column({
    name: 'consumer_id',
    default: null,
  })
  consumerId?: number;

  @Column({
    name: 'obj_id',
    default: null,
  })
  objId?: number;

  @Column({
    name: 'cd_obj_id',
    default: null,
  })
  cdObjId?: number;

  @Column({
    name: 'consumer_resource_type_id',
    default: null,
  })
  consumerResourceTypeId?: number;

  @Column({
    name: 'consumer_guid',
    length: 40,
    default: uuidv4(),
  })
  consumerGuid?: string;

  @Column({
    name: 'obj_guid',
    length: 40,
    default: uuidv4(),
  })
  objGuid?: string;

  @Column({
    name: 'cd_obj_type_guid',
    length: 40,
    default: uuidv4(),
  })
  cdObjTypeGuid?: string;

  @Column({
    name: 'consumer_resource_type_guid',
    length: 40,
    default: uuidv4(),
  })
  consumerResourceTypeGuid?: string;

  @Column({
    name: 'cd_obj_guid',
    length: 40,
    default: uuidv4(),
  })
  cdObjGuid?: string;

  @Column({
    name: 'consumer_resource_icon',
  })
  consumerResourceIcon?: string;

  @Column({
    name: 'consumer_resource_link',
  })
  consumerResourceLink?: string;
}
