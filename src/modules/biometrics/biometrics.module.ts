import { Module } from '@nestjs/common';
import { BiometricsController } from './biometrics.controller.js';
import { BiometricsService } from './biometrics.service.js';

@Module({
  controllers: [BiometricsController],
  providers: [BiometricsService],
})
export class BiometricsModule {}
