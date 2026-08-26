import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

// Colecciones sensibles a corrección manual — se audita quién tocó qué y cuándo,
// para poder rastrear el origen de futuras inconsistencias de datos.
// `iatf` y `pariciones` se agregaron porque un resultado de servicio (preñada/
// vacía) suele corregirse meses después (eco tardía imprecisa, reabsorción):
// la corrección no debe borrar en silencio lo que se había registrado antes.
export const COLECCIONES_AUDITADAS = ["animales", "sanidad", "costos", "iatf", "pariciones"];

export async function registrarAuditoria({ coleccion, docId, accion, resumen, cambios, user }) {
  if (!COLECCIONES_AUDITADAS.includes(coleccion)) return;
  try {
    await addDoc(collection(db, "auditoria"), {
      coleccion,
      docId,
      accion, // "crear" | "editar" | "eliminar"
      resumen: resumen || "",
      cambios: cambios || null, // { campo: { antes, despues } } — solo en "editar"
      uid: user?.uid || null,
      email: user?.email || null,
      fecha: serverTimestamp(),
    });
  } catch {
    // La auditoría nunca debe romper el flujo principal de guardado.
  }
}
