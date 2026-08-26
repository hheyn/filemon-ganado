import { useCollection } from "../hooks/useCollection";
import { useYearFilter } from "../hooks/useYearFilter";
import { useSorter } from "../hooks/useSorter";
import { YearPills } from "../components/YearPills";
import { BadgeEstado, Badge } from "../components/Field";
import { Icono } from "../components/Icon";

// Preñez es una vista derivada de solo lectura: no tiene su propio CRUD, sólo
// cruza `animales` con `iatf` y `pariciones` para mostrar el estado
// reproductivo de cada hembra. Por eso no recibe canEdit/addPar/etc.
export function Prenez({ animales, rol, abrirFicha }) {
  const [iatfD] = useCollection("iatf");
  const [parD] = useCollection("pariciones", { softDelete: true });
  const iatf = iatfD || [];
  const pariciones = parD || [];

  const { anio, setAnio, anos, filtered: partosDelAnio } = useYearFilter(pariciones, "fecha");
  const { sortFn, toggleSort, icon, thStyle } = useSorter("caravana");

  const hembrasAll = animales.filter((a) => ["Vaca", "Vaquilla", "Desmamante Hembra"].includes(a.categoria));

  const hembras = sortFn(
    anio === "Todos"
      ? hembrasAll
      : hembrasAll.filter((a) => {
          const tieneParto = pariciones.some((p) => p.madreCaravana === a.caravana && (p.fecha || "").startsWith(anio));
          const tieneIatf = iatf.some((i) => i.caravana === a.caravana && i.campania && String(i.campania).includes(anio));
          return tieneParto || tieneIatf;
        })
  );

  const prenadasAnio = iatf.filter(
    (i) => (anio === "Todos" || (i.campania && String(i.campania).includes(anio))) && i.resultado === "✅"
  ).length;

  return (
    <div>
      <div className="section-hdr">
        <h2><Icono nombre="prenez" size={18} /> Historial de Preñez</h2>
      </div>
      <YearPills anos={anos} anio={anio} setAnio={setAnio} />
      <div className="grid3 mb">
        <div className="statbox" data-icon="🐄">
          <div className="statbox-num">{hembras.length}</div>
          <div className="statbox-lbl">Hembras</div>
        </div>
        <div className="statbox verde" data-icon="✅">
          <div className="statbox-num">{prenadasAnio}</div>
          <div className="statbox-lbl">Preñadas {anio}</div>
        </div>
        <div className="statbox paja" data-icon="📅">
          <div className="statbox-num">{partosDelAnio.length}</div>
          <div className="statbox-lbl">Partos {anio}</div>
        </div>
      </div>
      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th style={thStyle("caravana")} onClick={() => toggleSort("caravana")}>Car.{icon("caravana")}</th>
                <th style={thStyle("categoria")} onClick={() => toggleSort("categoria")}>Cat.{icon("categoria")}</th>
                <th style={thStyle("lote")} onClick={() => toggleSort("lote")}>Lote{icon("lote")}</th>
                <th>Partos {anio}</th>
                <th>Ternero</th>
                <th style={thStyle("estado")} onClick={() => toggleSort("estado")}>Estado{icon("estado")}</th>
                <th>IATF {anio}</th>
              </tr>
            </thead>
            <tbody>
              {hembras.map((a) => {
                const misPartos = pariciones.filter(
                  (p) => p.madreCaravana === a.caravana && (anio === "Todos" || (p.fecha || "").startsWith(anio))
                );
                const terneros = animales.filter(
                  (t) => t.madreCaravana === a.caravana && (anio === "Todos" || (t.fechaNac || "").startsWith(anio))
                );
                const ir = iatf.find(
                  (i) => i.caravana === a.caravana && (anio === "Todos" || (i.campania && String(i.campania).includes(anio)))
                );
                return (
                  <tr key={a.id}>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: "2px 8px", fontWeight: 700, fontSize: 12 }}
                        onClick={() => abrirFicha(a.caravana)}
                      >
                        {a.caravana}
                      </button>
                    </td>
                    <td style={{ fontSize: 10 }}>{a.categoria}</td>
                    <td><Badge tone="cielo">{a.lote}</Badge></td>
                    <td>
                      {misPartos.length > 0 ? (
                        misPartos.map((p) => (
                          <div key={p.id} style={{ fontSize: 10 }}>
                            {(p.fecha || "").slice(5)} <Icono nombre={p.terneroSexo === "H" ? "hembra" : "macho"} size={10} />
                          </div>
                        ))
                      ) : (
                        <span className="txt-muted">—</span>
                      )}
                    </td>
                    <td>
                      {terneros.length > 0 ? (
                        terneros.map((t) => (
                          <button
                            key={t.id}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: "2px 6px", fontSize: 11, fontWeight: 700, display: "block", marginBottom: 2 }}
                            onClick={() => abrirFicha(t.caravana)}
                          >
                            <Icono nombre="hacienda" size={11} /> {t.caravana}
                          </button>
                        ))
                      ) : (
                        <span className="txt-muted">—</span>
                      )}
                    </td>
                    <td><BadgeEstado estado={a.estado} /></td>
                    <td style={{ textAlign: "center" }}>
                      {ir ? (
                        <Badge tone={ir.resultado === "✅" ? "verde" : ir.resultado === "⏳" ? "paja" : "rojo"} style={{ fontSize: 10 }}>
                          {ir.resultado === "✅" ? "Preñada" : ir.resultado === "⏳" ? "Pend." : "Vacía"}
                        </Badge>
                      ) : (
                        <span className="txt-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!hembras.length && (
                <tr>
                  <td colSpan="7" className="txt-muted" style={{ textAlign: "center", padding: 12 }}>
                    Sin hembras para {anio}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
