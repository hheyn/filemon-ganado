import { useState, useEffect } from "react";
import { useAuthContext } from "./context/AuthContext";
import { useCollection } from "./hooks/useCollection";
import { useHashRoute } from "./hooks/useHashRoute";
import { canAccessModule } from "./lib/permissions";
import { Icono } from "./components/Icon";
import selloHueso from "./assets/sello-hueso.png";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { SyncBanner } from "./components/SyncBanner";
import { Login } from "./modules/Login";
import { Inicio } from "./modules/Inicio";
import { Rodeo } from "./modules/Rodeo";
import { Cuenta } from "./modules/Cuenta";
import { Potreros } from "./modules/potreros";
import { Reportes } from "./modules/Reportes";
import { FichaAnimal } from "./modules/FichaAnimal";

// Cinco accesos, tal como pide el manual de marca: "móvil primero, barra
// inferior con cinco accesos, todo el contenido llega con el pulgar". Los
// módulos que antes eran pestañas propias (Servicios, Preñez, Partos,
// Sanidad, Botiquín, Bajas, Usuarios, Costos, Config, Archivo) ahora viven
// agrupados dentro de Rodeo o Cuenta — ver esos dos módulos.
const TOP_TABS = [
  { id: "inicio", nombre: "inicio", label: "Inicio" },
  { id: "rodeo", nombre: "hacienda", label: "Rodeo" },
  { id: "potreros", nombre: "potreros", label: "Potreros" },
  { id: "reportes", nombre: "reportes", label: "Reportes" },
  { id: "cuenta", nombre: "config", label: "Cuenta" },
];

function saludo() {
  const h = new Date().getHours();
  if (h < 12) return "Buen día";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default function App() {
  const { user, perfil, rol, loading: authLoading, logout } = useAuthContext();

  if (authLoading) return <LoadingSpinner online={navigator.onLine} msg="Verificando sesión..." />;
  if (!user || !rol) return <Login />;

  return <AppShell rol={rol} user={user} perfil={perfil} logout={logout} />;
}

function AppShell({ rol, user, perfil, logout }) {
  const validTabs = TOP_TABS.map((t) => t.id);
  const [tab, setTab] = useHashRoute(validTabs, "inicio");
  const [online, setOnline] = useState(navigator.onLine);
  const [fichaCaravana, setFichaCaravana] = useState(null);
  const [editarCaravana, setEditarCaravana] = useState(null);
  const [rodeoVista, setRodeoVista] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  const [animalesD, addAnimal, updateAnimal, removeAnimal, , animalesPending] =
    useCollection("animales", { auditar: true, user });
  const animales = animalesD || [];

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  if (!animalesD) return <LoadingSpinner online={online} />;

  const abrirFicha = (caravana) => setFichaCaravana(caravana);
  const nombreUsuario = perfil?.nombre?.split(" ")[0] || user?.email?.split("@")[0] || "";

  const resultadosBusqueda = busqueda.trim()
    ? animales.filter((a) =>
        a.caravana?.toLowerCase().includes(busqueda.toLowerCase()) ||
        (a.nombre || "").toLowerCase().includes(busqueda.toLowerCase())
      ).slice(0, 8)
    : [];

  const haciendaProps = {
    animales, addAnimal, updateAnimal, removeAnimal, rol, user, abrirFicha,
    editarCaravana, onEditarConsumido: () => setEditarCaravana(null),
  };

  return (
    <div className="app-bg">
      <div className="header">
        <div className="header-inner">
          <img src={selloHueso} alt="Estancia Filemón" className="header-seal-img" />
          <div style={{ minWidth: 0 }}>
            <div className="header-title">Estancia Filemón</div>
            <div className="header-sub">{saludo()}{nombreUsuario ? `, ${nombreUsuario}` : ""}</div>
          </div>
          <div className="search-global">
            <input
              placeholder="Buscar caravana..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {resultadosBusqueda.length > 0 && (
              <div className="search-dd">
                {resultadosBusqueda.map((a) => (
                  <div
                    key={a.id}
                    className="search-dd-item"
                    onClick={() => { abrirFicha(a.caravana); setBusqueda(""); }}
                  >
                    Car. {a.caravana}{a.nombre ? ` – ${a.nombre}` : ""} · {a.categoria}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <SyncBanner online={online} pendingWrites={animalesPending} />

      <div className="main">
        {tab === "inicio" && (
          <Inicio
            animales={animales} rol={rol} abrirFicha={abrirFicha}
            irA={(destino) => { setTab("rodeo"); setRodeoVista(destino); }}
          />
        )}
        {tab === "rodeo" && (
          <Rodeo {...haciendaProps} vistaInicial={rodeoVista} onVistaConsumida={() => setRodeoVista(null)} />
        )}
        {tab === "potreros" && (
          canAccessModule(rol, "potreros")
            ? <Potreros animales={animales} updateAnimal={updateAnimal} rol={rol} />
            : <div className="card txt-muted" style={{ padding: 16 }}>No tenés permiso para ver este módulo.</div>
        )}
        {tab === "reportes" && (
          canAccessModule(rol, "reportes")
            ? <Reportes animales={animales} rol={rol} />
            : <div className="card txt-muted" style={{ padding: 16 }}>No tenés permiso para ver este módulo.</div>
        )}
        {tab === "cuenta" && <Cuenta rol={rol} user={user} animales={animales} logout={logout} />}
      </div>

      <nav className="nav-bottom">
        {TOP_TABS.map((t) => (
          <button key={t.id} className={`nav-btn${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
            <span className="nav-icon"><Icono nombre={t.nombre} size={22} /></span>
            {t.label}
          </button>
        ))}
      </nav>

      {fichaCaravana && (
        <FichaAnimal
          caravana={fichaCaravana}
          animales={animales}
          rol={rol}
          onEdit={canAccessModule(rol, "hacienda") ? (caravana) => {
            setFichaCaravana(null);
            setEditarCaravana(caravana);
            setTab("rodeo");
            setRodeoVista("hacienda");
          } : undefined}
          onClose={() => setFichaCaravana(null)}
        />
      )}
    </div>
  );
}
