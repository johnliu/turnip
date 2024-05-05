export type StandardError<T, C = null> = {
  type: T;
  context?: C;
};
