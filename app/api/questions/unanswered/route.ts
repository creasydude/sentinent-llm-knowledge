import { getDataSource } from '@/lib/db';
import { QuestionSchema as Question } from '@/server/schemas/question.schema';

export async function GET() {
  const ds = await getDataSource();
  const repo = ds.getRepository(Question);
  let q = await repo.findOne({ where: { isAnswered: false } });
  if (!q) {
    // Seed a default question if none exist to avoid 404 on first run
    q = repo.create({
      topic: 'General',
      text: 'Describe the perfect day for you. What makes it special?',
      isAnswered: false,
    } as any);
    await repo.save(q);
  }
  return new Response(JSON.stringify(q), { headers: { 'Content-Type': 'application/json' } });
}
