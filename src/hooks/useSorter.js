import { useState } from "react";

export function useSorter(defaultKey = "caravana") {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState("asc");
  const toggleSort = (key) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };
  const sortFn = (arr) =>
    [...arr].sort((a, b) => {
      const va = String(a[sortKey] || "").toLowerCase();
      const vb = String(b[sortKey] || "").toLowerCase();
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  const icon = (key) => (sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : " ⇅");
  const thStyle = (key) => ({
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
    background: sortKey === key ? "rgba(212,168,90,.25)" : undefined,
  });
  return { sortKey, sortDir, toggleSort, sortFn, icon, thStyle };
}
