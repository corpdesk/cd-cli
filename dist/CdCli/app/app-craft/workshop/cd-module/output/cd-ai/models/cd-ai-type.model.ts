import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { v4 as uuidv4 } from "uuid";

@Entity({
  name: "cd_ai_type",
  synchronize: true,
})
export class CdAiTypeModel {
  @PrimaryGeneratedColumn({
    name: "cd_ai_type_id",
  })
  cdAiTypeId: number;

  @Column({
    name: "cd_ai_type_guid",
  })
  cdAiTypeGuid: string;

  @Column({
    name: "cd_ai_type_name",
    nullable: true,
  })
  cdAiTypeName?: string;

  @Column({
    name: "cd_ai_description_type",
  })
  cdAiDescriptionType: string;

  @Column({
    name: "cd_ai_doc_type_id",
    nullable: true,
  })
  cdAiDocTypeId?: number;

  @Column({
    name: "cd_ai_enabled_type",
    nullable: true,
  })
  cdAiEnabledType?: boolean;
}
