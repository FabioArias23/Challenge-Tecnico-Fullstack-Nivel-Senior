import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { CognitoMockService } from './services/cognito-mock.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: CognitoMockService) {}

  @Public() // El login SIEMPRE debe ser público
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.username, loginDto.password);
  }
}