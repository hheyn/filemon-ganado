import { Icono } from "./Icon";

// Overlay compartido — antes cada módulo hand-rolleaba su propio div fijo
// con la misma estructura (~58 apariciones en App.js). Ahora todos usan este.
export function Modal({ onClose, title, children, wide = false }) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        // e.target === e.currentTarget: el click cayó justo en el overlay,
        // no en un hijo — funciona igual para elementos HTML y SVG (a
        // diferencia de comparar `className` como string, que rompe con
        // SVG: ahí `className` es un SVGAnimatedString, no un string).
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className={`modal-box${wide ? " wide" : ""}`}>
        {onClose && (
          <button className="modal-close" onClick={onClose}>
            <Icono nombre="cerrar" size={14} />
          </button>
        )}
        {title && <div className="modal-title">{title}</div>}
        {children}
      </div>
    </div>
  );
}
