const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

function logError(message, error) {
  const logFile = path.join(logDir, 'error.log');
  const time = new Date().toISOString();
  const entry = `[${time}] ${message}${error ? ' - ' + error.stack : ''}\n`;
  fs.appendFileSync(logFile, entry);
  console.error(message, error);
}

module.exports = { logError };