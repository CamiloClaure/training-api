import { ApiProperty } from '@nestjs/swagger';

export class LoadSnapshotDto {
  @ApiProperty() acute: number;
  @ApiProperty() chronic: number;
  @ApiProperty() acwr: number;
  @ApiProperty({ enum: ['up', 'down', 'flat'] }) trend: string;
  @ApiProperty() monotony: number;
  @ApiProperty() strain: number;
}

export class LoadPointDto {
  @ApiProperty() weekStart: string;
  @ApiProperty() acute: number;
  @ApiProperty() chronic: number;
}

export class TrainingLoadDto {
  @ApiProperty() athleteId: number;
  @ApiProperty({ type: LoadSnapshotDto }) current: LoadSnapshotDto;
  @ApiProperty({ type: [LoadPointDto] }) history: LoadPointDto[];
}
