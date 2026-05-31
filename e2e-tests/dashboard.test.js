import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/api/src/config/.env') });

const DB_URL = process.env.DB_URL || 'mongodb://localhost:27017/lms';
const BACKEND_URL = 'http://localhost:8000';

const BORROWER_EMAIL = 'dashboard_flow_borrower@lms.com';
const BORROWER_PASSWORD = 'password123';

// Executive Credentials (pre-seeded)
const salesCreds = { email: 'sales@lms.com', password: 'sales123' };
const sanctionCreds = { email: 'sanction@lms.com', password: 'sanction123' };
const disbursementCreds = { email: 'disbursement@lms.com', password: 'disbursement123' };
const collectionCreds = { email: 'collection@lms.com', password: 'collection123' };

let borrowerToken = null;
let borrowerUserId = null;
let profileId = null;
let loanId = null;

let salesToken = null;
let sanctionToken = null;
let disbursementToken = null;
let collectionToken = null;

let sanctionExecutiveId = null;
let disbursementExecutiveId = null;
let collectionExecutiveId = null;
let partialUtr = null;
let finalUtr = null;

beforeAll(async () => {
  try {
    partialUtr = `UTR-E2E-PARTIAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    finalUtr = `UTR-E2E-FINAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Attempt database connection with a tight 3s timeout to fail fast on IP whitelisting errors
    await mongoose.connect(DB_URL, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000
    });
    const db = mongoose.connection.db;

    // Clean up any test user from previous runs
    const existingUser = await db.collection('users').findOne({ email: BORROWER_EMAIL });
    if (existingUser) {
      const uId = existingUser._id;
      const loans = await db.collection('loans').find({ borrowerId: uId }).toArray();
      const loanIds = loans.map(l => l._id);
      // await db.collection('payments').deleteMany({ loanId: { $in: loanIds } });
      // await db.collection('loans').deleteMany({ borrowerId: uId });
      // await db.collection('borrowerprofiles').deleteMany({ userId: uId });
      // await db.collection('users').deleteOne({ _id: uId });
    }

    // Fetch executive user IDs directly from DB
    const salesUser = await db.collection('users').findOne({ email: salesCreds.email });
    const sanctionUser = await db.collection('users').findOne({ email: sanctionCreds.email });
    if (sanctionUser) sanctionExecutiveId = sanctionUser._id.toString();
    const disbursementUser = await db.collection('users').findOne({ email: disbursementCreds.email });
    if (disbursementUser) disbursementExecutiveId = disbursementUser._id.toString();
    const collectionUser = await db.collection('users').findOne({ email: collectionCreds.email });
    if (collectionUser) collectionExecutiveId = collectionUser._id.toString();

    // 1. Register borrower
    let res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dashboard Borrower User',
        email: BORROWER_EMAIL,
        password: BORROWER_PASSWORD
      })
    });
    let data = await res.json();
    borrowerToken = data.token;
    borrowerUserId = data.user.id;

    // 2. Submit passing profile details
    res = await fetch(`${BACKEND_URL}/api/borrower/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${borrowerToken}`
      },
      body: JSON.stringify({
        fullName: 'Dashboard Borrower User',
        pan: 'ABCDE1234F',
        dateOfBirth: '1990-01-01',
        monthlySalary: 50000,
        employmentMode: 'SALARIED'
      })
    });
    data = await res.json();
    profileId = data.profile._id;

    // 3. Upload Salary Slip
    const formData = new FormData();
    const fileBlob = new Blob(['MOCK_SALARY_SLIP'], { type: 'application/pdf' });
    formData.append('salarySlip', fileBlob, 'slip.pdf');
    res = await fetch(`${BACKEND_URL}/api/borrower/salary-slip`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${borrowerToken}` },
      body: formData
    });

    // 4. Apply for a loan of ₹100,000 for 90 days
    res = await fetch(`${BACKEND_URL}/api/borrower/loan/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${borrowerToken}`
      },
      body: JSON.stringify({ loanAmount: 100000, tenure: 90 })
    });
    data = await res.json();
    loanId = data.loan._id;

    // 5. Get Executive Tokens
    res = await fetch(`${BACKEND_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(salesCreds)
    });
    salesToken = (await res.json()).token;

    res = await fetch(`${BACKEND_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanctionCreds)
    });
    sanctionToken = (await res.json()).token;

    res = await fetch(`${BACKEND_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(disbursementCreds)
    });
    disbursementToken = (await res.json()).token;

    res = await fetch(`${BACKEND_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collectionCreds)
    });
    collectionToken = (await res.json()).token;
  } catch (err) {
    console.error(err.message);
    throw err;
  }
});

afterAll(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      const db = mongoose.connection.db;
      const user = await db.collection('users').findOne({ email: BORROWER_EMAIL });
      if (user) {
        const uId = user._id;
        const loans = await db.collection('loans').find({ borrowerId: uId }).toArray();
        const loanIds = loans.map(l => l._id);
        await db.collection('payments').deleteMany({ loanId: { $in: loanIds } });
        await db.collection('loans').deleteMany({ borrowerId: uId });
        await db.collection('borrowerprofiles').deleteMany({ userId: uId });
        await db.collection('users').deleteOne({ _id: uId });
      }
    }
  } catch (err) {
    // Ignore cleanup errors if connection failed
  } finally {
    await mongoose.disconnect();
  }
});

describe('Dashboard Operations (Sales, Sanction, Disbursement, Collection)', () => {

  test('Sales: GET /api/dashboard/sales/leads - should not list borrower as lead (already has loan)', async () => {
    const res = await fetch(`${BACKEND_URL}/api/dashboard/sales/leads`, {
      headers: { 'Authorization': `Bearer ${salesToken}` }
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    const isLead = body.leads.some(l => l.email === BORROWER_EMAIL);
    expect(isLead).toBe(false);
  });

  test('Sanction: GET /api/dashboard/sanction/loans - should display the newly applied loan', async () => {
    const res = await fetch(`${BACKEND_URL}/api/dashboard/sanction/loans`, {
      headers: { 'Authorization': `Bearer ${sanctionToken}` }
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    const ourLoan = body.loans.find(l => l._id === loanId);
    expect(ourLoan).toBeDefined();
    expect(ourLoan.status).toBe('APPLIED');
  });

  test('Sanction: PATCH /api/dashboard/sanction/loans/:id/approve - should approve the loan successfully', async () => {
    const res = await fetch(`${BACKEND_URL}/api/dashboard/sanction/loans/${loanId}/approve`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${sanctionToken}` }
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.loan.status).toBe('SANCTIONED');

    // Direct DB check
    const db = mongoose.connection.db;
    const loanDoc = await db.collection('loans').findOne({ _id: new mongoose.Types.ObjectId(loanId) });
    expect(loanDoc.status).toBe('SANCTIONED');
    expect(loanDoc.sanctionedBy.toString()).toBe(sanctionExecutiveId);
  });

  test('Disbursement: GET /api/dashboard/disbursement/loans - should display the sanctioned loan', async () => {
    const res = await fetch(`${BACKEND_URL}/api/dashboard/disbursement/loans`, {
      headers: { 'Authorization': `Bearer ${disbursementToken}` }
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    const ourLoan = body.loans.find(l => l._id === loanId);
    expect(ourLoan).toBeDefined();
    expect(ourLoan.status).toBe('SANCTIONED');
  });

  test('Disbursement: PATCH /api/dashboard/disbursement/loans/:id/disburse - should disburse the loan', async () => {
    const res = await fetch(`${BACKEND_URL}/api/dashboard/disbursement/loans/${loanId}/disburse`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${disbursementToken}` }
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.loan.status).toBe('DISBURSED');

    // Direct DB check
    const db = mongoose.connection.db;
    const loanDoc = await db.collection('loans').findOne({ _id: new mongoose.Types.ObjectId(loanId) });
    expect(loanDoc.status).toBe('DISBURSED');
    expect(loanDoc.disbursedBy.toString()).toBe(disbursementExecutiveId);
  });

  test('Collection: GET /api/dashboard/collection/loans - should display the active disbursed loan', async () => {
    const res = await fetch(`${BACKEND_URL}/api/dashboard/collection/loans`, {
      headers: { 'Authorization': `Bearer ${collectionToken}` }
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    const ourLoan = body.loans.find(l => l._id === loanId);
    expect(ourLoan).toBeDefined();
    expect(ourLoan.status).toBe('DISBURSED');
  });

  test('Collection: POST /api/dashboard/collection/loans/:id/payment - should reject payment amount exceeding outstanding balance', async () => {
    const res = await fetch(`${BACKEND_URL}/api/dashboard/collection/loans/${loanId}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${collectionToken}`
      },
      body: JSON.stringify({
        utrNumber: 'UTR-EXCEED',
        amount: 300000,
        date: '2026-05-30'
      })
    });
    expect(res.status).toBe(400);
  });

  test('Collection: POST /api/dashboard/collection/loans/:id/payment - should record partial payment successfully', async () => {
    const res = await fetch(`${BACKEND_URL}/api/dashboard/collection/loans/${loanId}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${collectionToken}`
      },
      body: JSON.stringify({
        utrNumber: partialUtr,
        amount: 40000,
        date: '2026-05-30'
      })
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.payment).toBeDefined();
    expect(body.loan.amountPaid).toBe(40000);
    expect(body.loan.status).toBe('DISBURSED');
  });

  test('Collection: POST /api/dashboard/collection/loans/:id/payment - should block duplicate UTR number', async () => {
    const res = await fetch(`${BACKEND_URL}/api/dashboard/collection/loans/${loanId}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${collectionToken}`
      },
      body: JSON.stringify({
        utrNumber: partialUtr,
        amount: 5000,
        date: '2026-05-30'
      })
    });
    expect(res.status).toBe(400);
  });

  test('Collection: POST /api/dashboard/collection/loans/:id/payment - should record final payment and CLOSE the loan', async () => {
    const db = mongoose.connection.db;
    const loanDoc = await db.collection('loans').findOne({ _id: new mongoose.Types.ObjectId(loanId) });
    const remainingBalance = loanDoc.outstandingBalance;

    const res = await fetch(`${BACKEND_URL}/api/dashboard/collection/loans/${loanId}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${collectionToken}`
      },
      body: JSON.stringify({
        utrNumber: finalUtr,
        amount: remainingBalance,
        date: '2026-05-30'
      })
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.loan.status).toBe('CLOSED');
    expect(body.loan.outstandingBalance).toBe(0);

    // Direct DB check
    const loanDocAfter = await db.collection('loans').findOne({ _id: new mongoose.Types.ObjectId(loanId) });
    expect(loanDocAfter.status).toBe('CLOSED');
    expect(loanDocAfter.outstandingBalance).toBe(0);
    expect(loanDocAfter.closedAt).toBeDefined();
  });

  test('Collection: GET /api/dashboard/collection/loans/:id/payments - should fetch all recorded payments', async () => {
    const res = await fetch(`${BACKEND_URL}/api/dashboard/collection/loans/${loanId}/payments`, {
      headers: { 'Authorization': `Bearer ${collectionToken}` }
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.payments.length).toBe(2);
    const finalPaymentDoc = body.payments.find(p => p.utrNumber === finalUtr);
    const partialPaymentDoc = body.payments.find(p => p.utrNumber === partialUtr);
    expect(finalPaymentDoc).toBeDefined();
    expect(partialPaymentDoc).toBeDefined();
    expect(body.loan.status).toBe('CLOSED');
  });
});
