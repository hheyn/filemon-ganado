import { useState, useMemo } from "react";
import { useCollection } from "../hooks/useCollection";
import { Icono } from "../components/Icon";
import { formatDisplay, parseLocalDate } from "../lib/dateUtils";
import { METAS, estadoMeta, listarCampanias, calcularCampania, hitosCampania, datosFaltantes, calcularIEP } from "../lib/indicadores";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const mesAnio = (f) => { const d = parseLocalDate(f); return d ? `${MESES[d.getMonth()]} ${d.getFullYear()}` : ""; };
const conDia = (f) => { const d = parseLocalDate(f); return d ? `${DIAS[d.getDay()]} ${formatDisplay(f).slice(0, 5)}` : ""; };
const fmt = (v) => (v === null || v === undefined ? "—" : String(v).replace(".", ","));

const ESTADOS = {
  alDia: { icono: "positivo", texto: "En meta" },
  atencion: { icono: "advertencia", texto: "Cerca de la meta" },
  urgente: { icono: "negativo", texto: "Lejos de la meta" },
};

function Estado({ estado, pendiente }) {
  if (!estado) return <span className="tb-estado pend"><Icono nombre="pendiente" size={12} /> {pendiente || "Pendiente"}</span>;
  const e = ESTADOS[estado];
  return <span className={`tb-estado ${estado}`}><Icono nombre={e.icono} size={12} /> {e.texto}</span>;
}

// Barra de 0–100% con la meta como banda (mínimo→ideal) y una marca en el mínimo.
function Medidor({ valor, meta, fino, titulo }) {
  return (
    <div className={`tb-track${fino ? " fino" : ""}`} title={titulo} role="img" aria-label={titulo}>
      {meta && <div className="tb-banda" style={{ left: `${meta.min}%`, width: `${(meta.ideal || meta.min) - meta.min}%` }} />}
      <div className="tb-fill" style={{ width: `${Math.max(0, Math.min(100, valor || 0))}%` }} />
      {meta && <div className="tb-tick" style={{ left: `calc(${meta.min}% - 1px)` }} />}
    </div>
  );
}

function Fila({ nombre, detalle, valor, valorDetalle, porcentaje, meta, titulo }) {
  return (
    <div className="tb-fila">
      <div className="tb-fila-nom">{nombre}{detalle && <span>{detalle}</span>}</div>
      <Medidor valor={porcentaje} meta={meta} fino titulo={titulo || `${nombre}: ${valor}`} />
      <div className="tb-fila-val">{valor}{valorDetalle && <span>{valorDetalle}</span>}</div>
    </div>
  );
}

function Chips({ cars, abrirFicha, max = 30 }) {
  return (
    <div>
      {cars.slice(0, max).map((c, i) => (
        <button key={`${c}-${i}`} className="tb-chip" onClick={() => abrirFicha?.(c)}>{c}</button>
      ))}
      {cars.length > max && <span className="tb-meta"> y {cars.length - max} más</span>}
    </div>
  );
}

