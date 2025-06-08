import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'session', synchronize: false })
export class SessionModel {
  @PrimaryGeneratedColumn({
    name: 'session_id',
  })
  sessionId?: number;

  @Column({
    name: 'current_user_id',
    default: 1000,
  })
  // @IsInt()
  currentUserId!: number;

  @Column({
    name: 'cd_token',
  })
  cdToken!: string;

  @Column({
    name: 'start_time',
    default: null,
  })
  // @IsJSON()
  startTime?: string;

  @Column({
    name: 'acc_time',
    default: null,
  })
  // @IsInt()
  accTime?: string;

  @Column({
    default: null,
  })
  // @IsInt()
  ttl?: number;

  @Column({
    default: null,
  })
  active?: boolean;

  @Column('json', {
    name: 'device_net_id',
    default: null,
  })
  // @IsInt()
  deviceNetId?: JSON;

  // consumer_guid:
  @Column({
    name: 'consumer_guid',
    length: 36,
    // default: uuidv4()
  })
  consumerGuid?: string;
}
