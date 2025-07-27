import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            verifyOtp: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should call authService.login with the provided email', async () => {
      const email = 'test@example.com';
      await controller.login(email);
      expect(authService.login).toHaveBeenCalledWith(email);
    });
  });

  describe('verifyOtp', () => {
    it('should call authService.verifyOtp with the provided email and otp', async () => {
      const email = 'test@example.com';
      const otp = '123456';
      const result = {
        accessToken: 'mocked-jwt-token',
        refreshToken: 'mocked-refresh-token',
      };
      jest.spyOn(authService, 'verifyOtp').mockResolvedValue(result);

      expect(await controller.verifyOtp(email, otp)).toEqual(result);
      expect(authService.verifyOtp).toHaveBeenCalledWith(email, otp);
    });
  });
});
