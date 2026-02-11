import type { Schema } from '../../data/resource';
import { Logger } from '../shared/logger';
import { getSecret } from '../shared/secrets';
import { createDynamoDBClient, getProduct, upsertProductSearchMeta } from '../shared/dynamodb';

/**
 * AI Product Enrichment Handler
 * 
 * Workflow:
 * 1. Receive productId
 * 2. Fetch product from DynamoDB
 * 3. Send to OpenAI with structured prompt
 * 4. Parse JSON response
 * 5. Save to ProductSearchMeta table
 */

// Types
interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  brand?: string;
  categoryId: string;
  attributes?: Record<string, unknown>;
  tags?: string[];
}

interface AIEnrichmentResult {
  aiSummary: string;
  aiTags: string[];
  aiSEO: string;
  confidence: number;
}

// Initialize
const logger = new Logger('aiEnrichProduct');
const dynamodb = createDynamoDBClient();

export const handler: Schema['enrichProductMutation']['functionHandler'] = async (event) => {
  const startTime = Date.now();
  const { productId } = event.arguments;

  logger.info('Starting product enrichment', { productId });

  try {
    // Step 1: Fetch product
    const product = await getProduct(dynamodb, productId);
    
    if (!product) {
      logger.error('Product not found', { productId });
      throw new Error(`Product not found: ${productId}`);
    }

    logger.info('Product fetched', { 
      productId, 
      title: product.title,
      hasDescription: !!product.description,
    });

    // Step 2: Get OpenAI API key from Secrets Manager
    const apiKey = await getSecret('amplify/ecommerce/OPENAI_API_KEY');

    // Step 3: Call OpenAI
    const enrichment = await enrichWithOpenAI(product, apiKey);

    if (!enrichment) {
      logger.error('Failed to enrich product', { productId });
      throw new Error('AI enrichment failed');
    }

    logger.info('AI enrichment complete', { 
      productId,
      confidence: enrichment.confidence,
      tagsCount: enrichment.aiTags.length,
    });

    // Step 4: Save to ProductSearchMeta
    const searchMeta = await upsertProductSearchMeta(dynamodb, {
      id: `meta-${productId}`,
      productId,
      aiSummary: enrichment.aiSummary,
      aiTags: enrichment.aiTags,
      aiSEO: enrichment.aiSEO,
      confidence: enrichment.confidence,
      language: process.env.TARGET_LANGUAGE || 'he',
      lastEnrichedAt: new Date().toISOString(),
      enrichmentVersion: 1,
      updatedAt: new Date().toISOString(),
    });

    const duration = Date.now() - startTime;
    logger.info('Product enrichment saved', { 
      productId, 
      searchMetaId: searchMeta.id,
      duration,
    });

    return searchMeta;

  } catch (error) {
    logger.error('Enrichment failed', { 
      productId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Call OpenAI API for product enrichment
 */
async function enrichWithOpenAI(
  product: Product, 
  apiKey: string
): Promise<AIEnrichmentResult | null> {
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const language = process.env.TARGET_LANGUAGE || 'he';

  // Build the prompt
  const systemPrompt = buildSystemPrompt(language);
  const userPrompt = buildUserPrompt(product);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
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
      const errorText = await response.text();
      logger.error('OpenAI API error', { 
        status: response.status, 
        error: errorText,
      });
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      logger.error('Empty response from OpenAI');
      return null;
    }

    const result = safeParseJson<AIEnrichmentResult>(content);
    
    if (!result || !validateEnrichmentResult(result)) {
      logger.error('Invalid AI response structure', { content });
      return null;
    }

    return result;

  } catch (error) {
    logger.error('OpenAI request failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * System prompt for AI enrichment
 */
function buildSystemPrompt(language: string): string {
  const languageName = language === 'he' ? 'Hebrew (עברית)' : 'English';
  
  return `You are an e-commerce product content specialist. Your task is to enrich product data for search and SEO optimization.

STRICT RULES:
1. Output language: ${languageName}
2. Do NOT invent or assume information that is not provided
3. If data is missing, explicitly state "לא צוין" (Not specified) in Hebrew
4. Be factual and concise
5. Return ONLY valid JSON in the exact format specified

OUTPUT FORMAT (JSON only):
{
  "aiSummary": "2-3 sentence product summary highlighting key features and benefits",
  "aiTags": ["tag1", "tag2", ...], // 5-10 relevant search tags
  "aiSEO": "SEO-optimized meta description, 150-160 characters",
  "confidence": 0.0-1.0 // confidence score based on input data quality
}

CONFIDENCE SCORING:
- 0.9-1.0: Complete product data (title, description, brand, attributes)
- 0.7-0.9: Good data (title, description, some attributes)
- 0.5-0.7: Basic data (title, price only)
- 0.3-0.5: Minimal data (title only)
- 0.0-0.3: Insufficient data`;
}

/**
 * User prompt with product data
 */
function buildUserPrompt(product: Product): string {
  const parts = [
    `Product Title: ${product.title}`,
    `Price: ₪${product.price}`,
  ];

  if (product.description) {
    parts.push(`Description: ${product.description}`);
  }

  if (product.brand) {
    parts.push(`Brand: ${product.brand}`);
  }

  if (product.attributes && Object.keys(product.attributes).length > 0) {
    parts.push(`Attributes: ${JSON.stringify(product.attributes)}`);
  }

  if (product.tags && product.tags.length > 0) {
    parts.push(`Existing Tags: ${product.tags.join(', ')}`);
  }

  return `Enrich this product:\n\n${parts.join('\n')}`;
}

/**
 * Safe JSON parse with error handling
 */
function safeParseJson<T>(json: string): T | null {
  try {
    // Handle potential markdown code blocks from AI
    let cleanJson = json.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.slice(7);
    }
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.slice(3);
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.slice(0, -3);
    }
    return JSON.parse(cleanJson.trim()) as T;
  } catch (error) {
    logger.error('JSON parse error', { 
      error: error instanceof Error ? error.message : 'Unknown',
      input: json.substring(0, 200),
    });
    return null;
  }
}

/**
 * Validate enrichment result structure
 */
function validateEnrichmentResult(result: unknown): result is AIEnrichmentResult {
  if (!result || typeof result !== 'object') return false;
  
  const r = result as Record<string, unknown>;
  
  return (
    typeof r.aiSummary === 'string' &&
    Array.isArray(r.aiTags) &&
    r.aiTags.every((tag: unknown) => typeof tag === 'string') &&
    typeof r.aiSEO === 'string' &&
    typeof r.confidence === 'number' &&
    r.confidence >= 0 &&
    r.confidence <= 1
  );
}
