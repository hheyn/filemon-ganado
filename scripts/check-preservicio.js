const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");
const path = require("path");
const sa = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "estancia-filemon-firebase-adminsdk-fbsvc-fa24d99ad4.json"), "utf8"));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

async function main() {
  const animales = (await db.collection("animales").get()).docs.map((d) => ({ id: d.id, ...d.data() }));
  const iatf = (await db.collection("iatf").get()).docs.map((d) => ({ id: d.id, ...d.data() }));
  const sanidad = (await db.collection("sanidad").get()).docs.map((d) => ({ id: d.id, ...d.data() }));

  const conPreServicio = animales.filter((a) => a.servicioAsignado);
  console.log(`Animales con servicioAsignado: ${conPreServicio.length}`);
  const porTipo = {};
  const porLote = {};
  conPreServicio.forEach((a) => {
    porTipo[a.servicioAsignado] = (porTipo[a.servicioAsignado] || 0) + 1;
    porLote[a.lote] = (porLote[a.lote] || 0) + 1;
  });
  console.log("Por tipo (servicioAsignado):", porTipo);
  console.log("Por lote:", porLote);
  console.log("Campañas previstas:", [...new Set(conPreServicio.map((a) => a.campaniaPrevista))]);
  console.log("Fechas de pre-servicio:", [...new Set(conPreServicio.map((a) => a.fechaPreServicio))]);

  console.log(`\nRegistros iatf totales: ${iatf.length}`);
  console.log("Campañas en iatf:", [...new Set(iatf.map((i) => i.campania))]);

  const sanPreServicio = sanidad.filter((s) => (s.obs || "").includes("Pre-servicio"));
  console.log(`\nSanidad con obs "Pre-servicio": ${sanPreServicio.length}`);
  sanPreServicio.slice(0, 5).forEach((s) => console.log(" -", s.fecha, s.producto, s.obs, s.caravanas?.length || s.cantidadAnimales));

  process.exit(0);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
