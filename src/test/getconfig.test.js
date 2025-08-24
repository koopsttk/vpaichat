const fs = require('fs');
const path = require('path');
const { getConfig } = require('../core/config.service');
const { logError } = require('../core/logger.service');

const configPath = path.join(__dirname, '../../config/ini.cfg');

describe('getConfig', () => {
  beforeAll(() => {
    // Backup originele config
    fs.copyFileSync(configPath, configPath + '.bak');
  });

  afterAll(() => {
    // Herstel originele config
    fs.copyFileSync(configPath + '.bak', configPath);
    fs.unlinkSync(configPath + '.bak');
  });

  test('haalt data_dir en startobject_file uit ini.cfg', () => {
    try {
      const config = getConfig();
      expect(config.paths.data_dir).toBe('../data');
      expect(config.paths.startobject_file).toMatch(/\.json$/);
    } catch (e) {
      logError('Fout in config test: data_dir/startobject_file ontbreekt', e);
      throw e;
    }
  });

  test('geeft foutmelding bij ontbrekende data_dir', () => {
    // Verwijder data_dir uit config
    let ini = fs.readFileSync(configPath, 'utf-8');
    ini = ini.replace(/data_dir\s*=\s*.*\n/, '');
    fs.writeFileSync(configPath, ini);
    expect(() => getConfig()).toThrow(/data_dir ontbreekt/i);
  });

  test('geeft foutmelding bij ontbrekende startobject_file', () => {
    // Herstel data_dir, verwijder startobject_file
    let ini = fs.readFileSync(configPath + '.bak', 'utf-8');
    ini = ini.replace(/startobject_file\s*=\s*.*\n/, '');
    fs.writeFileSync(configPath, ini);
    expect(() => getConfig()).toThrow(/startobject_file ontbreekt/i);
  });
});