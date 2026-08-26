import { useState } from "react";
import { Icono } from "../components/Icon";
import { canAccessModule, isAdmin } from "../lib/permissions";
import { ROLES_LABEL } from "../lib/constants";
import { Usuarios } from "./Usuarios";
import { Costos } from "./Costos";
import { Config } from "./Config";
import { Papelera } from "./Papelera";

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
