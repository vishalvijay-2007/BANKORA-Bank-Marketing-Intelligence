import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import { createServer as createViteServer } from 'vite';
import {
  BankRecord,
  UCI_REQUIRED_COLUMNS,
  ensureDatasetFile,
  parseCSVContent
} from './src/server/seedDataset.ts';
import { BankoraMLEngine, PredictionInput } from './src/server/mlEngine.ts';

const PORT = Number(process.env.PORT || 3000);
const app = express();

const JWT_SECRET = process.env.JWT_SECRET || 'bankora_jwt_access_secret_production_key_2026_secure';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'bankora_jwt_refresh_secret_production_key_2026_secure';

// Middlewares
app.use(cookieParser());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize SQLite database in /backend/bankora.db
const backendDir = path.resolve(process.cwd(), 'backend');
if (!fs.existsSync(backendDir)) {
  fs.mkdirSync(backendDir, { recursive: true });
}
const dbPath = path.join(backendDir, 'bankora.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    revoked INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS prediction_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_summary TEXT NOT NULL,
    input_json TEXT NOT NULL,
    prediction TEXT NOT NULL,
    label TEXT NOT NULL,
    probability REAL NOT NULL,
    confidence_tier TEXT NOT NULL,
    model_name TEXT NOT NULL,
    model_mode TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS dataset_meta (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    dataset_name TEXT NOT NULL,
    source_type TEXT NOT NULL,
    total_rows INTEGER NOT NULL,
    missing_values INTEGER NOT NULL,
    duplicate_rows INTEGER NOT NULL,
    uploaded_at TEXT NOT NULL
  );
`);

// Clean up any legacy demo accounts so authentication is strictly real user accounts
try {
  db.prepare("DELETE FROM users WHERE email IN ('admin@bankora.com', 'advisor@bankora.com')").run();
} catch {
  // Ignore if table does not exist yet
}

const defaultDatasetPath = path.resolve(process.cwd(), 'dataset', 'bank-marketing.csv');


let activeRecords: BankRecord[] = ensureDatasetFile(defaultDatasetPath);
let datasetMeta = {
  datasetName: 'UCI Bank Marketing Dataset (bank-full-sample.csv)',
  sourceType: 'uci_default' as 'uci_default' | 'custom_upload' | 'empty',
  totalRows: activeRecords.length,
  missingValues: activeRecords.reduce((acc, r) => {
    let c = 0;
    if (r.job === 'unknown') c++;
    if (r.education === 'unknown') c++;
    if (r.contact === 'unknown') c++;
    if (r.poutcome === 'unknown') c++;
    return acc + c;
  }, 0),
  duplicateRows: 0,
  uploadedAt: new Date().toISOString()
};

const mlEngine = new BankoraMLEngine();
mlEngine.trainAllModels(activeRecords);

// Seed initial real predictions into SQLite if table is empty
const existingHistoryCount = (
  db.prepare('SELECT COUNT(*) as cnt FROM prediction_history').get() as { cnt: number }
).cnt;

if (existingHistoryCount === 0 && activeRecords.length >= 6) {
  const sampleIndices = [3, 14, 28, 45, 72, 108];
  const insertStmt = db.prepare(`
    INSERT INTO prediction_history (
      customer_summary, input_json, prediction, label, probability,
      confidence_tier, model_name, model_mode, recommended_action, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  sampleIndices.forEach((idx, offset) => {
    const rec = activeRecords[idx];
    if (!rec) return;
    const input: PredictionInput = {
      age: rec.age,
      job: rec.job,
      marital: rec.marital,
      education: rec.education,
      default: rec.default,
      balance: rec.balance,
      housing: rec.housing,
      loan: rec.loan,
      contact: rec.contact,
      day: rec.day,
      month: rec.month,
      duration: rec.duration,
      campaign: rec.campaign,
      pdays: rec.pdays,
      previous: rec.previous,
      poutcome: rec.poutcome,
      modelMode: 'pre_call'
    };
    const result = mlEngine.predictCustomer(input, activeRecords);
    const summary = `${rec.age}yo ${rec.job}, ${rec.marital}, €${rec.balance.toLocaleString()} bal`;
    const ts = new Date(Date.now() - (6 - offset) * 3600_000 * 3.5).toISOString();
    insertStmt.run(
      summary,
      JSON.stringify(input),
      result.prediction,
      result.label,
      result.probability,
      result.confidenceTier,
      result.modelName,
      result.modelMode,
      JSON.stringify(result.recommendedAction),
      ts
    );
  });
}

// Helper for computing column schema and statistical summary
function computeDatasetSummary(records: BankRecord[]) {
  if (records.length === 0) {
    return {
      hasDataset: false,
      meta: datasetMeta,
      rowCount: 0,
      columnCount: UCI_REQUIRED_COLUMNS.length,
      subscribedCount: 0,
      notSubscribedCount: 0,
      subscriptionRate: 0,
      columns: [],
      numericalStats: []
    };
  }

  const subscribedCount = records.filter(r => r.y === 'yes').length;
  const notSubscribedCount = records.length - subscribedCount;
  const subscriptionRate = Number(((subscribedCount / records.length) * 100).toFixed(2));

  const numericCols = ['age', 'balance', 'day', 'duration', 'campaign', 'pdays', 'previous'];
  const columns = UCI_REQUIRED_COLUMNS.map(col => {
    const isNumeric = numericCols.includes(col);
    let missingOrUnknown = 0;
    const uniqueVals = new Set<string | number>();

    for (const r of records) {
      const val = (r as unknown as Record<string, unknown>)[col];
      if (val === undefined || val === null || val === '' || val === 'unknown') {
        missingOrUnknown++;
      }
      uniqueVals.add(val as string | number);
    }

    return {
      name: col,
      type: col === 'y' ? 'Target (Binary)' : isNumeric ? 'Numerical (int64)' : 'Categorical (string)',
      missingCount: missingOrUnknown,
      missingPct: Number(((missingOrUnknown / records.length) * 100).toFixed(1)),
      uniqueCount: uniqueVals.size,
      sampleValues: Array.from(uniqueVals).slice(0, 4).join(', ')
    };
  });

  const numericalStats = numericCols.map(col => {
    const vals = records
      .map(r => Number((r as unknown as Record<string, unknown>)[col]) || 0)
      .sort((a, b) => a - b);
    const n = vals.length;
    const sum = vals.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    const std = Math.sqrt(variance);
    const min = vals[0];
    const q25 = vals[Math.floor(n * 0.25)];
    const median = vals[Math.floor(n * 0.5)];
    const q75 = vals[Math.floor(n * 0.75)];
    const max = vals[n - 1];

    return {
      column: col,
      count: n,
      mean: Number(mean.toFixed(2)),
      std: Number(std.toFixed(2)),
      min,
      q25,
      median,
      q75,
      max
    };
  });

  return {
    hasDataset: true,
    meta: datasetMeta,
    rowCount: records.length,
    columnCount: UCI_REQUIRED_COLUMNS.length,
    subscribedCount,
    notSubscribedCount,
    subscriptionRate,
    columns,
    numericalStats
  };
}

// ============================================================================
// REST API ENDPOINTS (Matching FastAPI Specification)
// ============================================================================

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'BANKORA Marketing Intelligence API (Auth Integrated)',
    version: '2.5.0',
    datasetLoaded: activeRecords.length > 0,
    recordCount: activeRecords.length,
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// AUTHENTICATION & SECURITY SYSTEM
// ============================================================================

interface TokenPayload {
  userId: number;
  email: string;
  role: string;
  fullName: string;
}

interface AttemptRecord {
  attempts: number;
  firstAttempt: number;
  blockedUntil: number;
}
const loginAttempts = new Map<string, AttemptRecord>();

function checkRateLimit(key: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const rec = loginAttempts.get(key);
  if (!rec) return { allowed: true };

  if (rec.blockedUntil > now) {
    return { allowed: false, retryAfterSec: Math.ceil((rec.blockedUntil - now) / 1000) };
  }

  // Reset window after 15 minutes
  if (now - rec.firstAttempt > 15 * 60 * 1000) {
    loginAttempts.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

function recordFailedLogin(key: string) {
  const now = Date.now();
  const rec = loginAttempts.get(key) || { attempts: 0, firstAttempt: now, blockedUntil: 0 };
  rec.attempts += 1;
  if (rec.attempts >= 5) {
    rec.blockedUntil = now + 15 * 60 * 1000; // 15 minute temporary lockout
  }
  loginAttempts.set(key, rec);
}

function clearFailedLogin(key: string) {
  loginAttempts.delete(key);
}

function validatePasswordComplexity(password: string): { valid: boolean; reason?: string } {
  if (!password || password.length < 8) {
    return { valid: false, reason: 'Password must be at least 8 characters in length.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: 'Password must include at least one uppercase letter (A-Z).' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: 'Password must include at least one lowercase letter (a-z).' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: 'Password must include at least one numerical digit (0-9).' };
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { valid: false, reason: 'Password must include at least one special character (!@#$%^&*).' };
  }
  return { valid: true };
}

function sha256(val: string): string {
  return crypto.createHash('sha256').update(val).digest('hex');
}

function generateAccessToken(user: { id: number; email: string; role: string; full_name: string }): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

function setRefreshTokenCookie(res: express.Response, rawToken: string, rememberMe: boolean) {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  res.cookie('bankora_refresh_token', rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge
  });
}

function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token && req.cookies && req.cookies.bankora_access_token) {
    token = req.cookies.bankora_access_token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No valid access token provided.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    (req as unknown as { user: TokenPayload }).user = payload;
    return next();
  } catch (err: unknown) {
    const msg = err instanceof jwt.TokenExpiredError ? 'Access token expired.' : 'Invalid access token.';
    return res.status(401).json({ error: msg });
  }
}

// 1. POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
  try {
    const { full_name, email, phone_number, password, confirm_password } = req.body;

    if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
      return res.status(400).json({ error: 'Full name is required (minimum 2 characters).' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ error: 'Password and Confirm Password do not match.' });
    }

    const complexity = validatePasswordComplexity(password);
    if (!complexity.valid) {
      return res.status(400).json({ error: complexity.reason });
    }

    // Check duplicate email
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists. Please sign in.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();

    // Standard registration strictly assigns role = 'user'
    const result = db
      .prepare(`
        INSERT INTO users (full_name, email, phone_number, password_hash, role, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'user', 1, ?, ?)
      `)
      .run(full_name.trim(), cleanEmail, phone_number ? String(phone_number).trim() : null, passwordHash, now, now);

    const userId = Number(result.lastInsertRowid);
    const user = {
      id: userId,
      full_name: full_name.trim(),
      email: cleanEmail,
      role: 'user',
      phone_number: phone_number ? String(phone_number).trim() : null,
      created_at: now
    };

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const rawRefreshToken = crypto.randomBytes(36).toString('hex');
    const refreshHash = sha256(rawRefreshToken);
    const refreshExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at, revoked, created_at)
      VALUES (?, ?, ?, 0, ?)
    `).run(userId, refreshHash, refreshExpiry, now);

    setRefreshTokenCookie(res, rawRefreshToken, true);

    return res.status(201).json({
      message: 'Account successfully registered and authenticated.',
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phone_number,
        createdAt: user.created_at
      },
      accessToken,
      refreshToken: rawRefreshToken
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Registration failed.';
    return res.status(500).json({ error: msg });
  }
});

// 2. POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    const clientIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1').split(',')[0].trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const rateLimitKey = `${clientIp}_${cleanEmail}`;

    const rateCheck = checkRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: `Too many failed login attempts. Please wait ${rateCheck.retryAfterSec} seconds before trying again.`
      });
    }

    if (!cleanEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    interface DbUser {
      id: number;
      full_name: string;
      email: string;
      phone_number: string | null;
      password_hash: string;
      role: string;
      is_active: number;
      created_at: string;
      updated_at: string;
    }

    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(cleanEmail) as DbUser | undefined;

    if (!user || user.is_active !== 1 || !bcrypt.compareSync(password, user.password_hash)) {
      recordFailedLogin(rateLimitKey);
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }

    clearFailedLogin(rateLimitKey);

    const isRemember = Boolean(rememberMe);
    const accessToken = generateAccessToken(user);
    const rawRefreshToken = crypto.randomBytes(36).toString('hex');
    const refreshHash = sha256(rawRefreshToken);
    const days = isRemember ? 30 : 1;
    const refreshExpiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at, revoked, created_at)
      VALUES (?, ?, ?, 0, ?)
    `).run(user.id, refreshHash, refreshExpiry, now);

    setRefreshTokenCookie(res, rawRefreshToken, isRemember);

    return res.status(200).json({
      message: 'Sign in successful.',
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phone_number,
        createdAt: user.created_at
      },
      accessToken,
      refreshToken: rawRefreshToken
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Login failed.';
    return res.status(500).json({ error: msg });
  }
});

