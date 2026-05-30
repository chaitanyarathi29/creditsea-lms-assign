import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/api/.env') });

const DB_URL = process.env.DB_URL || 'mongodb://localhost:27017/lms';
const BACKEND_URL = 'http://localhost:8000';

const TEST_EMAIL = 'borrower_flow_test@lms.com';
const TEST_PASSWORD = 'password123';

let token = null;
let userId = null;
let loanId = null;

beforeAll(async () => {
  try {
    // Attempt database connection with a tight 3s timeout to fail fast on IP whitelisting errors
    await mongoose.connect(DB_URL, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000
    });
    const db = mongoose.connection.db;

    // Clean up any test user from previous runs
    const user = await db.collection('users').findOne({ email: TEST_EMAIL });
    if (user) {
      const uId = user._id;
      const loans = await db.collection('loans').find({ borrowerId: uId }).toArray();
      const loanIds = loans.map(l => l._id);
      await db.collection('payments').deleteMany({ loanId: { $in: loanIds } });
      await db.collection('loans').deleteMany({ borrowerId: uId });
      await db.collection('borrowerprofiles').deleteMany({ userId: uId });
      await db.collection('users').deleteOne({ _id: uId });
    }

    // Register borrower
    let res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Borrower Flow Test User',
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });
    const data = await res.json();
    token = data.token;
    userId = data.user.id;
  } catch (err) {
    console.error('\n================================================================');
    console.error('🚨 DATABASE CONNECTION ERROR IN TESTS:');
    console.error(err.message);
    console.error('\n👉 Solution 1: Whitelist your IP in MongoDB Atlas:');
    console.error('   https://cloud.mongodb.com/ -> Network Access -> Add Current IP');
    console.error('\n👉 Solution 2: Use local MongoDB (recommended for offline development):');
    console.error('   Update DB_URL in apps/api/.env to: mongodb://127.0.0.1:27017/lms');
    console.error('================================================================\n');
    throw err;
  }
});

afterAll(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      const db = mongoose.connection.db;
      const user = await db.collection('users').findOne({ email: TEST_EMAIL });
      if (user) {
        const uId = user._id;
        const loans = await db.collection('loans').find({ borrowerId: uId }).toArray();
        const loanIds = loans.map(l => l._id);
        // await db.collection('payments').deleteMany({ loanId: { $in: loanIds } });
        // await db.collection('loans').deleteMany({ borrowerId: uId });
        // await db.collection('borrowerprofiles').deleteMany({ userId: uId });
        // await db.collection('users').deleteOne({ _id: uId });
      }
    }
  } catch (err) {
    // Ignore cleanup errors if connection failed
  } finally {
    await mongoose.disconnect();
  }
});

