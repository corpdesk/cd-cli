import type {
  CdFxReturn,
  CdRequest,
  ICdResponse,
  ISessResp,
} from "../../base/i-base.js";
import type { CdDescriptor } from "../models/dev-descriptor.model.js";
/* eslint-disable style/brace-style */
import config from "../../../../config.js";
import { HttpService } from "../../base/http.service.js";
import { CdCliProfileController } from "../../cd-cli/controllers/cd-cli-profile.cointroller.js";
import CdLog from "../../cd-comm/controllers/cd-logger.controller.js";
import {
  CdObjModel,
  defaultCdObjEnv,
} from "../../moduleman/models/cd-obj.model.js";
import { CdCliStoreService } from "../../cd-cli/services/cd-cli-store.service.js";
import { CdObjTypeModel } from "../../moduleman/models/cd-obj-type.model.js";
import { GenericService } from "../../base/generic-service.js";
import { CdModuleDescriptor } from "../models/cd-module-descriptor.model.js";
import { ProfileStoreService } from "../../cd-cli/services/profile-store.service.js";

export class DevDescriptorService extends GenericService<CdObjModel> {
  cdToken = "";
  baseUrl = "";
  httpService;
  svCdCliStore = new CdCliStoreService();
  // private redisService = new CdCliStoreService();
  constructor() {
    super(CdObjModel);
    this.init();
  }

  async init() {
    CdLog.debug("DevDescriptorService::init()/starting...");
    // const createCdCliProfile = new CdCliProfileController();
    // const ctlSession = new SessonController();
    // const result1 = await createCdCliProfile.getSessionData();
    const profileRet = ProfileStoreService.getProfiles();
    const cdTokenRet = ProfileStoreService.getCdToken();
    this.baseUrl = ProfileStoreService.getBaseUrl();
    // CdLog.debug("DevDescriptorService::init()/profileRet:" + JSON.stringify(profileRet));
    if (!profileRet || !profileRet.state || !cdTokenRet.data || !cdTokenRet.state) {
      CdLog.error(`could not get valid profile and session`);
      return;
    }


    // if (result.data) {
    //   CdLog.debug("DevDescriptorService::init():01");
    //   const sid = result.data;
    //   CdLog.debug("DevDescriptorService::init():02");
    //   this.cdToken = sid;
    //   CdLog.debug("DevDescriptorService::init():03");
    //   // const httpService = new HttpService(true); // Enable debug mode
    //   // CdLog.debug("DevDescriptorService::init():04");
    //   // const ret = await httpService.getCdApiUrl(config.cdApiLocal);
    //   // CdLog.debug(`DevDescritorService::init()/ret:${JSON.stringify(ret)}`);
    //   if (ret) {
    //     this.baseUrl = ret;
    //     CdLog.debug(`DevDescritorService::init()/this.baseUrl:${this.baseUrl}`);
    //   }
    // } else {
    //   CdLog.error("Session is invalid");
    // }
  }

  async syncDescriptors(
    d: CdObjModel[],
    db: "mysql" | "redis" | "all" = "all"
  ): Promise<CdFxReturn<ICdResponse | CdObjModel[] | null>> {
    CdLog.debug(`DevDescriptorService::syncDescriptors() - Sync Target: ${db}`);

    let mysqlResult: CdFxReturn<ICdResponse> | null = null;
    let redisResult: CdFxReturn<CdObjModel[]> | null = null;

    // Sync to MySQL if needed
    if (db === "mysql" || db === "all") {
      try {
        const payload = this.setEnvelope("SyncDescriptors", { data: d });
        const httpService = new HttpService(true); // Enable debug mode if needed
        const profileName = "cdApiLocal";

        await httpService.init(profileName); // Initialize with profile
        mysqlResult = await httpService.request<ICdResponse>(
          {
            method: "POST",
            url: "/",
            data: payload,
          },
          profileName
        );

        CdLog.debug(
          `DevDescriptorService::syncDescriptors() - Synced ${d.length} descriptors to MySQL`
        );
      } catch (error) {
        return {
          data: null,
          state: false,
          message: `MySQL Sync Failed: ${(error as Error).message}`,
        };
      }
    }

    // Sync to Redis if needed
    if (db === "redis" || db === "all") {
      try {
        {
          const result = await this.svCdCliStore.createCdObj(d);
          redisResult = {
            ...result,
            data: result.data ?? [],
          };
        }

        CdLog.debug(
          `DevDescriptorService::syncDescriptors() - Synced ${d.length} descriptors to Redis`
        );
      } catch (error) {
        return {
          data: null,
          state: false,
          message: `Redis Sync Failed: ${(error as Error).message}`,
        };
      }
    }

    return {
      data: mysqlResult?.data || redisResult?.data || null,
      state: true,
      message: `Sync to ${db} completed successfully.`,
    };
  }

