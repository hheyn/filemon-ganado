import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  connectFirestoreEmulator,
} from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDST17QLDfC6VHaqfX6I1un4yWeu9wzg1w",
  authDomain: "estancia-filemon.firebaseapp.com",
  projectId: "estancia-filemon",
  storageBucket: "estancia-filemon.firebasestorage.app",
  messagingSenderId: "375311745269",
  appId: "1:375311745269:web:940ad983c9347e3d4985bc",
};

export const app = initializeApp(firebaseConfig);

// Caché local persistente (API moderna) en vez del deprecado
// enableIndexedDbPersistence: permite trabajar offline y encolar
// escrituras que se sincronizan solas al recuperar señal.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager(),
  }),
});

export const auth = getAuth(app);

// Modo de prueba local: con REACT_APP_USE_EMULATOR=true (ver .env.emulator),
// la app conecta contra el emulador de Firebase en localhost en vez del
// proyecto real — así se puede probar cualquier flujo, incluso destructivo,
// sin tocar los datos reales de la estancia. Nunca se activa por accidente:
// requiere la variable de entorno explícita.
if (process.env.REACT_APP_USE_EMULATOR === "true") {
  connectFirestoreEmulator(db, "127.0.0.1", 8085);
  connectAuthEmulator(auth, "http://127.0.0.1:9199", { disableWarnings: true });
  // eslint-disable-next-line no-console
  console.warn("⚠️ Conectado al EMULADOR de Firebase (datos de prueba, no reales)");
}
