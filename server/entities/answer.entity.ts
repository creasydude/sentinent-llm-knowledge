import { User } from './user.entity';
import { Question } from './question.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';

@Entity()
export class Answer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  text!: string;

  @ManyToOne(() => Question, (question) => question.answers)
  question!: Question;

  @ManyToOne(() => User, (user) => user.answers)
  user!: User;

  @Column({ default: false })
  isGoodAnswer: boolean = false;
}

