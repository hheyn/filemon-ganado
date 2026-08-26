// Wrappers finos sobre los estilos .field/.btn/.badge ya definidos en index.css
// — no reinventan el look, solo evitan repetir className/estructura a mano.
export function Field({ label, children }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      {children}
    </div>
  );
}

export function Input(props) {
  return <input {...props} />;
}

export function Select({ options, value, onChange, placeholder, ...rest }) {
  return (
    <select value={value} onChange={onChange} {...rest}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) =>
        typeof o === "string" ? (
          <option key={o} value={o}>{o}</option>
        ) : (
          <option key={o.value} value={o.value}>{o.label}</option>
        )
      )}
    </select>
  );
}

export function Button({ variant = "prim", sm, full, children, ...rest }) {
  const cls = ["btn", `btn-${variant}`, sm && "btn-sm", full && "btn-full"].filter(Boolean).join(" ");
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}

const BADGE_CLASS = {
  verde: "badge-verde", rojo: "badge-rojo", paja: "badge-paja",
  cielo: "badge-cielo", gris: "badge-gris", morado: "badge-morado",
};

export function Badge({ tone = "gris", children, style }) {
  return <span className={`badge ${BADGE_CLASS[tone] || "badge-gris"}`} style={style}>{children}</span>;
}

// Colores de estado consistentes en toda la app (antes cada módulo tenía su
// propio mapeo ad hoc de estado→color).
const ESTADO_TONE = {
  OK: "verde", Preñada: "paja", "Vacía": "gris", Apta: "verde",
  "No Apta": "rojo", Pendiente: "cielo", Descarte: "rojo", Vendida: "gris",
};

export function BadgeEstado({ estado }) {
  return <Badge tone={ESTADO_TONE[estado] || "gris"}>{estado}</Badge>;
}
