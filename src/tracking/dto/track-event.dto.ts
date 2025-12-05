// src/tracking/dto/track-event.dto.ts
import { IsString, IsOptional, IsEmail, IsNumber } from 'class-validator';

export class TrackEventDto {
  @IsString()
  eventName: string;

  @IsOptional()
  @IsString()
  eventId?: string;

  @IsOptional()
  @IsString()
  name?: string; // 👈 nombre de la persona (no se usa para Meta, pero sí para guardar el lead)

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  source?: string; // 👈 de dónde viene el lead (ej: 'freebie-mini-ritual')

  @IsOptional()
  @IsString()
  eventTime?: string;

  @IsOptional()
  @IsString()
  clientIpAddress?: string;

  @IsOptional()
  @IsString()
  clientUserAgent?: string;
}
