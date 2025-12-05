/* eslint-disable
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-return
*/

import { Body, Controller, Headers, Ip, Post } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { TrackEventDto } from './dto/track-event.dto';
import { LeadsService } from '../leads/leads.service';

// Tipos aproximados del payload de Hotmart (para evitar any)
interface HotmartBuyer {
  email?: string;
  phone?: string;
}

interface HotmartPurchase {
  id?: string | number;
  status?: string;
  price?: number | string;
  value?: number | string;
  currency?: string;
  currency_code?: string;
}

interface HotmartTransaction {
  id?: string | number;
  transaction?: string | number;
  status?: string;
  value?: number | string;
  amount?: number | string;
  currency?: string;
}

interface HotmartData {
  purchase?: HotmartPurchase;
  transaction?: HotmartTransaction;
  buyer?: HotmartBuyer;
  subscriber?: HotmartBuyer;
  client?: HotmartBuyer;
  customer?: HotmartBuyer;
  status?: string;
  value?: number | string;
  currency?: string;
  currency_code?: string;
  id?: string | number;
}

interface HotmartPayload {
  event?: string;
  event_name?: string;
  data?: HotmartData;
  [key: string]: unknown;
}

@Controller('tracking')
export class TrackingController {
  constructor(
    private readonly trackingService: TrackingService,
    private readonly leadsService: LeadsService,
  ) {}

  @Post('meta')
  async trackMeta(
    @Body() body: TrackEventDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<{ ok: true; provider: 'meta'; result: unknown }> {
    // completamos IP y userAgent si no vienen del front
    body.clientIpAddress = body.clientIpAddress || ip;
    body.clientUserAgent = body.clientUserAgent || userAgent;

    // 💾 si es un lead y trae email, lo guardamos
    if (body.eventName === 'lead' && body.email) {
      const lead = await this.leadsService.createFromTrackEvent(
        body,
        ip,
        userAgent,
      );
      if (lead && lead.id) {
        console.log('💾 Lead guardado con id:', lead.id);
      } else {
        console.log('⚠️ No se guardó lead (posible falta de email).');
      }
    }

    // Enviamos SIEMPRE el evento a Meta
    const result: unknown = await this.trackingService.sendToMeta(body);

    return {
      ok: true,
      provider: 'meta',
      result,
    };
  }

  @Post('google')
  trackGoogle(@Body() body: TrackEventDto): {
    ok: true;
    provider: 'google';
    result: unknown;
  } {
    const result: unknown = this.trackingService.sendToGoogle(body);
    return {
      ok: true,
      provider: 'google',
      result,
    };
  }

  // 🔔 WEBHOOK DESDE HOTMART → PURCHASE EN META
  @Post('hotmart')
  async hotmartWebhook(
    @Body() body: HotmartPayload,
  ): Promise<
    | { ok: true; ignored: true; reason: string; event?: string }
    | { ok: true; provider: 'meta'; type: 'purchase'; result: unknown }
  > {
    console.log('🔥 Webhook Hotmart recibido:', JSON.stringify(body, null, 2));

    const event = body.event || body.event_name;
    const data: HotmartData = body.data ?? {};

    // Status de la transacción/compra
    const statusRaw =
      data.purchase?.status || data.transaction?.status || data.status;
    const statusUpper = statusRaw ? statusRaw.toUpperCase() : '';

    // Si no está aprobada, no mandamos purchase
    if (
      statusUpper &&
      !['APPROVED', 'COMPLETED', 'PAID', 'CONFIRMED'].includes(statusUpper)
    ) {
      console.log(
        '⚠️ Venta no aprobada. Status:',
        statusUpper,
        '- Webhook ignorado.',
      );
      return { ok: true, ignored: true, reason: 'not_approved', event };
    }

    // Email de la compradora (por si luego quieres usarlo también)
    const email =
      data.buyer?.email ||
      data.subscriber?.email ||
      data.client?.email ||
      data.customer?.email;

    // Valor de la compra
    const rawValue =
      data.purchase?.price ??
      data.purchase?.value ??
      data.transaction?.value ??
      data.transaction?.amount ??
      data.value;

    const value = rawValue !== undefined ? Number(rawValue) : undefined;

    // Moneda
    const currency =
      data.purchase?.currency ||
      data.purchase?.currency_code ||
      data.transaction?.currency ||
      data.currency ||
      data.currency_code ||
      'USD';

    // ID de la transacción/compra para event_id
    const eventIdRaw =
      data.purchase?.id ??
      data.transaction?.transaction ??
      data.transaction?.id ??
      data.id;
    const eventId = eventIdRaw ? String(eventIdRaw) : undefined;

    const purchaseEvent: TrackEventDto = {
      eventName: 'purchase',
      eventId,
      email,
      value,
      currency,
    };

    console.log('🧾 Evento purchase que se enviará a Meta:', purchaseEvent);

    const result: unknown =
      await this.trackingService.sendToMeta(purchaseEvent);

    return {
      ok: true,
      provider: 'meta',
      type: 'purchase',
      result,
    };
  }
}
