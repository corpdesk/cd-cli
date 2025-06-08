import url from 'url';
import jwt from 'jsonwebtoken';
import { BaseService } from '../../base/base.service.js';
import { SessionService } from '../../user/services/session.service.js';
import { UserService } from '../../user/services/user.service.js';
import {
  CreateIParams,
  IQuery,
  IRespInfo,
  IServiceInput,
  IUser,
} from '../../base/IBase.js';
import { CdPushSocketModel, SocketStore } from '../models/cd-push-socket.model.js';
import { CdPushViewModel } from '../models/cd-push-view.model.js';
import { CdPushTypeModel } from '../models/cd-push-type.model.js';
import { DocModel } from '../../moduleman/models/doc.model.js';
import { GenericService } from '../../base/generic-service.js';
import config from '../../../../config.js';
import { ObjectLiteral } from 'typeorm';

const { sign, verify } = jwt;
const jwtSecret = 'example-secret';
const cdPushClients = [];
// ** userID: wss
const webSockets = [];

// const socketsStore = [];
// Define the type explicitly

const socketsStore: SocketStore[] = [];

export class WebsocketService extends GenericService<CdPushSocketModel> {
  //   b: BaseService<CdPushSocketModel>; // instance of BaseService
  cdToken!: string;
  srvSess!: SessionService;
  srvUser!: UserService;
  user!: IUser;
  serviceModel: CdPushSocketModel;
  sessModel;
  // moduleModel: ModuleModel;

  /*
   * create rules
   */
  cRules: any = {
    required: ['resourceGuid'],
    noDuplicate: [],
  };
  uRules!: any[];
  dRules!: any[];

  constructor() {
    super(CdPushSocketModel);
    // this.b = new BaseService();
    this.serviceModel = new CdPushSocketModel();
    // this.moduleModel = new ModuleModel();
  }

  // /**
  //  * {
  //         "ctx": "Sys",
  //         "m": "Moduleman",
  //         "c": "WebSocket",
  //         "a": "Create",
  //         "dat": {
  //             "f_vals": [
  //                 {
  //                     "data": {
  //                         "cdPushSocketName": "/src/CdApi/sys/moduleman",
  //                         "WebSocketTypeGuid": "7ae902cd-5bc5-493b-a739-125f10ca0268",
  //                         "parentModuleGuid": "00e7c6a8-83e4-40e2-bd27-51fcff9ce63b"
  //                     }
  //                 }
  //             ],
  //             "token": "3ffd785f-e885-4d37-addf-0e24379af338"
  //         },
  //         "args": {}
  //     }
  //  * @param req
  //  * @param res
  //  */
  //   async create(pl:DocModel) {
  //     console.log('WebSocketService::create()/01');
  //     const svSess = new SessionService();
  //     if (await this.validateCreate(null, null)) {
  //       console.log('WebSocketService::create()/02');
  //       await this.beforeCreate(null, null);
  //       const serviceInput = {
  //         serviceInstance: this,
  //         serviceModel: CdPushSocketModel,
  //         serviceModelInstance: this.serviceModel,
  //         docName: 'Create cdPushSocket',
  //         dSource: 1,
  //       };
  //     //   console.log('WebSocketService::create()/req.post:', req.post);
  //       const respData = await this.b.create(null, null, serviceInput);
  //       await this.afterCreate(null, null, respData, svSess);
  //     } else {
  //       console.log('WebSocketService::create()/03');
  //       this.b.setAppState(false, this.b.i, svSess.sessResp);
  //     //   return this.b.respond(null, null);
  //     }
  //   }

  //   async createI(
  //     req,
  //     res,
  //     createIParams: CreateIParams,
  //   ): Promise<CdPushSocketModel | boolean> {
  //     return await this.b.createI(req, res, createIParams);
  //   }

  //   async cdPushSocketectExists(req, res, params): Promise<boolean> {
  //     const serviceInput: IServiceInput = {
  //       serviceInstance: this,
  //       serviceModel: CdPushSocketModel,
  //       docName: 'WebSocketService::cdPushSocketectExists',
  //       cmd: {
  //         action: 'find',
  //         query: { where: params.filter },
  //       },
  //       dSource: 1,
  //     };
  //     return this.b.read(req, res, serviceInput);
  //   }

