import { Module } from '@nestjs/common';
import { AthletesService } from './athletes.service.js';
import { CoachesService } from './coaches.service.js';
import { UsersController } from './users.controller.js';

@Module({
  controllers: [UsersController],
  providers: [AthletesService, CoachesService],
  exports: [AthletesService, CoachesService],
})
export class UsersModule {}
