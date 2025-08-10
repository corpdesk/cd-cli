import { BaseService } from "../../../../../../../sys/base/base.service.js";
import { CdAiUsageLogsTypeService } from "../services/cdAiUsageLogs-type.service.js";
import { CdAiUsageLogsService } from "../services/cdAiUsageLogs.service.js";
/**
 * This is a default controller based on name of the module.
 * Note the casing convention: CdAiUsageLogsController
 */
export class CdAiUsageLogsController {
  /**
   * BaseService is a generic service that provides common functionality
   * All controllers should have a handle to BaseService
   */
  b;
  /**
   * The naming of a service variable starts with 'sv' followed by the name of the service eg svUser.
   * Where service is 'sv' controller is 'ctl'
   */
  svCdAiUsageLogs;
  svCdAiUsageLogsType;
  /**
   * Note that in corpdesk, dependency injection is not used.
   * Instead, we instantiate the services directly in the controller.
   * It is also discouraged to use the `new` keyword in the constructor, unless absolutely necessary.
   * It is best to apply new() in the specific methods where the service is needed.
   */
  constructor() {
    this.b = new BaseService();
    /**
     * Services can be initialized here, but it is better to do so in the methods where they are needed.
     * This avoids potential issues with circular dependencies and keeps the controller lightweight.
     */
    this.svCdAiUsageLogs = new CdAiUsageLogsService();
    this.svCdAiUsageLogsType = new CdAiUsageLogsTypeService();
  }
  /**
       * This is a controller method for cd-api module.
       * Controller methods act as entrypoint to requests and responses from remote consumers.
       * So it is usually advisable to:
       * 1. Do a try-catch block to handle errors gracefully.
       * 2. Give an example of sample json request.
       * {
              "ctx": "App",
              "m": "CdAiUsageLogs",
              "c": "CdAiUsageLogs",
              "a": "Create",
              "dat": {
                  "f_vals": [
                      {
                          "data": {
                              "cdAiUsageLogsStatName": "/src/CdApi/sys/moduleman",
                              "CdAiUsageLogsTypeId": "7ae902cd-5bc5-493b-a739-125f10ca0268",
                              "parentModuleGuid": "00e7c6a8-83e4-40e2-bd27-51fcff9ce63b"
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
  async Create(req, res) {
    try {
      await this.svCdAiUsageLogs.create(req, res);
    } catch (e) {
      await this.b.serviceErr(req, res, e, "CdAiUsageLogsController:Create");
    }
  }
  /**
   * CreateM stands for Create multiple
   * @param req
   * @param res
   */
  async CreateM(req, res) {
    try {
      await this.svCdAiUsageLogs.createM(req, res);
    } catch (e) {
      await this.b.serviceErr(req, res, e, "CdAiUsageLogsController:CreateM");
    }
  }
  /**
   * CreateSL stands for Create via sqlite. SL is short for Sqlite.
   * In corpdesk any method that ends with SL is a method that uses sqlite.
   * @param req
   * @param res
   */
  async CreateSL(req, res) {
    try {
      await this.svCdAiUsageLogs.createSL(req, res);
    } catch (e) {
      await this.b.serviceErr(req, res, e, "CdAiUsageLogsController:CreateSL");
    }
  }
  /**
       * This is a controller method to fetch CdAiUsageLogs data.
       * The query property has obects whose interface is based on the IQuery interface.
       * Corpdesk IQuery interfce is structured around sql querying models.
       * You can set 'select', 'where', 'take', 'skip' and other properties.
       * {
              "ctx": "App",
              "m": "CdAiUsageLogs",
              "c": "CdAiUsageLogs",
              "a": "Get",
              "dat": {
                  "f_vals": [
                      {
                          "query": {
                              "where": {"cdAiUsageLogsStatName": "Kenya"}
                          }
                      }
                  ],
                  "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
              },
              "args": null
          }
  
          curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App", "m": "CdAiUsageLogss","c": "CdAiUsageLogs","a": "Get","dat": {"f_vals": [{"query": {"where": {"cdAiUsageLogsStatName": "Kenya"}}}],"token":"08f45393-c10e-4edd-af2c-bae1746247a1"},"args": null}' http://localhost:3001 -v  | jq '.'
       * @param req
       * @param res
       */
  async Get(req, res) {
    try {
      await this.svCdAiUsageLogs.getCdAiUsageLogs(req, res);
    } catch (e) {
      await this.b.serviceErr(req, res, e, "CdAiUsageLogsController:Get");
    }
  }
  /**
   * This is the 'Get' method that uses sqlite.
   * @param req
   * @param res
   */
  async GetSL(req, res) {
    try {
      await this.svCdAiUsageLogs.getCdAiUsageLogsSL(req, res);
    } catch (e) {
      await this.b.serviceErr(req, res, e, "CdAiUsageLogsController:GetSL");
    }
  }
  /**
       * This is a controller method to fetch CdAiUsageLogs Type data.
       * {
              "ctx": "App",
              "m": "CdAiUsageLogss",
              "c": "CdAiUsageLogs",
              "a": "GetType",
              "dat": {
                  "f_vals": [
                      {
                          "query": {
                              "where": {"cdAiUsageLogsTypeId": 100}
                          }
                      }
                  ],
                  "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
              },
              "args": null
          }
  
          curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App","m": "CdAiUsageLogss","c": "CdAiUsageLogs","a": "GetType","dat":{"f_vals": [{"query":{"where": {"cdAiUsageLogsTypeId":100}}}],"token":"08f45393-c10e-4edd-af2c-bae1746247a1"},"args": null}' http://localhost:3001 -v  | jq '.'
       * @param req
       * @param res
       */
  async GetType(req, res) {
    try {
      // await this.svCdAiUsageLogs.getCdAiUsageLogsType(req, res);
      await this.svCdAiUsageLogs.getCdObjTypeCount(req, res);
    } catch (e) {
      await this.b.serviceErr(req, res, e, "CdAiUsageLogsController:Get");
    }
  }
  /** Pageable request:
       *  Get count is used by controller method to apply pagable queries.
       *  Part of the return is also a count of records.
       *  'QB' on the name signify use of typeorm Query Builder.
       * {
              "ctx": "App",
              "m": "CdAiUsageLogss",
              "c": "CdAiUsageLogs",
              "a": "GetCount",
              "dat": {
                  "f_vals": [
                      {
                          "query": {
                              "select":["cdAiUsageLogsStatId","cdAiUsageLogsStatGuid"],
                              "where": {},
                              "take": 5,
                              "skip": 1
                              }
                      }
                  ],
                  "token": "29947F3F-FF52-9659-F24C-90D716BC77B2"
              },
              "args": null
          }
  
       curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App","m": "CdAiUsageLogss","c": "CdAiUsageLogs","a": "GetCount","dat": {"f_vals": [{"query": {"select":["cdAiUsageLogsStatId","cdAiUsageLogsStatGuid"],"where": {}, "take":5,"skip": 1}}],"token": "08f45393-c10e-4edd-af2c-bae1746247a1"},"args": null}' http://localhost:3001 -v  | jq '.'
  
       * @param req
       * @param res
       */
  async GetCount(req, res) {
    try {
      await this.svCdAiUsageLogs.getCdAiUsageLogsQB(req, res);
    } catch (e) {
      await this.b.serviceErr(req, res, e, "CdAiUsageLogsController:GetCount");
    }
  }
  /** Pageable request:
       * GetCount without 'QB' is a pagable query without use of typeorm Query Builder
       * {
              "ctx": "App",
              "m": "CdAiUsageLogss",
              "c": "CdAiUsageLogs",
              "a": "GetPaged",
              "dat": {
                  "f_vals": [
                      {
                          "query": {
                              "select":["cdAiUsageLogsStatId","cdAiUsageLogsStatGuid"],
                              "where": {},
                              "take": 5,
                              "skip": 1
                              }
                      }
                  ],
                  "token": "29947F3F-FF52-9659-F24C-90D716BC77B2"
              },
              "args": null
          }
  
       curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App","m": "CdAiUsageLogss","c": "CdAiUsageLogs","a": "GetPaged","dat": {"f_vals": [{"query": {"select":["cdAiUsageLogsStatId","cdAiUsageLogsStatGuid"],"where": {}, "take":5,"skip": 1}}],"token": "08f45393-c10e-4edd-af2c-bae1746247a1"},"args": null}' http://localhost:3001 -v  | jq '.'
  
       * @param req
       * @param res
       */
  async GetPaged(req, res) {
    try {
      await this.svCdAiUsageLogs.getCdAiUsageLogsPaged(req, res);
    } catch (e) {
      await this.b.serviceErr(req, res, e, "ModuleController:Get");
    }
  }
  /**
   * GetPagedSL is just like GetPaged but dedicated to Sqlite
   * @param req
   * @param res
   */
  async GetPagedSL(req, res) {
    try {
      await this.svCdAiUsageLogs.getPagedSL(req, res);
    } catch (e) {
      await this.b.serviceErr(req, res, e, "CdAiUsageLogsController:GetSL");
    }
  }
  /**
       * This is the controller method for updating records.
       * It used IQuery interface for update configuration.
       * IQuery is built with sql key words eg update, where
       * {
              "ctx": "App",
              "m": "CdAiUsageLogss",
              "c": "CdAiUsageLogs",
              "a": "Update",
              "dat": {
                  "f_vals": [
                      {
                          "query": {
                              "update": {
                                  "cdAiUsageLogsAssets": null
                              },
                              "where": {
                                  "cdAiUsageLogsStatId": 1
                              }
                          }
                      }
                  ],
                  "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
              },
              "args": {}
          }
  
       * curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App","m": "CdAiUsageLogss","c": "CdAiUsageLogs","a": "Update","dat": {"f_vals": [{"query": {"update": {"cdAiUsageLogsAssets": null},"where": {"cdAiUsageLogsStatId": 1}}}],"token": "08f45393-c10e-4edd-af2c-bae1746247a1"},"args": {}}' http://localhost:3001 -v  | jq '.'
       * @param req
       * @param res
       */
  async Update(req, res) {
    console.log("CdAiUsageLogsController::Update()/01");
    try {
      console.log("CdAiUsageLogsController::Update()/02");
      await this.svCdAiUsageLogs.update(req, res);
    } catch (e) {
      await this.b.serviceErr(req, res, e, "ModuleController:Update");
    }
  }
  /**
   * This is the update version for sqlite
   * @param req
   * @param res
   */
  async UpdateSL(req, res) {
    console.log("CdAiUsageLogsController::UpdateSL()/01");
    try {
      console.log("CdAiUsageLogsController::UpdateSL()/02");
      await this.svCdAiUsageLogs.updateSL(req, res);
    } catch (e) {
      await this.b.serviceErr(req, res, e, "CdAiUsageLogsController:UpdateSL");
    }
  }
  /**
       * This is the controller method for delete. The design is similar to update method.
       * {
              "ctx": "App",
              "m": "CdAiUsageLogss",
              "c": "CdAiUsageLogs",
              "a": "Delete",
              "dat": {
                  "f_vals": [
                      {
                          "query": {
                              "where": {"cdAiUsageLogsStatId": 69}
                          }
                      }
                  ],
                  "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
              },
              "args": null
          }
       * curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App","m": "CdAiUsageLogss","c": "CdAiUsageLogs","a": "Delete","dat": {"f_vals": [{"query": {"where": {"cdAiUsageLogsStatId": 69}}}],"token": "08f45393-c10e-4edd-af2c-bae1746247a1"},"args": {}}' http://localhost:3001 -v  | jq '.'
       * @param req
       * @param res
       */
  async Delete(req, res) {
    try {
      await this.svCdAiUsageLogs.delete(req, res);
    } catch (e) {
      await this.b.serviceErr(req, res, e, "ModuleController:Update");
    }
  }
  /**
   * This is the sqlite version of delete method
   * @param req
   * @param res
   */
  async DeleteSL(req, res) {
    try {
      await this.svCdAiUsageLogs.deleteSL(req, res);
    } catch (e) {
      await this.b.serviceErr(req, res, e, "BillController:DeleteSL");
    }
  }
  /**
   * This controller method is used for creating CdAiUsageLogs type
   * curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App","m": "CdAiUsageLogss","c": "CdAiUsageLogs","a": "CreateType","dat": {"f_vals": [{"data": {"cdAiUsageLogsTypeName": "Continental Apex"}}],"token": "3ffd785f-e885-4d37-addf-0e24379af338"},"args": {}}' http://localhost:3001 -v  | jq '.'
   * @param req
   * @param res
   */
  async CreateType(req, res) {
    try {
      await this.svCdAiUsageLogsType.create(req, res);
    } catch (e) {
      await this.b.serviceErr(
        req,
        res,
        e,
        "CdAiUsageLogsController:CreateType",
      );
    }
  }
  /**
   * This method is used ro updating CdAiUsageLogs type
   * curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App","m": "CdAiUsageLogss","c": "CdAiUsageLogs","a": "UpudateType","dat": {"f_vals": [{"data": {"cdAiUsageLogsTypeName": "Continental Apex"}}],"token": "3ffd785f-e885-4d37-addf-0e24379af338"},"args": {}}' http://localhost:3001 -v  | jq '.'
   * @param req
   * @param res
   */
  async UpdateType(req, res) {
    try {
      await this.svCdAiUsageLogsType.update(req, res);
    } catch (e) {
      await this.b.serviceErr(req, res, e, "CdAiUsageLogsController:EditType");
    }
  }
  /**
   * Method for deleting CdAiUsageLogs type
   * curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App","m": "CdAiUsageLogss","c": "CdAiUsageLogs","a": "DeleteType","dat": {"f_vals": [{"query": {"where": {"cdAiUsageLogsTypeId": 107}}}],"token": "08f45393-c10e-4edd-af2c-bae1746247a1"},"args": {}}' http://localhost:3001 -v  | jq '.'
   * @param req
   * @param res
   */
  async DeleteType(req, res) {
    try {
      await this.svCdAiUsageLogsType.delete(req, res);
    } catch (e) {
      await this.b.serviceErr(
        req,
        res,
        e,
        "CdAiUsageLogsController:DeleteType",
      );
    }
  }
}
