// public/JS/token.js
// Simpele token-teller (schatting, niet exact als OpenAI)

export function countTokens(text) {
  // Simpele schatting: 1 token ≈ 4 tekens (voor GPT-3/4)
  if (!text) return 0;
  return Math.ceil(text.trim().length / 4);
}

export function updateTokenStatus(tokenCount) {
  const el = document.getElementById('st-tokens');
  if (el) el.textContent = `tokens: ${tokenCount}`;
}