// 3. POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  try {
    const rawToken = req.body?.refreshToken || req.cookies?.bankora_refresh_token;
    if (rawToken) {
      const hash = sha256(rawToken);
      db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?').run(hash);
    }
    res.clearCookie('bankora_refresh_token', { path: '/' });
    res.clearCookie('bankora_access_token', { path: '/' });
    return res.status(200).json({ message: 'Session successfully terminated.' });
  } catch {
    return res.status(200).json({ message: 'Logged out.' });
  }
});

// 4. POST /api/auth/refresh
app.post('/api/auth/refresh', (req, res) => {
  try {
    const rawToken = req.body?.refreshToken || req.cookies?.bankora_refresh_token;
    if (!rawToken || typeof rawToken !== 'string') {
      return res.status(401).json({ error: 'Refresh token not found.' });
    }

    const hash = sha256(rawToken);
    interface TokenRow {
      id: number;
      user_id: number;
      expires_at: string;
      revoked: number;
    }

    const tokenRow = db.prepare('SELECT * FROM refresh_tokens WHERE token_hash = ?').get(hash) as TokenRow | undefined;
    if (!tokenRow || tokenRow.revoked === 1) {
      return res.status(401).json({ error: 'Invalid or revoked refresh session.' });
    }

    if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
      return res.status(401).json({ error: 'Refresh session expired. Please sign in again.' });
    }

    interface DbUser {
      id: number;
      full_name: string;
      email: string;
      phone_number: string | null;
      role: string;
      is_active: number;
      created_at: string;
    }

    const user = db.prepare('SELECT id, full_name, email, phone_number, role, is_active, created_at FROM users WHERE id = ?').get(tokenRow.user_id) as DbUser | undefined;
    if (!user || user.is_active !== 1) {
      return res.status(401).json({ error: 'User account disabled or not found.' });
    }

    const newAccessToken = generateAccessToken(user);

    return res.status(200).json({
      accessToken: newAccessToken,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phone_number,
        createdAt: user.created_at
      }
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Session refresh failed.';
    return res.status(500).json({ error: msg });
  }
});

