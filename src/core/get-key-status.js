const { loadApiKey } = require("../infra/api-key-store");

function getKeyStatus() {
  const apiKey = loadApiKey();
  // src/core/get-key-status.js
  return { hasKey: !!apiKey };
}

module.exports = { getKeyStatus };