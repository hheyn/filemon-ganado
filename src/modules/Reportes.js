import { useState } from "react";
import { Icono } from "../components/Icon";
import { useCollection } from "../hooks/useCollection";
import { useYearFilter } from "../hooks/useYearFilter";
import { YearPills } from "../components/YearPills";
import { Field, Select, Button, Badge } from "../components/Field";
import { C, CATEGORIAS, LOTES, ESTADOS, UBICACIONES } from "../lib/constants";
import { today, addDays, daysBetween, formatDisplay } from "../lib/dateUtils";
import { fechaReferenciaGestacion, fechaPartoEstimada, rondaDe } from "../lib/gestacion";
import { createDoc, runAutoTable, guardarPDF, PDF_COLORS } from "../lib/pdf";

const TIPOS_REPORTE = [
  ["hacienda", "hacienda", "Hacienda"],
  ["iatf", "servicios", "Servicios IATF"],
  ["pariciones", "partos", "Pariciones"],
  ["seguimiento", "historial", "Seguimiento Partos"],
  ["preservicio", "servicios", "Pre-Servicio"],
];

// Dentro de una campaña de resultado ⏳/✅/❌, cuando un animal tiene varios
// registros `iatf` (uno por ronda: IATF-1, Resincro-TE, Repaso...), el
// "resultado de campaña" que mejor representa su situación es el mejor
// resultado logrado en cualquiera de sus rondas: preñada > pendiente > vacía.
function mejorRegistroCampania(records) {
  if (!records.length) return null;
  return records.find((r) => r.resultado === "✅") || records.find((r) => r.resultado === "⏳") || records[records.length - 1];
}

// Corta de gestación mínima (240 días desde la referencia) para no confundir
// un parto de esta campaña/ronda con uno de una campaña anterior. Usa la
// misma fecha de referencia ronda/TE-aware que la estimación de parto.
function fechaMinParto(iatfRecord, campaniaFallback) {
  const ref = fechaReferenciaGestacion(iatfRecord);
  if (ref) return addDays(ref, 240);
  const anio = parseInt(campaniaFallback || "2025", 10);
  return `${anio + 1}-03-01`;
}

