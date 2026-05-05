import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { BiometricsService } from './biometrics.service.js';
import { CreateBodyMetricDto } from './dto/biometrics.dto.js';

@ApiTags('biometrics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('athletes/:id/biometrics')
export class BiometricsController {
  constructor(private readonly biometricsService: BiometricsService) {}

  @Get()
  @ApiQuery({ name: 'metric', required: false, example: 'weight,hrv,sleep,restingHr' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getBiometrics(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Query('metric') metric?: string,
    @Query('days') days?: number,
  ) {
    return this.biometricsService.getBiometrics(id, user, metric, days ? +days : 90);
  }

  @Post()
  createBodyMetric(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() dto: CreateBodyMetricDto,
  ) {
    return this.biometricsService.createBodyMetric(id, user, dto);
  }
}
