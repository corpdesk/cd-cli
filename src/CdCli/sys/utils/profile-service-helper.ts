/**
 * Future development must remove any coop related items in this class.
 * The class should be general.
 * All coop items must be isolated in coops directory
 * This util directory where this file resides should contain system related and shared utils
 *
 * modifyProfile() should have access policy
 *  - self can modify active coopId
 *  - self can only modify self if request coopRole is equal or higher that the coopRole to modify and
 *    the target must fall withing the same jurisdiction
 *  - implement expiring roles
 */


import { MemberMeta } from '../../app/coops/index.js';
import { IServiceInput } from '../base/i-base.js';
import { UserModel } from '../user/models/user.model.js';

// import { ICoopRole, MemberMeta } from "../../app/coops/models/coop-member.model";
// import { IQuery, IServiceInput } from "../base/i-base";

export class ProfileServiceHelper {
  /**
   * Fetches the profile and removes sensitive fields.
   */
  static async fetchProfile(req, res, si: IServiceInput<UserModel>) {
    // const profileData = await service.getProfile(req, res, { where: { id: userIdOrMemberId } });
    const profileData = await si.serviceInstance.getI(req, res, si.cmd?.query);
    if (profileData.length > 0) {
      // Remove sensitive data
      const res = profileData.map(({ password, ...data }) => data)[0];
      console.log(
        'ProfileServiceHelper::fetchProfile/res[si.mapping.profileField]:',
        res[si.mapping.profileField],
      );
      return res[si.mapping.profileField];
    }
    return null;
  }

  /**
   * Modifies the profile based on the provided configuration.
   */

  /**
     * 
     * Example of profileConfig
     * const profileConfig = [
            {
                path: ["coopMembership", "acl", "coopRole"],
                value: {
                    coopId: 1,
                    coopRole: [
                        { scope: CoopsAclScope.COOPS_MEMBER, geoLocationId: 101 }
                    ]
                },
                action: "create" // Could also be "update", "delete", "read"
            },
            {
                path: ["coopMembership", "acl", "coopRole"],
                value: {
                    coopId: 2,
                    coopRole: [
                        { scope: CoopsAclScope.COOPS_ADMIN, geoLocationId: 202 }
                    ]
                },
                action: "update"
            }
        ];

        ---------------------------------------------------------
        Usage:
        const updatedProfile = ProfileServiceHelper.modifyProfile(existingData, profileConfig);


     * @param existingData 
     * @param profileDefaultConfig 
     * @param permissionTypes 
     * @returns 
     */
  static async modifyProfile(existingData: any, profileConfig: any[]) {
    console.log('ProfileServiceHelper::modifyProfile()/01');
    let updatedProfile = { ...existingData };
    console.log('ProfileServiceHelper::modifyProfile()/02');
    console.log(
      'ProfileServiceHelper::modifyProfile()/existingData:',
      existingData,
    );
    console.log(
      'ProfileServiceHelper::modifyProfile()/profileConfig:',
      profileConfig,
    );
    for (const update of profileConfig) {
      const { path, value, action } = update;
      const [firstKey, ...remainingPath] = path;
      console.log('ProfileServiceHelper::modifyProfile()/03');
      // Route based on the action specified in profileConfig
      if (
        firstKey === 'coopMembership' &&
        remainingPath[0] === 'acl' &&
        remainingPath[1] === 'coopRole'
      ) {
        console.log('ProfileServiceHelper::modifyProfile()/04');
        switch (action) {
          case 'create':
            updatedProfile = await this.createCoopRole(
              updatedProfile,
              remainingPath,
              value,
            );
            console.log(
              'ProfileServiceHelper::modifyProfile()/updatedProfile1:',
              JSON.stringify(updatedProfile),
            );
            break;
          case 'update':
            updatedProfile = await this.updateCoopRole(
              updatedProfile,
              remainingPath,
              value,
            );
            break;
          case 'delete':
            updatedProfile = await this.deleteCoopRole(
              updatedProfile,
              remainingPath,
              value.coopId,
            );
            break;
          case 'read':
            await this.readCoopRole(
              updatedProfile,
              remainingPath,
              value.coopId,
            );
            break;
          default:
            console.warn(`Unsupported action: ${action}`);
        }
        console.log('ProfileServiceHelper::modifyProfile()/05');
      } else {
        console.log('ProfileServiceHelper::modifyProfile()/06');
        this.applyJsonUpdate(updatedProfile, path, value);
      }
    }
    console.log('ProfileServiceHelper::modifyProfile()/07');
    console.log(
      'ProfileServiceHelper::modifyProfile()/updatedProfile2:',
      JSON.stringify(await updatedProfile),
    );
    /**
     * Sync updated data with memberData which is still in the state it was retrieved from db.
     */
    updatedProfile = this.syncCoopMemberProfiles(updatedProfile);

    return await updatedProfile;
  }

