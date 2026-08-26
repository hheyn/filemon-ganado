// Todas las fechas de la app se manejan como string "YYYY-MM-DD" en hora
// LOCAL (Paraguay, UTC-3/UTC-4), nunca UTC. `new Date().toISOString()` está
// prohibido en el resto del código porque desfasa un día cerca de la
// medianoche paraguaya — centralizar acá es la corrección de ese bug.

const pad = (n) => String(n).padStart(2, "0");

export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toLocalISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Parsea un string "YYYY-MM-DD" como fecha local (evita que `new Date("YYYY-MM-DD")`
// lo interprete como UTC medianoche, que en Paraguay cae en el día anterior).
export function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function addDays(dateStr, n) {
  const d = parseLocalDate(dateStr);
  if (!d) return "";
  d.setDate(d.getDate() + n);
  return toLocalISODate(d);
}

export function daysBetween(dateStr, refStr = today()) {
  const a = parseLocalDate(dateStr);
  const b = parseLocalDate(refStr);
  if (!a || !b) return null;
  return Math.round((a - b) / 86400000);
}

export function formatDisplay(dateStr) {
  if (!dateStr) return "";
  const d = parseLocalDate(dateStr);
  if (!d) return dateStr;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function yearOf(dateStr) {
  return (dateStr || "").slice(0, 4);
}
