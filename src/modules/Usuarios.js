import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useCollection } from "../hooks/useCollection";
import { Modal } from "../components/Modal";
import { Field, Input, Select, Button } from "../components/Field";
import { Icono } from "../components/Icon";
import { isAdmin } from "../lib/permissions";
import { ROLES, ROLES_LABEL, C } from "../lib/constants";
import { today } from "../lib/dateUtils";

const FIREBASE_CONSOLE_URL = "https://console.firebase.google.com/project/estancia-filemon/authentication/users";

const blank = { uid: "", email: "", nombre: "", rol: ROLES.VISOR, activo: true };

// `creadoEn` normalmente es un string "YYYY-MM-DD" (así lo escribe crear()
// más abajo), pero si el primer usuario Admin se crea a mano desde la
// Consola de Firebase (paso obligatorio de bootstrap, ver plan), es fácil
// que alguien elija sin querer el tipo de campo "timestamp" en el editor de
// la Consola — eso llega acá como un objeto Timestamp {seconds,nanoseconds},
// que React no puede renderizar directo y rompe toda la pantalla en blanco.
// Esta función lo soporta a todos los formatos posibles sin crashear.
function formatCreadoEn(v) {
  if (!v) return "—";
  if (typeof v === "string") return v;
  if (typeof v.toDate === "function") return v.toDate().toLocaleDateString("es-PY");
  if (typeof v.seconds === "number") return new Date(v.seconds * 1000).toLocaleDateString("es-PY");
  return "—";
}

// Usuarios: solo Admin. El SDK cliente de Firebase Auth no puede crear una
// cuenta nueva sin cerrar la sesión del Admin actual, así que el alta real
// se hace en dos pasos manuales: 1) crear la cuenta en Firebase Console,
// 2) volver acá y crear el doc `usuarios/{uid}` con el rol correspondiente.
export function Usuarios({ rol, user }) {
  // Hooks siempre antes de cualquier return condicional (ver misma corrección
  // en Costos.js) — evita "Rendered fewer hooks than expected" si el rol
  // cambia en caliente con esta pantalla abierta.
  const [usuarios, addUsuario, updateUsuario] = useCollection("usuarios");

  const [form, setForm] = useState(blank);
  const [showForm, setShowForm] = useState(false);

  if (!isAdmin(rol)) {
    return <div className="card txt-muted" style={{ padding: 16 }}>No tenés permiso para ver este módulo.</div>;
  }

  const cerrar = () => {
    setForm(blank);
    setShowForm(false);
  };

  const crear = async () => {
    const uid = form.uid.trim();
    if (!uid || !form.email) return;
    // Se usa setDoc con el uid como id de documento (no addUsuario, que
    // siempre genera un id automático) para que el doc de `usuarios`
    // coincida exactamente con el uid de Firebase Auth.
    await setDoc(doc(db, "usuarios", uid), {
      email: form.email.trim(),
      nombre: form.nombre.trim(),
      rol: form.rol,
      activo: !!form.activo,
      creadoEn: today(),
      creadoPor: user?.email || null,
    });
    cerrar();
  };

  return (
    <div>
      <div className="section-hdr">
        <h2><Icono nombre="usuarios" size={20} /> Usuarios</h2>
        <Button variant="prim" sm onClick={() => (showForm ? cerrar() : setShowForm(true))}>
          {showForm ? <Icono nombre="cerrar" size={16} /> : <Icono nombre="agregar" size={16} />}
        </Button>
      </div>

      <div className="card mb" style={{ padding: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: C.cuero }}>Cómo dar de alta un usuario nuevo</div>
        <ol style={{ fontSize: 12, color: C.cuero, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Abrí Firebase Console y creá la cuenta con email/contraseña en Authentication → Users.</li>
          <li>Copiá el <strong>UID</strong> generado para esa cuenta nueva.</li>
          <li>Volvé acá, tocá el botón de agregar y completá el UID, email, nombre y rol para crear su registro de acceso.</li>
        </ol>
        <a href={FIREBASE_CONSOLE_URL} target="_blank" rel="noreferrer">
          <Button variant="prim" sm>Abrir Firebase Console →</Button>
        </a>
      </div>

      {showForm && (
        <Modal onClose={cerrar} title={<><Icono nombre="usuarios" size={18} /> Nuevo usuario</>}>
          <div className="form-row">
            <Field label="UID (de Firebase Auth)">
              <Input value={form.uid} onChange={(e) => setForm({ ...form, uid: e.target.value })} placeholder="Pegar UID acá" />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Nombre">
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </Field>
            <Field label="Rol">
              <Select
                options={Object.values(ROLES).map((r) => ({ value: r, label: ROLES_LABEL[r] }))}
                value={form.rol}
                onChange={(e) => setForm({ ...form, rol: e.target.value })}
              />
            </Field>
          </div>
          <div className="field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} id="activo-nuevo" />
            <label htmlFor="activo-nuevo" style={{ marginBottom: 0 }}>Activo</label>
          </div>
          <div className="flex mt">
            <Button variant="verde" onClick={crear}><Icono nombre="guardar" size={16} /> Crear usuario</Button>
            <Button variant="ghost" sm onClick={cerrar}>Cancelar</Button>
          </div>
        </Modal>
      )}

      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Activo</th>
                <th>Creado</th>
              </tr>
            </thead>
            <tbody>
              {(usuarios || []).map((u) => (
                <tr key={u.id}>
                  <td style={{ fontSize: 12 }}>{u.email}</td>
                  <td style={{ fontSize: 12 }}>{u.nombre || "—"}</td>
                  <td>
                    <Select
                      options={Object.values(ROLES).map((r) => ({ value: r, label: ROLES_LABEL[r] }))}
                      value={u.rol}
                      onChange={(e) => updateUsuario(u.id, { rol: e.target.value })}
                      style={{ fontSize: 11 }}
                    />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <input type="checkbox" checked={!!u.activo} onChange={(e) => updateUsuario(u.id, { activo: e.target.checked })} />
                  </td>
                  <td className="txt-muted" style={{ fontSize: 11 }}>{formatCreadoEn(u.creadoEn)}</td>
                </tr>
              ))}
              {!(usuarios || []).length && (
                <tr>
                  <td colSpan={5} className="txt-muted" style={{ textAlign: "center", padding: 12 }}>
                    Sin usuarios registrados todavía.
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
