#!/usr/bin/env node

// DB connection test utility
// It first tries the Next.js API route at /api/db. If that is unreachable or fails,
// it falls back to a direct MongoDB connection using the official driver.
// Usage:
//  - Optionally set BASE_URL to override the default http://localhost:3000
//  - Optionally set TIMEOUT_MS (default 10000)
//  - Run: npm run test:db

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ENDPOINT = '/api/db';
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS) || 10000;

async function tryApiHealthCheck() {
  const url = new URL(ENDPOINT, BASE_URL).toString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { /* ignore parse error, will handle below */ }

    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status} ${res.statusText}${text ? `\nResponse: ${text}` : ''}`);
    }

    if (!json || json.ok !== true) {
      throw new Error(`API responded but ok !== true. ${json ? `JSON: ${JSON.stringify(json)}` : `Raw: ${text}`}`);
    }

    const { driver, host, name, readyState } = json;
    console.log('[test:db] ✅ API health-check OK');
    if (driver) console.log(`  driver: ${driver}`);
    if (host) console.log(`  host: ${host}`);
    if (name) console.log(`  name: ${name}`);
    if (readyState !== undefined) console.log(`  readyState: ${readyState}`);
    clearTimeout(timeout);
    return true;
  } catch (err) {
    clearTimeout(timeout);
    const msg = err?.message || String(err);
    console.warn(`[test:db] ⚠️ API check failed: ${msg}`);
    console.warn(`[test:db] Hint: Is your app running at ${BASE_URL}? Try: npm run dev`);
    return false;
  }
}

async function loadMongoUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  // Attempt to load from .env without adding a dependency
  try {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        // remove optional surrounding quotes
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (key === 'MONGODB_URI') return value;
      }
    }
  } catch { /* ignore */ }
  return undefined;
}

async function tryDirectMongoPing() {
  const uri = await loadMongoUri();
  if (!uri) {
    console.error('[test:db] No MONGODB_URI found in environment or .env');
    console.error(`[test:db] Add MONGODB_URI to ${process.cwd()}/.env and re-run.`);
    return false;
  }
  try {
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: TIMEOUT_MS });
    const start = Date.now();
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    const duration = Date.now() - start;
    const topology = client.topology?.description;
    const hosts = topology ? Object.keys(topology.servers || {}) : undefined;
    console.log('[test:db] ✅ Direct MongoDB ping OK');
    if (hosts && hosts.length) console.log(`  hosts: ${hosts.join(', ')}`);
    console.log(`  time: ${duration}ms`);
    await client.close();
    return true;
  } catch (err) {
    console.error('[test:db] ❌ Direct MongoDB ping failed:', err?.message || err);
    console.error('[test:db] Check your MONGODB_URI, credentials, and Atlas IP Access List.');
    return false;
  }
}

async function main() {
  const apiOk = await tryApiHealthCheck();
  if (apiOk) process.exit(0);
  // Fall back to direct connection
  const directOk = await tryDirectMongoPing();
  process.exit(directOk ? 0 : 1);
}

main();
