import { addDays, daysBetween, today } from "./dateUtils";
import { fechaReferenciaGestacion, rondaDe } from "./gestacion";

// Indicadores reproductivos de cría por campaña. Definiciones (acordadas con
// el establecimiento):
// - Vientre entorado: toda vaca/vaquilla que entró a cualquier servicio de la
//   campaña (IATF, TE o repaso con toro). Las que solo figuran como "no
//   realizado" en todas sus rondas no cuentan.
// - Preñez = vientres preñados / entorados. Una vaca que tuvo diagnóstico
//   positivo y después perdió la preñez (aborto/reabsorción) cuenta como
//   preñada: esa pérdida es una merma, no una preñez que nunca existió.
// - Parición = terneros nacidos vivos / entorados.
// - Destete = terneros destetados / entorados.
// - Mermas = (preñadas − destetados) / preñadas.
// - IEP = días entre partos consecutivos de una misma vaca.

export const METAS = {
  prenez: { min: 85, ideal: 90, texto: "Meta 85–90%" },
  paricion: { min: 80, ideal: 85, texto: "Meta 80–85%" },
  destete: { min: 75, ideal: 80, texto: "Meta 75–80%" },
  mermas: { ideal: 5, max: 8, texto: "Máximo 5–8%" },
  iep: { max: 365, texto: "Máximo 365 días" },
};

const PERDIDA_GESTACION = ["Aborto", "Reabsorción embrionaria"];

// Ventana en la que un parto se atribuye a una campaña: desde 240 días
// después del primer día 0 (prematuro extremo) hasta 420 (preñez de repaso
// tardío + gestación larga). Fuera de eso es de otra campaña.
const VENTANA_DESDE = 240;
const VENTANA_HASTA = 420;
const EDAD_DESTETE = 240; // ~8 meses: a partir de acá un ternero sin destete es dato faltante

export function estadoMeta(clave, valor) {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return null;
  const m = METAS[clave];
  if (clave === "mermas") return valor <= m.ideal ? "alDia" : valor <= m.max ? "atencion" : "urgente";
  if (clave === "iep") return valor <= m.max ? "alDia" : valor <= m.max + 30 ? "atencion" : "urgente";
  return valor >= m.min ? "alDia" : valor >= m.min - 10 ? "atencion" : "urgente";
}

const pct = (a, b) => (b > 0 ? Math.round((a / b) * 1000) / 10 : null);

export function listarCampanias(iatf) {
  return [...new Set((iatf || []).map((i) => i.campania || "2025"))].sort((a, b) => b.localeCompare(a));
}

// Inicio de campaña: primer día 0 cargado (o, si la campaña es de antes de
// cargar fechas, el comienzo de la temporada de servicio de ese año).
export function inicioCampania(iatf, campania) {
  const fechas = (iatf || []).filter((i) => (i.campania || "2025") === campania)
    .flatMap((i) => [i.dia0, i.dia10, i.fechaTransferencia]).filter(Boolean).sort();
  return fechas[0] || `${campania}-07-01`;
}

const origenDe = (r) => r.origenPreniez || (r.tipoServicio === "TE" ? "TE" : r.tipoServicio === "Repaso Toro" ? "Repaso" : "IATF");

function fechaClave(i) {
  if (i.tipoServicio === "TE") return i.fechaTransferencia || i.dia10 || i.dia0;
  if (i.tipoServicio === "Repaso Toro") return i.dia0;
  return i.dia10 || i.dia0;
}

