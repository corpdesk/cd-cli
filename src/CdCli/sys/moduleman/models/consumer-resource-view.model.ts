import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({
  name: 'consumer_resource_view',
  synchronize: false,
  expression: `
        SELECT 
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
            consumer_resource.consumer_resource_icon AS consumer_resource_icon,
            consumer_resource.consumer_resource_link AS consumer_resource_link,
            consumer.consumer_guid AS consumer_guid,
            consumer.consumer_name AS consumer_name,
            cd_obj.cd_obj_guid AS cd_obj_guid,
            cd_obj.obj_guid AS obj_guid,
            cd_obj.obj_id AS obj_id,
            cd_obj.cd_obj_name AS cd_obj_name,
            cd_obj.cd_obj_type_guid AS cd_obj_type_guid
        FROM
            ((consumer_resource
            JOIN cd_obj ON ((consumer_resource.cd_obj_id = cd_obj.cd_obj_id)))
            JOIN consumer ON ((consumer_resource.consumer_id = consumer.consumer_id)));
        `,
})
export class ConsumerResourceViewModel {
  @ViewColumn({
    name: 'consumer_id',
  })
  consumerId?: number;

  @ViewColumn({
    name: 'consumer_resource_name',
  })
  consumerResourceName?: string;

  @ViewColumn({
    name: 'cd_obj_type_id',
  })
  cdObjTypeId?: number;

  @ViewColumn({
    name: 'cd_obj_id',
  })
  cdObjId?: number;

  @ViewColumn({
    name: 'consumer_resource_type_id',
  })
  consumerResourceTypeId?: number;

  @ViewColumn({
    name: 'obj_guid',
  })
  objGuid?: string;

  @ViewColumn({
    name: 'consumer_guid',
  })
  consumerGuid?: string;

  @ViewColumn({
    name: 'consumer_name',
  })
  consumerName?: string;

  //////////////////////////////
  @ViewColumn({
    name: 'consumer_resource_id',
  })
  consumerResourceId?: string;

  @ViewColumn({
    name: 'consumer_resource_guid',
  })
  consumerResourceGuid?: string;

  @ViewColumn({
    name: 'doc_id',
  })
  docId?: number;

  @ViewColumn({
    name: 'consumer_resource_enabled',
  })
  consumerResourceEnabled?: boolean;

  @ViewColumn({
    name: 'obj_id',
  })
  objId?: number;

  @ViewColumn({
    name: 'consumer_resource_type_guid',
  })
  consumerResourceTypeGuid?: string;

  @ViewColumn({
    name: 'consumer_resource_icon',
  })
  consumerResourceIcon?: string;

  @ViewColumn({
    name: 'consumer_resource_link',
  })
  consumerResourceLink?: string;

  @ViewColumn({
    name: 'cd_obj_guid',
  })
  cdObjGuid?: string;

  @ViewColumn({
    name: 'cd_obj_name',
  })
  cdObjName?: string;

  @ViewColumn({
    name: 'cd_obj_type_guid',
  })
  cdObjTypeGuide?: string;
}
