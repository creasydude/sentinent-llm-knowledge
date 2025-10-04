import { EntitySchema } from 'typeorm';

export interface Answer {
  id: string;
  text: string;
  isGoodAnswer: boolean;
}

export const AnswerSchema = new EntitySchema<Answer>({
  name: 'Answer',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    text: { type: String },
    isGoodAnswer: { type: Boolean, default: false },
  },
  relations: {
    question: { type: 'many-to-one', target: 'Question', inverseSide: 'answers' },
    user: { type: 'many-to-one', target: 'User', inverseSide: 'answers' },
  },
});

