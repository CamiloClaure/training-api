import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config/app.config.js';
import { jwtConfig } from './config/jwt.config.js';
import { redisConfig } from './config/redis.config.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RedisModule } from './redis/redis.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { TrainingModule } from './modules/training/training.module.js';
import { ActivitiesModule } from './modules/activities/activities.module.js';
import { StatsModule } from './modules/stats/stats.module.js';
import { IntegrationsModule } from './modules/integrations/integrations.module.js';
import { ReadinessModule } from './modules/readiness/readiness.module.js';
import { BiometricsModule } from './modules/biometrics/biometrics.module.js';
import { TrainingLoadModule } from './modules/training-load/training-load.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, redisConfig],
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    TrainingModule,
    ActivitiesModule,
    StatsModule,
    IntegrationsModule,
    ReadinessModule,
    BiometricsModule,
    TrainingLoadModule,
  ],
})
export class AppModule {}
