import { useState, useEffect } from "react";
import { serverTimestamp } from "firebase/firestore";
import { useCollection } from "../hooks/useCollection";
import { useSorter } from "../hooks/useSorter";
import { Modal } from "../components/Modal";
import { Icono } from "../components/Icon";
import { Field, Input, Select, Button, Badge } from "../components/Field";
import { LOTES, TIPOS_SERVICIO, RONDAS_SUGERIDAS, C } from "../lib/constants";
import { canEdit } from "../lib/permissions";
import { formatDisplay } from "../lib/dateUtils";

// Toros de partida — coinciden con los que ya se usan en la estancia.
// El catálogo real vive en la colección Firestore `toros`; esta lista es el
// fallback/base que siempre está disponible aunque la colección esté vacía.
const TOROS_DEFAULT = ["Nando", "Fokker", "Eficaz", "Campero", "Tabasco", "Toro propio"];

// Motivo de "vacía" — separado de Obs. para que quede como dato estructurado
// (filtrable/reportable) y no como texto libre que cada uno escribe distinto.
const MOTIVOS_VACIA = [
  "No repitió celo (vacía real)",
  "Repitió celo",
  "Reabsorción embrionaria",
  "Aborto",
  "Eco/tacto tardío impreciso",
];

const NUEVA_RONDA = "__nueva__";

// Un registro `iatf` viejo (pre-rondas) no tiene el campo `ronda` — se trata
// como "IATF-1" (primera/única ronda de esa campaña) en vez de mostrarlo
// vacío o romper la UI (ver plan: "todo campo nuevo... con fallback").
function rondaDe(i) {
  return i.ronda || "IATF-1";
}

function tipoDe(i) {
  return i.tipoServicio || "IATF";
}

// Normaliza para elegir color de badge — tolera la casing vieja "Repaso toro".
function tipoTone(tipo) {
  const t = (tipo || "IATF").toLowerCase();
  if (t === "te") return "badge-rojo";
  if (t.includes("repaso")) return "badge-paja";
  return "badge-cielo";
}

