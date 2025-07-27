import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from './entities/question.entity';
import { LlmService } from '../llm/llm.service';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private questionsRepository: Repository<Question>,
    private llmService: LlmService,
  ) {}

  async findUnansweredQuestion(): Promise<Question | null> {
    return this.questionsRepository.findOne({ where: { isAnswered: false } });
  }

  async generateQuestion(topic: string): Promise<Question> {
    const questionText = await this.llmService.generateQuestion(topic);
    const newQuestion = this.questionsRepository.create({
      text: questionText,
      topic,
    });
    return this.questionsRepository.save(newQuestion);
  }
}
