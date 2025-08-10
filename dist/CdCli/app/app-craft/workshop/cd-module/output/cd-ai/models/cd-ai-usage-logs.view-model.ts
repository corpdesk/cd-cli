import { ViewEntity, ViewColumn } from "typeorm";
import { IQuery } from "../../../sys/base/IBase";

export function siGet(q: IQuery) {
  return {
    serviceModel: CdAiUsageLogs,
    docName: "CdAiUsageLogsModel::siGet",
    cmd: {
      action: "find",
      query: q,
    },
    dSource: 1,
  };
}

@ViewEntity({
  name: "cd_ai_usage_logs_view",
  synchronize: true,
  expression: `
            SELECT 
              cd_ai_usage_logs.cd_ai_usage_logs_id AS cdAiUsageLogsId,
              cd_ai_usage_logs.cd_ai_usage_logs_guid AS cdAiUsageLogsGuid,
              cd_ai_usage_logs.cd_ai_usage_logs_name AS cdAiUsageLogsName,
              cd_ai_usage_logs.cd_ai_usage_logs_description AS cdAiUsageLogsDescription,
              cd_ai_usage_logs.doc_id AS docId,
              cd_ai_usage_logs.cd_ai_usage_logs_type_id AS cdAiUsageLogsTypeId
            FROM
              cd_ai_usage_logs
            JOIN
              cd_ai_usage_logs_type ON cd_ai_usage_logs_type.cd_ai_usage_logs_type_id = cd_ai_usage_logs.cd_ai_usage_logs_type_id
          `,
})
export class CdAiUsageLogs {
  @ViewColumn({ name: "cd_ai_usage_logs_id" })
  cdAiUsageLogsId: number;

  @ViewColumn({ name: "cd_ai_usage_logs_guid" })
  cdAiUsageLogsGuid: string;

  @ViewColumn({ name: "cd_ai_usage_logs_name" })
  cdAiUsageLogsName: string;

  @ViewColumn({ name: "cd_ai_usage_logs_description" })
  cdAiUsageLogsDescription: string;

  @ViewColumn({ name: "doc_id" })
  docId: number;

  @ViewColumn({ name: "cd_ai_usage_logs_type_id" })
  cdAiUsageLogsTypeId: number;
}
