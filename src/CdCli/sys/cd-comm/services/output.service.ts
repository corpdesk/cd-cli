import { BaseService } from '../../base/base.service.js';
import { DocModel } from '../../moduleman/models/doc.model.js';
import { SessionService } from '../../user/services/session.service.js';
import { CdPdf } from '../../utils/pdf.js';
import { PdfModel } from '../models/pdf.model.js';

export class OutputService {
  b: BaseService<DocModel>;
  serviceModel: PdfModel = new PdfModel();
  constructor() {
    this.b = new BaseService();
  }
  async generatePdf(req: any, res: any) {
    const svSess = new SessionService();
    const pdf = new CdPdf();
    const ret = await pdf.fromHtml(req, res);
    // save print records
    const serviceInput = {
      serviceInstance: this,
      serviceModel: PdfModel,
      serviceModelInstance: this.serviceModel,
      docName: 'Generate Pdf',
      dSource: 1,
    };
    // const result = await this.b.create(req, res, serviceInput)
    this.b.i.app_msg = '';
    this.b.setAppState(true, this.b.i, svSess.sessResp);
    this.b.cdResp.data = [];
    const r = await this.b.respond(req, res);
  }
}
