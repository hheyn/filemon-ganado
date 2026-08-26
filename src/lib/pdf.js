// Helpers compartidos de jsPDF/autotable — evita repetir el boilerplate de
// encabezado/pie de página en cada reporte (ver src/modules/Reportes.js).
//
// IMPORTANTE: la app legacy cargaba jsPDF como script global (`window.jspdf`),
// lo cual era frágil (dependía de que el script terminara de cargar antes de
// generar el PDF). Acá se usa el import npm real. jspdf-autotable ^3.8.4
// expone dos formas de uso: el efecto secundario que parchea
// `doc.autoTable(...)` en el prototipo de jsPDF, y la API funcional moderna
// `autoTable(doc, {...})` recomendada desde v3.5+. Se usa la funcional acá
// porque no depende de que el import-por-side-effect se ejecute antes que el
// import de `jsPDF` en el bundle (orden de módulos de webpack/CRA), y porque
// es la forma documentada como "preferida" por el propio paquete.
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDisplay, today } from "./dateUtils";
import { SELLO_PDF_BASE64 } from "../assets/selloPdfBase64";

// Paleta de marca en RGB (para doc.setFillColor/setTextColor, que no aceptan
// hex) — mismos valores que lib/constants.js `C`. (Antes tenía la paleta
// marrón/dorada vieja de la app original — quedó desactualizada cuando se
// aplicó el manual de marca real al resto de la app.)
export const PDF_COLORS = {
  verdeMonte: [30, 58, 43],
  verdeCampo: [62, 107, 74],
  tierra: [169, 82, 58],
  cuero: [138, 106, 70],
  tinta: [21, 21, 15],
  hueso: [248, 248, 241],
  urgente: [147, 55, 44],
  atencion: [192, 138, 30],
};

const RANCH_NAME = "Estancia Filemón";
const RANCH_FOOTER = "Estancia Filemón — Ayolas, Misiones, Py — Gestión Bovina";

// Dibuja el encabezado de marca en la página actual. Se llama una vez al
// crear el documento y de nuevo en cada página nueva vía `didDrawPage` de
// autoTable (igual que hacía el legacy `pdfHeader`).
function drawHeader(doc, title, subtitle) {
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(...PDF_COLORS.verdeMonte);
  doc.rect(0, 0, W, 18, "F");
  doc.setFillColor(...PDF_COLORS.tierra);
  doc.rect(0, 18, W, 0.8, "F");
  try {
    doc.addImage(SELLO_PDF_BASE64, "PNG", 6, 2.5, 13, 13);
  } catch {
    // Si por lo que sea el sello no carga, el reporte se genera igual sin él.
  }
  doc.setTextColor(...PDF_COLORS.hueso);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(RANCH_NAME, 22, 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.tierra);
  doc.text(title, 22, 14);
  if (subtitle) {
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.hueso);
    doc.text(subtitle, W - 12, 8, { align: "right" });
  }
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.hueso);
  doc.text(`Generado: ${formatDisplay(today())}`, W - 12, 14, { align: "right" });
}

// Pie de página con número de página — se llama en cada página del PDF final
// (recorriendo doc.internal.getNumberOfPages(), ya que la cantidad total
// solo se conoce después de que autoTable terminó de paginar todo).
export function addFooter(doc) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...PDF_COLORS.verdeMonte);
    doc.rect(0, H - 7, W, 7, "F");
    doc.setTextColor(...PDF_COLORS.tierra);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(RANCH_FOOTER, W / 2, H - 2.5, { align: "center" });
    doc.text(`Pág. ${i}/${pageCount}`, W - 12, H - 2.5, { align: "right" });
  }
}

// Crea un jsPDF configurado (A4 apaisado) con el encabezado de marca ya
// dibujado en la primera página. `title` = título del reporte, `subtitle` =
// texto opcional a la derecha del encabezado (ej. filtros activos).
// Devuelve { doc, drawHeader: (t, s) => drawHeader(doc, t, s) } para que cada
// reporte pueda volver a dibujar el encabezado en `didDrawPage` de autoTable
// (autoTable dibuja páginas nuevas automáticamente al paginar una tabla larga).
export function createDoc({ title, subtitle = "" }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  drawHeader(doc, title, subtitle);
  return {
    doc,
    header: (t = title, s = subtitle) => drawHeader(doc, t, s),
  };
}

// Re-exportado para que los reportes llamen `runAutoTable(doc, {...})` sin
// tener que importar `autoTable` por separado (mantiene un solo punto de
// verdad sobre la convención de llamada elegida).
export function runAutoTable(doc, options) {
  return autoTable(doc, options);
}

export function guardarPDF(doc, filename) {
  addFooter(doc);
  doc.save(filename);
}
