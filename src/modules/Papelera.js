import { useCollection } from "../hooks/useCollection";
import { Button } from "../components/Field";
import { Icono } from "../components/Icon";
import { isAdmin } from "../lib/permissions";

function Seccion({ titulo, items, restore, columnas }) {
  return (
    <div className="card mb">
      <div className="section-hdr" style={{ marginBottom: 8 }}>
        <h2 style={{ fontSize: 15 }}>{titulo}</h2>
      </div>
      {items.length ? (
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                {columnas.map((c) => <th key={c.key}>{c.label}</th>)}
                <th>Eliminado en</th>
                <th>Por</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id} className="eliminado-row">
                  {columnas.map((c) => <td key={c.key} style={{ fontSize: 11 }}>{c.render ? c.render(d) : (d[c.key] ?? "—")}</td>)}
                  <td style={{ fontSize: 11 }}>{d.eliminadoEn || "—"}</td>
                  <td style={{ fontSize: 11 }}>{d.eliminadoPor || "—"}</td>
                  <td>
                    <Button variant="verde" sm onClick={() => restore(d.id)}>Restaurar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="txt-muted" style={{ textAlign: "center", padding: 12, fontSize: 12 }}>Sin registros eliminados.</div>
      )}
    </div>
  );
}

// Papelera / Archivo histórico: solo Admin. Nada acá se borra jamás de forma
// definitiva ni se purga automáticamente por tiempo — es historial
// permanente, no una papelera temporal (decisión de producto explícita).
export function Papelera({ rol }) {
  const [bajas, , , , restoreBaja] = useCollection("bajas", { softDelete: true, incluirEliminados: true });
  const [pariciones, , , , restorePar] = useCollection("pariciones", { softDelete: true, incluirEliminados: true });
  const [sanidad, , , , restoreSan] = useCollection("sanidad", { softDelete: true, incluirEliminados: true });
  const [costos, , , , restoreCosto] = useCollection("costos", { softDelete: true, incluirEliminados: true });

  if (!isAdmin(rol)) {
    return <div className="card txt-muted" style={{ padding: 16 }}>No tenés permiso para ver este módulo.</div>;
  }

  const bajasElim = (bajas || []).filter((d) => d.eliminado === true);
  const parElim = (pariciones || []).filter((d) => d.eliminado === true);
  const sanElim = (sanidad || []).filter((d) => d.eliminado === true);
  const costosElim = (costos || []).filter((d) => d.eliminado === true);

  return (
    <div>
      <div className="section-hdr">
        <h2><Icono nombre="archivo" size={20} /> Papelera / Archivo histórico</h2>
      </div>
      <p className="txt-muted" style={{ fontSize: 12, marginBottom: 14 }}>
        Estos registros nunca se borran definitivamente — quedan acá para siempre, como historial. Podés restaurarlos si fue un error.
      </p>

      <Seccion
        titulo={<><Icono nombre="bajas" size={16} /> Bajas eliminadas</>}
        items={bajasElim}
        restore={restoreBaja}
        columnas={[
          { key: "caravana", label: "Caravana" },
          { key: "fecha", label: "Fecha" },
          { key: "causa", label: "Causa" },
        ]}
      />
      <Seccion
        titulo={<><Icono nombre="partos" size={16} /> Partos eliminados</>}
        items={parElim}
        restore={restorePar}
        columnas={[
          { key: "madreCaravana", label: "Madre" },
          { key: "fecha", label: "Fecha" },
          { key: "tipo", label: "Tipo" },
        ]}
      />
      <Seccion
        titulo={<><Icono nombre="sanidad" size={16} /> Sanidad eliminada</>}
        items={sanElim}
        restore={restoreSan}
        columnas={[
          { key: "fecha", label: "Fecha" },
          { key: "producto", label: "Producto" },
          { key: "caravana", label: "Caravana/Lote", render: (d) => d.caravana || d.lote || "—" },
        ]}
      />
      <Seccion
        titulo={<><Icono nombre="costos" size={16} /> Costos eliminados</>}
        items={costosElim}
        restore={restoreCosto}
        columnas={[
          { key: "fecha", label: "Fecha" },
          { key: "categoria", label: "Categoría" },
          { key: "descripcion", label: "Descripción" },
          { key: "monto", label: "Monto" },
        ]}
      />
    </div>
  );
}
