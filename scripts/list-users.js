const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const fs = require("fs");
const path = require("path");
const sa = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "estancia-filemon-firebase-adminsdk-fbsvc-fa24d99ad4.json"), "utf8"));
initializeApp({ credential: cert(sa) });
getAuth().listUsers(100).then((r) => {
  r.users.forEach((u) => console.log(u.uid, u.email, u.disabled ? "(disabled)" : ""));
  process.exit(0);
});
