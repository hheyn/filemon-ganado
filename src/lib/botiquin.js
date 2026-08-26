import { addDoc, collection } from "firebase/firestore";
import { db } from "./firebase";
import { today } from "./dateUtils";

// Botiquín virtual: el stock de cada producto NO se guarda como un número
// fijo en el catálogo (eso se desincroniza fácil), sino que se calcula sumando
// un libro de movimientos (`stock_movimientos`): compras (+), consumos (-) y
// ajustes manuales (+/-). Esto deja historial completo de por qué el stock
// está en el número que está — igual filosofía que rotaciones/auditoría.

export function calcularStock(productoId, movimientos) {
  return (movimientos || [])
    .filter((m) => m.productoId === productoId)
    .reduce((sum, m) => sum + (Number(m.cantidad) || 0), 0);
}

// Se llama automáticamente al guardar un registro de Sanidad, si el producto
// aplicado tiene `dosisPorAnimal` configurada en el catálogo — descuenta
// dosisPorAnimal × cantidad de animales tratados. Si el producto no tiene
// dosisPorAnimal (ej. dosis variable por peso, "1ml/50kg"), no hace nada: ese
// producto simplemente no participa del cálculo automático de stock.
export async function registrarConsumo({ producto, nAnimales, fecha, sanidadRefId, user }) {
  if (!producto?.dosisPorAnimal || !nAnimales) return;
  const cantidad = -(Number(producto.dosisPorAnimal) * nAnimales);
  if (!cantidad) return;
  await addDoc(collection(db, "stock_movimientos"), {
    productoId: producto.id,
    productoNombre: producto.nombre,
    tipo: "consumo",
    cantidad,
    unidad: producto.unidad || "",
    fecha: fecha || today(),
    obs: `Aplicado a ${nAnimales} animal(es)`,
    sanidadRef: sanidadRefId || null,
    creadoPor: user?.email || null,
  });
}

export async function registrarCompra({ producto, cantidad, fecha, obs, user }) {
  if (!producto || !cantidad) return;
  await addDoc(collection(db, "stock_movimientos"), {
    productoId: producto.id,
    productoNombre: producto.nombre,
    tipo: "compra",
    cantidad: Math.abs(Number(cantidad)),
    unidad: producto.unidad || "",
    fecha: fecha || today(),
    obs: obs || "",
    sanidadRef: null,
    creadoPor: user?.email || null,
  });
}

export async function registrarAjuste({ producto, cantidad, fecha, obs, user }) {
  if (!producto || !cantidad) return;
  await addDoc(collection(db, "stock_movimientos"), {
    productoId: producto.id,
    productoNombre: producto.nombre,
    tipo: "ajuste",
    cantidad: Number(cantidad),
    unidad: producto.unidad || "",
    fecha: fecha || today(),
    obs: obs || "Ajuste manual",
    sanidadRef: null,
    creadoPor: user?.email || null,
  });
}

// "Rinde" ~N animales con el stock actual, si el producto tiene dosis fija.
export function rindeAnimales(producto, stockActual) {
  if (!producto?.dosisPorAnimal) return null;
  return Math.max(0, Math.floor(stockActual / Number(producto.dosisPorAnimal)));
}
