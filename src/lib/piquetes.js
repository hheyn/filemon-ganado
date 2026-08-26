// Configuración fija de piquetes: hectáreas y días de descanso recomendados
// casi no cambian, así que viven acá en vez de en una colección Firestore
// (evita la doble fuente de verdad que tenía la app anterior entre la
// colección `potreros` y el array hardcodeado PIQUETES_DATA).
// El ESTADO dinámico (quién está adentro, desde cuándo) sigue viviendo en
// la colección Firestore `rotaciones` — ver lib/rotaciones.js.

export const PIQUETES = [
  { id: "P1", nombre: "P1", ha: 3.5, diasRotacion: 4 },
  { id: "P2", nombre: "P2", ha: 4, diasRotacion: 4 },
  { id: "P3", nombre: "P3", ha: 3.2, diasRotacion: 4 },
  { id: "P4", nombre: "P4", ha: 3, diasRotacion: 3 },
  { id: "P5", nombre: "P5", ha: 3, diasRotacion: 3 },
  { id: "P6", nombre: "P6", ha: 3, diasRotacion: 3 },
  { id: "P7", nombre: "P7", ha: 3, diasRotacion: 3 },
  { id: "P8", nombre: "P8", ha: 2.5, diasRotacion: 3 },
  { id: "P9", nombre: "P9", ha: 7.5, diasRotacion: 8 },
  { id: "Escuela", nombre: "Escuela", ha: 4.5, diasRotacion: 5 },
  { id: "Campo Grande", nombre: "Campo Grande", ha: null, diasRotacion: null, flexible: true },
];

export const PIQUETE_IDS = PIQUETES.map((p) => p.id);

export function getPiquete(id) {
  return PIQUETES.find((p) => p.id === id) || null;
}
