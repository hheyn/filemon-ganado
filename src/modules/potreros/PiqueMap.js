import { getRotacionActiva } from "../../lib/rotaciones";
import { daysBetween, today } from "../../lib/dateUtils";

// Vista general de piquetes como grilla de tiles clickeables (NO un mapa SVG
// geográfico: no tenemos las coordenadas/formas reales de cada piquete, y
// tampoco hacen falta para el valor de "de un vistazo" que se busca acá).
// Cada tile se colorea según ocupación/atraso, igual que la tabla de detalle.
export function PiqueMap({ piquetes, animales, rotaciones, onSelect }) {
  return (
    <div className="grid3 mb" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}>
      {piquetes.map((p) => {
        const animalesAhi = animales.filter((a) => a.ubicacion === p.id);
        const rot = getRotacionActiva(rotaciones, p.id);
        let tone = "gris"; // libre
        if (animalesAhi.length) {
          tone = "verde";
          if (!p.flexible && rot?.entrada) {
            const dias = daysBetween(rot.entrada, today()) * -1; // dias transcurridos
            const pct = dias / p.diasRotacion;
            if (pct >= 1.2) tone = "rojo";
            else if (pct >= 0.8) tone = "paja";
          }
        }
        return (
          <div
            key={p.id}
            className={`statbox ${tone}`}
            style={{ cursor: "pointer" }}
            onClick={() => onSelect(p.id)}
          >
            <div className="statbox-num">{p.nombre}</div>
            <div className="statbox-lbl">
              {p.ha ? `${p.ha}ha` : "s/ha fija"} · {animalesAhi.length} cab.
            </div>
          </div>
        );
      })}
    </div>
  );
}
