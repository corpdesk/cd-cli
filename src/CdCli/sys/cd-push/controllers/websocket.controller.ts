import { ObjectLiteral } from 'typeorm';
import { BaseService } from '../../base/base.service.js';
import { DocModel } from '../../moduleman/models/doc.model.js';
import { WebsocketService } from '../services/websocket.service.js';
import { CdPushSocketModel } from '../models/cd-push-socket.model.js';
import { GenericService } from '../../base/generic-service.js';
import { IServiceInput } from '../../base/i-base.js';

export class WebSocketController {
  b: BaseService<CdPushSocketModel>;
  svWebSocket = new WebsocketService();

  constructor() {
    this.b = new BaseService();
    this.svWebSocket = new WebsocketService();
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
  //                         "websocketName": "/src/CdApi/sys/moduleman",
  //                         "websocketTypeGuid": "7ae902cd-5bc5-493b-a739-125f10ca0268",
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
  // async Create(req, res, serviceInput) {
  //   try {
  //     await this.svWebSocket.create(req, res, serviceInput);
  //   } catch (e: any) {
  //     await this.b.serviceErr(req, res, e, 'WebSocketController:Create');
  //   }
  // }

  // async CreateSL(req: any, res: any) {
  //     try {
  //         await this.svWebSocket.createSL(req, res);
  //     } catch (e: any) {
  //         await this.b.serviceErr(req, res, e, 'WebSocketController:CreateSL');
  //     }
  // }

  // /**
  //  * {
  //         "ctx": "Sys",
  //         "m": "Moduleman",
  //         "c": "WebSocket",
  //         "a": "Get",
  //         "dat": {
  //             "f_vals": [
  //                 {
  //                     "query": {
  //                         "where": {"websocketId": 45763}
  //                     }
  //                 }
  //             ],
  //             "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
  //         },
  //         "args": null
  //     }
  //  * @param req
  //  * @param res
  //  */
  async Get(req: any, res: any) {
    try {
      await this.svWebSocket.getWebSocket(req, res);
    } catch (e: any) {
      await this.b.serviceErr(req, res, e, 'WebSocketController:Get');
    }
  }

  // async GetSL(req: any, res: any) {
  //     try {
  //         await this.svWebSocket.getWebSocketSL(req, res);
  //     } catch (e: any) {
  //         await this.b.serviceErr(req, res, e, 'WebSocketController:GetSL');
  //     }
  // }

  // /**
  //  * {
  //         "ctx": "Sys",
  //         "m": "Moduleman",
  //         "c": "WebSocket",
  //         "a": "GetType",
  //         "dat": {
  //             "f_vals": [
  //                 {
  //                     "query": {
  //                         "where": {"websocketTypeId": 45763}
  //                     }
  //                 }
  //             ],
  //             "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
  //         },
  //         "args": null
  //     }
  //  * @param req
  //  * @param res
  //  */
  async GetType(req: any, res: any) {
    try {
      await this.svWebSocket.getWebSocketTypeCount(req, res);
    } catch (e: any) {
      await this.b.serviceErr(req, res, e, 'WebSocketController:Get');
    }
  }

  // /** Pageable request:
  //  * {
  //         "ctx": "Sys",
  //         "m": "Moduleman",
  //         "c": "Module",
  //         "a": "GetCount",
  //         "dat": {
  //             "f_vals": [
  //                 {
  //                     "query": {
  //                         "select":["moduleId","moduleGuid"],
  //                         "where": {},
  //                         "take": 5,
  //                         "skip": 1
  //                         }
  //                 }
  //             ],
  //             "token": "29947F3F-FF52-9659-F24C-90D716BC77B2"
  //         },
  //         "args": null
  //     }
  //  * @param req
  //  * @param res
  //  */
  async GetCount(req: any, res: any) {
    try {
      await this.svWebSocket.getWebSocketCount(req, res);
    } catch (e: any) {
      await this.b.serviceErr(req, res, e, 'ModuleController:Get');
    }
  }

  // /** Pageable request:
  //  * {
  //         "ctx": "Sys",
  //         "m": "Moduleman",
  //         "c": "Module",
  //         "a": "GetPaged",
  //         "dat": {
  //             "f_vals": [
  //                 {
  //                     "query": {
  //                         "select":["moduleId","moduleGuid"],
  //                         "where": {},
  //                         "take": 5,
  //                         "skip": 1
  //                         }
  //                 }
  //             ],
  //             "token": "29947F3F-FF52-9659-F24C-90D716BC77B2"
  //         },
  //         "args": null
  //     }
  //  * @param req
  //  * @param res
  //  */
  async GetPaged(req: any, res: any) {
    try {
      await this.svWebSocket.getWebSocketCount(req, res);
    } catch (e: any) {
      await this.b.serviceErr(req, res, e, 'ModuleController:Get');
    }
  }

  // async GetPagedSL(req: any, res: any) {
  //     try {
  //         await this.svWebSocket.getPagedSL(req, res);
  //     } catch (e: any) {
  //         await this.b.serviceErr(req, res, e, 'WebSocketController:GetSL');
  //     }
  // }

  // /**
  //  * {
  //         "ctx": "Sys",
  //         "m": "Moduleman",
  //         "c": "WebSocket",
  //         "a": "Update",
  //         "dat": {
  //             "f_vals": [
  //                 {
  //                     "query": {
  //                         "update": {
  //                             "websocketName": "/corp-deskv1.2.1.2/system/modules/comm/controllers"
  //                         },
  //                         "where": {
  //                             "websocketId": 45762
  //                         }
  //                     }
  //                 }
  //             ],
  //             "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
  //         },
  //         "args": {}
  //     }
  //  * @param req
  //  * @param res
  //  */
  // async Update(req, res, serviceInput: IServiceInput<CdPushSocketModel>) {
  //   console.log('WebSocketController::Update()/01');
  //   try {
  //     console.log('WebSocketController::Update()/02');
  //     await this.svWebSocket.update(req, res, serviceInput);
  //   } catch (e: any) {
  //     await this.b.serviceErr(req, res, e, 'ModuleController:Update');
  //   }
  // }

  // async UpdateSL(req: any, res: any) {
  //     console.log('WebSocketController::UpdateSL()/01');
  //     try {
  //         console.log('WebSocketController::UpdateSL()/02');
  //         await this.svWebSocket.updateSL(req, res);
  //     } catch (e: any) {
  //         await this.b.serviceErr(req, res, e, 'WebSocketController:UpdateSL');
  //     }
  // }

  // /**
  //  * {
  //         "ctx": "Sys",
  //         "m": "Moduleman",
  //         "c": "WebSocket",
  //         "a": "Delete",
  //         "dat": {
  //             "f_vals": [
  //                 {
  //                     "query": {
  //                         "where": {"websocketId": 45763}
  //                     }
  //                 }
  //             ],
  //             "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
  //         },
  //         "args": null
  //     }
  //  * @param req
  //  * @param res
  //  */
  // async Delete(req, res, serviceInput: IServiceInput<CdPushSocketModel>) {
  //   try {
  //     await this.svWebSocket.delete(req, res, serviceInput);
  //   } catch (e: any) {
  //     await this.b.serviceErr(req, res, e, 'ModuleController:Update');
  //   }
  // }

  // async DeleteSL(req: any, res: any) {
  //     try {
  //         await this.svWebSocket.deleteSL(req, res);
  //     } catch (e: any) {
  //         await this.b.serviceErr(req, res, e, 'BillController:DeleteSL');
  //     }
  // }
}
