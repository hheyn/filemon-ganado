import { useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import { Icono } from "../components/Icon";
import { C } from "../lib/constants";
import selloTinta from "../assets/sello-tinta.png";

const ERROR_MSG = {
  "auth/invalid-credential": "Email o contraseña incorrectos.",
  "auth/invalid-email": "El email no es válido.",
  "auth/user-disabled": "Esta cuenta fue deshabilitada.",
  "auth/too-many-requests": "Demasiados intentos. Probá de nuevo en unos minutos.",
};

export function Login() {
  const { login, sinPerfil, logout, user } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(ERROR_MSG[err.code] || "No se pudo iniciar sesión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (sinPerfil) {
    return (
      <div className="app-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div className="card" style={{ maxWidth: 380, textAlign: "center" }}>
          <div className="card-title" style={{ justifyContent: "center" }}><Icono nombre="pendiente" size={18} /> Cuenta pendiente</div>
          <p className="txt-muted" style={{ marginBottom: 14 }}>
            Tu cuenta ({user?.email}) todavía no tiene un rol asignado, o fue desactivada.
            Contactá al administrador de la estancia.
          </p>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Salir</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <form className="card" style={{ maxWidth: 360, width: "100%" }} onSubmit={submit}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <img src={selloTinta} alt="Estancia Filemón" style={{ width: 84, height: 84, margin: "0 auto 10px", display: "block" }} />
          <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 900, color: C.verdeMonte }}>Estancia Filemón</div>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 12, color: C.cuero }}>Ayolas, Misiones</div>
        </div>
        {error && <div className="error-msg">{error}</div>}
        <div className="field mb">
          <label>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        </div>
        <div className="field mb">
          <label>Contraseña</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </div>
        <button className="btn btn-verde btn-full" type="submit" disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
