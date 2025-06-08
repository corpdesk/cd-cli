import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { validateOrReject } from 'class-validator';

@Entity({
  name: 'consumer_resource_type',
  synchronize: false,
})
export class ConsumerResourceTypeModel {
  @PrimaryGeneratedColumn({
    name: 'consumer_resource_type_id',
  })
  consumerResourceTypeId?: number;

  @Column({
    name: 'consumer_resource_type_guid',
    length: 36,
    default: uuidv4(),
  })
  consumerResourceTypeGuid?: string;

  @Column({
    name: 'consumer_resource_type_name',
    length: 20,
  })
  consumerResourceTypeName?: string;

  // consumer_resource_description
  @Column({
    name: 'consumer_resource_type_description',
    length: 200,
  })
  consumerResourceTypeDescription?: string;

  @Column({
    name: 'doc_id',
    default: null,
  })
  docId?: number;
}
