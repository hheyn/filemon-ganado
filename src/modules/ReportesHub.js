import { useState } from "react";
import { Icono } from "../components/Icon";
import { Reproduccion } from "./Reproduccion";
import { Reportes } from "./Reportes";

export function ReportesHub({ animales, rol, abrirFicha }) {
  const [vista, setVista] = useState("tablero");
  return (
    <div>
      <div className="tab-pills">
        <button className={`pill${vista === "tablero" ? " active" : ""}`} onClick={() => setVista("tablero")}><Icono nombre="prenez" size={14} /> Tablero reproductivo</button>
        <button className={`pill${vista === "planillas" ? " active" : ""}`} onClick={() => setVista("planillas")}><Icono nombre="exportar" size={14} /> Planillas PDF</button>
      </div>
      {vista === "tablero" ? <Reproduccion animales={animales} abrirFicha={abrirFicha} /> : <Reportes animales={animales} rol={rol} />}
    </div>
  );
}
