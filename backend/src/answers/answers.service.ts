import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Answer } from './entities/answer.entity';
import { User } from '../users/entities/user.entity';
import { Question } from '../questions/entities/question.entity';
import { PointsService } from '../points/points.service';
import { compareTwoStrings } from 'string-similarity';

@Injectable()
export class AnswersService {
  constructor(
    @InjectRepository(Answer)
    private answersRepository: Repository<Answer>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Question)
    private questionsRepository: Repository<Question>,
    private pointsService: PointsService,
  ) {}

  async submitAnswer(
    userId: string,
    questionId: string,
    answerText: string,
  ): Promise<Answer> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!answerText || answerText.trim() === '') {
      throw new ForbiddenException('Answer text cannot be empty');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (user.lastAnswerDate) {
      const lastAnswerDay = new Date(user.lastAnswerDate);
      lastAnswerDay.setHours(0, 0, 0, 0);

      if (lastAnswerDay.getTime() === today.getTime()) {
        if (user.dailyAnswerCount >= 5) {
          throw new ForbiddenException('Daily answer limit reached');
        }
      } else {
        user.dailyAnswerCount = 0;
      }
    }

    const question = await this.questionsRepository.findOneBy({ id: questionId });
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const existingAnswers = await this.answersRepository.find({
      where: { question: { id: questionId } },
    });

    for (const existingAnswer of existingAnswers) {
      if (compareTwoStrings(existingAnswer.text, answerText) > 0.8) {
        throw new ForbiddenException('Similar answer already submitted');
      }
    }

    const newAnswer = this.answersRepository.create({
      text: answerText,
      user,
      question,
    });

    await this.answersRepository.save(newAnswer);

    await this.pointsService.awardPointsForSubmission(user.id);

    await this.usersRepository.update(user.id, {
      dailyAnswerCount: user.dailyAnswerCount + 1,
      lastAnswerDate: new Date(),
    });

    return newAnswer;
  }
}
