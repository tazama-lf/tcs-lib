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
