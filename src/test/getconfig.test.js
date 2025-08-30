const fs = require('fs');
const path = require('path');
const { getConfig } = require('../core/config-service');
const { logError } = require('../core/logger-service');

const configPath = path.join(__dirname, '../../config/ini.json');

describe('getConfig', () => {
  beforeAll(() => {
    // Backup originele config
    if (fs.existsSync(configPath)) fs.copyFileSync(configPath, configPath + '.bak');
  });

  afterAll(() => {
    // Herstel originele config
    if (fs.existsSync(configPath + '.bak')) {
      fs.copyFileSync(configPath + '.bak', configPath);
      fs.unlinkSync(configPath + '.bak');
    }
  });

  test('haalt data_dir en startobject_file uit ini.json', () => {
  const config = getConfig();
  expect(config.dataDir).toMatch(/data/i);
  expect(config.startFile).toMatch(/\.json$/);
  });

  test('geeft foutmelding bij ontbrekende data_dir', () => {
    // Verwijder data_dir uit config
  const obj = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  delete obj.paths.data_dir;
  fs.writeFileSync(configPath, JSON.stringify(obj, null, 2));
  expect(() => getConfig()).toThrow(/data_dir ontbreekt/i);
  });

  test('geeft foutmelding bij ontbrekende startobject_file', () => {
    // Herstel data_dir, verwijder startobject_file
  const obj = JSON.parse(fs.readFileSync(configPath + '.bak', 'utf-8'));
  delete obj.paths.startobject_file;
  fs.writeFileSync(configPath, JSON.stringify(obj, null, 2));
  expect(() => getConfig()).toThrow(/startobject_file ontbreekt/i);
  });
});