export function calcularCampania({ campania, iatf, animales, pariciones, bajas, hoy = today() }) {
  const regs = (iatf || []).filter((i) => (i.campania || "2025") === campania);
  const porVaca = new Map();
  regs.forEach((i) => {
    if (!porVaca.has(i.caravana)) porVaca.set(i.caravana, []);
    porVaca.get(i.caravana).push(i);
  });

  const fichaDe = (car) =>
    (animales || []).find((a) => a.caravana === car) ||
    (bajas || []).find((b) => b.caravana === car && !b.eliminado) ||
    null;

  // Una vaca sin servicio realizado pero con preñez confirmada (preñó con el
  // toro de repaso) también estuvo entorada.
  const entoradas = [...porVaca.entries()]
    .filter(([, rs]) => rs.some((r) => r.protocolo !== "No" || r.resultado === "✅"))
    .map(([car]) => car);

  const fueConfirmada = (r) => r.resultado === "✅" || (r.resultado === "❌" && PERDIDA_GESTACION.includes(r.motivoVacia));
  const prenadas = entoradas.filter((c) => porVaca.get(c).some(fueConfirmada));
  const sinResultadoFinal = entoradas.filter((c) => {
    const rs = porVaca.get(c);
    if (rs.some(fueConfirmada)) return false;
    return rs.some((r) => r.protocolo !== "No" && r.resultado === "⏳");
  });

  // Por ronda, en orden cronológico.
  const rondas = [...new Set(regs.map(rondaDe))]
    .map((ronda) => {
      const rs = regs.filter((r) => rondaDe(r) === ronda);
      const servidas = rs.filter((r) => r.protocolo === "Si");
      const diagnosticadas = servidas.filter((r) => r.resultado !== "⏳");
      const pren = servidas.filter(fueConfirmada);
      const inicio = rs.map((r) => r.dia0).filter(Boolean).sort()[0] || "";
      return {
        ronda,
        tipo: rs[0]?.tipoServicio || "IATF",
        inicio,
        programadas: rs.filter((r) => r.protocolo !== "No").length,
        salieron: rs.filter((r) => r.protocolo === "No").length,
        servidas: servidas.length,
        pendientesServicio: rs.filter((r) => r.protocolo !== "No" && r.protocolo !== "Si").length,
        diagnosticadas: diagnosticadas.length,
        prenadas: pren.length,
        sinDiagnostico: servidas.length - diagnosticadas.length,
        tasa: pct(pren.length, diagnosticadas.length),
        porOrigen: pren.reduce((acc, r) => ({ ...acc, [origenDe(r)]: (acc[origenDe(r)] || 0) + 1 }), {}),
      };
    })
    .sort((a, b) => (a.inicio || "9").localeCompare(b.inicio || "9"));

  // Por categoría (vaca / vaquilla), según la ficha actual.
  const categorias = ["Vaca", "Vaquilla"].map((cat) => {
    const ent = entoradas.filter((c) => (fichaDe(c)?.categoria || "Vaca") === cat);
    const pr = ent.filter((c) => prenadas.includes(c));
    return { categoria: cat, entoradas: ent.length, prenadas: pr.length, tasa: pct(pr.length, ent.length) };
  }).filter((c) => c.entoradas > 0);

  // Preñadas según el método que las preñó (IATF / TE / repaso con toro).
  const porOrigen = {};
  prenadas.forEach((c) => {
    const r = porVaca.get(c).filter(fueConfirmada).sort((a, b) => (a.dia0 || "").localeCompare(b.dia0 || ""))[0];
    porOrigen[origenDe(r)] = (porOrigen[origenDe(r)] || 0) + 1;
  });

  // Partos atribuidos a la campaña: desde 240 días después de su inicio hasta
  // donde empieza la ventana de la campaña siguiente (las ventanas se tocan,
  // así ningún parto queda sin campaña ni cae en dos).
  const inicio = inicioCampania(iatf, campania);
  const siguiente = listarCampanias(iatf).filter((c) => c > campania).sort()[0];
  const ventanaDesde = addDays(inicio, VENTANA_DESDE);
  const ventanaHasta = siguiente ? addDays(inicioCampania(iatf, siguiente), VENTANA_DESDE - 1) : addDays(inicio, VENTANA_HASTA);
  const setEnt = new Set(entoradas);
  const partos = (pariciones || [])
    .filter((p) => !p.eliminado && setEnt.has(p.madreCaravana) && p.fecha >= ventanaDesde && p.fecha <= ventanaHasta)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  const partoPorMadre = new Map();
  partos.forEach((p) => { if (!partoPorMadre.has(p.madreCaravana)) partoPorMadre.set(p.madreCaravana, p); });
  const partosUnicos = [...partoPorMadre.values()];
  const nacidosVivos = partosUnicos.filter((p) => p.tipo !== "Mortinato");
  const mortinatos = partosUnicos.filter((p) => p.tipo === "Mortinato");

  const crias = nacidosVivos.map((p) => {
    const viva = (animales || []).find((a) => a.caravana === p.terneroCar);
    const baja = (bajas || []).find((b) => !b.eliminado && b.caravana === p.terneroCar);
    return { parto: p, ficha: viva || baja?.animalSnapshot || baja || null, muerta: !viva && (!!baja || p.estado === "Baja") };
  });
  const destetadas = crias.filter((c) => c.ficha?.fechaDestete);
  const muertesPredestete = crias.filter((c) => c.muerta && !c.ficha?.fechaDestete);

  const perdidasGestacion = entoradas.filter((c) => porVaca.get(c).some((r) => r.resultado === "❌" && PERDIDA_GESTACION.includes(r.motivoVacia)));
  const ventanaCerrada = hoy > ventanaHasta;
  const prenadasSinParto = ventanaCerrada
    ? prenadas.filter((c) => !partoPorMadre.has(c) && !perdidasGestacion.includes(c))
    : [];

  const destetePendiente = crias.filter((c) => !c.muerta && !c.ficha?.fechaDestete);
  const etapaParicion = hoy < ventanaDesde ? "futura" : ventanaCerrada ? "cerrada" : "en curso";
  // Hasta que no se desteta el primer ternero, el destete no es 0%: no empezó.
  const etapaDestete = !crias.length || !destetadas.length ? "futura" : destetePendiente.length ? "en curso" : "cerrada";

  const pesosDestete = destetadas.map((c) => +c.ficha.pesoDestete).filter((x) => x > 0);

  return {
    campania,
    inicio,
    entoradas,
    prenadas,
    sinResultadoFinal,
    prenez: pct(prenadas.length, entoradas.length),
    porOrigen,
    faltanParaMeta: Math.max(0, Math.ceil((METAS.prenez.min / 100) * entoradas.length) - prenadas.length),
    rondas,
    categorias,
    ventanaDesde,
    ventanaHasta,
    etapaParicion,
    nacidosVivos: nacidosVivos.length,
    mortinatos: mortinatos.length,
    paricion: etapaParicion === "futura" ? null : pct(nacidosVivos.length, entoradas.length),
    etapaDestete,
    destetados: destetadas.length,
    destete: etapaDestete === "futura" ? null : pct(destetadas.length, entoradas.length),
    pesoDestetePromedio: pesosDestete.length ? Math.round(pesosDestete.reduce((a, b) => a + b, 0) / pesosDestete.length) : null,
    perdidasGestacion: perdidasGestacion.length,
    prenadasSinParto: prenadasSinParto.length,
    muertesPredestete: muertesPredestete.length,
    mermas: etapaDestete === "cerrada" ? pct(prenadas.length - destetadas.length, prenadas.length) : null,
    mermasParciales: perdidasGestacion.length + prenadasSinParto.length + mortinatos.length + muertesPredestete.length,
  };
}