  /**
   * Updates permissions based on the type and ID key.
   */
  static updatePermissions(
    profile: any,
    newValue: any,
    permissionType: 'userPermissions' | 'groupPermissions',
    idKey: string,
  ) {
    const permissionList = profile.fieldPermissions[permissionType];
    const existingIndex = permissionList.findIndex(
      (permission) =>
        permission[idKey] === newValue[idKey] &&
        permission.field === newValue.field,
    );

    if (existingIndex > -1) {
      permissionList[existingIndex] = newValue;
    } else {
      permissionList.push(newValue);
    }

    return profile;
  }

  /**
   * Applies a JSON update based on a path.
   */
  static applyJsonUpdate(
    profile: any,
    path: (string | number | string[])[],
    value: any,
  ) {
    let current = profile;

    for (let i = 0; i < path.length - 1; i++) {
      let key = path[i];
      if (Array.isArray(key)) {
        key = key.join('.');
      }

      if (!current[key]) {
        current[key] = typeof path[i + 1] === 'number' ? [] : {};
      }

      current = current[key];
    }

    let finalKey = path[path.length - 1];
    if (Array.isArray(finalKey)) {
      finalKey = finalKey.join('.');
    }

    current[finalKey] = value;
  }

  // static createCoopRole(profile: any, path: (string | number | string[])[], newValue: MemberMeta) {
  //     console.log("ProfileServiceHelper::createCoopRole()/profile:", profile)
  //     console.log("ProfileServiceHelper::createCoopRole()/newValue:", newValue)
  //     const aclList:MemberMeta[] = profile.coopMembership.acl;
  //     console.log("ProfileServiceHelper::createCoopRole()/aclList:", aclList)

  //     // Remove existing role for the same coopId to avoid duplication
  //     const existingIndex = aclList.findIndex((acl: any) => acl.coopId === newValue.coopId);
  //     if (existingIndex !== -1) {
  //         aclList.splice(existingIndex, 1);
  //     }

  //     console.log("ProfileServiceHelper::createCoopRole()/newValue.coopRole:", newValue.coopRole)
  //     // Add the new role
  //     aclList.push({
  //         coopId: newValue.coopId,
  //         coopActive: true,
  //         coopRole: newValue.coopRole
  //     });

  //     console.log("ProfileServiceHelper::createCoopRole()/aclList2:", aclList)
  //     console.log("ProfileServiceHelper::createCoopRole()/profile:", profile)
  //     return profile;
  // }