describe('Borrower Workflow & BRE Validation', () => {

  test('GET /api/borrower/profile - should return 404 if profile not submitted yet', async () => {
    const res = await fetch(`${BACKEND_URL}/api/borrower/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(res.status).toBe(404);
  });

  test('POST /api/borrower/profile - should fail BRE: Age under 23', async () => {
    const res = await fetch(`${BACKEND_URL}/api/borrower/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        fullName: 'Too Young',
        pan: 'ABCDE1234F',
        dateOfBirth: '2015-05-30', // Age ~11
        monthlySalary: 30000,
        employmentMode: 'SALARIED'
      })
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.breStatus).toBe('FAILED');
    expect(body.breErrors.join(', ')).toContain('Age must be between 23 and 50');
  });

  test('POST /api/borrower/profile - should fail BRE: Monthly salary < ₹25,000', async () => {
    const res = await fetch(`${BACKEND_URL}/api/borrower/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        fullName: 'Low salary applicant',
        pan: 'ABCDE1234F',
        dateOfBirth: '1996-05-30', // Age ~30
        monthlySalary: 24000,
        employmentMode: 'SALARIED'
      })
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.breStatus).toBe('FAILED');
    expect(body.breErrors.join(', ')).toContain('Monthly salary must be at least ₹25,000');
  });

  test('POST /api/borrower/profile - should fail BRE: Invalid PAN Format', async () => {
    const res = await fetch(`${BACKEND_URL}/api/borrower/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        fullName: 'Bad PAN Applicant',
        pan: 'ABCD1234EF', // Invalid format
        dateOfBirth: '1996-05-30',
        monthlySalary: 30000,
        employmentMode: 'SALARIED'
      })
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.breStatus).toBe('FAILED');
    expect(body.breErrors.join(', ')).toContain('Invalid PAN format');
  });

  test('POST /api/borrower/profile - should fail BRE: Unemployed Applicant', async () => {
    const res = await fetch(`${BACKEND_URL}/api/borrower/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        fullName: 'Unemployed Applicant',
        pan: 'ABCDE1234F',
        dateOfBirth: '1996-05-30',
        monthlySalary: 30000,
        employmentMode: 'UNEMPLOYED'
      })
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.breStatus).toBe('FAILED');
    expect(body.breErrors.join(', ')).toContain('Unemployed applicants are not eligible');
  });

  test('POST /api/borrower/profile - should successfully pass BRE and save details', async () => {
    const res = await fetch(`${BACKEND_URL}/api/borrower/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        fullName: 'E2E Borrower Test User',
        pan: 'ABCDE1234F',
        dateOfBirth: '1996-05-30',
        monthlySalary: 30000,
        employmentMode: 'SALARIED'
      })
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.breStatus).toBe('PASSED');
    expect(body.profile).toBeDefined();
    expect(body.profile.fullName).toBe('E2E Borrower Test User');
  });

  test('GET /api/borrower/profile - should fetch the passing profile successfully', async () => {
    const res = await fetch(`${BACKEND_URL}/api/borrower/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.profile.breStatus).toBe('PASSED');
    expect(body.profile.monthlySalary).toBe(30000);
  });

  test('POST /api/borrower/salary-slip - should successfully upload salary slip file', async () => {
    const formData = new FormData();
    const fileBlob = new Blob(['MOCK_SALARY_SLIP_PDF_CONTENT'], { type: 'application/pdf' });
    formData.append('salarySlip', fileBlob, 'salary_slip.pdf');

    const res = await fetch(`${BACKEND_URL}/api/borrower/salary-slip`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.salarySlipUrl).toBeDefined();
    expect(body.salarySlipUrl).toContain('/uploads/salary-slips/');

    // Direct DB Verification
    const db = mongoose.connection.db;
    const profile = await db.collection('borrowerprofiles').findOne({ userId: new mongoose.Types.ObjectId(userId) });
    expect(profile).toBeDefined();
    expect(profile.salarySlipUrl).toBe(body.salarySlipUrl);
  });

  test('POST /api/borrower/loan/apply - should reject invalid amount (< ₹50k or > ₹500k)', async () => {
    const res = await fetch(`${BACKEND_URL}/api/borrower/loan/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ loanAmount: 49000, tenure: 90 })
    });
    expect(res.status).toBe(400);
  });

  test('POST /api/borrower/loan/apply - should reject invalid tenure (< 30 days or > 365 days)', async () => {
    const res = await fetch(`${BACKEND_URL}/api/borrower/loan/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ loanAmount: 100000, tenure: 20 })
    });
    expect(res.status).toBe(400);
  });

  test('POST /api/borrower/loan/apply - should successfully submit valid loan application (120,000 for 120 days)', async () => {
    const res = await fetch(`${BACKEND_URL}/api/borrower/loan/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ loanAmount: 120000, tenure: 120 })
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.loan).toBeDefined();
    loanId = body.loan._id;
    expect(body.loan.status).toBe('APPLIED');

    // SI formula: (P * R * T) / (365 * 100) = (120000 * 12 * 120) / 36,500 = 4734.25
    const expectedSI = parseFloat(((120000 * 12 * 120) / 36500).toFixed(2));
    const expectedTotal = parseFloat((120000 + expectedSI).toFixed(2));
    expect(body.loan.simpleInterest).toBe(expectedSI);
    expect(body.loan.totalRepayment).toBe(expectedTotal);
    expect(body.loan.outstandingBalance).toBe(expectedTotal);
  });

  test('POST /api/borrower/loan/apply - should block second active loan', async () => {
    const res = await fetch(`${BACKEND_URL}/api/borrower/loan/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ loanAmount: 50000, tenure: 30 })
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toContain('active loan');
  });

  test('GET /api/borrower/loans - should list borrower\'s active loans', async () => {
    const res = await fetch(`${BACKEND_URL}/api/borrower/loans`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.loans.length).toBe(1);
    expect(body.loans[0]._id).toBe(loanId);
  });
});
