type D1ResultTransformer<T> = (response: D1Result) => T | null | undefined;

export type Statement<T> = {
  statement: D1PreparedStatement;
  transformer: (response: D1Result) => T | null | undefined;
};

export type Statements<T> = { [P in keyof T]: Statement<T[P]> };
type RetValues<T> = { [P in keyof T]: T[P] | null | undefined };

export async function transaction<T extends unknown[]>(
  db: D1Database,
  statements: Statements<T>,
): Promise<RetValues<T>> {
  const preparedStatements = statements.map(({ statement }) => statement);
  const preparedTransformers = statements.map(({ transformer }) => transformer);

  const responses = (await db.batch(preparedStatements)).map((response, i) =>
    preparedTransformers[i](response),
  ) as RetValues<T>;
  return responses;
}
