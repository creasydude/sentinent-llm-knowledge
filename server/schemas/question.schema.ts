import { EntitySchema } from 'typeorm';

export interface Question {
  id: string;
  text: string;
  topic: string;
  isAnswered: boolean;
}

export const QuestionSchema = new EntitySchema<Question>({
  name: 'Question',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    text: { type: String },
    topic: { type: String },
    isAnswered: { type: Boolean, default: false },
  },
  relations: {
    answers: { type: 'one-to-many', target: 'Answer', inverseSide: 'question' },
  },
});

