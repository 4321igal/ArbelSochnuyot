#!/usr/bin/env node
/**
 * Seed Makes + VehicleModels from data/vehicles-catalog.json.
 * Idempotent: re-running skips existing slugs (matched by Make.slug and VehicleModel.slug within a make).
 *
 * Usage:
 *   node scripts/seed-makes-models.mjs           # apply changes
 *   node scripts/seed-makes-models.mjs --dry-run # show what would change without writing
 *
 * Requires:
 *   - amplify_outputs.json in the project root
 *   - Either Cognito admin credentials or apiKey auth available
 */

import { createRequire } from 'module';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';

const require = createRequire(import.meta.url);

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

const requestId = `seed-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

function log(level, msg, data = {}) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      requestId,
      level,
      message: msg,
      ...data,
    }),
  );
}

let outputs;
try {
  outputs = require('../amplify_outputs.json');
} catch (e) {
  log('ERROR', 'amplify_outputs.json not found. Run from ecommerce-amplify root.', { error: e.message });
  process.exit(1);
}

let catalog;
try {
  catalog = require('../data/vehicles-catalog.json');
} catch (e) {
  log('ERROR', 'data/vehicles-catalog.json not found', { error: e.message });
  process.exit(1);
}

Amplify.configure(outputs);
const client = generateClient({ authMode: 'apiKey' });

/**
 * Transliteration helper: produces a stable, URL-friendly slug from a Hebrew or
 * Latin string. Hebrew letters are mapped to approximate Latin equivalents.
 */
const HE_MAP = {
  א: 'a', ב: 'b', ג: 'g', ד: 'd', ה: 'h', ו: 'v', ז: 'z', ח: 'ch',
  ט: 't', י: 'y', כ: 'k', ך: 'k', ל: 'l', מ: 'm', ם: 'm', נ: 'n',
  ן: 'n', ס: 's', ע: 'a', פ: 'p', ף: 'p', צ: 'tz', ץ: 'tz', ק: 'q',
  ר: 'r', ש: 'sh', ת: 't',
  "'": '', '"': '', '׳': '', '״': '',
};

function toSlug(input) {
  const trimmed = String(input ?? '').trim().toLowerCase();
  const transliterated = Array.from(trimmed)
    .map((ch) => (HE_MAP[ch] !== undefined ? HE_MAP[ch] : ch))
    .join('');
  return transliterated
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function listAll(modelName) {
  const items = [];
  let nextToken;
  do {
    const { data, nextToken: nt } = await client.models[modelName].list({
      limit: 200,
      nextToken,
    });
    items.push(...(data ?? []));
    nextToken = nt ?? undefined;
  } while (nextToken);
  return items;
}

async function ensureMake(catalogMake, existingBySlug) {
  const existing = existingBySlug.get(catalogMake.slug);
  if (existing) {
    log('INFO', `Make exists: ${catalogMake.name}`, { slug: catalogMake.slug, id: existing.id });
    return { make: existing, created: false };
  }
  log('INFO', `Make ${dryRun ? 'would create' : 'creating'}: ${catalogMake.name}`, { slug: catalogMake.slug });
  if (dryRun) {
    return { make: { id: `dry-${catalogMake.slug}`, ...catalogMake }, created: true };
  }
  const { data, errors } = await client.models.Make.create({
    name: catalogMake.name,
    slug: catalogMake.slug,
    sortOrder: catalogMake.sortOrder ?? 0,
    isActive: true,
  });
  if (errors?.length || !data) {
    throw new Error(`Make create failed: ${errors?.[0]?.message ?? 'unknown error'}`);
  }
  return { make: data, created: true };
}

async function ensureModel(make, modelName, existingByKey) {
  const slug = toSlug(modelName);
  const key = `${make.id}::${slug}`;
  const existing = existingByKey.get(key);
  if (existing) {
    return { model: existing, created: false };
  }
  log('INFO', `Model ${dryRun ? 'would create' : 'creating'}: ${make.name} / ${modelName}`, { slug });
  if (dryRun) {
    return { model: { id: `dry-${slug}`, name: modelName, slug, makeId: make.id }, created: true };
  }
  const { data, errors } = await client.models.VehicleModel.create({
    makeId: make.id,
    name: modelName,
    slug,
    sortOrder: 0,
    isActive: true,
  });
  if (errors?.length || !data) {
    throw new Error(`VehicleModel create failed (${make.name}/${modelName}): ${errors?.[0]?.message ?? 'unknown'}`);
  }
  return { model: data, created: true };
}

async function main() {
  log('INFO', 'seed-makes-models started', { dryRun, requestId });

  const existingMakes = await listAll('Make');
  const makesBySlug = new Map(existingMakes.map((m) => [m.slug, m]));
  log('INFO', `Found ${existingMakes.length} existing makes`);

  const existingModels = await listAll('VehicleModel');
  const modelsByKey = new Map(existingModels.map((m) => [`${m.makeId}::${m.slug}`, m]));
  log('INFO', `Found ${existingModels.length} existing vehicle models`);

  let makesCreated = 0;
  let modelsCreated = 0;
  const errors = [];

  for (const catalogMake of catalog.makes) {
    try {
      const { make, created } = await ensureMake(catalogMake, makesBySlug);
      if (created) makesCreated++;

      for (const modelName of catalogMake.models ?? []) {
        try {
          const { created: mCreated } = await ensureModel(make, modelName, modelsByKey);
          if (mCreated) modelsCreated++;
        } catch (e) {
          errors.push({ scope: `${catalogMake.name}/${modelName}`, error: e.message });
          log('ERROR', 'Model seed failed', { make: catalogMake.name, model: modelName, error: e.message });
        }
      }
    } catch (e) {
      errors.push({ scope: catalogMake.name, error: e.message });
      log('ERROR', 'Make seed failed', { make: catalogMake.name, error: e.message });
    }
  }

  console.log('\n--- Summary ---');
  console.log(`  Makes ${dryRun ? 'would create' : 'created'}: ${makesCreated}`);
  console.log(`  Models ${dryRun ? 'would create' : 'created'}: ${modelsCreated}`);
  console.log(`  Errors: ${errors.length}`);
  if (errors.length) {
    console.log('\n  Error details:');
    errors.forEach((e) => console.log(`    [${e.scope}] ${e.error}`));
  }

  log('INFO', 'seed-makes-models finished', { makesCreated, modelsCreated, errors: errors.length });
}

main().catch((err) => {
  log('ERROR', 'seed-makes-models failed', { error: err.message, stack: err.stack });
  process.exit(1);
});
