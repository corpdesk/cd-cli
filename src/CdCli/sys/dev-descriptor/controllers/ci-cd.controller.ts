import { CdFxReturn } from "../../base/i-base.js";
import { CiCdService } from "../services/ci-cd.service.js";

export class CiCdController{
    svCiCd = new CiCdService();
    async CreateFile(path: string, contents: string): Promise<CdFxReturn<null>> {
    return this.svCiCd.createFile(path,contents);
  }

  async ExecCmd(cmd: string, cwdOverride?: string): Promise<CdFxReturn<null>>  {
    return this.svCiCd.createFile(cmd,cwdOverride ?? '');
  }
}