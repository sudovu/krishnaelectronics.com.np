import crypto from 'crypto';

export type WhatsAppDeliveryStatus = 'NOT_CONFIGURED' | 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';

export interface WhatsAppSendResult {
  status: WhatsAppDeliveryStatus;
  messageId?: string;
  error?: string;
  note?: string;
}

export interface CustomerNotificationParams {
  customerPhone: string;
  customerName: string;
  reference: string;
  subject: string;
  category?: string;
  isBooking?: boolean;
}

export const META_GRAPH_API_VERSION = 'v21.0';
export const BUSINESS_PHONE_NUMBER = '9858083951';

/**
 * Validates Meta WhatsApp Business Cloud API environment variables.
 */
export function getWhatsAppConfig() {
  const isEnabled = process.env.WHATSAPP_ENABLED === 'true';
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  // Strict safety check: requires explicit WHATSAPP_ENABLED="true" feature flag AND all credentials
  const isConfigured = Boolean(
    isEnabled &&
    accessToken &&
    phoneNumberId &&
    appSecret &&
    verifyToken
  );

  return {
    isEnabled,
    accessToken,
    phoneNumberId,
    businessAccountId,
    appSecret,
    verifyToken,
    isConfigured,
  };
}

/**
 * Normalizes Nepali phone numbers to international E.164 format without '+' (e.g. 9779858083951).
 */
export function normalizePhoneNumber(phone: string): string {
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.length === 10 && (clean.startsWith('98') || clean.startsWith('97'))) {
    clean = `977${clean}`;
  } else if (clean.length === 9 && clean.startsWith('083')) {
    clean = `977${clean.slice(1)}`; // 97783522006
  } else if (clean.length === 8 && clean.startsWith('83')) {
    clean = `977${clean}`;
  }
  return clean;
}

/**
 * Official Meta WhatsApp Cloud API Client.
 */
export class MetaWhatsAppClient {
  private config = getWhatsAppConfig();

  /**
   * Checks if Meta Cloud API is ready to dispatch outbound messages.
   */
  isReady(): boolean {
    return this.config.isConfigured;
  }

  /**
   * Sends an automated acknowledgment message to a customer who submitted an inquiry.
   * Uses Meta-approved utility template if configured, or session text message if within customer window.
   */
  async sendCustomerAcknowledgement(params: CustomerNotificationParams): Promise<WhatsAppSendResult> {
    if (!this.config.isConfigured) {
      return {
        status: 'NOT_CONFIGURED',
        note: 'Meta WhatsApp Cloud API is awaiting official Meta Business onboarding credentials.',
      };
    }

    const recipientPhone = normalizePhoneNumber(params.customerPhone);
    if (!recipientPhone || recipientPhone.length < 10) {
      return {
        status: 'FAILED',
        error: `Invalid customer recipient phone number: ${params.customerPhone}`,
      };
    }

    const { phoneNumberId, accessToken } = this.config;
    const url = `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${phoneNumberId}/messages`;

    const templateName = process.env.WHATSAPP_TEMPLATE_ACKNOWLEDGEMENT;

    // Payload construction (Template vs Session Message)
    let messagePayload: any;
    if (templateName) {
      // Official Meta Approved Template payload
      messagePayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipientPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'en' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: params.customerName },
                { type: 'text', text: params.reference },
                { type: 'text', text: params.subject.slice(0, 60) },
              ],
            },
          ],
        },
      };
    } else {
      // Session/Text Message fallback
      const greeting =
        `Namaste ${params.customerName},\n\n` +
        `Thank you for contacting Krishna Electronics Order & Suppliers (Birendranagar, Surkhet).\n\n` +
        `Your ${params.isBooking ? 'service request' : 'enquiry'} regarding "${params.subject}" has been successfully logged.\n` +
        `🔖 *Reference ID:* ${params.reference}\n\n` +
        `Our technician will contact you shortly.\n` +
        `📞 Store Desk: 083-522006 | Birendranagar, Surkhet`;

      messagePayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipientPhone,
        type: 'text',
        text: { preview_url: false, body: greeting },
      };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      });

      const data = await response.json();
      if (!response.ok) {
        const errorMsg = data?.error?.message || `HTTP ${response.status} from Meta API`;
        console.error('[WhatsApp Cloud API] Outbound error:', data);
        return {
          status: 'FAILED',
          error: errorMsg,
        };
      }

      const messageId = data?.messages?.[0]?.id;
      return {
        status: 'SENT',
        messageId,
      };
    } catch (err: any) {
      console.error('[WhatsApp Cloud API] Network error:', err.message);
      return {
        status: 'FAILED',
        error: err.message,
      };
    }
  }

  /**
   * Verifies Meta Webhook verification handshake (hub.challenge).
   */
  verifyWebhookChallenge(mode: string | null, token: string | null, challenge: string | null): string | null {
    if (mode === 'subscribe' && token === this.config.verifyToken && challenge) {
      return challenge;
    }
    return null;
  }

  /**
   * Validates HMAC-SHA256 signature from Meta webhook requests using WHATSAPP_APP_SECRET.
   */
  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
    if (!this.config.appSecret) return false;
    if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false;

    const signature = signatureHeader.replace('sha256=', '');
    const expected = crypto
      .createHmac('sha256', this.config.appSecret)
      .update(rawBody)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
    } catch {
      return false;
    }
  }
}

