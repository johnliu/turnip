import dedent from 'dedent';

import { first } from '@/utils/arrays';

export type Statement<T> = {
  statement: D1PreparedStatement;
  transformer: (response: D1Result) => T | null | undefined;
};

export type Statements<T> = { [P in keyof T]: Statement<T[P]> };
type RetValues<T> = { [P in keyof T]: T[P] | null | undefined };

export async function batch<T extends unknown[]>(
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

export function makeManyTransformer<T>(): (response: D1Result) => T[] | null | undefined {
  return (response) => response.results as T[];
}

export function makeOneTransformer<T>(): (response: D1Result) => T | null | undefined {
  return (response) => first(response.results as T[]);
}

export function makeOneStatement<T>(preparedStatement: D1PreparedStatement): Statement<T> {
  return {
    statement: preparedStatement,
    transformer: makeOneTransformer(),
  };
}

export function makeManyStatement<T>(preparedStatement: D1PreparedStatement): Statement<T[]> {
  return {
    statement: preparedStatement,
    transformer: makeManyTransformer(),
  };
}

export function makeInsertManyStatement<T extends object>(
  db: D1Database,
  table: string,
  models: T[],
): Statement<T[]> {
  if (models.length === 0) {
    return {
      statement: db.prepare('SELECT NULL WHERE NULL'),
      transformer: (_) => [],
    };
  }

  const fields: Array<keyof T> = Object.keys(models[0]) as Array<keyof T>;

  return {
    statement: db
      .prepare(
        dedent`
          INSERT INTO ${table} (
            ${fields.join(', ')}
          )
          VALUES
          ${models.map((_) => `(${fields.map((_) => '?').join(', ')})`).join(', \n')}
          RETURNING *
        `,
      )
      .bind(...models.flatMap((m) => fields.map((f) => m[f]))),
    transformer: makeManyTransformer(),
  };
}

export function makeInsertOneStatement<T extends object>(
  db: D1Database,
  table: string,
  model: T,
): Statement<T> {
  const { statement } = makeInsertManyStatement(db, table, [model]);
  return {
    statement,
    transformer: makeOneTransformer(),
  };
}

export async function getOne<T extends object>(
  db: D1Database,
  table: string,
  where: Partial<T>,
): Promise<T | null | undefined> {
  return first(await getMany(db, table, where, 1));
}

export async function getMany<T extends object>(
  db: D1Database,
  table: string,
  where: Partial<T>,
  limit?: number,
): Promise<T[] | null | undefined> {
  const result = await db
    .prepare(
      dedent`
        SELECT * FROM ${table}
        WHERE ${Object.keys(where)
          .map((k) => `${k} = ?`)
          .join(' AND ')}
        ${limit != null ? `LIMIT ${limit}` : ''}
      `,
    )
    .bind(...Object.values(where))
    .all<T>();

  return result.results;
}
