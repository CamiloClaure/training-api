import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AthletesService } from './athletes.service.js';
import { CoachesService } from './coaches.service.js';
import { UpdateAthleteDto } from './dto/athlete-profile.dto.js';
import { UpdateCoachDto } from './dto/coach-profile.dto.js';
import { InviteAthleteDto, RosterQueryDto } from './dto/roster.dto.js';

@ApiTags('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Controller()
export class UsersController {
  constructor(
    private readonly athletesService: AthletesService,
    private readonly coachesService: CoachesService,
  ) {}

  // ─── Athlete self ──────────────────────────────────────────

  @Get('athletes/me')
  @Roles(UserRole.ATHLETE)
  getMyAthleteProfile(@CurrentUser() user: any) {
    return this.athletesService.getMyProfile(user);
  }

  @Patch('athletes/me')
  @Roles(UserRole.ATHLETE)
  updateMyAthleteProfile(@CurrentUser() user: any, @Body() dto: UpdateAthleteDto) {
    return this.athletesService.updateMyProfile(user, dto);
  }

  // ─── Coach self ────────────────────────────────────────────

  @Get('coaches/me')
  @Roles(UserRole.COACH)
  getMyCoachProfile(@CurrentUser() user: any) {
    return this.coachesService.getMyProfile(user);
  }

  @Patch('coaches/me')
  @Roles(UserRole.COACH)
  updateMyCoachProfile(@CurrentUser() user: any, @Body() dto: UpdateCoachDto) {
    return this.coachesService.updateMyProfile(user, dto);
  }

  // ─── Athlete by id (coach only) ───────────────────────────

  @Get('athletes/:id')
  @Roles(UserRole.COACH, UserRole.ATHLETE)
  getAthleteById(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.athletesService.getAthleteById(id, user);
  }

  // ─── Roster ───────────────────────────────────────────────

  @Get('athletes')
  @Roles(UserRole.COACH)
  getRoster(@Query() query: RosterQueryDto, @CurrentUser() user: any) {
    return this.athletesService.getRoster(user, query);
  }

  @Post('coach-athletes/invite')
  @Roles(UserRole.COACH)
  inviteAthlete(@Body() dto: InviteAthleteDto, @CurrentUser() user: any) {
    return this.athletesService.inviteAthlete(user, dto);
  }

  @Delete('coach-athletes/:athleteId')
  @Roles(UserRole.COACH)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeAthlete(
    @Param('athleteId', ParseIntPipe) athleteId: number,
    @CurrentUser() user: any,
  ) {
    return this.athletesService.removeAthlete(user, athleteId);
  }
}