  async syncDescriptorData(
    descriptorData: any,
    db: "mysql" | "redis" | "all" = "all"
  ): Promise<CdFxReturn<ICdResponse | CdObjModel[]>> {
    CdLog.debug(
      `DevDescriptorService::syncDescriptorData() - Sync Target: ${db}`
    );

    let mysqlResult: CdFxReturn<ICdResponse> | null = null;
    let redisResult: CdFxReturn<CdObjModel[]> | null = null;

    // Sync to MySQL
    if (db === "mysql" || db === "all") {
      try {
        const payload = this.setEnvelope("SyncDescriptorData", {
          data: descriptorData,
        });

        const httpService = new HttpService(true); // Optional: enable debug mode
        const profileName = "cdApiLocal";

        await httpService.init(profileName);
        mysqlResult = await httpService.request<ICdResponse>(
          {
            method: "POST",
            url: "/",
            data: payload,
          },
          profileName
        );

        CdLog.debug(
          "DevDescriptorService::syncDescriptorData() - Synced descriptor data to MySQL"
        );
      } catch (error) {
        return {
          data: null,
          state: false,
          message: `MySQL Sync Failed: ${(error as Error).message}`,
        };
      }
    }

    // Sync to Redis
    if (db === "redis" || db === "all") {
      try {
        {
          const result = await this.svCdCliStore.createCdObj(descriptorData);
          redisResult = {
            ...result,
            data: result.data ?? [],
          };
        }

        CdLog.debug(
          "DevDescriptorService::syncDescriptorData() - Synced descriptor data to Redis"
        );
      } catch (error) {
        return {
          data: null,
          state: false,
          message: `Redis Sync Failed: ${(error as Error).message}`,
        };
      }
    }

    return {
      data: mysqlResult?.data || redisResult?.data || null,
      state: true,
      message: `Sync to ${db} completed successfully.`,
    };
  }

  async getDescriptorDataByNameAndType(
    name: string,
    type: string
  ): Promise<CdFxReturn<CdObjTypeModel>> {
    try {
      CdLog.debug(
        `DevDescriptorController::getDescriptorDataByNameAndType() - Fetching data for name: ${name}, type: ${type}`
      );

      // Get the CdObjType GUID for the given type
      const typeResult = await this.svCdCliStore.getCdObjTypeByName(type);
      CdLog.debug(
        `DevDescriptorController::getDescriptorDataByNameAndType()/typeResult: ${JSON.stringify(
          typeResult
        )}`
      );

      if (
        !typeResult.state ||
        !typeResult.data ||
        typeResult.data.length === 0
      ) {
        const errorMsg = `No CdObjType found for type: ${type}`;
        CdLog.error(errorMsg);
        return { data: null, state: false, message: errorMsg };
      }

      const cdObjTypeGuid = typeResult.data[0].cdObjTypeGuid;

      // Retrieve the object from Redis using the name and type GUID
      const indexKey = "cd_obj_index";
      const objGuid = await this.svCdCliStore.client.hget(indexKey, name);

      if (!objGuid) {
        const errorMsg = `No descriptor found for name: ${name}`;
        CdLog.error(errorMsg);
        return { data: null, state: false, message: errorMsg };
      }

      const objKey = `cd_obj:${objGuid}`;
      const descriptorJson = await this.svCdCliStore.client.call(
        "JSON.GET",
        objKey,
        "$"
      );

      if (!descriptorJson) {
        const errorMsg = `No descriptor data found for GUID: ${objGuid}`;
        CdLog.error(errorMsg);
        return { data: null, state: false, message: errorMsg };
      }

      // JSON.GET returns a JSON string — parse it
      const descriptorData = JSON.parse(descriptorJson as string)[0];

      CdLog.debug(`Successfully retrieved descriptor data for ${name}`);
      return {
        data: descriptorData as CdObjTypeModel,
        state: true,
        message: "Data retrieved successfully",
      };
    } catch (error: any) {
      CdLog.error(`Error retrieving descriptor data: ${error.message}`);
      return { data: null, state: false, message: `Error: ${error.message}` };
    }
  }

  setEnvelope(action: string, data: any): CdRequest {
    CdLog.debug("CdAppService::setEnvelope()/starting...");
    // Reset f_vals array to avoid unintended accumulation
    defaultCdObjEnv.dat.f_vals = [];
    // Update the envelope with new action and data
    defaultCdObjEnv.a = action;
    defaultCdObjEnv.dat.f_vals.push(data);
    defaultCdObjEnv.dat.token = this.cdToken;
    return defaultCdObjEnv;
  }
}
