import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class BiometricPointDto {
  @ApiProperty() recordedAt: string;
  @ApiProperty() value: number;
}

export class BiometricSeriesDto {
  @ApiProperty() current: number;
  @ApiProperty() unit: string;
  @ApiProperty() delta: number;
  @ApiProperty({ type: [BiometricPointDto] }) dataPoints: BiometricPointDto[];
}

export class BiometricsDto {
  @ApiProperty() athleteId: number;
  @ApiProperty({ type: Object }) metrics: Record<string, BiometricSeriesDto>;
}

export class CreateBodyMetricDto {
  @ApiProperty({ example: '2026-04-27' })
  @IsDateString()
  recordedAt: string;

  @IsOptional() @IsNumber() weightKg?: number;
  @IsOptional() @IsNumber() bodyFatPct?: number;
  @IsOptional() @IsNumber() restingHr?: number;
  @IsOptional() @IsNumber() vo2max?: number;
  @IsOptional() @IsNumber() hrvMs?: number;
  @IsOptional() @IsNumber() sleepHours?: number;
  @IsOptional() @IsString() notes?: string;
}

export class BodyMetricDto {
  @ApiProperty() id: number;
  @ApiProperty() athleteId: number;
  @ApiProperty() recordedAt: string;
  @ApiProperty({ nullable: true }) weightKg: number | null;
  @ApiProperty({ nullable: true }) bodyFatPct: number | null;
  @ApiProperty({ nullable: true }) restingHr: number | null;
  @ApiProperty({ nullable: true }) vo2max: number | null;
  @ApiProperty({ nullable: true }) hrvMs: number | null;
  @ApiProperty({ nullable: true }) sleepHours: number | null;
  @ApiProperty({ nullable: true }) notes: string | null;
}
