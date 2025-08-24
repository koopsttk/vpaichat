# VPAICore Blauwdruk (v0.3 – August 2025)

## 📖 Samenvatting
Dit document is de **regisseur** van VPAICore.  
Het beschrijft de architectuur, documentatie, afspraken en koppelingen tussen code en data.  
De Blauwdruk fungeert als **Single Source of Truth (SSOT)**: alle andere documenten, code en pakketten verwijzen hiernaar.

---

## 📂 Projectstructuur

- **/src** → broncode (JavaScript/Electron), alleen implementatie + korte inline comments.  
- **/docs** → documentatie, SSOT met detailuitleg en conventies.  
- **/data** → JSON objecten (o.a. startobject), runtime data.  
- **/config** → configuratie (o.a. `ini.cfg`).  
- **/public** → frontend bestanden (`renderer.js`, UI).  

Distributiepakketten:
- `aichat_docs.zip` – volledige documentatie.  
- `aichat_annotated.zip` – code met commentaar.  
- `vpaicore_summary.zip` – samenvattend overzicht.  

---

## 📘 Documentatie & Snelkoppelingen

De detaildocumentatie staat in [`docs/`](docs/):

- 📘 [ARCHITECTURE.md](docs/ARCHITECTURE.md) – Overzicht modules en opzet  
- ⚙️ [CONFIG.md](docs/CONFIG.md) – Configuratie en voorbeelden  
- 🗺️ [ROADMAP.md](docs/ROADMAP.md) – Takenlijst en backlog  
- 📖 [README.md](docs/README.md) – Startpunt documentatie  

### ➕ Extra documentatie
- 📝 [CHANGELOG.md](docs/CHANGELOG.md) – Volledige wijzigingsgeschiedenis  
- 📐 [CONVENTIONS.md](docs/CONVENTIONS.md) – Afspraken over code & documentatie  
- 💬 [PROMPTING.md](docs/PROMPTING.md) – Prompting handleiding voor AI en gebruiker  

📦 Download docs-pakket: [aichat_docs.zip](aichat_docs.zip)

---

## ⚙️ Kernprincipes

1. **SSOT** – Data en documentatie worden altijd centraal beheerd.  
2. **Startobject** – Regelt rol, titel/omschrijving en context. Staat in `/data`, pad vastgelegd via `/init/ini.cfg`.  
3. **Separation of concerns** – Main-process alleen doorverwijzingen; services regelen de logica.  
4. **Transparantie** – Documentatie legt alles uit voor zowel mens als AI.  

---

## 🔗 Belangrijkste koppelingen

- **Startobject Service**  
  - Leest `ini.cfg` om pad te vinden.  
  - Haalt startobject JSON in `/data` op.  
  - Geeft rol, titel en omschrijving door aan renderer.  

- **Renderer**  
  - UI-chatbox.  
  - Vraagt status op via `window.api`.  
  - Toont titel en omschrijving uit startobject.  
  - Stuurt chatvragen door naar AI.  

- **AI**  
  - Wordt gevoed met context (rol, startobject).  
  - Antwoorden volgen conventies uit `docs/CONVENTIONS.md`.  

---

## 📝 Changelog

- **v0.3 – August 2025**
  - Structuur verbeterd en overzichtelijke secties toegevoegd.  
  - Samenvatting bovenaan toegevoegd.  
  - Documentatie-links samengevoegd en verduidelijkt.  

- **v0.2 – August 2025**
  - Sectie *Documentatie & Snelkoppelingen* toegevoegd.  
  - Nieuwe docs toegevoegd: CHANGELOG.md, CONVENTIONS.md, PROMPTING.md  
  - Versie-header bovenaan Blauwdruk.  
  - Roadmap, Architectuur en Config-documentatie geïntegreerd.  

- **v0.1 – July 2025**
  - Eerste versie van de Blauwdruk opgesteld.  
