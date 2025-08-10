import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { v4 as uuidv4 } from "uuid";

@Entity({
  name: "cd_ai",
  synchronize: true,
})
export class CdAiModel {
  @PrimaryGeneratedColumn({
    name: "cd_ai_id",
  })
  cdAiId: number;

  @Column({
    name: "cd_ai_guid",
  })
  cdAiGuid: string;

  @Column({
    name: "cd_ai_name",
    nullable: true,
  })
  cdAiName?: string;

  @Column({
    name: "cd_ai_description",
  })
  cdAiDescription: string;

  @Column({
    name: "cd_ai_doc_id",
    nullable: true,
  })
  cdAiDocId?: number;

  @Column({
    name: "cd_ai_enabled",
    nullable: true,
  })
  cdAiEnabled?: boolean;
}
