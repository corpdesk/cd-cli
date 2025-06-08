import { MessageClient, IncomingMail } from 'cloudmailin';
import { BaseService } from '../../base/base.service.js';
import { CdPushController } from '../../cd-push/controllers/cdpush.controller.js';

export class CloudmailinService {
  cdPush: CdPushController;
  constructor() {
    this.cdPush = new CdPushController();
  }
  async sendMail(req: any, res: any) {
    const USERNAME = '2f9ea731b2f948c5';
    const API_KEY = 'dyiAt8dDcYNcTB7MhMHxnibp';
    const client = new MessageClient({ username: USERNAME, apiKey: API_KEY });
    return await client.sendMessage({
      from: `'Corpdesk' <corpdeskplatform@gmail.com>`,
      to: 'george.oremo@gmail.com',
      subject: 'Check Attachment',
      plain: 'Hello world?',
      html: req.post.dat.f_vals[0].data.msg,
      headers: { 'x-myheader': 'test header' },
      attachments: [
        {
          file_name: 'pixel.png',
          content:
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP0rdr1HwAFHwKCk87e6gAAAABJRU5ErkJggg==',
          content_type: 'image/png',
        },
      ],
    });
  }
}
