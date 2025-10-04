import 'reflect-metadata';
import path from 'path';
import { DataSource } from 'typeorm';
import { UserSchema as User } from '@/server/schemas/user.schema';
import { QuestionSchema as Question } from '@/server/schemas/question.schema';
import { AnswerSchema as Answer } from '@/server/schemas/answer.schema';
import { PointSchema as Point } from '@/server/schemas/point.schema';

declare global {
  // eslint-disable-next-line no-var
  var __datasource: DataSource | undefined;
}

function buildDataSource() {
  const dbFile = path.join(process.cwd(), 'db.sqlite');
  return new DataSource({
    type: 'sqlite',
    database: dbFile,
    entities: [User, Question, Answer, Point],
    synchronize: true,
  });
}

export async function getDataSource(): Promise<DataSource> {
  if (global.__datasource) {
    if (!global.__datasource.isInitialized) {
      await global.__datasource.initialize();
    }
    return global.__datasource;
  }
  const ds = buildDataSource();
  await ds.initialize();
  global.__datasource = ds;
  return ds;
}
