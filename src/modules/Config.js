import { useMemo } from "react";
import { useCollection } from "../hooks/useCollection";
import { Button, Badge } from "../components/Field";
import { Icono } from "../components/Icon";
import { isAdmin } from "../lib/permissions";
import { today } from "../lib/dateUtils";
import { CATEGORIAS, ESTADOS, LOTES, UBICACIONES, C } from "../lib/constants";

// Auditoría de datos: la app reescrita usa desplegables cerrados
// (categoría/estado/lote/ubicación) tomados de lib/constants.js, pero los
// datos reales vienen de años de carga manual con variantes de texto (ej.
// "Desmamante H" en vez de "Desmamante Hembra", o "Prenada" sin tilde en vez
// de "Preñada"). Un animal con un valor que no está en el catálogo actual
// aparece con el desplegable vacío al editarlo, y puede no contar en
// estadísticas que comparan con el string exacto. Este reporte lista esos
// casos para corregirlos a mano ANTES de operar con la app nueva.
function valoresFueraDeCatalogo(items, campo, permitidos, { permitirVacio = false } = {}) {
  const set = new Set(permitidos);
  const porValor = new Map();
  (items || []).forEach((item) => {
    const v = item[campo];
    if (permitirVacio && (v === undefined || v === null || v === "")) return;
    if (set.has(v)) return;
    const key = v === undefined || v === null || v === "" ? "(vacío)" : v;
    if (!porValor.has(key)) porValor.set(key, []);
    porValor.get(key).push(item);
  });
  return [...porValor.entries()].map(([valor, docs]) => ({ valor, docs }));
}

function descargarBlob(contenido, tipo, nombreArchivo) {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  a.click();
  URL.revokeObjectURL(url);
}

function aCsv(items) {
  if (!items || !items.length) return "";
  const headers = Object.keys(items[0]);
  const escape = (v) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  items.forEach((item) => {
    lines.push(headers.map((h) => escape(item[h])).join(","));
  });
  return lines.join("\n");
}

