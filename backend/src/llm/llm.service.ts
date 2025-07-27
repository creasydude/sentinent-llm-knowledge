import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class LlmService {
  private genAI: GoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('GEMINI_API_KEY is not set.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateQuestion(topic: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // const prompt = `Generate a single, unique, and insightful question about ${topic} that would elicit a detailed explanation from an expert. The question should not be easily answerable with a simple 'yes' or 'no'.`;
    const prompt = `
**Your Goal:** Create a single, engaging question about "${topic}" to ask the general public. The question should be easy for anyone to answer based on their personal experiences, opinions, or general knowledge.

**The Question Must Be:**
1.  **Highly Accessible:** A teenager or a grandparent should be able to understand and answer it. Use simple, everyday language. Avoid all jargon and technical terms.
2.  **Open-Ended:** It must encourage a descriptive answer, not a 'yes/no' or a single-word response.
3.  **Personal & Relatable:** Frame the question to connect with the person's own life. Using "you" or "your" is highly effective.
4.  **Not a Test:** It must be clear there is no "correct" answer. The aim is to gather authentic thoughts and feelings, not to test knowledge.
5.  **Conversation Starter:** The question should be interesting enough that someone would genuinely want to share their thoughts on it.

**Example of what to AVOID for the topic 'Coffee':**
* "What are the differences between Arabica and Robusta beans?" (Too specific, knowledge-based)
* "Is coffee good for you?" (Leads to a simple yes/no, or a debate)

**Example of what to AIM FOR for the topic 'Coffee':**
* "Describe the perfect situation or setting for you to enjoy a cup of coffee. What makes it special?"

**Now, generate one question for the topic: "${topic}"**
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = await response.text();
      return text.trim();
    } catch (error) {
      console.error('Error generating question:', error);
      throw new Error('Failed to generate question from LLM.');
    }
  }
}
