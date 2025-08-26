const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function utcTimestamp() {
  const now = new Date();
  const pad = (n, l = 2) => String(n).padStart(l, "0");
  return (
    now.getUTCFullYear() + "-" +
    pad(now.getUTCMonth() + 1) + "-" +
    pad(now.getUTCDate()) + "T" +
    pad(now.getUTCHours()) +
    pad(now.getUTCMinutes()) +
    pad(now.getUTCSeconds()) +
    pad(now.getUTCMilliseconds(), 3) + "Z"
  );
}

function uuid() {
  return crypto.randomUUID();
}

function eersteInstallatie() {
  const baseDir = path.resolve(__dirname, "..");
  const iniDir = path.join(baseDir, "config");
  const dataDir = path.join(baseDir, "data");
  const bootstrapFile = path.join(__dirname, "bootstrapvonk.json");

  if (!fs.existsSync(bootstrapFile)) {
    throw new Error("Geen bootstrapbestand gevonden.");
  }
  const bootstrapData = JSON.parse(fs.readFileSync(bootstrapFile, "utf-8"));
  const startObj = bootstrapData.objects[0];

  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  // ✅ Genereer bestandsnaam
  const filename = `${utcTimestamp()}_${uuid()}.json`;
  const filePath = path.join(dataDir, filename);

  fs.writeFileSync(filePath, JSON.stringify(startObj, null, 2), "utf-8");
  console.log(`[Eerste installatie] Startobject opgeslagen als ${filename}`);

  // ini.json schrijven (nieuwe JSON-first config)
  if (!fs.existsSync(iniDir)) fs.mkdirSync(iniDir);
  const cfgObj = {
    paths: {
      data_dir: path.relative(iniDir, dataDir),
      startobject_file: filename
    },
    security: {
      encryption: 'aes-256',
      bind_to_machine: true
    }
  };
  fs.writeFileSync(path.join(iniDir, "ini.json"), JSON.stringify(cfgObj, null, 2), "utf-8");

  // Bootstrap markeren
  const doneFile = bootstrapFile.replace(/\.json$/i, ".done");
  fs.renameSync(bootstrapFile, doneFile);
}

if (require.main === module) {
  try {
    eersteInstallatie();
    console.log("✅ Eerste installatie afgerond.");
  } catch (err) {
    console.error("❌ Fout:", err.message);
    process.exit(1);
  }
}

module.exports = { eersteInstallatie };
