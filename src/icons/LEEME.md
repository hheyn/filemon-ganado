# Estancia Filemón — pack de iconos v1.0

49 iconos monolineales. Grilla 24×24, área viva 20×20, trazo 1,6 px, extremos y uniones redondeados.

## Reglas
- `fill="none"` y `stroke="currentColor"`: el ícono toma el color del texto que lo contiene. No hay versiones de color.
- Tamaños: 16 px en línea de texto · 24 px en listas y barra inferior · 34 px en accesos del panel. Área táctil siempre ≥ 44 px.
- Color: Tinta `#15150F` por defecto · Verde Monte `#1E3A2B` en estado activo · Urgente `#93372C` solo en alertas. Nunca dos colores en un mismo ícono.
- No modificar el grosor por ícono: si hace falta más presencia, se agranda el ícono, no el trazo.

## Archivos
- `iconos/<grupo>/<nombre>.svg` — pieza individual, lista para inline.
- `sprite-filemon.svg` — sprite con `<symbol id="ef-nombre">` para `<use>`.
- `iconos-filemon.js` — objeto `PATHS` para componentes React/Vue.

## Inventario
### 01-navegacion
- `inicio.svg` — Inicio
- `hacienda.svg` — Hacienda
- `servicios.svg` — Servicios
- `prenez.svg` — Preñez
- `partos.svg` — Partos
- `sanidad.svg` — Sanidad
- `botiquin.svg` — Botiquín
- `potreros.svg` — Potreros
- `bajas.svg` — Bajas
- `reportes.svg` — Reportes
- `costos.svg` — Costos
- `usuarios.svg` — Usuarios
- `archivo.svg` — Archivo
- `config.svg` — Config

### 02-acciones
- `agregar.svg` — Agregar
- `editar.svg` — Editar
- `eliminar.svg` — Eliminar
- `guardar.svg` — Guardar
- `cerrar.svg` — Cerrar
- `buscar.svg` — Buscar
- `mover-lote.svg` — Mover lote
- `cambiar-categoria.svg` — Cambiar categoría
- `exportar.svg` — Exportar
- `historial.svg` — Historial

### 03-operacion
- `catalogo.svg` — Catálogo
- `evento-de-manejo.svg` — Evento de manejo
- `registrar-compra.svg` — Registrar compra
- `ajuste-de-stock.svg` — Ajuste de stock
- `repaso-resincro.svg` — Repaso / resincro

### 04-estados
- `positivo.svg` — Positivo
- `negativo.svg` — Negativo
- `pendiente.svg` — Pendiente
- `advertencia.svg` — Advertencia
- `sin-permiso.svg` — Sin permiso
- `hembra.svg` — Hembra
- `macho.svg` — Macho
- `mortinato-baja.svg` — Mortinato / baja

### 05-campo
- `toro.svg` — Toro
- `seleccion-especifica.svg` — Selección específica
- `fecha.svg` — Fecha
- `mapa.svg` — Mapa
- `ventas.svg` — Ventas
- `filtrar.svg` — Filtrar
- `sincronizar.svg` — Sincronizar
- `nota.svg` — Nota
- `ordenar.svg` — Ordenar
- `paso-siguiente.svg` — Paso siguiente
- `caravana.svg` — Caravana
- `casa-techo.svg` — Casa / techo

## No usar
Ataúd, calavera, ADN, rayo ni disquete. Bajas es una puerta de salida; Mortinato una caravana tachada. Eliminar es tacho, Archivo es gaveta — nunca al revés.
