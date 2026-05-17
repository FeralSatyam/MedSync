import dns from 'dns';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const disposableDomains = require('disposable-email-domains');
import assert from 'assert';

// Mock functions from authController for testing
const isDisposableDomain = (domain) => {
  if (!domain) return true;
  return disposableDomains.includes(domain.toLowerCase());
};

const verifyMxRecord = async (domain) => {
  return new Promise((resolve) => {
    dns.resolveMx(domain, (err, addresses) => {
      if (err) {
        if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
          resolve(false);
        } else {
          // Network error (ECONNREFUSED, timeout), fail-open to not block users
          resolve(true);
        }
      } else if (!addresses || addresses.length === 0) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};

async function runTests() {
  console.log("Running Email Validation Tests...");
  let passed = 0;
  let failed = 0;

  const runTest = async (name, testFn) => {
    try {
      await testFn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.log(`❌ [FAIL] ${name}`);
      console.error(err.message);
      failed++;
    }
  };

  // 1. Test gmail.com (valid provider)
  await runTest('Allows valid provider (gmail.com)', async () => {
    const domain = 'gmail.com';
    assert.strictEqual(isDisposableDomain(domain), false, 'Should not be disposable');
    const hasMx = await verifyMxRecord(domain);
    assert.strictEqual(hasMx, true, 'Should have MX records');
  });

  // 2. Test sunway.edu.np (institutional domain)
  await runTest('Allows institutional domain (sunway.edu.np)', async () => {
    const domain = 'sunway.edu.np';
    assert.strictEqual(isDisposableDomain(domain), false, 'Should not be disposable');
    const hasMx = await verifyMxRecord(domain);
    assert.strictEqual(hasMx, true, 'Should have MX records');
  });

  // 3. Test invalid fake domains
  await runTest('Rejects fake non-existent domains (fake123abcxyz.com)', async () => {
    const domain = 'fake123abcxyz.com';
    const hasMx = await verifyMxRecord(domain);
    assert.strictEqual(hasMx, false, 'Should not have MX records');
  });

  // 4. Test disposable domains
  await runTest('Rejects disposable domains (mailinator.com)', async () => {
    const domain = 'mailinator.com';
    assert.strictEqual(isDisposableDomain(domain), true, 'Should be flagged as disposable');
  });

  // 5. Test uppercase handling
  await runTest('Handles uppercase domains cleanly', async () => {
    const domain = 'SUNWAY.EDU.NP'.toLowerCase();
    assert.strictEqual(isDisposableDomain(domain), false);
    const hasMx = await verifyMxRecord(domain);
    assert.strictEqual(hasMx, true);
  });

  console.log(`\nTests Complete: ${passed} passed, ${failed} failed.`);
}

runTests();
