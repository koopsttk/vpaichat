Kort overzicht
---------------
Bestand `ssot-service.js` is bewust verwijderd uit deze map omdat het op het moment van verwijdering geen actieve verwijzingen of IPC‑handlers had en daardoor verwarring veroorzaakte.

Doel van dit document
--------------------
Leg uit waarom het bestand verwijderd is, en geef een compact plan en concrete richtlijnen om de SSOT‑service later opnieuw, modulair en volgens projectconventies op te bouwen.

Waarom verwijderd
-----------------
- Het bestand werd nergens geimporteerd of aangeroepen.
- De renderer verwacht enkele `ssot:` IPC‑kanalen, maar die waren niet geregistreerd in de main process.
- De applicatie gebruikt momenteel `start-object-service.js` voor het startobject/SSOT flows — duplicatie vermijden.

Aanpak voor herbouw (kort)
--------------------------
1) Besluit scope: wil je algemene object‑indexing/crud (zoals het oude bestand) óf een beperkte SSOT‑manager die alleen het startobject beheert?
   - Advies: laat `start-object-service.js` verantwoordelijkheid voor het "startobject".
   - Bouw een aparte, generieke `ssot` module alleen als je meerdere objecttypes wilt beheren.

2) Recommended file layout
   - `src/core/ssot/index.js` — hoofd‑export (lichtgewicht orchestrator)
   - `src/core/ssot/indexer.js` — index (_index.json) lezen/schrijven
   - `src/core/ssot/crud.js` — create/read/update/delete operaties
   - `src/core/ssot/loader.js` — paden resolven, config checks (hergebruik `app-init` / `file-helpers`)
   - `src/ipc/ssot.ipc.js` — ipcMain handlers die de service blootstellen aan renderer

3) Contract (2–3 bullets)
   - Inputs: JSON objecten met expliciete `rol` en optionele `titel`/`id`.
   - Outputs: geparste objecten of indexarrays; errors gooien met duidelijke meldingen.
   - Succes: atomic writes voor bestanden; `_index.json` consistent bijwerken; backups bij update.

4) Randgevallen & opsporing
   - Corrupt indexbestand -> loggen en fail-safe: backup terugzetten of rename.
   - Gelijktijdige writes -> gebruik atomic rename (reeds in `file-helpers`) en overweeg file locking mechanisme.
   - Ontbrekende dataDir -> maak directory met `ensureDir` (gebruik `app-init` helpers).

5) Hergebruik bestaande helpers
   - `../utils/file-helpers` — gebruikt voor `writeJSONAtomic`, `readJSON`, `utcStampTight`, `ensureDir`.
   - `./app-init` of `config-service` — config ophalen en paden resolven.
   - `logger-service` — foutmeldingen naar `logs/error.log`.

6) IPC en preload
   - Voeg een `src/ipc/ssot.ipc.js` toe en registreer handlers in `src/ipc/register-ipc.js` (of importeer het automatisch vanuit die module).
   - Preload verwacht: `ssot:aiCreateObject`, `ssot:updateField`, `ssot:openObject`. Zorg dat handlers dezelfde contracten gebruiken.

7) Tests & kwaliteit
   - Kleine unit tests: index read/write (happy path + corrupt file), create/update + index update, restore backups.
   - Plaats tests onder `src/test/ssot.*.test.js` en gebruik bestaande testconfiguratie als referentie.

Voorbeeld checklist voor implementatie
------------------------------------
- [ ] Bepaal scope (startobject-only of generiek)
- [ ] Maak `src/core/ssot` map en split helpers
- [ ] Implementeer atomic file operations + index management
- [ ] Voeg `src/ipc/ssot.ipc.js` toe en registreer handlers
- [ ] Schrijf 3 unit tests (index, create, update+backup)
- [ ] Run lint/build/tests en verifieer geen regressies

Kort advies
-----------
Begin klein: als je alleen het startobject wil beheren, blijf bij `start-object-service.js` en voeg ICP handlers daarbuiten toe. Bouw pas een generieke `ssot` service als meerdere objecttypes en indexering buiten het startobject nodig zijn.

Als je wilt, kan ik nu direct een scaffold aanmaken (bestanden + minimale implementatie + 2 tests) of alleen `src/ipc/ssot.ipc.js` aanmaken die de preload‑kanalen afhandelt en fouttolerant reageert. Geef aan welke je wil.
