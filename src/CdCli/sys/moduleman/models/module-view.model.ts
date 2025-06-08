import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({
  name: 'module_view',
  synchronize: false,
  expression: `
    SELECT
        module.module_id' AS 'module_id,
        module.module_guid' AS 'module_guid,
        module.module_name' AS 'module_name,
        module.module_description' AS 'module_description,
        module.module_type_id' AS 'module_type_id,
        module.module_is_public' AS 'module_is_public,
        module.is_sys_module' AS 'is_sys_module,
        module.doc_id' AS 'doc_id,
        module.module_enabled' AS 'module_enabled,
        module.group_guid' AS 'group_guid,
        group.group_name' AS 'group_name,
        group.group_owner_id' AS 'group_owner_id,
        group.group_type_id' AS 'group_type_id,
        group.company_id' AS 'company_id'
    FROM
        (
            \`group\`
            JOIN 'module' ON ((
                    group.group_guid = module.group_guid
                )));
    `,
})
export class ModuleViewModel {
  @ViewColumn({
    name: 'module_id',
  })
  moduleId?: number;

  @ViewColumn({
    name: 'module_guid',
  })
  moduleGuid?: string;

  @ViewColumn({
    name: 'module_name',
  })
  moduleName?: string;

  @ViewColumn({
    name: 'module_description',
  })
  moduleDescription?: string;

  @ViewColumn({
    name: 'module_type_id',
  })
  moduleTypeId?: number;

  @ViewColumn({
    name: 'module_is_public',
  })
  moduleIsPublic?: number;

  @ViewColumn({
    name: 'is_sys_module',
  })
  isSysModule?: number;

  @ViewColumn({
    name: 'doc_id',
  })
  docId?: string;

  @ViewColumn({
    name: 'module_enabled',
  })
  moduleEnabled?: boolean | number | null;

  @ViewColumn({
    name: 'group_guid',
  })
  groupGuid?: string;

  @ViewColumn({
    name: 'group_name',
  })
  groupName?: string;

  @ViewColumn({
    name: 'group_owner_id',
  })
  groupOwnerId?: boolean | number | null;

  @ViewColumn({
    name: 'group_type_id',
  })
  groupTypeId?: number;

  @ViewColumn({
    name: 'company_id',
  })
  companyId?: string;
}