  /**
   * SELECT cd_push_socket_id, cd_push_socket_guid, cd_push_socket_name,
   * cd_push_socket_description, doc_id, cd_push_socket_type_id, `data`,
   * cd_push_socket_type_guid, cd_push_socket_enabled, ng_module, resource_name,
   * resource_guid, jwt_token, socket, init_time, relay_time, relayed, delivery_time,
   * deliverd, comm_track
   * @param req
   * @param res
   * @returns
   */
  //   async beforeCreate(req, res): Promise<any> {
  //     const pl = this.b.getPlData(req);
  //     this.b.setPlData(req, { key: 'initTime', value: pl.commTrack.initTime });
  //     this.b.setPlData(req, { key: 'relayTime', value: pl.commTrack.relayTime });
  //     this.b.setPlData(req, { key: 'relayed', value: pl.commTrack.relayed });
  //     this.b.setPlData(req, {
  //       key: 'deliveryTime',
  //       value: pl.commTrack.deliveryTime,
  //     });
  //     this.b.setPlData(req, { key: 'deliverd', value: pl.commTrack.deliverd });
  //     this.b.setPlData(req, { key: 'cdPushSocketGuid', value: this.b.getGuid() });
  //     this.b.setPlData(req, { key: 'cdPushSocketEnabled', value: true });
  //     return true;
  //   }

  //   async afterCreate(req, res, respData, svSess): Promise<any> {
  //     const svJwt = new JwtService();
  //     await this.b.setJwt(await svJwt.fetchUserToken(req, res));
  //     console.log('WebsocketService::create()/this.b.cdResp1:', this.b.cdResp);
  //     console.log('WebsocketService::create()/respData:', respData);
  //     this.b.i.app_msg = 'new cdPushSocket created';
  //     this.b.setAppState(true, this.b.i, this.b.cdResp.app_state.sess);
  //     this.b.cdResp.data = await respData;
  //     console.log('WebsocketService::create()/this.b.cdResp2:', this.b.cdResp);
  //     await this.b.respond(req, res);
  //   }

  //   async read(req, res, serviceInput: IServiceInput<CoopStatModel>): Promise<any> {
  //     //
  //   }

  //   update(req: any, res: any) {
  //     // console.log('WebSocketService::update()/01');
  //     let q = this.b.getQuery(req);
  //     q = this.beforeUpdate(q);
  //     const serviceInput = {
  //       serviceModel: CdPushSocketModel,
  //       docName: 'WebSocketService::update',
  //       cmd: {
  //         action: 'update',
  //         query: q,
  //       },
  //       dSource: 1,
  //     };
  //     // console.log('WebSocketService::update()/02')
  //     this.b.update$(req, res, serviceInput).subscribe((ret) => {
  //       this.b.cdResp.data = ret;
  //       this.b.respond(req, res);
  //     });
  //   }

  /**
   * harmonise any data that can
   * result in type error;
   * @param q
   * @returns
   */
  beforeUpdate(q: any) {
    if (q.update.cdPushSocketEnabled === '') {
      q.update.cdPushSocketEnabled = null;
    }
    if (q.update.showIcon === '') {
      q.update.showIcon = null;
    }
    return q;
  }

  async remove(req: any, res: any) {
    //
  }

  /**
   * methods for transaction rollback
   */
  rbCreate(): number {
    return 1;
  }

  rbUpdate(): number {
    return 1;
  }

  rbDelete(): number {
    return 1;
  }

  async validateCreate(req, res, pl?) {
    const svSess = new SessionService();
    ///////////////////////////////////////////////////////////////////
    // 1. Validate against duplication
    const params = {
      serviceInstance: this,
      model: CdPushSocketModel,
    };
    this.b.i.code = 'WebSocketService::validateCreate';
    let ret = true;

    ///////////////////////////////////////////////////////////////////
    // 2. confirm the cd_obj referenced exists
    if (req) {
      pl = this.b.getPlData(req);
    }
    console.log('WebSocketService::getWebSocket/13');
    if (this.b.err.length > 0) {
      console.log('WebSocketService::validateCreate()/14');
      console.log('WebSocketService::validateCreate()/this.b.err:', this.b.err);
      ret = false;
    }
    console.log('WebSocketService::getWebSocket/15');
    console.log('WebSocketService::getWebSocket/ret:', ret);
    return ret;
  }

