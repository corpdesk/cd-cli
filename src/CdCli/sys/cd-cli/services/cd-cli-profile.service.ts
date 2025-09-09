/* eslint-disable style/brace-style */

import type {
  ICdRequest,
  ICdResponse,
  IJsonUpdate,
  IQuery,
} from '../../base/i-base.js';
import { HttpService } from '../../base/http.service.js';
import { DEFAULT_CD_RESPONSE, DEFAULT_ENVELOPE_CREATE } from '../../base/i-base.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import config from '../../../../config.js';

export class CdCliProfileService {
  // svServer: any;
  postData: ICdRequest = DEFAULT_ENVELOPE_CREATE;
  constructor() {
    // this.svServer = new HttpService();
  }

  /**
   *
   * @param newCdCliProfile
   * @param cdToken
   * {
        "ctx": "Sys",
        "m": "Moduleman",
        "c": "Module",
        "a": "Create",
        "dat": {
            "f_vals": [
                {
                    "data": {
                        "moduleName": "xxx30102021",
                        "isSysModule": false
                    }
                }
            ],
            "token": "3ffd785f-e885-4d37-addf-0e24379af338"
        },
        "args": {}
    }
   */
  createCdCliProfile(newCdCliProfile: any, cdToken: string) {
    // console.log('starting createCdCliProfile()/01:');
    const svServer = new HttpService();
    this.setEnvelopeCreateCdCliProfile(newCdCliProfile, cdToken);
    console.log(
      'createCdCliProfile()/this.postData:',
      JSON.stringify(this.postData),
    );
    return svServer.proc(
      this.setEnvelopeCreateCdCliProfile(newCdCliProfile, cdToken),
    );
  }

  setEnvelopeCreateCdCliProfile(d: any, cdToken: string) {
    console.log('starting setEnvelopeCreateCdCliProfile()/d.data:', d.data);
    return {
      ctx: 'Sys',
      m: 'CdCli',
      c: 'CdCliProfile',
      a: 'Create',
      dat: {
        f_vals: [
          {
            data: d.data,
          },
        ],
        token: cdToken,
      },
      args: {},
    };
  }

  // async getCdCliProfile(q: IQuery, cdToken: string) {
  //   CdLog.debug('starting getCdCliProfile():', { token: cdToken, query: q });
  //   const httpService = new HttpService();
  //   await httpService.init(config.cdApiLocal); // Ensure axiosInstance is set with preferred profile
  //   this.setEnvelopeGetCountCdCliProfile(q, cdToken);
  //   return httpService.proc(this.postData);
  // }

  // setEnvelopeGetCountCdCliProfile(q: IQuery, cdToken: string) {
  //   CdLog.debug('starting setEnvelopeGetCountCdCliProfile():', {
  //     token: cdToken,
  //     query: q,
  //   });
  //   this.postData = {
  //     ctx: 'Sys',
  //     m: 'CdCli',
  //     c: 'CdCliProfile',
  //     a: 'GetCount',
  //     dat: {
  //       f_vals: [
  //         {
  //           query: q,
  //         },
  //       ],
  //       token: cdToken,
  //     },
  //     args: {},
  //   };
  // }

  // async getCdCliProfile(q: IQuery, cdToken: string): Promise<any> {
  //   CdLog.debug('starting getCdCliProfile():', { token: cdToken, query: q });

  //   try {
  //     // Initialize HttpService with debugging enabled
  //     const httpService = new HttpService(true);

  //     // Get the base URL dynamically
  //     const baseUrl = await httpService.getCdApiUrl(config.cdApiLocal);
  //     CdLog.debug('getCdCliProfile()/baseUrl:', { baseUrl });

  //     if (!baseUrl) {
  //       throw new Error(
  //         'API base URL not found. Ensure "cd-api-local" is configured.',
  //       );
  //     }

  //     await httpService.init(config.cdApiLocal);

  //     // Prepare the envelope for the request
  //     const postData = this.setEnvelopeGetCountCdCliProfile(q, cdToken);

