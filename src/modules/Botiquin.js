import { useState } from "react";
import { useCollection } from "../hooks/useCollection";
import { Modal } from "../components/Modal";
import { Field, Input, Select, Button, Badge } from "../components/Field";
import { Icono } from "../components/Icon";
import { canEdit, isAdmin } from "../lib/permissions";
import { today, formatDisplay } from "../lib/dateUtils";
import { C, CATEGORIAS_PRODUCTO } from "../lib/constants";
import { calcularStock, rindeAnimales, registrarCompra, registrarAjuste } from "../lib/botiquin";

const BLANK_PROD = {
  nombre: "", categoria: "Vacuna", descripcion: "", dosis: "", unidad: "ml",
  costoUnitario: "", contenidoPorUnidad: "", dosisPorAnimal: "",
};

export function Botiquin({ rol, user }) {
  // Mismo catálogo que usa Sanidad → el producto vive en una sola colección
  // (`productos`) sin importar desde qué pantalla se dio de alta.
  const [productos, addProducto, updateProducto] = useCollection("productos");
  const [movimientos] = useCollection("stock_movimientos");
  // Costos es de solo-Admin en las reglas de Firestore — se suscribe igual
  // (para no romper las reglas de hooks), pero el vínculo compra→costo solo
  // se ofrece/escribe cuando el rol actual es admin.
  const [, addCosto] = useCollection("costos", { auditar: true, softDelete: true, user });
  const puedeEditar = canEdit(rol, "botiquin");
  const admin = isAdmin(rol);
  const listaProductos = productos || [];
  const listaMov = movimientos || [];

  const conSeguimiento = listaProductos.filter((p) => p.contenidoPorUnidad && p.dosisPorAnimal);
  const sinSeguimiento = listaProductos.filter((p) => !(p.contenidoPorUnidad && p.dosisPorAnimal));

  const [modal, setModal] = useState(null); // { tipo: "existente"|"compra"|"ajuste"|"historial"|"nuevoProducto", producto }
  const [cantidad, setCantidad] = useState("");
  const [costoTotal, setCostoTotal] = useState("");
  const [fecha, setFecha] = useState(today());
  const [obs, setObs] = useState("");
  const [productoSel, setProductoSel] = useState("");
  const [formProd, setFormProd] = useState(BLANK_PROD);
  const [editProdId, setEditProdId] = useState(null);
  // Al crear un producto nuevo acá, lo natural es seguir directo a cargarle
  // el stock que ya tenés de él — evita el viaje de ida y vuelta.
  const [siguienteAlCrear, setSiguienteAlCrear] = useState("existente");

  const cerrarModal = () => { setModal(null); setCantidad(""); setCostoTotal(""); setObs(""); setFecha(today()); setProductoSel(""); setFormProd(BLANK_PROD); setEditProdId(null); };

  const abrirExistente = (p) => { setModal({ tipo: "existente", producto: p }); setProductoSel(p?.id || ""); };
  const abrirCompra = (p) => { setModal({ tipo: "compra", producto: p }); setProductoSel(p?.id || ""); };
  const abrirAjuste = (p) => { setModal({ tipo: "ajuste", producto: p }); setProductoSel(p?.id || ""); };
  const abrirHistorial = (p) => setModal({ tipo: "historial", producto: p });
  const abrirNuevoProducto = (siguiente = "existente") => {
    setFormProd(BLANK_PROD);
    setEditProdId(null);
    setSiguienteAlCrear(siguiente);
    setModal({ tipo: "nuevoProducto" });
  };
  const abrirEditarProducto = (p) => {
    setFormProd({ ...BLANK_PROD, ...p, costoUnitario: p.costoUnitario ?? "", contenidoPorUnidad: p.contenidoPorUnidad ?? "", dosisPorAnimal: p.dosisPorAnimal ?? "" });
    setEditProdId(p.id);
    setModal({ tipo: "nuevoProducto" });
  };

  const confirmarNuevoProducto = async () => {
    if (!formProd.nombre.trim()) { alert("Ponele un nombre al producto"); return; }
    const data = {
      ...formProd,
      costoUnitario: +formProd.costoUnitario || 0,
      contenidoPorUnidad: formProd.contenidoPorUnidad === "" ? "" : +formProd.contenidoPorUnidad,
      dosisPorAnimal: formProd.dosisPorAnimal === "" ? "" : +formProd.dosisPorAnimal,
    };
    if (editProdId) {
      await updateProducto(editProdId, data);
      cerrarModal();
      return;
    }
    const ref = await addProducto(data);
    // Seguir directo a cargar el stock de este producto recién creado.
    setProductoSel(ref?.id || "");
    setEditProdId(null);
    setModal({ tipo: siguienteAlCrear });
  };

  // Stock que ya tenías antes de usar la app — se carga tal cual, sin costo
  // (ese gasto ya se hizo en su momento, no corresponde registrarlo ahora).
  const confirmarExistente = async () => {
    const p = listaProductos.find((x) => x.id === productoSel);
    if (!p || !cantidad) return;
    await registrarCompra({ producto: p, cantidad, fecha, obs: obs || "Carga de stock existente (sin costo — comprado antes de usar la app)", user });
    cerrarModal();
  };

  // Compra nueva de acá en adelante — SÍ suma al Botiquín y, si cargás el
  // costo (y sos Admin), también crea el gasto en el módulo Costos.
  const confirmarCompra = async () => {
    const p = listaProductos.find((x) => x.id === productoSel);
    if (!p || !cantidad) return;
    await registrarCompra({ producto: p, cantidad, fecha, obs, user });
    if (admin && costoTotal) {
      await addCosto({
        fecha, categoria: "compra",
        descripcion: `Compra ${p.nombre} (${cantidad}${p.unidad})${obs ? " — " + obs : ""}`,
        monto: Number(costoTotal), productoRef: p.id, cantidad: Number(cantidad),
      });
    }
    cerrarModal();
  };
  const confirmarAjuste = async () => {
    const p = listaProductos.find((x) => x.id === productoSel);
    if (!p || !cantidad) { alert("Elegí un producto y una cantidad (puede ser negativa)"); return; }
    if (!obs.trim()) { alert("El ajuste manual necesita una observación (ej: conteo físico, vencimiento, pérdida)"); return; }
    await registrarAjuste({ producto: p, cantidad, fecha, obs, user });
    cerrarModal();
  };

  const estadoStock = (p, stock) => {
    if (stock <= 0) return { tone: "rojo", label: <><Icono nombre="advertencia" size={12} /> Sin stock</> };
    if (stock < Number(p.contenidoPorUnidad)) return { tone: "paja", label: <><Icono nombre="advertencia" size={12} /> Queda menos de un envase</> };
    return { tone: "verde", label: "OK" };
  };

  return (
    <div>
      <div className="section-hdr">
        <h2><Icono nombre="botiquin" size={20} /> Botiquín</h2>
        {puedeEditar && (
          <div className="flex" style={{ flexWrap: "wrap" }}>
            <Button variant="prim" sm onClick={() => abrirNuevoProducto("existente")}><Icono nombre="agregar" size={16} /> Nuevo producto</Button>
            <Button variant="ghost" sm onClick={() => abrirExistente(null)}><Icono nombre="catalogo" size={16} /> Cargar stock existente</Button>
            <Button variant="ghost" sm onClick={() => abrirCompra(null)}><Icono nombre="registrarCompra" size={16} /> Registrar compra nueva</Button>
            <Button variant="ghost" sm onClick={() => abrirAjuste(null)}><Icono nombre="ajusteDeStock" size={16} /> Ajuste manual</Button>
          </div>
        )}
      </div>

      <p className="txt-muted mb" style={{ fontSize: 11.5 }}>
        El stock se calcula solo, sumando compras y restando lo que se aplicó en Sanidad, según la dosis fija de cada producto (esta misma pantalla te la pide al crearlo — no hace falta ir a otro lado).
      </p>

      {!listaProductos.length && puedeEditar && (
        <div className="card" style={{ textAlign: "center", padding: 20 }}>
          <div className="txt-muted mb" style={{ fontSize: 13 }}>Todavía no cargaste ningún producto.</div>
          <Button variant="prim" onClick={() => abrirNuevoProducto("existente")}><Icono nombre="agregar" size={16} /> Cargar el primer producto</Button>
        </div>
      )}
      {listaProductos.length > 0 && !conSeguimiento.length && (
        <div className="card">
          <div className="txt-muted" style={{ textAlign: "center", padding: 16, fontSize: 12 }}>
            Ningún producto tiene cargado "contenido por envase" + "dosis por animal" todavía — sin eso no se puede calcular el stock.
            Editalo desde acá abajo, en "Sin seguimiento de stock".
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
        {conSeguimiento.map((p) => {
          const stock = calcularStock(p.id, listaMov);
          const rinde = rindeAnimales(p, stock);
          const estado = estadoStock(p, stock);
          return (
            <div key={p.id} className="card" style={{ marginBottom: 0 }}>
              <div className="card-title" style={{ fontSize: 14 }}>{p.nombre}</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-display)", color: C.cuero }}>
                {stock.toLocaleString("es-PY")} <span style={{ fontSize: 13, fontWeight: 400 }}>{p.unidad}</span>
              </div>
              <div className="txt-muted" style={{ fontSize: 11, marginBottom: 6 }}>
                Envase: {p.contenidoPorUnidad}{p.unidad} · Dosis: {p.dosisPorAnimal}{p.unidad}/animal
                {rinde !== null && <> · rinde ~{rinde} animal(es)</>}
              </div>
              <Badge tone={estado.tone} style={{ marginBottom: 10 }}>{estado.label}</Badge>
              {puedeEditar && (
                <div className="flex" style={{ flexWrap: "wrap" }}>
                  <Button variant="ghost" sm onClick={() => abrirCompra(p)}><Icono nombre="registrarCompra" size={14} /> Compra</Button>
                  <Button variant="ghost" sm onClick={() => abrirAjuste(p)}><Icono nombre="ajusteDeStock" size={14} /> Ajuste</Button>
                </div>
              )}
              <div className="flex" style={{ marginTop: 6 }}>
                <button className="btn btn-ghost btn-sm" style={{ fontSize: 10 }} onClick={() => abrirHistorial(p)}><Icono nombre="historial" size={12} /> Historial</button>
                {puedeEditar && (
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: 10 }} onClick={() => abrirEditarProducto(p)}><Icono nombre="editar" size={12} /> Editar</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {sinSeguimiento.length > 0 && (
        <div className="card mt">
          <div className="card-title" style={{ fontSize: 13 }}>Sin seguimiento de stock</div>
          <div className="txt-muted" style={{ fontSize: 11, marginBottom: 8 }}>
            Estos productos no tienen contenido/dosis fija cargada (ej. dosis por peso) — no se calcula stock automático:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {sinSeguimiento.map((p) => (
              <button key={p.id} className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => abrirEditarProducto(p)}>
                <Icono nombre="editar" size={11} /> {p.nombre}
              </button>
            ))}
          </div>
        </div>
      )}

      {modal?.tipo === "nuevoProducto" && (
        <Modal onClose={cerrarModal} title={<><Icono nombre="agregar" size={18} /> {editProdId ? "Editar producto" : "Nuevo producto"}</>}>
          <div className="form-row">
            <Field label="Nombre comercial">
              <Input value={formProd.nombre} onChange={(e) => setFormProd({ ...formProd, nombre: e.target.value })} placeholder="Ej: Doramectina Gold" />
            </Field>
            <Field label="Categoría">
              <Select options={CATEGORIAS_PRODUCTO} value={formProd.categoria} onChange={(e) => setFormProd({ ...formProd, categoria: e.target.value })} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Dosis estándar (texto libre)">
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
            <Field label={`Contenido por envase (${formProd.unidad})`}>
              <Input type="number" value={formProd.contenidoPorUnidad} onChange={(e) => setFormProd({ ...formProd, contenidoPorUnidad: e.target.value })} placeholder="Ej: 500" />
            </Field>
            <Field label={`Dosis fija por animal (${formProd.unidad})`}>
              <Input type="number" value={formProd.dosisPorAnimal} onChange={(e) => setFormProd({ ...formProd, dosisPorAnimal: e.target.value })} placeholder="Ej: 10" />
            </Field>
          </div>
          <p className="txt-muted mb" style={{ fontSize: 10.5 }}>
            Completá estos dos últimos si querés que el Botiquín descuente stock solo cada vez que lo apliques en Sanidad. Si la dosis varía según el peso del animal, dejalos vacíos.
          </p>
          <div className="flex">
            <Button variant="verde" onClick={confirmarNuevoProducto}>
              <Icono nombre="guardar" size={16} /> {editProdId ? "Guardar cambios" : "Crear y seguir"}
            </Button>
            <Button variant="ghost" sm onClick={cerrarModal}>Cancelar</Button>
          </div>
        </Modal>
      )}

      {modal?.tipo === "existente" && (
        <Modal onClose={cerrarModal} title={<><Icono nombre="catalogo" size={18} /> Cargar stock existente</>}>
          <p className="txt-muted mb" style={{ fontSize: 11 }}>
            Para cargar lo que ya tenés guardado (comprado antes de usar la app) — no pide costo, ese gasto ya fue hecho.
          </p>
          <Field label="Producto">
            <Select
              options={listaProductos.map((p) => ({ value: p.id, label: p.nombre }))}
              placeholder="Seleccionar..."
              value={productoSel}
              onChange={(e) => setProductoSel(e.target.value)}
            />
          </Field>
          <button className="btn btn-ghost btn-sm mb" style={{ fontSize: 11 }} onClick={() => abrirNuevoProducto("existente")}>
            <Icono nombre="agregar" size={12} /> No está en la lista — crear producto
          </button>
          <div className="form-row mt">
            <Field label={`Cantidad que tenés (${listaProductos.find((p) => p.id === productoSel)?.unidad || "unidad"})`}>
              <Input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="Ej: 1500 (3 frascos de 500)" />
            </Field>
            <Field label="Fecha (opcional)">
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </Field>
          </div>
          <Field label="Obs. (opcional)">
            <Input value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ej: quedaba de la compra de marzo" />
          </Field>
          <div className="flex mt">
            <Button variant="verde" onClick={confirmarExistente}><Icono nombre="guardar" size={16} /> Cargar stock</Button>
            <Button variant="ghost" sm onClick={cerrarModal}>Cancelar</Button>
          </div>
        </Modal>
      )}

      {modal?.tipo === "compra" && (
        <Modal onClose={cerrarModal} title={<><Icono nombre="registrarCompra" size={18} /> Registrar compra nueva</>}>
          <Field label="Producto">
            <Select
              options={listaProductos.map((p) => ({ value: p.id, label: p.nombre }))}
              placeholder="Seleccionar..."
              value={productoSel}
              onChange={(e) => setProductoSel(e.target.value)}
            />
          </Field>
          <button className="btn btn-ghost btn-sm mb" style={{ fontSize: 11 }} onClick={() => abrirNuevoProducto("compra")}>
            <Icono nombre="agregar" size={12} /> No está en la lista — crear producto
          </button>
          <div className="form-row mt">
            <Field label={`Cantidad comprada (${listaProductos.find((p) => p.id === productoSel)?.unidad || "unidad"})`}>
              <Input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="Ej: 1000 (2 frascos de 500)" />
            </Field>
            <Field label="Fecha">
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </Field>
          </div>
          {admin ? (
            <Field label="Costo total de la compra (₲, opcional)">
              <Input type="number" value={costoTotal} onChange={(e) => setCostoTotal(e.target.value)} placeholder="Si lo cargás, se registra también en Costos" />
            </Field>
          ) : (
            <p className="txt-muted" style={{ fontSize: 10.5 }}>El costo de esta compra lo puede cargar el Admin luego, desde este mismo botón.</p>
          )}
          <Field label="Obs. (opcional)">
            <Input value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ej: comprado en Agroveterinaria X" />
          </Field>
          <div className="flex mt">
            <Button variant="verde" onClick={confirmarCompra}><Icono nombre="guardar" size={16} /> Registrar</Button>
            <Button variant="ghost" sm onClick={cerrarModal}>Cancelar</Button>
          </div>
        </Modal>
      )}

      {modal?.tipo === "ajuste" && (
        <Modal onClose={cerrarModal} title={<><Icono nombre="ajusteDeStock" size={18} /> Ajuste manual de stock</>}>
          <Field label="Producto">
            <Select
              options={listaProductos.map((p) => ({ value: p.id, label: p.nombre }))}
              placeholder="Seleccionar..."
              value={productoSel}
              onChange={(e) => setProductoSel(e.target.value)}
            />
          </Field>
          <div className="form-row mt">
            <Field label="Cantidad (+ o -)">
              <Input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="Ej: -50 (se perdió/venció) o 20 (conteo físico dio más)" />
            </Field>
            <Field label="Fecha">
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </Field>
          </div>
          <Field label="Motivo (obligatorio)">
            <Input value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ej: vencido, conteo físico, se rompió el frasco" />
          </Field>
          <div className="flex mt">
            <Button variant="verde" onClick={confirmarAjuste}><Icono nombre="guardar" size={16} /> Ajustar</Button>
            <Button variant="ghost" sm onClick={cerrarModal}>Cancelar</Button>
          </div>
        </Modal>
      )}

      {modal?.tipo === "historial" && (
        <Modal onClose={cerrarModal} title={<><Icono nombre="historial" size={18} /> {`Historial — ${modal.producto.nombre}`}</>}>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Fecha</th><th>Tipo</th><th>Cantidad</th><th>Obs.</th></tr></thead>
              <tbody>
                {listaMov.filter((m) => m.productoId === modal.producto.id).sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "")).map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontSize: 11 }}>{formatDisplay(m.fecha)}</td>
                    <td><Badge tone={m.tipo === "compra" ? "verde" : m.tipo === "consumo" ? "cielo" : "paja"} style={{ fontSize: 9 }}>{m.tipo}</Badge></td>
                    <td style={{ fontSize: 12, fontWeight: 700, color: m.cantidad < 0 ? C.urgente : C.alDia }}>
                      {m.cantidad > 0 ? "+" : ""}{m.cantidad} {m.unidad}
                    </td>
                    <td className="txt-muted" style={{ fontSize: 10 }}>{m.obs || "—"}</td>
                  </tr>
                ))}
                {!listaMov.filter((m) => m.productoId === modal.producto.id).length && (
                  <tr><td colSpan="4" className="txt-muted" style={{ textAlign: "center", padding: 12 }}>Sin movimientos todavía.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </div>
  );
}
