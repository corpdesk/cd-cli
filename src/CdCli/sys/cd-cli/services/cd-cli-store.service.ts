import { createClient } from "redis";
// import Redis from 'ioredis';
import Redis, { Redis as RedisClient } from "ioredis";
import { CdObjModel } from "../../moduleman/models/cd-obj.model.js";
import { CD_FX_FAIL, CdFxReturn } from "../../base/IBase.js";
import { CdObjTypeModel } from "../../moduleman/models/cd-obj-type.model.js";
import {
  CdDescriptor,
  mapDescriptorToCdObj,
} from "../../dev-descriptor/models/dev-descriptor.model.js";
import CdLog from "../../cd-comm/controllers/cd-logger.controller.js";

// export class CdCliStoreService {
//   client: RedisClient;
//   // redisClient;

//   constructor() {
//     // io redis
//     this.client = new RedisClient({
//       host: "localhost", // Update this if needed
//       port: 6379,
//       enableAutoPipelining: true,
//       showFriendlyErrorStack: true,
//     });
//   }

//   async createCdObjType(cdObjType: CdObjTypeModel): Promise<void> {
//     if (!cdObjType.cdObjTypeGuid) {
//       throw new Error("cdObjTypeGuid is required for saving CdObjType");
//     }

//     const key = `cd_obj_type:${cdObjType.cdObjTypeGuid}`;

//     // Use the JSON.SET command manually
//     await this.client.call("JSON.SET", key, "$", JSON.stringify(cdObjType));

//     // Use the lowercase version of hSet
//     await this.client.hset(
//       "cd_obj_type_index",
//       cdObjType.cdObjTypeGuid,
//       cdObjType.cdObjTypeName
//     );
//   }

//   async createCdObj(
//     cdObjects: CdObjModel[]
//   ): Promise<CdFxReturn<CdObjModel[]>> {
//     try {
//       const retArr: CdObjModel[] = [];

//       // Ensure 'descriptor' type exists in Redis
//       let resultCdObjTypeGuid = await this.getCdObjTypeByName("descriptor");
//       if (!resultCdObjTypeGuid.state || !resultCdObjTypeGuid.data) {
//         return CD_FX_FAIL;
//       }
//       let cdObjTypes: CdObjTypeModel[] = resultCdObjTypeGuid.data;
//       let descriptorCdObjTypeGuid = cdObjTypes[0].cdObjTypeGuid;
//       if (!descriptorCdObjTypeGuid) {
//         descriptorCdObjTypeGuid = this.generateGuid();
//         await this.createCdObjType({
//           cdObjTypeName: "descriptor",
//           cdObjTypeGuid: descriptorCdObjTypeGuid,
//         });
//       }

//       for (const d of cdObjects) {
//         CdLog.debug(
//           "CdCliStoreService::createCdObj()/processing descriptor:",
//           d
//         );

//         const cdObj: CdObjModel = mapDescriptorToCdObj(d);
//         cdObj.cdObjTypeGuid = descriptorCdObjTypeGuid;

//         // Generate a valid GUID if missing
//         if (!cdObj.cdObjGuid) {
//           cdObj.cdObjGuid = this.generateGuid();
//         }

//         if (d.cdObjId === -1) {
//           cdObj.parentModuleGuid = "d3f1a14d-6fb1-468c-b627-9a098ead6d5d";
//         }

//         // Skip saving if cdObjGuid is still invalid
//         if (!cdObj.cdObjGuid) {
//           CdLog.warning("Skipping save: Invalid cdObjGuid for", cdObj);
//           continue;
//         }

//         const key = `cd_obj:${cdObj.cdObjTypeGuid}`;

//         // Use the JSON.SET command manually
//         await this.client.call("JSON.SET", key, "$", JSON.stringify(cdObj));

//         // Use the lowercase version of hSet
//         await this.client.hset(
//           "cd_obj_index",
//           cdObj.cdObjTypeGuid,
//           cdObj.cdObjName
//         );

//         retArr.push(cdObj);
//       }

//       return {
//         data: retArr,
//         state: true,
//         message: "Descriptors stored successfully in Redis",
//       };
//     } catch (error: any) {
//       return {
//         data: null,
//         state: false,
//         message: `Error storing descriptors in Redis: ${error.message}`,
//       };
//     }
//   }

//   async getCdObjTypeByName(
//     cdObjTypeName: string
//   ): Promise<CdFxReturn<CdObjTypeModel[]>> {
//     try {
//       const key = `cd_obj_type:${cdObjTypeName}`;

//       // Check if Redis supports JSON.GET before executing
//       const modules = await this.client.call("MODULE", "LIST");
//       const modulesArr = modules as any[];
//       if (!modulesArr.some((mod: any) => mod[1] === "ReJSON")) {
//         throw new Error("RedisJSON module is not enabled.");
//       }

//       const cdObjTypeData = await this.client.json.get(key);
//       CdLog.debug(`getCdObjTypeByName()/${JSON.stringify(cdObjTypeData)}`);

