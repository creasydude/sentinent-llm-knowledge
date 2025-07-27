import { Module } from '@nestjs/common';
import { LlmController } from './llm.controller';
import { LlmService } from './llm.service';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [ConfigModule, AdminModule],
  controllers: [LlmController],
  providers: [LlmService],
  exports: [LlmService],
})
export class LlmModule {}
