import { useState, useMemo } from "react";
import { useCollection } from "../hooks/useCollection";
import { useYearFilter } from "../hooks/useYearFilter";
import { useSorter } from "../hooks/useSorter";
import { YearPills } from "../components/YearPills";
import { Modal } from "../components/Modal";
import { Field, Input, Select, Button, Badge } from "../components/Field";
import { Icono } from "../components/Icon";
import { isAdmin } from "../lib/permissions";
import { CATEGORIAS_COSTO, CATEGORIAS_COSTO_LABEL, C } from "../lib/constants";
import { today, addDays } from "../lib/dateUtils";

const blank = { fecha: today(), categoria: "otro", descripcion: "", monto: "", productoRef: "", cantidad: "", obs: "" };

const fmtMonto = (n) => "$ " + Number(n || 0).toLocaleString("es-PY", { maximumFractionDigits: 0 });

// Costos: módulo solo-Admin. Permite cargar gastos manuales, y generar costos
// automáticamente a partir de eventos de Sanidad ya cargados (para no
// requerir que Capataz/Veterinario tengan permiso de escritura en `costos`).
export function Costos({ rol, user }) {
  // Importante: todos los hooks se llaman siempre, antes de cualquier return
  // condicional — si el chequeo de rol estuviera antes de los hooks (como
  // estaba originalmente), un cambio de rol en caliente mientras esta
  // pantalla está abierta rompería la app ("Rendered fewer hooks than
  // expected"). App.js ya bloquea el acceso a este módulo por rol vía
  // ProtectedTab; este chequeo es una segunda capa, no la única.
  const [costos, addCosto, updateCosto, removeCosto] = useCollection("costos", { auditar: true, softDelete: true, user });
  const [productos] = useCollection("productos");
  const [sanidad] = useCollection("sanidad");

  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const { anio, setAnio, anos, filtered: costosFiltrados } = useYearFilter(costos, "fecha");
  const { sortFn, toggleSort, icon, thStyle } = useSorter("fecha");
  const rows = sortFn(costosFiltrados);

  const productosConCosto = (productos || []).filter((p) => Number(p.costoUnitario) > 0);

  const cerrar = () => {
    setForm(blank);
    setEditId(null);
    setShowForm(false);
  };

  const onProductoChange = (productoRef) => {
    const prod = productosConCosto.find((p) => p.id === productoRef);
    const cantidad = form.cantidad || "1";
    const monto = prod ? String(Number(prod.costoUnitario) * (Number(cantidad) || 0)) : form.monto;
    setForm({ ...form, productoRef, cantidad, monto });
  };

  const onCantidadChange = (cantidad) => {
    const prod = productosConCosto.find((p) => p.id === form.productoRef);
    const monto = prod ? String(Number(prod.costoUnitario) * (Number(cantidad) || 0)) : form.monto;
    setForm({ ...form, cantidad, monto });
  };

  const guardar = async () => {
    if (!form.fecha || !form.monto) return;
    const data = {
      fecha: form.fecha,
      categoria: form.categoria,
      descripcion: form.descripcion,
      monto: Number(form.monto) || 0,
      obs: form.obs || "",
      productoRef: form.productoRef || null,
      cantidad: form.cantidad ? Number(form.cantidad) : null,
    };
    if (editId) {
      await updateCosto(editId, data);
    } else {
      await addCosto(data);
    }
    cerrar();
  };

  const abrirEditar = (c) => {
    setForm({
      fecha: c.fecha,
      categoria: c.categoria,
      descripcion: c.descripcion || "",
      monto: String(c.monto ?? ""),
      productoRef: c.productoRef || "",
      cantidad: c.cantidad != null ? String(c.cantidad) : "",
      obs: c.obs || "",
    });
    setEditId(c.id);
    setShowForm(true);
  };

  const eliminar = async (id) => {
    if (!window.confirm("¿Eliminar este costo? Quedará en el historial permanente (Papelera), no se borra de verdad.")) return;
    await removeCosto(id);
  };

  // "Generar desde Sanidad": candidatos de los últimos 90 días cuyo producto
  // tiene costoUnitario cargado en el catálogo y que todavía no tienen un
  // costo generado (rastreado vía sanidadRef).
  const candidatosSanidad = useMemo(() => {
    if (!sanidad || !productos) return [];
    const yaGenerados = new Set((costos || []).map((c) => c.sanidadRef).filter(Boolean));
    const limite = today();
    const limiteStr = addDays(limite, -90);
    return sanidad
      .filter((s) => !s.eliminado && !yaGenerados.has(s.id) && s.fecha >= limiteStr && s.fecha <= limite)
      .map((s) => {
        const prod = productos.find((p) => p.nombre === s.producto && Number(p.costoUnitario) > 0);
        return prod ? { sanidad: s, producto: prod } : null;
      })
      .filter(Boolean)
      .sort((a, b) => (b.sanidad.fecha || "").localeCompare(a.sanidad.fecha || ""));
  }, [sanidad, productos, costos]);

  const generarDesdeSanidad = async ({ sanidad: s, producto }) => {
    // El registro de Sanidad guarda cuántos animales recibieron esa
    // aplicación (`cantidadAnimales`) desde que Sanidad.js empezó a
    // escribirlo — para registros viejos que no lo tienen, se asume 1 y el
    // Admin puede corregir el monto a mano si en realidad fue un lote.
    const cantidadAnimales = s.cantidadAnimales || 1;
    await addCosto({
      fecha: s.fecha,
      categoria: "sanidad",
      descripcion: s.producto + (s.caravana ? ` — Car. ${s.caravana}` : s.lote ? ` — Lote ${s.lote} (${cantidadAnimales} animales)` : ""),
      monto: (Number(producto.costoUnitario) || 0) * cantidadAnimales,
      obs: "",
      sanidadRef: s.id,
      productoRef: producto.id,
      cantidad: cantidadAnimales,
    });
  };

  if (!isAdmin(rol)) {
    return <div className="card txt-muted" style={{ padding: 16 }}>No tenés permiso para ver este módulo.</div>;
  }

  const totalGastado = costosFiltrados.reduce((sum, c) => sum + (Number(c.monto) || 0), 0);
  const porCategoria = CATEGORIAS_COSTO.map((cat) => ({
    cat,
    total: costosFiltrados.filter((c) => c.categoria === cat).reduce((s, c) => s + (Number(c.monto) || 0), 0),
  })).filter((x) => x.total > 0);

  const porMes = useMemo(() => {
    const map = {};
    costosFiltrados.forEach((c) => {
      const mes = (c.fecha || "").slice(0, 7);
      if (!mes) return;
      map[mes] = (map[mes] || 0) + (Number(c.monto) || 0);
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [costosFiltrados]);

  return (
    <div>
      <div className="section-hdr">
        <h2><Icono nombre="costos" size={20} /> Costos</h2>
        <Button variant="prim" sm onClick={() => (showForm ? cerrar() : setShowForm(true))}>
          {showForm ? <Icono nombre="cerrar" size={16} /> : <Icono nombre="agregar" size={16} />}
        </Button>
      </div>
      <YearPills anos={anos} anio={anio} setAnio={setAnio} />

      <div className="grid3 mb">
        <div className="statbox">
          <div className="statbox-num">{fmtMonto(totalGastado)}</div>
          <div className="statbox-lbl">Total gastado ({anio})</div>
        </div>
        <div className="statbox verde">
          <div className="statbox-num">{costosFiltrados.length}</div>
          <div className="statbox-lbl">Registros</div>
        </div>
        <div className="statbox paja">
          <div className="statbox-num">{candidatosSanidad.length}</div>
          <div className="statbox-lbl">Candidatos desde Sanidad</div>
        </div>
      </div>

      <div className="grid2 mb">
        <div className="card" style={{ padding: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: C.cuero }}>Por categoría</div>
          {porCategoria.length ? (
            porCategoria.map(({ cat, total }) => (
              <div key={cat} className="flex" style={{ justifyContent: "space-between", fontSize: 12, padding: "3px 0" }}>
                <Badge tone="cielo" style={{ fontSize: 9 }}>{CATEGORIAS_COSTO_LABEL[cat] || cat}</Badge>
                <span style={{ fontWeight: 700 }}>{fmtMonto(total)}</span>
              </div>
            ))
          ) : (
            <div className="txt-muted" style={{ fontSize: 12 }}>Sin datos para {anio}.</div>
          )}
        </div>
        <div className="card" style={{ padding: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: C.cuero }}>Por mes</div>
          {porMes.length ? (
            <div style={{ maxHeight: 160, overflowY: "auto" }}>
              {porMes.map(([mes, total]) => (
                <div key={mes} className="flex" style={{ justifyContent: "space-between", fontSize: 12, padding: "3px 0" }}>
                  <span>{mes}</span>
                  <span style={{ fontWeight: 700 }}>{fmtMonto(total)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="txt-muted" style={{ fontSize: 12 }}>Sin datos para {anio}.</div>
          )}
        </div>
      </div>

      {candidatosSanidad.length > 0 && (
        <div className="card mb" style={{ padding: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: C.cuero }}><Icono nombre="sanidad" size={16} /> Generar desde Sanidad (últimos 90 días)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 220, overflowY: "auto" }}>
            {candidatosSanidad.map(({ sanidad: s, producto }) => (
              <div key={s.id} className="flex" style={{ justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "6px 10px", borderRadius: 8, background: C.hueso, border: `1px solid ${C.niebla}` }}>
                <div>
                  <strong>{s.producto}</strong> {s.caravana ? `— Car. ${s.caravana}` : s.lote ? `— Lote ${s.lote}` : ""}
                  <span className="txt-muted" style={{ marginLeft: 8 }}>{s.fecha} · {fmtMonto(producto.costoUnitario)}</span>
                </div>
                <Button variant="verde" sm onClick={() => generarDesdeSanidad({ sanidad: s, producto })}><Icono nombre="agregar" size={14} /> Generar costo</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <Modal onClose={cerrar} title={editId ? <><Icono nombre="editar" size={18} /> Editar costo</> : <><Icono nombre="costos" size={18} /> Nuevo costo</>}>
          <div className="form-row">
            <Field label="Fecha">
              <Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
            </Field>
            <Field label="Categoría">
              <Select
                options={CATEGORIAS_COSTO.map((c) => ({ value: c, label: CATEGORIAS_COSTO_LABEL[c] }))}
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Descripción">
              <Input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </Field>
            <Field label="Monto">
              <Input type="number" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Producto (opcional)">
              <Select
                placeholder="— Ninguno —"
                options={productosConCosto.map((p) => ({ value: p.id, label: `${p.nombre} ($${p.costoUnitario})` }))}
                value={form.productoRef}
                onChange={(e) => onProductoChange(e.target.value)}
              />
            </Field>
            <Field label="Cantidad">
              <Input type="number" value={form.cantidad} onChange={(e) => onCantidadChange(e.target.value)} disabled={!form.productoRef} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Obs.">
              <Input value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} />
            </Field>
          </div>
          <div className="flex mt">
            <Button variant="verde" onClick={guardar}><Icono nombre="guardar" size={16} /> {editId ? "Guardar cambios" : "Guardar"}</Button>
            <Button variant="ghost" sm onClick={cerrar}>Cancelar</Button>
          </div>
        </Modal>
      )}

      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th style={thStyle("fecha")} onClick={() => toggleSort("fecha")}>Fecha{icon("fecha")}</th>
                <th style={thStyle("categoria")} onClick={() => toggleSort("categoria")}>Categoría{icon("categoria")}</th>
                <th>Descripción</th>
                <th>Monto</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontSize: 11 }}>{c.fecha}</td>
                  <td><Badge tone="cielo" style={{ fontSize: 9 }}>{CATEGORIAS_COSTO_LABEL[c.categoria] || c.categoria}</Badge></td>
                  <td style={{ fontSize: 12 }}>{c.descripcion || "—"}</td>
                  <td style={{ fontWeight: 700 }}>{fmtMonto(c.monto)}</td>
                  <td style={{ display: "flex", gap: 4 }}>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize: 12, padding: "3px 8px" }} onClick={() => abrirEditar(c)}><Icono nombre="editar" size={14} /></button>
                    <button className="btn btn-rojo btn-sm" onClick={() => eliminar(c.id)}><Icono nombre="eliminar" size={14} /></button>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={5} className="txt-muted" style={{ textAlign: "center", padding: 12 }}>
                    Sin costos registrados para {anio}.
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
