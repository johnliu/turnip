export function first<T>(array: T[] | null | undefined): T | undefined {
  return array != null && array.length > 0 ? array[0] : undefined;
}
