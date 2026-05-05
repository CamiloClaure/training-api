import { Module } from '@nestjs/common';
import { PlansController } from './controllers/plans.controller';
import { ExercisesController } from './controllers/exercises.controller';
import { PlansService } from './services/plans.service';
import { ExercisesService } from './services/exercises.service';

@Module({
  controllers: [PlansController, ExercisesController],
  providers: [PlansService, ExercisesService]
})
export class TrainingModule {}
