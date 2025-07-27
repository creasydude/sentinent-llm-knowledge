import { Controller, Post, Param, UseGuards, Get, Res, NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { AnswersService } from '../answers/answers.service';
import { PointsService } from '../points/points.service';
import { Response } from 'express';
import { Question } from '../questions/entities/question.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Answer } from '../answers/entities/answer.entity';
import { User } from '../users/entities/user.entity';

@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private answersService: AnswersService,
    private pointsService: PointsService,
    @InjectRepository(Question)
    private questionsRepository: Repository<Question>,
    @InjectRepository(Answer)
    private answersRepository: Repository<Answer>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  @Post('answers/:id/validate')
  async validateAnswer(@Param('id') id: string) {
    const answer = await this.answersRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!answer) {
      throw new NotFoundException('Answer not found');
    }

    if (answer.isGoodAnswer) {
      throw new BadRequestException('Answer already validated');
    }

    answer.isGoodAnswer = true;
    await this.answersRepository.save(answer);
    await this.pointsService.awardPointsForGoodAnswer(answer.user.id);

    return { message: 'Answer validated and points awarded' };
  }

  @Get('users')
  async getUsers() {
    return this.usersRepository.find();
  }

  @Get('answers')
  async getAnswers() {
    return this.answersRepository.find({ relations: ['user', 'question'] });
  }

  @Get('datasets/export')
  async exportDataset(@Res() res: Response) {
    const goodAnswers = await this.answersRepository.find({
      where: { isGoodAnswer: true },
      relations: ['question'],
    });

    const dataset = goodAnswers.map((answer) => ({
      instruction: answer.question.text,
      output: answer.text,
    }));

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=dataset.json');
    res.send(JSON.stringify(dataset, null, 2));
  }
}
