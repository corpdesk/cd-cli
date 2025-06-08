import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({
  name: 'group_member_view',
  synchronize: false,
  expression: `
            SELECT DISTINCT
                group.group_id AS group_id,
                group.group_guid AS group_guid,
                group.group_name AS group_name,
                group.group_name AS member_name,
                group.group_description AS group_description,
                group.group_owner_id AS group_owner_id,
                group.doc_id AS doc_id,
                group.group_type_id AS group_type_id,
                group.module_guid AS module_guid,
                group.company_id AS company_id,
                group.group_is_public AS group_is_public,
                group.group_enabled AS group_enabled,
                group_member.group_member_id AS group_member_id,
                group_member.member_guid AS member_guid,
                group_member.group_guid_parent AS group_guid_parent,
                group_member.cd_obj_type_id AS cd_obj_type_id,
                group_member.user_id_member AS user_id_member
            FROM
                (
                    \`group\`
                    JOIN group_member ON ((
                        group.group_guid = group_member.member_guid
                )))
    `,
})
export class GroupMemberViewModel {
  @ViewColumn({
    name: 'group_id',
  })
  groupId!: number;

  @ViewColumn({
    name: 'group_guid',
  })
  groupGuid!: string;

  @ViewColumn({
    name: 'group_name',
  })
  groupName!: string;

  @ViewColumn({
    name: 'member_name',
  })
  memberName!: string;

  @ViewColumn({
    name: 'group_description',
  })
  groupDescription!: string;

  @ViewColumn({
    name: 'group_owner_id',
  })
  groupOwnerId!: number;

  @ViewColumn({
    name: 'doc_id',
  })
  docId!: number;

  @ViewColumn({
    name: 'group_type_id',
  })
  groupTypeId!: number;

  @ViewColumn({
    name: 'module_guid',
  })
  moduleGuid!: string;

  @ViewColumn({
    name: 'company_id',
  })
  companyId!: number;

  @ViewColumn({
    name: 'group_is_public',
  })
  groupIsPublic!: number;

  @ViewColumn({
    name: 'group_enabled',
  })
  groupEnabled!: number;

  @ViewColumn({
    name: 'group_member_id',
  })
  groupMemberId!: number;

  @ViewColumn({
    name: 'member_guid',
  })
  memberGuid!: string;

  @ViewColumn({
    name: 'group_guid_parent',
  })
  groupGuidParent!: string;

  @ViewColumn({
    name: 'cd_obj_type_id',
  })
  cdObjTypeId!: number;

  @ViewColumn({
    name: 'user_id_member',
  })
  userIdMember!: number;
}
