import { collection, getDocs, query, where, writeBatch } from "firebase/firestore";
import { db } from "./firebase";

// Una vaca que preña en una ronda sale de las rondas siguientes de la misma
// campaña (ej. preñada en IATF-1 → no se insemina en IATF-2). El registro de
// la ronda siguiente NO se borra: queda como "no realizado" con el motivo,
// así su historial muestra que estuvo programada y por qué salió.
export async function cerrarRondasPendientes({ caravana, campania, rondaPrenez, excluirId }) {
  const snap = await getDocs(query(collection(db, "iatf"), where("caravana", "==", caravana)));
  const batch = writeBatch(db);
  let n = 0;
  snap.forEach((d) => {
    const i = d.data();
    if (d.id === excluirId) return;
    if ((i.campania || "") !== (campania || "")) return;
    if (i.protocolo === "Si" || i.protocolo === "No") return;
    batch.update(d.ref, { protocolo: "No", motivoNoIatf: `Preñada en ${rondaPrenez}` });
    n++;
  });
  if (n) await batch.commit();
  return n;
}

export function origenSegunTipo(tipoServicio) {
  if (tipoServicio === "TE") return "TE";
  if (tipoServicio === "Repaso Toro") return "Repaso";
  return "IATF";
}