export function IATF({ animales, updateAnimal, rol, abrirFicha, user }) {
  const puedeEditar = canEdit(rol, "iatf");

  const [iatfD, addIatf, updateIatfDoc, removeIatf] = useCollection("iatf", { auditar: true, user });
  const iatf = iatfD || [];
  const [torosD, addToroD, , removeToroD] = useCollection("toros");
  const torosDB = torosD || [];

  const torosExtra = torosDB.map((t) => t.nombre).filter((n) => !TOROS_DEFAULT.includes(n));
  const toros = [...TOROS_DEFAULT, ...torosExtra];

  const blank = {
    caravana: "", lote: "General", campania: "", ronda: "IATF-1",
    apta: "Apta", protocolo: "Si", tipoServicio: "IATF", toro: "",
    dia0: "", dia8: "", dia10: "",
    donante: "", fechaTransferencia: "",
    resultado: "⏳", origenPreniez: "", motivoVacia: "", obs: "",
  };

  const [showForm, setShowForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(blank);
  const [rondaEsNueva, setRondaEsNueva] = useState(false);
  const [nuevoToro, setNuevoToro] = useState("");
  const [showAddToro, setShowAddToro] = useState(false);
  // Gestión de toros como su propia pantalla — antes solo se podía agregar
  // un toro nuevo abriendo el formulario de servicio y tocando un "+"
  // escondido ahí adentro; ahora también hay una entrada directa y visible.
  const [showToros, setShowToros] = useState(false);
  const [nuevoToroModal, setNuevoToroModal] = useState("");

  const [loteF, setLoteF] = useState("Todos");
  const campanias = [...new Set(iatf.map((i) => i.campania || "2025"))].sort((a, b) => b.localeCompare(a));
  const [campaniaF, setCampaniaF] = useState("Todas");
  useEffect(() => {
    // Recién cuando llegan los datos de Firestore elegimos la campaña más
    // reciente como default (antes de eso `campanias` está vacío).
    if (campaniaF === "Todas" && campanias.length > 0) setCampaniaF(campanias[0]);
  }, [campanias.join(",")]);

  const { sortFn, toggleSort, icon, thStyle } = useSorter("caravana");

  const rowsF = (loteF === "Todos" ? iatf : iatf.filter((i) => i.lote === loteF))
    .filter((i) => campaniaF === "Todas" || (i.campania || "2025") === campaniaF);
  const rows = sortFn(rowsF);

  // --- Estadísticas (mismas fórmulas que la app legacy) ---
  const aptas = rows.filter((i) => i.apta === "Apta").length;
  const inseminadas = rows.filter((i) => i.protocolo === "Si" && i.apta === "Apta").length;
  const aptasNoIatf = rows.filter((i) => i.apta === "Apta" && i.protocolo === "No").length;
  const pend = rows.filter((i) => i.resultado === "⏳").length;
  const prenIatf = rows.filter((i) => i.resultado === "✅" && i.origenPreniez === "IATF").length;
  const prenRepaso = rows.filter((i) => i.resultado === "✅" && i.origenPreniez === "Repaso").length;

  // --- Catálogo de toros ---
  const agregarToro = async () => {
    const t = nuevoToro.trim();
    if (!t || toros.includes(t)) return;
    await addToroD({ nombre: t });
    setForm((f) => ({ ...f, toro: t }));
    setNuevoToro("");
    setShowAddToro(false);
  };
  const eliminarToro = async (nombre) => {
    if (TOROS_DEFAULT.includes(nombre)) return;
    const doc = torosDB.find((t) => t.nombre === nombre);
    if (doc) await removeToroD(doc.id);
  };
  const agregarToroModal = async () => {
    const t = nuevoToroModal.trim();
    if (!t || toros.includes(t)) return;
    await addToroD({ nombre: t });
    setNuevoToroModal("");
  };

  // --- Sync del estado del animal en Hacienda (comportamiento legacy 1:1) ---
  const sincronizarAnimal = async (f) => {
    const animal = animales.find((a) => a.caravana === f.caravana);
    if (!animal) return;
    if (f.resultado === "✅") {
      await updateAnimal(animal.id, { ...animal, estado: "Preñada", toroPreñez: f.toro });
    } else if (f.resultado === "❌") {
      await updateAnimal(animal.id, { ...animal, estado: "Vacía" });
    }
    // ⏳ = sin cambio
  };

  const cancelar = () => {
    setForm(blank);
    setEditandoId(null);
    setShowForm(false);
    setRondaEsNueva(false);
  };

  const guardar = async () => {
    if (!form.caravana) return;
    const data = { ...form, ronda: form.ronda || "IATF-1" };
    if (editandoId) {
      await updateIatfDoc(editandoId, data);
    } else {
      await addIatf({ ...data, creadoEn: serverTimestamp() });
    }
    await sincronizarAnimal(data);
    cancelar();
  };

  const eliminar = async (id) => {
    if (window.confirm("¿Eliminar este registro?")) await removeIatf(id);
  };

  const abrirEditar = (i) => {
    setForm({ ...blank, ...i, ronda: rondaDe(i), tipoServicio: tipoDe(i) });
    setEditandoId(i.id);
    setRondaEsNueva(false);
    setShowForm(true);
  };

  // Opciones de ronda para el formulario: sugeridas + las ya usadas en esta
  // campaña + la actual del registro en edición (si no estuviera en ninguna
  // de las anteriores) — así el usuario puede reusar el nombre de una ronda
  // anterior sin volver a tipearlo.
  const rondasDeLaCampania = [...new Set(
    iatf.filter((i) => (i.campania || "") === (form.campania || "")).map(rondaDe)
  )];
  const rondaOptions = [...new Set([...RONDAS_SUGERIDAS, ...rondasDeLaCampania, form.ronda].filter(Boolean))];

  const esTE = form.tipoServicio === "TE";

  // --- Candidatas a repaso/resincronización ---
  const [showCandidatas, setShowCandidatas] = useState(false);
  const [candCampania, setCandCampania] = useState("");
  const [candRonda, setCandRonda] = useState("Resincro-TE");
  const [candRondaNuevaTxt, setCandRondaNuevaTxt] = useState("");
  const [candExcluidos, setCandExcluidos] = useState(new Set());
  const [candShared, setCandShared] = useState({
    tipoServicio: "IATF", toro: "", dia0: "", dia8: "", dia10: "",
    donante: "", fechaTransferencia: "", obs: "",
  });

  const abrirCandidatas = () => {
    const camp = campaniaF !== "Todas" ? campaniaF : (campanias[0] || "");
    setCandCampania(camp);
    const usadasEnCamp = new Set(iatf.filter((i) => (i.campania || "2025") === camp).map(rondaDe));
    const sugeridaLibre = RONDAS_SUGERIDAS.find((r) => !usadasEnCamp.has(r)) || "Resincro-TE";
    setCandRonda(sugeridaLibre);
    setCandRondaNuevaTxt("");
    setCandExcluidos(new Set());
    setCandShared({ tipoServicio: "IATF", toro: "", dia0: "", dia8: "", dia10: "", donante: "", fechaTransferencia: "", obs: "" });
    setShowCandidatas(true);
  };

  const rondaFinalCandidatas = candRonda === NUEVA_RONDA ? candRondaNuevaTxt.trim() : candRonda;

  // Candidatas = registros de la campaña elegida, de CUALQUIER ronda distinta
  // a la ronda nueva que se va a crear, con resultado ❌ o ⏳ (no preñada
  // todavía). Si un animal aparece en más de un registro anterior, se
  // conserva el más reciente por `creadoEn` real (no por orden de array,
  // que Firestore no garantiza) — los registros viejos sin `creadoEn` se
  // tratan como los más antiguos posibles, nunca ganan un desempate.
  const millisDe = (i) => i?.creadoEn?.seconds ? i.creadoEn.seconds * 1000 : 0;
  const candidatosRaw = iatf.filter(
    (i) => (i.campania || "2025") === candCampania && rondaDe(i) !== rondaFinalCandidatas &&
      (i.resultado === "❌" || i.resultado === "⏳")
  ).sort((a, b) => millisDe(a) - millisDe(b));
  const candMap = new Map();
  candidatosRaw.forEach((i) => candMap.set(i.caravana, i));
  const candidatos = [...candMap.values()];
  const candSeleccionados = candidatos.filter((c) => !candExcluidos.has(c.id));

  const rondasEnCandCampania = [...new Set(iatf.filter((i) => (i.campania || "2025") === candCampania).map(rondaDe))];
  const candRondaOptions = [...new Set([...RONDAS_SUGERIDAS, ...rondasEnCandCampania])];

  const toggleCand = (id) => {
    setCandExcluidos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const crearRondaSiguiente = async () => {
    const ronda = rondaFinalCandidatas;
    if (!ronda || candSeleccionados.length === 0) return;
    await Promise.all(candSeleccionados.map((c) => addIatf({
      creadoEn: serverTimestamp(),
      caravana: c.caravana,
      lote: c.lote || "General",
      campania: candCampania,
      ronda,
      apta: "Apta",
      protocolo: candShared.tipoServicio === "Repaso Toro" ? "No" : "Si",
      tipoServicio: candShared.tipoServicio,
      toro: candShared.toro,
      dia0: candShared.dia0,
      dia8: candShared.dia8,
      dia10: candShared.dia10,
      donante: candShared.donante,
      fechaTransferencia: candShared.fechaTransferencia,
      resultado: "⏳",
      origenPreniez: "",
      obs: `Generado desde "Candidatas" — ronda anterior: ${rondaDe(c)} (resultado: ${c.resultado})`,
    })));
    setShowCandidatas(false);
  };

  return (
    <div>
      {showForm && (
        <Modal onClose={cancelar} title={editandoId ? <><Icono nombre="editar" size={14} /> Editando servicio</> : <><Icono nombre="agregar" size={14} /> Nuevo servicio</>}>
          <div className="form-row">
            <Field label="Caravana">
              <Input value={form.caravana} onChange={(e) => setForm({ ...form, caravana: e.target.value })} />
            </Field>
            <Field label="Lote">
              <Select options={LOTES} value={form.lote} onChange={(e) => setForm({ ...form, lote: e.target.value })} />
            </Field>
          </div>
          <div className="form-row">
            <Field label={<><Icono nombre="fecha" size={14} /> Campaña</>}>
              <Input value={form.campania || ""} onChange={(e) => setForm({ ...form, campania: e.target.value })} placeholder="ej: 2026-2027" />
            </Field>
            <Field label={<><Icono nombre="repasoResincro" size={14} /> Ronda</>}>
              {rondaEsNueva ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <Input
                    value={form.ronda}
                    onChange={(e) => setForm({ ...form, ronda: e.target.value })}
                    placeholder="ej: Resincro-TE"
                    autoFocus
                  />
                  <Button variant="ghost" sm type="button" onClick={() => { setRondaEsNueva(false); setForm((f) => ({ ...f, ronda: rondaOptions[0] || "IATF-1" })); }}><Icono nombre="cerrar" size={14} /></Button>
                </div>
              ) : (
                <Select
                  value={form.ronda}
                  onChange={(e) => {
                    if (e.target.value === NUEVA_RONDA) { setRondaEsNueva(true); setForm({ ...form, ronda: "" }); }
                    else setForm({ ...form, ronda: e.target.value });
                  }}
                  options={[...rondaOptions.map((r) => ({ value: r, label: r })), { value: NUEVA_RONDA, label: "+ Nueva ronda…" }]}
                />
              )}
            </Field>
          </div>
          <div className="form-row">
            <Field label="GDR">
              <Select
                options={["Apta", "No Apta"]}
                value={form.apta}
                onChange={(e) => setForm({ ...form, apta: e.target.value, protocolo: e.target.value === "No Apta" ? "No" : form.protocolo })}
              />
            </Field>
            <Field label={esTE ? "¿Se realizó la transferencia?" : <><Icono nombre="sanidad" size={14} /> Se realizó la IATF</>}>
              <Select
                value={form.protocolo}
                onChange={(e) => setForm({ ...form, protocolo: e.target.value, resultado: e.target.value === "No" ? "❌" : form.resultado })}
                disabled={form.apta === "No Apta"}
                options={[{ value: "Si", label: "✅ Sí" }, { value: "No", label: "❌ No" }]}
              />
            </Field>
          </div>
          <div className="form-row">
            <Field label={<><Icono nombre="fecha" size={14} /> {esTE ? "Día 0 (sincronización receptora)" : "Día 0 (dispositivo)"}</>}>
              <Input type="date" value={form.dia0 || ""} onChange={(e) => setForm({ ...form, dia0: e.target.value })} />
            </Field>
            <Field label={<><Icono nombre="fecha" size={14} /> {esTE ? "Día 8 (retiro receptora)" : "Día 8 (retiro)"}</>}>
              <Input type="date" value={form.dia8 || ""} onChange={(e) => setForm({ ...form, dia8: e.target.value })} />
            </Field>
          </div>
          {!esTE && (
            <div className="form-row">
              <Field label={<><Icono nombre="fecha" size={14} /> Día 10 (inseminación)</>}>
                <Input type="date" value={form.dia10 || ""} onChange={(e) => setForm({ ...form, dia10: e.target.value })} />
              </Field>
              <Field label="Tipo de servicio">
                <Select options={TIPOS_SERVICIO} value={form.tipoServicio} onChange={(e) => setForm({ ...form, tipoServicio: e.target.value })} />
              </Field>
            </div>
          )}
          {esTE && (
            <div className="form-row">
              <Field label="Vaca donante (genética de origen)">
                <Input value={form.donante || ""} onChange={(e) => setForm({ ...form, donante: e.target.value })} placeholder="caravana propia o genética comprada" />
              </Field>
              <Field label={<><Icono nombre="fecha" size={14} /> Fecha de transferencia</>}>
                <Input type="date" value={form.fechaTransferencia || ""} onChange={(e) => setForm({ ...form, fechaTransferencia: e.target.value })} />
              </Field>
            </div>
          )}
          {esTE && (
            <div className="form-row">
              <Field label="Tipo de servicio">
                <Select options={TIPOS_SERVICIO} value={form.tipoServicio} onChange={(e) => setForm({ ...form, tipoServicio: e.target.value })} />
              </Field>
              <div />
            </div>
          )}
          <div className="form-row">
            <Field label={esTE ? <><Icono nombre="servicios" size={14} /> Toro/pajuela del embrión</> : <><Icono nombre="toro" size={14} /> Toro</>}>
              <div style={{ display: "flex", gap: 6, flexDirection: "column" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <Select style={{ flex: 1 }} options={toros} value={form.toro} onChange={(e) => setForm({ ...form, toro: e.target.value })} />
                  <Button variant="ghost" sm type="button" onClick={() => setShowAddToro((v) => !v)} title="Agregar toro"><Icono nombre="agregar" size={14} /></Button>
                </div>
                {showAddToro && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Input
                      style={{ flex: 1, minWidth: 120 }}
                      placeholder="Nombre del toro / semen"
                      value={nuevoToro}
                      onChange={(e) => setNuevoToro(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && agregarToro()}
                    />
                    <Button variant="verde" sm type="button" onClick={agregarToro}>Agregar</Button>
                    <Button variant="ghost" sm type="button" onClick={() => setShowAddToro(false)}><Icono nombre="cerrar" size={14} /></Button>
                  </div>
                )}
                {showAddToro && toros.filter((t) => !TOROS_DEFAULT.includes(t)).length > 0 && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {toros.filter((t) => !TOROS_DEFAULT.includes(t)).map((t) => (
                      <span key={t} style={{ background: "rgba(21,21,15,.1)", borderRadius: 20, padding: "2px 8px", fontSize: 11, display: "flex", gap: 4, alignItems: "center" }}>
                        {t}
                        <button type="button" onClick={() => eliminarToro(t)} style={{ background: "none", border: "none", cursor: "pointer", color: C.urgente, fontSize: 12, padding: 0, lineHeight: 1 }}><Icono nombre="cerrar" size={12} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Field>
          </div>
          <div className="form-row">
            <Field label="Resultado">
              <Select
                value={form.resultado}
                onChange={(e) => setForm({ ...form, resultado: e.target.value, origenPreniez: e.target.value === "✅" ? (form.origenPreniez || (esTE ? "TE" : "IATF")) : "" })}
                options={[{ value: "⏳", label: "⏳ Pendiente" }, { value: "✅", label: "✅ Preñada" }, { value: "❌", label: "❌ Vacía" }]}
              />
            </Field>
            <Field label="Origen preñez">
              <Select
                value={form.origenPreniez || ""}
                onChange={(e) => setForm({ ...form, origenPreniez: e.target.value })}
                disabled={form.resultado !== "✅"}
                placeholder="—"
                options={[{ value: "IATF", label: "✅ IATF" }, { value: "TE", label: "🧬 TE" }, { value: "Repaso", label: "🐂 Repaso" }]}
              />
            </Field>
          </div>
          {form.resultado === "❌" && (
            <div className="form-row">
              <Field label="Motivo (vacía)">
                <Select
                  value={form.motivoVacia || ""}
                  onChange={(e) => setForm({ ...form, motivoVacia: e.target.value })}
                  placeholder="Sin especificar"
                  options={MOTIVOS_VACIA.map((m) => ({ value: m, label: m }))}
                />
              </Field>
            </div>
          )}
          <div className="form-row">
            <Field label="Obs.">
              <Input value={form.obs || ""} onChange={(e) => setForm({ ...form, obs: e.target.value })} />
            </Field>
          </div>
          <div className="flex mt">
            <Button variant="verde" onClick={guardar}><Icono nombre="guardar" size={14} /> {editandoId ? "Guardar cambios" : "Guardar"}</Button>
            <Button variant="ghost" sm onClick={cancelar}>Cancelar</Button>
          </div>
        </Modal>
      )}

      {showCandidatas && (
        <Modal onClose={() => setShowCandidatas(false)} title={<><Icono nombre="repasoResincro" size={14} /> Candidatas a repaso / resincronización</>} wide>
          <div className="txt-muted mb">
            Animales de la campaña elegida que quedaron <Icono nombre="negativo" size={12} /> o <Icono nombre="pendiente" size={12} /> en una ronda anterior — se generará un
            registro nuevo por cada una seleccionada, en la ronda indicada abajo.
          </div>
          <div className="form-row">
            <Field label="Campaña">
              <Select options={campanias} value={candCampania} onChange={(e) => setCandCampania(e.target.value)} />
            </Field>
            <Field label="Ronda nueva a crear">
              {candRonda === NUEVA_RONDA ? (
                <Input autoFocus value={candRondaNuevaTxt} onChange={(e) => setCandRondaNuevaTxt(e.target.value)} placeholder="ej: Resincro-TE" />
              ) : (
                <Select
                  value={candRonda}
                  onChange={(e) => setCandRonda(e.target.value)}
                  options={[...candRondaOptions.map((r) => ({ value: r, label: r })), { value: NUEVA_RONDA, label: "+ Nueva ronda…" }]}
                />
              )}
            </Field>
          </div>
          <div className="form-row">
            <Field label="Tipo de servicio de la ronda nueva">
              <Select options={TIPOS_SERVICIO} value={candShared.tipoServicio} onChange={(e) => setCandShared({ ...candShared, tipoServicio: e.target.value })} />
            </Field>
            <Field label={candShared.tipoServicio === "TE" ? <><Icono nombre="servicios" size={14} /> Toro/pajuela del embrión</> : <><Icono nombre="toro" size={14} /> Toro</>}>
              <Select options={toros} value={candShared.toro} onChange={(e) => setCandShared({ ...candShared, toro: e.target.value })} />
            </Field>
          </div>
          <div className="form-row">
            <Field label={<><Icono nombre="fecha" size={14} /> {candShared.tipoServicio === "TE" ? "Día 0 (sincronización receptora)" : "Día 0"}</>}>
              <Input type="date" value={candShared.dia0} onChange={(e) => setCandShared({ ...candShared, dia0: e.target.value })} />
            </Field>
            <Field label={<><Icono nombre="fecha" size={14} /> {candShared.tipoServicio === "TE" ? "Día 8 (retiro receptora)" : "Día 8"}</>}>
              <Input type="date" value={candShared.dia8} onChange={(e) => setCandShared({ ...candShared, dia8: e.target.value })} />
            </Field>
          </div>
          {candShared.tipoServicio === "TE" ? (
            <div className="form-row">
              <Field label="Vaca donante (genética de origen)">
                <Input value={candShared.donante} onChange={(e) => setCandShared({ ...candShared, donante: e.target.value })} />
              </Field>
              <Field label={<><Icono nombre="fecha" size={14} /> Fecha de transferencia</>}>
                <Input type="date" value={candShared.fechaTransferencia} onChange={(e) => setCandShared({ ...candShared, fechaTransferencia: e.target.value })} />
              </Field>
            </div>
          ) : (
            <div className="form-row">
              <Field label={<><Icono nombre="fecha" size={14} /> Día 10 (inseminación)</>}>
                <Input type="date" value={candShared.dia10} onChange={(e) => setCandShared({ ...candShared, dia10: e.target.value })} />
              </Field>
              <div />
            </div>
          )}

          <div className="section-hdr" style={{ marginTop: 12, marginBottom: 6 }}>
            <h2 style={{ fontSize: 15 }}>Candidatas ({candSeleccionados.length} / {candidatos.length} seleccionadas)</h2>
          </div>
          {candidatos.length === 0 ? (
            <div className="txt-muted">No hay candidatas con esos filtros — no quedan animales <Icono nombre="negativo" size={12} />/<Icono nombre="pendiente" size={12} /> en otra ronda de esta campaña.</div>
          ) : (
            <div className="tbl-wrap" style={{ maxHeight: 260, overflowY: "auto" }}>
              <table>
                <thead><tr>
                  <th></th><th>Caravana</th><th>Lote</th><th>Ronda anterior</th><th>Resultado anterior</th>
                </tr></thead>
                <tbody>
                  {candidatos.map((c) => (
                    <tr key={c.id}>
                      <td><input type="checkbox" checked={!candExcluidos.has(c.id)} onChange={() => toggleCand(c.id)} /></td>
                      <td><strong>{c.caravana}</strong></td>
                      <td>{c.lote}</td>
                      <td>{rondaDe(c)}</td>
                      <td>{c.resultado === "✅" ? <Icono nombre="positivo" size={14} /> : c.resultado === "❌" ? <Icono nombre="negativo" size={14} /> : <Icono nombre="pendiente" size={14} />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex mt">
            <Button variant="verde" onClick={crearRondaSiguiente} disabled={!rondaFinalCandidatas || candSeleccionados.length === 0}>
              <Icono nombre="guardar" size={14} /> Crear {candSeleccionados.length} registro{candSeleccionados.length === 1 ? "" : "s"}
            </Button>
            <Button variant="ghost" sm onClick={() => setShowCandidatas(false)}>Cancelar</Button>
          </div>
        </Modal>
      )}

      <div className="section-hdr">
        <h2><Icono nombre="servicios" size={16} /> Servicios</h2>
        <div className="flex" style={{ gap: 6, flexWrap: "wrap" }}>
          {puedeEditar && <Button variant="ghost" sm onClick={() => setShowToros(true)}><Icono nombre="toro" size={14} /> Toros</Button>}
          {puedeEditar && <Button variant="ghost" sm onClick={abrirCandidatas}><Icono nombre="repasoResincro" size={14} /> Candidatas a repaso</Button>}
          {puedeEditar && <Button variant="prim" sm onClick={() => setShowForm(!showForm)}>{showForm ? <Icono nombre="cerrar" size={14} /> : <Icono nombre="agregar" size={14} />}</Button>}
        </div>
      </div>

      {showToros && (
        <Modal onClose={() => setShowToros(false)} title={<><Icono nombre="toro" size={16} /> Toros</>}>
          <p className="txt-muted mb" style={{ fontSize: 12 }}>
            Nombres de toro/pajuela disponibles al cargar un servicio — pueden ser toros propios o semen de inseminación, no hace falta que estén dados de alta como animal en Rodeo.
          </p>
          <div className="flex mb">
            <Input
              placeholder="Nombre del toro o pajuela"
              value={nuevoToroModal}
              onChange={(e) => setNuevoToroModal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && agregarToroModal()}
            />
            <Button variant="verde" sm onClick={agregarToroModal}><Icono nombre="agregar" size={14} /> Agregar</Button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {toros.map((t) => (
              <div key={t} className="flex" style={{ justifyContent: "space-between", padding: "8px 10px", border: "1px solid rgba(21,21,15,.12)", borderRadius: "var(--radius)" }}>
                <span>{t}</span>
                {TOROS_DEFAULT.includes(t) ? (
                  <span className="txt-muted" style={{ fontSize: 11 }}>base</span>
                ) : (
                  <button className="btn btn-ghost btn-sm" onClick={() => eliminarToro(t)}><Icono nombre="eliminar" size={13} /></button>
                )}
              </div>
            ))}
          </div>
        </Modal>
      )}

      <div className="tab-pills" style={{ marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: C.cuero, padding: "5px 4px", whiteSpace: "nowrap" }}>Lote:</span>
        {["Todos", ...LOTES].map((l) => (
          <button key={l} className={`pill${loteF === l ? " active" : ""}`} onClick={() => setLoteF(l)}>{l}</button>
        ))}
      </div>
      <div className="tab-pills">
        <span style={{ fontSize: 10, color: C.cuero, padding: "5px 4px", whiteSpace: "nowrap" }}>Campaña:</span>
        {["Todas", ...campanias].map((c) => (
          <button key={c} className={`pill${campaniaF === c ? " active" : ""}`} onClick={() => setCampaniaF(c)}>{c}</button>
        ))}
      </div>

      <div className="grid4 mb">
        <div className="statbox" data-icon="🐄"><div className="statbox-num">{rows.length}</div><div className="statbox-lbl">Evaluadas GDR</div></div>
        <div className="statbox cielo" data-icon="✅"><div className="statbox-num">{aptas}</div><div className="statbox-lbl">Aptas GDR</div></div>
        <div className="statbox paja" data-icon="❌"><div className="statbox-num">{aptasNoIatf}</div><div className="statbox-lbl">Aptas sin IATF</div></div>
        <div className="statbox cielo" data-icon="💉"><div className="statbox-num">{inseminadas}</div><div className="statbox-lbl">Inseminadas</div></div>
        <div className="statbox verde" data-icon="🧬"><div className="statbox-num">{prenIatf}</div><div className="statbox-lbl">Preñ. IATF</div></div>
        <div className="statbox paja" data-icon="🐂"><div className="statbox-num">{prenRepaso}</div><div className="statbox-lbl">Preñ. Repaso</div></div>
        <div className="statbox paja" data-icon="⏳"><div className="statbox-num">{pend}</div><div className="statbox-lbl">Pendientes</div></div>
        <div className="statbox paja" data-icon="📊"><div className="statbox-num">{inseminadas > 0 ? ((prenIatf / inseminadas) * 100).toFixed(0) : 0}%</div><div className="statbox-lbl">% Preñez IATF</div></div>
        <div className="statbox cielo" data-icon="📊"><div className="statbox-num">{aptas > 0 ? (((prenIatf + prenRepaso) / aptas) * 100).toFixed(0) : 0}%</div><div className="statbox-lbl">% Total preñez</div></div>
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead><tr>
              <th style={thStyle("campania")} onClick={() => toggleSort("campania")}>Campaña{icon("campania")}</th>
              <th style={thStyle("ronda")} onClick={() => toggleSort("ronda")}>Ronda{icon("ronda")}</th>
              <th style={thStyle("caravana")} onClick={() => toggleSort("caravana")}>Car.{icon("caravana")}</th>
              <th style={thStyle("lote")} onClick={() => toggleSort("lote")}>Lote{icon("lote")}</th>
              <th style={thStyle("apta")} onClick={() => toggleSort("apta")}>GDR{icon("apta")}</th>
              <th style={thStyle("protocolo")} onClick={() => toggleSort("protocolo")}>Protoc.{icon("protocolo")}</th>
              <th>Tipo</th>
              <th>Día 0</th>
              <th>Día 10 / Transf.</th>
              <th style={thStyle("toro")} onClick={() => toggleSort("toro")}>Toro{icon("toro")}</th>
              <th style={thStyle("resultado")} onClick={() => toggleSort("resultado")}>Resultado{icon("resultado")}</th>
              <th style={thStyle("origenPreniez")} onClick={() => toggleSort("origenPreniez")}>Origen{icon("origenPreniez")}</th>
              <th>Obs.</th>
              {puedeEditar && <th></th>}
            </tr></thead>
            <tbody>
              {rows.map((i) => {
                const anim = animales.find((a) => a.caravana === i.caravana);
                const tipo = tipoDe(i);
                const fechaRef = tipo === "TE" ? i.fechaTransferencia : i.dia10;
                return (
                  <tr key={i.id}>
                    <td><Badge tone="cielo">{i.campania || "2025"}</Badge></td>
                    <td><Badge tone="morado">{rondaDe(i)}</Badge></td>
                    <td>{anim ? <button className="btn btn-ghost btn-sm" style={{ padding: "2px 8px", fontWeight: 700, fontSize: 12 }} onClick={() => abrirFicha(i.caravana)}>{i.caravana}</button> : <strong>{i.caravana}</strong>}</td>
                    <td><Badge tone="cielo">{i.lote}</Badge></td>
                    <td><Badge tone={i.apta === "Apta" ? "verde" : "rojo"}>{i.apta === "Apta" ? "✓ Apta" : "✗ No"}</Badge></td>
                    <td style={{ textAlign: "center" }}>
                      {i.apta === "No Apta"
                        ? <span className="txt-muted">—</span>
                        : i.protocolo === "No"
                          ? <Badge tone="rojo">✗ No</Badge>
                          : <Badge tone="verde">✔ Sí</Badge>}
                    </td>
                    <td><span className={`badge ${tipoTone(tipo)}`} style={{ fontSize: 9 }}>{tipo}</span></td>
                    <td style={{ fontSize: 10, color: "rgba(21,21,15,.6)" }}>{formatDisplay(i.dia0) || "—"}</td>
                    <td style={{ fontSize: 10, color: "rgba(21,21,15,.6)" }}>{formatDisplay(fechaRef) || "—"}{tipo === "TE" && fechaRef ? " (TE)" : ""}</td>
                    <td style={{ fontSize: 11 }}>{i.toro}</td>
                    <td style={{ fontSize: 13, textAlign: "center" }}>{i.resultado === "⏳" ? <><Icono nombre="pendiente" size={12} /> Pend.</> : i.resultado === "✅" ? <><Icono nombre="positivo" size={12} /> Preñada</> : <><Icono nombre="negativo" size={12} /> Vacía</>}</td>
                    <td style={{ fontSize: 11, textAlign: "center" }}>
                      {i.resultado === "✅"
                        ? <Badge tone={i.origenPreniez === "Repaso" ? "paja" : i.origenPreniez === "TE" ? "rojo" : "verde"}>{i.origenPreniez || "—"}</Badge>
                        : <span className="txt-muted">—</span>}
                    </td>
                    <td className="txt-muted" style={{ fontSize: 10, maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.obs || "—"}</td>
                    {puedeEditar && (
                      <td style={{ display: "flex", gap: 4 }}>
                        <button className="btn btn-ghost btn-sm" style={{ fontSize: 12, padding: "3px 8px" }} onClick={() => abrirEditar(i)}><Icono nombre="editar" size={14} /></button>
                        <button className="btn btn-rojo btn-sm" onClick={() => eliminar(i.id)}><Icono nombre="eliminar" size={14} /></button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
