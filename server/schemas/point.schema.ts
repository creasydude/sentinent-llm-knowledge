import { EntitySchema } from 'typeorm';

export interface Point {
  id: string;
  points: number;
  reason: string;
  timestamp: Date;
}

export const PointSchema = new EntitySchema<Point>({
  name: 'Point',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    points: { type: Number },
    reason: { type: String },
    timestamp: { type: 'datetime', default: () => 'CURRENT_TIMESTAMP' },
  },
  relations: {
    user: { type: 'many-to-one', target: 'User', inverseSide: 'pointsEarned' },
  },
});

