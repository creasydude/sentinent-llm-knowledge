import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';

import * as nodemailer from 'nodemailer';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue(true),
  }),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: Repository<User>;
  let jwtService: JwtService;
  let sendMailSpy: jest.Mock;

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn().mockImplementation((dto) => dto),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'EMAIL_HOST') return 'smtp.example.com';
              if (key === 'EMAIL_USER') return 'user@example.com';
              if (key === 'EMAIL_PASS') return 'password';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);

    sendMailSpy = (nodemailer.createTransport as jest.Mock).mock.results[0].value.sendMail;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateOtp', () => {
    it('should generate a 6-digit OTP', () => {
      const otp = service.generateOtp();
      expect(otp).toMatch(/^\d{6}$/);
    });
  });

  describe('sendOtpEmail', () => {
    it('should send an email with the OTP', async () => {
      await service.sendOtpEmail('test@example.com', '123456');
      expect((nodemailer.createTransport as jest.Mock).mock.results[0].value.sendMail).toHaveBeenCalledWith({
        from: '"LLM-Knowledge" <mohammad.mokhtare1379@gmail.com>',
        to: 'test@example.com',
        subject: 'Your OTP Code',
        text: 'Your OTP code is: 123456',
      });
    });
  });

  describe('login', () => {
    it('should create a new user and send OTP if user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      jest.spyOn(service, 'generateOtp').mockReturnValue('123456');

      await service.login('new@example.com');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: 'new@example.com' } });
      expect(mockUserRepository.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'new@example.com', otp: expect.any(String), otpExpiresAt: expect.any(Date) }));
      expect(mockUserRepository.save).toHaveBeenCalledWith(expect.objectContaining({ email: 'new@example.com' }));
    });

    it('should update existing user and send OTP if user exists', async () => {
      const existingUser = { id: 'some-uuid', email: 'existing@example.com', otp: null, otpExpiresAt: null };
      mockUserRepository.findOne.mockResolvedValue(existingUser);
      jest.spyOn(service, 'generateOtp').mockReturnValue('654321');

      await service.login('existing@example.com');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: 'existing@example.com' } });
      expect(existingUser.otp).toBeDefined();
      expect(existingUser.otpExpiresAt).toBeInstanceOf(Date);
      expect(mockUserRepository.save).toHaveBeenCalledWith(existingUser);
      expect(service['transporter'].sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'existing@example.com', text: 'Your OTP code is: 654321' }));
    });
  });

  describe('verifyOtp', () => {
    it('should return JWT if OTP is valid and not expired', async () => {
      const user = {
        id: 'some-uuid',
        email: 'test@example.com',
        isAdmin: false,
        otp: await bcrypt.hash('123456', 10),
        otpExpiresAt: new Date(Date.now() + 60 * 1000), // 1 minute from now
      };
      mockUserRepository.findOne.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue('mocked-jwt-token');

      const result = await service.verifyOtp('test@example.com', '123456');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { email: user.email, sub: user.id, isAdmin: user.isAdmin },
        { expiresIn: '15m' },
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { email: user.email, sub: user.id },
        { expiresIn: '7d' },
      );
      expect(result).toEqual({ accessToken: 'mocked-jwt-token', refreshToken: 'mocked-jwt-token' });
      expect(user.otp).toBeNull();
      expect(user.otpExpiresAt).toBeNull();
      expect(mockUserRepository.save).toHaveBeenCalledWith(user);
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.verifyOtp('nonexistent@example.com', '123456')).rejects.toThrow(
        'Invalid request',
      );
    });

    it('should throw error if OTP is incorrect', async () => {
      const user = {
        id: 'some-uuid',
        email: 'test@example.com',
        otp: await bcrypt.hash('123456', 10),
        otpExpiresAt: new Date(Date.now() + 60 * 1000),
      };
      mockUserRepository.findOne.mockResolvedValue(user);

      await expect(service.verifyOtp('test@example.com', '654321')).rejects.toThrow(
        'Invalid OTP',
      );
    });

    it('should throw error if OTP is expired', async () => {
      const user = {
        id: 'some-uuid',
        email: 'test@example.com',
        otp: await bcrypt.hash('123456', 10),
        otpExpiresAt: new Date(Date.now() - 60 * 1000), // 1 minute ago
      };
      mockUserRepository.findOne.mockResolvedValue(user);

      await expect(service.verifyOtp('test@example.com', '123456')).rejects.toThrow(
        'OTP has expired',
      );
    });
  });

  describe('refreshTokens', () => {
    it('should return new tokens if refresh token is valid', async () => {
      const user = {
        id: 'some-uuid',
        email: 'test@example.com',
        isAdmin: false,
        refreshToken: await bcrypt.hash('old-refresh-token', 10),
        refreshTokenExpiresAt: new Date(Date.now() + 60 * 1000),
      };
      mockJwtService.verify.mockReturnValue({ sub: user.id, email: user.email });
      mockUserRepository.findOne.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue('new-mocked-jwt-token');

      const result = await service.refreshTokens('old-refresh-token');

      expect(mockJwtService.verify).toHaveBeenCalledWith('old-refresh-token');
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: user.id } });
      expect(result).toEqual({ accessToken: 'new-mocked-jwt-token', refreshToken: 'new-mocked-jwt-token' });
      expect(user.refreshToken).toBeDefined();
      expect(user.refreshTokenExpiresAt).toBeInstanceOf(Date);
      expect(mockUserRepository.save).toHaveBeenCalledWith(user);
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshTokens('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'non-existent-id', email: 'test@example.com' });
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.refreshTokens('valid-but-nonexistent-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token is expired', async () => {
      const user = {
        id: 'some-uuid',
        email: 'test@example.com',
        refreshToken: await bcrypt.hash('old-refresh-token', 10),
        refreshTokenExpiresAt: new Date(Date.now() - 60 * 1000),
      };
      mockJwtService.verify.mockReturnValue({ sub: user.id, email: user.email });
      mockUserRepository.findOne.mockResolvedValue(user);

      await expect(service.refreshTokens('old-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if stored refresh token does not match', async () => {
      const user = {
        id: 'some-uuid',
        email: 'test@example.com',
        refreshToken: await bcrypt.hash('different-refresh-token', 10),
        refreshTokenExpiresAt: new Date(Date.now() + 60 * 1000),
      };
      mockJwtService.verify.mockReturnValue({ sub: user.id, email: user.email });
      mockUserRepository.findOne.mockResolvedValue(user);

      await expect(service.refreshTokens('old-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});