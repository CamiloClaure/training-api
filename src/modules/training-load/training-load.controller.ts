import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { TrainingLoadService } from './training-load.service.js';

@ApiTags('training-load')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('athletes/:id/load')
export class TrainingLoadController {
  constructor(private readonly trainingLoadService: TrainingLoadService) {}

  @Get()
  @ApiQuery({ name: 'weeks', required: false, type: Number })
  getLoad(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Query('weeks') weeks?: number,
  ) {
    return this.trainingLoadService.getLoad(id, user, weeks ? +weeks : 6);
  }
}
