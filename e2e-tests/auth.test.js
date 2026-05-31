import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environmental variables
const currentDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(currentDir, '../apps/api/src/config/.env') });

const DB_URL = process.env.DB_URL || 'mongodb://localhost:27017/lms';
const BACKEND_URL = (process.env.BACKEND_URL || '').trim();

const TEST_EMAIL = 'auth_test_borrower@lms.com';
const TEST_PASSWORD = 'password123';

beforeAll(async () => {
  try {
    // Attempt database connection with a tight 3s timeout to fail fast on IP whitelisting errors
    await mongoose.connect(DB_URL, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000
    });
    const db = mongoose.connection.db;
    // Clean up any test user from previous run
    await db.collection('users').deleteOne({ email: TEST_EMAIL });
  } catch (err) {
    console.error(err.message);
    throw err;
  }
});

afterAll(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      const db = mongoose.connection.db;
      await db.collection('users').deleteOne({ email: TEST_EMAIL });
    }
  } catch (err) {
    // Ignore cleanup errors if connection was never established
  } finally {
    await mongoose.disconnect();
  }
});

describe('Authentication & Authorization Endpoints', () => {

  test('GET /api/health - health check', async () => {
    const res = await fetch(`${BACKEND_URL}/api/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  test('POST /api/auth/signup - should reject incomplete requests', async () => {
    const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL })
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toContain('required');
  });

  test('POST /api/auth/signup - should successfully register borrower', async () => {
    const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Auth Test User',
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.token).toBeDefined();
    expect(body.user.email).toBe(TEST_EMAIL);
    expect(body.user.role).toBe('BORROWER');
  });

  test('POST /api/auth/signup - should reject duplicate email', async () => {
    const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate',
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });
    expect(res.status).toBe(409);
  });

  test('POST /api/auth/signin - should reject invalid credentials', async () => {
    const res = await fetch(`${BACKEND_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: 'wrongpassword'
      })
    });
    expect(res.status).toBe(401);
  });

  test('POST /api/auth/signin - should login successfully', async () => {
    const res = await fetch(`${BACKEND_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBeDefined();
    expect(body.user.email).toBe(TEST_EMAIL);
  });

  describe('RBAC Verification', () => {
    let borrowerToken = null;
    let salesToken = null;

    beforeAll(async () => {
      // Get borrower token
      let res = await fetch(`${BACKEND_URL}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
      });
      borrowerToken = (await res.json()).token;

      // Get sales token (pre-seeded sales@lms.com / sales123)
      res = await fetch(`${BACKEND_URL}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'sales@lms.com', password: 'sales123' })
      });
      if (res.status === 200) {
        salesToken = (await res.json()).token;
      }
    });

    test('Borrowers cannot access Executive Dashboard routes (expect 403)', async () => {
      const res = await fetch(`${BACKEND_URL}/api/dashboard/sales/leads`, {
        headers: { 'Authorization': `Bearer ${borrowerToken}` }
      });
      expect(res.status).toBe(403);
    });

    test('Executives cannot access Borrower routes (expect 403)', async () => {
      if (!salesToken) return; // Skip if sales user isn't seeded
      const res = await fetch(`${BACKEND_URL}/api/borrower/profile`, {
        headers: { 'Authorization': `Bearer ${salesToken}` }
      });
      expect(res.status).toBe(403);
    });
  });
});
