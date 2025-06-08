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

// company_type_id, company_type_name, company_type_description,
// usedIn_asset_registration, directory_categories, company_type_guid, doc_id, parent_id

@Entity({
  name: 'company_type',
  synchronize: false,
})
// @CdModel
export class CompanyTypeModel {
  @PrimaryGeneratedColumn({
    name: 'company_type_id',
  })
  companyTypeId?: number;

  @Column({
    name: 'company_type_guid',
    length: 36,
  })
  companyTypeGuid?: string;

  @Column('varchar', {
    name: 'company_type_name',
    length: 50,
    nullable: true,
  })
  companyTypeName!: string;

  @Column('varchar', {
    name: 'company_type_description',
    length: 50,
    nullable: true,
  })
  companyTypeDescription!: string;

  @Column({
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
