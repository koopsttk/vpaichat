# Copilot Instructions for VPAICore (Electron/Node/AI Chat)

## Projectoverzicht
- **Electron-app** met duidelijke scheiding tussen main process, preload, IPC, core services, infra, en renderer (frontend).
- **Single Source of Truth (SSOT):** Het startobject (JSON in `/data`) bepaalt de AI-context en UI-titel/omschrijving. Pad naar startobject via `/init/ini.cfg` of `/config/ini.cfg`.
- **Configuratie:** Paden en instellingen in `ini.cfg` (zie `docs/CONFIG.md`). Paden altijd omzetten naar absoluut met `path.resolve(path.dirname(iniPath), relPath)`.
- **Data:** Alle objecten als losse JSON-bestanden in `/data`, met index (`_index.json`).

## Belangrijkste componenten
- `src/main.js`: Electron entrypoint, maakt venster, registreert IPC, geen business logic.
- `src/preload.js`: Exposeert veilige API naar renderer via `contextBridge`.
- `src/ipc/*.ipc.js`: IPC-handlers, dunne doorverwijzers naar services.
- `src/core/*Service.js`: Businesslogica (startobject, SSOT, backups).
- `src/infra/*.js`: Infra (API-key opslag, OpenAI client wrapper).
- `public/JS/*.js`: Renderer (UI, events, AI-chat, status, system prompt).

## Patronen & Conventies
- **main.js is dun:** Alleen window management en IPC-registratie.
- **Paden uit config altijd absoluut maken** (zie `getConfig()` in `src/core/getconfig.js`).
- **IPC:** Renderer praat alleen via preload bridge (`window.api`) met main process.
- **Startobject:** Wordt altijd geladen via pad uit config, nooit hardcoded.
- **Logging:** Centrale logging naar `/logs/error.log` via `src/core/logger.js`.
- **Testen:** Zie `src/test/getconfig.test.js` voor config-validatie.

## Developer workflows
- **Starten:** Gebruik `npm run start` of `start.bat`/`start.cmd` (start Electron-app).
- **Debuggen:** DevTools openen automatisch na window-creation in `main.js`.
- **Installatie:** Eerste installatie via `Install/` scripts, maakt data en config aan.
- **API-key:** Wordt versleuteld opgeslagen in `config/apikey.enc`, beheer via key-wizard.

## Best practices voor AI agents
- **Respecteer de SSOT-structuur:** Haal altijd paden en settings uit config, niet hardcoded.
- **Gebruik bestaande helpers:** Voor paden (`fileHelpers.js`), logging (`logger.js`), en data (`startObjectService.js`).
- **Volg de IPC-structuur:** Voeg nieuwe IPC-kanalen toe via `src/ipc/registerIpc.js` en aparte `*.ipc.js` modules.
- **Documentatie:** Raadpleeg altijd `/docs/ARCHITECTURE.md` en `/docs/CONFIG.md` voor structuur en voorbeelden.
- **Let op platform-paden:** Gebruik altijd `path.join`/`path.resolve` voor bestands- en directorynamen.

## Voorbeeld: Pad uit config ophalen
```js
const { getConfig } = require('./core/getconfig');
const config = getConfig();
console.log(config.dataDir); // altijd absoluut pad
```

## Kernbestanden
- `src/core/getconfig.js` – config loader (let op: altijd absoluut pad!)
- `src/core/logger.js` – centrale logging
- `src/core/startObjectService.js` – startobject CRUD/backups
- `src/ipc/registerIpc.js` – IPC registry
- `public/JS/app.js` – renderer entrypoint

---
Zie ook: `/docs/ARCHITECTURE.md`, `/docs/CONFIG.md`, `/docs/ROADMAP.md` voor meer details.