  //     // Make the HTTP request using proc2()
  //     return await httpService.proc2({
  //       method: 'POST',
  //       url: '/', // Single route for cd-api
  //       data: postData,
  //       headers: {
  //         Authorization: `Bearer ${cdToken}`,
  //         Accept: 'application/json',
  //       },
  //     });
  //   } catch (error: any) {
  //     CdLog.error('Error in getCdCliProfile():', error.message);
  //     throw error; // Re-throw the error for further handling
  //   }
  // }

  async getCdCliProfile(q: IQuery, cdToken: string): Promise<ICdResponse> {
    CdLog.debug('Starting getCdCliProfile():', { token: cdToken, query: q });

    const httpService = new HttpService(true);
    let ret: ICdResponse = DEFAULT_CD_RESPONSE;

    try {
      const initialized = await httpService.init(config.cdApiLocal);
      if (!initialized) {
        const msg = `Profile '${config.cdApiLocal}' could not be initialized.`;
        CdLog.error(msg);
        ret.app_state.info!.app_msg = msg;
        return ret;
      }

      const postData: ICdRequest = this.setEnvelopeGetCountCdCliProfile(
        q,
        cdToken,
      );

      const response = await httpService.request<ICdResponse>(
        {
          method: 'POST',
          url: '/',
          headers: {
            Authorization: `Bearer ${cdToken}`,
            Accept: 'application/json',
          },
          data: postData,
        },
        config.cdApiLocal,
      );

      if (!response.state) {
        const msg = `getCdCliProfile() failed: ${response.message}`;
        CdLog.error(msg);
        ret.app_state.info!.app_msg =
          response.message || 'Unknown error from cd-api';
        return ret;
      }

      if (!response.data) {
        const msg = 'getCdCliProfile() response.data is undefined or null';
        CdLog.error(msg);
        ret.app_state.info!.app_msg = msg;
        return ret;
      }

      return response.data;
    } catch (err: any) {
      const msg = `getCdCliProfile() encountered an error: ${err.message || err}`;
      CdLog.error(msg);
      ret.app_state.info!.app_msg = msg;
      return ret;
    }
  }

  setEnvelopeGetCountCdCliProfile(q: IQuery, cdToken: string): ICdRequest {
    CdLog.debug('starting setEnvelopeGetCountCdCliProfile():', {
      token: cdToken,
      query: q,
    });

    // Build the envelope for the API request
    const envelope: ICdRequest = {
      ctx: 'Sys',
      m: 'CdCli',
      c: 'CdCliProfile',
      a: 'GetCount',
      dat: {
        f_vals: [
          {
            query: q,
          },
        ],
        token: cdToken,
      },
      args: {},
    };

    CdLog.debug('setEnvelopeGetCountCdCliProfile()/Envelope:', envelope);

    return envelope; // Return the envelope to be used in the request
  }

  getCdCliProfileType(q: IQuery, cdToken: string) {
    const svServer = new HttpService();
    this.setEnvelopeCdCliProfileType(q, cdToken);
    console.log(
      'getCdCliProfile()/this.postData:',
      JSON.stringify(this.postData),
    );
    return svServer.proc(this.postData);
  }

  setEnvelopeGetCdCliProfileProfile(
    uidObject: { userId: number },
    cdToken: string,
  ) {
    this.postData = {
      ctx: 'Sys',
      m: 'CdCli',
      c: 'CdCliProfile',
      a: 'GetCdCliProfileProfile',
      dat: {
        f_vals: [
          {
            data: uidObject,
          },
        ],
        token: cdToken,
      },
      args: {},
    };
  }

  setEnvelopeCdCliProfileType(q: IQuery, cdToken: string) {
    this.postData = {
      ctx: 'Sys',
      m: 'CdCli',
      c: 'CdCliProfile',
      a: 'GetType',
      dat: {
        f_vals: [
          {
            query: q,
          },
        ],
        token: cdToken,
      },
      args: {},
    };
  }

