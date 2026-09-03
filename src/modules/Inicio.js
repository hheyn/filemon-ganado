import { useCollection } from "../hooks/useCollection";
import { Icono } from "../components/Icon";
import { today, daysBetween } from "../lib/dateUtils";
import { fechaReferenciaGestacion, fechaPartoEstimada } from "../lib/gestacion";

// "Inicio — dos cifras del rodeo, la alerta del día y tres cargas rápidas.
// Nada más." (manual de marca, sección 07). Los tableros más ricos que tenía
// la versión anterior del Dashboard (rodeo por lote, % de servicios, últimos
// partos, sanidad reciente) viven ahora en Reportes, que ya cubre ese
// terreno con más detalle y filtros por campaña/año.
export function Inicio({ animales, rol, abrirFicha, irA }) {
  const [iatfD] = useCollection("iatf");
  const [sanD] = useCollection("sanidad");
  const iatf = iatfD || [];
  const sanidad = sanD || [];

  const total = animales.length;
  const animalesPrenados = animales.filter((a) => a.estado === "Preñada");
  const prenadas = animalesPrenados.length;

  // (Antes había acá un cálculo aparte de "por nacer" a partir de registros
  // iatf ✅ — se sacó porque, bien hecho, da siempre el mismo número que
  // Preñadas: toda vaca preñada termina en un parto, no hay forma de que sea
  // otro valor. Mostrar el mismo dato dos veces con dos criterios distintos
  // fue justo lo que generó la confusión real de datos que motivó este
  // cambio — mejor un solo número que dos que puedan desalinearse.)
  const registroPrenezVigente = (caravana) => {
    const registros = iatf.filter((i) => i.caravana === caravana && i.resultado === "✅");
    return registros.sort((a, b) => (b.creadoEn?.seconds || 0) - (a.creadoEn?.seconds || 0))[0];
  };

  // Alerta del día: el hallazgo más urgente disponible con los datos que ya
  // tenemos — partos estimados dentro de 7 días, si hay; si no, ningún card.
  const hoy = today();
  const partosProximos = animalesPrenados
    .map((a) => registroPrenezVigente(a.caravana))
    .filter((i) => i && fechaReferenciaGestacion(i))
    .map((i) => ({ ...i, fechaEst: fechaPartoEstimada(i) }))
    .filter((i) => i.fechaEst && daysBetween(i.fechaEst, hoy) * -1 <= 7 && daysBetween(i.fechaEst, hoy) * -1 >= -3);

  const ultimaSanidad = [...sanidad].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""))[0];

  return (
    <div>
      <div className="grid2 mb">
        <div className="statbox">
          <div className="statbox-num">{total}</div>
          <div className="statbox-lbl">Cabezas</div>
        </div>
        <div className="statbox verde">
          <div className="statbox-num">{prenadas}</div>
          <div className="statbox-lbl">Preñadas</div>
        </div>
      </div>

      {partosProximos.length > 0 && (
        <div className="alert-box mb" onClick={() => irA("pariciones")} style={{ cursor: "pointer" }}>
          <span className="ic"><Icono nombre="advertencia" size={18} /></span>
          <div>
            <strong>{partosProximos.length} parto{partosProximos.length > 1 ? "s" : ""} estimado{partosProximos.length > 1 ? "s" : ""} esta semana.</strong>
            {" "}Car. {partosProximos.slice(0, 4).map((p) => p.caravana).join(", ")}
          </div>
        </div>
      )}

      {!partosProximos.length && ultimaSanidad && (
        <div className="card mb" style={{ padding: 12 }} onClick={() => irA("sanidad")}>
          <div className="t-auxiliar">Último registro de sanidad</div>
          <div style={{ fontWeight: 600 }}>{ultimaSanidad.producto} · {ultimaSanidad.lote}</div>
        </div>
      )}

      <div className="t-etiqueta mb" style={{ color: "rgba(21,21,15,.5)" }}>Cargar rápido</div>
      <div className="quick-actions">
        <button className="quick-action" onClick={() => irA("hacienda")}>
          <span className="ic"><Icono nombre="ajusteDeStock" size={26} /></span>
          Pesada
        </button>
        <button className="quick-action" onClick={() => irA("sanidad")}>
          <span className="ic"><Icono nombre="sanidad" size={26} /></span>
          Sanidad
        </button>
        <button className="quick-action" onClick={() => irA("pariciones")}>
          <span className="ic"><Icono nombre="partos" size={26} /></span>
          Parto
        </button>
      </div>
    </div>
  );
}
