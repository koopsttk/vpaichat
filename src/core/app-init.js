// src/core/app-init.js

const path = require('path');
const fs = require('fs');
const ini = require('ini');
const configPath = path.join(__dirname, '../../config/ini.cfg');
const { getIniConfig } = require('./config.service');

function ensureDataDirectory(config) {
  const dataDir = config.paths?.data_dir || './data';
  if (!fs.existsSync(dataDir)) {
    throw new Error(`Data map ontbreekt: ${dataDir}`);
  }
  return dataDir;
}

module.exports = {
  getIniConfig,
  ensureDataDirectory,
};
