import { getDataSource } from '@/lib/db';
import { getPgPool, ensureSchema } from '@/lib/pg';
import { QuestionSchema as Question } from '@/server/schemas/question.schema';

export async function GET() {
  if (process.env.DATABASE_URL) {
    const pg = getPgPool();
    await ensureSchema();
    const { rows } = await pg.query('SELECT * FROM question WHERE is_answered=false LIMIT 1');
    let q = rows[0];
    if (!q) {
      const seed = { topic: 'General', text: 'Describe the perfect day for you. What makes it special?', is_answered: false };
      const { rows: created } = await pg.query('INSERT INTO question (id, text, topic, is_answered) VALUES (gen_random_uuid(), $1, $2, $3) RETURNING *', [seed.text, seed.topic, seed.is_answered]);
      q = created[0];
    }
    return new Response(JSON.stringify(q), { headers: { 'Content-Type': 'application/json' } });
  } else {
    const ds = await getDataSource();
    const repo = ds.getRepository(Question);
    let q = await repo.findOne({ where: { isAnswered: false } });
    if (!q) {
      q = repo.create({ topic: 'General', text: 'Describe the perfect day for you. What makes it special?', isAnswered: false } as any);
      await repo.save(q);
    }
    return new Response(JSON.stringify(q), { headers: { 'Content-Type': 'application/json' } });
  }
}
