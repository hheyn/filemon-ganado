// Siembra datos de PRUEBA en el emulador local de Firebase (Auth + Firestore).
// NUNCA toca el proyecto real: se conecta exclusivamente vía las variables
// FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST, que solo apuntan a
// localhost. Correr primero `npm run emulators` en otra terminal.
//
// Incluye a propósito un par de valores "sucios" (categoría "Desmamante H",
// estado "Prenada" sin tilde) para poder probar la auditoría de datos de
// Config.js contra algo antes de tocar la base real.

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8085";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9199";

const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

initializeApp({ projectId: "estancia-filemon" });
const db = getFirestore();
const auth = getAuth();

const ANIMALES = [
  { caravana: "5", nombre: "", categoria: "Vaca", lote: "General", ubicacion: "P1", estado: "Preñada", toroPreñez: "Nando", obs: "" },
  { caravana: "6", nombre: "", categoria: "Vaca", lote: "General", ubicacion: "P1", estado: "Vacía", obs: "" },
  { caravana: "9", nombre: "", categoria: "Vaca", lote: "General", ubicacion: "P1", estado: "Prenada", obs: "Dato viejo sin tilde — para probar auditoría" },
  { caravana: "440", nombre: "", categoria: "Vaca", lote: "Cbo4", ubicacion: "P4", estado: "OK", obs: "" },
  { caravana: "3353", nombre: "", categoria: "Vaca", lote: "Cbo4", ubicacion: "P4", estado: "OK", obs: "" },
  { caravana: "51", nombre: "Ternera 51", categoria: "Ternera", lote: "Cbo7", ubicacion: "P4", estado: "OK", fechaNac: "2024-09-07", madreCaravana: "5" },
  { caravana: "1154", nombre: "", categoria: "Desmamante H", lote: "Cbo5", ubicacion: "P9", estado: "OK", obs: "Categoría vieja abreviada — para probar auditoría" },
  { caravana: "2149", nombre: "", categoria: "Toro", lote: "Cbo3", ubicacion: "Escuela", estado: "OK", obs: "Toro principal" },
];

const IATF = [
  { caravana: "440", lote: "Cbo4", campania: "2025-2026", ronda: "IATF-1", apta: "Apta", protocolo: "Si", tipoServicio: "IATF", toro: "Nando", dia0: "2025-09-27", dia8: "2025-10-05", dia10: "2025-10-07", resultado: "❌", origenPreniez: "", obs: "" },
  { caravana: "3353", lote: "Cbo4", campania: "2025-2026", ronda: "IATF-1", apta: "Apta", protocolo: "Si", tipoServicio: "IATF", toro: "Nando", dia0: "2025-09-27", dia8: "2025-10-05", dia10: "2025-10-07", resultado: "✅", origenPreniez: "IATF", obs: "" },
];

const PRODUCTOS = [
  { nombre: "IverFranken 3,5%", categoria: "Antiparasitario", descripcion: "Ivermectina 3.5%", dosis: "10cc", unidad: "cc", costoUnitario: 15000, contenidoPorUnidad: 500, dosisPorAnimal: 10 },
];

const USUARIOS_PRUEBA = [
  { email: "admin@test.com", password: "test1234", rol: "admin", nombre: "Admin de prueba" },
  { email: "capataz@test.com", password: "test1234", rol: "capataz", nombre: "Capataz de prueba" },
  { email: "vet@test.com", password: "test1234", rol: "veterinario", nombre: "Veterinario de prueba" },
  { email: "visor@test.com", password: "test1234", rol: "visor", nombre: "Visor de prueba" },
];

async function limpiarColeccion(nombre) {
  const snap = await db.collection(nombre).get();
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  if (snap.size) await batch.commit();
}

async function seedFirestore() {
  for (const col of ["animales", "iatf", "pariciones", "sanidad", "bajas", "productos", "rotaciones", "toros", "costos", "auditoria", "stock_movimientos", "usuarios"]) {
    await limpiarColeccion(col);
  }
  for (const a of ANIMALES) await db.collection("animales").add(a);
  for (const i of IATF) await db.collection("iatf").add(i);
  for (const p of PRODUCTOS) await db.collection("productos").add(p);
  console.log(`✅ Firestore: ${ANIMALES.length} animales, ${IATF.length} iatf, ${PRODUCTOS.length} productos`);
}

async function seedAuthYUsuarios() {
  for (const u of USUARIOS_PRUEBA) {
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(u.email);
    } catch {
      userRecord = await auth.createUser({ email: u.email, password: u.password });
    }
    await db.collection("usuarios").doc(userRecord.uid).set({
      email: u.email, nombre: u.nombre, rol: u.rol, activo: true,
      creadoEn: FieldValue.serverTimestamp(), creadoPor: "seed-emulator",
    });
    console.log(`✅ Usuario ${u.rol}: ${u.email} / ${u.password}`);
  }
}

(async () => {
  await seedFirestore();
  await seedAuthYUsuarios();
  console.log("\n🎉 Emulador sembrado. Abrí http://127.0.0.1:4040 para ver los datos (Emulator UI).");
  process.exit(0);
})().catch((e) => { console.error("❌", e); process.exit(1); });
