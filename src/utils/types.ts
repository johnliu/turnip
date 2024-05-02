export function assertNotNull<T>(value: T | null | undefined): T {
  if (value == null) {
    throw new Error('Unexpected null-ish value.');
  }
  return value;
}

export type SnakeToCamel<S extends string> =
  S extends `${infer P1}_${infer P2}` ?
    `${P1}${Capitalize<SnakeToCamel<P2>>}` :
    S;

export type CamelToSnake<S> =
  S extends `${infer P1}${infer P2}` ?
    `${P1 extends Capitalize<P1> ? '_' : ''}${Lowercase<P1>}${CamelToSnake<P2>}` :
    S;

export type SnakeKeysToCamel<T> =
  T extends Record<string, any> ?
    {[K in keyof T as SnakeToCamel<K & string>]: SnakeKeysToCamel<T[K]>} :
    T;

export type CamelKeysToSnake<T> =
  T extends Record<string, any> ?
    {[K in keyof T as CamelToSnake<K & string>]: CamelKeysToSnake<T[K]>} :
    T;
