import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity({
  name: 'doc_type',
  synchronize: false,
})
export class DocTypeModel {
  @PrimaryGeneratedColumn({
    name: 'doc_type_id',
  })
  docTypeId!: number;

  @Column({
    name: 'doc_type_name',
  })
  docTypeName!: string;

  @Column({
    name: 'module_guid',
  })
  moduleGuid!: string;

  @Column({
    name: 'doc_guid',
  })
  docGuid!: string;

  @Column({
    name: 'doc_id',
  })
  docId!: number;

  @Column({
    name: 'doc_type_controller',
  })
  docTypeController!: string;

  @Column({
    name: 'doc_type_action',
  })
  docTypeAction!: string;

  @Column({
    name: 'doc_type_enabled',
  })
  docTypeEnabled!: boolean;

  @Column({
    name: 'enable_notification',
  })
  enableNotification!: boolean;

  @Column({
    name: 'nk_name',
  })
  nkName!: string;

  @Column({
    name: 'doc_type_icon',
  })
  docTypeIcon!: string;
}
