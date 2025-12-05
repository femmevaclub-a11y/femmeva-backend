// src/tracking/tracking.module.ts
import { Module } from '@nestjs/common';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { LeadsModule } from '../leads/leads.module';

@Module({
  imports: [LeadsModule],
  controllers: [TrackingController],
  providers: [TrackingService],
})
export class TrackingModule {}
