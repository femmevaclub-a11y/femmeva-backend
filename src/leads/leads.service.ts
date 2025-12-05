/* eslint-disable
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-return
*/

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Lead } from './lead.entity';
import { TrackEventDto } from '../tracking/dto/track-event.dto';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,
  ) {}

  /**
   * Crea un lead a partir de un TrackEventDto.
   * Solo guarda si hay email.
   */
  async createFromTrackEvent(
    event: TrackEventDto,
    ip?: string,
    userAgent?: string,
  ): Promise<Lead | null> {
    // solo guardamos si hay email
    if (!event.email) {
      return null;
    }

    const data: DeepPartial<Lead> = {
      // estos siempre podemos ponerlos
      email: event.email,
      source: event.source ?? 'unknown',
      eventName: event.eventName ?? 'lead',
    };

    // solo añadimos las props si existen (así evitamos null)
    if (event.name) {
      data.name = event.name;
    }

    if (event.eventId) {
      data.eventId = event.eventId;
    }

    if (ip) {
      data.ip = ip;
    }

    if (userAgent) {
      data.userAgent = userAgent;
    }

    const lead = this.leadRepo.create(data);
    const saved = await this.leadRepo.save(lead);
    return saved;
  }
}
