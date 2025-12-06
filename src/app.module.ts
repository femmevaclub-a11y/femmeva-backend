/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { LeadsModule } from './leads/leads.module';
import { TrackingModule } from './tracking/tracking.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // 👇 IMPORTANTE: sin TypeORM, sin base de datos, nada de postgres
    // Esto es solo para que la app arranque limpia.
    LeadsModule,
    TrackingModule,
  ],
})
export class AppModule {}
