import { getDataSource } from '@/lib/db';
import { QuestionSchema as Question } from '@/server/schemas/question.schema';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  const { topic } = await req.json();
  if (!topic || typeof topic !== 'string') {
    return new Response(JSON.stringify({ message: 'Invalid topic' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ message: 'GEMINI_API_KEY not set' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const prompt = `Create a single, engaging, open-ended, accessible question about "${topic}" that invites personal thoughts.`;
  const result = await model.generateContent(prompt);
  const text = (await result.response.text()).trim();

  const ds = await getDataSource();
  const repo = ds.getRepository(Question);
  const q = repo.create({ text, topic });
  await repo.save(q);
  return new Response(JSON.stringify(q), { headers: { 'Content-Type': 'application/json' } });
}