/**
 * Singleton instance of MetaWhatsAppClient.
 */
export const whatsAppClient = new MetaWhatsAppClient();

/**
 * Checks whether WhatsApp Cloud API is configured in the environment.
 */
export function isWhatsAppConfigured(): boolean {
  return whatsAppClient.isReady();
}

/**
 * Sends a customer acknowledgement message.
 */
export async function sendCustomerAcknowledgement(params: CustomerNotificationParams): Promise<WhatsAppSendResult> {
  return whatsAppClient.sendCustomerAcknowledgement(params);
}

/**
 * Sends a raw text message via WhatsApp Cloud API.
 */
export async function sendWhatsAppTextMessage(
  recipientPhone: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const result = await whatsAppClient.sendCustomerAcknowledgement({
    customerPhone: recipientPhone,
    customerName: 'Valued Customer',
    reference: 'ACK',
    subject: text.slice(0, 50),
  });
  return {
    success: result.status === 'SENT',
    messageId: result.messageId,
    error: result.error,
  };
}

/**
 * Sends an approved template message via WhatsApp Cloud API.
 */
export async function sendWhatsAppTemplateMessage(
  recipientPhone: string,
  templateName: string,
  languageCode: string = 'en',
  components: any[] = []
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!whatsAppClient.isReady()) {
    return { success: false, error: 'WhatsApp Cloud API is not configured.' };
  }
  const config = getWhatsAppConfig();
  const phone = normalizePhoneNumber(recipientPhone);
  const url = `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${config.phoneNumberId}/messages`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data?.error?.message || `HTTP ${res.status}` };
    }
    return { success: true, messageId: data?.messages?.[0]?.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Documented Technical Strategy for WhatsApp Business App Coexistence:
 * - Number: 9858083951 currently runs on WhatsApp Business Mobile App.
 * - Under Meta's Coexistence program, SMBs can keep their mobile app for day-to-day chats
 *   while connecting Cloud API for automated notifications.
 * - Outbound notifications to the business use email (krishanelectronics2077@gmail.com)
 *   because a WhatsApp phone number cannot message itself via Cloud API.
 * - Customer acknowledgements are routed via Cloud API when credentials are provided.
 */
export const WHATSAPP_COEXISTENCE_SPECIFICATION = {
  businessNumber: '9858083951',
  mobileApplicationPreserved: true,
  coexistenceReady: true,
  businessNotificationChannel: 'EMAIL (krishanelectronics2077@gmail.com)',
  customerAcknowledgementChannel: 'META_WHATSAPP_CLOUD_API',
};
