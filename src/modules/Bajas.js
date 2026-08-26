import { useState } from "react";
import { useCollection } from "../hooks/useCollection";
import { useYearFilter } from "../hooks/useYearFilter";
import { useSorter } from "../hooks/useSorter";
import { YearPills } from "../components/YearPills";
import { Modal } from "../components/Modal";
import { Icono } from "../components/Icon";
import { Field, Input, Select, Button, Badge } from "../components/Field";
import { canEdit } from "../lib/permissions";
import { CAUSAS_BAJA } from "../lib/constants";
import { today } from "../lib/dateUtils";

const blank = { animalId: "", caravana: "", causa: "Muerte", fecha: today(), obs: "" };

const CAUSA_TONE = {
  Muerte: "rojo",
  Faena: "gris",
  Venta: "verde",
  Descarte: "paja",
  Robo: "rojo",
  Otro: "gris",
};

// Bajas: registrar la salida definitiva de un animal de Hacienda (muerte,
// faena, venta, descarte, robo). Al registrar una baja se guarda un snapshot
// completo del animal (por si luego se corrige/borra el registro en
// Hacienda, el historial de la baja queda autocontenido) y se lo remueve de
// la lista activa de `animales` — esto SÍ es una remoción intencional del
// rodeo activo, no un error de carga: queda recuperable para siempre acá
// mismo (soft-delete) y visible en el módulo Papelera si se elimina por error.
export function Bajas({ animales, addAnimal, removeAnimal, updateAnimal, rol, abrirFicha, user }) {
  const [bajas, addBaja, updateBaja, removeBaja] = useCollection("bajas", { softDelete: true, user });
  const puedeEditar = canEdit(rol, "bajas");

  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const { anio, setAnio, anos, filtered: bajasFiltradas } = useYearFilter(bajas, "fecha");
  const { sortFn, toggleSort, icon, thStyle } = useSorter("fecha");
  const rows = sortFn(bajasFiltradas);

  const cerrar = () => {
    setForm(blank);
    setEditId(null);
    setShowForm(false);
  };

  const guardar = async () => {
    if (editId) {
      // Edición: solo se corrigen causa/fecha/obs del registro de baja, el
      // snapshot del animal no se toca (es historia congelada).
      await updateBaja(editId, { causa: form.causa, fecha: form.fecha, obs: form.obs });
      cerrar();
      return;
    }
    if (!form.animalId) return;
    const animal = animales.find((a) => a.id === form.animalId);
    if (!animal) return;

    await addBaja({
      ...animal,
      animalId: animal.id,
      causa: form.causa,
      fecha: form.fecha,
      obs: form.obs,
    });
    await removeAnimal(animal.id);
    cerrar();
  };

  const abrirEditar = (b) => {
    setForm({ ...blank, animalId: b.animalId || "", caravana: b.caravana || "", causa: b.causa, fecha: b.fecha, obs: b.obs || "" });
    setEditId(b.id);
    setShowForm(true);
  };

  const eliminar = async (id) => {
    if (!window.confirm("¿Eliminar este registro de baja? Quedará en el historial permanente (Papelera), no se borra de verdad.")) return;
    await removeBaja(id);
  };

  const porCausa = CAUSAS_BAJA.map((c) => ({ causa: c, n: bajasFiltradas.filter((b) => b.causa === c).length })).filter((x) => x.n > 0);

  return (
    <div>
      <div className="section-hdr">
        <h2><Icono nombre="bajas" size={18} /> Bajas</h2>
        {puedeEditar && (
          <Button variant="prim" sm onClick={() => (showForm ? cerrar() : setShowForm(true))}>
            {showForm ? <Icono nombre="cerrar" size={14} /> : <Icono nombre="agregar" size={14} />}
          </Button>
        )}
      </div>
      <YearPills anos={anos} anio={anio} setAnio={setAnio} />

      <div className="grid4 mb">
        {porCausa.map(({ causa, n }) => (
          <div key={causa} className={`statbox ${CAUSA_TONE[causa]}`} data-icon={causa === "Muerte" ? "💀" : causa === "Venta" ? "💰" : causa === "Faena" ? "🔪" : "📋"}>
            <div className="statbox-num">{n}</div>
            <div className="statbox-lbl">{causa}</div>
          </div>
        ))}
        {!porCausa.length && (
          <div className="statbox" data-icon="⚰️">
            <div className="statbox-num">0</div>
            <div className="statbox-lbl">Bajas en {anio}</div>
          </div>
        )}
      </div>

      {showForm && (
        <Modal onClose={cerrar} title={<><Icono nombre={editId ? "editar" : "bajas"} size={16} /> {editId ? "Editar baja" : "Registrar baja"}</>}>
          {!editId && (
            <div className="form-row">
              <Field label="Animal (caravana)">
                <Select
                  placeholder="Seleccionar..."
                  options={animales.map((a) => ({ value: a.id, label: `${a.caravana} — ${a.categoria}` }))}
                  value={form.animalId}
                  onChange={(e) => setForm({ ...form, animalId: e.target.value })}
                />
              </Field>
              <Field label="Fecha">
                <Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
              </Field>
            </div>
          )}
          {editId && (
            <div className="form-row">
              <Field label="Caravana">
                <Input value={form.caravana} disabled />
              </Field>
              <Field label="Fecha">
                <Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
              </Field>
            </div>
          )}
          <div className="form-row">
            <Field label="Causa">
              <Select options={CAUSAS_BAJA} value={form.causa} onChange={(e) => setForm({ ...form, causa: e.target.value })} />
            </Field>
            <Field label="Obs. / Detalle">
              <Input value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} />
            </Field>
          </div>
          <div className="flex mt">
            <Button variant="verde" onClick={guardar}><Icono nombre="guardar" size={14} /> {editId ? "Guardar cambios" : "Registrar baja"}</Button>
            <Button variant="ghost" sm onClick={cerrar}>Cancelar</Button>
          </div>
        </Modal>
      )}

      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th style={thStyle("caravana")} onClick={() => toggleSort("caravana")}>Car.{icon("caravana")}</th>
                <th style={thStyle("fecha")} onClick={() => toggleSort("fecha")}>Fecha{icon("fecha")}</th>
                <th style={thStyle("causa")} onClick={() => toggleSort("causa")}>Causa{icon("causa")}</th>
                <th>Categoría</th>
                <th>Obs.</th>
                {puedeEditar && <th></th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => {
                // El animal ya no existe en Hacienda (fue removido al dar la
                // baja) — mostramos los datos del snapshot directamente en
                // vez de intentar abrir la ficha, que no lo va a encontrar.
                const enHacienda = animales.find((a) => a.id === b.animalId);
                return (
                  <tr key={b.id}>
                    <td>
                      {enHacienda ? (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ padding: "2px 8px", fontWeight: 700, fontSize: 12 }}
                          onClick={() => abrirFicha(enHacienda.caravana)}
                        >
                          {b.caravana}
                        </button>
                      ) : (
                        <strong>{b.caravana}</strong>
                      )}
                    </td>
                    <td style={{ fontSize: 11 }}>{b.fecha}</td>
                    <td><Badge tone={CAUSA_TONE[b.causa] || "gris"} style={{ fontSize: 9 }}>{b.causa}</Badge></td>
                    <td style={{ fontSize: 11 }}>{b.categoria || "—"}</td>
                    <td className="txt-muted" style={{ fontSize: 11 }}>{b.obs || "—"}</td>
                    {puedeEditar && (
                      <td style={{ display: "flex", gap: 4 }}>
                        <button className="btn btn-ghost btn-sm" style={{ fontSize: 12, padding: "3px 8px" }} onClick={() => abrirEditar(b)}><Icono nombre="editar" size={14} /></button>
                        <button className="btn btn-rojo btn-sm" onClick={() => eliminar(b.id)}><Icono nombre="eliminar" size={14} /></button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {!rows.length && (
                <tr>
                  <td colSpan={puedeEditar ? 6 : 5} className="txt-muted" style={{ textAlign: "center", padding: 12 }}>
                    Sin bajas registradas para {anio}.
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