  static async createCoopRole(
    profile: any,
    path: (string | number | string[])[],
    newValue: MemberMeta,
  ) {
    console.log('ProfileServiceHelper::createCoopRole()/profile:', profile);
    console.log('ProfileServiceHelper::createCoopRole()/newValue:', newValue);
    const aclList: MemberMeta[] = profile.coopMembership.acl;

    console.log('ProfileServiceHelper::createCoopRole()/aclList:', aclList);

    // Validate and clean aclList
    for (let i = aclList.length - 1; i >= 0; i--) {
      if (!this.validateAclItem(aclList[i])) {
        console.warn(`Removing non-compliant item at index ${i}:`, aclList[i]);
        aclList.splice(i, 1); // Remove non-compliant item
      }
    }

    // Remove existing role for the same coopId to avoid duplication
    const existingIndex = aclList.findIndex(
      (acl: any) => acl.coopId === newValue.coopId,
    );
    if (existingIndex !== -1) {
      aclList.splice(existingIndex, 1);
    }

    console.log(
      'ProfileServiceHelper::createCoopRole()/newValue.coopRole:',
      newValue.coopRole,
    );

    // Add the new role
    aclList.push({
      coopId: newValue.coopId,
      coopActive: true,
      coopRole: newValue.coopRole,
    });

    profile.coopMembership.acl = aclList;
    console.log('ProfileServiceHelper::createCoopRole()/aclList2:', aclList);
    console.log(
      'ProfileServiceHelper::createCoopRole()/profile:',
      JSON.stringify(await profile),
    );

    return await profile;
  }

  static updateCoopRole(
    profile: any,
    path: (string | number | string[])[],
    newValue: any,
  ) {
    const aclList = profile.coopMembership.acl;
    const targetAcl = aclList.find(
      (acl: any) => acl.coopId === newValue.coopId,
    );

    if (targetAcl) {
      targetAcl.coopRole = newValue.coopRole;
    } else {
      console.warn(
        `No existing coopRole found with coopId ${newValue.coopId} to update.`,
      );
    }

    return profile;
  }

  static deleteCoopRole(
    profile: any,
    path: (string | number | string[])[],
    coopId: number,
  ) {
    const aclList = profile.coopMembership.acl;
    const index = aclList.findIndex((acl: any) => acl.coopId === coopId);

    if (index !== -1) {
      aclList.splice(index, 1);
    } else {
      console.warn(
        `No existing coopRole found with coopId ${coopId} to delete.`,
      );
    }

    return profile;
  }

  static readCoopRole(
    profile: any,
    path: (string | number | string[])[],
    coopId: number,
  ) {
    const aclList = profile.coopMembership.acl;
    const targetAcl = aclList.find((acl: any) => acl.coopId === coopId);

    if (targetAcl) {
      console.log(`Read coopRole for coopId ${coopId}:`, targetAcl.coopRole);
      // Optionally, return the coopRole or perform further operations
      return targetAcl.coopRole;
    } else {
      console.warn(`No coopRole found for coopId ${coopId}`);
    }
  }

  static validateAclItem(item: any): boolean {
    const isValidCoopId =
      typeof item.coopId === 'number' || item.coopId === null;
    const isValidCoopActive = typeof item.coopActive === 'boolean';
    const isValidCoopRole =
      typeof item.coopRole === 'object' && item.coopRole !== null; // Assuming ICoopRole is an object
    const isValidAclRole =
      item.aclRole === undefined ||
      (typeof item.aclRole === 'object' && item.aclRole !== null); // Optional property
    const isValidCoopMemberData =
      item.coopMemberData === undefined || Array.isArray(item.coopMemberData); // Optional property

    return (
      isValidCoopId &&
      isValidCoopActive &&
      isValidCoopRole &&
      isValidAclRole &&
      isValidCoopMemberData
    );
  }

  static syncCoopMemberProfiles(modifiedProfile: any) {
    console.log('ProfileServiceHelper::syncCoopMemberProfiles()/01');
    console.log(
      'ProfileServiceHelper::syncCoopMemberProfiles()/modifiedProfile:',
      modifiedProfile,
    );
    if ('coopMembership' in modifiedProfile) {
      // Extract the modified acl from coopMembership
      const updatedAcl = modifiedProfile.coopMembership.acl;
      console.log('ProfileServiceHelper::syncCoopMemberProfiles()/02');
      // Go through each memberData item and replace its coopMemberProfile with updatedAcl
      modifiedProfile.coopMembership.memberData.forEach((member: any) => {
        console.log('ProfileServiceHelper::syncCoopMemberProfiles()/03');
        member.coopMemberProfile = [...updatedAcl]; // Spread operator to create a copy of updatedAcl
      });
    }
    console.log('ProfileServiceHelper::syncCoopMemberProfiles()/04');
    return modifiedProfile;
  }
}
