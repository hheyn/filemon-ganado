import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

// Colecciones sensibles a corrección manual — se audita quién tocó qué y cuándo,
// para poder rastrear el origen de futuras inconsistencias de datos.
export const COLECCIONES_AUDITADAS = ["animales", "sanidad", "costos"];

export async function registrarAuditoria({ coleccion, docId, accion, resumen, user }) {
  if (!COLECCIONES_AUDITADAS.includes(coleccion)) return;
  try {
    await addDoc(collection(db, "auditoria"), {
      coleccion,
      docId,
      accion, // "crear" | "editar" | "eliminar"
      resumen: resumen || "",
      uid: user?.uid || null,
      email: user?.email || null,
      fecha: serverTimestamp(),
    });
  } catch {
    // La auditoría nunca debe romper el flujo principal de guardado.
  }
}
