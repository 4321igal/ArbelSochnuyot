import type { Schema } from '../../data/resource';
import { Logger } from '../shared/logger';
import { getSecret } from '../shared/secrets';
import {
  createDynamoDBClient,
  getVehicle,
  getMake,
  upsertVehicleSearchMeta,
  type Vehicle,
  type Make,
} from '../shared/dynamodb';

interface AIEnrichmentResult {
  aiSummary: string;
  aiHighlights: string[];
  aiSEO: string;
  confidence: number;
}

const logger = new Logger('aiEnrichVehicle');
const dynamodb = createDynamoDBClient();

export const handler: Schema['enrichVehicleMutation']['functionHandler'] = async (event) => {
  const startTime = Date.now();
  const { vehicleId } = event.arguments;

  logger.info('Starting vehicle enrichment', { vehicleId });

  const vehicle = await getVehicle(dynamodb, vehicleId);
  if (!vehicle) {
    logger.error('Vehicle not found', { vehicleId });
    throw new Error(`Vehicle not found: ${vehicleId}`);
  }

  const make = vehicle.makeId ? await getMake(dynamodb, vehicle.makeId) : null;

  const apiKey = await getSecret('amplify/arbel/OPENAI_API_KEY');
  const enrichment = await enrichWithOpenAI(vehicle, make, apiKey);

  if (!enrichment) {
    throw new Error('AI enrichment failed');
  }

  const now = new Date().toISOString();
  const meta = await upsertVehicleSearchMeta(dynamodb, {
    id: `meta-${vehicleId}`,
    vehicleId,
    aiSummary: enrichment.aiSummary,
    aiHighlights: enrichment.aiHighlights,
    aiSEO: enrichment.aiSEO,
    confidence: enrichment.confidence,
    language: process.env.TARGET_LANGUAGE || 'he',
    lastEnrichedAt: now,
    enrichmentVersion: 1,
    updatedAt: now,
  });

  logger.info('Vehicle enrichment saved', {
    vehicleId,
    confidence: enrichment.confidence,
    duration: Date.now() - startTime,
  });

  return meta as unknown as Schema['enrichVehicleMutation']['returnType'];
};

async function enrichWithOpenAI(
  vehicle: Vehicle,
  make: Make | null,
  apiKey: string,
): Promise<AIEnrichmentResult | null> {
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const systemPrompt = `אתה כותב תוכן מקצועי לסוכנות רכב בעברית. המטרה שלך: ליצור תיאור שיווקי מדויק לרכב על סמך הנתונים שניתנו לך.

חוקים נוקשים:
1. ענה אך ורק בעברית
2. אל תמציא מידע שלא ניתן לך — אם נתון חסר, פשוט אל תזכיר אותו
3. שמור על טון מקצועי ועובדתי, ללא הגזמות
4. החזר אך ורק JSON תקני בפורמט המדויק

פורמט פלט (JSON בלבד):
{
  "aiSummary": "תיאור שיווקי של 2-3 משפטים שמדגיש את החוזקות של הרכב",
  "aiHighlights": ["נקודת חוזק 1", "נקודת חוזק 2", ...],  // 3-6 בולטים קצרים
  "aiSEO": "תיאור SEO ל-meta description, 150-160 תווים בדיוק",
  "confidence": 0.0-1.0
}

ציון ביטחון:
- 0.9-1.0: מידע מלא (יצרן, דגם, שנה, ק"מ, מאפיינים, תיאור, פיצ'רים)
- 0.7-0.9: מידע טוב (רוב השדות מולאו)
- 0.5-0.7: מידע בסיסי (יצרן, דגם, שנה, מחיר)
- מתחת ל-0.5: מידע חסר`;

  const userPrompt = buildVehiclePrompt(vehicle, make);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      logger.error('OpenAI API error', {
        status: response.status,
        error: await response.text(),
      });
      return null;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = safeParseJson<AIEnrichmentResult>(content);
    if (!parsed || !validate(parsed)) {
      logger.error('Invalid AI response', { content });
      return null;
    }
    return parsed;
  } catch (error) {
    logger.error('OpenAI request failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

function buildVehiclePrompt(vehicle: Vehicle, make: Make | null): string {
  const parts: string[] = [];
  if (make?.name) parts.push(`יצרן: ${make.name}`);
  parts.push(`דגם: ${vehicle.modelName}`);
  if (vehicle.trim) parts.push(`גרסה: ${vehicle.trim}`);
  parts.push(`שנה: ${vehicle.year}`);
  parts.push(`מחיר: ₪${vehicle.price.toLocaleString('he-IL')}`);
  if (vehicle.mileage != null) parts.push(`קילומטראז': ${vehicle.mileage.toLocaleString('he-IL')} ק"מ`);
  if (vehicle.transmission) parts.push(`תיבת הילוכים: ${vehicle.transmission}`);
  if (vehicle.fuelType) parts.push(`סוג דלק: ${vehicle.fuelType}`);
  if (vehicle.enginePower) parts.push(`כוח: ${vehicle.enginePower} כ"ס`);
  if (vehicle.engineCapacity) parts.push(`נפח מנוע: ${vehicle.engineCapacity} סמ"ק`);
  if (vehicle.driveType) parts.push(`הנעה: ${vehicle.driveType}`);
  if (vehicle.color) parts.push(`צבע: ${vehicle.color}`);
  if (vehicle.hand != null) parts.push(`יד: ${vehicle.hand}`);
  if (vehicle.condition) parts.push(`מצב: ${vehicle.condition}`);
  if (vehicle.features?.length) parts.push(`אבזור: ${vehicle.features.join(', ')}`);
  if (vehicle.description) parts.push(`תיאור קיים: ${vehicle.description}`);
  return `העשר את הרכב הזה:\n\n${parts.join('\n')}`;
}

function safeParseJson<T>(json: string): T | null {
  try {
    let clean = json.trim();
    if (clean.startsWith('```json')) clean = clean.slice(7);
    if (clean.startsWith('```')) clean = clean.slice(3);
    if (clean.endsWith('```')) clean = clean.slice(0, -3);
    return JSON.parse(clean.trim()) as T;
  } catch {
    return null;
  }
}

function validate(r: unknown): r is AIEnrichmentResult {
  if (!r || typeof r !== 'object') return false;
  const o = r as Record<string, unknown>;
  return (
    typeof o.aiSummary === 'string' &&
    Array.isArray(o.aiHighlights) &&
    o.aiHighlights.every((h) => typeof h === 'string') &&
    typeof o.aiSEO === 'string' &&
    typeof o.confidence === 'number' &&
    o.confidence >= 0 &&
    o.confidence <= 1
  );
}
