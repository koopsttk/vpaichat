// src/core/app-init.js

const path = require('path');
const fs = require('fs');
const { getConfig } = require('./config.service');

function ensureDataDirectory() {
  const cfg = getConfig();
  const dataDir = cfg.dataDir;
  if (!fs.existsSync(dataDir)) {
    throw new Error(`Data map ontbreekt: ${dataDir}`);
  }
  return dataDir;
}

module.exports = {
  getConfig,
  ensureDataDirectory,
};
