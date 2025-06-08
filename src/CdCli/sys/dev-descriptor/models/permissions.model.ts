/* eslint-disable style/brace-style */
/* eslint-disable no-restricted-syntax */

import type {
  PermissionDescriptor,
  RoleDescriptor,
} from './workstations.model.js';

export const enum RoleNames {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest',
  Moderator = 'moderator',
  Developer = 'developer',
  Auditor = 'auditor',
}

export const roles: RoleDescriptor[] = [
  {
    roleName: RoleNames.Admin,
    permissions: [
      {
        name: 'read',
        description: 'Read access',
        level: 'system',
        type: 'file',
      },
      {
        name: 'write',
        description: 'Write access',
        level: 'system',
        type: 'file',
      },
      {
        name: 'execute',
        description: 'Execute access',
        level: 'system',
        type: 'process',
      },
    ],
  },
  {
    roleName: RoleNames.User,
    permissions: [
      { name: 'read', description: 'Read access', level: 'user', type: 'file' },
      {
        name: 'write',
        description: 'Write access',
        level: 'user',
        type: 'file',
      },
    ],
  },
  {
    roleName: RoleNames.Guest,
    permissions: [
      {
        name: 'read',
        description: 'Read-only access',
        level: 'user',
        type: 'file',
      },
    ],
  },
  {
    roleName: RoleNames.Moderator,
    permissions: [
      {
        name: 'read',
        description: 'Read access to content',
        level: 'group',
        type: 'directory',
      },
      {
        name: 'delete',
        description: 'Delete inappropriate content',
        level: 'group',
        type: 'service',
      },
    ],
  },
  {
    roleName: RoleNames.Developer,
    permissions: [
      {
        name: 'read',
        description: 'Read code and logs',
        level: 'group',
        type: 'file',
      },
      {
        name: 'write',
        description: 'Write and update code',
        level: 'group',
        type: 'file',
      },
      {
        name: 'execute',
        description: 'Execute scripts',
        level: 'group',
        type: 'process',
      },
    ],
  },
  {
    roleName: RoleNames.Auditor,
    permissions: [
      {
        name: 'read',
        description: 'Read audit logs',
        level: 'system',
        type: 'service',
      },
      {
        name: 'modify',
        description: 'Modify audit configurations',
        level: 'system',
        type: 'service',
      },
    ],
  },
];

/**
 *
 * const inputNames = ['admin', 'user', 'unknownRole'];
 * const assignedRoles = getPermissionsByName(inputNames, roles);
 *
 * @param names
 * @param roles
 * @returns
 */
export function getPermissionsByName(
  names: string[],
  roles: RoleDescriptor[],
): RoleDescriptor[] {
  const validRoles: RoleDescriptor[] = [];

  names.forEach((name) => {
    const role = roles.find(
      (role) => role.roleName.toLowerCase() === name.toLowerCase(),
    );
    if (role) {
      validRoles.push(role);
    } else {
      // Handle invalid names by creating a default role with no permissions
      validRoles.push({
        roleName: `invalid:${name}`, // Indicate invalid names in roleName
        permissions: [],
      });
    }
  });

  return validRoles;
}

export function getPermissionsByRoleNames(
  names: string[],
  roles: RoleDescriptor[],
): PermissionDescriptor[] {
  const permissions: PermissionDescriptor[] = [];

  names.forEach((name) => {
    const role = roles.find(
      (role) => role.roleName.toLowerCase() === name.toLowerCase(),
    );
    if (role) {
      // Add permissions from the valid role
      permissions.push(...role.permissions);
    }
  });

  return permissions;
}
