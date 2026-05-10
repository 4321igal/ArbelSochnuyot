import type { Schema } from '../../data/resource';
import { Logger } from '../shared/logger';
import { createDynamoDBClient, putInquiry, type Inquiry } from '../shared/dynamodb';

const logger = new Logger('createInquiry');
const dynamodb = createDynamoDBClient();

const ISRAELI_PHONE_REGEX = /^(\+972|0)([23489]|5[0-9]|7[0-9])[-]?\d{7}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALLOWED_CONTACT_METHODS = ['PHONE', 'EMAIL', 'WHATSAPP'] as const;
const ALLOWED_SOURCES = [
  'VEHICLE_PAGE',
  'HOMEPAGE_HERO',
  'CONTACT_PAGE',
  'COMPARE_PAGE',
] as const;

export const handler: Schema['createInquiryMutation']['functionHandler'] = async (event) => {
  const startTime = Date.now();
  const userId = event.identity && 'sub' in event.identity ? event.identity.sub : undefined;

  const args = event.arguments;

  if (!args.fullName || args.fullName.trim().length < 2) {
    throw new Error('שם מלא חסר או קצר מדי');
  }

  const normalizedPhone = (args.phone || '').replace(/\s+/g, '');
  if (!ISRAELI_PHONE_REGEX.test(normalizedPhone)) {
    throw new Error('מספר טלפון לא תקין');
  }

  if (args.email && !EMAIL_REGEX.test(args.email)) {
    throw new Error('כתובת אימייל לא תקינה');
  }

  const contactMethod =
    args.preferredContactMethod &&
    (ALLOWED_CONTACT_METHODS as readonly string[]).includes(args.preferredContactMethod)
      ? args.preferredContactMethod
      : 'PHONE';

  const source =
    args.source && (ALLOWED_SOURCES as readonly string[]).includes(args.source)
      ? args.source
      : 'CONTACT_PAGE';

  const now = new Date().toISOString();
  const inquiry: Inquiry = {
    id: `inq-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
    vehicleId: args.vehicleId || undefined,
    userId: userId || undefined,
    fullName: args.fullName.trim(),
    phone: normalizedPhone,
    email: args.email || undefined,
    preferredContactMethod: contactMethod,
    message: args.message || undefined,
    interestedInTestDrive: args.interestedInTestDrive ?? false,
    interestedInFinancing: args.interestedInFinancing ?? false,
    tradeInDescription: args.tradeInDescription || undefined,
    status: 'NEW',
    source,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await putInquiry(dynamodb, inquiry);

    logger.info('Inquiry created', {
      inquiryId: inquiry.id,
      vehicleId: inquiry.vehicleId,
      source,
      duration: Date.now() - startTime,
    });

    return inquiry as unknown as Schema['createInquiryMutation']['returnType'];
  } catch (error) {
    logger.error('Failed to create inquiry', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('יצירת הפנייה נכשלה. אנא נסה שוב.');
  }
};
