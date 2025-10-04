import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Answer } from './answer.entity';

@Entity()
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  text!: string;

  @Column()
  topic!: string;

  @Column({ default: false })
  isAnswered: boolean = false;

  @OneToMany(() => Answer, (answer) => answer.question)
  answers!: Answer[];
}

