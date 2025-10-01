/**
 * Converts kebab-case or snake_case to camelCase.
 *
 * Examples:
 *   'coop-member'    => 'coopMember'
 *   'coop_member_id' => 'coopMemberId'
 */
export function toCamelCase(input: string): string {
  return input.toLowerCase().replace(/[-_](\w)/g, (_, c) => c.toUpperCase());
}

/**
 * Converts a kebab-case string to PascalCase (e.g., "cd-my-name" -> "CdMyName")
 * @param str The kebab-case string to convert
 * @returns The PascalCase version of the input string
 */
export function toCamelMain(str: string): string {
  if (!str) return str;

  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Converts a kebab-case string to camelCase (e.g., "cd-my-name" -> "cdMyName")
 * @param str The kebab-case string to convert
 * @returns The camelCase version of the input string
 */
export function toCamelMinor(str: string): string {
  if (!str) return str;

  const pascal = str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
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
    .replace(/([a-z])([A-Z])/g, '$1_$2') // camelCase/PascalCase to snake_case
    .replace(/[-\s]+/g, '_') // kebab-case or spaces to snake_case
    .replace(/_+/g, '_') // collapse multiple underscores
    .toLowerCase()
    .trim();
}

/**
 * Deduces cdObjType/workshop directory from a class or file name.
 * - "TestBedService" => "test-bed"
 * - "CdModuleService" => "cd-module"
 * - "test-bed.service.ts" => "test-bed"
 */
export function inferCdObjType(source: string): string {
  const name = source.replace(/\.ts$/, '').replace(/Service$/, '');

  // Convert PascalCase to kebab-case
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

// ✅ Helper: detect visitor fields (foreign keys)
export function isVisitorField(fieldSnake: string): boolean {
  return (
    fieldSnake.endsWith('_id') &&
    !fieldSnake.includes('_doc_id') && // exclude doc_id
    !fieldSnake.includes('_type_id') // exclude type-resident id
  );
}

// ✅ Helper: normalize resident field names (avoid TypeType, etc.)
export function injectTypeBeforeSuffix(
  original: string,
  suffixes: string[] = ['Id', 'Guid', 'Code', 'Ref', 'Name', 'Description', 'Enabled'],
  injection: string = 'Type',
): string {
  const suffix = suffixes.find((s) => original.endsWith(s));
  if (!suffix) {
    return original.endsWith(injection) ? original : `${original}${injection}`;
  }

  const prefix = original.slice(0, -suffix.length);

  // 🚫 Prevent duplicate 'TypeType'
  if (prefix.endsWith(injection)) {
    return `${prefix}${suffix}`;
  }

  return `${prefix}${injection}${suffix}`;
}

export function injectTypeBeforeSnakeSuffix(
  original: string,
  suffixes: string[] = ['_id', '_guid', '_code', '_ref', '_name', '_description', '_enabled'],
  injection: string = '_type',
): string {
  // 🛑 Exemptions for special/visitor fields
  if (original === 'doc_id' || (original.endsWith('_id') && !original.includes('_type'))) {
    return original; // don't inject _type for visitor or doc_id
  }

  const suffix = suffixes.find((s) => original.endsWith(s));
  if (!suffix) {
    return original.endsWith(injection) ? original : `${original}${injection}`;
  }

  const prefix = original.slice(0, -suffix.length);

  // 🚫 Prevent duplicate _type_type
  if (prefix.endsWith(injection)) {
    return `${prefix}${suffix}`;
  }

  return `${prefix}${injection}${suffix}`;
}
