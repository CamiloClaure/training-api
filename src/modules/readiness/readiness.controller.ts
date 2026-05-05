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
import { ReadinessService } from './readiness.service.js';
import { CreateReadinessDto } from './dto/readiness.dto.js';

@ApiTags('readiness')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('athletes/:id/readiness')
export class ReadinessController {
  constructor(private readonly readinessService: ReadinessService) {}

  @Get('latest')
  getLatest(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.readinessService.getLatest(id, user);
  }

  @Get()
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getHistory(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.readinessService.getHistory(id, user, from, to);
  }

  @Post()
  create(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() dto: CreateReadinessDto,
  ) {
    return this.readinessService.create(id, user, dto);
  }
}
