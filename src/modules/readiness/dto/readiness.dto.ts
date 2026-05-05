import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, Max, Min } from 'class-validator';

export class ReadinessDto {
  @ApiProperty() id: number;
  @ApiProperty() athleteId: number;
  @ApiProperty() recordedAt: string;
  @ApiProperty() overall: number;
  @ApiProperty() sleep: number;
  @ApiProperty() hrv: number;
  @ApiProperty() soreness: number;
  @ApiProperty() mood: number;
  @ApiProperty() nutrition: number;
}

export class CreateReadinessDto {
  @ApiProperty({ example: '2026-04-27T06:00:00Z' })
  @IsDateString()
  recordedAt: string;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsInt() @Min(0) @Max(100)
  sleep: number;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsInt() @Min(0) @Max(100)
  hrv: number;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsInt() @Min(0) @Max(100)
  soreness: number;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsInt() @Min(0) @Max(100)
  mood: number;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsInt() @Min(0) @Max(100)
  nutrition: number;
}