// Calendario de la campaña a partir de las fechas cargadas en cada ronda.
export function hitosCampania({ campania, iatf, hoy = today() }) {
  const regs = (iatf || []).filter((i) => (i.campania || "2025") === campania && i.protocolo !== "No");
  const hitos = [];
  const agregar = (fecha, titulo, ronda, n) => { if (fecha) hitos.push({ fecha, titulo, ronda, n }); };
  [...new Set(regs.map(rondaDe))].forEach((ronda) => {
    const rs = regs.filter((r) => rondaDe(r) === ronda);
    const tipo = rs[0]?.tipoServicio || "IATF";
    const primera = (campo) => rs.map((r) => r[campo]).filter(Boolean).sort()[0];
    const n = rs.length;
    if (tipo === "Repaso Toro") {
      agregar(primera("dia0"), "Entrada al toro", ronda, n);
      return;
    }
    agregar(primera("dia0"), tipo === "TE" ? "Día 0 · sincronización receptoras" : "Día 0 · dispositivo", ronda, n);
    agregar(primera("dia8"), "Retiro de dispositivo + eCG", ronda, n);
    const clave = tipo === "TE" ? primera("fechaTransferencia") : primera("dia10");
    agregar(clave, tipo === "TE" ? "Transferencia de embriones" : "Inseminación", ronda, n);
    // Fecha de ecografía fijada por el veterinario; si no hay, ~30 días post servicio.
    const eco = primera("fechaEcografiaPrevista") || (clave ? addDays(clave, 30) : "");
    agregar(eco, "Ecografía (diagnóstico)", ronda, n);
  });
  hitos.sort((a, b) => a.fecha.localeCompare(b.fecha));
  return hitos.map((h) => ({ ...h, dias: daysBetween(h.fecha, hoy) }));
}

