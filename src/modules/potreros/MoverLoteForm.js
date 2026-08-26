import { useMemo, useState } from "react";
import { Icono } from "../../components/Icon";
import { Field, Input, Select, Button } from "../../components/Field";
import { PIQUETE_IDS, getPiquete } from "../../lib/piquetes";
import { today } from "../../lib/dateUtils";

// Formulario compartido de "mover lote" con foco en piquete de origen
// (a diferencia de Hacienda, que arranca desde el lote). Vive separado de
// index.js para poder reusar exactamente esta UI donde haga falta dentro de
// Potreros — la lógica real de mover (moverAnimales) la ejecuta el padre.
export function MoverLoteForm({ animales, rotaciones, onSubmit, onCancel, origenInicial }) {
  const piquetesOcupados = useMemo(() => {
    const ids = new Set((animales || []).map((a) => a.ubicacion).filter(Boolean));
    return PIQUETE_IDS.filter((id) => ids.has(id));
  }, [animales]);

  const [origen, setOrigen] = useState(origenInicial || piquetesOcupados[0] || "");
  const lotesEnOrigen = useMemo(() => {
    return [...new Set(animales.filter((a) => a.ubicacion === origen).map((a) => a.lote).filter(Boolean))];
  }, [animales, origen]);

  const [lote, setLote] = useState("");
  const [destino, setDestino] = useState("");
  const [fecha, setFecha] = useState(today());

  const animalesFiltrados = animales.filter(
    (a) => a.ubicacion === origen && (!lote || a.lote === lote)
  );

  const destinoOpciones = PIQUETE_IDS.filter((id) => id !== origen);

  const puedeSubmit = origen && destino && origen !== destino && animalesFiltrados.length > 0;

  const handleOrigenChange = (id) => {
    setOrigen(id);
    setLote("");
  };

  const handleSubmit = () => {
    if (!puedeSubmit) return;
    onSubmit({
      origen,
      lote,
      destino,
      fecha,
      animalIds: animalesFiltrados.map((a) => a.id),
    });
  };

  return (
    <div>
      <div className="form-row">
        <Field label="Origen">
          <Select
            value={origen}
            onChange={(e) => handleOrigenChange(e.target.value)}
            options={piquetesOcupados.map((id) => ({ value: id, label: getPiquete(id)?.nombre || id }))}
            placeholder={piquetesOcupados.length ? "Elegir piquete..." : "Sin piquetes ocupados"}
          />
        </Field>
        <Field label="Lote (opcional)">
          <Select
            value={lote}
            onChange={(e) => setLote(e.target.value)}
            options={lotesEnOrigen}
            placeholder="Todos los que están ahí"
            disabled={!origen}
          />
        </Field>
      </div>
      <div className="form-row">
        <Field label="Destino">
          <Select
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            options={destinoOpciones.map((id) => ({ value: id, label: getPiquete(id)?.nombre || id }))}
            placeholder="Elegir piquete..."
          />
        </Field>
        <Field label="Fecha">
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Field>
      </div>

      <div className="txt-muted mb">
        {origen && destino && origen !== destino
          ? `${animalesFiltrados.length} animales se moverán de ${getPiquete(origen)?.nombre || origen} a ${getPiquete(destino)?.nombre || destino}.`
          : "Elegí origen y destino para ver cuántos animales se moverán."}
      </div>

      <div className="flex">
        <Button variant="prim" disabled={!puedeSubmit} onClick={handleSubmit}>
          <Icono nombre="moverLote" size={14} /> Mover lote
        </Button>
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  );
}
