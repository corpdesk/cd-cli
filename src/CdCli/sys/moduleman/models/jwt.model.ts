import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity({
  name: 'jwt',
  synchronize: false,
})
// @CdModel
export class JwtModel {
  @PrimaryGeneratedColumn({
    name: 'jwt_id',
  })
  jwtId?: number;

  @Column({
    name: 'jwt_guid',
    length: 36,
  })
  jwtGuid?: string;

  @Column({
    name: 'jwt_type_id',
    length: 60,
    default: null,
  })
  jwtTypeId!: string;

  @Column('varchar', {
    name: 'jwt_name',
    length: 50,
    nullable: true,
  })
  jwtName!: string;

  @Column('varchar', {
    name: 'jwt_description',
    length: 50,
    nullable: true,
  })
  jwtDescription!: string;

  @Column({
    name: 'doc_id',
    length: 60,
    default: null,
  })
  docId!: string;
}
