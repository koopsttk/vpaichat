document.getElementById('save-google-key').addEventListener('click', async () => {
  const googleKey = document.getElementById('google-key').value.trim();
  const feedback = document.getElementById('google-feedback');

  if (!googleKey) {
    feedback.textContent = 'Voer een geldige Google API key in.';
    return;
  }

  try {
    // key.html is normally loaded in the key-wizard window which exposes `keyWizard` via preload.
    // As a fallback, the main preload exposes `api.saveGoogleKey` too.
    if (window.keyWizard && typeof window.keyWizard.saveGoogleKey === 'function') {
      await window.keyWizard.saveGoogleKey(googleKey);
    } else if (window.api && typeof window.api.saveGoogleKey === 'function') {
      await window.api.saveGoogleKey(googleKey);
    } else {
      throw new Error('Geen IPC-brug beschikbaar voor het opslaan van de key');
    }
    feedback.textContent = 'Google API key succesvol opgeslagen!';
  } catch (err) {
    console.error('[key.js] save-google-key fout:', err);
    feedback.textContent = 'Fout bij het opslaan van de Google API key.';
  }
});
