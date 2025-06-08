import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Generated,
  BeforeInsert,
  BeforeUpdate,
  IsNull,
  Not,
  UpdateDateColumn,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import {
  validate,
  validateOrReject,
  Contains,
  IsInt,
  Length,
  IsEmail,
  IsFQDN,
  IsDate,
  Min,
  Max,
  IsJSON,
} from 'class-validator';

@Entity()
export class SchedulerModel {
  @PrimaryGeneratedColumn()
  commId?: number;

  @Column({
    length: 36,
    default: uuidv4(),
  })
  commGuid?: string;

  @Column('varchar', {
    length: 50,
    nullable: true,
  })
  commName?: string;
}
