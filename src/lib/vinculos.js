import { collection, getDocs, query, where, writeBatch } from "firebase/firestore";
import { db } from "./firebase";

// Las colecciones se vinculan entre sí por número de caravana (texto), no
// por id de documento. Si una caravana cambia (la cría que nace con una
// caravana provisoria y después recibe la definitiva, o un error de carga),
// el cambio tiene que arrastrarse a cada lugar que la referencia — si no, la
// cría pierde su parto, la madre pierde a su cría, y los servicios/sanidad
// quedan apuntando a una caravana que ya no existe.
const REFERENCIAS = [
  ["animales", "madreCaravana"],
  ["pariciones", "madreCaravana"],
  ["iatf", "caravana"],
  ["sanidad", "caravana"],
  ["pesajes", "caravana"],
];

// `madre`: las caravanas provisorias de cría se repiten entre partos (ej. dos
// partos con "cbo7-14"), así que el vínculo parto→cría solo se arrastra en
// los partos de esa misma madre, nunca en el de otra vaca con igual etiqueta.
export async function renombrarCaravana(vieja, nueva, { madre } = {}) {
  if (!vieja || !nueva || vieja === nueva) return 0;
  const batch = writeBatch(db);
  let n = 0;

  for (const [col, campo] of REFERENCIAS) {
    const snap = await getDocs(query(collection(db, col), where(campo, "==", vieja)));
    snap.forEach((d) => { batch.update(d.ref, { [campo]: nueva }); n++; });
  }

  const partos = await getDocs(query(collection(db, "pariciones"), where("terneroCar", "==", vieja)));
  partos.forEach((d) => {
    if (madre && d.data().madreCaravana !== madre) return;
    batch.update(d.ref, { terneroCar: nueva });
    n++;
  });

  const san = await getDocs(query(collection(db, "sanidad"), where("caravanas", "array-contains", vieja)));
  san.forEach((d) => {
    batch.update(d.ref, { caravanas: d.data().caravanas.map((c) => (c === vieja ? nueva : c)) });
    n++;
  });

  if (n) await batch.commit();
  return n;
}

// Un parto cargado sin caravana de cría (el ternero se caravaneó después y se
// dio de alta a mano en Hacienda) queda huérfano: se vincula con el animal
// cuya madre y fecha de nacimiento coinciden con las del parto.
export async function vincularPartoSinCria({ caravana, madreCaravana, fechaNac }) {
  if (!caravana || !madreCaravana || !fechaNac) return;
  const snap = await getDocs(query(collection(db, "pariciones"), where("madreCaravana", "==", madreCaravana)));
  const huerfano = snap.docs.find((d) => {
    const p = d.data();
    return !p.eliminado && p.fecha === fechaNac && (!p.terneroCar || p.terneroCar === "—");
  });
  if (huerfano) {
    const batch = writeBatch(db);
    batch.update(huerfano.ref, { terneroCar: caravana });
    await batch.commit();
  }
}
