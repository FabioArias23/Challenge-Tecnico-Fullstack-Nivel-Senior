import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  // Mockeamos el ConfigService para que devuelva un secreto falso
  // Esto es necesario porque el constructor de la estrategia lo pide inmediatamente
  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') {
        return 'test_secret_key';
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  // Este es el test más importante: verificar el mapeo de datos
  it('should validate and return the user object correctly based on payload', async () => {
    // 1. Arrange: Simulamos el payload que viene dentro del token descifrado
    const payload = {
      sub: '123-uuid',
      username: 'senior_dev',
      'cognito:groups': ['ADMIN', 'USER'], // Simulamos grupos de Cognito
    };

    // 2. Act: Ejecutamos la validación
    const result = await strategy.validate(payload);

    // 3. Assert: Verificamos que devuelva el objeto limpio que usa nuestra APP
    expect(result).toEqual({
      userId: '123-uuid',
      username: 'senior_dev',
      roles: ['ADMIN', 'USER'],
    });
  });
});