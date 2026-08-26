import { useState } from "react";
import { Icono } from "../../components/Icon";
import { Modal } from "../../components/Modal";
import { Button, Badge } from "../../components/Field";
import { useCollection } from "../../hooks/useCollection";
import { canEdit } from "../../lib/permissions";
import { PIQUETES, getPiquete } from "../../lib/piquetes";
import { getRotacionActiva, moverAnimales, cerrarRotacionManual } from "../../lib/rotaciones";
import { daysBetween, today, formatDisplay } from "../../lib/dateUtils";
import { PiqueMap } from "./PiqueMap";
import { MoverLoteForm } from "./MoverLoteForm";

// Umbral de color para días transcurridos vs. días de rotación recomendados
// (no aplica a piquetes flexibles como Campo Grande, que no tienen ciclo fijo).
function estadoTiempo(diasTranscurridos, diasRotacion) {
  if (diasRotacion == null) return null;
  const pct = diasTranscurridos / diasRotacion;
  if (pct >= 1.2) return { tone: "rojo", label: "Atrasado" };
  if (pct >= 0.8) return { tone: "paja", label: "Cerca del límite" };
  return { tone: "verde", label: "En tiempo" };
}

export function Potreros({ animales, updateAnimal, rol }) {
  const [rotaciones] = useCollection("rotaciones");
  const rots = rotaciones || [];
  const puedeEditar = canEdit(rol, "potreros");

  const [seleccionado, setSeleccionado] = useState(null);
  const [showMover, setShowMover] = useState(false);

  const filas = PIQUETES.map((p) => {
    const animalesAhi = animales.filter((a) => a.ubicacion === p.id);
    const rot = getRotacionActiva(rots, p.id);
    const lotes = [...new Set(animalesAhi.map((a) => a.lote).filter(Boolean))];
    const diasTranscurridos = rot?.entrada ? -daysBetween(rot.entrada, today()) : null;
    const et = !p.flexible && diasTranscurridos != null ? estadoTiempo(diasTranscurridos, p.diasRotacion) : null;
    return { piquete: p, animalesAhi, rot, lotes, diasTranscurridos, et };
  });

  const piqueteSel = seleccionado ? getPiquete(seleccionado) : null;
  const filaSel = filas.find((f) => f.piquete.id === seleccionado);
  const historialSel = seleccionado
    ? rots
        .filter((r) => r.piqueteId === seleccionado)
        .sort((a, b) => (b.entrada || "").localeCompare(a.entrada || ""))
    : [];

  const handleMover = async ({ origen, lote, destino, fecha, animalIds }) => {
    await moverAnimales({
      animalIds,
      animales,
      rotaciones: rots,
      destino,
      lote,
      fechaEntrada: fecha,
      obs: origen ? `Recibido desde ${origen}` : "",
    });
    setShowMover(false);
    setSeleccionado(destino);
  };

  const handleCerrar = async (rotacionId) => {
    if (!window.confirm("¿Cerrar esta rotación manualmente?")) return;
    await cerrarRotacionManual(rotacionId);
  };

  const ocupados = filas.filter((f) => f.animalesAhi.length > 0).length;
  const libres = filas.length - ocupados;

  return (
    <div>
      <div className="section-hdr">
        <h2><Icono nombre="potreros" size={20} /> Potreros</h2>
        {puedeEditar && (
          <div className="flex">
            <Button variant="ghost" sm onClick={() => setShowMover(true)}><Icono nombre="moverLote" size={14} /> Mover lote</Button>
          </div>
        )}
      </div>

      <div className="grid3 mb">
        <div className="statbox verde">
          <div className="statbox-num">{ocupados}</div>
          <div className="statbox-lbl">Ocupados hoy</div>
        </div>
        <div className="statbox">
          <div className="statbox-num">{libres}</div>
          <div className="statbox-lbl">Libres</div>
        </div>
        <div className="statbox paja">
          <div className="statbox-num">{animales.length}</div>
          <div className="statbox-lbl">Total animales</div>
        </div>
      </div>

      <PiqueMap piquetes={PIQUETES} animales={animales} rotaciones={rots} onSelect={setSeleccionado} />

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Piquete</th>
              <th>Ha</th>
              <th>Animales</th>
              <th>Lote(s)</th>
              <th>Entrada</th>
              <th>Días</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filas.map(({ piquete, animalesAhi, rot, lotes, diasTranscurridos, et }) => (
              <tr key={piquete.id} style={{ cursor: "pointer" }} onClick={() => setSeleccionado(piquete.id)}>
                <td><strong>{piquete.nombre}</strong></td>
                <td>{piquete.ha ?? "—"}</td>
                <td>{animalesAhi.length}</td>
                <td>{lotes.length ? lotes.join(", ") : "—"}</td>
                <td>{rot?.entrada ? formatDisplay(rot.entrada) : "—"}</td>
                <td>
                  {piquete.flexible
                    ? "—"
                    : diasTranscurridos != null
                    ? `${diasTranscurridos}/${piquete.diasRotacion}`
                    : "—"}
                </td>
                <td>
                  {animalesAhi.length ? (
                    et ? <Badge tone={et.tone}>{et.label}</Badge> : <Badge tone="verde">Activo</Badge>
                  ) : (
                    <Badge tone="gris">Libre</Badge>
                  )}
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  {puedeEditar && rot && (
                    <Button variant="ghost" sm onClick={() => handleCerrar(rot.id)}><Icono nombre="positivo" size={14} /> Cerrar</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showMover && (
        <Modal title={<><Icono nombre="moverLote" size={16} /> Mover lote</>} onClose={() => setShowMover(false)}>
          <MoverLoteForm
            animales={animales}
            rotaciones={rots}
            onSubmit={handleMover}
            onCancel={() => setShowMover(false)}
          />
        </Modal>
      )}

      {piqueteSel && (
        <Modal title={<><Icono nombre="potreros" size={16} /> {piqueteSel.nombre}</>} onClose={() => setSeleccionado(null)} wide>
          <div className="grid2 mb">
            <div>
              <div className="txt-muted">Superficie</div>
              <div>{piqueteSel.ha ? `${piqueteSel.ha} ha` : "Sin superficie fija"}</div>
            </div>
            <div>
              <div className="txt-muted">Días de rotación recomendados</div>
              <div>{piqueteSel.flexible ? "Sin ciclo fijo" : `${piqueteSel.diasRotacion} días`}</div>
            </div>
          </div>

          <div className="section-hdr">
            <h3 style={{ fontSize: 14, margin: 0 }}>Animales presentes ({filaSel?.animalesAhi.length || 0})</h3>
            {puedeEditar && filaSel?.rot && (
              <Button variant="ghost" sm onClick={() => handleCerrar(filaSel.rot.id)}><Icono nombre="positivo" size={14} /> Cerrar rotación</Button>
            )}
          </div>
          <div className="mb" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {(filaSel?.animalesAhi || []).length === 0 && <span className="txt-muted">Sin animales.</span>}
            {(filaSel?.animalesAhi || []).map((a) => (
              <Badge key={a.id} tone="cielo">{a.caravana || a.nombre || a.id}</Badge>
            ))}
          </div>

          <div className="section-hdr">
            <h3 style={{ fontSize: 14, margin: 0 }}>Historial de rotaciones</h3>
          </div>
          <div className="tbl-wrap mb">
            <table>
              <thead>
                <tr>
                  <th>Entrada</th>
                  <th>Salida</th>
                  <th>Lote</th>
                  <th>Estado</th>
                  <th>Obs.</th>
                </tr>
              </thead>
              <tbody>
                {historialSel.map((r) => (
                  <tr key={r.id}>
                    <td>{formatDisplay(r.entrada)}</td>
                    <td>{r.salida ? formatDisplay(r.salida) : "—"}</td>
                    <td>{r.lote || "—"}</td>
                    <td>
                      {r.activa === false || r.salida ? (
                        <Badge tone="gris">Cerrada</Badge>
                      ) : (
                        <Badge tone="verde">Activa</Badge>
                      )}
                    </td>
                    <td className="txt-muted">{r.obs || "—"}</td>
                  </tr>
                ))}
                {!historialSel.length && (
                  <tr><td colSpan="5" className="txt-muted" style={{ textAlign: "center", padding: 12 }}>Sin historial registrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </div>
  );
}
