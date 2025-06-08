import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({
  name: 'acl_module_view',
  synchronize: false,
  expression: `
        select
            consumer_resource.consumer_id AS consumer_id,
            consumer_resource.consumer_resource_name AS consumer_resource_name,
            consumer_resource.cd_obj_type_id AS cd_obj_type_id,
            consumer_resource.cd_obj_id AS cd_obj_id,
            consumer_resource.consumer_resource_type_id AS consumer_resource_type_id,
            consumer_resource.consumer_resource_id AS consumer_resource_id,
            consumer_resource.consumer_resource_guid AS consumer_resource_guid,
            consumer_resource.doc_id AS doc_id,
            consumer_resource.consumer_resource_enabled AS consumer_resource_enabled,
            consumer_resource.consumer_resource_type_guid AS consumer_resource_type_guid,
            consumer.consumer_guid AS consumer_guid,
            cd_obj.cd_obj_guid AS cd_obj_guid,
            cd_obj.obj_guid AS obj_guid,
            cd_obj.obj_id AS obj_id,
            cd_obj.cd_obj_name AS cd_obj_name,
            cd_obj.cd_obj_type_guid AS cd_obj_type_guid
        from
            ((consumer_resource
        join cd_obj on
            ((consumer_resource.cd_obj_id = cd_obj.cd_obj_id)))
        join consumer on
            ((consumer_resource.consumer_id = consumer.consumer_id)))
    `,
})
export class AclModuleViewModel {
  @ViewColumn({
    name: 'consumer_resource_id',
  })
  consumerResourceId?: number;

  @ViewColumn({
    name: 'consumer_resource_name',
  })
  consumerResourceName?: number;

  @ViewColumn({
    name: 'consumer_id',
  })
  consumerId?: number;

  @ViewColumn({
    name: 'consumer_guid',
  })
  consumerGuid?: number;

  @ViewColumn({
    name: 'cd_obj_id',
  })
  cdObjId?: number;

  @ViewColumn({
    name: 'cd_obj_guid',
  })
  cdObjGuid?: string;

  @ViewColumn({
    name: 'obj_guid',
  })
  objGuid?: string;

  @ViewColumn({
    name: 'cd_obj_name',
  })
  cdObjName?: number;

  @ViewColumn({
    name: 'cd_obj_type_guid',
  })
  cdObjTypeGuid?: string;

  @ViewColumn({
    name: 'cd_obj_type_id',
  })
  cdObjTypeId?: string;

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
    name: 'module_is_public',
  })
  moduleIsPublic?: boolean;

  @ViewColumn({
    name: 'is_sys_module',
  })
  isSysModule?: boolean;

  @ViewColumn({
    name: 'module_enabled',
  })
  moduleEnabled?: boolean;

  @ViewColumn({
    name: 'group_guid',
  })
  groupGuid?: string;

  @ViewColumn({
    name: 'module_type_id',
  })
  moduleTypeId?: number;
}
