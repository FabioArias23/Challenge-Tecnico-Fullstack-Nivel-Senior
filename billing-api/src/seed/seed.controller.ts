// src/seed/seed.controller.ts
//creo el controlador para el seed

import { Controller, Post } from '@nestjs/common';
import { SeedService } from './seed.service';
import { Public } from '../auth/decorators/public.decorator'; // Importante para no requerir login al probar

@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Public() // Decorador que permite acceso sin token JWT
  @Post()
  executeSeed() {
    return this.seedService.execute();
  }
}