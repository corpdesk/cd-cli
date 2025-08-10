import { ViewEntity, ViewColumn } from "typeorm";
import { IQuery } from "../../../sys/base/IBase";

export function siGet(q: IQuery) {
  return {
    serviceModel: CdAi,
    docName: "CdAiModel::siGet",
    cmd: {
      action: "find",
      query: q,
    },
    dSource: 1,
  };
}

@ViewEntity({
  name: "cd_ai_view",
  synchronize: true,
  expression: `
            SELECT 
              cd_ai.cd_ai_id AS cdAiId,
              cd_ai.cd_ai_guid AS cdAiGuid,
              cd_ai.cd_ai_name AS cdAiName,
              cd_ai.cd_ai_description AS cdAiDescription,
              cd_ai.doc_id AS docId,
              cd_ai.cd_ai_type_id AS cdAiTypeId
            FROM
              cd_ai
            JOIN
              cd_ai_type ON cd_ai_type.cd_ai_type_id = cd_ai.cd_ai_type_id
          `,
})
export class CdAi {
  @ViewColumn({ name: "cd_ai_id" })
  cdAiId: number;

  @ViewColumn({ name: "cd_ai_guid" })
  cdAiGuid: string;

  @ViewColumn({ name: "cd_ai_name" })
  cdAiName: string;

  @ViewColumn({ name: "cd_ai_description" })
  cdAiDescription: string;

  @ViewColumn({ name: "doc_id" })
  docId: number;

  @ViewColumn({ name: "cd_ai_type_id" })
  cdAiTypeId: number;
}
