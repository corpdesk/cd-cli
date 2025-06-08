import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserModel } from '../../user/models/user.model.js';

@Entity({
  name: 'doc',
  synchronize: false,
})
export class DocModel {
  @PrimaryGeneratedColumn({
    name: 'doc_id',
  })
  docId!: number;

  @Column({
    name: 'doc_guid',
  })
  docGuid!: string;

  @Column({
    name: 'doc_name',
  })
  docName!: string;

  @Column({
    name: 'doc_description',
  })
  docDescription!: string;

  @Column({
    name: 'company_id',
  })
  companyId!: string;

  @Column({
    name: 'doc_from',
  })
  docFrom!: number;

  @Column({
    name: 'doc_type_id',
  })
  docTypeId!: number;

  @Column({
    name: 'doc_date',
  })
  docDate!: string;

  @Column({
    name: 'attach_guid',
  })
  attach_guid!: string;

  @Column({
    name: 'doc_expire_date',
  })
  docExpireDate!: Date;

  @Column({
    name: 'doc_enabled',
  })
  docEnabled!: boolean;

  //   @ManyToOne((type) => UserModel, (user) => user.docs)
  //   @JoinColumn({ name: 'doc_from' })
  //   user!: UserModel;
}
