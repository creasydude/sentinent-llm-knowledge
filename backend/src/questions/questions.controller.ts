import { Controller, Get, UseGuards, Post, Body } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';

@Controller('questions')
export class QuestionsController {
  constructor(private questionsService: QuestionsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('unanswered')
  async getUnansweredQuestion() {
    return this.questionsService.findUnansweredQuestion();
  }

  @UseGuards(AdminGuard)
  @Post('generate')
  async generateQuestion(@Body('topic') topic: string) {
    return this.questionsService.generateQuestion(topic);
  }
}
