export const KEBAB_KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const PERMISSION_KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)+$/;

export function kebabCase(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildPermissionKey(
  moduleKey: string,
  operationKey: string,
  subModuleKey?: string
): string {
  return [moduleKey, subModuleKey, operationKey].filter((part) => part !== undefined).join(".");
}