// 5. GET /api/auth/me
app.get('/api/auth/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token && req.cookies && req.cookies.bankora_access_token) {
      token = req.cookies.bankora_access_token;
    }

    if (!token) {
      // Attempt seamless cookie refresh fallback
      const rawRefreshToken = req.cookies?.bankora_refresh_token;
      if (rawRefreshToken) {
        const hash = sha256(rawRefreshToken);
        interface TokenRow {
          user_id: number;
          expires_at: string;
          revoked: number;
        }
        const tokenRow = db.prepare('SELECT user_id, expires_at, revoked FROM refresh_tokens WHERE token_hash = ?').get(hash) as TokenRow | undefined;
        if (tokenRow && tokenRow.revoked === 0 && new Date(tokenRow.expires_at).getTime() > Date.now()) {
          const user = db.prepare('SELECT id, full_name, email, phone_number, role, is_active, created_at, updated_at FROM users WHERE id = ?').get(tokenRow.user_id) as any;
          if (user && user.is_active === 1) {
            const newAccessToken = generateAccessToken(user);
            return res.status(200).json({
              user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                role: user.role,
                phoneNumber: user.phone_number,
                createdAt: user.created_at,
                updatedAt: user.updated_at
              },
              accessToken: newAccessToken
            });
          }
        }
      }
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    interface UserRow {
      id: number;
      full_name: string;
      email: string;
      phone_number: string | null;
      role: string;
      is_active: number;
      created_at: string;
      updated_at: string;
    }
    const user = db.prepare('SELECT id, full_name, email, phone_number, role, is_active, created_at, updated_at FROM users WHERE id = ?').get(payload.userId) as UserRow | undefined;

    if (!user || user.is_active !== 1) {
      return res.status(401).json({ error: 'User account disabled or deleted.' });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phone_number,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (err: unknown) {
    return res.status(401).json({ error: 'Session invalid or expired.' });
  }
});

