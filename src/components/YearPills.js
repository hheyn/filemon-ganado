export function YearPills({ anos, anio, setAnio }) {
  return (
    <div className="tab-pills" style={{ marginBottom: 4 }}>
      <span style={{ fontSize: 10, color: "#8B5E3C", fontFamily: "'Roboto Slab',serif", padding: "5px 4px", whiteSpace: "nowrap" }}>Año:</span>
      {anos.map((a) => (
        <button key={a} className={`pill${anio === a ? " active" : ""}`} onClick={() => setAnio(a)}>{a}</button>
      ))}
    </div>
  );
}