  updateCdCliProfile(q: IQuery, cdToken: string) {
    const svServer = new HttpService();
    this.setEnvelopeUpdate(q, cdToken);
    console.log(
      'updateCdCliProfile()/this.postData:',
      JSON.stringify(this.postData),
    );
    return svServer.proc(this.postData);
  }

  setEnvelopeUpdate(q: IQuery, cdToken: string) {
    this.postData = {
      ctx: 'Sys',
      m: 'CdCli',
      c: 'CdCliProfile',
      a: 'Update',
      dat: {
        f_vals: [
          {
            query: q,
          },
        ],
        token: cdToken,
      },
      args: {},
    };
  }

  /**
   * curl -k -X POST -H 'Content-Type: application/json' -d '{
        "ctx": "Sys",
        "m": "CdCli",
        "c": "CdCliProfile",
        "a": "UpdateCdCliProfile",
        "dat": {
          "f_vals": [
            {
              "query": {
                "update": null,
                "where": {
                  "userId": 1010,
                  "cdCliProfileId": 2
                }
              },
              "jsonUpdate": [
                {
                  "modelField": "cdCliProfileData",
                  "path": [
                    "cdVault",
                    "[0]",
                    "encryptedValue"
                  ],
                  "value": "123456abcdefgABC"
                },
                {
                  "modelField": "cdCliProfileData",
                  "path": [
                    "cdVault",
                    "[0]",
                    "EncryptionMeta"
                  ],
                  "value": {
                    "iv": "1a94d8c6b7e8...sample..901f",
                    "encoding": "hex",
                    "algorithm": "aes-256-cbc",
                    "encryptedToken": "3a94d8c6b7...e04a"
                  }
                }
              ]
            }
          ],
          "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
        },
        "args": {}
      }' https://localhost:3001/api -v | jq '.'
   * @param profileId
   * @param userId
   * @param jPath
   * @param itemValue
   */

  async updateCdCliProfileData(
    q: IQuery,
    jsonUpdate: IJsonUpdate[],
    cdToken: string,
  ) {
    CdLog.debug('starting CdAutoGitController::updateCdCliProfileData()');
    CdLog.debug('CdAutoGitController::updateCdVault()/q:', q);
    CdLog.debug('CdAutoGitController::updateCdVault()/jsonUpdate:', jsonUpdate);
    CdLog.debug('CdAutoGitController::updateCdVault()/cdToken:', {
      t: cdToken,
    });
    const svServer = new HttpService();
    this.setEnvelopeUpdateCdCliProfileData(q, jsonUpdate, cdToken);
    console.log(
      'updateCdCliProfileData()/this.postData:',
      JSON.stringify(this.postData),
    );
    return svServer.proc(this.postData);
  }

  setEnvelopeUpdateCdCliProfileData(
    q: IQuery,
    jUpdate: IJsonUpdate[],
    cdToken: string,
  ) {
    this.postData = {
      ctx: 'Sys',
      m: 'CdCli',
      c: 'CdCliProfile',
      a: 'UpdateCdCliProfile',
      dat: {
        f_vals: [
          {
            query: q,
            jsonUpdate: jUpdate,
          },
        ],
        token: cdToken,
      },
      args: {},
    };
  }

  deleteCdCliProfile(q: IQuery, cdToken: string) {
    const svServer = new HttpService();
    this.setEnvelopeDelete(q, cdToken);
    console.log(
      'deleteCdCliProfile()/this.postData:',
      JSON.stringify(this.postData),
    );
    return svServer.proc(this.postData);
  }

  setEnvelopeDelete(q: IQuery, cdToken: string) {
    this.postData = {
      ctx: 'Sys',
      m: 'CdCli',
      c: 'CdCliProfile',
      a: 'Delete',
      dat: {
        f_vals: [
          {
            query: q,
          },
        ],
        token: cdToken,
      },
      args: {},
    };
  }
}
