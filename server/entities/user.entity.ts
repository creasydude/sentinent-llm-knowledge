import { Answer } from './answer.entity';
import { Point } from './point.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true, type: 'text' })
  otp: string | null = null;

  @Column({ nullable: true, type: 'datetime' })
  otpExpiresAt: Date | null = null;

  @Column({ default: 0 })
  points: number = 0;

  @Column({ default: 0 })
  dailyAnswerCount: number = 0;

  @Column({ nullable: true })
  lastAnswerDate!: Date | null;

  @Column({ nullable: true, type: 'text' })
  refreshToken: string | null = null;

  @Column({ nullable: true, type: 'datetime' })
  refreshTokenExpiresAt: Date | null = null;

  @Column({ default: false })
  isAdmin: boolean = false;

  @OneToMany(() => Answer, (answer) => answer.user)
  answers!: Answer[];

  @OneToMany(() => Point, (point) => point.user)
  pointsEarned!: Point[];
}

