import { Like } from "typeorm";
import { Logging } from "../../../../../../../sys/base/winston.log.js";
import { BaseService } from "../../../../../../../sys/base/base.service.js";
import { SessionService } from "../../../../../../../sys/user/services/session.service.js";
import { CdGeoLocationModel } from "../../../../../../cd-geo/models/cd-geo-location.model.js";
import { CompanyModel } from "../../../../../../../sys/moduleman/models/company.model.js";
import { CompanyService } from "../../../../../../../sys/moduleman/services/company.service.js";
import { QueryTransformer } from "../../../../../../../sys/utilities/query-transformer.js";
import { CdGeoLocationService } from "../../../../../../cd-geo/services/cd-geo-location.service.js";
import { CdAiUsageLogsModel } from "../models/cdAiUsageLogs.model.js";
import { CdAiUsageLogsTypeModel } from "../models/cdAiUsageLogs-type.model.js";
import { CdAiUsageLogsViewModel } from "../models/cdAiUsageLogs-view.model.js";
import { CdAiUsageLogsEfgViewModel } from "../models/cdAiUsageLogs-efg-view.model.js";
import {
  CdAiUsageLogsEfgModel,
  cdAiUsageLogsEfgProfileDefault,
} from "../models/cdAiUsageLogs-efg.model.js";
// import { QueryTransformer } from '../../../../../../../sys/utils/query-transformer';
export class CdAiUsageLogsService {
  logger;
  b; // instance of BaseService
  cdToken;
  srvSess;
  srvUser;
  user;
  serviceModel;
  modelName = "CdAiUsageLogsModel";
  sessModel;
  sessDataExt;
  // moduleModel: ModuleModel;
  arrLikeConditions = [];
  /*
   * create rules
   */
  cRules = {
    required: ["cdAiUsageLogsName", "cdAiUsageLogsTypeId"],
    noDuplicate: ["cdAiUsageLogsName", "cdAiUsageLogsTypeId"],
  };
  uRules;
  dRules;
  constructor() {
    // super();
    this.b = new BaseService();
    this.logger = new Logging();
    this.serviceModel = new CdAiUsageLogsModel();
  }
  async initSession(req, res) {
    const svSess = new SessionService();
    this.sessDataExt = await svSess.getSessionDataExt(req, res);
  }
  /**
       * Create from new company:
       *  - Create company, then create cdAiUsageLogs
       *
       * Create from existing company
       *  - select company then create cdAiUsageLogs
      * {
         "ctx": "App",
         "m": "CdAiUsageLogss",
         "c": "CdAiUsageLogs",
         "a": "Create",
         "dat": {
             "f_vals": [
             {
                 "data": {
                     "cdAiUsageLogsGuid":"",
                     "cdAiUsageLogsName": "Benin",
                     "cdAiUsageLogsDescription":"2005",
                     "cdGeoLocationId":null,
                     "cdAiUsageLogsWoccu": false,
                     "cdAiUsageLogsCount": null,
                     "cdAiUsageLogsEfgsCount": 881232,
                     "cdAiUsageLogsSavesShares":56429394,
                     "cdAiUsageLogsLoans":45011150,
                     "cdAiUsageLogsReserves":null,
                     "cdAiUsageLogsAssets": null,
                     "cdAiUsageLogsEfgPenetration":20.95,
                     "cdAiUsageLogsDateLabel": "2005-12-31 23:59:59",
                     "cdAiUsageLogsRefId":null
                 }
             }
             ],
             "token": "3ffd785f-e885-4d37-addf-0e24379af338"
         },
         "args": {}
         }
      * @param req
      * @param res
      */
  async create(req, res) {
    this.logger.logInfo("cdAiUsageLogs/create::validateCreate()/01");
    const svSess = new SessionService();
    if (await this.validateCreate(req, res)) {
      await this.beforeCreate(req, res);
      const serviceInput = {
        serviceModel: CdAiUsageLogsModel,
        modelName: "CdAiUsageLogsModel",
        serviceModelInstance: this.serviceModel,
        docName: "Create CdAiUsageLogs",
        dSource: 1,
      };
      this.logger.logInfo(
        "CdAiUsageLogsService::create()/serviceInput:",
        serviceInput,
      );
      const respData = await this.b.create(req, res, serviceInput);
      this.b.i.app_msg = "new CdAiUsageLogs created";
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = await respData;
      const r = await this.b.respond(req, res);
    } else {
      this.logger.logInfo("cdAiUsageLogs/create::validateCreate()/02");
      const r = await this.b.respond(req, res);
    }
  }
  async validateCreate(req, res) {
    this.logger.logInfo(
      "cdAiUsageLogs/CdAiUsageLogsService::validateCreate()/01",
    );
    const svSess = new SessionService();
    // const svCompany = new CompanyService();
    let companyParams;
    // const fValItem = req.body.dat.f_vals[0];
    let pl = await this.b.getPlData(req);
    console.log("CdAiUsageLogsService::validateCreate()/pl:", pl);
    // Validation params for the different checks
    const validationParams = [
      {
        field: "cdAiUsageLogsTypeId",
        query: { cdAiUsageLogsTypeId: pl.cdAiUsageLogsTypeId },
        model: CdAiUsageLogsTypeModel,
      },
      {
        field: "cdGeoLocationId",
        query: { cdGeoLocationId: pl.cdGeoLocationId },
        model: CdGeoLocationModel,
      },
    ];
    if ("companyId" in pl) {
      companyParams = {
        field: "companyId",
        query: { companyId: pl.companyId },
        model: CompanyModel,
      };
      validationParams.push(companyParams);
    }
    const valid = await this.validateExistence(req, res, validationParams);
    if (!valid) {
      this.logger.logInfo(
        "cdAiUsageLogs/CdAiUsageLogsService::validateCreate()/Validation failed",
      );
      this.b.setAppState(false, this.b.i, svSess.sessResp);
      return false;
    }
    // Proceed with further CdAiUsageLogs-specific validation or creation logic
    this.logger.logInfo(
      "cdAiUsageLogs/CdAiUsageLogsService::validateCreate()/Validation passed",
    );
    // Other validation logic (e.g., duplicate checks, required field checks, etc.)
    return true;
  }
  async validateExistence(req, res, validationParams) {
    const promises = validationParams.map((param) => {
      const serviceInput = {
        serviceModel: param.model,
        docName: `CdAiUsageLogsService::validateExistence(${param.field})`,
        cmd: {
          action: "find",
          query: { where: param.query },
        },
        dSource: 1,
      };
      console.log(
        "CdAiUsageLogsService::validateExistence/param.model:",
        param.model,
      );
      console.log(
        "CdAiUsageLogsService::validateExistence/serviceInput:",
        JSON.stringify(serviceInput),
      );
      const b = new BaseService();
      return b.read(req, res, serviceInput).then((r) => {
        if (r.length > 0) {
          this.logger.logInfo(
            `cdAiUsageLogs/CdAiUsageLogsService::validateExistence() - ${param.field} exists`,
          );
          return true;
        } else {
          this.logger.logError(
            `cdAiUsageLogs/CdAiUsageLogsService::validateExistence() - Invalid ${param.field}`,
          );
          this.b.i.app_msg = `${param.field} reference is invalid`;
          this.b.err.push(this.b.i.app_msg);
          return false;
        }
      });
    });
    const results = await Promise.all(promises);
    // If any of the validations fail, return false
    return results.every((result) => result === true);
  }
  async createSL(req, res) {
    const svSess = new SessionService();
    await this.b.initSqlite(req, res);
    if (await this.validateCreateSL(req, res)) {
      await this.beforeCreateSL(req, res);
      const serviceInput = {
        serviceInstance: this,
        serviceModel: CdAiUsageLogsModel,
        serviceModelInstance: this.serviceModel,
        docName: "Create CdAiUsageLogs",
        dSource: 1,
      };
      const result = await this.b.createSL(req, res, serviceInput);
      this.b.connSLClose();
      this.b.i.app_msg = "";
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = result;
      const r = await this.b.respond(req, res);
    } else {
      const r = await this.b.respond(req, res);
    }
  }
  async createI(req, res, createIParams) {
    return await this.b.createI(req, res, createIParams);
  }
  /**
       * CreateM, Create multiple records
       *  - 1. validate the loop field for multiple data
       *  - 2. loop through the list
       *  - 3. in each cycle:
       *      - get createItem
       *      - createI(createItem)
       *      - save return value
       *  - 4. set return data
       *  - 5. return data
       *
       * {
          "ctx": "App",
          "m": "CdAiUsageLogss",
          "c": "CdAiUsageLogs",
          "a": "CreateM",
          "dat": {
              "f_vals": [
              {
                  "data": [
                  {
                      "cdAiUsageLogsGuid": "",
                      "cdAiUsageLogsName": "Kenya",
                      "cdAiUsageLogsDescription": "2006",
                      "cdGeoLocationId": null,
                      "cdAiUsageLogsWoccu": false,
                      "cdAiUsageLogsCount": 2993,
                      "cdAiUsageLogsEfgsCount": 3265545,
                      "cdAiUsageLogsSavesShares": 1608009012,
                      "cdAiUsageLogsLoans": 1604043550,
                      "cdAiUsageLogsReserves": 102792479,
                      "cdAiUsageLogsAssets": 2146769999,
                      "cdAiUsageLogsEfgPenetration": 16.01,
                      "cdAiUsageLogsDateLabel": "2006-12-31 23:59:59",
                      "cdAiUsageLogsRefId": null
                  },
                  {
                      "cdAiUsageLogsGuid": "",
                      "cdAiUsageLogsName": "Malawi",
                      "cdAiUsageLogsDescription": "2006",
                      "cdGeoLocationId": null,
                      "cdAiUsageLogsWoccu": false,
                      "cdAiUsageLogsCount": 70,
                      "cdAiUsageLogsEfgsCount": 62736,
                      "cdAiUsageLogsSavesShares": 6175626,
                      "cdAiUsageLogsLoans": 4946246,
                      "cdAiUsageLogsReserves": 601936,
                      "cdAiUsageLogsAssets": 7407250,
                      "cdAiUsageLogsEfgPenetration": 0.9,
                      "cdAiUsageLogsDateLabel": "2006-12-31 23:59:59",
                      "cdAiUsageLogsRefId": null
                  }
                  ]
              }
              ],
              "token": "3ffd785f-e885-4d37-addf-0e24379af338"
          },
          "args": {}
          }
       *
       *
       * @param req
       * @param res
       */
  async createM(req, res) {
    this.logger.logInfo("CdAiUsageLogsService::createM()/01");
    let data = req.post.dat.f_vals[0].data;
    this.logger.logInfo("CdAiUsageLogsService::createM()/data:", data);
    // this.b.models.push(CdAiUsageLogsModel)
    // this.b.init(req, res)
    for (var cdAiUsageLogsData of data) {
      this.logger.logInfo("cdAiUsageLogsData", cdAiUsageLogsData);
      const cdAiUsageLogsQuery = cdAiUsageLogsData;
      const svCdAiUsageLogs = new CdAiUsageLogsService();
      const si = {
        serviceInstance: svCdAiUsageLogs,
        serviceModel: CdAiUsageLogsModel,
        serviceModelInstance: svCdAiUsageLogs.serviceModel,
        docName: "CdAiUsageLogsService::CreateM",
        dSource: 1,
      };
      const createIParams = {
        serviceInput: si,
        controllerData: cdAiUsageLogsQuery,
      };
      let ret = await this.createI(req, res, createIParams);
      this.logger.logInfo("CdAiUsageLogsService::createM()/forLoop/ret:", {
        ret: ret,
      });
    }
    // return current sample data
    // eg first 5
    // this is just a sample for development
    // producation can be tailored to requrement
    // and the query can be set from the client side.
    let q = {
      // "select": [
      //     "cdAiUsageLogsName",
      //     "cdAiUsageLogsDescription"
      // ],
      where: {},
      take: 5,
      skip: 0,
    };
    this.getCdAiUsageLogs(req, res, q);
  }
  async CdAiUsageLogsExists(req, res, params) {
    const serviceInput = {
      serviceInstance: this,
      serviceModel: CdAiUsageLogsModel,
      docName: "CdAiUsageLogsService::CdAiUsageLogsExists",
      cmd: {
        action: "find",
        query: { where: params.filter },
      },
      dSource: 1,
    };
    return this.b.read(req, res, serviceInput);
  }
  async beforeCreate(req, res) {
    /**
     * create can be processed from existing or new company
     * In case of new company, setCompanyId() saves and use the id to set companyId for cdAiUsageLogs
     */
    await this.setCompanyId(req, res);
    this.b.setPlData(req, {
      key: "cdAiUsageLogsGuid",
      value: this.b.getGuid(),
    });
    this.b.setPlData(req, { key: "cdAiUsageLogsEnabled", value: true });
    return true;
  }
  async beforeCreateSL(req, res) {
    this.b.setPlData(req, {
      key: "cdAiUsageLogsGuid",
      value: this.b.getGuid(),
    });
    this.b.setPlData(req, { key: "cdAiUsageLogsEnabled", value: true });
    return true;
  }
  async setCompanyId(req, res) {
    const svCompany = new CompanyService();
    if ("extData" in req.post.dat.f_vals[0]) {
      if ("company" in req.post.dat.f_vals[0].extData) {
        const si = {
          serviceInstance: svCompany,
          serviceModel: CompanyModel,
          serviceModelInstance: svCompany.serviceModel,
          docName: "CdAiUsageLogsService/beforeCreate",
          dSource: 1,
        };
        const createIParams = {
          serviceInput: si,
          controllerData: req.post.dat.f_vals[0].extData.company,
        };
        // Call CompanyService to create a new company
        const c = await svCompany.createI(req, res, createIParams);
        this.b.setPlData(req, { key: "companyId", value: c.companyId });
      }
    }
  }
  async read(req, res, serviceInput) {
    // const serviceInput: IServiceInput = {
    //     serviceInstance: this,
    //     serviceModel: CdAiUsageLogsModel,
    //     docName: 'CdAiUsageLogsService::CdAiUsageLogsExists',
    //     cmd: {
    //         action: 'find',
    //         query: { where: params.filter }
    //     },
    //     dSource: 1,
    // }
    return this.b.read(req, res, serviceInput);
  }
  async readSL(req, res, serviceInput) {
    await this.b.initSqlite(req, res);
    const q = this.b.getQuery(req);
    this.logger.logInfo("CdAiUsageLogsService::getCdAiUsageLogs/q:", q);
    try {
      this.b.readSL$(req, res, serviceInput).subscribe((r) => {
        // this.logger.logInfo('CdAiUsageLogsService::read$()/r:', r)
        this.b.i.code = "CdAiUsageLogsService::Get";
        const svSess = new SessionService();
        svSess.sessResp.cd_token = req.post.dat.token;
        svSess.sessResp.ttl = svSess.getTtl();
        this.b.setAppState(true, this.b.i, svSess.sessResp);
        this.b.cdResp.data = r;
        this.b.connSLClose();
        this.b.respond(req, res);
      });
    } catch (e) {
      //   this.logger.logInfo('CdAiUsageLogsService::read$()/e:', e);
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "CdAiUsageLogsService:update",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      await this.b.respond(req, res);
    }
  }
  update(req, res) {
    // this.logger.logInfo('CdAiUsageLogsService::update()/01');
    let q = this.b.getQuery(req);
    q = this.beforeUpdate(q);
    const serviceInput = {
      serviceModel: CdAiUsageLogsModel,
      docName: "CdAiUsageLogsService::update",
      cmd: {
        action: "update",
        query: q,
      },
      dSource: 1,
    };
    // this.logger.logInfo('CdAiUsageLogsService::update()/02')
    this.b.update$(req, res, serviceInput).subscribe((ret) => {
      this.b.cdResp.data = ret;
      this.b.respond(req, res);
    });
  }
  updateSL(req, res) {
    this.logger.logInfo("CdAiUsageLogsService::update()/01");
    let q = this.b.getQuery(req);
    q = this.beforeUpdateSL(q);
    const serviceInput = {
      serviceModel: CdAiUsageLogsModel,
      docName: "CdAiUsageLogsService::update",
      cmd: {
        action: "update",
        query: q,
      },
      dSource: 1,
    };
    this.logger.logInfo("CdAiUsageLogsService::update()/02");
    this.b.updateSL$(req, res, serviceInput).subscribe((ret) => {
      this.b.cdResp.data = ret;
      this.b.connSLClose();
      this.b.respond(req, res);
    });
  }
  /**
   * harmonise any data that can
   * result in type error;
   * @param q
   * @returns
   */
  beforeUpdate(q) {
    if (q.update.CdAiUsageLogsEnabled === "") {
      q.update.CdAiUsageLogsEnabled = null;
    }
    return q;
  }
  beforeUpdateSL(q) {
    if (q.update.billEnabled === "") {
      q.update.billEnabled = null;
    }
    return q;
  }
  async remove(req, res) {
    //
  }
  /**
   * methods for transaction rollback
   */
  rbCreate() {
    return 1;
  }
  rbUpdate() {
    return 1;
  }
  rbDelete() {
    return 1;
  }
  async validateCreateSL(req, res) {
    return true;
  }
  /**
   *
   * curl test:
   * curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App", "m": "CdAiUsageLogss","c": "CdAiUsageLogs","a": "Get","dat": {"f_vals": [{"query": {"where": {"cdAiUsageLogsName": "Kenya"}}}],"token":"08f45393-c10e-4edd-af2c-bae1746247a1"},"args": null}' http://localhost:3001 -v  | jq '.'
   * @param req
   * @param res
   * @param q
   */
  async getCdAiUsageLogs(req, res, q) {
    if (q === null) {
      q = this.b.getQuery(req);
    }
    this.logger.logInfo("CdAiUsageLogsService::getCdAiUsageLogs/f:", q);
    if (!q) {
      return;
    }
    // const serviceInput = siGet(q,this)
    this.serviceModel = new CdAiUsageLogsModel();
    const serviceInput = this.b.siGet(
      q,
      "CdAiUsageLogsService::getCdAiUsageLogs",
      CompanyModel,
    );
    serviceInput.serviceModelInstance = this.serviceModel;
    serviceInput.serviceModel = CdAiUsageLogsModel;
    try {
      const r = await this.b.read(req, res, serviceInput);
      this.b.successResponse(req, res, r);
    } catch (e) {
      //   this.logger.logInfo('CdAiUsageLogsService::read$()/e:', e);
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "BaseService:update",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      await this.b.respond(req, res);
    }
  }
  /**
   * Queey params:
   * - selected data level eg all-available, world, continent, country, continental-region, national-region
   * - list of selected items
   * - eg:
   * - on selection of all-available, show list of countries availaable with summary data
   * - on selection of world show continents with available data
   * - on selection of continent show list of countries availaable with summary data
   * - on selection of countrie list of national-resions availaable with summary data
   * - on selection of national-region given national-resion with summary data
   * @param q
   */
  async getCdAiUsageLogss(req, res, q) {
    if (q === null) {
      q = this.b.getQuery(req);
    }
    if (!q) {
      return;
    }
    this.logger.logInfo("CdAiUsageLogsService::getCdAiUsageLogss/q:", q);
    const serviceInput = this.b.siGet(
      q,
      "CdAiUsageLogsService::getCdAiUsageLogs",
      CompanyModel,
    );
    try {
      const r = await this.b.read(req, res, serviceInput);
      this.b.successResponse(req, res, r);
    } catch (e) {
      //   this.logger.logInfo('CdAiUsageLogsService::read$()/e:', e);
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "BaseService:update",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      await this.b.respond(req, res);
    }
  }
  async getCdAiUsageLogsSL(req, res) {
    await this.b.initSqlite(req, res);
    const q = this.b.getQuery(req);
    this.logger.logInfo("CdAiUsageLogsService::getCdAiUsageLogs/q:", q);
    if (!q) {
      return;
    }
    const serviceInput = this.b.siGet(
      q,
      "CdAiUsageLogsService::getCdAiUsageLogs",
      CompanyModel,
    );
    try {
      this.b.readSL$(req, res, serviceInput).subscribe((r) => {
        // this.logger.logInfo('CdAiUsageLogsService::read$()/r:', r)
        this.b.i.code = "CdAiUsageLogsService::Get";
        const svSess = new SessionService();
        svSess.sessResp.cd_token = req.post.dat.token;
        svSess.sessResp.ttl = svSess.getTtl();
        this.b.setAppState(true, this.b.i, svSess.sessResp);
        this.b.cdResp.data = r;
        this.b.connSLClose();
        this.b.respond(req, res);
      });
    } catch (e) {
      //   this.logger.logInfo('CdAiUsageLogsService::read$()/e:', e);
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "CdAiUsageLogsService:update",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      await this.b.respond(req, res);
    }
  }
  /**
   *
   * curl test:
   * curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App","m": "CdAiUsageLogss","c": "CdAiUsageLogs","a": "GetType","dat":{"f_vals": [{"query":{"where": {"cdAiUsageLogsTypeId":100}}}],"token":"08f45393-c10e-4edd-af2c-bae1746247a1"},"args": null}' http://localhost:3001 -v  | jq '.'
   * @param req
   * @param res
   */
  getCdAiUsageLogsType(req, res) {
    const q = this.b.getQuery(req);
    this.logger.logInfo("CdAiUsageLogsService::getCdAiUsageLogs/f:", q);
    const serviceInput = {
      serviceModel: CdAiUsageLogsTypeModel,
      docName: "CdAiUsageLogsService::getCdAiUsageLogsType$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    try {
      this.b.read$(req, res, serviceInput).subscribe((r) => {
        // this.logger.logInfo('CdAiUsageLogsService::read$()/r:', r)
        this.b.i.code = "CdAiUsageLogsController::Get";
        const svSess = new SessionService();
        svSess.sessResp.cd_token = req.post.dat.token;
        svSess.sessResp.ttl = svSess.getTtl();
        this.b.setAppState(true, this.b.i, svSess.sessResp);
        this.b.cdResp.data = r;
        this.b.respond(req, res);
      });
    } catch (e) {
      //   this.logger.logInfo('CdAiUsageLogsService::read$()/e:', e);
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "BaseService:update",
        app_msg: "",
      };
      this.b.serviceErr(req, res, e, i.code);
      this.b.respond(req, res);
    }
  }
  /////////////////////////////////////////////////////////////////////////////////////////
  // Fetch all enabled CdAiUsageLogsTypes
  async getCdAiUsageLogsType2(req, res) {
    const q = this.b.getQuery(req);
    const serviceInput = {
      serviceInstance: this,
      serviceModel: CdAiUsageLogsTypeModel,
      docName: "CdAiUsageLogsTypeService::getCdAiUsageLogsType2",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    const dbResult = await this.b.read(req, res, serviceInput);
    this.b.i.code = "CdAiUsageLogsTypeService::getCdAiUsageLogsType2";
    const svSess = new SessionService();
    svSess.sessResp.cd_token = req.post.dat.token;
    svSess.sessResp.ttl = svSess.getTtl();
    this.b.setAppState(true, this.b.i, svSess.sessResp);
    this.b.cdResp.data = dbResult;
    this.b.respond(req, res);
  }
  // Search CdAiUsageLogsTypes with dynamic filtering
  async searchCdAiUsageLogsTypes(req, res) {
    try {
      await this.transformSearchQuery(req, res);
      // const take = 10; // Limit
      // const skip = 0;  // Offset
      const serviceInput = {
        serviceInstance: this,
        serviceModel: CdAiUsageLogsTypeModel,
        docName: "CdAiUsageLogsTypeService::searchCdAiUsageLogsTypes",
        cmd: {
          action: "find",
          query: {
            where: this.arrLikeConditions,
          },
        },
        dSource: 1,
      };
      console.log(
        "CdAiUsageLogsTypeService::searchCdAiUsageLogsTypes()/serviceInput.cmd.query:",
        serviceInput.cmd?.query,
      );
      const dbResult = await this.b.read(req, res, serviceInput);
      this.b.i.code = "CdAiUsageLogsTypeService::searchCdAiUsageLogsTypes";
      const svSess = new SessionService();
      svSess.sessResp.cd_token = req.post.dat.token;
      svSess.sessResp.ttl = svSess.getTtl();
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = dbResult;
      this.b.respond(req, res);
    } catch (e) {
      //   this.logger.logInfo('CdAiUsageLogsTypeService::searchCdAiUsageLogsTypes()/e:', e);
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "CdAiUsageLogsTypeService::searchCdAiUsageLogsTypes",
        app_msg: "",
      };
      this.b.serviceErr(req, res, e, i.code);
      this.b.respond(req, res);
    }
  }
  async transformSearchQuery(req, res) {
    const q = await this.b.getPlQuery(req);
    const tq = QueryTransformer.transformQuery(q);
    const COOP_TYPE_SEARCH_FIELDS = tq.searchFields;
    const searchTerm = tq.searchTerm;
    COOP_TYPE_SEARCH_FIELDS.forEach((field) => {
      this.arrLikeConditions.push({ [field]: Like(`%${searchTerm}%`) });
    });
  }
  // Utility: Generate OR conditions for a search term and fields
  orConditions(searchTerm, fields) {
    return fields.map((field) => ({
      [field]: `%${searchTerm}%`,
    }));
  }
  // Utility: Add additional OR conditions to existing conditions
  addOrConditions(where, extraConditions) {
    return where.map((condition) => ({
      ...condition,
      ...extraConditions,
    }));
  }
  //////////////////////////////////////////////////////////////////////////////////////////
  getCdObjTypeCount(req, res) {
    const q = this.b.getQuery(req);
    console.log("CdAiUsageLogsService::getCdObjCount/q:", q);
    const serviceInput = {
      serviceModel: CdAiUsageLogsTypeModel,
      docName: "CdAiUsageLogsService::getCdObjCount$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    this.b.readCount$(req, res, serviceInput).subscribe((r) => {
      this.b.i.code = "CdAiUsageLogsService::getCdObjTypeCount";
      const svSess = new SessionService();
      svSess.sessResp.cd_token = req.post.dat.token;
      svSess.sessResp.ttl = svSess.getTtl();
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = r;
      this.b.respond(req, res);
    });
  }
  /**
   *
   * @param req
   * @param res
   */
  getCdAiUsageLogsPaged(req, res) {
    const q = this.b.getQuery(req);
    this.logger.logInfo("CdAiUsageLogsService::getCdAiUsageLogsPaged/q:", q);
    const serviceInput = {
      serviceModel: CdAiUsageLogsViewModel,
      docName: "CdAiUsageLogsService::getCdAiUsageLogsPaged$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    this.b.readCount$(req, res, serviceInput).subscribe((r) => {
      this.b.i.code = "CdAiUsageLogsController::Get";
      const svSess = new SessionService();
      svSess.sessResp.cd_token = req.post.dat.token;
      svSess.sessResp.ttl = svSess.getTtl();
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = r;
      this.b.respond(req, res);
    });
  }
  getCdAiUsageLogsQB(req, res) {
    console.log("CdAiUsageLogsService::getCdAiUsageLogsQB()/1");
    this.b.entityAdapter.registerMappingFromEntity(CdAiUsageLogsViewModel);
    const q = this.b.getQuery(req);
    const serviceInput = {
      serviceModel: CdAiUsageLogsViewModel,
      docName: "CdAiUsageLogsService::getCdAiUsageLogsQB",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    this.b.readQB$(req, res, serviceInput).subscribe((r) => {
      this.b.i.code = serviceInput.docName;
      const svSess = new SessionService();
      svSess.sessResp.cd_token = req.post.dat.token;
      svSess.sessResp.ttl = svSess.getTtl();
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = r;
      this.b.respond(req, res);
    });
  }
  getPagedSL(req, res) {
    const q = this.b.getQuery(req);
    this.logger.logInfo("CdAiUsageLogsService::getCdAiUsageLogsPaged()/q:", q);
    const serviceInput = {
      serviceModel: CdAiUsageLogsModel,
      docName: "CdAiUsageLogsService::getCdAiUsageLogsPaged",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    this.b.readCountSL$(req, res, serviceInput).subscribe((r) => {
      this.b.i.code = "CdAiUsageLogsService::Get";
      const svSess = new SessionService();
      svSess.sessResp.cd_token = req.post.dat.token;
      svSess.sessResp.ttl = svSess.getTtl();
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = r;
      this.b.connSLClose();
      this.b.respond(req, res);
    });
  }
  getCdAiUsageLogsTypeCount(req, res) {
    const q = this.b.getQuery(req);
    this.logger.logInfo("CdAiUsageLogsService::getCdAiUsageLogsPaged/q:", q);
    const serviceInput = {
      serviceModel: CdAiUsageLogsTypeModel,
      docName: "CdAiUsageLogsService::getCdAiUsageLogsPaged$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    this.b.readCount$(req, res, serviceInput).subscribe((r) => {
      this.b.i.code = "CdAiUsageLogsController::Get";
      const svSess = new SessionService();
      svSess.sessResp.cd_token = req.post.dat.token;
      svSess.sessResp.ttl = svSess.getTtl();
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = r;
      this.b.respond(req, res);
    });
  }
  delete(req, res) {
    const q = this.b.getQuery(req);
    this.logger.logInfo("CdAiUsageLogsService::delete()/q:", q);
    const serviceInput = {
      serviceModel: CdAiUsageLogsModel,
      docName: "CdAiUsageLogsService::delete",
      cmd: {
        action: "delete",
        query: q,
      },
      dSource: 1,
    };
    this.b.delete$(req, res, serviceInput).subscribe((ret) => {
      this.b.cdResp.data = ret;
      this.b.respond(req, res);
    });
  }
  deleteSL(req, res) {
    const q = this.b.getQuery(req);
    this.logger.logInfo("CdAiUsageLogsService::deleteSL()/q:", q);
    const serviceInput = {
      serviceModel: CdAiUsageLogsModel,
      docName: "CdAiUsageLogsService::deleteSL",
      cmd: {
        action: "delete",
        query: q,
      },
      dSource: 1,
    };
    this.b.deleteSL$(req, res, serviceInput).subscribe((ret) => {
      this.b.cdResp.data = ret;
      this.b.respond(req, res);
    });
  }
  /**
   * This method is used internally by other methods in data agregation
   * @param req
   * @param res
   * @param q
   * @returns
   */
  async getCdAiUsageLogsI(req, res, q) {
    if (q === null) {
      q = this.b.getQuery(req);
    }
    if (!q) {
      return;
    }
    this.logger.logInfo("CdAiUsageLogsService::getCdAiUsageLogsI/q:", q);
    let serviceModel = new CdAiUsageLogsViewModel();
    const serviceInput = this.b.siGet(
      q,
      "CdAiUsageLogsService::getCdAiUsageLogsI",
      CdAiUsageLogsModel,
    );
    serviceInput.serviceModelInstance = serviceModel;
    serviceInput.serviceModel = CdAiUsageLogsViewModel;
    try {
      let respData = await this.b.read(req, res, serviceInput);
      return { data: respData, error: null };
    } catch (e) {
      //   this.logger.logInfo('CdAiUsageLogsService::read()/e:', e);
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "BaseService:update",
        app_msg: "",
      };
      return { data: null, error: e };
    }
  }
  /**
   * get data by geo-location
   * 1. get data from n selected locations
   * 2. list countries queried
   * 3. derive polulation data from geoLocation data
   * @param req
   * @param res
   */
  async StatsByGeoLocation(req, res, q) {
    if (q === null) {
      q = this.b.getQuery(req);
    }
    if (!q) {
      return;
    }
    let svCdGeoLocationService = new CdGeoLocationService();
    let gData = await svCdGeoLocationService.getGeoLocationI(req, res, q);
    // ,"order": {"cdAiUsageLogsDateLabel": "ASC"}
    q.order = { cdAiUsageLogsDateLabel: "ASC" };
    let cData = await this.getCdAiUsageLogsI(req, res, q);
    let ret = {
      geoLocationData: gData.data,
      cdAiUsageLogsData: cData.data,
    };
    this.logger.logInfo("CdAiUsageLogsService::StatsByGeoLocation()/ret:", ret);
    this.b.cdResp.data = await ret;
    this.b.respond(req, res);
  }
  async getCdAiUsageLogsEfgI(req, res, q) {
    if (q === null) {
      q = this.b.getQuery(req);
    }
    if (!q) {
      return;
    }
    this.logger.logInfo("CdAiUsageLogsService::getCdAiUsageLogsEfgI/q:", q);
    let serviceModel = new CdAiUsageLogsEfgViewModel();
    const serviceInput = this.b.siGet(
      q,
      "CdAiUsageLogsService::getCdAiUsageLogsI",
      CdAiUsageLogsModel,
    );
    serviceInput.serviceModelInstance = serviceModel;
    serviceInput.serviceModel = CdAiUsageLogsEfgViewModel;
    try {
      let respData = await this.b.read(req, res, serviceInput);
      return { data: respData, error: null };
    } catch (e) {
      //   this.logger.logInfo('CdAiUsageLogsService::read()/e:', e);
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "BaseService:update",
        app_msg: "",
      };
      return { data: null, error: e };
    }
  }
  //////////////////////////////////////////////////////////////////////////////////////////////////
  // STARTING MEMBER PROFILE FEATURES
  // Public method to update user member profile (e.g., avatar, bio)
  async updateCurrentMemberProfile(req, res) {
    const svSession = new SessionService();
    try {
      // const session = await svSession.getSession(req, res);
      // const userId = session[0].currentUserId;
      // const pl:CdAiUsageLogsEfgModel = this.b.getPlData(req)
      // const q = {where: {userId: userId,cdAiUsageLogsId: pl.cdAiUsageLogsId}}
      // const cdAiUsageLogsEfg = this.getCdAiUsageLogsEfgI(req, res, q)
      const updatedProfile = await this.b.getPlData(req); // Extract payload data
      // Validate input
      const validProfile = await this.validateProfileData(updatedProfile);
      if (validProfile) {
        // Prepare serviceInput for BaseService methods
        const serviceInput = {
          serviceInstance: this,
          serviceModel: CdAiUsageLogsEfgModel,
          docName: "CdAiUsageLogsEfgService::updateCurrentMemberProfile",
          cmd: {
            query: updatedProfile,
          },
        };
        // Update user member profile using BaseService's updateJSONColumnQB method
        const result = await this.b.updateJSONColumnQB(
          req,
          res,
          serviceInput,
          "user member profile",
          updatedProfile,
        );
        // Respond to API caller
        // return await this.b.respond(req, res, { success: true, data: result });
        this.b.cdResp.data = result;
        return await this.b.respond(req, res);
      } else {
        // return await this.b.respond(req, res, { success: false, message: "Invalid profile data" });
        const e = "Invalid profile data";
        this.logger.logInfo("UserService::read$()/e:", { error: e });
        this.b.err.push(e);
        const i = {
          messages: this.b.err,
          code: "UserService:updateProfile",
          app_msg: "",
        };
        await this.b.serviceErr(req, res, e, i.code);
        await this.b.respond(req, res);
      }
    } catch (e) {
      this.logger.logInfo("UserService::read$()/e:", { error: e });
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "UserService:updateProfile",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      await this.b.respond(req, res);
    }
  }
  async getUserProfile(req, res) {
    try {
      const pl = await this.b.getPlData(req);
      const userId = pl.userId;
      // Retrieve the user member profile using an internal method
      const profile = await this.getUserProfileI(req, res, userId);
      // Respond with the retrieved profile data
      this.b.cdResp.data = profile;
      return await this.b.respond(req, res);
    } catch (e) {
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "UserService:getProfile",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      await this.b.respond(req, res);
    }
  }
  // Public method to get a user member profile
  async getCurrentMemberProfile(req, res) {
    try {
      const svSession = new SessionService();
      const session = await svSession.getSession(req);
      const userId = session[0].currentUserId;
      console.log("UserServices::getCurrentMemberProfile9)/userId:", userId);
      // Retrieve the user member profile using an internal method
      const profile = await this.getUserProfileI(req, res, userId);
      // Respond with the retrieved profile data
      this.b.cdResp.data = profile;
      return await this.b.respond(req, res);
    } catch (e) {
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "UserService:getProfile",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      await this.b.respond(req, res);
    }
  }
  // Internal method to retrieve user member profile
  async getUserProfileI(req, res, cdAiUsageLogsEfgId) {
    try {
      // // Use BaseService to retrieve user member profile
      // const result = await this.b.read(req, res, serviceInput);
      // const user = await this.getCdAiUsageLogsEfgI(userId)
      const q = { where: { cdAiUsageLogsEfgId: cdAiUsageLogsEfgId } };
      const cdAiUsageLogsEfg = await this.getCdAiUsageLogsEfgI(req, res, q);
      if (cdAiUsageLogsEfg && cdAiUsageLogsEfg[0].cdAiUsageLogsEfgProfile) {
        let cdAiUsageLogsEfgProfileJSON = JSON.parse(
          cdAiUsageLogsEfg[0].cdAiUsageLogsEfgProfile,
        );
        if ("cdAiUsageLogsEfgData" in cdAiUsageLogsEfgProfileJSON) {
          // profile data is valid
          // update with latest user data
          cdAiUsageLogsEfgProfileJSON[0].cdAiUsageLogsEfgData =
            cdAiUsageLogsEfg;
        } else {
          // profile data is not set, so set it from default
          cdAiUsageLogsEfgProfileJSON = cdAiUsageLogsEfgProfileDefault;
          /**
           * this stage should be modified to
           * filter data based on pwermission setting
           * permission data can further be relied on
           * by the front end for hidden or other features of accessibility
           * to user member profile data.
           * This mechanism can be applied to all corpdesk resources
           */
          cdAiUsageLogsEfgProfileJSON.cdAiUsageLogsEfg.memberData =
            cdAiUsageLogsEfg;
        }
        return cdAiUsageLogsEfgProfileJSON; // Parse the JSON field
      } else {
        return null;
      }
    } catch (e) {
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "UserService:getProfile",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      await this.b.respond(req, res);
    }
  }
  // Internal method to handle profile updates
  async updateUserProfileI(req, res, userId, newProfileData) {
    try {
      // Use BaseService method to handle JSON updates for user member profile field
      const serviceInput = {
        serviceInstance: this,
        serviceModel: CdAiUsageLogsEfgModel,
        docName: "CdAiUsageLogsEfgService::updateUserProfileI",
        cmd: {
          query: newProfileData,
          // query: {
          //     where: { user_id: userId },
          //     update: { user member profile: newProfileData }
          // }
        },
      };
      await this.b.updateJSONColumnQB(
        req,
        res,
        serviceInput,
        "user member profile",
        newProfileData,
      );
      return newProfileData; // Return updated profile
    } catch (e) {
      throw new Error(`Error updating user member profile: ${e.message}`);
    }
  }
  // Helper method to validate profile data
  validateProfileData(profileData) {
    // Example validation for bio length
    if (profileData.bio && profileData.bio.length > 500) {
      return false; // Bio is too long
    }
    return true;
  }
}
