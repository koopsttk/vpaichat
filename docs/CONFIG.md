# VPAICore – CONFIG.md (ini.cfg schema)

`ini.cfg` ondersteunt platte sleutels **of** `[paths]`-sectie.

Sleutels:
- `data_dir` – pad naar `/data` map (mag relatief aan ini.cfg).
- `startobject_file` – bestandsnaam van startobject in `data_dir`.
Alternatieven in `[paths]`:
- `data_dir`, `startobject_file`.

Resolutie:
- `src/core/startObject.js` leest eerst `/init/ini.cfg` (aanbevolen), anders fallback `/config/ini.cfg`.
- Paden worden relatief aan de ini-locatie absoluut gemaakt.
