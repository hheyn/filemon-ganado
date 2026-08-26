// Crea los documentos usuarios/{uid} en Firestore de producción para las
// cuentas ya existentes en Firebase Auth. Se corre una sola vez antes de
// desplegar firestore.rules (sin esto, las reglas nuevas bloquean a todos).
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");
const path = require("path");

const sa = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "estancia-filemon-firebase-adminsdk-fbsvc-fa24d99ad4.json"), "utf8"));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const USUARIOS = [
  { uid: "7tujlabB2tPZw1t9P1nDTQ2Vc3r1", email: "hectorh182@gmail.com", nombre: "Héctor", rol: "admin" },
  { uid: "qqG73h0M3bQJsowZ2V21uuljDBM2", email: "zarachoalfonso@hotmail.com", nombre: "Zaracho Alfonso", rol: "admin" },
];

async function main() {
  for (const u of USUARIOS) {
    await db.collection("usuarios").doc(u.uid).set({
      email: u.email,
      nombre: u.nombre,
      rol: u.rol,
      activo: true,
      creadoEn: new Date().toISOString(),
      creadoPor: "seed-real-users.js",
    });
    console.log(`Creado: ${u.email} -> ${u.rol}`);
  }
  process.exit(0);
}

main().catch((e) => { console.error("FALLÓ:", e.message); process.exit(1); });
