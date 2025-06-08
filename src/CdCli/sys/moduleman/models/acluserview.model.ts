import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({
  name: 'acl_user_view',
  synchronize: false,
  expression: `
            SELECT
                user.user_id,
                user.user_guid,
                user.user_name,
                user.password,
                user.email,
                user.doc_id,
                user.mobile,
                user.gender,
                user.birth_date,
                user.postal_addr,
                user.f_name,
                user.m_name,
                user.l_name,
                user.national_id,
                user.passport_id,
                user.user_enabled,
                user.zip_code,
                user.activation_key,
                user.company_id,
                user.user_type_id,
                consumer_resource_view.consumer_id,
                consumer_resource_view.cd_obj_type_id,
                consumer_resource_view.cd_obj_id,
                consumer_resource_view.obj_guid,
                consumer_resource_view.consumer_guid,
            consumer_resource_view.consumer_resource_type_id
            FROM
                user
                INNER JOIN consumer_resource_view ON user.user_guid = consumer_resource_view.obj_guid;
    `,
})
export class AclUserViewModel {
  @ViewColumn({
    name: 'user_id',
  })
  userId?: number;

  @ViewColumn({
    name: 'user_guid',
  })
  userGuid?: string;

  @ViewColumn({
    name: 'user_name',
  })
  userName?: string;

  @ViewColumn({
    name: 'user_enabled',
  })
  userEnabled?: boolean;

  @ViewColumn({
    name: 'company_id',
  })
  companyId?: number;

  @ViewColumn({
    name: 'user_type_id',
  })
  userTypeId?: number;

  @ViewColumn({
    name: 'consumer_id',
  })
  consumerId?: number;

  @ViewColumn({
    name: 'cd_obj_type_id',
  })
  cdObjTypeId?: number;

  @ViewColumn({
    name: 'cd_obj_id',
  })
  cdObjId?: number;

  @ViewColumn({
    name: 'obj_guid',
  })
  objGuid?: number;

  @ViewColumn({
    name: 'consumer_guid',
  })
  consumerGuid?: string;

  @ViewColumn({
    name: 'consumer_resource_type_id',
  })
  consumerResourceTypeId?: number;
}
