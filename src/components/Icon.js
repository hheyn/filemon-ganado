import { PATHS, TRAZO } from "../icons/iconos-filemon";

// Set de íconos oficial de la marca (ver src/icons/LEEME.md): monolineal,
// grilla 24×24, trazo 1.6, sin relleno — hereda el color del texto
// (currentColor), nunca lleva color propio. Reemplaza los emojis que usaba
// la reescritura original.
export function Icono({ nombre, size = 24, style, className, title }) {
  const svgPath = PATHS[nombre];
  if (!svgPath) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(`Icono "${nombre}" no existe en el set de marca.`);
    }
    return null;
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={TRAZO}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "block", flexShrink: 0, ...style }}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      dangerouslySetInnerHTML={{ __html: (title ? `<title>${title}</title>` : "") + svgPath }}
    />
  );
}
