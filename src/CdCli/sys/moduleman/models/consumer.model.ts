import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { validateOrReject } from 'class-validator';

@Entity({
  name: 'consumer',
  synchronize: false,
})
// @CdModel
export class ConsumerModel {
  @PrimaryGeneratedColumn({
    name: 'consumer_id',
  })
  consumerId?: number;

  @Column({
    name: 'consumer_guid',
    length: 36,
  })
  consumerGuid?: string;

  @Column('varchar', {
    name: 'consumer_name',
    length: 50,
    nullable: true,
  })
  consumerName!: string;

  @Column('tinyint', {
    name: 'consumer_enabled',
    default: null,
  })
  consumerEnabled!: boolean | number | null;

  @Column({
    name: 'doc_id',
    default: null,
  })
  docId?: number;

  @Column({
    name: 'company_id',
    default: null,
  })
  companyId?: number;

  @Column({
    name: 'company_guid',
    default: null,
  })
  companyGuid?: string;
}
