#!/usr/bin/env node
/**
 * Reset Products – LOCAL/DEV only. Deletes all product-related data in correct order.
 * Preserves schema (no table drops). Safe: dry-run by default, confirmation prompt.
 *
 * Usage:
 *   node scripts/reset-products.mjs [--dry-run] [--yes] [--limit N] [--verbose] [--categories]
 *
 * Requires: NODE_ENV !== 'production', amplify_outputs.json, and (for deletes) Admin auth or API key.
 */

import { createRequire } from 'module';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';

const require = createRequire(import.meta.url);

// Parse flags
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const skipConfirm = args.includes('--yes');
const verbose = args.includes('--verbose');
const withCategories = args.includes('--categories');
const limitIdx = args.indexOf('--limit');
const limit = limitIdx >= 0 && args[limitIdx + 1] ? parseInt(args[limitIdx + 1], 10) : null;

const requestId = `reset-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

function log(level, msg, data = {}) {
  const line = {
    timestamp: new Date().toISOString(),
    requestId,
    level,
    message: msg,
    ...data,
  };
  console.log(JSON.stringify(line));
  if (verbose && level === 'DEBUG') {
    console.error('[verbose]', msg, data);
  }
}

function logSummary(counts) {
  log('INFO', 'Reset summary', { action: dryRun ? 'dry_run' : 'completed', counts });
  console.log('\n--- Summary ---');
  Object.entries(counts).forEach(([table, count]) => {
    console.log(`  ${table}: ${count} ${dryRun ? '(would delete)' : 'deleted'}`);
  });
}

// Block in production
if (process.env.NODE_ENV === 'production') {
  log('ERROR', 'reset-products is disabled in production', { NODE_ENV: process.env.NODE_ENV });
  process.exit(1);
}

// Load Amplify config
let outputs;
try {
  outputs = require('../amplify_outputs.json');
} catch (e) {
  log('ERROR', 'amplify_outputs.json not found. Run from ecommerce-amplify root.', { error: e.message });
  process.exit(1);
}

Amplify.configure(outputs);
const client = generateClient();

/**
 * List all items with pagination; return array of ids (and full items if verbose).
 */
async function listAll(modelName, options = {}) {
  const maxItems = limit ?? 1e6;
  const items = [];
  let nextToken = undefined;
  const start = Date.now();
  log('DEBUG', `listAll ${modelName} start`, { model: modelName });

  do {
    const result = await client.models[modelName].list({
      limit: Math.min(100, maxItems - items.length),
      nextToken,
    });
    const data = result.data ?? [];
    items.push(...data);
    nextToken = result.nextToken ?? undefined;
  } while (nextToken && items.length < maxItems);

  log('DEBUG', `listAll ${modelName} done`, { model: modelName, count: items.length, durationMs: Date.now() - start });
  return items;
}

/**
 * Delete a single item by id.
 */
async function deleteOne(modelName, id) {
  await client.models[modelName].delete({ id });
}

/**
 * Delete all items for a model (with optional limit). Returns deleted count.
 */
async function deleteAllForModel(modelName, options = {}) {
  const items = await listAll(modelName, options);
  const toDelete = limit != null ? items.slice(0, limit) : items;
  let deleted = 0;
  const start = Date.now();

  for (const item of toDelete) {
    const id = item.id;
    if (!dryRun) {
      try {
        await deleteOne(modelName, id);
        deleted++;
      } catch (e) {
        log('ERROR', `delete failed ${modelName} ${id}`, { error: e.message, model: modelName, id });
      }
    } else {
      deleted++;
    }
  }

  log('INFO', `${modelName} ${dryRun ? 'dry-run' : 'delete'}`, {
    model: modelName,
    count: deleted,
    durationMs: Date.now() - start,
  });
  return deleted;
}

async function main() {
  log('INFO', 'reset-products started', {
    dryRun,
    skipConfirm,
    limit: limit ?? 'none',
    withCategories,
    requestId,
  });

  if (!dryRun && !skipConfirm) {
    console.log('\nThis will PERMANENTLY delete product-related data (ProductSearchMeta, CartItem, OrderItem, Product' + (withCategories ? ', Category' : '') + ').');
    console.log('Run with --dry-run to see what would be deleted. Run with --yes to skip this prompt.\n');
    const readline = await import('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise((resolve) => {
      rl.question('Type "yes" to continue: ', resolve);
    });
    rl.close();
    if (answer?.toLowerCase() !== 'yes') {
      log('INFO', 'Aborted by user');
      process.exit(0);
    }
  }

  const counts = {};
  const order = ['ProductSearchMeta', 'CartItem', 'OrderItem', 'Product'];
  if (withCategories) order.push('Category');

  for (const model of order) {
    try {
      counts[model] = await deleteAllForModel(model);
    } catch (e) {
      log('ERROR', `Failed for model ${model}`, { error: e.message });
      counts[model] = 0;
    }
  }

  logSummary(counts);
  log('INFO', 'reset-products finished', { requestId, durationMs: 0 });
}

main().catch((err) => {
  log('ERROR', 'reset-products failed', { error: err.message, stack: err.stack });
  process.exit(1);
});
