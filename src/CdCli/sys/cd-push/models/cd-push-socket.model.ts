import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

// SELECT cd_push_socket_id, cd_push_socket_guid, cd_push_socket_name, cd_push_socket_description, doc_id, cd_push_socket_type_id, `data`
// FROM cd1213.cd_push_socket;

@Entity({
  name: 'cd_push_socket',
  synchronize: false,
})
// @CdModel
export class CdPushSocketModel {
  @PrimaryGeneratedColumn({
    name: 'cd_push_socket_id',
  })
  cdPushSocketId?: number;

  @Column({
    name: 'cd_push_socket_guid',
    length: 36,
  })
  cdPushSocketGuid?: string;

  @Column('varchar', {
    name: 'cd_push_socket_name',
    length: 50,
    nullable: true,
  })
  cdPushSocketName!: string;

  @Column('varchar', {
    name: 'cd_push_socket_type_guid',
    length: 40,
    default: null,
  })
  cdPushSocketTypeGuid!: string;

  @Column({
    name: 'cd_push_socket_type_id',
    default: null,
  })
  cdPushSocketTypeId?: number;

  @Column({
    name: 'doc_id',
    default: null,
  })
  docId?: number;

  @Column('tinyint', {
    name: 'cd_push_socket_enabled',
    default: null,
  })
  cdPushSocketEnabled?: boolean;

  // {
  //     "ngModule": "UserModule",
  //     "resourceName": "SessService",
  //     "resourceGuid": "resourceGuid",
  //     "jwtToken": "",
  //     "socket": "",
  //     "commTrack": {
  //         "initTime": 12345,
  //         "relayTime": null,
  //         "relayed": false,
  //         "deliveryTime": null,
  //         "deliverd": false
  //     }
  // }

  @Column({
    name: 'ng_module',
    length: 60,
    default: null,
  })
  ngModule!: string;

  @Column({
    name: 'resource_name',
    length: 40,
    default: null,
  })
  resourceName!: string;

  @Column({
    name: 'resource_guid',
    length: 60,
    default: null,
  })
  resourceGuid!: string;

  @Column({
    name: 'jwt_token',
    length: 500,
    default: null,
  })
  jwtToken!: string;

  @Column({
    name: 'socket',
    type: 'binary',
  })
  socket: any;

  @Column({
    name: 'comm_track',
    type: 'json',
  })
  commTrack!: string;

  @Column({
    name: 'init_time',
    default: null,
  })
  initTime!: string;

  @Column({
    name: 'relay_time',
    default: null,
  })
  relayTime!: string;

  @Column({
    name: 'relayed',
    default: null,
  })
  relayed!: boolean;

  @Column({
    name: 'delivery_time',
    default: null,
  })
  deliveryTime!: string;

  @Column({
    name: 'deliverd',
    default: null,
  })
  deliverd!: boolean;
}

export interface SocketStore {
  resourceGuid?: any;
  socket: any;
  userId?: any;
  pushGuid?: any;
}
