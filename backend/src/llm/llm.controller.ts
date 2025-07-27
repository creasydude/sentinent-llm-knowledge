import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { LlmService } from './llm.service';
import { AdminGuard } from '../admin/admin.guard';

@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Post('generate-question')
  @UseGuards(AdminGuard) // To be uncommented later
  async generateQuestion(@Body('topic') topic: string) {
    const question = await this.llmService.generateQuestion(topic);
    return { question };
  }
}
