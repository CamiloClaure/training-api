import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CoachProfileDto {
  @ApiProperty() id: number;
  @ApiProperty() userId: number;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiProperty() initials: string;
  @ApiProperty({ nullable: true }) avatarUrl: string | null;
  @ApiProperty({ nullable: true }) specialty: string | null;
  @ApiProperty({ nullable: true }) bio: string | null;
  @ApiProperty() athleteCount: number;
}

export class UpdateCoachDto {
  @IsOptional() @IsString() specialty?: string;
  @IsOptional() @IsString() bio?: string;
}
