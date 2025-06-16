import { BaseService } from '../../base/base.service';

export class SchedulerController {
    b: BaseService;
    constructor(){
        this.b = new BaseService();
    }
    // /**
    //  * {
        //     "ctx": "Sys",
        //     "m": "Comm",
        //     "c": "MailController",
        //     "a": "sendMail",
        //     "dat": {
        //         "f_vals": [
        //             {
        //                 "service": "NodemailerService",
        //                 "data": {
        //                     "msg": "<strong>Testing msg from client app</strong>"
        //                 }
        //             }
        //         ],
        //         "token": "29947F3F-FF52-9659-F24C-90D716BC77B2"
        //     },
        //     "args": null
        // }
    //  * @param req
    //  * @param res
    //  */
    async sendMail(req, res) {
        const service = req.post.dat.f_vals[0].service;
        /**
         * note that the path below is applied at BaseService
         * so the path must be set relative to BaseService
         * NOT this controller
         */
        const cPath = `../${req.post.m.toLowerCase()}/services/${service.toLowerCase()}`; // relative to BaseService because it is called from there
        const clsCtx = {
            path: cPath,
            clsName: service,
            action: req.post.a, // all services must implement send
        }
        const ret = await this.b.resolveCls(req, res, clsCtx);
        await this.b.respond(req, res, ret);
    }
}