// 6. POST /api/auth/forgot-password
app.post('/api/auth/forgot-password', (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    interface UserRow {
      id: number;
      full_name: string;
      email: string;
    }
    const user = db.prepare('SELECT id, full_name, email FROM users WHERE LOWER(email) = ?').get(cleanEmail) as UserRow | undefined;

    let resetToken = '';
    let simulationLink = '';

    if (user) {
      resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = sha256(resetToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour expiry
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO password_resets (user_id, token_hash, expires_at, used, created_at)
        VALUES (?, ?, ?, 0, ?)
      `).run(user.id, tokenHash, expiresAt, now);

      simulationLink = `/?auth=reset-password&token=${resetToken}`;
    }

    // Always respond with the same message to prevent user enumeration
    return res.status(200).json({
      message: 'If the provided email is associated with a BANKORA account, password recovery instructions have been prepared.',
      // Provided for local environment testing since external SMTP email server is not configured in this sandbox:
      developmentResetToken: resetToken || null,
      developmentResetUrl: simulationLink || null,
      emailSent: Boolean(user)
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Password reset request failed.';
    return res.status(500).json({ error: msg });
  }
});

// 7. POST /api/auth/reset-password
app.post('/api/auth/reset-password', (req, res) => {
  try {
    const { token, new_password, confirm_password } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Valid password reset token is required.' });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ error: 'New password and confirm password do not match.' });
    }

    const complexity = validatePasswordComplexity(new_password);
    if (!complexity.valid) {
      return res.status(400).json({ error: complexity.reason });
    }

    const tokenHash = sha256(token.trim());
    interface ResetRow {
      id: number;
      user_id: number;
      expires_at: string;
      used: number;
    }

    const resetRow = db.prepare('SELECT * FROM password_resets WHERE token_hash = ?').get(tokenHash) as ResetRow | undefined;

    if (!resetRow || resetRow.used === 1) {
      return res.status(400).json({ error: 'This password reset link is invalid or has already been used.' });
    }

    if (new Date(resetRow.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: 'This password reset link has expired. Please request a new one.' });
    }

    const newHash = bcrypt.hashSync(new_password, 10);
    const now = new Date().toISOString();

    db.transaction(() => {
      // Update password hash
      db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(newHash, now, resetRow.user_id);
      // Mark token used
      db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(resetRow.id);
      // Invalidate all existing refresh tokens for security
      db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?').run(resetRow.user_id);
    })();

    return res.status(200).json({
      message: 'Your password has been securely reset. You can now log in with your new credentials.'
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Password reset failed.';
    return res.status(500).json({ error: msg });
  }
});

// 8. PATCH /api/auth/profile
app.patch('/api/auth/profile', authMiddleware, (req, res) => {
  try {
    const userPayload = (req as unknown as { user: TokenPayload }).user;
    const { full_name, phone_number } = req.body;

    if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
      return res.status(400).json({ error: 'Full name must be at least 2 characters.' });
    }

    const cleanName = full_name.trim();
    const cleanPhone = phone_number ? String(phone_number).trim() : null;
    const now = new Date().toISOString();

    db.prepare('UPDATE users SET full_name = ?, phone_number = ?, updated_at = ? WHERE id = ?').run(
      cleanName,
      cleanPhone,
      now,
      userPayload.userId
    );

    interface UpdatedRow {
      id: number;
      full_name: string;
      email: string;
      phone_number: string | null;
      role: string;
      created_at: string;
      updated_at: string;
    }
    const updated = db.prepare('SELECT id, full_name, email, phone_number, role, created_at, updated_at FROM users WHERE id = ?').get(userPayload.userId) as UpdatedRow;

    return res.status(200).json({
      message: 'Profile information updated successfully.',
      user: {
        id: updated.id,
        fullName: updated.full_name,
        email: updated.email,
        role: updated.role,
        phoneNumber: updated.phone_number,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at
      }
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Profile update failed.';
    return res.status(500).json({ error: msg });
  }
});

// 9. POST /api/auth/change-password
app.post('/api/auth/change-password', authMiddleware, (req, res) => {
  try {
    const userPayload = (req as unknown as { user: TokenPayload }).user;
    const { current_password, new_password, confirm_password } = req.body;

    if (!current_password || !new_password || !confirm_password) {
      return res.status(400).json({ error: 'All password fields are required.' });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ error: 'New password and confirmation do not match.' });
    }

    const complexity = validatePasswordComplexity(new_password);
    if (!complexity.valid) {
      return res.status(400).json({ error: complexity.reason || 'Password does not meet complexity requirements.' });
    }

    interface UserRow {
      id: number;
      password_hash: string;
    }
    const user = db.prepare('SELECT id, password_hash FROM users WHERE id = ?').get(userPayload.userId) as UserRow | undefined;
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const matches = bcrypt.compareSync(current_password, user.password_hash);
    if (!matches) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const newHash = bcrypt.hashSync(new_password, 12);
    const now = new Date().toISOString();

    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(
      newHash,
      now,
      user.id
    );

    // Revoke previous refresh tokens for security
    db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?').run(user.id);

    return res.status(200).json({
      message: 'Password changed successfully. Existing sessions have been secured.'
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to change password.';
    return res.status(500).json({ error: msg });
  }
});


// Upload CSV Dataset
app.post('/api/dataset/upload', (req, res) => {
  try {
    const { csvContent, fileName } = req.body;
    if (!csvContent || typeof csvContent !== 'string') {
      return res.status(400).json({
        error: 'Missing csvContent string in request payload.'
      });
    }

    const parsed = parseCSVContent(csvContent);
    activeRecords = parsed.records;
    datasetMeta = {
      datasetName: fileName || 'Uploaded Bank Marketing Dataset.csv',
      sourceType: 'custom_upload',
      totalRows: parsed.records.length,
      missingValues: parsed.missingValuesCount,
      duplicateRows: parsed.duplicatesCount,
      uploadedAt: new Date().toISOString()
    };

    // Re-train models on the newly uploaded dataset
    const suites = mlEngine.trainAllModels(activeRecords);

    return res.status(200).json({
      message: `Successfully loaded ${parsed.records.length.toLocaleString()} records and retrained 5 classification models.`,
      summary: computeDatasetSummary(activeRecords),
      bestPreCallModel: suites.preCall.bestModelName,
      bestPreCallRocAuc: suites.preCall.bestModelRocAuc
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to parse uploaded CSV file.';
    return res.status(400).json({ error: msg });
  }
});

// Reset to default UCI dataset
app.post('/api/dataset/reset', (_req, res) => {
  activeRecords = ensureDatasetFile(defaultDatasetPath);
  datasetMeta = {
    datasetName: 'UCI Bank Marketing Dataset (bank-full-sample.csv)',
    sourceType: 'uci_default',
    totalRows: activeRecords.length,
    missingValues: activeRecords.reduce((acc, r) => {
      let c = 0;
      if (r.job === 'unknown') c++;
      if (r.education === 'unknown') c++;
      if (r.contact === 'unknown') c++;
      if (r.poutcome === 'unknown') c++;
      return acc + c;
    }, 0),
    duplicateRows: 0,
    uploadedAt: new Date().toISOString()
  };
  mlEngine.trainAllModels(activeRecords);
  res.json({
    message: 'Restored default UCI Bank Marketing dataset and retrained models.',
    summary: computeDatasetSummary(activeRecords)
  });
});

// Clear dataset to test empty / demo state
app.post('/api/dataset/clear', (_req, res) => {
  activeRecords = [];
  datasetMeta = {
    datasetName: 'No Dataset Loaded',
    sourceType: 'empty',
    totalRows: 0,
    missingValues: 0,
    duplicateRows: 0,
    uploadedAt: new Date().toISOString()
  };
  res.json({
    message: 'Dataset cleared. Application is now in empty/demo state.',
    summary: computeDatasetSummary(activeRecords)
  });
});

// Clean dataset (remove unknown job/education and deduplicate)
app.post('/api/dataset/clean', (_req, res) => {
  if (activeRecords.length === 0) {
    return res.status(400).json({ error: 'No active dataset to clean.' });
  }
  const beforeCount = activeRecords.length;
  const seen = new Set<string>();
  const cleaned: BankRecord[] = [];

  for (const r of activeRecords) {
    const key = UCI_REQUIRED_COLUMNS.map(c => String((r as unknown as Record<string, unknown>)[c])).join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push({
      ...r,
      job: r.job === 'unknown' ? 'management' : r.job,
      education: r.education === 'unknown' ? 'secondary' : r.education
    });
  }

  activeRecords = cleaned;
  datasetMeta = {
    ...datasetMeta,
    totalRows: activeRecords.length,
    duplicateRows: 0,
    missingValues: activeRecords.reduce((acc, r) => {
      let c = 0;
      if (r.contact === 'unknown') c++;
      if (r.poutcome === 'unknown') c++;
      return acc + c;
    }, 0)
  };
  mlEngine.trainAllModels(activeRecords);

  return res.json({
    message: `Cleaned dataset (${beforeCount - activeRecords.length} duplicate/invalid records resolved, imputed missing job/education modes).`,
    summary: computeDatasetSummary(activeRecords)
  });
});

app.get('/api/dataset/summary', (_req, res) => {
  res.json(computeDatasetSummary(activeRecords));
});

app.get('/api/dataset/preview', (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(200, Math.max(10, Number(req.query.limit) || 25));
  const search = String(req.query.search || '').toLowerCase().trim();
  const jobFilter = String(req.query.job || 'all').toLowerCase();
  const maritalFilter = String(req.query.marital || 'all').toLowerCase();
  const educationFilter = String(req.query.education || 'all').toLowerCase();
  const yFilter = String(req.query.y || 'all').toLowerCase();
  const sortBy = String(req.query.sortBy || 'age');
  const sortDir = String(req.query.sortDir || 'desc') === 'asc' ? 1 : -1;

  let filtered = activeRecords.map((r, idx) => ({ ...r, id: idx + 1 }));

  if (jobFilter !== 'all') {
    filtered = filtered.filter(r => r.job === jobFilter);
  }
  if (maritalFilter !== 'all') {
    filtered = filtered.filter(r => r.marital === maritalFilter);
  }
  if (educationFilter !== 'all') {
    filtered = filtered.filter(r => r.education === educationFilter);
  }
  if (yFilter !== 'all') {
    filtered = filtered.filter(r => r.y === yFilter);
  }
  if (search) {
    filtered = filtered.filter(
      r =>
        r.job.includes(search) ||
        r.marital.includes(search) ||
        r.education.includes(search) ||
        r.month.includes(search) ||
        r.contact.includes(search) ||
        r.poutcome.includes(search) ||
        String(r.age).includes(search) ||
        String(r.balance).includes(search)
    );
  }

  filtered.sort((a, b) => {
    const va = (a as unknown as Record<string, unknown>)[sortBy];
    const vb = (b as unknown as Record<string, unknown>)[sortBy];
    if (typeof va === 'number' && typeof vb === 'number') {
      return (va - vb) * sortDir;
    }
    return String(va).localeCompare(String(vb)) * sortDir;
  });

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / limit));
  const start = (page - 1) * limit;
  const rows = filtered.slice(start, start + limit);

  res.json({
    rows,
    totalFiltered,
    totalRows: activeRecords.length,
    page,
    limit,
    totalPages
  });
});

// Overview Dashboard Analytics
app.get('/api/analytics/overview', (_req, res) => {
  if (activeRecords.length === 0) {
    return res.json({ hasDataset: false });
  }

  const totalCustomers = activeRecords.length;
  const subscribedCustomers = activeRecords.filter(r => r.y === 'yes').length;
  const notSubscribedCustomers = totalCustomers - subscribedCustomers;
  const subscriptionRate = Number(((subscribedCustomers / totalCustomers) * 100).toFixed(2));

  const totalBalance = activeRecords.reduce((acc, r) => acc + r.balance, 0);
  const averageBalance = Math.round(totalBalance / totalCustomers);

  const subRecords = activeRecords.filter(r => r.y === 'yes');
  const avgSubscribedBalance = subRecords.length
    ? Math.round(subRecords.reduce((a, b) => a + b.balance, 0) / subRecords.length)
    : 0;

  const totalCampaignContacts = activeRecords.reduce((acc, r) => acc + r.campaign, 0);
  const campaignConversionRate = Number(((subscribedCustomers / Math.max(1, totalCampaignContacts)) * 100).toFixed(2));

  // Subscription Distribution Donut
  const subscriptionDistribution = [
    { name: 'Subscribed (Yes)', value: subscribedCustomers, pct: subscriptionRate, color: '#3B82F6' },
    {
      name: 'Not Subscribed (No)',
      value: notSubscribedCustomers,
      pct: Number((100 - subscriptionRate).toFixed(2)),
      color: '#6366F1'
    }
  ];

  // Monthly Campaign Performance
  const monthOrder = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const monthlyPerformance = monthOrder.map(m => {
    const mRecs = activeRecords.filter(r => r.month === m);
    const yes = mRecs.filter(r => r.y === 'yes').length;
    const no = mRecs.length - yes;
    const rate = mRecs.length > 0 ? Number(((yes / mRecs.length) * 100).toFixed(1)) : 0;
    return {
      month: m.charAt(0).toUpperCase() + m.slice(1),
      total: mRecs.length,
      subscribed: yes,
      notSubscribed: no,
      conversionRate: rate
    };
  });

  // Age Group Analysis
  const ageBuckets = [
    { group: '18–25', min: 0, max: 25 },
    { group: '26–35', min: 26, max: 35 },
    { group: '36–45', min: 36, max: 45 },
    { group: '46–55', min: 46, max: 55 },
    { group: '56–65', min: 56, max: 65 },
    { group: '65+', min: 66, max: 150 }
  ];
  const ageGroupAnalysis = ageBuckets.map(b => {
    const recs = activeRecords.filter(r => r.age >= b.min && r.age <= b.max);
    const yes = recs.filter(r => r.y === 'yes').length;
    return {
      ageGroup: b.group,
      total: recs.length,
      subscribed: yes,
      notSubscribed: recs.length - yes,
      subscriptionRate: recs.length > 0 ? Number(((yes / recs.length) * 100).toFixed(1)) : 0
    };
  });

  // Job Category Analysis
  const jobMap: Record<string, { total: number; yes: number }> = {};
  for (const r of activeRecords) {
    if (!jobMap[r.job]) jobMap[r.job] = { total: 0, yes: 0 };
    jobMap[r.job].total++;
    if (r.y === 'yes') jobMap[r.job].yes++;
  }
  const jobAnalysis = Object.entries(jobMap)
    .map(([job, stats]) => ({
      job: job.charAt(0).toUpperCase() + job.slice(1),
      total: stats.total,
      subscribed: stats.yes,
      notSubscribed: stats.total - stats.yes,
      subscriptionRate: Number(((stats.yes / stats.total) * 100).toFixed(1))
    }))
    .sort((a, b) => b.total - a.total);

  // Education Distribution
  const eduMap: Record<string, { total: number; yes: number }> = {};
  for (const r of activeRecords) {
    if (!eduMap[r.education]) eduMap[r.education] = { total: 0, yes: 0 };
    eduMap[r.education].total++;
    if (r.y === 'yes') eduMap[r.education].yes++;
  }
  const educationAnalysis = Object.entries(eduMap)
    .map(([education, stats]) => ({
      education: education.charAt(0).toUpperCase() + education.slice(1),
      total: stats.total,
      subscribed: stats.yes,
      subscriptionRate: Number(((stats.yes / stats.total) * 100).toFixed(1))
    }))
    .sort((a, b) => b.total - a.total);

  // Marital Status Analysis
  const maritalMap: Record<string, { total: number; yes: number }> = {};
  for (const r of activeRecords) {
    if (!maritalMap[r.marital]) maritalMap[r.marital] = { total: 0, yes: 0 };
    maritalMap[r.marital].total++;
    if (r.y === 'yes') maritalMap[r.marital].yes++;
  }
  const maritalAnalysis = Object.entries(maritalMap).map(([marital, stats]) => ({
    marital: marital.charAt(0).toUpperCase() + marital.slice(1),
    total: stats.total,
    subscribed: stats.yes,
    notSubscribed: stats.total - stats.yes,
    subscriptionRate: Number(((stats.yes / stats.total) * 100).toFixed(1))
  }));

  // Housing Loan Comparison
  const housingComparison = ['yes', 'no'].map(h => {
    const recs = activeRecords.filter(r => r.housing === h);
    const yes = recs.filter(r => r.y === 'yes').length;
    return {
      housingLoan: h === 'yes' ? 'Has Housing Loan' : 'No Housing Loan',
      total: recs.length,
      subscribed: yes,
      notSubscribed: recs.length - yes,
      subscriptionRate: recs.length > 0 ? Number(((yes / recs.length) * 100).toFixed(1)) : 0
    };
  });

  // Campaign Contact Analysis
  const contactBuckets = ['1', '2', '3', '4', '5+'];
  const campaignContactAnalysis = contactBuckets.map(label => {
    const recs = activeRecords.filter(r =>
      label === '5+' ? r.campaign >= 5 : r.campaign === Number(label)
    );
    const yes = recs.filter(r => r.y === 'yes').length;
    return {
      contacts: `${label} ${label === '1' ? 'Contact' : 'Contacts'}`,
      total: recs.length,
      subscribed: yes,
      conversionRate: recs.length > 0 ? Number(((yes / recs.length) * 100).toFixed(1)) : 0
    };
  });

  // Recent Prediction Activity from SQLite
  const recentPredictions = db
    .prepare('SELECT * FROM prediction_history ORDER BY id DESC LIMIT 6')
    .all();

  const suites = mlEngine.getEvaluationSuites(activeRecords);

  return res.json({
    hasDataset: true,
    meta: datasetMeta,
    kpis: {
      totalCustomers,
      subscribedCustomers,
      notSubscribedCustomers,
      subscriptionRate,
      campaignConversionRate,
      averageBalance,
      avgSubscribedBalance,
      totalCampaignContacts,
      bestModelName: suites.preCall.bestModelName,
      bestModelRocAuc: suites.preCall.bestModelRocAuc,
      bestModelAccuracy: suites.preCall.models.find(m => m.isBest)?.accuracy || 0
    },
    subscriptionDistribution,
    monthlyPerformance,
    ageGroupAnalysis,
    jobAnalysis,
    educationAnalysis,
    maritalAnalysis,
    housingComparison,
    campaignContactAnalysis,
    recentPredictions
  });
});

// Customer Insights Endpoint with Dynamic Interactive Filters
app.get('/api/analytics/customers', (req, res) => {
  if (activeRecords.length === 0) {
    return res.json({ hasDataset: false });
  }

  const minAge = Number(req.query.minAge) || 18;
  const maxAge = Number(req.query.maxAge) || 95;
  const job = String(req.query.job || 'all').toLowerCase();
  const education = String(req.query.education || 'all').toLowerCase();
  const marital = String(req.query.marital || 'all').toLowerCase();
  const housing = String(req.query.housing || 'all').toLowerCase();
  const loan = String(req.query.loan || 'all').toLowerCase();

  const filtered = activeRecords.filter(r => {
    if (r.age < minAge || r.age > maxAge) return false;
    if (job !== 'all' && r.job !== job) return false;
    if (education !== 'all' && r.education !== education) return false;
    if (marital !== 'all' && r.marital !== marital) return false;
    if (housing !== 'all' && r.housing !== housing) return false;
    if (loan !== 'all' && r.loan !== loan) return false;
    return true;
  });

  const totalFiltered = filtered.length;
  const subscribedCount = filtered.filter(r => r.y === 'yes').length;
  const subscriptionRate =
    totalFiltered > 0 ? Number(((subscribedCount / totalFiltered) * 100).toFixed(2)) : 0;
  const avgBalance =
    totalFiltered > 0
      ? Math.round(filtered.reduce((a, b) => a + b.balance, 0) / totalFiltered)
      : 0;
  const avgAge =
    totalFiltered > 0
      ? Number((filtered.reduce((a, b) => a + b.age, 0) / totalFiltered).toFixed(1))
      : 0;

  // Age distribution histogram
  const ageBins = [
    { range: '18–25', min: 18, max: 25 },
    { range: '26–32', min: 26, max: 32 },
    { range: '33–40', min: 33, max: 40 },
    { range: '41–48', min: 41, max: 48 },
    { range: '49–56', min: 49, max: 56 },
    { range: '57–65', min: 57, max: 65 },
    { range: '66+', min: 66, max: 120 }
  ];
  const ageDistribution = ageBins.map(b => {
    const recs = filtered.filter(r => r.age >= b.min && r.age <= b.max);
    const yes = recs.filter(r => r.y === 'yes').length;
    return {
      range: b.range,
      subscribed: yes,
      notSubscribed: recs.length - yes,
      total: recs.length,
      rate: recs.length > 0 ? Number(((yes / recs.length) * 100).toFixed(1)) : 0
    };
  });

  // Job-wise subscription
  const jobsMap: Record<string, { total: number; yes: number; balanceSum: number }> = {};
  for (const r of filtered) {
    if (!jobsMap[r.job]) jobsMap[r.job] = { total: 0, yes: 0, balanceSum: 0 };
    jobsMap[r.job].total++;
    if (r.y === 'yes') jobsMap[r.job].yes++;
    jobsMap[r.job].balanceSum += r.balance;
  }
  const jobBreakdown = Object.entries(jobsMap)
    .map(([j, s]) => ({
      job: j.charAt(0).toUpperCase() + j.slice(1),
      total: s.total,
      subscribed: s.yes,
      notSubscribed: s.total - s.yes,
      rate: Number(((s.yes / s.total) * 100).toFixed(1)),
      avgBalance: Math.round(s.balanceSum / s.total)
    }))
    .sort((a, b) => b.rate - a.rate);

  // Education breakdown
  const eduMap: Record<string, { total: number; yes: number }> = {};
  for (const r of filtered) {
    if (!eduMap[r.education]) eduMap[r.education] = { total: 0, yes: 0 };
    eduMap[r.education].total++;
    if (r.y === 'yes') eduMap[r.education].yes++;
  }
  const educationBreakdown = Object.entries(eduMap).map(([e, s]) => ({
    education: e.charAt(0).toUpperCase() + e.slice(1),
    total: s.total,
    subscribed: s.yes,
    notSubscribed: s.total - s.yes,
    rate: Number(((s.yes / s.total) * 100).toFixed(1))
  }));

  // Marital breakdown
  const marMap: Record<string, { total: number; yes: number }> = {};
  for (const r of filtered) {
    if (!marMap[r.marital]) marMap[r.marital] = { total: 0, yes: 0 };
    marMap[r.marital].total++;
    if (r.y === 'yes') marMap[r.marital].yes++;
  }
  const maritalBreakdown = Object.entries(marMap).map(([m, s]) => ({
    marital: m.charAt(0).toUpperCase() + m.slice(1),
    total: s.total,
    subscribed: s.yes,
    notSubscribed: s.total - s.yes,
    rate: Number(((s.yes / s.total) * 100).toFixed(1))
  }));

  // Account Balance Tiers
  const balanceTiers = [
    { tier: 'Negative (< €0)', check: (b: number) => b < 0 },
    { tier: 'Low (€0 – €500)', check: (b: number) => b >= 0 && b <= 500 },
    { tier: 'Moderate (€501 – €1,500)', check: (b: number) => b > 500 && b <= 1500 },
    { tier: 'High (€1,501 – €4,000)', check: (b: number) => b > 1500 && b <= 4000 },
    { tier: 'Affluent (> €4,000)', check: (b: number) => b > 4000 }
  ];
  const balanceAnalysis = balanceTiers.map(t => {
    const recs = filtered.filter(r => t.check(r.balance));
    const yes = recs.filter(r => r.y === 'yes').length;
    return {
      tier: t.tier,
      total: recs.length,
      subscribed: yes,
      notSubscribed: recs.length - yes,
      rate: recs.length > 0 ? Number(((yes / recs.length) * 100).toFixed(1)) : 0
    };
  });

  // Loan & Debt Profile Matrix
  const loanProfiles = [
    { profile: 'Debt-Free (No Loans)', filter: (r: BankRecord) => r.housing === 'no' && r.loan === 'no' },
    { profile: 'Housing Mortgage Only', filter: (r: BankRecord) => r.housing === 'yes' && r.loan === 'no' },
    { profile: 'Personal Loan Only', filter: (r: BankRecord) => r.housing === 'no' && r.loan === 'yes' },
    { profile: 'Dual Loan Burden', filter: (r: BankRecord) => r.housing === 'yes' && r.loan === 'yes' }
  ].map(p => {
    const recs = filtered.filter(p.filter);
    const yes = recs.filter(r => r.y === 'yes').length;
    return {
      profile: p.profile,
      total: recs.length,
      subscribed: yes,
      rate: recs.length > 0 ? Number(((yes / recs.length) * 100).toFixed(1)) : 0
    };
  });

  // Contact Method Analysis
  const contactMap: Record<string, { total: number; yes: number }> = {};
  for (const r of filtered) {
    if (!contactMap[r.contact]) contactMap[r.contact] = { total: 0, yes: 0 };
    contactMap[r.contact].total++;
    if (r.y === 'yes') contactMap[r.contact].yes++;
  }
  const contactAnalysis = Object.entries(contactMap).map(([c, s]) => ({
    contact: c.charAt(0).toUpperCase() + c.slice(1),
    total: s.total,
    subscribed: s.yes,
    rate: Number(((s.yes / s.total) * 100).toFixed(1))
  }));

  res.json({
    hasDataset: true,
    summary: {
      totalFiltered,
      totalDataset: activeRecords.length,
      subscribedCount,
      subscriptionRate,
      avgBalance,
      avgAge
    },
    ageDistribution,
    jobBreakdown,
    educationBreakdown,
    maritalBreakdown,
    balanceAnalysis,
    loanProfiles,
    contactAnalysis
  });
});

// Campaign Analytics Endpoint
app.get('/api/analytics/campaigns', (_req, res) => {
  if (activeRecords.length === 0) {
    return res.json({ hasDataset: false });
  }

  // 1. Campaign contact frequency
  const freqBuckets = [1, 2, 3, 4, 5, 6, 7];
  const contactFrequency = freqBuckets.map(c => {
    const recs = activeRecords.filter(r => (c === 7 ? r.campaign >= 7 : r.campaign === c));
    const yes = recs.filter(r => r.y === 'yes').length;
    return {
      contacts: c === 7 ? '7+ Calls' : `${c} ${c === 1 ? 'Call' : 'Calls'}`,
      totalCustomers: recs.length,
      subscribed: yes,
      notSubscribed: recs.length - yes,
      conversionRate: recs.length > 0 ? Number(((yes / recs.length) * 100).toFixed(1)) : 0
    };
  });

  // 2. Previous Campaign Outcomes
  const poutcomes = ['success', 'failure', 'other', 'unknown'];
  const previousOutcomes = poutcomes.map(po => {
    const recs = activeRecords.filter(r => r.poutcome === po);
    const yes = recs.filter(r => r.y === 'yes').length;
    return {
      outcome: po.charAt(0).toUpperCase() + po.slice(1),
      total: recs.length,
      subscribed: yes,
      notSubscribed: recs.length - yes,
      conversionRate: recs.length > 0 ? Number(((yes / recs.length) * 100).toFixed(1)) : 0
    };
  });

  // 3. Subscription by Contact Method
  const contactMethods = ['cellular', 'telephone', 'unknown'].map(cm => {
    const recs = activeRecords.filter(r => r.contact === cm);
    const yes = recs.filter(r => r.y === 'yes').length;
    return {
      method: cm.charAt(0).toUpperCase() + cm.slice(1),
      total: recs.length,
      subscribed: yes,
      conversionRate: recs.length > 0 ? Number(((yes / recs.length) * 100).toFixed(1)) : 0
    };
  });

  // 4. Subscription by Month
  const monthOrder = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const monthlyStats = monthOrder.map(m => {
    const recs = activeRecords.filter(r => r.month === m);
    const yes = recs.filter(r => r.y === 'yes').length;
    return {
      month: m.toUpperCase(),
      volume: recs.length,
      subscribed: yes,
      conversionRate: recs.length > 0 ? Number(((yes / recs.length) * 100).toFixed(1)) : 0
    };
  });

  // 5. Call Duration Distribution
  const durationBuckets = [
    { label: '< 1 min', min: 0, max: 60 },
    { label: '1–2 min', min: 61, max: 120 },
    { label: '2–4 min', min: 121, max: 240 },
    { label: '4–6 min', min: 241, max: 360 },
    { label: '6–10 min', min: 361, max: 600 },
    { label: '> 10 min', min: 601, max: 99999 }
  ];
  const durationDistribution = durationBuckets.map(b => {
    const recs = activeRecords.filter(r => r.duration >= b.min && r.duration <= b.max);
    const yes = recs.filter(r => r.y === 'yes').length;
    return {
      durationRange: b.label,
      total: recs.length,
      subscribed: yes,
      notSubscribed: recs.length - yes,
      conversionRate: recs.length > 0 ? Number(((yes / recs.length) * 100).toFixed(1)) : 0
    };
  });

  // Calculated Business Insights from actual dataset
  const avgDurationYes = Math.round(
    activeRecords.filter(r => r.y === 'yes').reduce((a, b) => a + b.duration, 0) /
      Math.max(1, activeRecords.filter(r => r.y === 'yes').length)
  );
  const avgDurationNo = Math.round(
    activeRecords.filter(r => r.y === 'no').reduce((a, b) => a + b.duration, 0) /
      Math.max(1, activeRecords.filter(r => r.y === 'no').length)
  );

  const pSuccessRate = previousOutcomes.find(p => p.outcome === 'Success')?.conversionRate || 0;
  const cellularRate = contactMethods.find(c => c.method === 'Cellular')?.conversionRate || 0;
  const overContactedRecs = activeRecords.filter(r => r.campaign > 3);
  const overContactedRate =
    overContactedRecs.length > 0
      ? Number(
          (
            (overContactedRecs.filter(r => r.y === 'yes').length / overContactedRecs.length) *
            100
          ).toFixed(1)
        )
      : 0;

  const optimalCallsRecs = activeRecords.filter(r => r.campaign <= 2);
  const optimalCallsRate =
    optimalCallsRecs.length > 0
      ? Number(
          (
            (optimalCallsRecs.filter(r => r.y === 'yes').length / optimalCallsRecs.length) *
            100
          ).toFixed(1)
        )
      : 0;

  res.json({
    hasDataset: true,
    contactFrequency,
    previousOutcomes,
    contactMethods,
    monthlyStats,
    durationDistribution,
    metrics: {
      avgDurationYes,
      avgDurationNo,
      pSuccessRate,
      cellularRate,
      overContactedRate,
      optimalCallsRate,
      overContactedShare: Number(((overContactedRecs.length / activeRecords.length) * 100).toFixed(1))
    }
  });
});

// Predict Customer Endpoint
app.post('/api/predict', (req, res) => {
  try {
    const input = req.body as PredictionInput;
    if (!input || typeof input.age !== 'number') {
      return res.status(400).json({ error: 'Valid customer features are required for prediction.' });
    }

    const fallback = activeRecords.length > 0 ? activeRecords : ensureDatasetFile(defaultDatasetPath);
    const output = mlEngine.predictCustomer(input, fallback);

    const summary = `${input.age}yo ${input.job}, ${input.marital}, €${Number(input.balance).toLocaleString()} bal`;
    const createdAt = new Date().toISOString();

    const info = db
      .prepare(
        `
      INSERT INTO prediction_history (
        customer_summary, input_json, prediction, label, probability,
        confidence_tier, model_name, model_mode, recommended_action, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        summary,
        JSON.stringify(input),
        output.prediction,
        output.label,
        output.probability,
        output.confidenceTier,
        output.modelName,
        output.modelMode,
        JSON.stringify(output.recommendedAction),
        createdAt
      );

    return res.json({
      id: info.lastInsertRowid,
      createdAt,
      ...output
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Prediction execution failed.';
    return res.status(500).json({ error: msg });
  }
});

// Model Performance Endpoint
app.get('/api/models/performance', (_req, res) => {
  const fallback = activeRecords.length > 0 ? activeRecords : ensureDatasetFile(defaultDatasetPath);
  const suites = mlEngine.getEvaluationSuites(fallback);
  res.json(suites);
});

// Trigger fresh Model Retraining
app.post('/api/models/train', (_req, res) => {
  const fallback = activeRecords.length > 0 ? activeRecords : ensureDatasetFile(defaultDatasetPath);
  const suites = mlEngine.trainAllModels(fallback);
  res.json({
    message: 'Successfully retrained all 5 classification algorithms on stratified 80/20 split.',
    ...suites
  });
});

// Prediction History Endpoints
app.get('/api/predictions/history', (req, res) => {
  const search = String(req.query.search || '').toLowerCase().trim();
  const filterResult = String(req.query.result || 'all').toLowerCase();
  const sortOrder = String(req.query.sort || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  let rows = db
    .prepare(`SELECT * FROM prediction_history ORDER BY created_at ${sortOrder}, id ${sortOrder}`)
    .all() as Array<Record<string, unknown>>;

  if (filterResult === 'yes' || filterResult === 'no') {
    rows = rows.filter(r => String(r.prediction).toLowerCase() === filterResult);
  }
  if (search) {
    rows = rows.filter(
      r =>
        String(r.customer_summary).toLowerCase().includes(search) ||
        String(r.model_name).toLowerCase().includes(search) ||
        String(r.label).toLowerCase().includes(search)
    );
  }

  const parsedRows = rows.map(r => ({
    id: r.id,
    customerSummary: r.customer_summary,
    input: JSON.parse(String(r.input_json || '{}')),
    prediction: r.prediction,
    label: r.label,
    probability: r.probability,
    confidenceTier: r.confidence_tier,
    modelName: r.model_name,
    modelMode: r.model_mode,
    recommendedAction: JSON.parse(String(r.recommended_action || '{}')),
    createdAt: r.created_at
  }));

  res.json({
    total: parsedRows.length,
    records: parsedRows
  });
});

app.delete('/api/predictions/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid prediction ID.' });
  }
  const result = db.prepare('DELETE FROM prediction_history WHERE id = ?').run(id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Prediction record not found.' });
  }
  return res.json({ message: `Deleted prediction record #${id}.`, deletedId: id });
});

