import { Module } from '@nestjs/common';
import { TrainingLoadController } from './training-load.controller.js';
import { TrainingLoadService } from './training-load.service.js';

@Module({
  controllers: [TrainingLoadController],
  providers: [TrainingLoadService],
})
export class TrainingLoadModule {}
