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

// consumer_resource_type_id, consumer_resource_type_name,
// consumer_resource_description, consumer_resource_type_guid, doc_id

@Entity({
  name: 'consumer_type',
  synchronize: false,
})
// @CdModel
export class ConsumerTypeModel {
  @PrimaryGeneratedColumn({
    name: 'consumer_type_id',
  })
  consumerTypeId?: number;

  @Column({
    name: 'consumer_type_guid',
    length: 36,
  })
  consumerTypeGuid?: string;

  @Column('varchar', {
    name: 'consumer_type_name',
    length: 50,
    nullable: true,
  })
  consumerTypeName!: string;

  @Column('varchar', {
    name: 'company_type_description',
    length: 50,
    nullable: true,
  })
  companyTypeDescription!: string;

  @Column('char', {
    name: 'doc_id',
    length: 60,
    default: null,
  })
  docId!: string;

  // HOOKS
  @BeforeInsert()
  @BeforeUpdate()
  async validate() {
    await validateOrReject(this);
  }
}
