import { useState, useEffect } from "react";
import { Icono } from "../components/Icon";
import { canAccessModule } from "../lib/permissions";
import { Hacienda } from "./Hacienda";
import { IATF } from "./IATF";
import { Prenez } from "./Prenez";
import { Pariciones } from "./Pariciones";
import { Sanidad } from "./Sanidad";
import { Botiquin } from "./Botiquin";
import { Bajas } from "./Bajas";

// "Rodeo" agrupa todo lo que gira en torno al animal — antes eran 7 pestañas
// propias (Hacienda, Servicios, Preñez, Partos, Sanidad, Botiquín, Bajas).
// Sub-navegación interna en vez de hash propio: coherente con que el manual
// de marca solo especifica 5 accesos de nivel raíz.
const SUBVISTAS = [
  { id: "hacienda", nombre: "hacienda", label: "Rodeo" },
  { id: "iatf", nombre: "servicios", label: "Servicios" },
  { id: "prenez", nombre: "prenez", label: "Preñez" },
  { id: "pariciones", nombre: "partos", label: "Partos" },
  { id: "sanidad", nombre: "sanidad", label: "Sanidad" },
  { id: "botiquin", nombre: "botiquin", label: "Botiquín" },
  { id: "bajas", nombre: "bajas", label: "Bajas" },
];

export function Rodeo({ animales, addAnimal, updateAnimal, removeAnimal, rol, user, abrirFicha, editarCaravana, onEditarConsumido, vistaInicial, onVistaConsumida }) {
  const disponibles = SUBVISTAS.filter((v) => canAccessModule(rol, v.id));
  const [vista, setVista] = useState(disponibles[0]?.id || "hacienda");

  useEffect(() => {
    if (vistaInicial && disponibles.some((v) => v.id === vistaInicial)) {
      setVista(vistaInicial);
      onVistaConsumida?.();
    }
    // eslint-disable-next-line
  }, [vistaInicial]);

  if (!disponibles.length) {
    return <div className="card txt-muted" style={{ padding: 16 }}>No tenés permiso para ver este módulo.</div>;
  }

  return (
    <div>
      <div className="tab-pills">
        {disponibles.map((v) => (
          <button key={v.id} className={`pill${vista === v.id ? " active" : ""}`} onClick={() => setVista(v.id)}>
            <span style={{ display: "inline-flex", verticalAlign: "middle", marginRight: 5 }}>
              <Icono nombre={v.nombre} size={14} />
            </span>
            {v.label}
          </button>
        ))}
      </div>

      {vista === "hacienda" && (
        <Hacienda
          animales={animales} addAnimal={addAnimal} updateAnimal={updateAnimal} removeAnimal={removeAnimal}
          rol={rol} abrirFicha={abrirFicha} editarCaravana={editarCaravana} onEditarConsumido={onEditarConsumido}
        />
      )}
      {vista === "iatf" && <IATF animales={animales} updateAnimal={updateAnimal} rol={rol} abrirFicha={abrirFicha} />}
      {vista === "prenez" && <Prenez animales={animales} rol={rol} abrirFicha={abrirFicha} />}
      {vista === "pariciones" && (
        <Pariciones animales={animales} addAnimal={addAnimal} removeAnimal={removeAnimal} updateAnimal={updateAnimal} rol={rol} abrirFicha={abrirFicha} user={user} />
      )}
      {vista === "sanidad" && <Sanidad animales={animales} updateAnimal={updateAnimal} rol={rol} abrirFicha={abrirFicha} user={user} />}
      {vista === "botiquin" && <Botiquin rol={rol} user={user} />}
      {vista === "bajas" && (
        <Bajas animales={animales} addAnimal={addAnimal} removeAnimal={removeAnimal} updateAnimal={updateAnimal} rol={rol} abrirFicha={abrirFicha} user={user} />
      )}
    </div>
  );
}
