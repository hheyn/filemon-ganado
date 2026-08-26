import { ROLES } from "./constants";

// Matriz única rol → módulos visibles. Se mantiene sincronizada A MANO con
// firestore.rules (las reglas de Firestore no pueden importar este archivo).
// Si cambiás algo acá, cambialo también en firestore.rules.
export const MODULOS = [
  "dashboard", "hacienda", "iatf", "prenez", "pariciones", "sanidad", "botiquin",
  "potreros", "bajas", "reportes", "costos", "usuarios", "config", "papelera",
];

const TODOS = MODULOS;

export const ROLE_MODULE_MATRIX = {
  [ROLES.ADMIN]: TODOS,
  [ROLES.CAPATAZ]: ["dashboard", "hacienda", "sanidad", "botiquin", "potreros", "pariciones"],
  [ROLES.VETERINARIO]: ["dashboard", "sanidad", "botiquin", "iatf", "prenez", "pariciones"],
  [ROLES.VISOR]: ["dashboard", "hacienda", "iatf", "prenez", "pariciones", "sanidad", "botiquin", "potreros", "bajas", "reportes"],
};

export function canAccessModule(rol, modulo) {
  if (!rol) return false;
  return (ROLE_MODULE_MATRIX[rol] || []).includes(modulo);
}

// El Admin nunca tiene restricciones de edición, ni siquiera sobre campos
// "inmutables" por diseño (ej. fecha de entrada a piquete) — es la vía para
// corregir a mano los datos inconsistentes que motivaron esta reescritura.
// El Visor jamás edita nada, en ningún módulo al que pueda acceder.
export function canEdit(rol, modulo) {
  if (rol === ROLES.ADMIN) return true;
  if (rol === ROLES.VISOR) return false;
  return canAccessModule(rol, modulo);
}

export function isAdmin(rol) {
  return rol === ROLES.ADMIN;
}
