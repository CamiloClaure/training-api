import { Module } from '@nestjs/common';
import { GarminService } from './garmin/garmin.service';
import { StravaService } from './strava/strava.service';

@Module({
  providers: [GarminService, StravaService]
})
export class IntegrationsModule {}
