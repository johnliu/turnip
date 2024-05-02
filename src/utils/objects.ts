export type SnakeToCamel<S extends string> = S extends `${infer P1}_${infer P2}`
  ? `${P1}${Capitalize<SnakeToCamel<P2>>}`
  : S;
function snakeToCamel(s: string) {
  return s.replace(/_./g, (match) => match[1].toUpperCase());
}

export type CamelToSnake<S> = S extends `${infer P1}${infer P2}`
  ? `${P1 extends Capitalize<P1> ? '_' : ''}${Lowercase<P1>}${CamelToSnake<P2>}`
  : S;
function camelToSnake(s: string) {
  return s.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
}

export type SnakeKeysToCamel<T> = T extends object
  ? {
      [K in keyof T as SnakeToCamel<K & string>]: T[K];
    }
  : T;

export function snakeKeysToCamel<T extends object>(t: T): SnakeKeysToCamel<T> {
  const result = Object.fromEntries(Object.entries(t).map(([k, v]) => [snakeToCamel(k), v]));
  return result as SnakeKeysToCamel<T>;
}

export type CamelKeysToSnake<T> = T extends object
  ? {
      [K in keyof T as CamelToSnake<K & string>]: T[K];
    }
  : T;

export function camelKeysToSnake<T extends object>(t: T): CamelKeysToSnake<T> {
  const result = Object.fromEntries(Object.entries(t).map(([k, v]) => [camelToSnake(k), v]));
  return result as CamelKeysToSnake<T>;
}
