import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Point } from './entities/point.entity';

@Injectable()
export class PointsService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Point)
    private pointsRepository: Repository<Point>,
  ) {}

  async awardPointsForSubmission(userId: string): Promise<void> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newPoints = user.points + 10;
    await this.usersRepository.update(userId, { points: newPoints });

    const pointTransaction = this.pointsRepository.create({
      user,
      points: 10,
      reason: 'Answer Submission',
    });
    await this.pointsRepository.save(pointTransaction);
  }

  async awardPointsForGoodAnswer(userId: string): Promise<void> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newPoints = user.points + 10;
    await this.usersRepository.update(userId, { points: newPoints });

    const pointTransaction = this.pointsRepository.create({
      user,
      points: 10,
      reason: 'Good Answer',
    });
    await this.pointsRepository.save(pointTransaction);
  }
}
