import { getDataSource } from '@/lib/db';
import { getPgPool, ensureSchema } from '@/lib/pg';
import { QuestionSchema as Question } from '@/server/schemas/question.schema';
import { randomUUID } from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  const { topic } = await req.json();
  if (!topic || typeof topic !== 'string') {
    return new Response(JSON.stringify({ message: 'Invalid topic' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const useFake = (process.env.USE_FAKE_LLM || 'false').toLowerCase() === 'true';
  let text: string;
  if (useFake) {
    text = `Share your personal thoughts about ${topic}. What stands out to you and why?`;
  } else {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ message: 'GEMINI_API_KEY not set' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = `Create a single, engaging, open-ended, accessible question about "${topic}" that invites personal thoughts.`;
      const result = await model.generateContent(prompt);
      text = (await result.response.text()).trim();
    } catch (e: any) {
      console.error('LLM generate error:', e?.message || e);
      if ((process.env.ALLOW_LLM_FALLBACK || 'true').toLowerCase() === 'true') {
        text = `What is something about ${topic} that matters to you personally?`;
      } else {
        return new Response(JSON.stringify({ message: 'Failed to generate with LLM' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }
  }

  if (process.env.DATABASE_URL) {
    const pg = getPgPool();
    await ensureSchema();
    const id = randomUUID();
    const { rows } = await pg.query(
      'INSERT INTO question (id, text, topic, is_answered) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, text, topic, false],
    );
    return new Response(JSON.stringify(rows[0]), { headers: { 'Content-Type': 'application/json' } });
  } else {
    const ds = await getDataSource();
    const repo = ds.getRepository(Question);
    const q = repo.create({ text, topic });
    await repo.save(q);
    return new Response(JSON.stringify(q), { headers: { 'Content-Type': 'application/json' } });
  }
}
