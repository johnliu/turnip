type D1ResultTransformer<T> = (response: D1Result) => T | null;

type Responses<T> = T extends [D1ResultTransformer<infer P>, ...infer R]
  ? [P | null, ...Responses<R>]
  : T;