  getWebSocket(req, res, q?: IQuery) {
    if (!q) {
      q = this.b.getQuery(req);
    }

    console.log('WebSocketService::getWebSocket/f:', q);
    const serviceInput = {
      serviceModel: CdPushViewModel,
      docName: 'WebSocketService::getWebSocket$',
      cmd: {
        action: 'find',
        query: q,
      },
      dSource: 1,
    };
    try {
      this.b.read$(req, res, serviceInput).subscribe((r) => {
        console.log('WebSocketService::read$()/r:', r);
        this.b.i.code = 'WebSocketController::Get';
        const svSess = new SessionService();
        svSess.sessResp.cd_token = req.post.dat.token;
        svSess.sessResp.ttl = svSess.getTtl();
        this.b.setAppState(true, this.b.i, svSess.sessResp);
        this.b.cdResp.data = r;
        this.b.respond(req, res);
      });
    } catch (e: any) {
      console.log('WebSocketService::read$()/e:', e);
      this.b.err.push((e as Error).toString());
      const i = {
        messages: this.b.err,
        code: 'BaseService:update',
        app_msg: '',
      };
      this.b.serviceErr(req, res, e, i.code);
      this.b.respond(req, res);
    }
  }

  getWebSocketType(req: any, res: any) {
    const q = this.b.getQuery(req);
    console.log('WebSocketService::getWebSocket/q:', q);
    const serviceInput = {
      serviceModel: CdPushTypeModel,
      docName: 'WebSocketService::getWebSocketType$',
      cmd: {
        action: 'find',
        query: q,
      },
      dSource: 1,
    };
    try {
      this.b.read$(req, res, serviceInput).subscribe((r) => {
        console.log('WebSocketService::read$()/r:', r);
        this.b.i.code = 'WebSocketController::Get';
        const svSess = new SessionService();
        svSess.sessResp.cd_token = req.post.dat.token;
        svSess.sessResp.ttl = svSess.getTtl();
        this.b.setAppState(true, this.b.i, svSess.sessResp);
        this.b.cdResp.data = r;
        this.b.respond(req, res);
      });
    } catch (e: any) {
      console.log('WebSocketService::read$()/e:', e);
      this.b.err.push((e as Error).toString());
      const i = {
        messages: this.b.err,
        code: 'BaseService:update',
        app_msg: '',
      };
      this.b.serviceErr(req, res, e, i.code);
      this.b.respond(req, res);
    }
  }

  getWebSocketCount(req, res, serviceInput?: IServiceInput<CdPushViewModel>) {
    const q = this.b.getQuery(req);
    console.log('WebSocketService::getWebSocketCount/q:', q);
    if (req) {
      serviceInput = {
        serviceModel: CdPushViewModel,
        docName: 'WebSocketService::getWebSocketCount$',
        cmd: {
          action: 'find',
          query: q,
        },
        dSource: config.ds.mysql,
      };
    }

    this.b.readCount$(req, res, serviceInput).subscribe((r) => {
      this.b.i.code = 'WebSocketController::Get';
      const svSess = new SessionService();
      svSess.sessResp.cd_token = req.post.dat.token;
      svSess.sessResp.ttl = svSess.getTtl();
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = r;
      this.b.respond(req, res);
    });
  }

  getWebSocketTypeCount(req: any, res: any) {
    const q = this.b.getQuery(req);
    console.log('WebSocketService::getWebSocketCount/q:', q);
    const serviceInput = {
      serviceModel: CdPushViewModel,
      docName: 'WebSocketService::getWebSocketCount$',
      cmd: {
        action: 'find',
        query: q,
      },
      dSource: 1,
    };
    this.b.readCount$(req, res, serviceInput).subscribe((r) => {
      this.b.i.code = 'WebSocketController::Get';
      const svSess = new SessionService();
      svSess.sessResp.cd_token = req.post.dat.token;
      svSess.sessResp.ttl = svSess.getTtl();
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = r;
      this.b.respond(req, res);
    });
  }

  //   delete(req: any, res: any) {
  //     const q = this.b.getQuery(req);
  //     console.log('WebSocketService::delete()/q:', q);
  //     const serviceInput = {
  //       serviceModel: CdPushSocketModel,
  //       docName: 'WebSocketService::delete',
  //       cmd: {
  //         action: 'delete',
  //         query: q,
  //       },
  //       dSource: 1,
  //     };

