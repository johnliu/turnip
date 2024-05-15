export function assertNotNull<T>(value: T | null | undefined): T {
  if (value == null) {
    throw new Error('Unexpected null-ish value.');
  }
  return value;
}

export type ExpandRecursively<T> = T extends (...args: infer A) => infer R
  ? (...args: ExpandRecursively<A>) => ExpandRecursively<R>
  : T extends object
    ? T extends infer O
      ? { [K in keyof O]: ExpandRecursively<O[K]> }
      : never
    : T;
