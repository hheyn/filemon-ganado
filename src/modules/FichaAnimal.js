import { useState } from "react";
import { useCollection } from "../hooks/useCollection";
import { today, formatDisplay, daysBetween, parseLocalDate } from "../lib/dateUtils";
import { fechaReferenciaGestacion, fechaPartoEstimada } from "../lib/gestacion";
import { Modal } from "../components/Modal";
import { Icono } from "../components/Icon";
import { Field, Input, Select, Button, Badge, BadgeEstado } from "../components/Field";
import { canEdit } from "../lib/permissions";
import { cerrarRondasPendientes } from "../lib/servicios";

const MOTIVOS_VACIA = [
  "No repitió celo (vacía real)",
  "Repitió celo",
  "Reabsorción embrionaria",
  "Aborto",
  "Eco/tacto tardío impreciso",
];

function fechaAuditoria(v) {
  if (!v) return "";
  if (typeof v.toDate === "function") return v.toDate().toLocaleDateString("es-PY");
  if (typeof v.seconds === "number") return new Date(v.seconds * 1000).toLocaleDateString("es-PY");
  return "";
}

// Traduce el diff crudo de useCollection a texto legible para el historial —
// solo interesan los campos que realmente cambian el relato del animal.
const ETIQUETA_CAMPO = { resultado: "Resultado", tipo: "Tipo de parto", estado: "Estado", motivoVacia: "Motivo" };
const ETIQUETA_VALOR = { "✅": "preñada", "❌": "vacía", "⏳": "pendiente" };
function textoCorreccion(cambios) {
  const v = (x) => ETIQUETA_VALOR[x] || x || "—";
  const partes = Object.keys(cambios)
    .filter((c) => ETIQUETA_CAMPO[c])
    .map((c) => `${ETIQUETA_CAMPO[c]}: ${v(cambios[c].antes)} → ${v(cambios[c].despues)}`);
  return partes.length ? `Corrección — ${partes.join(" · ")}` : null;
}

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
export function FichaAnimal({ caravana, animales, rol, user, onEdit, onClose, updateAnimal, onAbrirFicha }) {
  const animal = animales.find((a) => a.caravana === caravana);
  const puedeEditarIatf = canEdit(rol, "iatf");

  const [iatfD, , updateIatfDoc] = useCollection("iatf", { auditar: true, user });
  const [parD] = useCollection("pariciones", { softDelete: true, incluirEliminados: true });
  const [sanD] = useCollection("sanidad", { softDelete: true, incluirEliminados: true });
  const [pesD, addPesaje] = useCollection("pesajes");
  const [audD] = useCollection("auditoria");

  const [cargarEvento, setCargarEvento] = useState(false);
  const [nuevoPeso, setNuevoPeso] = useState({ fecha: today(), peso: "" });
  const [guardando, setGuardando] = useState(false);
  const [editandoIatfId, setEditandoIatfId] = useState(null);
  const [formIatf, setFormIatf] = useState(null);

  if (!animal) {
    onClose?.();
    return null;
  }

  const iatf = (iatfD || []).filter((i) => i.caravana === animal.caravana);
  const pariciones = (parD || []).filter((p) => p.madreCaravana === animal.caravana);
  // Sanidad por lote sin lista de caravanas: solo cuenta lo aplicado desde
  // que el animal nació — si no, un ternero "heredaba" vacunas de su lote
  // aplicadas antes de existir.
  const sanidad = (sanD || []).filter((s) =>
    s.caravana === animal.caravana ||
    (s.caravanas || []).includes(animal.caravana) ||
    (!s.caravana && !(s.caravanas || []).length && s.lote === animal.lote && (!animal.fechaNac || (s.fecha || "") >= animal.fechaNac))
  );
  const pesajes = (pesD || []).filter((p) => (p.caravana ? p.caravana === animal.caravana : p.animalId === animal.id));
  const hijos = animales.filter((a) => a.madreCaravana === animal.caravana);
  const ultimoPesaje = [...pesajes].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""))[0];

  // Origen: el parto es la fuente principal; la ficha del animal cubre a los
  // nacidos antes de que existiera el registro de partos.
  const parto = (parD || []).find((p) => !p.eliminado && p.terneroCar === animal.caravana);
  const madreCar = parto?.madreCaravana || animal.madreCaravana || "";
  const fechaNac = animal.fechaNac || parto?.fecha || "";
  // En adultos `pesoInicial` es el peso de alta en el rodeo, no de nacimiento.
  const esCria = ["Ternero", "Ternera", "Desmamante Macho", "Desmamante Hembra"].includes(animal.categoria);
  const pesoNac = +parto?.pesoNac || (esCria ? +animal.pesoInicial : 0) || null;
  const padre = animal.padreCaravana || (() => {
    if (!madreCar || !fechaNac) return "";
    const servicio = (iatfD || []).find((i) => {
      if (i.caravana !== madreCar || i.resultado !== "✅") return false;
      const est = fechaPartoEstimada(i);
      return est && Math.abs(daysBetween(est, fechaNac)) <= 60;
    });
    return servicio?.toro || "";
  })();
  const madreExiste = madreCar && animales.some((a) => a.caravana === madreCar);
  const tieneOrigen = madreCar || fechaNac || pesoNac || padre || animal.fechaDestete;

  const ultimoPeso = ultimoPesaje?.peso || pesoNac || +animal.pesoInicial || null;
  const pesoEsNacimiento = !ultimoPesaje && !!pesoNac;

  // Preñez destacada: último IATF con resultado ✅ para esta caravana.
  const iatfPrenada = animal.estado === "Preñada"
    ? [...iatf].filter((i) => i.resultado === "✅" && fechaReferenciaGestacion(i)).sort((a, b) => (b.dia0 || "").localeCompare(a.dia0 || ""))[0]
    : null;
  const fechaEst = iatfPrenada ? fechaPartoEstimada(iatfPrenada) : null;
  const diasFaltan = fechaEst ? daysBetween(fechaEst, today()) * -1 : null;

  // Historial unificado, lista seca, una línea por evento.
  const eventos = [
    ...iatf.map((i) => ({ fecha: i.dia0 || i.dia10 || i.fechaTransferencia || "", texto: `${i.ronda || "IATF-1"} — ${i.resultado === "✅" ? "preñez confirmada" : i.resultado === "❌" ? "vacía" : "pendiente"}${i.motivoVacia ? ` (${i.motivoVacia})` : ""}${i.toro ? ` · ${i.toro}` : ""}` })),
    ...pariciones.map((p) => ({ fecha: p.fecha, texto: `Parto${p.eliminado ? " (eliminado)" : ""} — ${p.tipo || "Normal"}${p.terneroCar ? ` · cría ${p.terneroCar}` : ""}`, eliminado: p.eliminado })),
    ...sanidad.map((s) => ({ fecha: s.fecha, texto: `${s.producto || s.tipo}${s.eliminado ? " (eliminado)" : ""}`, eliminado: s.eliminado })),
    ...pesajes.map((p) => ({ fecha: p.fecha, texto: `Pesada — ${p.peso} kg` })),
  ].filter((e) => e.fecha).sort((a, b) => b.fecha.localeCompare(a.fecha));

  // Correcciones posteriores (ej. eco tardía imprecisa, reabsorción de
  // embrión) — se muestran aparte para no perder el registro original: la
  // vaca sigue mostrando que en su momento se cargó "preñada", más la
  // corrección posterior con fecha y quién la hizo.
  const idsPropios = new Set([...iatf.map((i) => i.id), ...pariciones.map((p) => p.id)]);
  const correcciones = (audD || [])
    .filter((a) => a.accion === "editar" && a.cambios && idsPropios.has(a.docId))
    .map((a) => ({ id: a.id, fecha: fechaAuditoria(a.fecha), texto: textoCorreccion(a.cambios), email: a.email }))
    .filter((c) => c.texto);

  const abrirEditarIatf = (i) => {
    setEditandoIatfId(i.id);
    setFormIatf({ resultado: i.resultado || "⏳", origenPreniez: i.origenPreniez || "", motivoVacia: i.motivoVacia || "" });
  };

  const guardarIatf = async () => {
    if (!editandoIatfId || !formIatf) return;
    setGuardando(true);
    await updateIatfDoc(editandoIatfId, formIatf);
    if (formIatf.resultado === "✅") {
      const reg = iatf.find((i) => i.id === editandoIatfId);
      if (reg) await cerrarRondasPendientes({ caravana: reg.caravana, campania: reg.campania, rondaPrenez: reg.ronda || "IATF-1", excluirId: reg.id });
    }
    // Mismo criterio que IATF.js sincronizarAnimal(): el resultado del
    // servicio es la fuente de verdad del estado reproductivo del animal —
    // si se corrige acá, el estado tiene que moverse con él, si no queda la
    // misma desincronización que motivó este fix (iatf ✅ viejo vs. estado
    // del animal ya cambiado por otro lado).
    if (updateAnimal && (formIatf.resultado === "✅" || formIatf.resultado === "❌")) {
      await updateAnimal(animal.id, {
        ...animal,
        estado: formIatf.resultado === "✅" ? "Preñada" : "Vacía",
        toroPreñez: formIatf.resultado === "✅" ? animal.toroPreñez : "",
      });
    }
    setGuardando(false);
    setEditandoIatfId(null);
    setFormIatf(null);
  };

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
      <div className="flex mb" style={{ justifyContent: "space-between", alignItems: "flex-start", paddingRight: 38 }}>
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
          <div className="statbox-lbl">{ultimoPeso ? (pesoEsNacimiento ? "kg al nacer" : "kg") : "peso"}</div>
        </div>
        <div className="statbox" style={{ padding: 10, textAlign: "center" }}>
          <div className="t-dato">{edadTexto(fechaNac)}</div>
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

      {tieneOrigen && (
        <div className="mb">
          <div className="t-etiqueta" style={{ color: "rgba(21,21,15,.5)", marginBottom: 6 }}>Origen</div>
          <div className="historial-list">
            <div className="historial-item">
              <span className="historial-fecha">Madre</span>
              <span className="historial-texto">
                {madreCar
                  ? madreExiste && onAbrirFicha
                    ? <button className="btn btn-ghost btn-sm" style={{ padding: "2px 8px", fontWeight: 700 }} onClick={() => onAbrirFicha(madreCar)}>Car. {madreCar}</button>
                    : `Car. ${madreCar}${madreExiste ? "" : " (ya no está en el rodeo)"}`
                  : "—"}
              </span>
            </div>
            <div className="historial-item">
              <span className="historial-fecha">Padre</span>
              <span className="historial-texto">{padre || "—"}</span>
            </div>
            <div className="historial-item">
              <span className="historial-fecha">Nacimiento</span>
              <span className="historial-texto">
                {fechaNac ? formatDisplay(fechaNac) : "—"}
                {parto?.tipo ? ` · parto ${parto.tipo.toLowerCase()}` : ""}
              </span>
            </div>
            <div className="historial-item">
              <span className="historial-fecha">Peso al nacer</span>
              <span className="historial-texto">{pesoNac ? `${pesoNac} kg` : "—"}</span>
            </div>
            {animal.fechaDestete && (
              <div className="historial-item">
                <span className="historial-fecha">Destete</span>
                <span className="historial-texto">
                  {formatDisplay(animal.fechaDestete)}
                  {+animal.pesoDestete > 0 && ` · ${animal.pesoDestete} kg`}
                  {+animal.pesoDestete > 0 && pesoNac && fechaNac && daysBetween(animal.fechaDestete, fechaNac) > 0 &&
                    ` · ganó ${((animal.pesoDestete - pesoNac) / daysBetween(animal.fechaDestete, fechaNac)).toFixed(2).replace(".", ",")} kg/día`}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {hijos.length > 0 && (
        <div className="mb">
          <div className="t-etiqueta" style={{ color: "rgba(21,21,15,.5)", marginBottom: 6 }}>Crías ({hijos.length})</div>
          <div className="historial-list">
            {[...hijos].sort((a, b) => (b.fechaNac || "").localeCompare(a.fechaNac || "")).map((h) => {
              const p = (parD || []).find((x) => !x.eliminado && x.terneroCar === h.caravana);
              const peso = +p?.pesoNac || +h.pesoInicial;
              return (
                <div key={h.id} className="historial-item" style={onAbrirFicha ? { cursor: "pointer" } : undefined} onClick={() => onAbrirFicha?.(h.caravana)}>
                  <span className="historial-fecha">{formatDisplay(h.fechaNac || p?.fecha) || "—"}</span>
                  <span className="historial-texto">Car. {h.caravana} — {h.categoria}{peso ? ` · ${peso} kg al nacer` : ""}</span>
                  <BadgeEstado estado={h.estado} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {iatf.length > 0 && (
        <div className="mb">
          <div className="t-etiqueta" style={{ color: "rgba(21,21,15,.5)", marginBottom: 6 }}>Servicios (IATF)</div>
          <div className="historial-list">
            {[...iatf].sort((a, b) => (b.dia0 || "").localeCompare(a.dia0 || "")).map((i) => (
              <div key={i.id}>
                <div className="historial-item">
                  <span className="historial-texto">
                    {i.ronda || "IATF-1"} — {i.resultado === "✅" ? "preñada" : i.resultado === "❌" ? "vacía" : "pendiente"}
                    {i.motivoVacia ? ` (${i.motivoVacia})` : ""}{i.dia0 ? ` · ${formatDisplay(i.dia0)}` : ""}
                  </span>
                  {puedeEditarIatf && editandoIatfId !== i.id && (
                    <button className="btn btn-ghost btn-sm" style={{ fontSize: 12, padding: "3px 8px" }} onClick={() => abrirEditarIatf(i)}>
                      <Icono nombre="editar" size={14} />
                    </button>
                  )}
                </div>
                {editandoIatfId === i.id && (
                  <div className="card" style={{ padding: 10, marginBottom: 6 }}>
                    <div className="form-row">
                      <Field label="Resultado">
                        <Select
                          value={formIatf.resultado}
                          onChange={(e) => setFormIatf({ ...formIatf, resultado: e.target.value, origenPreniez: e.target.value === "✅" ? (formIatf.origenPreniez || "IATF") : "" })}
                          options={[{ value: "⏳", label: "⏳ Pendiente" }, { value: "✅", label: "✅ Preñada" }, { value: "❌", label: "❌ Vacía" }]}
                        />
                      </Field>
                      {formIatf.resultado === "✅" && (
                        <Field label="Origen preñez">
                          <Select
                            value={formIatf.origenPreniez || ""}
                            onChange={(e) => setFormIatf({ ...formIatf, origenPreniez: e.target.value })}
                            options={[{ value: "IATF", label: "✅ IATF" }, { value: "TE", label: "🧬 TE" }, { value: "Repaso", label: "🐂 Repaso" }]}
                          />
                        </Field>
                      )}
                      {formIatf.resultado === "❌" && (
                        <Field label="Motivo">
                          <Select
                            value={formIatf.motivoVacia || ""}
                            onChange={(e) => setFormIatf({ ...formIatf, motivoVacia: e.target.value })}
                            placeholder="Sin especificar"
                            options={MOTIVOS_VACIA.map((m) => ({ value: m, label: m }))}
                          />
                        </Field>
                      )}
                    </div>
                    <div className="flex">
                      <Button variant="verde" sm onClick={guardarIatf} disabled={guardando}>Guardar</Button>
                      <Button variant="ghost" sm onClick={() => setEditandoIatfId(null)}>Cancelar</Button>
                    </div>
                  </div>
                )}
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

      {correcciones.length > 0 && (
        <div className="mb">
          <div className="t-etiqueta" style={{ color: "rgba(21,21,15,.5)", marginBottom: 6 }}>Correcciones</div>
          <div className="historial-list">
            {correcciones.map((c) => (
              <div key={c.id} className="historial-item">
                <span className="historial-fecha">{c.fecha}</span>
                <span className="historial-texto">{c.texto}{c.email ? ` · ${c.email}` : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
