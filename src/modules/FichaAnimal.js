import { useState } from "react";
import { useCollection } from "../hooks/useCollection";
import { today, formatDisplay, daysBetween, parseLocalDate } from "../lib/dateUtils";
import { fechaReferenciaGestacion, fechaPartoEstimada } from "../lib/gestacion";
import { Modal } from "../components/Modal";
import { Icono } from "../components/Icon";
import { Field, Input, Button, Badge, BadgeEstado } from "../components/Field";

function edadTexto(fechaNac) {
  if (!fechaNac) return "—";
  const nac = parseLocalDate(fechaNac);
  const hoy = new Date();
  let meses = (hoy.getFullYear() - nac.getFullYear()) * 12 + (hoy.getMonth() - nac.getMonth());
  if (meses < 0) return "—";
  if (meses < 24) return `${meses} m`;
  return `${Math.floor(meses / 12)} a`;
}

// Ficha del animal — "tres cifras arriba, el estado reproductivo en Tierra
// Colorada, historial en lista seca" (manual de marca, sección 07).
export function FichaAnimal({ caravana, animales, rol, onEdit, onClose }) {
  const animal = animales.find((a) => a.caravana === caravana);

  const [iatfD] = useCollection("iatf");
  const [parD] = useCollection("pariciones", { softDelete: true, incluirEliminados: true });
  const [sanD] = useCollection("sanidad", { softDelete: true, incluirEliminados: true });
  const [pesD, addPesaje] = useCollection("pesajes");

  const [cargarEvento, setCargarEvento] = useState(false);
  const [nuevoPeso, setNuevoPeso] = useState({ fecha: today(), peso: "" });
  const [guardando, setGuardando] = useState(false);

  if (!animal) {
    onClose?.();
    return null;
  }

  const iatf = (iatfD || []).filter((i) => i.caravana === animal.caravana);
  const pariciones = (parD || []).filter((p) => p.madreCaravana === animal.caravana);
  const sanidad = (sanD || []).filter((s) => s.caravana === animal.caravana || (!s.caravana && s.lote === animal.lote));
  const pesajes = (pesD || []).filter((p) => (p.caravana ? p.caravana === animal.caravana : p.animalId === animal.id));
  const hijos = animales.filter((a) => a.madreCaravana === animal.caravana);
  const ultimoPeso = [...pesajes].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""))[0]?.peso || animal.pesoInicial || null;

  // Preñez destacada: último IATF con resultado ✅ para esta caravana.
  const iatfPrenada = animal.estado === "Preñada"
    ? [...iatf].filter((i) => i.resultado === "✅" && fechaReferenciaGestacion(i)).sort((a, b) => (b.dia0 || "").localeCompare(a.dia0 || ""))[0]
    : null;
  const fechaEst = iatfPrenada ? fechaPartoEstimada(iatfPrenada) : null;
  const diasFaltan = fechaEst ? daysBetween(fechaEst, today()) * -1 : null;

  // Historial unificado, lista seca, una línea por evento.
  const eventos = [
    ...iatf.map((i) => ({ fecha: i.dia0 || i.dia10 || i.fechaTransferencia || "", texto: `${i.ronda || "IATF-1"} — ${i.resultado === "✅" ? "preñez confirmada" : i.resultado === "❌" ? "vacía" : "pendiente"}${i.toro ? ` · ${i.toro}` : ""}` })),
    ...pariciones.map((p) => ({ fecha: p.fecha, texto: `Parto${p.eliminado ? " (eliminado)" : ""} — ${p.tipo || "Normal"}${p.terneroCar ? ` · cría ${p.terneroCar}` : ""}`, eliminado: p.eliminado })),
    ...sanidad.map((s) => ({ fecha: s.fecha, texto: `${s.producto || s.tipo}${s.eliminado ? " (eliminado)" : ""}`, eliminado: s.eliminado })),
    ...pesajes.map((p) => ({ fecha: p.fecha, texto: `Pesada — ${p.peso} kg` })),
  ].filter((e) => e.fecha).sort((a, b) => b.fecha.localeCompare(a.fecha));

  const guardarPeso = async () => {
    if (!nuevoPeso.peso || !nuevoPeso.fecha) return;
    setGuardando(true);
    await addPesaje({ animalId: animal.id, caravana: animal.caravana, fecha: nuevoPeso.fecha, peso: +nuevoPeso.peso });
    setNuevoPeso({ fecha: today(), peso: "" });
    setGuardando(false);
    setCargarEvento(false);
  };

  return (
    <Modal onClose={onClose}>
      <div className="flex mb" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="t-etiqueta" style={{ color: "rgba(21,21,15,.5)" }}>Caravana</div>
          <div className="t-display">{animal.caravana}</div>
          <div className="t-auxiliar">{animal.categoria}{animal.nombre ? ` · ${animal.nombre}` : ""} · {animal.lote}{animal.ubicacion ? ` · ${animal.ubicacion}` : ""}</div>
        </div>
        <BadgeEstado estado={animal.estado} />
      </div>

      <div className="grid3 mb">
        <div className="statbox" style={{ padding: 10, textAlign: "center" }}>
          <div className="t-dato">{ultimoPeso || "—"}</div>
          <div className="statbox-lbl">{ultimoPeso ? "kg" : "peso"}</div>
        </div>
        <div className="statbox" style={{ padding: 10, textAlign: "center" }}>
          <div className="t-dato">{edadTexto(animal.fechaNac)}</div>
          <div className="statbox-lbl">edad</div>
        </div>
        <div className="statbox" style={{ padding: 10, textAlign: "center" }}>
          <div className="t-dato">{pariciones.length}</div>
          <div className="statbox-lbl">partos</div>
        </div>
      </div>

      {fechaEst && (
        <div className="highlight-box mb">
          <div className="t-etiqueta">Preñez</div>
          <div className="t-titulo">Parto estimado {formatDisplay(fechaEst)}</div>
          <div className="t-auxiliar">
            {diasFaltan >= 0 ? `${diasFaltan} días` : `${Math.abs(diasFaltan)} días de atraso`}
            {iatfPrenada?.dia0 && ` · confirmado ${formatDisplay(iatfPrenada.dia0)}`}
          </div>
        </div>
      )}

      {animal.obs && <div className="t-auxiliar mb">{animal.obs}</div>}

      {hijos.length > 0 && (
        <div className="mb">
          <div className="t-etiqueta" style={{ color: "rgba(21,21,15,.5)", marginBottom: 6 }}>Crías ({hijos.length})</div>
          <div className="historial-list">
            {hijos.map((h) => (
              <div key={h.id} className="historial-item">
                <span className="historial-texto">Car. {h.caravana} — {h.categoria}</span>
                <BadgeEstado estado={h.estado} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="t-etiqueta" style={{ color: "rgba(21,21,15,.5)", marginBottom: 6 }}>Historial</div>
      <div className="historial-list mb">
        {!eventos.length && <div className="txt-muted">Sin eventos registrados.</div>}
        {eventos.map((e, idx) => (
          <div key={idx} className={`historial-item${e.eliminado ? " historial-eliminado" : ""}`}>
            <span className="historial-fecha">{formatDisplay(e.fecha)}</span>
            <span className="historial-texto">{e.texto}</span>
          </div>
        ))}
      </div>

      {onEdit && !cargarEvento && (
        <div className="flex">
          <Button variant="verde" full onClick={() => setCargarEvento(true)}>
            <Icono nombre="agregar" size={16} /> Cargar evento
          </Button>
        </div>
      )}

      {cargarEvento && (
        <div className="card" style={{ padding: 12 }}>
          <div className="form-row">
            <Field label="Fecha">
              <Input type="date" value={nuevoPeso.fecha} onChange={(e) => setNuevoPeso({ ...nuevoPeso, fecha: e.target.value })} />
            </Field>
            <Field label="Peso (kg)">
              <Input type="number" min="0" placeholder="ej. 320" value={nuevoPeso.peso} onChange={(e) => setNuevoPeso({ ...nuevoPeso, peso: e.target.value })} />
            </Field>
          </div>
          <div className="flex">
            <Button variant="verde" onClick={guardarPeso} disabled={guardando}>Guardar pesada</Button>
            <Button variant="ghost" sm onClick={() => setCargarEvento(false)}>Cancelar</Button>
          </div>
          <div className="t-auxiliar mt">Para sanidad, servicio o partos, usá Rodeo → el módulo correspondiente.</div>
        </div>
      )}

      {onEdit && (
        <button className="btn btn-ghost btn-sm mt" onClick={() => onEdit(caravana)}>
          <Icono nombre="editar" size={14} /> Editar datos del animal
        </button>
      )}
    </Modal>
  );
}
