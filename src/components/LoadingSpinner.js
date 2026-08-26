import { C } from "../lib/constants";
import selloTinta from "../assets/sello-tinta.png";

export function LoadingSpinner({ online, msg }) {
  return (
    <div className="app-bg" style={{ display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "100vh", gap: 20 }}>
      <img src={selloTinta} alt="Estancia Filemón" style={{ width: 96, height: 96 }} />
      <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: C.verdeMonte }}>Estancia Filemón</div>
      <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 13, color: C.cuero }}>
        {msg || (online ? "Conectando..." : "Cargando datos offline...")}
      </div>
    </div>
  );
}
