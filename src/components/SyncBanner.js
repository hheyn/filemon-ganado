import { Icono } from "./Icon";

export function SyncBanner({ online, pendingWrites }) {
  if (!online) {
    return (
      <div className="sync-banner offline">
        <span className="pulse"><Icono nombre="advertencia" size={14} /></span>
        <span>Sin señal · trabajando offline · los cambios se guardan localmente y se sincronizan al volver la conexión</span>
      </div>
    );
  }
  if (pendingWrites) {
    return (
      <div className="sync-banner syncing">
        <span className="pulse"><Icono nombre="sincronizar" size={14} /></span>
        <span>Sincronizando cambios pendientes...</span>
      </div>
    );
  }
  return (
    <div className="sync-banner">
      <span><Icono nombre="positivo" size={14} /></span>
      <span>Todo sincronizado</span>
    </div>
  );
}
