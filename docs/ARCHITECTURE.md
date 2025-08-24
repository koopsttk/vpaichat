# VPAICore – Architectuur (Huidige versie)

**Doel:** compacte uitleg van de runtime-rollen en koppelingen, afgestemd op de Blauwdruk.

## Componenten
- **Electron main (`src/main.js`)** – maakt het venster en registreert IPC. *Geen domeinlogica.*
- **Preload (`src/preload.js`)** – expose `window.api` (IPC proxies). *Geen domeinlogica.*
- **IPC handlers (`src/ipc/*.ipc.js`)** – dunne doorverwijzers naar services.
- **Core services (`src/core/*Service.js`)** – business logica (SSOT/startobject).
- **Infra (`src/infra/*.js`)** – API key store, OpenAI client wrapper.
- **Renderer (`public/JS/*.js`)** – UI/UX, AI-seed bouwen, events, streaming.
- **Data (`/data`)** – JSON objecten + `_index.json`.
- **Config (`/init/ini.cfg` of `/config/ini.cfg`)** – paden/instellingen.