// Lo que falta cargar para que los indicadores sean exactos.
export function datosFaltantes({ campania, iatf, animales, pariciones, hoy = today() }) {
  const regs = (iatf || []).filter((i) => (i.campania || "2025") === campania);
  const servicioSinMarcar = regs.filter((r) => r.apta === "Apta" && r.protocolo !== "Si" && r.protocolo !== "No" && fechaClave(r) && fechaClave(r) < hoy);
  const diagnosticoAtrasado = regs.filter((r) => r.protocolo === "Si" && r.resultado === "⏳" && r.tipoServicio !== "Repaso Toro" && fechaClave(r) && daysBetween(hoy, fechaClave(r)) > 35);
  const crias = (animales || []).filter((a) => ["Ternero", "Ternera"].includes(a.categoria));
  const sinDestete = crias.filter((a) => a.fechaNac && !a.fechaDestete && daysBetween(hoy, a.fechaNac) >= EDAD_DESTETE);
  const partosSinPeso = (pariciones || []).filter((p) => !p.eliminado && p.tipo !== "Mortinato" && !(+p.pesoNac > 0) && p.fecha >= addDays(hoy, -365));
  const partoAtrasado = (animales || []).filter((a) => {
    if (a.estado !== "Preñada") return false;
    const r = (iatf || []).filter((i) => i.caravana === a.caravana && i.resultado === "✅").sort((x, y) => (fechaReferenciaGestacion(y) || "").localeCompare(fechaReferenciaGestacion(x) || ""))[0];
    const ref = r && fechaReferenciaGestacion(r);
    return ref && daysBetween(hoy, ref) > 283 + 20;
  });
  return [
    { clave: "servicio", titulo: "Servicios ya pasados sin marcar si se hicieron", accion: "Servicios → Servicio realizado", cars: servicioSinMarcar.map((r) => r.caravana) },
    { clave: "diagnostico", titulo: "Vacas servidas hace más de 35 días sin diagnóstico", accion: "Servicios → Diagnóstico", cars: diagnosticoAtrasado.map((r) => r.caravana) },
    { clave: "parto", titulo: "Preñadas que ya pasaron su fecha de parto sin parto cargado", accion: "Partos → cargar el parto", cars: partoAtrasado.map((a) => a.caravana) },
    { clave: "pesoNac", titulo: "Partos del último año sin peso al nacer", accion: "Partos → editar el parto", cars: partosSinPeso.map((p) => p.terneroCar || `cría de ${p.madreCaravana}`) },
    { clave: "destete", titulo: "Terneros de 8 meses o más sin destete registrado", accion: "Partos → Destete", cars: sinDestete.map((a) => a.caravana) },
  ].filter((f) => f.cars.length);
}

// Intervalo entre partos, sobre todos los partos registrados.
export function calcularIEP({ pariciones, animales }) {
  const porMadre = new Map();
  (pariciones || []).filter((p) => !p.eliminado && p.fecha).forEach((p) => {
    if (!porMadre.has(p.madreCaravana)) porMadre.set(p.madreCaravana, []);
    porMadre.get(p.madreCaravana).push(p.fecha);
  });
  const vacas = [];
  porMadre.forEach((fechas, car) => {
    const f = [...new Set(fechas)].sort();
    if (f.length < 2) return;
    const ultimo = daysBetween(f[f.length - 1], f[f.length - 2]);
    const todos = f.slice(1).map((x, i) => daysBetween(x, f[i]));
    vacas.push({ caravana: car, ultimo, promedio: Math.round(todos.reduce((a, b) => a + b, 0) / todos.length), partos: f.length, enRodeo: (animales || []).some((a) => a.caravana === car) });
  });
  vacas.sort((a, b) => b.ultimo - a.ultimo);
  const valores = vacas.map((v) => v.ultimo);
  const promedio = valores.length ? Math.round(valores.reduce((a, b) => a + b, 0) / valores.length) : null;
  const tramos = [
    { label: "Hasta 365 días", desde: 0, hasta: 365 },
    { label: "366 a 395", desde: 366, hasta: 395 },
    { label: "396 a 425", desde: 396, hasta: 425 },
    { label: "Más de 425", desde: 426, hasta: Infinity },
  ].map((t) => ({ ...t, n: valores.filter((v) => v >= t.desde && v <= t.hasta).length }));
  const conPartoSolo = [...porMadre.values()].filter((f) => new Set(f).size === 1).length;
  return { vacas, promedio, tramos, conUnSoloParto: conPartoSolo, cumplen: pct(valores.filter((v) => v <= 365).length, valores.length) };
}