//       if (!cdObjTypeData) {
//         return {
//           data: [],
//           state: false,
//           message: `No CdObjType found for name: ${cdObjTypeName}`,
//         };
//       }

//       return {
//         data: [cdObjTypeData as CdObjTypeModel],
//         state: true,
//         message: "CdObjType retrieved successfully",
//       };
//     } catch (error: any) {
//       if (error.message.includes("unknown command 'JSON.GET'")) {
//         return {
//           data: [],
//           state: false,
//           message:
//             "RedisJSON module is not enabled. Please install Redis Stack or enable the module.",
//         };
//       }
//       return {
//         data: [],
//         state: false,
//         message: `Error retrieving CdObjType: ${error.message}`,
//       };
//     }
//   }

//   /**
//    * Generates a new GUID
//    */
//   private generateGuid(): string {
//     return crypto.randomUUID(); // Replace with appropriate GUID generator if needed
//   }

//   async getDescriptorCdObjTypeGuid(): Promise<CdFxReturn<string>> {
//     const resultCdObjTypeGuid = await this.getCdObjTypeByName("descriptor");
//     if (!resultCdObjTypeGuid.state || !resultCdObjTypeGuid.data) {
//       return CD_FX_FAIL;
//     }
//     let cdObjTypes: CdObjTypeModel[] = resultCdObjTypeGuid.data;
//     let descriptorCdObjTypeGuid = cdObjTypes[0].cdObjTypeGuid;

//     // return ret.length > 0 ? ret[0].cdObjTypeGuid : this.generateGuid();
//     if (!descriptorCdObjTypeGuid) {
//       descriptorCdObjTypeGuid = this.generateGuid();
//     }
//     let ret = {
//       data: descriptorCdObjTypeGuid,
//       state: true,
//       message: "",
//     };
//     return ret;
//   }

//   async getCdObj(cdObjId: number): Promise<CdFxReturn<CdObjModel>> {
//     try {
//       const key = `cd_obj:${cdObjId}`;
//       const result = (await this.client.json.get(key)) as CdObjModel | null;

//       if (!result) {
//         return { data: null, state: false, message: "CdObj not found" };
//       }
//       return { data: result, state: true };
//     } catch (error: any) {
//       return {
//         data: null,
//         state: false,
//         message: `Error fetching CdObj: ${error.message}`,
//       };
//     }
//   }

//   async searchCdObjByName(name: string): Promise<CdFxReturn<CdObjModel[]>> {
//     try {
//       const ids = await this.client.hKeys("cd_obj_index");
//       const matchingIds = ids.filter((id) => id.includes(name));

//       const results: CdObjModel[] = [];
//       for (const id of matchingIds) {
//         const cdObj = await this.getCdObj(parseInt(id));
//         if (cdObj.state && cdObj.data) {
//           results.push(cdObj.data);
//         }
//       }

//       return { data: results, state: true };
//     } catch (error: any) {
//       return {
//         data: null,
//         state: false,
//         message: `Error searching CdObj: ${error.message}`,
//       };
//     }
//   }

//   async deleteCdObj(cdObjId: number): Promise<CdFxReturn<null>> {
//     try {
//       const key = `cd_obj:${cdObjId}`;
//       await this.client.del(key);
//       await this.client.hDel("cd_obj_index", cdObjId.toString());

//       return { data: null, state: true, message: "CdObj deleted successfully" };
//     } catch (error: any) {
//       return {
//         data: null,
//         state: false,
//         message: `Error deleting CdObj: ${error.message}`,
//       };
//     }
//   }
// }
export class CdCliStoreService {
  client: RedisClient;

  constructor() {
    this.client = new RedisClient({
      host: "localhost",
      port: 6379,
      enableAutoPipelining: true,
      showFriendlyErrorStack: true,
    });
  }

  async createCdObjType(cdObjType: CdObjTypeModel): Promise<void> {
    if (!cdObjType.cdObjTypeGuid) {
      throw new Error("cdObjTypeGuid is required for saving CdObjType");
    }

    const key = `cd_obj_type:${cdObjType.cdObjTypeGuid}`;
    await this.client.call("JSON.SET", key, "$", JSON.stringify(cdObjType));
    await this.client.hset(
      "cd_obj_type_index",
      cdObjType.cdObjTypeGuid,
      cdObjType.cdObjTypeName
    );
  }

