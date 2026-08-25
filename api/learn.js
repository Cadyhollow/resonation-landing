'use strict';

/*
 * /learn — the client Learning Center, behind a real server-side gate.
 *
 * Why this is a function and not an HTML file: anything sitting in this repo as a
 * plain .html file is public. A gate written in browser JavaScript can be read —
 * and walked straight past — by anyone who opens "view source". So the access
 * code lives in a Vercel environment variable, the check happens here on the
 * server, and the unlocked page is never sent to a browser that has not passed
 * it.
 *
 * The flow:
 *   GET  /learn  ->  valid cookie?  yes: the Learning Center.  no: the sign-in card.
 *   POST /learn  ->  code matches?  yes: set the cookie, redirect back to GET.
 *                                    no: the sign-in card again, with the error shown.
 *
 * Environment variables (set these in Vercel -> Project -> Settings -> Environment
 * Variables, for Production and Preview):
 *
 *   LEARN_ACCESS_CODE   REQUIRED. The one code handed out to every client.
 *                       If it is missing, this page refuses everyone — it never
 *                       falls back to being open.
 *   LEARN_COOKIE_SECRET Optional. Signs the "you're signed in" cookie. Left unset,
 *                       the access code signs it, which means changing the code
 *                       also signs everyone out — usually what you want.
 */

const crypto = require('crypto');
const page = require('./_learn-page.js');

const COOKIE_NAME = 'reso_learn';
const COOKIE_VERSION = 'v1';
const SESSION_SECONDS = 7 * 24 * 60 * 60; // a week, then clients sign in again
const MAX_BODY_BYTES = 4096;

const WRONG_CODE = 'That code didn’t match. Try again, or reach us above.';
const NOT_CONFIGURED =
  'Sign-in isn’t available right now. Please call or email us above and we’ll get you straight in.';

/** The shared access code, or null if it has not been configured. */
function accessCode() {
  const raw = process.env.LEARN_ACCESS_CODE;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
}

// Trimmed, so a stray space pasted into (or later cleaned out of) the Vercel
// setting cannot invalidate everyone's session for no reason.
function signingKey() {
  const explicit = process.env.LEARN_COOKIE_SECRET;
  if (typeof explicit === 'string' && explicit.trim()) return explicit.trim();
  return accessCode() || '';
}

/** Compare two secrets without leaking, through timing, how much of one matched. */
function sameSecret(a, b) {
  const ha = crypto.createHash('sha256').update(String(a), 'utf8').digest();
  const hb = crypto.createHash('sha256').update(String(b), 'utf8').digest();
  return crypto.timingSafeEqual(ha, hb);
}

function sign(expiresAt) {
  return crypto
    .createHmac('sha256', signingKey())
    .update(COOKIE_VERSION + '|' + expiresAt, 'utf8')
    .digest('base64url');
}

function readCookie(req, name) {
  if (req.cookies && typeof req.cookies[name] === 'string') return req.cookies[name];
  const header = req.headers && req.headers.cookie;
  if (!header) return null;
  const parts = String(header).split(';');
  for (let i = 0; i < parts.length; i++) {
    const eq = parts[i].indexOf('=');
    if (eq === -1) continue;
    if (parts[i].slice(0, eq).trim() === name) {
      return decodeURIComponent(parts[i].slice(eq + 1).trim());
    }
  }
  return null;
}

/*
 * The cookie carries no secret of its own — just an expiry and a signature over
 * it. Without the signing key a visitor cannot forge one, and cannot extend the
 * expiry on the one they have.
 */
function hasValidSession(req) {
  if (!accessCode()) return false;
  const raw = readCookie(req, COOKIE_NAME);
  if (!raw) return false;

  const parts = raw.split('.');
  if (parts.length !== 3 || parts[0] !== COOKIE_VERSION) return false;

  const expiresAt = Number(parts[1]);
  if (!Number.isFinite(expiresAt) || expiresAt * 1000 <= Date.now()) return false;

  return sameSecret(parts[2], sign(expiresAt));
}

/*
 * Vercel usually hands us a parsed req.body. The raw read is the fallback for
 * when it does not — a plain form post should not depend on that helper.
 */
async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;

  let raw = typeof req.body === 'string' ? req.body : null;
  if (raw === null) {
    raw = await new Promise((resolve, reject) => {
      let buf = '';
      req.on('data', (chunk) => {
        buf += chunk;
        if (buf.length > MAX_BODY_BYTES) {
          buf = buf.slice(0, MAX_BODY_BYTES);
          req.destroy();
        }
      });
      req.on('end', () => resolve(buf));
      req.on('error', reject);
    }).catch(() => '');
  }

  const contentType = String((req.headers && req.headers['content-type']) || '');
  if (contentType.indexOf('application/json') !== -1) {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (err) {
      return {};
    }
  }

  const fields = {};
  new URLSearchParams(raw).forEach((value, key) => {
    fields[key] = value;
  });
  return fields;
}

/*
 * no-store keeps this page out of Vercel's edge cache and out of the browser's
 * back/forward cache, so an unlocked page cannot be replayed to someone who never
 * signed in. noindex keeps it out of search results.
 */
function setHeaders(res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

function send(req, res, status, html) {
  res.statusCode = status;
  if ((req.method || '').toUpperCase() === 'HEAD') return res.end();
  return res.end(html);
}

module.exports = async function handler(req, res) {
  const method = String(req.method || 'GET').toUpperCase();
  const code = accessCode();
  setHeaders(res);

  if (method === 'POST') {
    if (!code) {
      console.error('[learn] LEARN_ACCESS_CODE is not set — refusing every sign-in.');
      return send(req, res, 503, page.renderGate({ error: NOT_CONFIGURED }));
    }

    const body = await readBody(req);
    const submitted = String(body.code == null ? '' : body.code).trim();

    // Forgiving about case and stray spaces: this code gets read out over the
    // phone. Nothing else about the check is forgiving.
    if (submitted && sameSecret(submitted.toLowerCase(), code.toLowerCase())) {
      const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
      res.setHeader(
        'Set-Cookie',
        COOKIE_NAME + '=' + COOKIE_VERSION + '.' + expiresAt + '.' + sign(expiresAt) +
          '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=' + SESSION_SECONDS
      );
      // Redirect rather than render, so a refresh does not re-post the code.
      res.statusCode = 303;
      res.setHeader('Location', '/learn');
      return res.end();
    }

    return send(req, res, 401, page.renderGate({ error: WRONG_CODE }));
  }

  if (method !== 'GET' && method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD, POST');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.statusCode = 405;
    return res.end('Method not allowed');
  }

  if (!code) {
    console.error('[learn] LEARN_ACCESS_CODE is not set — the Learning Center stays locked.');
    return send(req, res, 503, page.renderGate({ error: NOT_CONFIGURED }));
  }

  if (hasValidSession(req)) return send(req, res, 200, page.renderApp());
  return send(req, res, 200, page.renderGate({ error: '' }));
};