  //     this.b.delete$(req, res, serviceInput).subscribe((ret) => {
  //       this.b.cdResp.data = ret;
  //       this.b.respond(req, res);
  //     });
  //   }

  /////////////////////////////////////////////////////////////////////////

  clientHasSocket(userId, pushGuid) {
    console.log('clientHasSocket()/01');
    console.log('clientHasSocket()/socketsStore:', socketsStore);
    console.log('clientHasSocket()/userId:', userId);
    console.log('clientHasSocket()/pushGuid:', pushGuid);
    return (
      socketsStore.filter(
        (s: any) => s.userId === userId && s.pushGuid === pushGuid,
      ).length > 0
    );
  }

  // get destination socket based on the selected cdObjId;
  async destinationSocket(req, res, serviceInput) {
    // console.log('destinationSocket()/cdObjId:', cdObjId)
    // console.log('destinationSocket()/cdPushClients:', cdPushClients)
    // const socketArr = cdPushClients.filter(c => c.resourceGuid === cdObjId.resourceGuid).map(c => c.socket);
    // console.log('destinationSocket()/socketArr:', socketArr)
    // if (socketArr.length > 0) {
    //     console.log('destinationSocket()/returning socket...')
    //     return socketArr[0];
    // } else {
    //     return false;
    // }

    // const q = { where: { resourceGuid: rg } };
    // console.log('WebsocketService::destinationSocket/q:', q);
    // const serviceInput = {
    //     serviceModel: CdPushSocketModel,
    //     docName: 'WebsocketService::destinationSocket',
    //     cmd: {
    //         action: 'find',
    //         query: q
    //     },
    //     dSource: 1
    // }
    try {
      //   return this.b.wsGet(CdPushSocketModel, q, '');
      return this.getWebSocketCount(req, res, serviceInput);
    } catch (e: any) {
      console.log('WebsocketService::destinationSocket/e:', e);
      this.b.err.push((e as Error).toString());
      const i = {
        messages: this.b.err,
        code: 'WebsocketService::destinationSocket',
        app_msg: '',
      };
      this.b.wsServiceErr(e, i.code, null);
      return [];
    }
  }

  saveSocket(uid, pGuid, ws) {
    if (!this.clientHasSocket(uid, pGuid)) {
      const socketData = {
        socket: ws,
        userId: uid,
        pushGuid: pGuid,
      };
      socketsStore.push(socketData);
    } else {
      console.log('client socket exists!');
    }
  }

  resetSocket(uid, pGuid, ws) {
    console.log('resetSocket()/resetting the socket');
    console.log('resetSocket()/socketsStore:', socketsStore);
    console.log('resetSocket()/pGuid:', pGuid);
    if (this.clientHasSocket(uid, pGuid)) {
      console.log('socket exists');
      socketsStore.forEach((s, i) => {
        if (s.userId === uid && s.pushGuid === pGuid) {
          console.log('about to remove the socket');
          s.socket.close();
          console.log('closed the socket');
          socketsStore.splice(i, 1);
          console.log('socket removed');
        }
      });
      const socketData = {
        socket: ws,
        userId: uid,
        pushGuid: pGuid,
      };
      console.log('saving new socket');
      socketsStore.push(socketData);
    }
  }