// Config: solo Admin. Exportación manual de respaldo (además del respaldo
// real que ya provee Firebase) — copia extra de tranquilidad, no reemplaza
// ningún backup del lado del servidor.
export function Config({ animales, rol }) {
  const [iatf] = useCollection("iatf");
  const [pariciones] = useCollection("pariciones", { incluirEliminados: true });
  const [sanidad] = useCollection("sanidad", { incluirEliminados: true });
  const [bajas] = useCollection("bajas", { incluirEliminados: true });
  const [toros] = useCollection("toros");
  const [productos] = useCollection("productos");
  const [rotaciones] = useCollection("rotaciones");
  const [costos] = useCollection("costos", { incluirEliminados: true });
  const [usuarios] = useCollection("usuarios");
  const [auditoria] = useCollection("auditoria");

  const auditoriaCategorias = useMemo(() => valoresFueraDeCatalogo(animales, "categoria", CATEGORIAS), [animales]);
  const auditoriaEstados = useMemo(() => valoresFueraDeCatalogo(animales, "estado", ESTADOS), [animales]);
  const auditoriaLotes = useMemo(() => valoresFueraDeCatalogo(animales, "lote", LOTES), [animales]);
  const auditoriaUbicaciones = useMemo(
    () => valoresFueraDeCatalogo(animales, "ubicacion", UBICACIONES, { permitirVacio: true }),
    [animales]
  );
  const totalProblemas = auditoriaCategorias.length + auditoriaEstados.length + auditoriaLotes.length + auditoriaUbicaciones.length;

  if (!isAdmin(rol)) {
    return <div className="card txt-muted" style={{ padding: 16 }}>No tenés permiso para ver este módulo.</div>;
  }

  const exportarJSON = () => {
    const data = {
      animales: animales || [],
      iatf: iatf || [],
      pariciones: pariciones || [],
      sanidad: sanidad || [],
      bajas: bajas || [],
      toros: toros || [],
      productos: productos || [],
      rotaciones: rotaciones || [],
      costos: costos || [],
      usuarios: usuarios || [],
      auditoria: auditoria || [],
      exportadoEn: new Date().toISOString(), // único uso permitido: metadata de exportación, no una fecha de negocio
    };
    descargarBlob(JSON.stringify(data, null, 2), "application/json", `estancia-filemon-backup-${today()}.json`);
  };

  const colecciones = [
    { nombre: "Animales", items: animales, archivo: "animales" },
    { nombre: "IATF", items: iatf, archivo: "iatf" },
    { nombre: "Pariciones", items: pariciones, archivo: "pariciones" },
    { nombre: "Sanidad", items: sanidad, archivo: "sanidad" },
    { nombre: "Bajas", items: bajas, archivo: "bajas" },
    { nombre: "Toros", items: toros, archivo: "toros" },
    { nombre: "Productos", items: productos, archivo: "productos" },
    { nombre: "Rotaciones", items: rotaciones, archivo: "rotaciones" },
    { nombre: "Costos", items: costos, archivo: "costos" },
  ];

  const exportarCSV = (items, archivo) => {
    descargarBlob(aCsv(items || []), "text/csv", `estancia-filemon-${archivo}-${today()}.csv`);
  };

  return (
    <div>
      <div className="section-hdr">
        <h2><Icono nombre="config" size={20} /> Configuración</h2>
      </div>

      <div className="card mb" style={{ padding: 14 }}>
        <div className="flex" style={{ justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: C.cuero }}><Icono nombre="buscar" size={16} /> Auditoría de datos — Hacienda</div>
          <Badge tone={totalProblemas ? "rojo" : "verde"}>{totalProblemas ? `${totalProblemas} valor(es) a revisar` : "Todo en orden"}</Badge>
        </div>
        <p className="txt-muted" style={{ fontSize: 11.5, marginBottom: 10 }}>
          Compara categoría/estado/lote/ubicación de cada animal contra el catálogo actual de la app. Un valor listado acá
          aparece con el desplegable vacío al editar ese animal en Hacienda, y puede no contarse bien en el Dashboard/Reportes
          hasta que lo corrijas (abrí la ficha del animal en Hacienda y volvé a elegir el valor correcto).
        </p>
        {[
          { titulo: "Categoría", filas: auditoriaCategorias },
          { titulo: "Estado", filas: auditoriaEstados },
          { titulo: "Lote", filas: auditoriaLotes },
          { titulo: "Ubicación", filas: auditoriaUbicaciones },
        ].map(({ titulo, filas }) =>
          filas.length > 0 && (
            <div key={titulo} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: C.urgente, marginBottom: 4 }}>{titulo}</div>
              {filas.map(({ valor, docs }) => (
                <div key={valor} style={{ fontSize: 11.5, marginBottom: 3 }}>
                  <Badge tone="rojo" style={{ fontSize: 9 }}>"{valor}"</Badge>{" "}
                  <span className="txt-muted">
                    en {docs.length} animal(es): {docs.slice(0, 8).map((d) => d.caravana).join(", ")}{docs.length > 8 ? "…" : ""}
                  </span>
                </div>
              ))}
            </div>
          )
        )}
        {!totalProblemas && <div className="txt-muted" style={{ fontSize: 12 }}><Icono nombre="positivo" size={14} /> No se encontraron valores fuera del catálogo actual.</div>}
      </div>

      <div className="card mb" style={{ padding: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: C.cuero }}><Icono nombre="exportar" size={16} /> Respaldo manual</div>
        <p className="txt-muted" style={{ fontSize: 12, marginBottom: 10 }}>
          Además de estos respaldos manuales, los datos están en Firebase — este export es una copia extra de tranquilidad.
        </p>
        <Button variant="prim" onClick={exportarJSON}><Icono nombre="exportar" size={16} /> Exportar todo (JSON)</Button>
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: C.cuero }}>Exportar CSV por colección</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {colecciones.map((c) => (
            <Button key={c.archivo} variant="ghost" sm onClick={() => exportarCSV(c.items, c.archivo)}>
              {c.nombre} ({(c.items || []).length})
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
