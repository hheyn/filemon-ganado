import { useState } from "react";
import { useCollection } from "../hooks/useCollection";
import { useYearFilter } from "../hooks/useYearFilter";
import { useSorter } from "../hooks/useSorter";
import { YearPills } from "../components/YearPills";
import { Modal } from "../components/Modal";
import { Field, Input, Select, Button, Badge } from "../components/Field";
import { canEdit } from "../lib/permissions";
import { today, yearOf } from "../lib/dateUtils";
import { LOTES, CATEGORIAS_PRODUCTO, C } from "../lib/constants";
import { registrarConsumo } from "../lib/botiquin";
import { Icono } from "../components/Icon";

const TIPOS_SANIDAD = [
  "Vacuna", "Antiparasitario", "Reconstituyente", "Clostridiosis", "Antirrabica",
  "Fasciola Hepática", "Contra la mancha", "Pour On", "Otro",
];

const LOTE_OPTIONS = [{ value: "Todos", label: "Toda la hacienda" }, ...LOTES.map((l) => ({ value: l, label: l }))];

const blankSan = { fecha: today(), lote: "General", producto: "", tipo: "Vacuna", dosis: "", obs: "", alcance: "lote", caravanas: [] };
const blankProd = {
  nombre: "", categoria: "Vacuna", descripcion: "", dosis: "", unidad: "ml", costoUnitario: "",
  // Botiquín virtual: si se completan estos dos, la app descuenta stock solo
  // cada vez que se aplica este producto en Sanidad (ver lib/botiquin.js).
  // Si el producto se dosifica por peso ("1ml/50kg") y no tiene una dosis fija
  // por animal, se dejan vacíos y ese producto no participa del cálculo.
  contenidoPorUnidad: "", dosisPorAnimal: "",
};

const anioActual = Number(yearOf(today()));
const campaniaDefault = `${anioActual}-${anioActual + 1}`;
const blankEvento = { fecha: today(), lotes: ["General"], campania: campaniaDefault, productos: [], asignaciones: {}, obs: "" };

// Considera "general" (aplica a toda la hacienda, independiente del filtro de
// lote activo) a un registro sin lote específico — preserva el comportamiento
// legacy de que estos registros aparecen bajo cualquier pill de lote.
const esGeneral = (l) => !l || l === "Todos" || l === "Toda la Hacienda" || l === "todos";

const TIPOS_ASIGNACION = ["IATF", "TE", "Repaso", "Sin servicio"];