  run(req, res, wss: any) {
    wss.on('connection', async (ws, wsReq) => {
      console.log('');
      console.log('');
      console.log('');
      console.log('wss.on(connection)/01');
      if (url.parse(wsReq.url, true).query.token) {
        const token = url.parse(wsReq.url, true).query.token;
        const resourceGuid = url.parse(wsReq.url, true).query.rg;
        console.log('wss.on(connection/token:', token);
        console.log('wss.on(connection/resourceGuid:', resourceGuid);
        // search and update registered data with socket

        console.log(
          'wss.on(connection/cdPushClients:',
          JSON.stringify(cdPushClients),
        );

        /**
         * update client data with connection socket
         */
        // cdPushClients.forEach((c) => {
        //     if (c.resourceGuid === resourceGuid) {
        //         console.log('setting socket for:', JSON.stringify(c));
        //         c.socket = ws;
        //     }
        // })
        await this.setSocketRedis(resourceGuid, ws);
        await this.setSocket(resourceGuid, ws);
      }

      // Handle the WebSocket `message` event. If any of the clients has a token
      // that is no longer valid, send an error message and close the client's
      // connection.
      ws.on('message', (data) => {
        console.log('');
        console.log('');
        console.log('');
        console.log('wss.on(message)/01');
        console.log('wss.on(message)/data1:', data);
        console.log(
          'wss.on(message)/confirm that cdPushClients items have valid sockets',
        );
        // console.log('wss.on(message)/cdPushClients:', cdPushClients);
        console.log('wss.on(message)/typeof(data)1:', typeof data);
        let strData = data.toString();
        console.log('wss.on(message)/typeof(strData):', typeof strData);
        console.log('wss.on(message)/strData:', strData);
        let pEnvelop = JSON.parse(strData);
        strData = JSON.stringify(pEnvelop);
        pEnvelop = JSON.parse(strData);
        console.log('wss.on(message)/typeof(pEnvelop):', typeof pEnvelop);
        console.log('wss.on(message)/pEnvelop*:', pEnvelop);
        const recepients = pEnvelop.pushData.pushRecepients;
        const sender = recepients.filter((m) => m.subTypeId === 1)[0];
        const senderId = sender.userId;
        console.log('wss.on(message)/sender:', sender);
        let senderToken = '';
        if ('cdObjId' in sender) {
          if ('jwtToken' in sender.cdObjId) {
            senderToken = sender.cdObjId.jwtToken;
            const pushGuid = pEnvelop.pushData.pushGuid;
            console.log('wss.on(message)/pEnvelop*:', pEnvelop);
            console.log('wss.on(message)/senderId*:', senderId);
            console.log('wss.on(message)/pushGuid*:', pushGuid);
            if (senderId) {
              this.saveSocket(senderId, pushGuid, ws);
              console.log(
                'wss.on(message)/pEnvelop.pushRecepients:',
                JSON.stringify(pEnvelop.pushData.pushRecepients),
              );
              let jwtToken = '';
              pEnvelop.pushData.pushRecepients.forEach(async (m, i) => {
                console.log('wss.on(message)/m', m);
                const cdObjId = m.cdObjId;
                let ret;
                let senderSocket;
                let recepientSocket;
                const q = { where: { resourceGuid: cdObjId.resourceGuid } };
                console.log('WebsocketService::destinationSocket/q:', q);
                const serviceInput = {
                  serviceModel: CdPushSocketModel,
                  docName: 'WebsocketService::destinationSocket',
                  cmd: {
                    action: 'find',
                    query: q,
                  },
                  dSource: 1,
                };
                switch (m.subTypeId) {
                  case 1:
                    ret = await this.destinationSocket(req, res, serviceInput);
                    console.log('wss.on(message)/senderSocket:', senderSocket);
                    console.log(
                      'wss.on(message)/senderSocket/ret[0].socket:',
                      ret[0].socket,
                    );
                    senderSocket = ret[0].socket;
                    // senderSocket = await this.getSocketRedis(cdObjId.resourceGuid)
                    // console.log('wss.on(message)/senderSocket/JSON.stringify(senderSocket):', JSON.stringify(senderSocket));
                    // senderSocket = this.getSocketArr(cdObjId.resourceGuid);
                    // console.log('wss.on(message)/senderSocket/JSON.stringify(senderSocket):', JSON.stringify(senderSocket));
                    break;
                  case 7:
                    ret = await this.destinationSocket(req, res, serviceInput);
                    console.log(
                      'wss.on(message)/recepientSocket:',
                      recepientSocket,
                    );
                    console.log(
                      'wss.on(message)/recepientSocket/ret[0].socket:',
                      ret[0].socket,
                    );
                    recepientSocket = ret[0].socket;
                    // recepientSocket = await this.getSocketRedis(cdObjId.resourceGuid)
                    // console.log('wss.on(message)/recepientSocket/JSON.stringify(recepientSocket):', JSON.stringify(recepientSocket));
                    // recepientSocket = this.getSocketArr(cdObjId.resourceGuid);
                    // console.log('wss.on(message)/recepientSocket/JSON.stringify(recepientSocket):', JSON.stringify(recepientSocket));
                    break;
                }

                console.log(
                  'wss.on(message)/recepients[i].userId:',
                  recepients[i].userId,
                );
                console.log(
                  'wss.on(message)/pEnvelop.resp:',
                  JSON.stringify(pEnvelop.resp),
                );
                jwtToken = senderToken;
                console.log('wss.on(message)/jwtToken:', jwtToken);
                try {
                  jwt.verify(senderToken, jwtSecret, (err, decoded) => {
                    console.log('wss.on(message)/02');

                    if (err) {
                      console.log('wss.on(message)/03');
                      console.log('jwt.verify(token)/err:', err);

                      if (senderSocket) {
                        console.log('wss.on(message)/04');
                        senderSocket.send({
                          msg: 'Error: Your token is no longer valid. Please reauthenticate.',
                        });
                        senderSocket.close();
                      } else {
                        console.log('wss.on(message)/05');
                        console.log('senderSocket is invalid');
                      }
                    } else {
                      console.log('wss.on(message)/06');
                      /**
                       * messege back to sender:
                       * include message tracking info
                       */
                      if (pEnvelop.pushData.triggerEvent === 'reset-socket') {
                        console.log('wss.on(message)/07');
                        this.resetSocket(recepients[i].userId, pushGuid, ws);
                      }
                      console.log(
                        'wss.on(message)/senderSocket3:',
                        senderSocket,
                      );
                      if (senderSocket) {
                        console.log('wss.on(message)/08');
                        console.log('wss.on(message)/data to send:', pEnvelop);
                        senderSocket.send(JSON.stringify(pEnvelop));
                      } else {
                        console.log('wss.on(message)/09');
                        console.log('senderSocket is invalid');
                      }

                      // main message to recepient
                      console.log('wss.on(message)/10');
                      if (recepientSocket) {
                        console.log('wss.on(message)/11');
                        console.log('wss.on(message)/data to send:', pEnvelop);
                        console.log(
                          'wss.on(message)/socket to use, recepientSocket:',
                          recepientSocket,
                        );
                        console.log(
                          'wss.on(message)/socket to use, JSON.stringify(recepientSocket):',
                          JSON.stringify(recepientSocket),
                        );
                        try {
                          recepientSocket.send(JSON.stringify(pEnvelop));
                        } catch (e: any) {
                          console.log('Error sending message. Error:', e);
                        }
                      } else {
                        console.log('wss.on(message)/12');
                        console.log('recepientSocket is invalid', '\n', '\n');
                      }
                    }
                  });
                } catch (e: any) {
                  console.log('error on jwt.verify. Error:', e);
                }
              });
            } else {
              console.log('Aborting! senderId cannot be resolved');
            }
          } else {
            console.log('******sender missing jwtToken *********');
          }
        } else {
          console.log('******sender missing cdObjId *********');
        }
      });
    });
  }

