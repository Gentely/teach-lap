/**
 * dev-server.mjs — Zero-dependency local development server
 * ============================================================================
 * Serves the static frontend and routes POST /api/generate to the same
 * serverless handler used in production, so the app can be tested locally
 * without the Vercel CLI:
 *
 *   GEMINI_API_KEY=... node dev-server.mjs        # http://localhost:3000
 *
 * In production Vercel serves api/generate.js automatically.
 * ========================================================================== */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

import handler from './api/generate.js';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = process.env.PORT || 3000;

// Load .env automatically (no dependencies) — real environment variables win.
try {
  const envFile = await readFile(join(ROOT, '.env'), 'utf8');
  for (const line of envFile.split('\n')) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
} catch {
  /* no .env file — rely on real environment */
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.sql': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.md': 'text/plain; charset=utf-8',
};

/** Minimal adapter so the Vercel-style handler can run on plain node:http. */
function wrapRes(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (obj) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(obj));
    return res;
  };
  return res;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // ---- API route (same handler as the Vercel serverless function) ----
  if (url.pathname === '/api/generate') {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    let body = raw;
    if (raw && (req.headers['content-type'] || '').includes('application/json')) {
      try {
        body = JSON.parse(raw);
      } catch {
        body = raw; // handler reports INVALID_JSON
      }
    }
    req.body = body;
    return handler(req, wrapRes(res));
  }

  // ---- Static files ----
  try {
    const requested = url.pathname === '/' ? '/index.html' : url.pathname;
    const filePath = normalize(join(ROOT, requested));
    if (!filePath.startsWith(ROOT)) {
      res.statusCode = 403;
      return res.end('Forbidden');
    }
    const data = await readFile(filePath);
    res.setHeader('Content-Type', MIME[extname(filePath)] || 'application/octet-stream');
    res.statusCode = 200;
    res.end(data);
  } catch {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Not found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✔ SABRATHA ELT Tech-Assistant dev server → http://localhost:${PORT}`);
  console.log(`  GEMINI_API_KEY ${process.env.GEMINI_API_KEY ? 'detected' : 'NOT set (generation will return MISSING_API_KEY)'}`);
});
