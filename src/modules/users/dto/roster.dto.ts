import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class AthleteListItemDto {
  @ApiProperty() id: number;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiProperty() initials: string;
  @ApiProperty({ nullable: true }) avatarUrl: string | null;
  @ApiProperty() sport: string;
  @ApiProperty({ nullable: true }) sportTypeId: number | null;
  @ApiProperty({ enum: ['PRO', 'AMATEUR'] }) tier: string;
  @ApiProperty() level: number;
  @ApiProperty() xp: number;
  @ApiProperty() streak: number;
  @ApiProperty() readiness: number;
  @ApiProperty() load: number;
  @ApiProperty() acwr: number;
  @ApiProperty({ enum: ['up', 'down', 'flat'] }) trend: string;
  @ApiProperty({ enum: ['PENDING', 'ACTIVE', 'INACTIVE'] }) coachAthleteStatus: string;
}

export class RosterQueryDto extends PaginationDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsEnum(['PRO', 'AMATEUR']) tier?: 'PRO' | 'AMATEUR';
}

export class InviteAthleteDto {
  @ApiProperty({ example: 'athlete@example.com' })
  @IsEmail()
  email: string;
}

export class CoachAthleteDto {
  @ApiProperty() id: number;
  @ApiProperty() coachId: number;
  @ApiProperty() athleteId: number;
  @ApiProperty({ enum: ['PENDING', 'ACTIVE', 'INACTIVE'] }) status: string;
  @ApiProperty({ nullable: true }) startedAt: string | null;
}
