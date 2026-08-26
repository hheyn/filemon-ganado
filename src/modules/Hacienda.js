import { useState, useEffect } from "react";
import { CATEGORIAS, ESTADOS, LOTES, UBICACIONES, C } from "../lib/constants";
import { today } from "../lib/dateUtils";
import { canEdit } from "../lib/permissions";
import { moverAnimales } from "../lib/rotaciones";
import { useCollection } from "../hooks/useCollection";
import { useSorter } from "../hooks/useSorter";
import { useColumnFilter } from "../hooks/useColumnFilter";
import { Modal } from "../components/Modal";
import { Field, Input, Select, Button, Badge, BadgeEstado } from "../components/Field";
import { ColHeader } from "../components/ColHeader";
import { Icono } from "../components/Icon";

const BLANK = {
  caravana: "", nombre: "", categoria: "Vaca", lote: "General", ubicacion: "",
  estado: "OK", toroPreñez: "", fechaNac: "", madreCaravana: "", padreCaravana: "",
  pesoInicial: "", obs: "",
};

export function Hacienda({ animales, addAnimal, updateAnimal, removeAnimal, rol, abrirFicha, editarCaravana, onEditarConsumido }) {
  const puedeEditar = canEdit(rol, "hacienda");

  // Cada módulo maneja sus propias colecciones — rotaciones se usa acá solo
  // para alimentar moverAnimales() (ver lib/rotaciones.js).
  const [rotacionesD] = useCollection("rotaciones");
  const rotaciones = rotacionesD || [];

  const [form, setForm] = useState(BLANK);
  const [edit, setEdit] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  const [filtro, setFiltro] = useState("");
  const [loteF, setLoteF] = useState("Todos");

  const [showMover, setShowMover] = useState(false);
  const [moverForm, setMoverForm] = useState({ lote: "", ubicacion: "", entrada: today(), obs: "" });

  const [showCambiarCat, setShowCambiarCat] = useState(false);
  const [catForm, setCatForm] = useState({ lote: "", categoriaOrigen: "", categoriaDestino: "" });

  const vacas = animales.filter((a) => ["Vaca", "Vaquilla"].includes(a.categoria));
  const toros = animales.filter((a) => a.categoria === "Toro");

  const sorter = useSorter("caravana");
  const base = sorter.sortFn(
    animales.filter((a) => {
      const lOk = loteF === "Todos" || a.lote === loteF;
      const bOk = !filtro ||
        (a.caravana || "").toLowerCase().includes(filtro.toLowerCase()) ||
        (a.categoria || "").toLowerCase().includes(filtro.toLowerCase());
      return lOk && bOk;
    })
  );
  const cfh = useColumnFilter(base, ["caravana", "categoria", "lote", "estado", "fechaNac"]);
  const rows = cfh.filteredData;

  const abrirNuevo = () => { setForm(BLANK); setEdit(null); setError(""); setShowModal(true); };
  const abrirEditar = (a) => { setForm({ ...BLANK, ...a, toroPreñez: a.toroPreñez || "" }); setEdit(a.id); setError(""); setShowModal(true); };
  const cerrar = () => { setShowModal(false); setEdit(null); setError(""); };

  // editarCaravana: App.js abre la ficha de un animal y desde ahí pide editar
  // por caravana (ya no por referencia de objeto, ver App.js FichaAnimal.onEdit).
  useEffect(() => {
    if (!editarCaravana) return;
    if (puedeEditar) {
      const a = animales.find((x) => x.caravana === editarCaravana);
      if (a) abrirEditar(a);
    }
    onEditarConsumido?.();
  }, [editarCaravana]);

  const guardar = async () => {
    if (!puedeEditar) return;
    if (!form.caravana.trim()) { setError("La caravana es obligatoria."); return; }
    const dup = animales.find(
      (a) => a.caravana.trim().toLowerCase() === form.caravana.trim().toLowerCase() && a.id !== edit
    );
    if (dup) { setError(`Ya existe un animal con caravana "${form.caravana}".`); return; }

    if (edit) {
      const animalPrevio = animales.find((a) => a.id === edit);
      await updateAnimal(edit, form);
      // Si cambió la ubicación, sincronizar con rotaciones vía la misma
      // función que usa Potreros — nunca reimplementar esta lógica acá.
      const ubicAnterior = animalPrevio?.ubicacion || "";
      if (form.ubicacion && form.ubicacion !== ubicAnterior) {
        await moverAnimales({
          animalIds: [edit],
          animales,
          rotaciones,
          destino: form.ubicacion,
          fechaEntrada: today(),
        });
      }
    } else {
      await addAnimal(form);
    }
    cerrar();
  };

  const eliminar = async (id) => {
    if (!puedeEditar) return;
    if (
      window.confirm(
        "¿Eliminar este animal de Hacienda?\n\nEsto borra el registro por completo — usalo solo para corregir errores de carga (ej. duplicados). Para dar de baja un animal real (muerte, venta, faena) usá el módulo Bajas, que preserva el historial."
      )
    ) {
      await removeAnimal(id);
    }
  };

  const moverLote = async () => {
    const { lote, ubicacion, entrada, obs } = moverForm;
    if (!lote || !ubicacion) return;
    const animalIds = animales.filter((a) => a.lote === lote).map((a) => a.id);
    if (!animalIds.length) { alert("No hay animales en ese lote."); return; }
    if (!window.confirm(`¿Mover ${animalIds.length} animales del lote ${lote} a ${ubicacion}?`)) return;
    await moverAnimales({ animalIds, animales, rotaciones, destino: ubicacion, lote, fechaEntrada: entrada || today(), obs });
    alert(`✅ ${animalIds.length} animales del lote ${lote} → ${ubicacion}`);
    setShowMover(false);
    setMoverForm({ lote: "", ubicacion: "", entrada: today(), obs: "" });
  };

  const cambiarCategoria = async () => {
    const { lote, categoriaOrigen, categoriaDestino } = catForm;
    if (!lote || !categoriaDestino) return;
    const afectados = animales.filter((a) => a.lote === lote && (categoriaOrigen === "" || a.categoria === categoriaOrigen));
    if (!afectados.length) { alert("No hay animales con esos criterios."); return; }
    if (!window.confirm(`¿Cambiar categoría de ${afectados.length} animales del lote ${lote}${categoriaOrigen ? ` (${categoriaOrigen})` : ""} → ${categoriaDestino}?`)) return;
    for (const a of afectados) {
      await updateAnimal(a.id, { categoria: categoriaDestino });
    }
    alert(`✅ ${afectados.length} animales → ${categoriaDestino}`);
    setShowCambiarCat(false);
    setCatForm({ lote: "", categoriaOrigen: "", categoriaDestino: "" });
  };

  const conteoMover = moverForm.lote ? animales.filter((a) => a.lote === moverForm.lote).length : 0;
  const conteoCat = catForm.lote
    ? animales.filter((a) => a.lote === catForm.lote && (catForm.categoriaOrigen === "" || a.categoria === catForm.categoriaOrigen)).length
    : 0;

  return (
    <div>
      <div className="section-hdr">
        <h2><Icono nombre="hacienda" size={18} /> Hacienda</h2>
        {puedeEditar && (
          <>
            <Button sm onClick={abrirNuevo}><Icono nombre="agregar" size={14} /> Agregar</Button>
            <Button sm variant="ghost" onClick={() => setShowMover(true)}><Icono nombre="moverLote" size={14} /> Mover lote</Button>
            <Button sm variant="ghost" onClick={() => setShowCambiarCat(true)}><Icono nombre="cambiarCategoria" size={14} /> Categoría</Button>
          </>
        )}
      </div>

      <div className="card">
        <div className="tab-pills">
          {["Todos", ...LOTES].map((l) => (
            <button key={l} className={`pill${loteF === l ? " active" : ""}`} onClick={() => setLoteF(l)}>{l}</button>
          ))}
        </div>
        <input className="search-input mb" placeholder="Buscar caravana / categoría..." value={filtro} onChange={(e) => setFiltro(e.target.value)} />
        <div className="txt-muted mb">{rows.length} animales</div>

        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <ColHeader label="Car." col="caravana" sorter={sorter} cfh={cfh} />
                <ColHeader label="Cat." col="categoria" sorter={sorter} cfh={cfh} />
                <ColHeader label="Lote" col="lote" sorter={sorter} cfh={cfh} />
                <ColHeader label="Estado" col="estado" sorter={sorter} cfh={cfh} />
                <th>Madre</th>
                <ColHeader label="Nació" col="fechaNac" sorter={sorter} cfh={cfh} />
                <th>Toro</th>
                <th>Obs.</th>
                {puedeEditar && <th></th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td>
                    <button className="btn btn-ghost btn-sm" style={{ padding: "2px 8px", fontWeight: 700, fontSize: 12 }} onClick={() => abrirFicha(a.caravana)}>
                      {a.caravana}
                    </button>
                  </td>
                  <td style={{ fontSize: 11 }}>{a.categoria}</td>
                  <td>
                    <Badge tone="cielo">{a.lote}</Badge>
                    {a.ubicacion && <Badge tone="paja" style={{ fontSize: 9, marginLeft: 3 }}><Icono nombre="mapa" size={9} />{a.ubicacion}</Badge>}
                    {a.servicioAsignado && (
                      <Badge tone={a.servicioAsignado === "Sin servicio" ? "rojo" : a.servicioAsignado === "TE" ? "paja" : "verde"} style={{ fontSize: 8, marginLeft: 3 }}>
                        {a.servicioAsignado}
                      </Badge>
                    )}
                  </td>
                  <td><BadgeEstado estado={a.estado} /></td>
                  <td style={{ fontSize: 11 }}>
                    {a.madreCaravana ? (
                      <button className="btn btn-ghost btn-sm" style={{ padding: "2px 8px", fontSize: 10 }} onClick={() => abrirFicha(a.madreCaravana)}>
                        <Icono nombre="buscar" size={10} /> {a.madreCaravana}
                      </button>
                    ) : <span className="txt-muted">—</span>}
                  </td>
                  <td style={{ fontSize: 11, color: "rgba(21,21,15,.5)" }}>{a.fechaNac || "—"}</td>
                  <td style={{ fontSize: 11, color: a.toroPreñez ? C.tinta : "rgba(21,21,15,.35)" }}>{a.toroPreñez || "—"}</td>
                  <td className="txt-muted" style={{ maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.obs || "—"}</td>
                  {puedeEditar && (
                    <td>
                      <div className="flex">
                        <button className="btn btn-prim btn-sm" onClick={() => abrirEditar(a)}><Icono nombre="editar" size={14} /></button>
                        <button className="btn btn-rojo btn-sm" onClick={() => eliminar(a.id)}><Icono nombre="eliminar" size={14} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={puedeEditar ? 9 : 8} className="txt-muted" style={{ textAlign: "center", padding: 16 }}>Sin animales para este filtro.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && puedeEditar && (
        <Modal onClose={cerrar} title={edit ? <><Icono nombre="editar" size={16} /> Editar Animal</> : <><Icono nombre="agregar" size={16} /> Nuevo Animal</>}>
          {error && <div className="error-msg">{error}</div>}

          <div className="form-row">
            <Field label="Caravana *">
              <Input value={form.caravana} onChange={(e) => { setForm({ ...form, caravana: e.target.value }); setError(""); }} />
            </Field>
            <Field label="Nombre">
              <Input value={form.nombre || ""} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </Field>
          </div>

          <div className="form-row">
            <Field label="Categoría">
              <Select options={CATEGORIAS} value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
            </Field>
            <Field label="Lote">
              <Select options={LOTES} value={form.lote} onChange={(e) => setForm({ ...form, lote: e.target.value })} />
            </Field>
          </div>

          <div className="form-row">
            <Field label="Estado">
              <Select options={ESTADOS} value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} />
            </Field>
            <Field label={<><Icono nombre="mapa" size={14} /> Ubicación actual</>}>
              <Select options={UBICACIONES} placeholder="— Sin asignar —" value={form.ubicacion || ""} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} />
            </Field>
          </div>

          <div className="form-row">
            <Field label={<><Icono nombre="fecha" size={14} /> Fecha nacimiento</>}>
              <Input type="date" value={form.fechaNac || ""} onChange={(e) => setForm({ ...form, fechaNac: e.target.value })} />
            </Field>
            <Field label={<><Icono nombre="hacienda" size={14} /> Madre</>}>
              <Select
                options={vacas.map((v) => ({ value: v.caravana, label: `Car. ${v.caravana}${v.nombre ? " – " + v.nombre : ""}` }))}
                placeholder="Sin asignar"
                value={form.madreCaravana || ""}
                onChange={(e) => setForm({ ...form, madreCaravana: e.target.value })}
              />
            </Field>
          </div>

          <div className="form-row">
            <Field label={<><Icono nombre="toro" size={14} /> Padre (toro)</>}>
              <Input
                list="hacienda-toros-datalist"
                placeholder="Caravana o nombre del toro"
                value={form.padreCaravana || ""}
                onChange={(e) => setForm({ ...form, padreCaravana: e.target.value })}
              />
              <datalist id="hacienda-toros-datalist">
                {toros.map((t) => <option key={t.id} value={t.caravana}>{t.nombre ? `${t.caravana} – ${t.nombre}` : t.caravana}</option>)}
              </datalist>
            </Field>
            <Field label={<><Icono nombre="ajusteDeStock" size={14} /> Peso inicial (kg)</>}>
              <Input type="number" min="0" placeholder="kg" value={form.pesoInicial || ""} onChange={(e) => setForm({ ...form, pesoInicial: e.target.value })} />
            </Field>
          </div>

          <div className="form-row">
            <Field label={<><Icono nombre="toro" size={14} /> Toro de preñez</>}>
              <Input placeholder="Texto libre" value={form.toroPreñez || ""} onChange={(e) => setForm({ ...form, toroPreñez: e.target.value })} />
            </Field>
            <Field label="Obs.">
              <Input value={form.obs || ""} onChange={(e) => setForm({ ...form, obs: e.target.value })} />
            </Field>
          </div>

          <div className="flex mt">
            <Button variant="verde" onClick={guardar}><Icono nombre="guardar" size={14} /> Guardar</Button>
            <Button variant="ghost" sm onClick={cerrar}>Cancelar</Button>
          </div>
        </Modal>
      )}

      {showMover && puedeEditar && (
        <Modal onClose={() => setShowMover(false)} title={<><Icono nombre="moverLote" size={16} /> Mover Lote Completo</>}>
          <div className="form-row">
            <Field label="Lote a mover">
              <Select options={LOTES} placeholder="Seleccionar..." value={moverForm.lote} onChange={(e) => setMoverForm({ ...moverForm, lote: e.target.value })} />
            </Field>
            <Field label="Ubicación destino">
              <Select options={UBICACIONES} placeholder="Seleccionar..." value={moverForm.ubicacion} onChange={(e) => setMoverForm({ ...moverForm, ubicacion: e.target.value })} />
            </Field>
          </div>
          <div className="form-row">
            <Field label={<><Icono nombre="fecha" size={14} /> Fecha de ingreso</>}>
              <Input type="date" value={moverForm.entrada} onChange={(e) => setMoverForm({ ...moverForm, entrada: e.target.value })} />
            </Field>
            <Field label=" ">
              {moverForm.lote && <div style={{ fontSize: 11, color: C.tinta, fontWeight: 600 }}>{conteoMover} animales a mover</div>}
            </Field>
          </div>
          <div className="flex mt">
            <Button variant="verde" onClick={moverLote}><Icono nombre="moverLote" size={14} /> Mover</Button>
            <Button variant="ghost" sm onClick={() => setShowMover(false)}>Cancelar</Button>
          </div>
        </Modal>
      )}

      {showCambiarCat && puedeEditar && (
        <Modal onClose={() => setShowCambiarCat(false)} title={<><Icono nombre="cambiarCategoria" size={16} /> Cambiar Categoría al Lote</>}>
          <div className="form-row">
            <Field label="Lote">
              <Select options={LOTES} placeholder="Seleccionar..." value={catForm.lote} onChange={(e) => setCatForm({ ...catForm, lote: e.target.value })} />
            </Field>
            <Field label="Categoría actual (opcional)">
              <Select options={CATEGORIAS} placeholder="Todas las categorías" value={catForm.categoriaOrigen} onChange={(e) => setCatForm({ ...catForm, categoriaOrigen: e.target.value })} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Nueva categoría">
              <Select options={CATEGORIAS} placeholder="Seleccionar..." value={catForm.categoriaDestino} onChange={(e) => setCatForm({ ...catForm, categoriaDestino: e.target.value })} />
            </Field>
            <Field label=" ">
              {catForm.lote && <div style={{ fontSize: 11, color: C.tinta, fontWeight: 600 }}>{conteoCat} animales a cambiar</div>}
            </Field>
          </div>
          <div className="flex mt">
            <Button variant="verde" onClick={cambiarCategoria}><Icono nombre="cambiarCategoria" size={14} /> Cambiar</Button>
            <Button variant="ghost" sm onClick={() => setShowCambiarCat(false)}>Cancelar</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
