// Paleta oficial — Manual de Identidad de Marca, Estancia Filemón v1.0.
// Usada tanto acá (estilos inline puntuales) como en src/index.css (que la
// tiene volcada en variables CSS; mantener sincronizadas si esto cambia).
// "El sol del mediodía exige fondos claros: la app es clara por defecto."
// Proporción de uso: 60% hueso/crudo · 28% verdes · 9% cuero · 5% tierra.
export const C = {
  verdeMonte: "#1E3A2B",  // Primario: barras de navegación, encabezados, botón principal.
  verdeCampo: "#3E6B4A",  // Estados activos, enlaces sobre oscuro, gráficos.
  pasto: "#8FA860",       // Solo relleno o detalle. Nunca texto sobre claro.
  tierra: "#A9523A",      // Acento ÚNICO: numeración, subrayados, un dato destacado.
  cuero: "#8A6A46",       // Secundario cálido: categorías, íconos de stock.
  tinta: "#15150F",       // Texto principal y trazo del sello/íconos.
  hueso: "#F8F8F1",
  crudo: "#E7E2D4",
  niebla: "#C9C3B4",
  alDia: "#4C7A3F",       // Estado: al día / positivo.
  atencion: "#C08A1E",    // Estado: pendiente / atención.
  urgente: "#93372C",     // Estado: urgente / negativo. Únicamente en alertas.
};

// Única fuente de verdad para enums usados en toda la app.
// Antes de la reescritura estos strings estaban repetidos ~46+ veces en App.js,
// con 3-4 listas de "lotes" divergentes entre sí — de ahí varios de los bugs
// de datos inconsistentes. Cualquier módulo que necesite estos valores importa
// de acá, nunca hardcodea el string de nuevo.

export const CATEGORIAS = [
  "Vaca",
  "Vaquilla",
  "Toro",
  "Novillo",
  "Ternero",
  "Ternera",
  "Desmamante Macho",
  "Desmamante Hembra",
];

export const ESTADOS = [
  "OK",
  "Preñada",
  "Vacía",
  "Apta",
  "No Apta",
  "Pendiente",
  "Descarte",
  "Vendida",
];

// Lotes: agrupación permanente del animal, no cambia con los movimientos de potrero.
export const LOTES = ["General", "Cbo3", "Cbo4", "Cbo5", "Cbo6", "Cbo7"];

// Ubicaciones: dónde está físicamente el animal hoy (piquete), cambia seguido.
export const UBICACIONES = [
  "P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9",
  "Escuela", "Campo Grande",
];

export const CAUSAS_BAJA = ["Muerte", "Faena", "Venta", "Descarte", "Robo", "Otro"];

export const CATEGORIAS_PRODUCTO = [
  "Antiparasitario",
  "Vacuna",
  "Vitamina/Reconstituyente",
  "Antibiótico",
  "Hormona/Protocolo IATF",
  "Otro",
];

export const TIPOS_SERVICIO = ["IATF", "TE", "Repaso Toro"];

// Rondas típicas dentro de una campaña — es una lista sugerida, no cerrada:
// el módulo Servicios permite escribir el nombre de ronda que corresponda
// (ver plan: "Rondas de servicio dentro de una campaña").
export const RONDAS_SUGERIDAS = ["IATF-1", "Resincro-TE", "Repaso Toro"];

export const ROLES = {
  ADMIN: "admin",
  CAPATAZ: "capataz",
  VETERINARIO: "veterinario",
  VISOR: "visor",
};

export const ROLES_LABEL = {
  [ROLES.ADMIN]: "Administrador",
  [ROLES.CAPATAZ]: "Capataz",
  [ROLES.VETERINARIO]: "Veterinario",
  [ROLES.VISOR]: "Solo lectura",
};

export const CATEGORIAS_COSTO = ["sanidad", "compra", "mano_obra", "otro"];

export const CATEGORIAS_COSTO_LABEL = {
  sanidad: "Sanidad",
  compra: "Compra / insumo",
  mano_obra: "Mano de obra",
  otro: "Otro",
};