  async setSocket(rg, s) {
    const b = new BaseService<CdPushSocketModel>();
    const socketData = { resourceGuid: rg, socket: s };
    await this.setSocketRedis(rg, socketData);
    socketsStore.push(socketData);
    // const pl: any = await this.b.getPlData(req);
    console.log('JwtService::setJwt()/rg:', rg);
    // pl.socket = socket;
    const q = {
      update: { socket: s },
      where: {
        resourceGuid: rg,
      },
    };
    const serviceInput = {
      serviceModel: CdPushSocketModel,
      docName: 'WebsocketService::update',
      cmd: {
        action: 'update',
        query: q,
      },
      dSource: config.ds.sqlite,
    };

    // const ret = await this.b.wsUpdate(serviceInput, '');
    const ret = await b.update(null, null, serviceInput);
    console.log('WebsocketService::setJwt()/update ret:', ret);
  }

  async setSocketRedis(rg, s) {
    const ret = await this.b.wsRedisCreate(rg, s.toString());
    console.log('WebsocketService::setSocketRedis()/ret:', ret);
  }

  async getSocketRedis(rg) {
    const socketStr = await this.b.wsRedisRead(rg);
    console.log('WebsocketService::setSocketRedis()/socketStr:', socketStr);
    const socketData: SocketStore = JSON.parse(socketStr.r);
    return socketData.socket;
  }

  getSocketArr(rg) {
    return socketsStore.filter((s) => s.resourceGuid === rg)[0].socket;
  }
}
