// Helper compartido para el cálculo de "fecha estimada de parto" — usado por
// Reportes.js (Seguimiento Partos) y, en un pase futuro, por Dashboard.js.
//
// Contexto (ver plan, sección "Rondas de servicio dentro de una campaña"):
// antes de las rondas, una campaña tenía un único evento de servicio y el
// día10 de IATF servía siempre de referencia para estimar el parto (+283
// días de gestación). Ahora una campaña puede tener varias rondas (IATF-1,
// Resincro-TE, Repaso Toro), y para las rondas de tipo TE (Transferencia de
// Embriones) la referencia real es `fechaTransferencia`, no `dia10` — el
// protocolo dia0/dia8 en TE es de sincronización de la receptora, no de
// inseminación. Esta función centraliza esa regla para que no se repita
// (ni se olvide) en cada lugar que calcula partos estimados.
import { addDays } from "./dateUtils";

// Fecha de referencia de gestación: fechaTransferencia para TE, dia10 en
// cualquier otro caso. Defensivo: si falta el campo "correcto" para el tipo
// de servicio, cae al otro campo disponible en vez de devolver null a lo
// tonto (datos viejos/incompletos no deben romper el reporte).
export function fechaReferenciaGestacion(iatfRecord) {
  if (!iatfRecord) return null;
  const { tipoServicio, fechaTransferencia, dia10 } = iatfRecord;
  if (tipoServicio === "TE") {
    return fechaTransferencia || dia10 || null;
  }
  return dia10 || fechaTransferencia || null;
}

// Fecha estimada de parto = fecha de referencia + 283 días de gestación.
// Devuelve null si no hay fecha de referencia disponible.
export function fechaPartoEstimada(iatfRecord) {
  const ref = fechaReferenciaGestacion(iatfRecord);
  if (!ref) return null;
  return addDays(ref, 283);
}

// Ronda del registro, con fallback retrocompatible: los documentos `iatf`
// cargados antes de que existiera el campo `ronda` se tratan como "IATF-1"
// (ver plan, "Preservación de datos existentes").
export function rondaDe(iatfRecord) {
  return (iatfRecord && iatfRecord.ronda) || "IATF-1";
}
