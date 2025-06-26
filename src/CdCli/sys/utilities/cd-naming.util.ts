/**
 * Converts kebab-case or snake_case to camelCase.
 * 
 * Examples:
 *   'coop-member'    => 'coopMember'
 *   'coop_member_id' => 'coopMemberId'
 */
export function toCamelCase(input: string): string {
  return input
    .toLowerCase()
    .replace(/[-_](\w)/g, (_, c) => c.toUpperCase());
}

/**
 * Converts kebab-case, snake_case, or camelCase to PascalCase.
 * 
 * Examples:
 *   'coop-member'   => 'CoopMember'
 *   'coopMember'    => 'CoopMember'
 *   'coop_member'   => 'CoopMember'
 */
export function toPascalCase(input: string): string {
  const camel = toCamelCase(input);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/**
 * Converts camelCase or PascalCase to kebab-case.
 * 
 * Examples:
 *   'coopMember'    => 'coop-member'
 *   'CoopMember'    => 'coop-member'
 *   'abcXYZOne'     => 'abc-xyz-one'
 */
export function toKebabCase(input: string): string {
  return input
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Converts camelCase or PascalCase to snake_case.
 * 
 * Examples:
 *   'coopMember'    => 'coop_member'
 *   'CoopMember'    => 'coop_member'
 */
export function toSnakeCase(input: string): string {
  return input
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

/**
 * Capitalizes the first character of a word or phrase.
 *   'coopMember' => 'CoopMember'
 *   'abc'        => 'Abc'
 */
export function capitalizeFirst(input: string): string {
  return input.charAt(0).toUpperCase() + input.slice(1);
}
/**
 * Converts a string to lowercase.
 *   'CoopMember' => 'coopmember'
 *   'Abc'        => 'abc'
 */
export function toLowerCase(input: string): string {
  return input.toLowerCase();
}

/**
 * Converts any casing style (camelCase, PascalCase, kebab-case, snake_case)
 * to standardized snake_case.
 *
 * Examples:
 *   'coopMember'         => 'coop_member'
 *   'CoopMember'         => 'coop_member'
 *   'coop-member'        => 'coop_member'
 *   'Coop-MemberRole'    => 'coop_member_role'
 *   'Coop_Member-RoleId' => 'coop_member_role_id'
 */
export function toUniversalSnakeCase(input: string): string {
  return input
    .replace(/([a-z])([A-Z])/g, '$1_$2')       // camelCase/PascalCase to snake_case
    .replace(/[-\s]+/g, '_')                   // kebab-case or spaces to snake_case
    .replace(/_+/g, '_')                       // collapse multiple underscores
    .toLowerCase()
    .trim();
}

