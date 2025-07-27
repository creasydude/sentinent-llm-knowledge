import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AnswersService } from './answers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('answers')
export class AnswersController {
  constructor(private answersService: AnswersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async submitAnswer(
    @Request() req,
    @Body('questionId') questionId: string,
    @Body('answerText') answerText: string,
  ) {
    return this.answersService.submitAnswer(req.user.id, questionId, answerText);
  }
}
