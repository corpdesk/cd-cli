import { BaseService } from '../../base/base.service.js';
import { DocModel } from '../../moduleman/models/doc.model.js';
import { NodemailerService } from './nodemailerservice.js';

export class MailService {
  b: BaseService<DocModel>;
  constructor() {
    this.b = new BaseService();
  }

  async sendEmailNotif(req, res, msg, recepientUser) {
    console.log(`starting UserController::sendEmailNotif(req, res)`);
    // const mailService = 'NodemailerService';
    // const cPath = `../comm/services/${mailService.toLowerCase()}`; // relative to BaseService because it is called from there
    // const clsCtx = {
    //     path: cPath,
    //     clsName: mailService,
    //     action: 'sendMail'
    // }
    // console.log(`clsCtx: ${JSON.stringify(clsCtx)}`);
    // const ret = await this.b.resolveCls(req, res, clsCtx);
    const nm = new NodemailerService();
    nm.sendMail(req, res, msg, recepientUser);
  }
}
