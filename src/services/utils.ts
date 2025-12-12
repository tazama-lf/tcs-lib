import { RESERVED_KEYWORDS } from 'src/utils/constants';

/**
 * Gets a value from an object using a dot-notation path
 * @param obj The object to extract the value from
 * @param path The dot-notation path (e.g., 'user.address.street')
 * @returns The value at the specified path, or undefined if not found
 */
export function getValueByPath<T>(obj: any, path: string): T {
  const properties = path.split('.');
  let current: any = obj;

  for (const prop of properties) {
    if (/^\d+$/.test(prop)) {
      current = current[parseInt(prop)];
    } else {
      current = current?.[prop];
    }

    if (current === undefined || current === null) {
      throw new Error(`Property '${path}' not found`);
    }
  }

  return current;
}

export function validateTableName(tableName: string): void {
  if (!/^[A-Z_]\w*$/i.test(tableName)) {
    throw new Error(
      `Invalid table name "${tableName}". Only letters, numbers, and underscores are allowed, and it must start with a letter or underscore.`,
    );
  }

  if (tableName.length > 63) {
    throw new Error(`Invalid table name "${tableName}". Must not exceed 63 characters.`);
  }

  if (RESERVED_KEYWORDS.has(tableName.toLowerCase())) {
    throw new Error(`Invalid table name "${tableName}". It is a reserved SQL keyword.`);
  }
}
