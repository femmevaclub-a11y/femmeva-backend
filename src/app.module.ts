/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // 👇 IMPORTANTE: sin LeadsModule, sin TrackingModule, sin TypeORM
  ],
  controllers: [AppController],
})
export class AppModule {}
