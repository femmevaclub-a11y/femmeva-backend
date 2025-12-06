/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { LeadsModule } from './leads/leads.module';
import { TrackingModule } from './tracking/tracking.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      useFactory: () => {
        console.log('>>> DATABASE_URL en runtime:', process.env.DATABASE_URL);
        return {
          type: 'postgres',
          url: process.env.DATABASE_URL, // 👈 SOLO usamos la URL, nada de localhost
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),

    LeadsModule,
    TrackingModule,
  ],
})
export class AppModule {}
