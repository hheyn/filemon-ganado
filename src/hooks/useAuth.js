import { useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

// Estado de sesión + rol. El rol NO viene de custom claims (requeriría Cloud
// Functions/Admin SDK) sino del doc `usuarios/{uid}` en Firestore — más simple
// para una app sin backend, a costa de tener que mantener sincronizada a mano
// la matriz de permisos entre lib/permissions.js (UI) y firestore.rules (servidor).
export function useAuth() {
  const [user, setUser] = useState(undefined); // undefined = no resuelto aún
  const [perfil, setPerfil] = useState(undefined); // doc de usuarios/{uid}
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      if (!u) {
        setPerfil(null);
        setAuthLoading(false);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    setAuthLoading(true);
    const unsub = onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
      setPerfil(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setAuthLoading(false);
    });
    return unsub;
  }, [user]);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => fbSignOut(auth);

  const rol = perfil?.activo ? perfil.rol : null;

  return {
    user,
    perfil,
    rol,
    loading: user === undefined || authLoading,
    // Autenticado pero sin doc de usuarios (o desactivado) — cuenta pendiente
    // de configuración por el Admin.
    sinPerfil: !!user && perfil !== undefined && (!perfil || !perfil.activo),
    login,
    logout,
  };
}
