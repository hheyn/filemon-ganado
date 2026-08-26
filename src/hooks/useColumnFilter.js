import { useState } from "react";

export function useColumnFilter(data, columns) {
  const [filters, setFilters] = useState({});
  const [openCol, setOpenCol] = useState(null);
  const toggleFilter = (col, val) =>
    setFilters((f) => {
      const cur = f[col] || [];
      const next = cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val];
      return { ...f, [col]: next };
    });
  const clearFilter = (col) => setFilters((f) => ({ ...f, [col]: [] }));
  const clearAll = () => setFilters({});
  const isFiltered = (col) => (filters[col] || []).length > 0;
  const anyFiltered = Object.values(filters).some((v) => v.length > 0);
  const filteredData = data.filter((row) =>
    columns.every((col) => {
      const active = filters[col] || [];
      if (!active.length) return true;
      return active.includes(String(row[col] || ""));
    })
  );
  const uniqueVals = (col) => [...new Set(data.map((r) => String(r[col] || "")))].sort();
  return {
    filters, filteredData, toggleFilter, clearFilter, clearAll,
    isFiltered, anyFiltered, openCol, setOpenCol, uniqueVals,
  };
}
