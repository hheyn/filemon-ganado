import { writeBatch, doc, collection } from "firebase/firestore";
import { db } from "./firebase";
import { today } from "./dateUtils";

// ÚNICA función para mover animales entre potreros/lotes. Antes de esta
// reescritura esta lógica estaba duplicada e independiente en Hacienda
// (moverLoteCompleto) y en Potreros/PiquerotasV2 (moverLote) — podían
// desincronizarse entre sí. Ahora Hacienda y Potreros llaman a esta misma
// función, sin excepciones.
//
// Determina si una rotación está "activa": usa el campo `activa` si existe
// (esquema nuevo), y si no, infiere por fecha de salida (esquema viejo,
// compatibilidad con datos ya cargados en Firestore).
export function esRotacionActiva(rot, refDate = today()) {
  if (typeof rot.activa === "boolean") return rot.activa;
  return !rot.salida || rot.salida >= refDate;
}

export function getRotacionActiva(rotaciones, piqueteId, refDate = today()) {
  return (
    (rotaciones || []).find(
      (r) => r.piqueteId === piqueteId && esRotacionActiva(r, refDate)
    ) || null
  );
}

/**
 * Mueve uno o varios animales a un nuevo piquete (ubicacion), y maneja
 * de forma atómica (writeBatch) el cierre de la rotación de origen y la
 * apertura/reutilización de la rotación de destino.
 *
 * @param {Object} params
 * @param {string[]} params.animalIds - ids de documentos en `animales` a mover
 * @param {Array}    params.animales - snapshot actual completo de `animales` (para calcular orígenes/remanentes)
 * @param {Array}    params.rotaciones - snapshot actual completo de `rotaciones`
 * @param {string}   params.destino - piqueteId destino (ver lib/piquetes.js)
 * @param {string}   [params.lote] - si se pasa, también actualiza el campo `lote` de los animales
 * @param {string}   [params.fechaEntrada] - YYYY-MM-DD, default hoy
 * @param {string}   [params.obs]
 */
export async function moverAnimales({
  animalIds,
  animales,
  rotaciones,
  destino,
  lote,
  fechaEntrada = today(),
  obs = "",
}) {
  if (!animalIds?.length || !destino) return;

  const animalesAMover = animales.filter((a) => animalIds.includes(a.id));
  const origenes = [
    ...new Set(animalesAMover.map((a) => a.ubicacion).filter(Boolean)),
  ].filter((o) => o !== destino);

  const batch = writeBatch(db);

  // 1) Actualizar animales
  for (const a of animalesAMover) {
    const patch = { ubicacion: destino };
    if (lote) patch.lote = lote;
    batch.update(doc(db, "animales", a.id), patch);
  }

  // 2) Abrir/reutilizar rotación en destino (solo si no hay una activa ya)
  const rotActivaDestino = getRotacionActiva(rotaciones, destino);
  if (!rotActivaDestino) {
    const nuevaRef = doc(collection(db, "rotaciones"));
    batch.set(nuevaRef, {
      piqueteId: destino,
      lote: lote || animalesAMover[0]?.lote || "",
      entrada: fechaEntrada,
      salida: "",
      activa: true,
      obs,
    });
  }

  // 3) Cerrar rotaciones de origen que quedaron sin animales
  for (const origen of origenes) {
    const animalesIdsMovidos = new Set(animalIds);
    const quedanAnimales = animales.some(
      (a) => a.ubicacion === origen && !animalesIdsMovidos.has(a.id)
    );
    if (quedanAnimales) continue;
    const rotOrigen = getRotacionActiva(rotaciones, origen);
    if (rotOrigen) {
      batch.update(doc(db, "rotaciones", rotOrigen.id), {
        salida: fechaEntrada,
        activa: false,
      });
    }
  }

  await batch.commit();
}

// Cierre manual de una rotación desfasada (botón "✅ Cerrar rotación" en Potreros).
export async function cerrarRotacionManual(rotacionId, fecha = today()) {
  const batch = writeBatch(db);
  batch.update(doc(db, "rotaciones", rotacionId), { salida: fecha, activa: false });
  await batch.commit();
}
