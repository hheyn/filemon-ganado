import { useState } from "react";

const ANO_ACTUAL = String(new Date().getFullYear());

export function useYearFilter(data, dateField) {
  const anos = ["Todos", ...new Set(data.map((r) => (r[dateField] || "").slice(0, 4)).filter(Boolean))]
    .sort((a, b) => b.localeCompare(a));
  const [anio, setAnio] = useState(anos.includes(ANO_ACTUAL) ? ANO_ACTUAL : anos[1] || "Todos");
  const filtered = anio === "Todos" ? data : data.filter((r) => (r[dateField] || "").startsWith(anio));
  return { anio, setAnio, anos, filtered };
}