app.delete('/api/predictions', (_req, res) => {
  try {
    const result = db.prepare('DELETE FROM prediction_history').run();
    return res.json({
      message: `Successfully cleared ${result.changes} prediction history records from SQLite database.`,
      deletedCount: result.changes
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to clear prediction history.';
    return res.status(500).json({ error: msg });
  }
});

// Reports Export Endpoint
app.get('/api/reports/export', (req, res) => {
  const type = String(req.query.type || 'dataset_csv');
  const fallback = activeRecords.length > 0 ? activeRecords : ensureDatasetFile(defaultDatasetPath);

  if (type === 'cleaned_dataset') {
    const header = UCI_REQUIRED_COLUMNS.join(',');
    const rows = fallback.map(r =>
      UCI_REQUIRED_COLUMNS.map(c => String((r as unknown as Record<string, unknown>)[c])).join(',')
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="bankora_cleaned_dataset.csv"');
    return res.send([header, ...rows].join('\n'));
  }

  if (type === 'dataset_summary') {
    const summary = computeDatasetSummary(fallback);
    const header = 'Column,Mean,StdDev,Min,Q25,Median,Q75,Max';
    const rows = summary.numericalStats.map(
      s => `${s.column},${s.mean},${s.std},${s.min},${s.q25},${s.median},${s.q75},${s.max}`
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="bankora_dataset_statistical_summary.csv"');
    return res.send([header, ...rows].join('\n'));
  }

  if (type === 'prediction_history') {
    const rows = db
      .prepare('SELECT * FROM prediction_history ORDER BY id DESC')
      .all() as Array<Record<string, unknown>>;
    const header = 'ID,Timestamp,CustomerSummary,Prediction,Label,Probability,ConfidenceTier,ModelName';
    const csvRows = rows.map(
      r =>
        `${r.id},"${r.created_at}","${r.customer_summary}",${r.prediction},"${r.label}",${r.probability},"${r.confidence_tier}","${r.model_name}"`
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="bankora_prediction_history.csv"');
    return res.send([header, ...csvRows].join('\n'));
  }

  if (type === 'model_metrics') {
    const suites = mlEngine.getEvaluationSuites(fallback);
    const header = 'PipelineMode,ModelName,Family,AccuracyPct,PrecisionYesPct,RecallYesPct,F1YesPct,RocAucPct,TruePositives,FalsePositives,TrueNegatives,FalseNegatives,IsBest';
    const preRows = suites.preCall.models.map(
      m =>
        `Pre-Call (Leakage-Free),"${m.name}","${m.family}",${m.accuracy},${m.precision},${m.recall},${m.f1Score},${m.rocAuc},${m.confusionMatrix.tp},${m.confusionMatrix.fp},${m.confusionMatrix.tn},${m.confusionMatrix.fn},${m.isBest}`
    );
    const postRows = suites.postCall.models.map(
      m =>
        `Post-Call (Benchmark),"${m.name}","${m.family}",${m.accuracy},${m.precision},${m.recall},${m.f1Score},${m.rocAuc},${m.confusionMatrix.tp},${m.confusionMatrix.fp},${m.confusionMatrix.tn},${m.confusionMatrix.fn},${m.isBest}`
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="bankora_model_comparison_metrics.csv"');
    return res.send([header, ...preRows, ...postRows].join('\n'));
  }

  return res.status(400).json({ error: 'Unsupported export type.' });
});

// User Settings Persistence Endpoints
app.get('/api/settings', (_req, res) => {
  const rows = db.prepare('SELECT key, value FROM user_settings').all() as Array<{ key: string; value: string }>;
  const map: Record<string, unknown> = {};
  for (const r of rows) {
    try {
      map[r.key] = JSON.parse(r.value);
    } catch {
      map[r.key] = r.value;
    }
  }
  res.json(map);
});

app.post('/api/settings', (req, res) => {
  const settings = req.body || {};
  const upsert = db.prepare(`
    INSERT INTO user_settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);
  for (const [k, v] of Object.entries(settings)) {
    upsert.run(k, JSON.stringify(v));
  }
  res.json({ message: 'Preferences saved to database.', settings });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BANKORA Full-Stack Intelligence Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
