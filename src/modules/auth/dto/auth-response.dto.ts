import { ApiProperty } from '@nestjs/swagger';

export class MeDto {
  @ApiProperty() id: number;
  @ApiProperty() email: string;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiProperty({ enum: ['COACH', 'ATHLETE', 'ADMIN'] }) role: string;
  @ApiProperty({ nullable: true }) avatarUrl: string | null;
}

export class AuthResponseDto {
  @ApiProperty() accessToken: string;
  @ApiProperty() refreshToken: string;
  @ApiProperty({ type: MeDto }) user: MeDto;
}
