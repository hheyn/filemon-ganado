# 🐄 Estancia Filemón — App de Gestión de Ganado

App PWA offline-first para gestión de ganado bovino.
Funciona **sin señal** y sincroniza cuando volvés a tener internet.

---

## 📱 Cómo instalar en iPhone (una sola vez)

1. Abrí Safari en el iPhone
2. Entrá a `https://TU-USUARIO.github.io/filemon-ganado`
3. Tocá el botón **Compartir** (cuadrado con flecha ↑)
4. Tocá **"Agregar a pantalla de inicio"**
5. Tocá **Agregar**

¡Listo! Ahora aparece como una app en tu pantalla de inicio 🎉

---

## 🚀 Publicar en GitHub Pages (primer deploy)

### Requisitos
- Tener [Node.js](https://nodejs.org) instalado (versión 18 o superior)
- Tener [Git](https://git-scm.com) instalado
- Tener una cuenta en [GitHub](https://github.com)

### Pasos

#### 1. Crear el repositorio en GitHub
- Entrá a https://github.com/new
- Nombre: `filemon-ganado`
- Dejalo **Público**
- **NO** marques "Add README"
- Clic en **Create repository**

#### 2. Configurar tu usuario en package.json
Abrí el archivo `package.json` y cambiá la línea:
```json
"homepage": "."
```
Por:
```json
"homepage": "https://TU-USUARIO-GITHUB.github.io/filemon-ganado"
```

Y agregá también en `package.json` dentro de `"scripts"`:
```json
"deploy": "gh-pages -d build"
```

#### 3. Instalar dependencias y publicar

Abrí una terminal en la carpeta del proyecto y ejecutá:

```bash
# Instalar dependencias
npm install

# Inicializar git
git init
git add .
git commit -m "Primer deploy - Estancia Filemón"

# Conectar con GitHub (reemplazá TU-USUARIO)
git remote add origin https://github.com/TU-USUARIO/filemon-ganado.git
git branch -M main
git push -u origin main

# Publicar en GitHub Pages
npm run deploy
```

#### 4. Activar GitHub Pages
- Entrá a tu repositorio en GitHub
- Clic en **Settings** → **Pages**
- En "Source" seleccioná **Deploy from branch**
- En "Branch" seleccioná **gh-pages** → **/ (root)**
- Clic en **Save**

En 2-3 minutos tu app estará en:
`https://TU-USUARIO.github.io/filemon-ganado`

---

## 🔄 Actualizar la app con cambios

Cada vez que modifiques el código:

```bash
git add .
git commit -m "Descripción del cambio"
git push
npm run deploy
```

---

## 📵 ¿Cómo funciona offline?

- Los datos se guardan automáticamente en el iPhone (localStorage)
- Podés agregar partos, vacunas, etc. **sin señal**
- Cuando volvés a tener internet, la app lo detecta automáticamente
- El banner verde en la parte superior muestra el estado de sincronización

---

## 🗂 Estructura del proyecto

```
filemon-ganado/
├── public/
│   ├── index.html          # HTML base con meta tags PWA para iPhone
│   ├── manifest.json       # Configuración de instalación
│   └── sw.js               # Service Worker (manejo offline)
├── src/
│   ├── index.js            # Punto de entrada React
│   └── App.js              # Toda la aplicación
└── package.json
```

---

## 📋 Módulos incluidos

| Módulo | Descripción |
|--------|-------------|
| 🏠 Inicio | Panel general con stats, IATF y rotaciones |
| 🐄 Hacienda | Inventario completo — 75 animales cargados |
| 🧬 IATF | 41 registros con resultado por toro |
| 🤰 Preñez | Historial 2024/2025 cruzado |
| 🐣 Pariciones | 15 partos registrados |
| 💉 Sanidad | 33 registros sanitarios |
| 🌿 Potreros | 9 potreros con calendario de rotación |
| ⚰️ Bajas | Registro de muertes, faenas y descartes |
