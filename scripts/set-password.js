const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const fs = require("fs");
const path = require("path");
const sa = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "estancia-filemon-firebase-adminsdk-fbsvc-fa24d99ad4.json"), "utf8"));
initializeApp({ credential: cert(sa) });

const email = process.argv[2];
const password = process.argv[3];

getAuth().getUserByEmail(email)
  .then((u) => getAuth().updateUser(u.uid, { password }))
  .then((u) => { console.log(`Contraseña actualizada para ${u.email}`); process.exit(0); })
  .catch((e) => { console.error("FALLÓ:", e.message); process.exit(1); });
