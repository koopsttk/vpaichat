# VPAICore – Architectuur (Huidige versie)

**Doel:** compacte uitleg van de runtime-rollen en koppelingen, afgestemd op de Blauwdruk.

## Huidige functionaliteit

- De app start altijd vanuit het SSOT-startobject (zie `/data`), waarvan het pad uit de config wordt gehaald.
- Gebruikersinterface toont titel/omschrijving uit het startobject.
- Chatfunctionaliteit met AI, waarbij de context en instructies uit het startobject worden gebruikt.
- Alle data-objecten worden als losse JSON-bestanden opgeslagen; wijzigingen worden automatisch geback-upt.
- API-key management via wizard en versleutelde opslag.
- Centrale logging naar `/logs/error.log`.
- Configuratie en paden altijd via `ini.json` (absoluut gemaakt).

## Componenten
- **Electron main (`src/main.js`)** – maakt het venster en registreert IPC. *Geen domeinlogica.*
- **Preload (`src/preload.js`)** – expose `window.api` (IPC proxies). *Geen domeinlogica.*
- **IPC handlers (`src/ipc/*.ipc.js`)** – dunne doorverwijzers naar services.
- **Core services (`src/core/*Service.js`)** – business logica (SSOT/startobject).
- **Infra (`src/infra/*.js`)** – API key store, OpenAI client wrapper.
- **Renderer (`public/JS/*.js`)** – UI/UX, AI-seed bouwen, events, streaming.
- **Data (`/data`)** – JSON objecten + `_index.json`.
- **Config (`/init/ini.json` of `/config/ini.json`)** – paden/instellingen.
