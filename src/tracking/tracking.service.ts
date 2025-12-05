// src/tracking/tracking.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import * as crypto from 'crypto';
import { TrackEventDto } from './dto/track-event.dto';

interface MetaEventResponse {
  events_received?: number;
  fbtrace_id?: string;
  messages?: unknown[];
  [key: string]: unknown;
}

@Injectable()
export class TrackingService {
  private readonly pixelId: string;
  private readonly accessToken: string;
  private readonly apiVersion: string;
  private readonly testEventCode?: string;

  constructor(private readonly configService: ConfigService) {
    this.pixelId = this.configService.get<string>('META_PIXEL_ID', '').trim();
    this.accessToken = this.configService
      .get<string>('META_ACCESS_TOKEN', '')
      .trim();
    this.apiVersion = this.configService.get<string>(
      'META_API_VERSION',
      'v21.0',
    );
    this.testEventCode = this.configService.get<string>('META_TEST_EVENT_CODE');

    // Debug para asegurar que .env se cargó bien:
    console.log('PIXEL ID CARGADO:', this.pixelId);
    console.log(
      'ACCESS TOKEN CARGADO (primeros 10 chars):',
      this.accessToken.substring(0, 10),
      '... longitud:',
      this.accessToken.length,
    );

    if (!this.pixelId || !this.accessToken) {
      console.warn(
        '⚠️ META_PIXEL_ID o META_ACCESS_TOKEN no configurados. Meta CAPI no funcionará.',
      );
    }
  }

  // SHA256 requerido por Meta para email/phone
  private hashSha256(value: string): string {
    return crypto
      .createHash('sha256')
      .update(value.trim().toLowerCase())
      .digest('hex');
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, ''); // deja solo números
  }

  async sendToMeta(event: TrackEventDto): Promise<MetaEventResponse> {
    if (!this.pixelId || !this.accessToken) {
      throw new InternalServerErrorException(
        'Meta Pixel o Access Token no configurados',
      );
    }

    const url = `https://graph.facebook.com/${this.apiVersion}/${this.pixelId}/events`;

    // 🕒 Corregimos el timestamp: nunca mandamos fechas futuras
    const now = Math.floor(Date.now() / 1000); // ahora en segundos
    const candidateTime =
      event.eventTime && Math.floor(new Date(event.eventTime).getTime() / 1000);

    const eventTimeSeconds =
      candidateTime && candidateTime <= now ? candidateTime : now;

    // Construcción del user_data según Meta
    const userData: Record<string, unknown> = {};

    if (event.email) {
      userData.em = this.hashSha256(event.email);
    }

    if (event.phone) {
      const normalized = this.normalizePhone(event.phone);
      if (normalized) userData.ph = this.hashSha256(normalized);
    }

    if (event.clientIpAddress) {
      userData.client_ip_address = event.clientIpAddress;
    }

    if (event.clientUserAgent) {
      userData.client_user_agent = event.clientUserAgent;
    }

    const payload: {
      data: Array<Record<string, unknown>>;
      test_event_code?: string;
    } = {
      data: [
        {
          event_name: event.eventName,
          event_time: eventTimeSeconds,
          event_id: event.eventId,
          user_data: userData,
          custom_data: {
            value: event.value ?? 0,
            currency: event.currency ?? 'USD',
          },
        },
      ],
    };

    if (this.testEventCode) {
      payload.test_event_code = this.testEventCode;
    }

    // DEBUG: Ver payload enviado a Meta
    console.log('PAYLOAD ENVIADO A META:', JSON.stringify(payload, null, 2));

    try {
      const response: AxiosResponse<MetaEventResponse> = await axios.post(
        url,
        payload,
        {
          params: {
            access_token: this.accessToken,
          },
        },
      );

      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error(
          'Error enviando evento a Meta:',
          error.response?.data ?? error.message,
        );
      } else {
        console.error('Error enviando evento a Meta:', error);
      }
      throw new InternalServerErrorException('Error enviando evento a Meta');
    }
  }

  // —————————————————————————
  // GOOGLE (placeholder para después)
  // —————————————————————————
  sendToGoogle(event: TrackEventDto): {
    ok: true;
    message: string;
    event: TrackEventDto;
  } {
    console.log(
      'Evento recibido para Google (pendiente de implementar)',
      event,
    );
    return { ok: true, message: 'Google endpoint aún no implementado', event };
  }
}