  async createCdObj(cdObjects: CdObjModel[]): Promise<CdFxReturn<CdObjModel[]>> {
    try {
      const retArr: CdObjModel[] = [];

      let resultCdObjTypeGuid = await this.getCdObjTypeByName("descriptor");
      if (!resultCdObjTypeGuid.state || !resultCdObjTypeGuid.data) return CD_FX_FAIL;

      let cdObjTypes: CdObjTypeModel[] = resultCdObjTypeGuid.data;
      let descriptorCdObjTypeGuid = cdObjTypes[0]?.cdObjTypeGuid ?? this.generateGuid();

      if (!cdObjTypes[0]?.cdObjTypeGuid) {
        await this.createCdObjType({
          cdObjTypeName: "descriptor",
          cdObjTypeGuid: descriptorCdObjTypeGuid,
        });
      }

      for (const d of cdObjects) {
        CdLog.debug("CdCliStoreService::createCdObj()/processing descriptor:", d);
        const cdObj: CdObjModel = mapDescriptorToCdObj(d);
        cdObj.cdObjTypeGuid = descriptorCdObjTypeGuid;
        cdObj.cdObjGuid = cdObj.cdObjGuid || this.generateGuid();

        if (d.cdObjId === -1) {
          cdObj.parentModuleGuid = "d3f1a14d-6fb1-468c-b627-9a098ead6d5d";
        }

        if (!cdObj.cdObjGuid) {
          CdLog.warning("Skipping save: Invalid cdObjGuid for", cdObj);
          continue;
        }

        const key = `cd_obj:${cdObj.cdObjTypeGuid}`;
        await this.client.call("JSON.SET", key, "$", JSON.stringify(cdObj));
        await this.client.hset("cd_obj_index", cdObj.cdObjTypeGuid, cdObj.cdObjName);
        retArr.push(cdObj);
      }

      return {
        data: retArr,
        state: true,
        message: "Descriptors stored successfully in Redis",
      };
    } catch (error: any) {
      return {
        data: null,
        state: false,
        message: `Error storing descriptors in Redis: ${error.message}`,
      };
    }
  }

  async getCdObjTypeByName(cdObjTypeName: string): Promise<CdFxReturn<CdObjTypeModel[]>> {
    try {
      const key = `cd_obj_type:${cdObjTypeName}`;
      const modules = await this.client.call("MODULE", "LIST") as any[];
      if (!modules.some((mod) => mod[1] === "ReJSON")) {
        throw new Error("RedisJSON module is not enabled.");
      }

      const cdObjTypeData = await this.client.call("JSON.GET", key, "$") as string | null;
      if (!cdObjTypeData) {
        return {
          data: [],
          state: false,
          message: `No CdObjType found for name: ${cdObjTypeName}`,
        };
      }

      CdLog.debug(`getCdObjTypeByName()/${cdObjTypeData}`);
      const parsed = JSON.parse(cdObjTypeData);
      const data = parsed[0] as CdObjTypeModel;

      return {
        data: [data],
        state: true,
        message: "CdObjType retrieved successfully",
      };
    } catch (error: any) {
      if (error.message.includes("unknown command 'JSON.GET'")) {
        return {
          data: [],
          state: false,
          message: "RedisJSON module is not enabled. Please install Redis Stack or enable the module.",
        };
      }
      return {
        data: [],
        state: false,
        message: `Error retrieving CdObjType: ${error.message}`,
      };
    }
  }

  async getDescriptorCdObjTypeGuid(): Promise<CdFxReturn<string>> {
    const resultCdObjTypeGuid = await this.getCdObjTypeByName("descriptor");
    if (!resultCdObjTypeGuid.state || !resultCdObjTypeGuid.data) return CD_FX_FAIL;

    let descriptorCdObjTypeGuid = resultCdObjTypeGuid.data[0]?.cdObjTypeGuid || this.generateGuid();

    return {
      data: descriptorCdObjTypeGuid,
      state: true,
      message: "",
    };
  }

  async getCdObj(cdObjId: number): Promise<CdFxReturn<CdObjModel>> {
    try {
      const key = `cd_obj:${cdObjId}`;
      const jsonResult = await this.client.call("JSON.GET", key, "$") as string | null;

      if (!jsonResult) {
        return { data: null, state: false, message: "CdObj not found" };
      }

      const parsed = JSON.parse(jsonResult);
      const data = parsed[0] as CdObjModel;

      return { data, state: true };
    } catch (error: any) {
      return {
        data: null,
        state: false,
        message: `Error fetching CdObj: ${error.message}`,
      };
    }
  }

  async searchCdObjByName(name: string): Promise<CdFxReturn<CdObjModel[]>> {
    try {
      const ids = await this.client.hkeys("cd_obj_index");
      const matchingIds = ids.filter((id) => id.includes(name));

      const results: CdObjModel[] = [];
      for (const id of matchingIds) {
        const cdObj = await this.getCdObj(parseInt(id));
        if (cdObj.state && cdObj.data) {
          results.push(cdObj.data);
        }
      }

      return { data: results, state: true };
    } catch (error: any) {
      return {
        data: null,
        state: false,
        message: `Error searching CdObj: ${error.message}`,
      };
    }
  }

  async deleteCdObj(cdObjId: number): Promise<CdFxReturn<null>> {
    try {
      const key = `cd_obj:${cdObjId}`;
      await this.client.del(key);
      await this.client.hdel("cd_obj_index", cdObjId.toString());

      return { data: null, state: true, message: "CdObj deleted successfully" };
    } catch (error: any) {
      return {
        data: null,
        state: false,
        message: `Error deleting CdObj: ${error.message}`,
      };
    }
  }

  private generateGuid(): string {
    return crypto.randomUUID();
  }
}
