const { loadApiKey } = require("../infra/api-key-store");

function getKeyStatus() {
  const apiKey = loadApiKey();
  return { hasKey: !!apiKey };
}

module.exports = { getKeyStatus };