/**
 * Gets a value from an object using a dot-notation path
 * @param obj The object to extract the value from
 * @param path The dot-notation path (e.g., 'user.address.street')
 * @returns The value at the specified path, or undefined if not found
 */
export function getValueByPath(obj: unknown, path: string): unknown {
  const properties = path.split('.');
  let current: unknown = obj;

  for (const prop of properties) {
    if (/^\d+$/.test(prop)) {
      current = (current as Record<number, unknown>)[parseInt(prop, 10)];
    } else {
      current = (current as Record<string, unknown>)[prop];
    }

    if (current === undefined || current === null) {
      throw new Error(`Property '${path}' not found`);
    }
  }

  return current;
}
