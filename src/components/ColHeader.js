import { useEffect } from "react";

export function ColHeader({ label, col, sorter, cfh, style }) {
  const { toggleSort, icon, thStyle } = sorter;
  const { toggleFilter, clearFilter, isFiltered, openCol, setOpenCol, uniqueVals, filters } = cfh;
  const open = openCol === col;
  const vals = uniqueVals(col);
  const active = filters[col] || [];

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!e.target.closest(".col-dd")) setOpenCol(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open, setOpenCol]);

  return (
    <th style={{ ...thStyle(col), ...(style || {}), position: "relative", whiteSpace: "nowrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
        <span style={{ cursor: "pointer", flex: 1 }} onClick={() => toggleSort(col)}>
          {label}{icon(col)}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); setOpenCol(open ? null : col); }}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "0 2px",
            color: isFiltered(col) ? "#4A7C4E" : "rgba(44,26,14,.35)", fontSize: 11, lineHeight: 1 }}
        >▾</button>
      </div>
      {open && (
        <div className="col-dd" style={{ position: "absolute", top: "100%", left: 0, zIndex: 500,
          background: "#fffdf5", border: "1.5px solid rgba(107,66,38,.2)", borderRadius: 10,
          boxShadow: "0 8px 32px rgba(44,26,14,.18)", minWidth: 150, maxHeight: 240,
          overflowY: "auto", padding: "4px 0" }}>
          <div style={{ padding: "4px 10px 6px", borderBottom: "1px solid rgba(107,66,38,.1)",
            display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#6B4226", textTransform: "uppercase", letterSpacing: ".5px" }}>Filtrar</span>
            {isFiltered(col) && (
              <button onClick={() => clearFilter(col)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: "#B03A2E", fontWeight: 700 }}>Limpiar</button>
            )}
          </div>
          {vals.map((v) => (
            <label key={v} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px",
              cursor: "pointer", fontSize: 12, fontFamily: "'Lora',serif", color: "#2C1A0E" }}>
              <input type="checkbox" checked={active.includes(v)} onChange={() => toggleFilter(col, v)}
                style={{ accentColor: "#6B4226", width: 13, height: 13 }} />
              {v || "(vacío)"}
            </label>
          ))}
        </div>
      )}
    </th>
  );
}
