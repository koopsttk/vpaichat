const fs = require('fs');
const path = require('path');

function assert(cond, msg) { if (!cond) throw new Error(msg || 'Assertion failed'); }

module.exports = async function runTests(tmpDir) {
  const cfgPath = path.join(tmpDir, 'config.json');
  const startFile = 'start.json';
  const dataDir = tmpDir;

  // prepare sample startobject
  const sample = { rol: 'startobject', titel: 'Test', omschrijving: 'desc', created: new Date().toISOString() };
  fs.writeFileSync(path.join(dataDir, startFile), JSON.stringify(sample, null, 2));

  // monkeypatch getConfig in core/config-service
  const configServicePath = path.resolve(__dirname, '..', 'src', 'core', 'config-service.js');
  const cs = require(configServicePath);
  // Replace getConfig to point to our temp dir
  const originalGetConfig = cs.getConfig;
  cs.getConfig = () => ({ dataDir, startFile });

  try {
    const soLoader = require(path.resolve(__dirname, '..', 'src', 'ssot', 'start-object-loader.js'));
    const soService = require(path.resolve(__dirname, '..', 'src', 'ssot', 'start-object-service.js'));

    // readStartObject
    const { obj, soPath } = soLoader.readStartObject();
    assert(obj.titel === 'Test', 'readStartObject should return correct object');

    // update
    const updated = Object.assign({}, obj, { titel: 'Updated' });
    const out = soService.update(updated);
    assert(out.obj.titel === 'Updated', 'update should persist changes');

    // backups
    const backups = soService.listBackups();
    assert(Array.isArray(backups), 'listBackups should return array');

    // restore last
    const restored = soService.restore('last');
    assert(restored.obj, 'restore should return an object');

    console.log('startobject tests passed');
  } finally {
    cs.getConfig = originalGetConfig;
  }
}