export function Reproduccion({ animales, abrirFicha, campaniaInicial }) {
  const [iatfD] = useCollection("iatf");
  const [parD] = useCollection("pariciones", { softDelete: true });
  const [bajasD] = useCollection("bajas", { softDelete: true });
  const iatf = iatfD || [];
  const campanias = listarCampanias(iatf);
  const [elegida, setElegida] = useState(campaniaInicial || null);
  const campania = elegida || campanias[0];

  const datos = useMemo(() => {
    if (!campania || !iatfD || !parD || !bajasD) return null;
    const base = { iatf, animales, pariciones: parD, bajas: bajasD };
    const anterior = campanias[campanias.indexOf(campania) + 1];
    return {
      c: calcularCampania({ campania, ...base }),
      prev: anterior ? calcularCampania({ campania: anterior, ...base }) : null,
      hitos: hitosCampania({ campania, iatf }),
      faltan: datosFaltantes({ campania, ...base }),
      iep: calcularIEP(base),
    };
  }, [campania, iatfD, parD, bajasD, animales]);

  if (!campanias.length) return <div className="tb-card tb-vacio">Todavía no hay servicios cargados para calcular indicadores.</div>;
  if (!datos) return <div className="tb-card tb-vacio">Cargando indicadores…</div>;

  const { c, prev, hitos, faltan, iep } = datos;
  const ent = c.entoradas.length;
  const pren = c.prenadas.length;
  const delta = prev && prev.prenez !== null && c.prenez !== null && !c.sinResultadoFinal.length ? Math.round((c.prenez - prev.prenez) * 10) / 10 : null;
  const proximo = hitos.find((h) => h.dias >= 0);
  const cuenta = proximo ? (proximo.dias === 0 ? "Hoy" : proximo.dias === 1 ? "Mañana" : proximo.dias) : null;
  const prenadasSobreDiag = ent - c.sinResultadoFinal.length;
  // Mientras ninguna vaca tiene resultado, la preñez no es 0%: todavía no existe.
  const sinDatosPrenez = ent > 0 && prenadasSobreDiag === 0;
  const prenezMostrada = sinDatosPrenez ? null : c.prenez;
  const proximaEco = hitos.find((h) => h.dias >= 0 && h.titulo.startsWith("Ecografía"));

  const etapa = {
    paricion: c.etapaParicion === "futura" ? `Se mide desde ${mesAnio(c.ventanaDesde)}` : c.etapaParicion === "en curso" ? `Partos en curso hasta ${mesAnio(c.ventanaHasta)}` : "Campaña cerrada",
    destete: c.etapaDestete === "futura" ? "Se mide al destetar (mar–abr)" : c.etapaDestete === "en curso" ? `${c.destetados} de ${c.nacidosVivos} terneros destetados` : "Destete completo",
  };

  return (
    <div>
      <div className="section-hdr">
        <h2><Icono nombre="prenez" size={20} /> Tablero reproductivo</h2>
        <div className="tab-pills" style={{ marginBottom: 0 }}>
          {campanias.map((k) => (
            <button key={k} className={`pill${k === campania ? " active" : ""}`} onClick={() => setElegida(k)}>Campaña {k}</button>
          ))}
        </div>
      </div>

      <div className="tb-hero">
        <div className="tb-card" style={{ marginBottom: 0 }}>
          <div className="flex" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
            <div className="tb-lbl">Preñez · campaña {campania}</div>
            <Estado estado={c.sinResultadoFinal.length === ent ? null : estadoMeta("prenez", c.prenez)} pendiente="Esperando ecografías" />
          </div>
          {sinDatosPrenez ? (
            <>
              <div className="tb-hero-num" style={{ marginTop: 8 }}>{ent}<small style={{ fontSize: 18 }}> vientres en servicio</small></div>
              <Medidor valor={0} meta={METAS.prenez} titulo={`Sin diagnósticos todavía — ${METAS.prenez.texto}`} />
              <div className="tb-escala"><span>0%</span><span>{METAS.prenez.texto}</span><span>100%</span></div>
              <p className="tb-frase">
                El primer porcentaje de preñez aparece con la ecografía
                {proximaEco ? <> del <strong>{conDia(proximaEco.fecha)}</strong> ({proximaEco.ronda}, {proximaEco.n} vacas)</> : null}.
                Para llegar al 85% hacen falta <strong>{Math.ceil(ent * 0.85)} preñadas</strong>.
              </p>
            </>
          ) : (
          <>
          <div className="tb-hero-num" style={{ marginTop: 8 }}>{fmt(c.prenez ?? 0)}<small>%</small></div>
          <Medidor valor={c.prenez} meta={METAS.prenez} titulo={`Preñez ${fmt(c.prenez)}% — ${METAS.prenez.texto}`} />
          <div className="tb-escala"><span>0%</span><span>{METAS.prenez.texto}</span><span>100%</span></div>
          <p className="tb-frase">
            <strong>{pren} de {ent}</strong> vientres entorados quedaron preñados.{" "}
            {c.faltanParaMeta > 0
              ? <>Para llegar al 85% faltan <strong>{c.faltanParaMeta} preñeces</strong>.</>
              : ent > 0 && <>Superaron la meta del 85%.</>}
            {delta !== null && <> Son <strong>{delta >= 0 ? "+" : ""}{fmt(delta)} puntos</strong> respecto a la campaña {prev.campania}.</>}
          </p>
          </>
          )}
          {!sinDatosPrenez && c.sinResultadoFinal.length > 0 && (
            <p className="tb-meta" style={{ marginTop: 8 }}>
              <Icono nombre="pendiente" size={12} /> {c.sinResultadoFinal.length} vacas todavía no tienen resultado final: el número sube a medida que cargues las ecografías.
              {prenadasSobreDiag > 0 && <> Entre las que ya tienen resultado, preñó el {fmt(Math.round((pren / prenadasSobreDiag) * 1000) / 10)}%.</>}
            </p>
          )}
        </div>

        <div className="tb-hito">
          <span className="acento" />
          {proximo ? (
            <>
              <div className="tb-lbl" style={{ color: "rgba(248,248,241,.7)" }}>Próximo paso</div>
              <div className="cuenta">{cuenta}{typeof cuenta === "number" && <small>{cuenta === 1 ? "día" : "días"}</small>}</div>
              <div className="que">{proximo.titulo}</div>
              <div className="detalle">{proximo.ronda} · {proximo.n} vacas · {conDia(proximo.fecha)}</div>
            </>
          ) : (
            <>
              <div className="tb-lbl" style={{ color: "rgba(248,248,241,.7)" }}>Calendario</div>
              <div className="que">No quedan pasos de protocolo cargados para esta campaña.</div>
            </>
          )}
          {hitos.length > 0 && (
            <ul className="tb-linea">
              {hitos.map((h, i) => (
                <li key={i} className={h.dias < 0 ? "hecho" : ""}>
                  <span className="f">{formatDisplay(h.fecha).slice(0, 5)}</span>
                  <span>{h.titulo} · {h.ronda}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="tb-kpis">
        {[
          { lbl: "Parición", clave: "paricion", valor: c.paricion, sufijo: "%", nota: etapa.paricion, extra: c.nacidosVivos ? `${c.nacidosVivos} terneros vivos de ${ent}` : null },
          { lbl: "Destete", clave: "destete", valor: c.destete, sufijo: "%", nota: etapa.destete, extra: c.pesoDestetePromedio ? `Peso promedio ${c.pesoDestetePromedio} kg` : null },
          {
            lbl: "Mermas", clave: "mermas", valor: c.mermas, sufijo: "%",
            nota: c.mermas !== null ? `${pren - c.destetados} preñeces sin ternero destetado` : "Se cierra con el destete",
            extra: c.mermasParciales ? `${c.mermasParciales} pérdidas registradas hasta hoy` : null,
          },
          { lbl: "Intervalo entre partos", clave: "iep", valor: iep.promedio, sufijo: " días", nota: iep.vacas.length ? `Sobre ${iep.vacas.length} vacas con 2 o más partos` : "Falta un segundo parto registrado", extra: iep.vacas.length ? `${iep.cumplen ?? 0}% de las vacas cumple` : null },
        ].map((k) => (
          <div key={k.lbl} className="tb-card" style={{ marginBottom: 0 }}>
            <div className="tb-lbl">{k.lbl}</div>
            <div className="tb-num" style={{ margin: "6px 0" }}>{k.valor === null || k.valor === undefined ? "—" : <>{fmt(k.valor)}<span style={{ fontSize: 15, fontWeight: 500 }}>{k.sufijo}</span></>}</div>
            <Estado estado={estadoMeta(k.clave, k.valor)} />
            <div className="tb-meta" style={{ marginTop: 8 }}>{METAS[k.clave].texto}</div>
            <div className="tb-meta">{k.nota}</div>
            {k.extra && <div className="tb-meta">{k.extra}</div>}
          </div>
        ))}
      </div>

      <div className="tb-card">
        <div className="tb-titulo">De la entorada al destete</div>
        <div className="tb-sub">Cada barra es sobre el total de vientres entorados ({ent}). La banda verde clara es la meta.</div>
        <Fila nombre="Entorados" valor={ent} porcentaje={100} titulo={`${ent} vientres entorados`} />
        <Fila nombre="Preñados" detalle={sinDatosPrenez ? "Esperando la primera ecografía" : null} valor={prenezMostrada === null ? "—" : `${fmt(prenezMostrada)}%`} valorDetalle={prenezMostrada === null ? null : `${pren} vacas`} porcentaje={prenezMostrada} meta={METAS.prenez} />
        <Fila nombre="Nacidos vivos" detalle={c.paricion === null ? etapa.paricion : null} valor={c.paricion === null ? "—" : `${fmt(c.paricion)}%`} valorDetalle={c.paricion === null ? null : `${c.nacidosVivos} terneros`} porcentaje={c.paricion} meta={METAS.paricion} />
        <Fila nombre="Destetados" detalle={c.destete === null ? etapa.destete : null} valor={c.destete === null ? "—" : `${fmt(c.destete)}%`} valorDetalle={c.destete === null ? null : `${c.destetados} terneros`} porcentaje={c.destete} meta={METAS.destete} />
        {(c.perdidasGestacion + c.prenadasSinParto + c.mortinatos + c.muertesPredestete) > 0 && (
          <div className="tb-meta" style={{ marginTop: 10 }}>
            Pérdidas en el camino: {c.perdidasGestacion} pérdidas de gestación · {c.prenadasSinParto} preñadas que no parieron · {c.mortinatos} mortinatos · {c.muertesPredestete} terneros muertos antes del destete.
          </div>
        )}
      </div>

      <div className="tb-grid2">
        <div className="tb-card">
          <div className="tb-titulo">¿Qué las preñó?</div>
          <div className="tb-sub">Reparto de las {pren} preñadas según el método.</div>
          {pren === 0 ? <div className="tb-vacio">Todavía no hay preñeces confirmadas en esta campaña.</div> : ["IATF", "TE", "Repaso"].filter((m) => c.porOrigen[m]).map((m) => (
            <Fila key={m} nombre={m === "Repaso" ? "Repaso con toro" : m === "TE" ? "Transferencia (TE)" : "IATF"} valor={c.porOrigen[m]} valorDetalle={`${fmt(Math.round((c.porOrigen[m] / pren) * 1000) / 10)}%`} porcentaje={(c.porOrigen[m] / pren) * 100} />
          ))}
        </div>

        <div className="tb-card">
          <div className="tb-titulo">Preñez por ronda</div>
          <div className="tb-sub">Preñadas sobre las vacas servidas y ya diagnosticadas en cada ronda.</div>
          {c.rondas.map((r) => {
            const detalle = r.servidas === 0
              ? `${r.programadas} programadas${r.inicio ? ` · empieza ${formatDisplay(r.inicio).slice(0, 5)}` : ""}`
              : `${r.prenadas} de ${r.diagnosticadas} diagnosticadas${r.sinDiagnostico ? ` · ${r.sinDiagnostico} sin diagnóstico` : ""}`;
            return <Fila key={r.ronda} nombre={r.ronda} detalle={detalle} valor={r.tasa === null ? "—" : `${fmt(r.tasa)}%`} porcentaje={r.tasa} />;
          })}
        </div>

        <div className="tb-card">
          <div className="tb-titulo">Preñez por categoría</div>
          <div className="tb-sub">Vacas y vaquillas por separado, contra la misma meta.</div>
          {c.categorias.map((k) => (
            <Fila key={k.categoria} nombre={k.categoria === "Vaca" ? "Vacas" : "Vaquillas"} detalle={sinDatosPrenez ? `${k.entoradas} en servicio` : `${k.prenadas} de ${k.entoradas}`} valor={sinDatosPrenez ? "—" : `${fmt(k.tasa)}%`} porcentaje={sinDatosPrenez ? null : k.tasa} meta={METAS.prenez} />
          ))}
        </div>

        <div className="tb-card">
          <div className="tb-titulo">Intervalo entre partos</div>
          <div className="tb-sub">
            Último intervalo de cada vaca con 2 o más partos cargados ({iep.vacas.length}).
            {iep.conUnSoloParto > 0 && ` Otras ${iep.conUnSoloParto} tienen un solo parto registrado: aparecen cuando paran de nuevo.`}
          </div>
          {iep.vacas.length === 0 ? <div className="tb-vacio">Hace falta un segundo parto registrado por vaca.</div> : (
            <>
              {iep.tramos.map((t) => (
                <Fila key={t.label} nombre={t.label} valor={t.n} valorDetalle={t.n === 1 ? "vaca" : "vacas"} porcentaje={(t.n / iep.vacas.length) * 100} />
              ))}
              {iep.vacas.filter((v) => v.ultimo > 365 && v.enRodeo).length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div className="tb-meta">Pasan de 365 días (tocá para ver la ficha):</div>
                  <Chips cars={iep.vacas.filter((v) => v.ultimo > 365 && v.enRodeo).map((v) => v.caravana)} abrirFicha={abrirFicha} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="tb-card">
        <div className="tb-titulo">Para que tus números sean exactos</div>
        <div className="tb-sub">Cada dato que cargues acá se refleja al instante en el tablero.</div>
        {faltan.length === 0 ? (
          <div className="tb-vacio"><Icono nombre="positivo" size={14} /> Todo cargado al día para la campaña {campania}.</div>
        ) : faltan.map((f) => (
          <div key={f.clave} className="tb-tarea">
            <div className="n">{f.cars.length}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{f.titulo}</div>
              <div className="tb-meta">Dónde: {f.accion}</div>
              <Chips cars={f.cars} abrirFicha={abrirFicha} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