export function Sanidad({ animales, updateAnimal, rol, abrirFicha, user }) {
  const [sanidad, addSan, updateSan, removeSan] = useCollection("sanidad", { softDelete: true, auditar: true, user });
  const [productos, addProd, updateProd, removeProd] = useCollection("productos");
  const puedeEditar = canEdit(rol, "sanidad");
  const listaSanidad = sanidad || [];
  const listaProductos = productos || [];

  // ── Form individual de registro de sanidad ────────────────────────────
  const [form, setForm] = useState(blankSan);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [busqCar, setBusqCar] = useState("");

  // ── Catálogo de productos ──────────────────────────────────────────────
  const [showCatalogo, setShowCatalogo] = useState(false);
  const [formProd, setFormProd] = useState(blankProd);
  const [editProdId, setEditProdId] = useState(null);

  // ── Evento de manejo ────────────────────────────────────────────────────
  const [showEvento, setShowEvento] = useState(false);
  const [eventoForm, setEventoForm] = useState(blankEvento);
  const [eventoStep, setEventoStep] = useState(1);

  const [loteF, setLoteF] = useState("Todos");
  const { sortFn, toggleSort, icon, thStyle } = useSorter("fecha");

  // "Otro" = producto puntual que todavía no está en el catálogo/botiquín —
  // se carga a mano igual que antes, pero es la excepción, no la regla.
  const [productoModo, setProductoModo] = useState("catalogo");
  const elegirProductoCatalogo = (nombreProducto) => {
    const p = listaProductos.find((x) => x.nombre === nombreProducto);
    if (!p) { setForm({ ...form, producto: "" }); return; }
    // El tipo ya quedó definido cuando diste de alta el producto en el
    // catálogo — no tiene sentido volver a elegirlo acá.
    setForm({ ...form, producto: p.nombre, tipo: p.categoria, dosis: p.dosis || form.dosis });
  };

  const animalesLoteForm = animales.filter((a) => a.lote === form.lote || form.lote === "Todos");
  const animalesFiltrados = busqCar
    ? animalesLoteForm.filter((a) => a.caravana.toLowerCase().includes(busqCar.toLowerCase()) || (a.nombre || "").toLowerCase().includes(busqCar.toLowerCase()))
    : animalesLoteForm;
  const toggleCaravana = (car) => {
    const cur = form.caravanas || [];
    setForm({ ...form, caravanas: cur.includes(car) ? cur.filter((c) => c !== car) : [...cur, car] });
  };

  const cerrarForm = () => {
    setForm(blankSan);
    setEditId(null);
    setBusqCar("");
    setShowForm(false);
    setProductoModo("catalogo");
  };

  const abrirEditar = (s) => {
    setForm({ ...blankSan, ...s, alcance: s.caravana ? "individual" : "lote", caravanas: s.caravana ? [s.caravana] : [] });
    setEditId(s.id);
    setProductoModo(listaProductos.some((p) => p.nombre === s.producto) ? "catalogo" : "otro");
    setShowForm(true);
  };

  const buscarProductoCatalogo = (nombre) =>
    listaProductos.find((p) => p.nombre.trim().toLowerCase() === (nombre || "").trim().toLowerCase());

  const guardar = async () => {
    if (!form.producto) return;
    if (editId) {
      // Editar un registro existente no vuelve a tocar el stock — el
      // consumo ya quedó asentado cuando se creó originalmente.
      await updateSan(editId, { ...form, caravanas: form.caravanas || [] });
      cerrarForm();
      return;
    }
    const productoCat = buscarProductoCatalogo(form.producto);
    if (form.alcance === "lote") {
      const ref = await addSan({ ...form, caravanas: [], cantidadAnimales: animalesLoteForm.length });
      if (productoCat) {
        await registrarConsumo({ producto: productoCat, nAnimales: animalesLoteForm.length, fecha: form.fecha, sanidadRefId: ref?.id, user });
      }
    } else {
      if (!form.caravanas || form.caravanas.length === 0) {
        alert("Seleccioná al menos un animal");
        return;
      }
      for (const car of form.caravanas) {
        const anim = animales.find((a) => a.caravana === car);
        await addSan({ ...form, caravanas: [car], lote: anim?.lote || form.lote, caravana: car, cantidadAnimales: 1 });
      }
      if (productoCat) {
        await registrarConsumo({ producto: productoCat, nAnimales: form.caravanas.length, fecha: form.fecha, user });
      }
    }
    cerrarForm();
  };

  const eliminar = async (id) => {
    if (window.confirm("¿Eliminar este registro de sanidad? Queda en el historial permanente.")) await removeSan(id);
  };

  const rowsLote = loteF === "Todos" ? listaSanidad : listaSanidad.filter((s) => s.lote === loteF || esGeneral(s.lote));
  const { anio, setAnio, anos, filtered: rows } = useYearFilter(rowsLote, "fecha");

  // ── Catálogo: guardar/editar producto ──────────────────────────────────
  const guardarProducto = async () => {
    if (!formProd.nombre) return;
    const data = {
      ...formProd,
      costoUnitario: +formProd.costoUnitario || 0,
      contenidoPorUnidad: formProd.contenidoPorUnidad === "" ? "" : +formProd.contenidoPorUnidad,
      dosisPorAnimal: formProd.dosisPorAnimal === "" ? "" : +formProd.dosisPorAnimal,
    };
    if (editProdId) {
      await updateProd(editProdId, data);
      setEditProdId(null);
    } else {
      await addProd(data);
    }
    setFormProd(blankProd);
  };
  const abrirEditarProducto = (p) => {
    setFormProd({
      ...blankProd, ...p, costoUnitario: p.costoUnitario ?? "",
      contenidoPorUnidad: p.contenidoPorUnidad ?? "", dosisPorAnimal: p.dosisPorAnimal ?? "",
    });
    setEditProdId(p.id);
  };
  const cancelarEdicionProducto = () => {
    setFormProd(blankProd);
    setEditProdId(null);
  };

  // ── Evento de manejo: helpers ───────────────────────────────────────────
  const cerrarEvento = () => {
    setShowEvento(false);
    setEventoForm(blankEvento);
    setEventoStep(1);
  };

  // Pool de trabajo del evento: TODOS los animales de los lotes elegidos
  // (cualquier categoría) — un evento de manejo puede ser una desparasitación
  // a todo el lote incluyendo terneros, no solo a vacas/vaquillas.
  const animalesLoteEvento = animales.filter((a) => eventoForm.lotes.includes(a.lote));
  // Sub-conjunto reproductivo — solo estas entran en el paso 3 (asignación de
  // servicio), que no tiene sentido para terneros/toros/novillos.
  const animalesReproductivosEvento = animalesLoteEvento.filter((a) => ["Vaca", "Vaquilla"].includes(a.categoria));
  // Las cuatro funciones de abajo usan el updater funcional de setState
  // (`setEventoForm(prev => ...)`) en vez de leer `eventoForm` directo del
  // closure — con checkboxes que el usuario puede tildar varios seguidos muy
  // rápido, leer del closure puede perder una selección si el segundo click
  // llega antes de que React re-renderice con el estado del primero.
  const animalesDelPool = (lotes) => animales.filter((a) => lotes.includes(a.lote)).map((a) => a.caravana);

  const toggleLoteEvento = (l) => {
    setEventoForm((prev) => {
      const next = prev.lotes.includes(l) ? prev.lotes.filter((x) => x !== l) : [...prev.lotes, l];
      return { ...prev, lotes: next, productos: [], asignaciones: {} };
    });
  };

  const toggleProdEvento = (p) => {
    setEventoForm((prev) => {
      const sel = prev.productos.find((x) => x.productoId === p.id);
      if (sel) return { ...prev, productos: prev.productos.filter((x) => x.productoId !== p.id) };
      return {
        ...prev,
        productos: [...prev.productos, { productoId: p.id, nombre: p.nombre, dosis: p.dosis, tipo: p.categoria, alcance: "lote", caravanas: animalesDelPool(prev.lotes) }],
      };
    });
  };
  const toggleCarEvento = (prodId, car) => {
    setEventoForm((prev) => ({
      ...prev,
      productos: prev.productos.map((x) => {
        if (x.productoId !== prodId) return x;
        const cur = x.caravanas || [];
        const updated = cur.includes(car) ? cur.filter((c) => c !== car) : [...cur, car];
        return { ...x, caravanas: updated, alcance: "individual" };
      }),
    }));
  };
  const setTodasEvento = (prodId, todas) => {
    setEventoForm((prev) => ({
      ...prev,
      productos: prev.productos.map((x) => {
        if (x.productoId !== prodId) return x;
        return { ...x, caravanas: todas ? animalesDelPool(prev.lotes) : [], alcance: todas ? "lote" : "individual" };
      }),
    }));
  };

  // Un evento sólo tiene sentido pedir asignación de servicio (paso 3) si
  // alguno de los productos aplicados es hormonal/protocolo IATF — un simple
  // desparasitante no debería forzar al usuario a pasar por esa pantalla.
  const hayProductoReproductivo = eventoForm.productos.some((p) => p.tipo === "Hormona/Protocolo IATF");

  // Por cada producto seleccionado, agrupa las caravanas aplicadas por su
  // lote REAL. Si un grupo cubre exactamente a todos los animales de ese
  // lote presentes en el pool del evento, se guarda un único registro
  // compacto "por lote" (como antes). Si el grupo es un subconjunto (porque
  // se aplicaron productos distintos a distintos animales del mismo lote, o
  // el evento mezcla varios lotes con excepciones), se guarda un registro
  // individual por animal — sin que el usuario tenga que decidir esto a mano.
  const guardarSanidadDesdeEvento = async () => {
    const obsBase = `Evento de manejo ${eventoForm.campania}. ${eventoForm.obs || ""}`.trim();
    for (const prod of eventoForm.productos) {
      const caravanasSel = prod.caravanas || [];
      const porLote = {};
      for (const car of caravanasSel) {
        const anim = animales.find((a) => a.caravana === car);
        const lote = anim?.lote || "General";
        (porLote[lote] = porLote[lote] || []).push(car);
      }
      const productoCat = listaProductos.find((p) => p.id === prod.productoId);
      for (const [lote, caravanasDelLote] of Object.entries(porLote)) {
        const totalDelLoteEnPool = animalesLoteEvento.filter((a) => a.lote === lote).length;
        const esLoteCompleto = caravanasDelLote.length === totalDelLoteEnPool && totalDelLoteEnPool > 0;
        if (esLoteCompleto) {
          const ref = await addSan({
            fecha: eventoForm.fecha, lote, producto: prod.nombre, tipo: prod.tipo || "Vacuna",
            dosis: prod.dosis || "", alcance: "lote", caravanas: [], obs: obsBase,
            cantidadAnimales: caravanasDelLote.length,
          });
          if (productoCat) {
            await registrarConsumo({ producto: productoCat, nAnimales: caravanasDelLote.length, fecha: eventoForm.fecha, sanidadRefId: ref?.id, user });
          }
        } else {
          for (const car of caravanasDelLote) {
            await addSan({
              fecha: eventoForm.fecha, lote, producto: prod.nombre, tipo: prod.tipo || "Vacuna",
              dosis: prod.dosis || "", alcance: "individual", caravana: car, caravanas: [car], obs: obsBase,
              cantidadAnimales: 1,
            });
          }
          if (productoCat) {
            await registrarConsumo({ producto: productoCat, nAnimales: caravanasDelLote.length, fecha: eventoForm.fecha, user });
          }
        }
      }
    }
  };

  const omitirAsignacion = async () => {
    await guardarSanidadDesdeEvento();
    alert(`✅ Evento registrado:\n• ${eventoForm.productos.length} producto(s) → Sanidad\n(no aplica asignación de servicio para este evento)`);
    cerrarEvento();
  };

  const guardarEventoCompleto = async () => {
    await guardarSanidadDesdeEvento();
    // Sólo actualiza el pre-servicio en Hacienda — NO crea registros en la
    // colección `iatf` todavía (eso ocurre cuando se ejecute el servicio real).
    // Solo toca al subconjunto reproductivo (Vaca/Vaquilla), no a terneros u
    // otras categorías que puedan estar en el mismo evento de manejo.
    for (const a of animalesReproductivosEvento) {
      const tipoServ = eventoForm.asignaciones[a.caravana] || "IATF";
      await updateAnimal(a.id, {
        ...a,
        servicioAsignado: tipoServ,
        campaniaPrevista: eventoForm.campania,
        fechaPreServicio: eventoForm.fecha,
      });
    }
    const resumen = Object.entries(
      animalesReproductivosEvento.reduce((acc, a) => {
        const t = eventoForm.asignaciones[a.caravana] || "IATF";
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      }, {})
    ).map(([k, v]) => `${k}: ${v}`).join(" · ");
    alert(`✅ Evento registrado:\n• ${eventoForm.productos.length} producto(s) → Sanidad\n• ${animalesReproductivosEvento.length} animales pre-asignados (${resumen})\n\nLos registros de Servicios IATF se crearán cuando se ejecute el servicio.`);
    cerrarEvento();
  };

  return (
    <div>
      <div className="section-hdr">
        <h2><Icono nombre="sanidad" size={18} /> Sanidad — {listaSanidad.length} reg.</h2>
        {puedeEditar && (
          <div style={{ display: "flex", gap: 6 }}>
            <Button variant="ghost" sm onClick={() => { setShowCatalogo(true); setShowEvento(false); setShowForm(false); }}><Icono nombre="catalogo" size={14} /> Catálogo</Button>
            <Button
              variant="ghost"
              sm
              style={{ background: "linear-gradient(135deg,rgba(62,107,74,.15),rgba(62,107,74,.08))", color: C.verdeCampo, border: "1px solid rgba(62,107,74,.3)" }}
              onClick={() => { setShowEvento(true); setShowCatalogo(false); setShowForm(false); setEventoStep(1); }}
            >
              <Icono nombre="eventoDeManejo" size={14} /> Evento de Manejo
            </Button>
            <Button variant="prim" sm onClick={() => { setShowForm(!showForm); setShowEvento(false); setShowCatalogo(false); }}>{showForm ? <Icono nombre="cerrar" size={14} /> : <Icono nombre="agregar" size={14} />}</Button>
          </div>
        )}
      </div>

      <div className="tab-pills">
        {["Todos", ...LOTES].map((l) => (
          <button key={l} className={`pill${loteF === l ? " active" : ""}`} onClick={() => setLoteF(l)}>{l}</button>
        ))}
      </div>
      <YearPills anos={anos} anio={anio} setAnio={setAnio} />

      {/* ── CATÁLOGO DE PRODUCTOS ─────────────────────────────────────── */}
      {showCatalogo && (
        <Modal onClose={() => { setShowCatalogo(false); cancelarEdicionProducto(); }} title={<><Icono nombre="catalogo" size={16} /> Catálogo de Productos</>} wide>
          <div className="card mb" style={{ padding: 12 }}>
            <div className="form-row">
              <Field label="Nombre comercial">
                <Input value={formProd.nombre} onChange={(e) => setFormProd({ ...formProd, nombre: e.target.value })} placeholder="Ej: Doramectina Gold" />
              </Field>
              <Field label="Categoría">
                <Select options={CATEGORIAS_PRODUCTO} value={formProd.categoria} onChange={(e) => setFormProd({ ...formProd, categoria: e.target.value })} />
              </Field>
            </div>
            <div className="form-row">
              <Field label="Dosis estándar">
                <Input value={formProd.dosis} onChange={(e) => setFormProd({ ...formProd, dosis: e.target.value })} placeholder="Ej: 1ml/50kg" />
              </Field>
              <Field label="Unidad">
                <Select options={["ml", "cc", "comprimido", "sachet", "dosis", "g"]} value={formProd.unidad} onChange={(e) => setFormProd({ ...formProd, unidad: e.target.value })} />
              </Field>
            </div>
            <div className="form-row">
              <Field label="Descripción / Principio activo">
                <Input value={formProd.descripcion} onChange={(e) => setFormProd({ ...formProd, descripcion: e.target.value })} placeholder="Ej: Ivermectina 1%" />
              </Field>
              <Field label="Costo unitario (₲)">
                <Input type="number" value={formProd.costoUnitario} onChange={(e) => setFormProd({ ...formProd, costoUnitario: e.target.value })} placeholder="0" />
              </Field>
            </div>
            <div className="form-row">
              <Field label={`Contenido por envase (${formProd.unidad || "unidad"})`}>
                <Input type="number" value={formProd.contenidoPorUnidad} onChange={(e) => setFormProd({ ...formProd, contenidoPorUnidad: e.target.value })} placeholder="Ej: 500" />
              </Field>
              <Field label={`Dosis fija por animal (${formProd.unidad || "unidad"})`}>
                <Input type="number" value={formProd.dosisPorAnimal} onChange={(e) => setFormProd({ ...formProd, dosisPorAnimal: e.target.value })} placeholder="Ej: 10" />
              </Field>
            </div>
            <div className="txt-muted" style={{ marginBottom: 8, fontSize: 10.5 }}>
              <Icono nombre="botiquin" size={12} /> Completá estos dos campos si querés que el <strong>Botiquín</strong> descuente stock automático cada vez que se aplica este producto en Sanidad. Si la dosis varía según el peso del animal (ej. "1ml/50kg"), dejalos vacíos.
            </div>
            <div className="flex mt">
              <Button variant="verde" onClick={guardarProducto}><Icono nombre="guardar" size={14} /> {editProdId ? "Guardar cambios" : "Agregar producto"}</Button>
              {editProdId && <Button variant="ghost" sm onClick={cancelarEdicionProducto}>Cancelar edición</Button>}
            </div>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr><th>Nombre</th><th>Categoría</th><th>Dosis</th><th>Envase</th><th>Costo (₲)</th><th>Descripción</th><th></th></tr>
              </thead>
              <tbody>
                {listaProductos.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.nombre}</strong></td>
                    <td><Badge tone="cielo" style={{ fontSize: 9 }}>{p.categoria}</Badge></td>
                    <td style={{ fontSize: 11 }}>{p.dosis} {p.unidad}</td>
                    <td style={{ fontSize: 10 }}>
                      {p.contenidoPorUnidad && p.dosisPorAnimal
                        ? <span title="Contenido / dosis por animal">{p.contenidoPorUnidad}{p.unidad} · {p.dosisPorAnimal}{p.unidad}/animal</span>
                        : <span className="txt-muted">sin stock</span>}
                    </td>
                    <td style={{ fontSize: 11 }}>{p.costoUnitario ? Number(p.costoUnitario).toLocaleString("es-PY") : <span className="txt-muted">—</span>}</td>
                    <td style={{ fontSize: 11 }}>{p.descripcion || "—"}</td>
                    <td style={{ display: "flex", gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" style={{ fontSize: 12, padding: "3px 8px" }} onClick={() => abrirEditarProducto(p)}><Icono nombre="editar" size={14} /></button>
                      <button className="btn btn-rojo btn-sm" onClick={() => removeProd(p.id)}><Icono nombre="eliminar" size={14} /></button>
                    </td>
                  </tr>
                ))}
                {!listaProductos.length && (
                  <tr><td colSpan="7" className="txt-muted" style={{ textAlign: "center", padding: 12 }}>Sin productos. Agregá el primero arriba.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      {/* ── EVENTO DE MANEJO ──────────────────────────────────────────── */}
      {showEvento && (
        <Modal onClose={cerrarEvento} title={<><Icono nombre="eventoDeManejo" size={16} /> Evento de Manejo <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 8, color: C.cuero }}>Paso {eventoStep} de 3</span></>} wide>
          {eventoStep === 1 && (
            <>
              <div className="form-row">
                <Field label={<><Icono nombre="fecha" size={12} /> Fecha</>}>
                  <Input type="date" value={eventoForm.fecha} onChange={(e) => setEventoForm({ ...eventoForm, fecha: e.target.value })} />
                </Field>
                <Field label="Campaña de servicio">
                  <Input value={eventoForm.campania} onChange={(e) => setEventoForm({ ...eventoForm, campania: e.target.value })} placeholder={campaniaDefault} />
                </Field>
              </div>
              <Field label="Lotes / Grupos (elegí uno o varios)">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                  {LOTES.map((l) => {
                    const sel = eventoForm.lotes.includes(l);
                    const n = animales.filter((a) => a.lote === l).length;
                    return (
                      <label key={l} style={{
                        display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20,
                        cursor: "pointer", fontSize: 12, fontFamily: "'Lora',serif",
                        background: sel ? "rgba(74,124,78,.15)" : "rgba(107,66,38,.06)",
                        border: `1.5px solid ${sel ? C.verdeCampo : "rgba(107,66,38,.2)"}`,
                        color: sel ? C.verdeCampo : C.tinta,
                      }}>
                        <input type="checkbox" checked={sel} onChange={() => toggleLoteEvento(l)} style={{ accentColor: C.verdeCampo }} />
                        {l} <span className="txt-muted">({n})</span>
                      </label>
                    );
                  })}
                </div>
              </Field>
              <Field label="Obs. general">
                <Input value={eventoForm.obs} onChange={(e) => setEventoForm({ ...eventoForm, obs: e.target.value })} placeholder="Ej: Pre-servicio" />
              </Field>
              <div style={{ marginTop: 8, fontSize: 12, color: C.verdeMonte, fontWeight: 600 }}>
                {animalesLoteEvento.length} animales en {eventoForm.lotes.length > 1 ? `los lotes ${eventoForm.lotes.join(", ")}` : `el lote ${eventoForm.lotes[0] || "—"}`}
              </div>
              <div className="flex mt">
                <Button variant="prim" onClick={() => setEventoStep(2)} disabled={!eventoForm.lotes.length}>Siguiente → Productos</Button>
                <Button variant="ghost" sm onClick={cerrarEvento}>Cancelar</Button>
              </div>
            </>
          )}

          {eventoStep === 2 && (
            <>
              <div style={{ marginBottom: 12, fontSize: 12, color: C.verdeMonte }}>Seleccioná los productos y a qué animales se los aplicaron:</div>
              {!animalesLoteEvento.length && <div className="txt-muted" style={{ fontSize: 12, marginBottom: 8 }}>No hay animales en los lotes elegidos</div>}
              {!listaProductos.length && (
                <div className="txt-muted" style={{ fontSize: 12, marginBottom: 12 }}>
                  No tenés productos en el catálogo. <button className="btn btn-ghost btn-sm" onClick={() => { setShowEvento(false); setShowCatalogo(true); }}>Ir al catálogo →</button>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                {listaProductos.map((p) => {
                  const sel = eventoForm.productos.find((x) => x.productoId === p.id);
                  return (
                    <div key={p.id} style={{ borderRadius: 10, border: `1.5px solid ${sel ? C.verdeCampo : "rgba(107,66,38,.15)"}`, background: sel ? "rgba(74,124,78,.05)" : "rgba(255,253,245,.5)", overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", cursor: "pointer" }} onClick={() => toggleProdEvento(p)}>
                        <div style={{ fontSize: 18, userSelect: "none" }}>{sel ? <Icono nombre="positivo" size={18} /> : null}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{p.nombre}</div>
                          <div style={{ fontSize: 11, color: C.cuero }}>{p.categoria} · {p.dosis} {p.unidad}</div>
                        </div>
                        {sel && <span style={{ fontSize: 11, fontWeight: 700, color: C.verdeCampo, whiteSpace: "nowrap" }}>{(sel.caravanas || []).length}/{animalesLoteEvento.length} animales</span>}
                      </div>
                      {sel && (
                        <div style={{ padding: "8px 12px 12px", borderTop: "1px solid rgba(74,124,78,.15)", background: "rgba(74,124,78,.03)" }}>
                          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 11, color: C.verdeCampo, fontWeight: 600 }}>Aplicado a:</span>
                            <button className="btn btn-ghost btn-sm" style={{ fontSize: 10, padding: "2px 8px" }} onClick={(e) => { e.stopPropagation(); setTodasEvento(p.id, true); }}>✓ Todas ({animalesLoteEvento.length})</button>
                            <button className="btn btn-ghost btn-sm" style={{ fontSize: 10, padding: "2px 8px" }} onClick={(e) => { e.stopPropagation(); setTodasEvento(p.id, false); }}>✗ Ninguna</button>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxHeight: 120, overflowY: "auto" }}>
                            {animalesLoteEvento.map((a) => {
                              const isSel = (sel.caravanas || []).includes(a.caravana);
                              return (
                                <label key={a.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 16, cursor: "pointer", fontSize: 11, userSelect: "none", background: isSel ? "rgba(74,124,78,.18)" : "rgba(107,66,38,.06)", border: `1px solid ${isSel ? C.verdeCampo : "rgba(107,66,38,.15)"}`, color: isSel ? C.verdeCampo : C.tinta }}>
                                  <input type="checkbox" checked={isSel} onChange={() => toggleCarEvento(p.id, a.caravana)} style={{ accentColor: C.verdeCampo, width: 11, height: 11 }} />
                                  {a.caravana}{a.nombre ? ` ${a.nombre}` : ""}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex mt" style={{ flexWrap: "wrap" }}>
                <Button variant="ghost" sm onClick={() => setEventoStep(1)}>← Atrás</Button>
                {hayProductoReproductivo ? (
                  <Button variant="prim" onClick={() => setEventoStep(3)}>Siguiente → Asignación</Button>
                ) : (
                  <Button variant="verde" onClick={omitirAsignacion} disabled={!eventoForm.productos.length}>
                    Omitir asignación de servicio (no aplica) · Guardar
                  </Button>
                )}
                <Button variant="ghost" sm onClick={cerrarEvento}>Cancelar</Button>
              </div>
            </>
          )}

          {eventoStep === 3 && (() => {
            const asignar = (car, tipo) => setEventoForm({ ...eventoForm, asignaciones: { ...eventoForm.asignaciones, [car]: tipo } });
            const asignarTodos = (tipo) => {
              const todas = {};
              animalesReproductivosEvento.forEach((a) => { todas[a.caravana] = tipo; });
              setEventoForm({ ...eventoForm, asignaciones: todas });
            };
            const conteo = { IATF: 0, TE: 0, "Sin servicio": 0, Repaso: 0 };
            animalesReproductivosEvento.forEach((a) => { const t = eventoForm.asignaciones[a.caravana] || "IATF"; conteo[t] = (conteo[t] || 0) + 1; });
            return (
              <>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: C.verdeMonte, marginBottom: 8 }}>Asigná el tipo de servicio previsto a cada vaca/vaquilla del grupo (no crea el registro de servicio todavía):</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                    {TIPOS_ASIGNACION.map((t) => (
                      <button key={t} className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => asignarTodos(t)}>Todos → {t}</button>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                    {Object.entries(conteo).filter(([, v]) => v > 0).map(([k, v]) => (
                      <Badge key={k} tone={k === "Sin servicio" ? "rojo" : k === "TE" ? "paja" : k === "IATF" ? "verde" : "cielo"}>{k}: {v}</Badge>
                    ))}
                  </div>
                </div>
                <div style={{ maxHeight: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                  {animalesReproductivosEvento.map((a) => {
                    const asig = eventoForm.asignaciones[a.caravana] || "IATF";
                    return (
                      <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, background: "rgba(255,253,245,.8)", border: "1px solid rgba(107,66,38,.1)" }}>
                        <div style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{a.caravana}</div>
                        <div style={{ fontSize: 11, color: C.cuero }}>{a.nombre || ""}</div>
                        <div style={{ display: "flex", gap: 4 }}>
                          {TIPOS_ASIGNACION.map((t) => (
                            <button
                              key={t}
                              onClick={() => asignar(a.caravana, t)}
                              style={{
                                padding: "3px 8px", borderRadius: 6, fontSize: 10, cursor: "pointer", fontWeight: 600,
                                border: `1.5px solid ${asig === t ? C.verdeCampo : "rgba(107,66,38,.2)"}`,
                                background: asig === t ? (t === "Sin servicio" ? "rgba(147,55,44,.15)" : t === "TE" ? "rgba(212,168,90,.2)" : "rgba(74,124,78,.15)") : "rgba(255,253,245,.5)",
                                color: asig === t ? (t === "Sin servicio" ? C.urgente : t === "TE" ? C.cuero : C.verdeCampo) : C.cuero,
                              }}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {!animalesReproductivosEvento.length && <div className="txt-muted" style={{ textAlign: "center", padding: 16, fontSize: 12 }}>No hay vacas/vaquillas en los lotes elegidos</div>}
                </div>
                <div className="flex mt">
                  <Button variant="ghost" sm onClick={() => setEventoStep(2)}>← Atrás</Button>
                  <Button variant="verde" full onClick={guardarEventoCompleto}><Icono nombre="guardar" size={14} /> Registrar pre-servicio ({eventoForm.productos.length} productos · {animalesReproductivosEvento.length} animales)</Button>
                  <Button variant="ghost" sm onClick={cerrarEvento}>Cancelar</Button>
                </div>
              </>
            );
          })()}
        </Modal>
      )}

      {/* ── FORM INDIVIDUAL DE SANIDAD ───────────────────────────────── */}
      {showForm && (
        <Modal onClose={cerrarForm} title={<><Icono nombre="sanidad" size={16} /> Registrar Sanidad</>}>
          <div className="form-row">
            <Field label="Fecha">
              <Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
            </Field>
            <Field label="Lote">
              <Select options={LOTE_OPTIONS} value={form.lote} onChange={(e) => setForm({ ...form, lote: e.target.value, caravanas: [] })} />
            </Field>
          </div>
          <Field label="Producto">
            <div style={{ display: "flex", gap: 10, marginBottom: 6 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, cursor: "pointer" }}>
                <input type="radio" checked={productoModo === "catalogo"} onChange={() => { setProductoModo("catalogo"); setForm({ ...form, producto: "", tipo: "Vacuna" }); }} style={{ accentColor: C.verdeMonte }} />
                Del catálogo/botiquín
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, cursor: "pointer" }}>
                <input type="radio" checked={productoModo === "otro"} onChange={() => { setProductoModo("otro"); setForm({ ...form, producto: "" }); }} style={{ accentColor: C.verdeMonte }} />
                Otro (no está en el catálogo)
              </label>
            </div>
          </Field>
          {productoModo === "catalogo" ? (
            <div className="form-row">
              <Field label="Producto">
                <Select
                  placeholder="Elegir producto..."
                  options={listaProductos.map((p) => ({ value: p.nombre, label: `${p.nombre} (${p.categoria})` }))}
                  value={form.producto}
                  onChange={(e) => elegirProductoCatalogo(e.target.value)}
                />
                {!listaProductos.length && (
                  <span className="txt-muted" style={{ fontSize: 11 }}>
                    Sin productos cargados — agregalos en <Icono nombre="catalogo" size={11} /> Catálogo.
                  </span>
                )}
              </Field>
              <Field label="Dosis">
                <Input value={form.dosis} onChange={(e) => setForm({ ...form, dosis: e.target.value })} placeholder="se completa sola, editable" />
              </Field>
            </div>
          ) : (
            <div className="form-row">
              <Field label="Producto">
                <Input value={form.producto} onChange={(e) => setForm({ ...form, producto: e.target.value })} placeholder="Nombre del producto" />
              </Field>
              <Field label="Tipo">
                <Select options={TIPOS_SANIDAD} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} />
              </Field>
            </div>
          )}
          {productoModo === "otro" && (
            <div className="form-row">
              <Field label="Dosis">
                <Input value={form.dosis} onChange={(e) => setForm({ ...form, dosis: e.target.value })} />
              </Field>
              <Field label="Obs.">
                <Input value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} />
              </Field>
            </div>
          )}
          {productoModo === "catalogo" && (
            <div className="form-row">
              <Field label="Obs.">
                <Input value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} />
              </Field>
              <div />
            </div>
          )}
          <Field label="Aplica a">
            <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontFamily: "'Lora',serif", fontSize: 13 }}>
                <input type="radio" checked={form.alcance === "lote"} onChange={() => setForm({ ...form, alcance: "lote", caravanas: [] })} style={{ accentColor: C.verdeMonte }} /> <Icono nombre="hacienda" size={13} /> Lote completo
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontFamily: "'Lora',serif", fontSize: 13 }}>
                <input type="radio" checked={form.alcance === "individual"} onChange={() => setForm({ ...form, alcance: "individual", caravanas: [] })} style={{ accentColor: C.verdeMonte }} /> <Icono nombre="seleccionEspecifica" size={13} /> Animales específicos
              </label>
            </div>
          </Field>
          {form.alcance === "individual" && (
            <div className="card mb" style={{ background: "rgba(107,66,38,.04)", border: "1px solid rgba(107,66,38,.15)", padding: 12 }}>
              <div style={{ marginBottom: 8, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input placeholder="Buscar caravana..." value={busqCar} onChange={(e) => setBusqCar(e.target.value)} className="search-input" style={{ flex: 1, minWidth: 120 }} />
                <Button variant="ghost" sm onClick={() => setForm({ ...form, caravanas: animalesLoteForm.map((a) => a.caravana) })}>✓ Todos</Button>
                <Button variant="ghost" sm onClick={() => setForm({ ...form, caravanas: [] })}>✗ Ninguno</Button>
                <span style={{ fontSize: 11, color: C.verdeMonte, fontWeight: 600 }}>{(form.caravanas || []).length} seleccionados</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 180, overflowY: "auto" }}>
                {animalesFiltrados.map((a) => {
                  const sel = (form.caravanas || []).includes(a.caravana);
                  return (
                    <label key={a.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontFamily: "'Lora',serif", background: sel ? "rgba(74,124,78,.15)" : "rgba(107,66,38,.06)", border: `1px solid ${sel ? C.verdeCampo : "rgba(107,66,38,.15)"}`, color: sel ? C.verdeCampo : C.tinta }}>
                      <input type="checkbox" checked={sel} onChange={() => toggleCaravana(a.caravana)} style={{ accentColor: C.verdeCampo, width: 12, height: 12 }} />
                      {a.caravana}{a.nombre ? ` — ${a.nombre}` : ""}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex mt">
            <Button variant="verde" onClick={guardar}><Icono nombre="guardar" size={14} /> {form.alcance === "individual" ? `Guardar (${(form.caravanas || []).length} animales)` : "Guardar"}</Button>
            <Button variant="ghost" sm onClick={cerrarForm}>Cancelar</Button>
          </div>
        </Modal>
      )}

      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th style={thStyle("fecha")} onClick={() => toggleSort("fecha")}>Fecha{icon("fecha")}</th>
                <th style={thStyle("lote")} onClick={() => toggleSort("lote")}>Lote{icon("lote")}</th>
                <th>Animal</th>
                <th style={thStyle("tipo")} onClick={() => toggleSort("tipo")}>Tipo{icon("tipo")}</th>
                <th style={thStyle("producto")} onClick={() => toggleSort("producto")}>Producto{icon("producto")}</th>
                <th>Dosis</th><th>Obs.</th>
                {puedeEditar && <th></th>}
              </tr>
            </thead>
            <tbody>
              {sortFn(rows).map((s) => (
                <tr key={s.id}>
                  <td style={{ fontSize: 11 }}>{s.fecha}</td>
                  <td><Badge tone="cielo">{s.lote}</Badge></td>
                  <td style={{ fontSize: 11 }}>
                    {s.caravana ? (
                      <button className="btn btn-ghost btn-sm" style={{ padding: "2px 6px", fontSize: 11, fontWeight: 700 }} onClick={() => abrirFicha(s.caravana)}><Icono nombre="hacienda" size={12} /> {s.caravana}</button>
                    ) : (
                      <span className="txt-muted" style={{ fontSize: 10 }}>Lote</span>
                    )}
                  </td>
                  <td><Badge tone="paja" style={{ fontSize: 9 }}>{s.tipo}</Badge></td>
                  <td style={{ fontSize: 11, fontWeight: 600 }}>{s.producto}</td>
                  <td style={{ fontSize: 11 }}>{s.dosis}</td>
                  <td className="txt-muted" style={{ fontSize: 10 }}>{s.obs || "—"}</td>
                  {puedeEditar && (
                    <td style={{ display: "flex", gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" style={{ fontSize: 12, padding: "3px 8px" }} onClick={() => abrirEditar(s)}><Icono nombre="editar" size={14} /></button>
                      <button className="btn btn-rojo btn-sm" onClick={() => eliminar(s.id)}><Icono nombre="eliminar" size={14} /></button>
                    </td>
                  )}
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={puedeEditar ? 8 : 7} className="txt-muted" style={{ textAlign: "center", padding: 12 }}>Sin registros de sanidad.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