export function Reportes({ animales, rol }) {
  const [iatf] = useCollection("iatf");
  const [pariciones] = useCollection("pariciones");
  const [sanidad] = useCollection("sanidad");
  const [bajas] = useCollection("bajas");

  const [tipoReporte, setTipoReporte] = useState("hacienda");
  const [generando, setGenerando] = useState(false);

  const iatfD = iatf || [];
  const parD = pariciones || [];
  const sanD = sanidad || [];
  const bajasD = bajas || [];

  // ── Hacienda ────────────────────────────────────────────────────────────
  const [filtCat, setFiltCat] = useState("Todas");
  const [filtLote, setFiltLote] = useState("Todos");
  const [filtEstado, setFiltEstado] = useState("Todos");
  const [filtUbic, setFiltUbic] = useState("Todas");

  const catsOpt = ["Todas", ...CATEGORIAS];
  const lotesOpt = ["Todos", ...LOTES];
  const estadosOpt = ["Todos", ...ESTADOS];
  const ubicsOpt = ["Todas", ...UBICACIONES];

  const datosHacienda = animales
    .filter((a) => {
      if (filtCat !== "Todas" && a.categoria !== filtCat) return false;
      if (filtLote !== "Todos" && a.lote !== filtLote) return false;
      if (filtEstado !== "Todos" && a.estado !== filtEstado) return false;
      if (filtUbic !== "Todas" && a.ubicacion !== filtUbic) return false;
      return true;
    })
    .sort((a, b) => (a.lote + a.categoria + a.caravana).localeCompare(b.lote + b.categoria + b.caravana));

  // ── Servicios IATF (campaña + ronda) ───────────────────────────────────
  const campsIatf = ["Todas", ...new Set(iatfD.map((i) => i.campania || "2025"))].sort((a, b) => b.localeCompare(a));
  const [filtCamp, setFiltCamp] = useState("Todas");
  const rondasIatf = [
    "Todas",
    ...new Set(iatfD.filter((i) => filtCamp === "Todas" || (i.campania || "2025") === filtCamp).map(rondaDe)),
  ];
  const [filtRondaIatf, setFiltRondaIatf] = useState("Todas");

  const datosIatf = iatfD
    .filter((i) => filtCamp === "Todas" || (i.campania || "2025") === filtCamp)
    .filter((i) => filtRondaIatf === "Todas" || rondaDe(i) === filtRondaIatf)
    .sort((a, b) => ((a.campania || "") + rondaDe(a) + (a.caravana || "")).localeCompare((b.campania || "") + rondaDe(b) + (b.caravana || "")));

  // ── Pariciones (año) ────────────────────────────────────────────────────
  const { anio: anioPar, setAnio: setAnioPar, anos: anosPar, filtered: datosPariciones } = useYearFilter(parD, "fecha");
  const datosParicionesOrdenadas = [...datosPariciones].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));

  // ── Seguimiento Partos (campaña + ronda, ronda/TE-aware) ───────────────
  const campsDisp = ["Todas", ...new Set(iatfD.map((i) => i.campania || "2025"))].sort((a, b) => b.localeCompare(a));
  const [filtSeguCamp, setFiltSeguCamp] = useState(campsDisp[1] || campsDisp[0] || "2025");
  const rondasSegu = [
    "Todas",
    ...new Set(iatfD.filter((i) => filtSeguCamp === "Todas" || (i.campania || "2025") === filtSeguCamp).map(rondaDe)),
  ];
  const [filtSeguRonda, setFiltSeguRonda] = useState("Todas");

  const datosSeguimiento = (() => {
    const prenadas = iatfD.filter(
      (i) =>
        i.resultado === "✅" &&
        (filtSeguCamp === "Todas" || (i.campania || "2025") === filtSeguCamp) &&
        (filtSeguRonda === "Todas" || rondaDe(i) === filtSeguRonda)
    );
    return prenadas
      .map((i) => {
        const fechaRef = fechaReferenciaGestacion(i);
        const fechaEst = fechaPartoEstimada(i);
        const minParto = fechaMinParto(i, i.campania);
        const parto = parD.find((p) => p.madreCaravana === i.caravana && p.fecha >= minParto);
        const animal = animales.find((a) => a.caravana === i.caravana);
        const diasRestantes = fechaEst ? daysBetween(fechaEst, today()) : null;
        let estado;
        if (parto) estado = "parió";
        else if (diasRestantes !== null && diasRestantes < 0) estado = "retraso";
        else estado = "pendiente";
        const esTE = i.tipoServicio === "TE";
        return {
          id: i.id,
          caravana: i.caravana,
          lote: i.lote || animal?.lote || "",
          ronda: rondaDe(i),
          tipoServicio: i.tipoServicio || "IATF",
          origenPreniez: i.origenPreniez || i.tipoServicio || "IATF",
          toro: i.toro || "",
          donante: i.donante || "",
          fechaRefLabel: esTE ? "F. Transferencia" : "Día 10",
          fechaRef,
          fechaEst,
          diasRestantes,
          estado,
          fechaParto: parto?.fecha || "",
          terneroCar: parto?.terneroCar || "",
          terneroSexo: parto?.terneroSexo || "",
          pesoNac: parto?.pesoNac || "",
        };
      })
      .sort((a, b) => {
        const ord = { retraso: 0, pendiente: 1, parió: 2 };
        if (ord[a.estado] !== ord[b.estado]) return ord[a.estado] - ord[b.estado];
        return (a.fechaEst || "").localeCompare(b.fechaEst || "");
      });
  })();
  const segParidas = datosSeguimiento.filter((s) => s.estado === "parió").length;
  const segPendiente = datosSeguimiento.filter((s) => s.estado === "pendiente").length;
  const segRetraso = datosSeguimiento.filter((s) => s.estado === "retraso").length;

  // ── Pre-Servicio (campaña) ──────────────────────────────────────────────
  const [filtPSCamp, setFiltPSCamp] = useState(campsDisp[1] || campsDisp[0] || "2025");
  const datosPreServicio = (() => {
    const vacasVaquillas = animales.filter((a) => ["Vaca", "Vaquilla"].includes(a.categoria));
    return vacasVaquillas
      .map((a) => {
        const registrosCamp = iatfD.filter((i) => i.caravana === a.caravana && (i.campania || "2025") === filtPSCamp);
        const regIatf = mejorRegistroCampania(registrosCamp);
        const tuvoRepaso = registrosCamp.some((r) => (r.origenPreniez || "") === "Repaso" || rondaDe(r).toLowerCase().includes("repaso"));
        let resultCamp = "—";
        let resultCampTone = "gris";
        if (regIatf) {
          if (regIatf.resultado === "✅") {
            resultCamp = tuvoRepaso ? "Repaso" : (regIatf.tipoServicio || "IATF");
            resultCampTone = "verde";
          } else if (regIatf.resultado === "⏳") {
            resultCamp = "Pendiente";
            resultCampTone = "paja";
          } else {
            resultCamp = "Vacía";
            resultCampTone = "rojo";
          }
        }
        const minParto = regIatf ? fechaMinParto(regIatf, filtPSCamp) : `${parseInt(filtPSCamp || "2025", 10) + 1}-03-01`;
        const parto = parD.find((p) => p.madreCaravana === a.caravana && p.fecha >= minParto);
        return {
          id: a.id,
          caravana: a.caravana,
          nombre: a.nombre || "",
          categoria: a.categoria,
          lote: a.lote || "",
          estado: a.estado || "",
          servicioAsignado: a.servicioAsignado || "",
          resultCamp,
          resultCampTone,
          toro: regIatf?.toro || "—",
          terneroCar: parto?.terneroCar || "",
          fechaParto: parto?.fecha || "",
        };
      })
      .sort((a, b) => (a.lote + a.caravana).localeCompare(b.lote + b.caravana));
  })();

  const resumenPreServicio = (() => {
    const vv = animales.filter((a) => ["Vaca", "Vaquilla"].includes(a.categoria));
    const porServicio = { IATF: 0, TE: 0, Repaso: 0, "Sin servicio": 0, "Sin asignar": 0 };
    vv.forEach((a) => {
      if (a.campaniaPrevista === filtPSCamp && a.servicioAsignado) {
        porServicio[a.servicioAsignado] = (porServicio[a.servicioAsignado] || 0) + 1;
      } else {
        porServicio["Sin asignar"]++;
      }
    });
    // Vínculo Sanidad↔Campaña es débil: `sanidad` no tiene campo `campania`
    // propio, así que se infiere por convención de texto en `obs` (ver
    // módulo Sanidad / Evento de Manejo, que escribe "Pre-servicio {campania}"
    // en obs al aplicar un evento de manejo pre-servicio). Si esa convención
    // cambia en Sanidad.js, este conteo deja de encontrar coincidencias — es
    // una limitación conocida, no un bug de este reporte.
    const sanPS = sanD.filter((s) => (s.obs || "").includes(`Pre-servicio ${filtPSCamp}`));
    const porProducto = {};
    sanPS.forEach((s) => {
      if (!porProducto[s.producto]) porProducto[s.producto] = { nombre: s.producto, tipo: s.tipo, animales: new Set() };
      if (s.caravana) porProducto[s.producto].animales.add(s.caravana);
      else if (s.lote) {
        animales.filter((a) => a.lote === s.lote && ["Vaca", "Vaquilla"].includes(a.categoria)).forEach((a) => porProducto[s.producto].animales.add(a.caravana));
      }
    });
    return { porServicio, porProducto, totalVV: vv.length };
  })();

  // ── PDF ──────────────────────────────────────────────────────────────────
  const descargarPDF = async () => {
    setGenerando(true);
    try {
      const HOY_FILE = today();
      const { verdeCampo: hierba, urgente: rojo, verdeMonte, hueso, tinta } = PDF_COLORS;
      const commonStyles = { font: "helvetica", fontSize: 7.5, cellPadding: 2, textColor: tinta, lineColor: hueso, lineWidth: 0.2 };
      const commonHead = { fillColor: verdeMonte, textColor: hueso, fontStyle: "bold", fontSize: 7.5 };
      const commonAlt = { fillColor: [251, 246, 236] };

      if (tipoReporte === "hacienda") {
        const filtDesc = [
          filtCat !== "Todas" ? `Cat:${filtCat}` : "",
          filtLote !== "Todos" ? `Lote:${filtLote}` : "",
          filtEstado !== "Todos" ? `Estado:${filtEstado}` : "",
          filtUbic !== "Todas" ? `Ubic:${filtUbic}` : "",
        ]
          .filter(Boolean)
          .join(" | ") || "Todos";
        const { doc, header } = createDoc({ title: "Reporte de Hacienda", subtitle: `${datosHacienda.length} animales — ${filtDesc}` });
        runAutoTable(doc, {
          head: [["Car.", "Nombre", "Categoría", "Lote", "Estado", "Ubicación", "Nacimiento", "Madre", "Padre", "Obs."]],
          body: datosHacienda.map((a) => [
            a.caravana || "", a.nombre || "—", a.categoria || "", a.lote || "", a.estado || "",
            a.ubicacion || "—", formatDisplay(a.fechaNac) || "—", a.madreCaravana || "—", a.padreCaravana || "—", (a.obs || "—").slice(0, 30),
          ]),
          startY: 24, margin: { left: 12, right: 12, bottom: 12 },
          styles: commonStyles, headStyles: commonHead, alternateRowStyles: commonAlt,
          didDrawPage: () => header(),
        });
        guardarPDF(doc, `Filemon_Hacienda_${HOY_FILE}.pdf`);
      } else if (tipoReporte === "iatf") {
        const aptas = datosIatf.filter((i) => i.apta === "Apta").length;
        const ins = datosIatf.filter((i) => i.protocolo === "Si" && i.apta === "Apta").length;
        const pren = datosIatf.filter((i) => i.resultado === "✅").length;
        const { doc, header } = createDoc({
          title: "Reporte de Servicios IATF",
          subtitle: `Camp: ${filtCamp} / Ronda: ${filtRondaIatf} — Aptas ${aptas} · Insem. ${ins} · Preñ. ${pren} · Tasa ${ins > 0 ? Math.round((pren / ins) * 100) : 0}%`,
        });
        runAutoTable(doc, {
          head: [["Campaña", "Ronda", "Car.", "Lote", "Tipo", "Toro/Donante", "Día 0", "Día 10", "F. Transf.", "Resultado", "Obs."]],
          body: datosIatf.map((i) => [
            i.campania || "2025", rondaDe(i), i.caravana || "", i.lote || "", i.tipoServicio || "IATF",
            i.tipoServicio === "TE" ? `${i.donante || "—"} / ${i.toro || "—"}` : i.toro || "—",
            formatDisplay(i.dia0) || "—", formatDisplay(i.dia10) || "—", formatDisplay(i.fechaTransferencia) || "—",
            i.resultado === "✅" ? "Preñada" : i.resultado === "⏳" ? "Pendiente" : "Vacía",
            (i.obs || "—").slice(0, 25),
          ]),
          startY: 24, margin: { left: 12, right: 12, bottom: 12 },
          styles: { ...commonStyles, fontSize: 7 }, headStyles: { ...commonHead, fontSize: 7 }, alternateRowStyles: commonAlt,
          didDrawPage: () => header(),
        });

        // Resumen final — cuántas vacas por categoría+tipo de servicio, y
        // cuántas pajuelas/servicios por toro (para calcular semen/pajuelas
        // a comprar antes de arrancar la campaña).
        const conteoCategoriaTipo = {};
        datosIatf.forEach((i) => {
          const categoria = animales.find((a) => a.caravana === i.caravana)?.categoria || "—";
          const key = `${categoria} · ${i.tipoServicio || "IATF"}`;
          conteoCategoriaTipo[key] = (conteoCategoriaTipo[key] || 0) + 1;
        });
        const conteoToro = {};
        datosIatf.forEach((i) => {
          const label = i.toro || "—";
          conteoToro[label] = (conteoToro[label] || 0) + 1;
        });
        runAutoTable(doc, {
          head: [["Resumen por categoría / tipo de servicio", "Cant."]],
          body: Object.entries(conteoCategoriaTipo).map(([k, v]) => [k, v]),
          startY: doc.lastAutoTable.finalY + 8,
          margin: { left: 12, right: 12, bottom: 12 }, tableWidth: 110,
          styles: commonStyles, headStyles: commonHead, alternateRowStyles: commonAlt,
          didDrawPage: () => header(),
        });
        runAutoTable(doc, {
          head: [["Resumen por toro / pajuela", "Cant."]],
          body: Object.entries(conteoToro).map(([k, v]) => [k, v]),
          startY: doc.lastAutoTable.finalY + 8,
          margin: { left: 12, right: 12, bottom: 12 }, tableWidth: 110,
          styles: commonStyles, headStyles: commonHead, alternateRowStyles: commonAlt,
          didDrawPage: () => header(),
        });
        guardarPDF(doc, `Filemon_IATF_${filtCamp}_${filtRondaIatf}_${HOY_FILE}.pdf`);
      } else if (tipoReporte === "pariciones") {
        const vivos = datosParicionesOrdenadas.filter((p) => p.estado !== "Baja").length;
        const { doc, header } = createDoc({
          title: "Reporte de Pariciones",
          subtitle: `${anioPar} — ${datosParicionesOrdenadas.length} registros — Vivos ${vivos} · Bajas ${datosParicionesOrdenadas.length - vivos}`,
        });
        runAutoTable(doc, {
          head: [["Fecha", "Madre Car.", "Tipo", "Ternero Car.", "Sexo", "Peso nac.", "Estado", "Obs."]],
          body: datosParicionesOrdenadas.map((p) => [
            formatDisplay(p.fecha) || "", p.madreCaravana || "", p.tipo || "", p.terneroCar || "—",
            p.terneroSexo === "H" ? "♀ Hembra" : "♂ Macho", p.pesoNac > 0 ? p.pesoNac + " kg" : "—", p.estado || "", (p.obs || "—").slice(0, 30),
          ]),
          startY: 24, margin: { left: 12, right: 12, bottom: 12 },
          styles: commonStyles, headStyles: commonHead, alternateRowStyles: commonAlt,
          didDrawPage: () => header(),
        });
        guardarPDF(doc, `Filemon_Pariciones_${anioPar}_${HOY_FILE}.pdf`);
      } else if (tipoReporte === "seguimiento") {
        const { doc, header } = createDoc({
          title: "Seguimiento de Partos",
          subtitle: `Camp: ${filtSeguCamp} / Ronda: ${filtSeguRonda} — Paridas ${segParidas} · Pend. ${segPendiente} · Retraso ${segRetraso}`,
        });
        runAutoTable(doc, {
          head: [["Car.", "Lote", "Ronda", "Tipo", "Toro/Donante", "Referencia", "Parto Est.", "Días", "Estado", "F. Parto", "Ternero", "Sexo", "Peso"]],
          body: datosSeguimiento.map((s) => [
            s.caravana, s.lote, s.ronda, s.tipoServicio,
            s.tipoServicio === "TE" ? `${s.donante || "—"} / ${s.toro || "—"}` : s.toro || "—",
            formatDisplay(s.fechaRef) || "—", formatDisplay(s.fechaEst) || "—",
            s.diasRestantes === null ? "—" : s.estado === "parió" ? "Parió" : s.diasRestantes < 0 ? `${Math.abs(s.diasRestantes)}d atraso` : s.diasRestantes === 0 ? "Hoy" : `${s.diasRestantes}d`,
            s.estado === "parió" ? "Parió" : s.estado === "retraso" ? "Retraso" : "Pendiente",
            formatDisplay(s.fechaParto) || "—", s.terneroCar || "—", s.terneroSexo === "H" ? "♀ Hembra" : s.terneroSexo === "M" ? "♂ Macho" : "—",
            s.pesoNac > 0 ? s.pesoNac + " kg" : "—",
          ]),
          startY: 24, margin: { left: 8, right: 8, bottom: 12 },
          styles: { ...commonStyles, fontSize: 6.5, cellPadding: 1.8 }, headStyles: { ...commonHead, fontSize: 7 }, alternateRowStyles: commonAlt,
          didDrawPage: () => header(),
          didParseCell: (data) => {
            if (data.section === "body") {
              const row = datosSeguimiento[data.row.index];
              if (row?.estado === "retraso") data.cell.styles.textColor = rojo;
              else if (row?.estado === "parió") data.cell.styles.textColor = hierba;
            }
          },
        });
        guardarPDF(doc, `Filemon_Seguimiento_${filtSeguCamp}_${filtSeguRonda}_${HOY_FILE}.pdf`);
      } else if (tipoReporte === "preservicio") {
        const { doc, header } = createDoc({ title: "Reporte Pre-Servicio", subtitle: `Campaña ref.: ${filtPSCamp} — ${datosPreServicio.length} animales` });
        const resServ = Object.entries(resumenPreServicio.porServicio).filter(([, v]) => v > 0).map(([k, v]) => `${k}: ${v}`).join(" | ");
        const resProd = Object.values(resumenPreServicio.porProducto).map((p) => `${p.nombre}: ${p.animales.size}`).join(" | ");
        doc.setTextColor(...PDF_COLORS.cuero);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(`Servicio asignado — ${resServ}`, 12, 23);
        if (resProd) doc.text(`Vacunas — ${resProd}`, 12, 28);
        runAutoTable(doc, {
          head: [["Car.", "Nombre", "Cat.", "Lote", `Servicio ${filtPSCamp}`, `Resultado ${filtPSCamp}`, "Toro", "Estado actual", "Ternero", "F. Parto"]],
          body: datosPreServicio.map((a) => [
            a.caravana, a.nombre || "—", a.categoria, a.lote, a.servicioAsignado || "—", a.resultCamp, a.toro, a.estado, a.terneroCar || "—", formatDisplay(a.fechaParto) || "—",
          ]),
          startY: resProd ? 32 : 27, margin: { left: 8, right: 8, bottom: 12 },
          styles: commonStyles, headStyles: { ...commonHead, fontSize: 7 }, alternateRowStyles: commonAlt,
          didDrawPage: () => header(),
          didParseCell: (data) => {
            if (data.section === "body") {
              const row = datosPreServicio[data.row.index];
              if (row?.estado === "Vacía") data.cell.styles.textColor = PDF_COLORS.cuero;
              else if (row?.estado === "Preñada") data.cell.styles.textColor = hierba;
            }
          },
        });
        guardarPDF(doc, `Filemon_PreServicio_${filtPSCamp}_${HOY_FILE}.pdf`);
      }
    } finally {
      setGenerando(false);
    }
  };

  const prenadas = animales.filter((a) => a.estado === "Preñada").length;
  const datosActuales =
    tipoReporte === "hacienda" ? datosHacienda :
    tipoReporte === "iatf" ? datosIatf :
    tipoReporte === "seguimiento" ? datosSeguimiento :
    tipoReporte === "preservicio" ? datosPreServicio :
    datosParicionesOrdenadas;

  return (
    <div>
      <div className="section-hdr"><h2><Icono nombre="reportes" size={20} /> Reportes</h2></div>

      <div className="card mb">
        <div className="card-title"><Icono nombre="reportes" size={16} /> Tipo de Reporte</div>
        <div className="tab-pills">
          {TIPOS_REPORTE.map(([id, icono, lbl]) => (
            <button key={id} className={`pill${tipoReporte === id ? " active" : ""}`} onClick={() => setTipoReporte(id)}><Icono nombre={icono} size={14} /> {lbl}</button>
          ))}
        </div>
      </div>

      {tipoReporte !== "seguimiento" && (
        <div className="grid4 mb">
          <div className="statbox"><div className="statbox-num">{animales.length}</div><div className="statbox-lbl">Total cabezas</div></div>
          <div className="statbox verde"><div className="statbox-num">{prenadas}</div><div className="statbox-lbl">Preñadas</div></div>
          <div className="statbox cielo"><div className="statbox-num">{animales.filter((a) => ["Vaca", "Vaquilla"].includes(a.categoria)).length}</div><div className="statbox-lbl">Vacas/Vaquillas</div></div>
          <div className="statbox paja"><div className="statbox-num">{parD.length}</div><div className="statbox-lbl">Partos reg.</div></div>
        </div>
      )}
      {tipoReporte === "seguimiento" && (
        <div className="grid4 mb">
          <div className="statbox"><div className="statbox-num">{datosSeguimiento.length}</div><div className="statbox-lbl">Total preñadas</div></div>
          <div className="statbox verde"><div className="statbox-num">{segParidas}</div><div className="statbox-lbl">Ya parieron</div></div>
          <div className="statbox paja"><div className="statbox-num">{segPendiente}</div><div className="statbox-lbl">Pendientes</div></div>
          <div className="statbox rojo"><div className="statbox-num">{segRetraso}</div><div className="statbox-lbl">Con retraso</div></div>
        </div>
      )}

      <div className="card mb">
        <div className="card-title"><Icono nombre="filtrar" size={16} /> Filtros</div>
        {tipoReporte === "hacienda" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 8, marginBottom: 8 }}>
            <Field label="Categoría"><Select options={catsOpt} value={filtCat} onChange={(e) => setFiltCat(e.target.value)} /></Field>
            <Field label="Lote"><Select options={lotesOpt} value={filtLote} onChange={(e) => setFiltLote(e.target.value)} /></Field>
            <Field label="Estado"><Select options={estadosOpt} value={filtEstado} onChange={(e) => setFiltEstado(e.target.value)} /></Field>
            <Field label="Ubicación"><Select options={ubicsOpt} value={filtUbic} onChange={(e) => setFiltUbic(e.target.value)} /></Field>
          </div>
        )}
        {tipoReporte === "iatf" && (
          <>
            <Field label="Campaña"><Select options={campsIatf} value={filtCamp} onChange={(e) => { setFiltCamp(e.target.value); setFiltRondaIatf("Todas"); }} /></Field>
            <div className="tab-pills mt">
              <span style={{ fontSize: 10, color: C.cuero, fontFamily: "'Roboto Slab',serif", padding: "5px 4px", whiteSpace: "nowrap" }}>Ronda:</span>
              {rondasIatf.map((r) => (
                <button key={r} className={`pill${filtRondaIatf === r ? " active" : ""}`} onClick={() => setFiltRondaIatf(r)}>{r}</button>
              ))}
            </div>
          </>
        )}
        {tipoReporte === "pariciones" && <YearPills anos={anosPar} anio={anioPar} setAnio={setAnioPar} />}
        {tipoReporte === "seguimiento" && (
          <>
            <Field label="Campaña IATF">
              <Select options={campsDisp} value={filtSeguCamp} onChange={(e) => { setFiltSeguCamp(e.target.value); setFiltSeguRonda("Todas"); }} />
            </Field>
            <div className="tab-pills mt">
              <span style={{ fontSize: 10, color: C.cuero, fontFamily: "'Roboto Slab',serif", padding: "5px 4px", whiteSpace: "nowrap" }}>Ronda:</span>
              {rondasSegu.map((r) => (
                <button key={r} className={`pill${filtSeguRonda === r ? " active" : ""}`} onClick={() => setFiltSeguRonda(r)}>{r}</button>
              ))}
            </div>
          </>
        )}
        {tipoReporte === "preservicio" && (
          <Field label="Campaña anterior">
            <Select options={campsDisp.filter((c) => c !== "Todas")} value={filtPSCamp} onChange={(e) => setFiltPSCamp(e.target.value)} />
          </Field>
        )}
        <div style={{ marginTop: 6, fontSize: 12, color: C.cuero, fontWeight: 600 }}>{datosActuales.length} registros encontrados</div>
      </div>

      <div className="card mb">
        <div className="card-title"><Icono nombre="exportar" size={16} /> Exportar PDF</div>
        <Button onClick={descargarPDF} disabled={generando}>
          {generando ? (<><Icono nombre="pendiente" size={14} /> Generando...</>) : (<><Icono nombre="exportar" size={14} /> Descargar PDF</>)}
        </Button>
      </div>

      <div className="card">
        <div className="card-title">Vista previa — {datosActuales.length} registros</div>

        {tipoReporte === "preservicio" && (
          <div className="grid2 mb">
            <div className="card" style={{ margin: 0 }}>
              <div className="card-title" style={{ fontSize: 13 }}><Icono nombre="servicios" size={14} /> Asignación de servicio {filtPSCamp}</div>
              {Object.entries(resumenPreServicio.porServicio).map(([tipo, cnt]) => (
                <div key={tipo} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${C.niebla}` }}>
                  <span style={{ fontSize: 12 }}>{tipo}</span>
                  <strong>{cnt}</strong>
                </div>
              ))}
              <div className="txt-muted mt">Total vacas/vaquillas: {resumenPreServicio.totalVV}</div>
            </div>
            <div className="card" style={{ margin: 0 }}>
              <div className="card-title" style={{ fontSize: 13 }}><Icono nombre="botiquin" size={14} /> Vacunas aplicadas (pre-servicio {filtPSCamp})</div>
              {Object.values(resumenPreServicio.porProducto).length === 0 && (
                <div className="txt-muted">Sin registros de Sanidad vinculados a "Pre-servicio {filtPSCamp}". La vinculación depende de que el Evento de Manejo escriba esa frase en Obs.</div>
              )}
              {Object.values(resumenPreServicio.porProducto).map((p) => (
                <div key={p.nombre} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${C.niebla}` }}>
                  <span style={{ fontSize: 12 }}>{p.nombre} <span className="txt-muted">({p.tipo})</span></span>
                  <strong>{p.animales.size}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="tbl-wrap">
          <table>
            {tipoReporte === "hacienda" && (
              <>
                <thead><tr><th>Car.</th><th>Nombre</th><th>Cat.</th><th>Lote</th><th>Estado</th><th>Ubicación</th><th>Nacimiento</th><th>Madre</th></tr></thead>
                <tbody>
                  {datosHacienda.map((a) => (
                    <tr key={a.id}>
                      <td><strong>{a.caravana}</strong></td>
                      <td>{a.nombre || "—"}</td>
                      <td style={{ fontSize: 11 }}>{a.categoria}</td>
                      <td><Badge tone="cielo">{a.lote}</Badge></td>
                      <td><Badge tone={a.estado === "Preñada" ? "paja" : a.estado === "Vacía" ? "gris" : a.estado === "Descarte" ? "rojo" : "verde"}>{a.estado}</Badge></td>
                      <td style={{ fontSize: 11 }}>{a.ubicacion || "—"}</td>
                      <td style={{ fontSize: 11 }}>{formatDisplay(a.fechaNac) || "—"}</td>
                      <td style={{ fontSize: 11 }}>{a.madreCaravana || "—"}</td>
                    </tr>
                  ))}
                  {!datosHacienda.length && <tr><td colSpan={8} className="txt-muted" style={{ textAlign: "center", padding: 12 }}>Sin registros.</td></tr>}
                </tbody>
              </>
            )}
            {tipoReporte === "iatf" && (
              <>
                <thead><tr><th>Camp.</th><th>Ronda</th><th>Car.</th><th>Lote</th><th>Tipo</th><th>Toro/Donante</th><th>Día 10</th><th>F. Transf.</th><th>Resultado</th></tr></thead>
                <tbody>
                  {datosIatf.map((i) => (
                    <tr key={i.id}>
                      <td><Badge tone="cielo">{i.campania || "2025"}</Badge></td>
                      <td><Badge tone="morado">{rondaDe(i)}</Badge></td>
                      <td><strong>{i.caravana}</strong></td>
                      <td>{i.lote}</td>
                      <td style={{ fontSize: 11 }}>{i.tipoServicio || "IATF"}</td>
                      <td style={{ fontSize: 11 }}>{i.tipoServicio === "TE" ? `${i.donante || "—"} / ${i.toro || "—"}` : i.toro || "—"}</td>
                      <td style={{ fontSize: 11 }}>{formatDisplay(i.dia10) || "—"}</td>
                      <td style={{ fontSize: 11 }}>{formatDisplay(i.fechaTransferencia) || "—"}</td>
                      <td><Badge tone={i.resultado === "✅" ? "verde" : i.resultado === "⏳" ? "paja" : "rojo"}>{i.resultado === "✅" ? "Preñada" : i.resultado === "⏳" ? "Pend." : "Vacía"}</Badge></td>
                    </tr>
                  ))}
                  {!datosIatf.length && <tr><td colSpan={9} className="txt-muted" style={{ textAlign: "center", padding: 12 }}>Sin registros.</td></tr>}
                </tbody>
              </>
            )}
            {tipoReporte === "pariciones" && (
              <>
                <thead><tr><th>Fecha</th><th>Madre</th><th>Tipo</th><th>Ternero</th><th>Sexo</th><th>Peso</th><th>Estado</th></tr></thead>
                <tbody>
                  {datosParicionesOrdenadas.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontSize: 11 }}>{formatDisplay(p.fecha)}</td>
                      <td><strong>{p.madreCaravana}</strong></td>
                      <td style={{ fontSize: 11 }}>{p.tipo}</td>
                      <td style={{ fontSize: 11 }}>{p.terneroCar || "—"}</td>
                      <td><Icono nombre={p.terneroSexo === "H" ? "hembra" : "macho"} size={14} /></td>
                      <td style={{ fontSize: 11 }}>{p.pesoNac > 0 ? p.pesoNac + " kg" : "—"}</td>
                      <td><Badge tone={p.estado === "Baja" ? "rojo" : "verde"}>{p.estado}</Badge></td>
                    </tr>
                  ))}
                  {!datosParicionesOrdenadas.length && <tr><td colSpan={7} className="txt-muted" style={{ textAlign: "center", padding: 12 }}>Sin registros.</td></tr>}
                </tbody>
              </>
            )}
            {tipoReporte === "preservicio" && (
              <>
                <thead><tr><th>Car.</th><th>Nombre</th><th>Cat.</th><th>Lote</th><th>Servicio {filtPSCamp}</th><th>Resultado {filtPSCamp}</th><th>Toro</th><th>Estado actual</th><th>Ternero</th></tr></thead>
                <tbody>
                  {datosPreServicio.map((a) => (
                    <tr key={a.id}>
                      <td><strong>{a.caravana}</strong></td>
                      <td style={{ fontSize: 11 }}>{a.nombre || "—"}</td>
                      <td style={{ fontSize: 11 }}>{a.categoria}</td>
                      <td><Badge tone="cielo">{a.lote}</Badge></td>
                      <td>{a.servicioAsignado ? <Badge tone={a.servicioAsignado === "IATF" ? "verde" : a.servicioAsignado === "TE" ? "paja" : a.servicioAsignado === "Sin servicio" ? "rojo" : "cielo"}>{a.servicioAsignado}</Badge> : <Badge tone="gris">—</Badge>}</td>
                      <td><Badge tone={a.resultCampTone}>{a.resultCamp}</Badge></td>
                      <td style={{ fontSize: 11 }}>{a.toro}</td>
                      <td><Badge tone={a.estado === "Preñada" ? "paja" : a.estado === "Vacía" ? "gris" : a.estado === "Descarte" ? "rojo" : "verde"}>{a.estado}</Badge></td>
                      <td style={{ fontSize: 11, fontWeight: a.terneroCar ? 700 : 400, color: a.terneroCar ? C.alDia : C.niebla }}>{a.terneroCar || "—"}</td>
                    </tr>
                  ))}
                  {!datosPreServicio.length && <tr><td colSpan={9} className="txt-muted" style={{ textAlign: "center", padding: 12 }}>Sin registros.</td></tr>}
                </tbody>
              </>
            )}
            {tipoReporte === "seguimiento" && (
              <>
                <thead>
                  <tr>
                    <th>Car.</th><th>Lote</th><th>Ronda</th><th>Tipo</th><th>Toro/Donante</th>
                    <th>Referencia</th><th>Parto Est.</th><th>Días</th><th>Estado</th><th>F. Parto</th><th>Ternero</th><th>Sexo</th><th>Peso</th>
                  </tr>
                </thead>
                <tbody>
                  {datosSeguimiento.map((s) => (
                    <tr key={s.id} style={{ background: s.estado === "retraso" ? "rgba(147,55,44,.06)" : s.estado === "parió" ? "rgba(76,122,63,.04)" : "" }}>
                      <td><strong>{s.caravana}</strong></td>
                      <td><Badge tone="cielo">{s.lote}</Badge></td>
                      <td><Badge tone="morado">{s.ronda}</Badge></td>
                      <td style={{ fontSize: 10 }}>{s.tipoServicio}</td>
                      <td style={{ fontSize: 11 }}>{s.tipoServicio === "TE" ? `${s.donante || "—"} / ${s.toro || "—"}` : s.toro || "—"}</td>
                      <td style={{ fontSize: 10 }}>{s.fechaRefLabel}: {formatDisplay(s.fechaRef) || "—"}</td>
                      <td style={{ fontSize: 11, fontWeight: 600 }}>{formatDisplay(s.fechaEst) || "—"}</td>
                      <td style={{ textAlign: "center", fontWeight: 700, fontSize: 12, color: s.diasRestantes === null ? C.niebla : s.diasRestantes < 30 ? C.urgente : s.diasRestantes < 60 ? C.atencion : C.alDia }}>
                        {s.diasRestantes === null ? "—" : s.estado === "parió" ? <Icono nombre="positivo" size={14} /> : s.diasRestantes < 0 ? `${Math.abs(s.diasRestantes)}d atraso` : s.diasRestantes === 0 ? "¡Hoy!" : s.diasRestantes === 1 ? "Mañana" : `${s.diasRestantes}d`}
                      </td>
                      <td>{s.estado === "parió" ? <Badge tone="verde"><Icono nombre="positivo" size={12} /> Parió</Badge> : s.estado === "retraso" ? <Badge tone="rojo"><Icono nombre="negativo" size={12} /> Retraso</Badge> : <Badge tone="paja"><Icono nombre="pendiente" size={12} /> Pendiente</Badge>}</td>
                      <td style={{ fontSize: 11 }}>{formatDisplay(s.fechaParto) || "—"}</td>
                      <td style={{ fontSize: 11 }}>{s.terneroCar || "—"}</td>
                      <td>{s.terneroSexo === "H" ? <Icono nombre="hembra" size={14} /> : s.terneroSexo === "M" ? <Icono nombre="macho" size={14} /> : "—"}</td>
                      <td style={{ fontSize: 11 }}>{s.pesoNac > 0 ? s.pesoNac + " kg" : "—"}</td>
                    </tr>
                  ))}
                  {!datosSeguimiento.length && <tr><td colSpan={13} className="txt-muted" style={{ textAlign: "center", padding: 12 }}>Sin preñadas para esta campaña/ronda.</td></tr>}
                </tbody>
              </>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
