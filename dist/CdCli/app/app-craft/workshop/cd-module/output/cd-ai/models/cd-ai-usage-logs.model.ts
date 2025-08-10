import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { v4 as uuidv4 } from "uuid";

@Entity({
  name: "cd_ai_usage_logs",
  synchronize: true,
})
export class CdAiUsageLogsModel {
  @PrimaryGeneratedColumn({
    name: "cd_ai_usage_logs_id",
  })
  cdAiUsageLogsId: number;

  @Column({
    name: "cd_ai_usage_logs_guid",
  })
  cdAiUsageLogsGuid: string;

  @Column({
    name: "cd_ai_usage_logs_name",
    nullable: true,
  })
  cdAiUsageLogsName?: string;

  @Column({
    name: "cd_ai_usage_logs_description",
  })
  cdAiUsageLogsDescription: string;

  @Column({
    name: "cd_ai_usage_logs_doc_id",
    nullable: true,
  })
  cdAiUsageLogsDocId?: number;

  @Column({
    name: "cd_ai_usage_logs_enabled",
    nullable: true,
  })
  cdAiUsageLogsEnabled?: boolean;
}
