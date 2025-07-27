import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointsController } from './points.controller';
import { PointsService } from './points.service';
import { User } from '../users/entities/user.entity';
import { Point } from './entities/point.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Point])],
  controllers: [PointsController],
  providers: [PointsService],
  exports: [PointsService],
})
export class PointsModule {}
