const fs = require('fs');
const os = require('os');
const path = require('path');

async function run() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vpaicore-test-'));
  try {
    const test = require('./startobject.test');
    await test(tmpDir);
    console.log('All tests completed successfully');
  } catch (e) {
    console.error('Tests failed:', e);
    process.exitCode = 2;
  } finally {
    // Attempt to clean up (best-effort)
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
  }
}

run();
