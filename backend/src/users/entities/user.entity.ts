import { Answer } from '../../answers/entities/answer.entity';
import { Point } from '../../points/entities/point.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, type: 'text' })
  otp: string | null;

  @Column({ nullable: true, type: 'datetime' })
  otpExpiresAt: Date | null;

  @Column({ default: 0 })
  points: number;

  @Column({ default: 0 })
  dailyAnswerCount: number;

  @Column({ nullable: true })
  lastAnswerDate: Date;

  @Column({ nullable: true, type: 'text' })
  refreshToken: string | null;

  @Column({ nullable: true, type: 'datetime' })
  refreshTokenExpiresAt: Date | null;

  @Column({ default: false })
  isAdmin: boolean;

  @OneToMany(() => Answer, (answer) => answer.user)
  answers: Answer[];

  @OneToMany(() => Point, (point) => point.user)
  pointsEarned: Point[];
}
