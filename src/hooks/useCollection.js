import { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { registrarAuditoria } from "../lib/auditoria";
import { today } from "../lib/dateUtils";

// Compara el doc anterior contra los campos nuevos y arma un diff
// { campo: { antes, despues } } solo con lo que realmente cambió — así la
// auditoría queda como corrección legible en vez de "editar" a secas.
function diffCampos(anterior, nuevo) {
  const cambios = {};
  for (const campo of Object.keys(nuevo)) {
    const antes = anterior[campo] ?? null;
    const despues = nuevo[campo] ?? null;
    if (JSON.stringify(antes) !== JSON.stringify(despues)) {
      cambios[campo] = { antes, despues };
    }
  }
  return Object.keys(cambios).length ? cambios : null;
}

/**
 * Hook genérico de acceso a una colección de Firestore, en tiempo real.
 *
 * options.auditar: si true, cada crear/editar/eliminar deja un registro en
 *   `auditoria` (ver lib/auditoria.js) — usar en animales/sanidad/costos.
 * options.softDelete: si true, "eliminar" no borra el documento: lo marca
 *   `eliminado:true` y lo oculta de la lista devuelta (queda disponible para
 *   siempre en el módulo Papelera, sin purga automática — así lo pidió el
 *   usuario, porque el historial de bajas/mortinatos es información
 *   productiva, no solo una red de seguridad contra errores de carga).
 * options.incluirEliminados: si true, devuelve también los marcados eliminados
 *   (lo usa el módulo Papelera).
 * options.user: usuario actual (para dejar constancia de quién audita/elimina).
 */
export function useCollection(colName, options = {}) {
  const { auditar = false, softDelete = false, incluirEliminados = false, user = null } = options;
  const [docs, setDocs] = useState(null);
  const [hasPendingWrites, setHasPendingWrites] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, colName), { includeMetadataChanges: true }, (snap) => {
      setDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setHasPendingWrites(snap.metadata.hasPendingWrites);
    });
    return unsub;
  }, [colName]);

  const add = async (data) => {
    const { id: _id, ...rest } = data;
    const ref = await addDoc(collection(db, colName), rest);
    if (auditar) {
      registrarAuditoria({ coleccion: colName, docId: ref.id, accion: "crear", user });
    }
    return ref;
  };

  const update = async (id, data) => {
    const { id: _id, ...rest } = data;
    await updateDoc(doc(db, colName, id), rest);
    if (auditar) {
      const anterior = (docs || []).find((d) => d.id === id);
      const cambios = anterior ? diffCampos(anterior, rest) : null;
      registrarAuditoria({ coleccion: colName, docId: id, accion: "editar", cambios, user });
    }
  };

  const remove = async (id) => {
    if (softDelete) {
      await updateDoc(doc(db, colName, id), {
        eliminado: true,
        eliminadoEn: today(),
        eliminadoPor: user?.email || null,
      });
    } else {
      await deleteDoc(doc(db, colName, id));
    }
    if (auditar) {
      registrarAuditoria({ coleccion: colName, docId: id, accion: "eliminar", user });
    }
  };

  const restore = async (id) => {
    await updateDoc(doc(db, colName, id), {
      eliminado: false,
      eliminadoEn: null,
      eliminadoPor: null,
    });
  };

  const visibles = softDelete && !incluirEliminados
    ? (docs || []).filter((d) => !d.eliminado)
    : docs;

  return [visibles, add, update, remove, restore, hasPendingWrites];
}
