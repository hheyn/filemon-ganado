import { useState } from "react";
import { Icono } from "../components/Icon";
import { useCollection } from "../hooks/useCollection";
import { useYearFilter } from "../hooks/useYearFilter";
import { useSorter } from "../hooks/useSorter";
import { YearPills } from "../components/YearPills";
import { Modal } from "../components/Modal";
import { Field, Input, Select, Button, Badge } from "../components/Field";
import { canEdit } from "../lib/permissions";
import { today } from "../lib/dateUtils";

const TIPOS_PARTO = ["Normal", "Distócico", "Cesárea", "Gemelar", "Mortinato"];

const blank = {
  madreCaravana: "",
  fecha: today(),
  tipo: "Normal",
  terneroCar: "",
  terneroSexo: "H",
  pesoNac: "",
  estado: "OK",
  obs: "",
};

// Pariciones: registra partos y automatiza el alta del ternero en Hacienda +
// el cambio de estado de la madre. La eliminación es un soft-delete (queda
// para siempre en el historial, ver plan "Historial permanente") y sólo se
// ofrece, aparte, borrar de verdad al ternero de Hacienda (para corregir
// duplicados de carga, no relacionado con el historial de partos).
export function Pariciones({ animales, addAnimal, removeAnimal, updateAnimal, rol, abrirFicha, user }) {
  const [pariciones, addPar, updatePar, removePar] = useCollection("pariciones", { softDelete: true, user });
  const puedeEditar = canEdit(rol, "pariciones");

  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const { anio, setAnio, anos, filtered: parFiltradas } = useYearFilter(pariciones, "fecha");
  const { sortFn, toggleSort, icon, thStyle } = useSorter("fecha");
  const parRows = sortFn(parFiltradas);

  const cerrar = () => {
    setForm(blank);
    setEditId(null);
    setShowForm(false);
  };

  const guardar = async () => {
    if (!form.madreCaravana) return;
    if (editId) {
      await updatePar(editId, { ...form, pesoNac: +form.pesoNac || 0 });
      cerrar();
      return;
    }

    await addPar({ ...form, pesoNac: +form.pesoNac || 0 });

    // Auto-agregar ternero a Hacienda si tiene caravana y no es mortinato.
    if (form.tipo !== "Mortinato" && form.terneroCar && form.terneroCar.trim() !== "" && form.terneroCar !== "—") {
      const yaExiste = animales.find(
        (a) => a.caravana.trim().toLowerCase() === form.terneroCar.trim().toLowerCase()
      );
      if (!yaExiste) {
        const madre = animales.find((a) => a.caravana === form.madreCaravana);
        await addAnimal({
          caravana: form.terneroCar.trim(),
          nombre: "",
          categoria: form.terneroSexo === "H" ? "Ternera" : "Ternero",
          lote: "Cbo7",
          ubicacion: madre?.ubicacion || "",
          estado: "OK",
          toroPreñez: "",
          fechaNac: form.fecha,
          madreCaravana: form.madreCaravana,
          padreCaravana: madre?.toroPreñez || "",
          pesoInicial: form.pesoNac || "",
          obs: "Nació " + form.fecha,
        });
      }
    }

    // Auto-cambiar estado de la madre a "Vacía".
    const madre = animales.find((a) => a.caravana === form.madreCaravana);
    if (madre && (madre.estado === "Preñada" || madre.estado === "Pendiente")) {
      await updateAnimal(madre.id, { ...madre, estado: "Vacía" });
    }

    cerrar();
  };

  const abrirEditar = (p) => {
    setForm({ ...blank, ...p, pesoNac: p.pesoNac || "" });
    setEditId(p.id);
    setShowForm(true);
  };

  const eliminar = async (id) => {
    if (!window.confirm("¿Eliminar este parto? Quedará en el historial permanente (no se borra de verdad).")) return;
    const parto = pariciones.find((p) => p.id === id);
    await removePar(id);
    const ternero = animales.find(
      (a) =>
        (parto?.terneroCar && a.caravana === parto.terneroCar) ||
        (a.madreCaravana === parto?.madreCaravana && a.fechaNac === parto?.fecha)
    );
    if (ternero && window.confirm(`¿También eliminar al ternero Car. ${ternero.caravana} de Hacienda? (esto sí lo borra definitivamente, es para corregir una carga duplicada)`)) {
      await removeAnimal(ternero.id);
    }
  };

  const vivos = parFiltradas.filter((p) => p.estado !== "Baja").length;

  return (
    <div>
      <div className="section-hdr">
        <h2><Icono nombre="partos" size={18} /> Pariciones</h2>
        {puedeEditar && (
          <Button variant="prim" sm onClick={() => (showForm ? cerrar() : setShowForm(true))}>
            {showForm ? <Icono nombre="cerrar" size={16} /> : <Icono nombre="agregar" size={16} />}
          </Button>
        )}
      </div>
      <YearPills anos={anos} anio={anio} setAnio={setAnio} />
      <div className="grid3 mb">
        <div className="statbox" data-icon="🐣">
          <div className="statbox-num">{parFiltradas.length}</div>
          <div className="statbox-lbl">Total partos</div>
        </div>
        <div className="statbox verde" data-icon="✅">
          <div className="statbox-num">{vivos}</div>
          <div className="statbox-lbl">Terneros vivos</div>
        </div>
        <div className="statbox rojo" data-icon="💀">
          <div className="statbox-num">{parFiltradas.length - vivos}</div>
          <div className="statbox-lbl">Bajas neon.</div>
        </div>
      </div>

      {showForm && (
        <Modal onClose={cerrar} title={<><Icono nombre="partos" size={18} /> Registrar Parto</>}>
          <div className="form-row">
            <Field label="Madre car.">
              <Input value={form.madreCaravana} onChange={(e) => setForm({ ...form, madreCaravana: e.target.value })} />
            </Field>
            <Field label="Fecha">
              <Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Tipo">
              <Select options={TIPOS_PARTO} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} />
            </Field>
            <Field label="Ternero car.">
              <Input value={form.terneroCar} onChange={(e) => setForm({ ...form, terneroCar: e.target.value })} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Sexo">
              <Select
                options={[{ value: "H", label: "Hembra" }, { value: "M", label: "Macho" }]}
                value={form.terneroSexo}
                onChange={(e) => setForm({ ...form, terneroSexo: e.target.value })}
              />
            </Field>
            <Field label="Peso nac. kg">
              <Input type="number" value={form.pesoNac} onChange={(e) => setForm({ ...form, pesoNac: e.target.value })} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Estado ternero">
              <Select options={["OK", "Baja"]} value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} />
            </Field>
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
                <th style={thStyle("madreCaravana")} onClick={() => toggleSort("madreCaravana")}>Madre{icon("madreCaravana")}</th>
                <th style={thStyle("fecha")} onClick={() => toggleSort("fecha")}>Fecha{icon("fecha")}</th>
                <th>Tipo</th>
                <th style={thStyle("terneroSexo")} onClick={() => toggleSort("terneroSexo")}>Sex.{icon("terneroSexo")}</th>
                <th>Kg</th>
                <th>Ternero</th>
                <th style={thStyle("estado")} onClick={() => toggleSort("estado")}>Est.{icon("estado")}</th>
                {puedeEditar && <th></th>}
              </tr>
            </thead>
            <tbody>
              {parRows.map((p) => {
                const madre = animales.find((a) => a.caravana === p.madreCaravana);
                const ternero = animales.find((a) => a.madreCaravana === p.madreCaravana && a.fechaNac === p.fecha);
                return (
                  <tr key={p.id}>
                    <td>
                      {madre ? (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ padding: "2px 8px", fontWeight: 700, fontSize: 12 }}
                          onClick={() => abrirFicha(madre.caravana)}
                        >
                          {p.madreCaravana}
                        </button>
                      ) : (
                        <strong>{p.madreCaravana}</strong>
                      )}
                    </td>
                    <td style={{ fontSize: 11 }}>{p.fecha}</td>
                    <td>
                      <Badge tone={p.tipo === "Normal" ? "verde" : p.tipo === "Mortinato" ? "rojo" : "paja"} style={{ fontSize: 9 }}>
                        {p.tipo}
                      </Badge>
                    </td>
                    <td>{p.terneroSexo === "H" ? <Icono nombre="hembra" size={14} /> : <Icono nombre="macho" size={14} />}</td>
                    <td>{p.pesoNac > 0 ? p.pesoNac : <span className="txt-muted">—</span>}</td>
                    <td style={{ fontSize: 11, fontWeight: 600 }}>
                      {ternero ? (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ padding: "2px 6px", fontSize: 11, fontWeight: 700 }}
                          onClick={() => abrirFicha(ternero.caravana)}
                        >
                          <Icono nombre="hacienda" size={12} /> {ternero.caravana}
                        </button>
                      ) : p.terneroCar && p.terneroCar !== "—" && p.terneroCar.trim() !== "" ? (
                        <span><Icono nombre="hacienda" size={12} /> {p.terneroCar}</span>
                      ) : (
                        <span className="txt-muted">—</span>
                      )}
                    </td>
                    <td>
                      <Badge tone={p.estado === "Baja" ? "rojo" : "verde"} style={{ fontSize: 9 }}>{p.estado}</Badge>
                    </td>
                    {puedeEditar && (
                      <td style={{ display: "flex", gap: 4 }}>
                        <button className="btn btn-ghost btn-sm" style={{ fontSize: 12, padding: "3px 8px" }} onClick={() => abrirEditar(p)}><Icono nombre="editar" size={14} /></button>
                        <button className="btn btn-rojo btn-sm" onClick={() => eliminar(p.id)}><Icono nombre="eliminar" size={14} /></button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {!parRows.length && (
                <tr>
                  <td colSpan={puedeEditar ? 8 : 7} className="txt-muted" style={{ textAlign: "center", padding: 12 }}>
                    Sin partos registrados para {anio}.
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
