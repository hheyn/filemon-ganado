import { useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { Icono } from "../components/Icon";
import { Field, Input, Button } from "../components/Field";
import { canAccessModule, isAdmin } from "../lib/permissions";
import { ROLES_LABEL } from "../lib/constants";
import { Usuarios } from "./Usuarios";
import { Costos } from "./Costos";
import { Config } from "./Config";
import { Papelera } from "./Papelera";

const ERROR_MSG = {
  "auth/wrong-password": "La contraseña actual no es correcta.",
  "auth/invalid-credential": "La contraseña actual no es correcta.",
  "auth/weak-password": "La contraseña nueva debe tener al menos 6 caracteres.",
  "auth/too-many-requests": "Demasiados intentos. Probá de nuevo en unos minutos.",
};

function CambiarPassword({ user }) {
  const [abierto, setAbierto] = useState(false);
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const limpiar = () => {
    setAbierto(false);
    setActual(""); setNueva(""); setRepetir("");
    setError(""); setOk(false);
  };

  const guardar = async () => {
    setError(""); setOk(false);
    if (nueva.length < 6) return setError("La contraseña nueva debe tener al menos 6 caracteres.");
    if (nueva !== repetir) return setError("Las contraseñas nuevas no coinciden.");
    setGuardando(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, actual);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, nueva);
      setOk(true);
      setActual(""); setNueva(""); setRepetir("");
    } catch (err) {
      setError(ERROR_MSG[err.code] || "No se pudo cambiar la contraseña. Intentá de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  if (!abierto) {
    return (
      <div className="card menu-list" style={{ padding: "4px 12px", marginBottom: 12 }}>
        <button className="menu-item" onClick={() => setAbierto(true)}>
          <span className="ic"><Icono nombre="config" size={20} /></span>
          Cambiar contraseña
          <span className="menu-arrow"><Icono nombre="pasoSiguiente" size={16} /></span>
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="t-titulo" style={{ marginBottom: 10 }}>Cambiar contraseña</div>
      {error && <div className="error-msg">{error}</div>}
      {ok && <div className="t-auxiliar mb" style={{ color: "var(--al-dia)" }}>Contraseña actualizada.</div>}
      <Field label="Contraseña actual">
        <Input type="password" value={actual} onChange={(e) => setActual(e.target.value)} autoComplete="current-password" />
      </Field>
      <Field label="Contraseña nueva">
        <Input type="password" value={nueva} onChange={(e) => setNueva(e.target.value)} autoComplete="new-password" />
      </Field>
      <Field label="Repetir contraseña nueva">
        <Input type="password" value={repetir} onChange={(e) => setRepetir(e.target.value)} autoComplete="new-password" />
      </Field>
      <div className="flex mt">
        <Button variant="verde" onClick={guardar} disabled={guardando || !actual || !nueva}>Guardar</Button>
        <Button variant="ghost" sm onClick={limpiar}>Cancelar</Button>
      </div>
    </div>
  );
}

const ITEMS = [
  { id: "usuarios", nombre: "usuarios", label: "Usuarios", modulo: "usuarios" },
  { id: "costos", nombre: "costos", label: "Costos", modulo: "costos" },
  { id: "papelera", nombre: "archivo", label: "Archivo", modulo: "papelera" },
  { id: "config", nombre: "config", label: "Configuración", modulo: "config" },
];

export function Cuenta({ rol, user, animales, logout }) {
  const [vista, setVista] = useState(null);
  const disponibles = ITEMS.filter((i) => canAccessModule(rol, i.modulo));

  if (vista) {
    const item = ITEMS.find((i) => i.id === vista);
    return (
      <div>
        <button className="btn btn-ghost btn-sm mb" onClick={() => setVista(null)}>
          <Icono nombre="pasoSiguiente" size={14} style={{ transform: "rotate(180deg)" }} /> Cuenta
        </button>
        {vista === "usuarios" && <Usuarios rol={rol} user={user} />}
        {vista === "costos" && <Costos rol={rol} user={user} />}
        {vista === "papelera" && <Papelera rol={rol} />}
        {vista === "config" && <Config animales={animales} rol={rol} />}
        {!isAdmin(rol) && item && (
          <div className="card txt-muted" style={{ padding: 16 }}>No tenés permiso para ver este módulo.</div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="section-hdr"><h2>Cuenta</h2></div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="t-titulo" style={{ marginBottom: 2 }}>{user?.email}</div>
        <div className="t-auxiliar">{ROLES_LABEL[rol] || rol}</div>
      </div>

      <CambiarPassword user={user} />

      {disponibles.length > 0 && (
        <div className="card menu-list" style={{ padding: "4px 12px" }}>
          {disponibles.map((i) => (
            <button key={i.id} className="menu-item" onClick={() => setVista(i.id)}>
              <span className="ic"><Icono nombre={i.nombre} size={20} /></span>
              {i.label}
              <span className="menu-arrow"><Icono nombre="pasoSiguiente" size={16} /></span>
            </button>
          ))}
        </div>
      )}

      <div className="card menu-list" style={{ padding: "4px 12px" }}>
        <button className="menu-item" onClick={logout} style={{ color: "var(--urgente)" }}>
          <span className="ic" style={{ color: "var(--urgente)" }}><Icono nombre="cerrar" size={20} /></span>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
