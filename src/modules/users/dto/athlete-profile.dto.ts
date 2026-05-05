import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class SportProfileDto {
  @ApiProperty() sportTypeId: number;
  @ApiProperty() sportTypeName: string;
  @ApiProperty() isPrimary: boolean;
}

export class ActivePlanSummaryDto {
  @ApiProperty() id: number;
  @ApiProperty() name: string;
  @ApiProperty() phase: string;
  @ApiProperty() weekNumber: number;
  @ApiProperty() totalWeeks: number;
}

export class AthleteProfileDto {
  @ApiProperty() id: number;
  @ApiProperty() userId: number;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiProperty() initials: string;
  @ApiProperty({ nullable: true }) avatarUrl: string | null;
  @ApiProperty({ nullable: true }) birthDate: string | null;
  @ApiProperty({ nullable: true }) weightKg: number | null;
  @ApiProperty({ nullable: true }) heightCm: number | null;
  @ApiProperty({ nullable: true }) restingHr: number | null;
  @ApiProperty({ nullable: true }) maxHr: number | null;
  @ApiProperty({ enum: ['PRO', 'AMATEUR'] }) tier: string;
  @ApiProperty({ type: [SportProfileDto] }) sportProfiles: SportProfileDto[];
  @ApiProperty({ nullable: true }) activePlan: ActivePlanSummaryDto | null;
  @ApiProperty({ nullable: true }) nextRace: null;
  // gamification
  @ApiProperty() level: number;
  @ApiProperty() xp: number;
  @ApiProperty() xpNext: number;
  @ApiProperty() streak: number;
  @ApiProperty({ nullable: true }) rank: number | null;
  @ApiProperty() badgesEarned: number;
  @ApiProperty() badgesTotal: number;
  // training summary
  @ApiProperty() readiness: number;
  @ApiProperty() load: number;
  @ApiProperty() acwr: number;
  @ApiProperty({ enum: ['up', 'down', 'flat'] }) trend: string;
}

export class UpdateAthleteDto {
  @IsOptional() @IsDateString() birthDate?: string;
  @IsOptional() @IsNumber() weightKg?: number;
  @IsOptional() @IsNumber() heightCm?: number;
  @IsOptional() @IsNumber() restingHr?: number;
  @IsOptional() @IsNumber() maxHr?: number;
  @IsOptional() @IsEnum(['PRO', 'AMATEUR']) tier?: 'PRO' | 'AMATEUR';
}
