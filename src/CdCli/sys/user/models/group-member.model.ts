import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { validateOrReject } from 'class-validator';

@Entity({
  name: 'group_member',
  synchronize: false,
})
// @CdModel
export class GroupMemberModel {
  @PrimaryGeneratedColumn({
    name: 'group_member_id',
  })
  groupMemberId?: number;

  @Column({
    name: 'group_member_guid',
    length: 36,
    default: uuidv4(),
  })
  groupMemberGuid?: string;

  @Column('varchar', {
    name: 'group_guid_parent',
    length: 50,
    nullable: true,
  })
  groupGuidParent?: string;

  @Column('varchar', {
    name: 'member_guid',
    length: 50,
    nullable: true,
  })
  memberGuid?: string;

  @Column({
    name: 'user_id_member',
    nullable: true,
  })
  userIdMember?: number;

  @Column({
    name: 'doc_id',
    nullable: true,
  })
  docId?: number;

  @Column({
    name: 'cd_obj_type_id',
    nullable: true,
  })
  cdObjTypeId?: number;

  @Column({
    name: 'group_member_parent_id',
    nullable: true,
  })
  groupMemberParentId?: number;

  @Column({
    name: 'group_member_enabled',
    nullable: true,
  })
  groupMemberEnabled?: boolean;

  @Column({
    name: 'group_invitation_id',
    nullable: true,
  })
  groupInvitationId?: number;

  @Column('varchar', {
    name: 'group_id_parent',
    length: 50,
    nullable: true,
  })
  groupIdParent?: number;

  @Column('varchar', {
    name: 'member_id',
    nullable: true,
  })
  memberId?: number;
}
