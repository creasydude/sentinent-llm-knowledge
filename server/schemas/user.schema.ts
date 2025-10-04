import { EntitySchema } from 'typeorm';

export interface User {
  id: string;
  email: string;
  otp: string | null;
  otpExpiresAt: Date | null;
  points: number;
  dailyAnswerCount: number;
  lastAnswerDate: Date | null;
  refreshToken: string | null;
  refreshTokenExpiresAt: Date | null;
  isAdmin: boolean;
}

export const UserSchema = new EntitySchema<User>({
  name: 'User',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    email: { type: String, unique: true },
    otp: { type: 'text', nullable: true },
    otpExpiresAt: { type: Date, nullable: true },
    points: { type: Number, default: 0 },
    dailyAnswerCount: { type: Number, default: 0 },
    lastAnswerDate: { type: Date, nullable: true },
    refreshToken: { type: 'text', nullable: true },
    refreshTokenExpiresAt: { type: Date, nullable: true },
    isAdmin: { type: Boolean, default: false },
  },
  relations: {
    answers: { type: 'one-to-many', target: 'Answer', inverseSide: 'user' },
    pointsEarned: { type: 'one-to-many', target: 'Point', inverseSide: 'user' },
  },
});
