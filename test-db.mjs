#!/usr/bin/env node

// Simple DB connection test via the Next.js API route at /api/db
// Usage:
//  - Ensure your app is running: npm run dev (or have a deployed URL)
//  - Optionally set BASE_URL to override the default http://localhost:3000
//  - Run: npm run test:db

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ENDPOINT = '/api/db';
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 10000);

async function main() {
  const url = new URL(ENDPOINT, BASE_URL).toString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // Node 18+ has global fetch; Next.js projects typically run on Node >=18
    const res = await fetch(url, { signal: controller.signal, headers: { 'Accept': 'application/json' } });

    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { /* ignore */ }

    if (!res.ok) {
      console.error(`[test:db] Request failed with status ${res.status} ${res.statusText}`);
      if (text) console.error(`[test:db] Response: ${text}`);
      console.error(`Hint: Is your app running at ${BASE_URL}? Try: npm run dev`);
      process.exit(1);
    }

    // Expecting the API to return { ok: true, ... }
    if (!json || json.ok !== true) {
      console.error('[test:db] API responded but ok !== true');
      if (json) {
        console.error('[test:db] JSON:', JSON.stringify(json, null, 2));
      } else {
        console.error('[test:db] Raw response:', text);
      }
      process.exit(1);
    }

    // Success output (show key connection fields if present)
    const { driver, host, name, readyState } = json;
    console.log('[test:db] ✅ Database connection OK');
    if (driver) console.log(`  driver: ${driver}`);
    if (host) console.log(`  host: ${host}`);
    if (name) console.log(`  name: ${name}`);
    if (readyState !== undefined) console.log(`  readyState: ${readyState}`);
    process.exit(0);
  } catch (err) {
    if (err && err.name === 'AbortError') {
      console.error(`[test:db] Request to ${BASE_URL}${ENDPOINT} timed out after ${TIMEOUT_MS}ms`);
    } else {
      console.error('[test:db] Error:', err?.message || err);
    }
    console.error(`Hint: Ensure the app is running and the API route /api/db is available. Base URL: ${BASE_URL}`);
    process.exit(1);
  } finally {
    clearTimeout(timeout);
  }
}

main();
