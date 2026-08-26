// Backup manual de Firestore de producción a JSON local.
// Uso: node scripts/backup-firestore.js
// Requiere la clave de servicio descargada desde Firebase Console en la raíz
// del proyecto (excluida de git vía .gitignore).
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");
const path = require("path");

const KEY_FILE = path.join(__dirname, "..", "estancia-filemon-firebase-adminsdk-fbsvc-fa24d99ad4.json");
const serviceAccount = JSON.parse(fs.readFileSync(KEY_FILE, "utf8"));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const COLECCIONES = [
  "usuarios", "animales", "sanidad", "productos", "stock_movimientos",
  "iatf", "pariciones", "rotaciones", "toros", "bajas", "pesajes",
  "costos", "auditoria", "potreros",
];

async function main() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = path.join(__dirname, "..", "backups", stamp);
  fs.mkdirSync(outDir, { recursive: true });

  let totalDocs = 0;
  for (const col of COLECCIONES) {
    const snap = await db.collection(col).get();
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    fs.writeFileSync(path.join(outDir, `${col}.json`), JSON.stringify(docs, null, 2));
    console.log(`${col}: ${docs.length} documentos`);
    totalDocs += docs.length;
  }

  console.log(`\nBackup completo: ${totalDocs} documentos en total.`);
  console.log(`Guardado en: ${outDir}`);
  process.exit(0);
}

main().catch((e) => {
  console.error("FALLÓ el backup:", e.message);
  process.exit(1);
});
