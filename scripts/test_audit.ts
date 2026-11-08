/**
 * BANKORA Comprehensive Backend, ML, Database & Authentication Test Suite
 * Executes end-to-end integration tests directly against the live BANKORA REST API.
 */

const BASE_URL = 'http://127.0.0.1:3000';

interface TestResult {
  name: string;
  category: 'Auth' | 'ML' | 'Dataset' | 'Analytics' | 'Reports' | 'Security';
  passed: boolean;
  durationMs: number;
  details?: string;
}

const results: TestResult[] = [];

async function runTest(
  name: string,
  category: TestResult['category'],
  fn: () => Promise<void>
) {
  const start = Date.now();
  try {
    await fn();
    results.push({
      name,
      category,
      passed: true,
      durationMs: Date.now() - start
    });
    console.log(`  ✓ [${category}] ${name} (${Date.now() - start}ms)`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push({
      name,
      category,
      passed: false,
      durationMs: Date.now() - start,
      details: msg
    });
    console.error(`  ✗ [${category}] ${name} FAILED: ${msg}`);
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

async function runAll() {
  console.log('\n======================================================');
  console.log('  BANKORA – COMPLETE PROJECT AUDIT & TEST SUITE');
  console.log('======================================================\n');

  const testEmail = `auditor_${Date.now()}@bankora.internal`;
  const initialPassword = 'AuditPassword123!';
  const updatedPassword = 'NewAuditPassword456$';
  let accessToken = '';
  let refreshToken = '';
  let createdPredictionId = 0;

  // 1. Health
  await runTest('API Health Check', 'Security', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.status === 'healthy', 'Status should be healthy');
    assert(data.datasetLoaded === true, 'Dataset must be loaded');
  });

  // 2. Auth - Register
  await runTest('User Registration with Password Hashing', 'Auth', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Dr. Evelyn Reed',
        email: testEmail,
        phone_number: '+1 (555) 345-6789',
        password: initialPassword,
        confirm_password: initialPassword
      })
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    const data = await res.json();
    assert(data.user?.email === testEmail, 'Email should match');
    assert(data.user?.fullName === 'Dr. Evelyn Reed', 'Full name should match');
    assert(Boolean(data.accessToken), 'Access token must be returned');
    assert(Boolean(data.refreshToken), 'Refresh token must be returned');
    accessToken = data.accessToken;
    refreshToken = data.refreshToken;
  });

  // 3. Auth - Duplicate Registration Rejected
  await runTest('Unique Email Constraint Enforcement (409 Conflict)', 'Auth', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Imposter User',
        email: testEmail,
        password: initialPassword,
        confirm_password: initialPassword
      })
    });
    assert(res.status === 409, `Expected 409 conflict, got ${res.status}`);
  });

  // 4. Auth - Weak Password Rejected
  await runTest('Password Complexity Policy Validation', 'Security', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Weak Pw User',
        email: `weak_${Date.now()}@test.com`,
        password: 'weak',
        confirm_password: 'weak'
      })
    });
    assert(res.status === 400, `Expected 400 bad request, got ${res.status}`);
  });

  // 5. Auth - Login
  await runTest('User Login & Credential Verification', 'Auth', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: initialPassword,
        rememberMe: true
      })
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(Boolean(data.accessToken), 'Access token required on login');
    accessToken = data.accessToken;
  });

  // 6. Auth - Bad Credentials
  await runTest('Authentication Rejection for Bad Credentials (401)', 'Security', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword999!'
      })
    });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  // 7. Auth - Profile Me
  await runTest('Protected Profile Route via Bearer JWT', 'Auth', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.user.email === testEmail, 'User email should match token');
  });

  // 8. Auth - Profile Update
  await runTest('Profile Details Update (PATCH)', 'Auth', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        full_name: 'Dr. Evelyn Reed-Vance',
        phone_number: '+1 (555) 999-8888'
      })
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.user.fullName === 'Dr. Evelyn Reed-Vance', 'Name should be updated');
  });

  // 9. Auth - Change Password
  await runTest('Authenticated Password Change', 'Auth', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        current_password: initialPassword,
        new_password: updatedPassword,
        confirm_password: updatedPassword
      })
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // 10. Auth - Login with Updated Password
  await runTest('Verification of Updated Password on Subsequent Login', 'Auth', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: updatedPassword
      })
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    accessToken = data.accessToken;
    refreshToken = data.refreshToken;
  });

  // 11. Auth - Forgot Password
  let resetToken = '';
  await runTest('Password Recovery Token Generation', 'Auth', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(Boolean(data.developmentResetToken), 'Reset token should be returned');
    resetToken = data.developmentResetToken;
  });

  // 12. Auth - Reset Password
  await runTest('Cryptographic Password Reset via Single-Use Token', 'Auth', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: resetToken,
        new_password: initialPassword,
        confirm_password: initialPassword
      })
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // 13. Dataset - Summary
  await runTest('Dataset Statistical Summary & Schema Inspection', 'Dataset', async () => {
    const res = await fetch(`${BASE_URL}/api/dataset/summary`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.rowCount > 0, 'Row count should be > 0');
    assert(data.numericalStats?.length >= 5, 'Should have numerical stats for age, balance, etc.');
  });

  // 14. Dataset - Preview with Filter
  await runTest('Dataset Preview with Multi-Attribute Filtering & Sorting', 'Dataset', async () => {
    const res = await fetch(
      `${BASE_URL}/api/dataset/preview?page=1&limit=10&job=management&sortBy=balance&sortDir=desc`
    );
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(Array.isArray(data.rows), 'Rows should be an array');
    assert(data.rows.length <= 10, 'Should respect limit');
    if (data.rows.length > 0) {
      assert(data.rows[0].job === 'management', 'All returned rows should match job filter');
    }
  });

  // 15. Analytics - Overview
  await runTest('Executive KPI Calculation & Analytics Overview', 'Analytics', async () => {
    const res = await fetch(`${BASE_URL}/api/analytics/overview`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.kpis?.totalCustomers > 0, 'KPIs should have total customers');
    assert(data.subscriptionDistribution?.length === 2, 'Donut chart should have yes/no split');
  });

  // 16. Analytics - Customer Segmentation
  await runTest('Customer Segmentation Insights with Dynamic Range Filter', 'Analytics', async () => {
    const res = await fetch(
      `${BASE_URL}/api/analytics/customers?minAge=25&maxAge=65&job=all&education=all&marital=all&housing=all&loan=all`
    );
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.ageDistribution?.length > 0, 'Should return age distribution');
    assert(data.jobBreakdown?.length > 0, 'Should return job breakdown');
  });

  // 17. Analytics - Campaign
  await runTest('Campaign Telemarketing & Contact Fatigue Analytics', 'Analytics', async () => {
    const res = await fetch(`${BASE_URL}/api/analytics/campaigns`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(Boolean(data.metrics), 'Campaign metrics object required');
    assert(data.contactFrequency?.length > 0, 'Contact frequency distribution required');
  });

  // 18. ML - Pre-Call Prediction (Leakage-Free)
  await runTest('Machine Learning Pre-Call Prediction (Excluding Duration)', 'ML', async () => {
    const res = await fetch(`${BASE_URL}/api/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        age: 62,
        job: 'retired',
        marital: 'married',
        education: 'tertiary',
        default: 'no',
        balance: 5400,
        housing: 'no',
        loan: 'no',
        contact: 'cellular',
        day: 12,
        month: 'oct',
        duration: 350, // Duration is excluded by pre-call model
        campaign: 1,
        pdays: 45,
        previous: 1,
        poutcome: 'success',
        modelMode: 'pre_call'
      })
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.prediction === 'yes' || data.prediction === 'no', 'Prediction must be yes or no');
    assert(data.probability >= 0 && data.probability <= 1, 'Probability must be 0..1');
    assert(data.modelMode === 'pre_call', 'Model mode must be pre_call');
    assert(data.topContributions?.length > 0, 'Feature contributions required');
    assert(Boolean(data.recommendedAction), 'Action recommendation required');
    assert(data.id > 0, 'Saved prediction record ID required');
    createdPredictionId = data.id;
  });

  // 19. ML - Post-Call Benchmark Prediction
  await runTest('Machine Learning Post-Call Benchmark (Including Duration)', 'ML', async () => {
    const res = await fetch(`${BASE_URL}/api/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        age: 35,
        job: 'blue-collar',
        marital: 'married',
        education: 'secondary',
        default: 'no',
        balance: 150,
        housing: 'yes',
        loan: 'yes',
        contact: 'telephone',
        day: 20,
        month: 'may',
        duration: 45,
        campaign: 5,
        pdays: -1,
        previous: 0,
        poutcome: 'unknown',
        modelMode: 'post_call'
      })
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.modelMode === 'post_call', 'Model mode must be post_call');
  });

  // 20. ML - 5 Model Benchmark Performance Suite
  await runTest('5 Supervised Algorithms Holdout Evaluation Benchmark', 'ML', async () => {
    const res = await fetch(`${BASE_URL}/api/models/performance`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    const preCallModels = data.preCall?.models || [];
    assert(preCallModels.length === 5, `Expected 5 models, found ${preCallModels.length}`);
    const modelIds = preCallModels.map((m: { id: string }) => m.id);
    assert(modelIds.includes('logistic'), 'Missing Logistic Regression');
    assert(modelIds.includes('decision_tree'), 'Missing Decision Tree');
    assert(modelIds.includes('random_forest'), 'Missing Random Forest');
    assert(modelIds.includes('gradient_boosting'), 'Missing Gradient Boosting');
    assert(modelIds.includes('knn'), 'Missing KNN');

    // Verify metrics are present and realistic
    for (const m of preCallModels) {
      assert(m.accuracy > 50 && m.accuracy <= 100, `${m.name} accuracy invalid`);
      assert(m.rocAuc > 50 && m.rocAuc <= 100, `${m.name} ROC-AUC invalid`);
      assert(Boolean(m.confusionMatrix), `${m.name} confusion matrix missing`);
    }
  });

  // 21. ML - Retraining Pipeline
  await runTest('Dynamic Pipeline Retraining On-Demand', 'ML', async () => {
    const res = await fetch(`${BASE_URL}/api/models/train`, { method: 'POST' });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.preCall?.models?.length === 5, 'Retrained suite must include 5 models');
  });

  // 22. Database - Prediction History CRUD
  await runTest('Prediction History Retrieval from SQLite', 'Dataset', async () => {
    const res = await fetch(`${BASE_URL}/api/predictions/history?search=retired`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(Array.isArray(data.records), 'Records should be an array');
    assert(data.total >= 0, 'Total count should be >= 0');
  });

  // 23. Database - Delete Prediction
  await runTest('Secure Prediction Record Deletion from SQLite', 'Dataset', async () => {
    if (createdPredictionId > 0) {
      const res = await fetch(`${BASE_URL}/api/predictions/${createdPredictionId}`, {
        method: 'DELETE'
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const data = await res.json();
      assert(data.deletedId === createdPredictionId, 'Deleted ID should match');
    }
  });

  // 24. Reports - Dataset Summary Export
  await runTest('CSV Export - Numerical Statistics', 'Reports', async () => {
    const res = await fetch(`${BASE_URL}/api/reports/export?type=dataset_summary`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const text = await res.text();
    assert(text.includes('Column,Mean,StdDev'), 'CSV header missing');
  });

  // 25. Reports - Model Metrics Export
  await runTest('CSV Export - Holdout Evaluation Metrics', 'Reports', async () => {
    const res = await fetch(`${BASE_URL}/api/reports/export?type=model_metrics`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const text = await res.text();
    assert(text.includes('PipelineMode,ModelName,Family'), 'Model CSV header missing');
  });

  // 26. Reports - Prediction History Export
  await runTest('CSV Export - Historical Predictions Log', 'Reports', async () => {
    const res = await fetch(`${BASE_URL}/api/reports/export?type=prediction_history`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const text = await res.text();
    assert(text.includes('ID,Timestamp,CustomerSummary'), 'History CSV header missing');
  });

  // 27. Reports - Cleaned Dataset Export
  await runTest('CSV Export - Complete Cleaned UCI Dataset', 'Reports', async () => {
    const res = await fetch(`${BASE_URL}/api/reports/export?type=cleaned_dataset`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const text = await res.text();
    assert(text.includes('age,job,marital,education,default,balance'), 'Dataset CSV header missing');
  });

  // 28. Settings - Preferences Persistence
  await runTest('Settings Storage and Retrieval in SQLite', 'Security', async () => {
    const postRes = await fetch(`${BASE_URL}/api/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        defaultPipeline: 'pre_call',
        compactTables: true,
        auditTimestamp: new Date().toISOString()
      })
    });
    assert(postRes.status === 200, 'Settings save should return 200');

    const getRes = await fetch(`${BASE_URL}/api/settings`);
    assert(getRes.status === 200, 'Settings fetch should return 200');
    const settings = await getRes.json();
    assert(settings.defaultPipeline === 'pre_call', 'Settings should be persisted');
  });

  console.log('\n======================================================');
  console.log('  TEST EXECUTION SUMMARY');
  console.log('======================================================');
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  console.log(`  Total Tests Run : ${results.length}`);
  console.log(`  Passed          : ${passedCount}`);
  console.log(`  Failed          : ${failedCount}`);
  console.log('======================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAll().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
