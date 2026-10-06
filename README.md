# 🏗️ ObraControl — Urban Engineering OS
> **Sistema Integral de Gestión de Contratos, Cobranzas, Finanzas y Comprobantes de Obra**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-10B981?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-MIT-F59E0B.svg)](LICENSE)

---

## 📱 Descripción General

**ObraControl** es una plataforma web progresiva (PWA) de nivel profesional diseñada especialmente para **empresas constructoras, contratistas independientes, maestros de obra e ingenieros civiles**. 

Permite gestionar el ciclo de vida completo de cada obra: desde la suscripción del contrato y el cronograma de cuotas, hasta el control riguroso de cobranzas, arqueos de caja, registro de comprobantes de pago (transferencias bancarias, Yape/Plin, facturas) y cálculo automático de saldos y márgenes de utilidad.

Cuenta con una **estética urbana industrial (Urban Industrial Architecture)** con dos temas disponibles:
- ⬛ **Asfalto Urbano** (Dark Mode de alto contraste con acentos ámbar de seguridad vial)
- ⬜ **Concreto Urbano** (Light Mode técnico y limpio para oficina y luz solar)

---

## 🚀 Módulos Principales

### 1. 📋 Módulo de Contratos y Obras
- Registro de obras con código único, cliente, ubicación, tipo de servicio y fechas de inicio/fin.
- Estados de obra: `Presupuestado`, `En Ejecución`, `Obra Terminada`, `Pagado Concluido`, `En Disputa`.
- Barra de avance financiero y porcentaje de cobranza en tiempo real.
- Vista de tabla detallada en escritorio y **tarjetas táctiles adaptadas para smartphones**.
- Búsqueda en vivo por cliente, número de contrato o ubicación geográfica.

### 2. 📅 Módulo de Cobranzas y Cronograma
- Panel de control de flujo de pagos agrupado por vencimiento.
- Alertas inmediatas de morosidad y semáforo de cuotas (Vigentes, Por vencer y Vencidas).
- Registro ágil de abonos con adjuntos de váuchers bancarios o capturas de Yape.
- Estados automáticos de cuota sincronizados con el saldo pendiente del contrato.

### 3. 📈 Módulo de Finanzas, Resumen & Cuadro de Comprobantes
- Resumen ejecutivo de ingresos cobrados, gastos operativos y margen neto de ganancia.
- Gráficos interactivos de distribución de gastos (Mano de Obra, Materiales, Equipos, Fletes, Subcontratos).
- **Cuadro Oficial de Comprobantes de Ventas y Gastos**:
  - Filtro unificado de ventas (abonos de clientes) y gastos (compras/planillas).
  - Búsqueda por número de váucher, proveedor o contrato.
  - Previsualización en pantalla completa de váuchers o recibos adjuntos.
  - Enlace directo a Google Drive y descarga individual de comprobantes.

### 4. 🧰 Herramientas de Respaldo y Portabilidad
- **Backup JSON**: Exporta e importa el 100% de la base de datos de manera inalterable.
- **Single-File HTML Autónomo**: Genera un archivo `.html` único que funciona sin conexión a internet de por vida.
- **Reportes Ejecutivos en PDF**: Documentos A4 generados del lado del cliente listos para imprimir o enviar.
- **Sincronización con Google Drive**: Respaldo 24/7 de comprobantes y archivos en la nube del usuario.
- **Exportador a GitHub**: Generación de archivo `.zip` y comandos listos para publicar el proyecto.

---

## 📲 Experiencia Móvil (Mobile-Friendly)
- Barra de navegación inferior ergonómica (**Mobile Bottom Navigation Bar**) para fácil acceso con el pulgar.
- Touch targets óptimos (mínimo 44px) con feedback táctil.
- Compatibilidad con notch y barras de gestos mediante `viewport-fit=cover` y safe-area insets.
- Instalable en la pantalla de inicio de Android e iOS como PWA nativa con funcionamiento offline.

---

## 🛠️ Instalación y Ejecución Local

### Prerrequisitos
- [Node.js](https://nodejs.org/) v18 o superior
- [npm](https://www.npmjs.com/) (incluido con Node.js)

### Pasos:
```bash
# 1. Clonar el repositorio
git clone https://github.com/TU-USUARIO/obracontrol.git

# 2. Entrar a la carpeta del proyecto
cd obracontrol

# 3. Instalar las dependencias
npm install

# 4. Iniciar el servidor de desarrollo
npm run dev
```

Abre en tu navegador: [http://localhost:3000](http://localhost:3000)

### Compilar para Producción:
```bash
npm run build
```
Los archivos optimizados se generarán en la carpeta `dist/`.

---

## 🐙 Cómo Publicar en GitHub

### Opción A: Desde la Terminal (Recomendada)

1. Crea un nuevo repositorio en [GitHub.com/new](https://github.com/new) (ejemplo: `obracontrol`).
2. Ejecuta los siguientes comandos en tu terminal local:

```bash
# Inicializar git si aún no está inicializado
git init
git add .
git commit -m "feat: primer commit de ObraControl"

# Enlazar tu repositorio remoto de GitHub
git remote add origin https://github.com/TU-USUARIO/obracontrol.git
git branch -M main

# Subir el proyecto
git push -u origin main
```

*(Reemplaza `TU-USUARIO` por tu nombre de usuario en GitHub).*

### Opción B: Mediante el Descargador ZIP Integrado en la App
1. Entra a **Herramientas & Respaldo** en el menú de la aplicación.
2. Haz clic en **"Publicar en GitHub"**.
3. Presiona **"Descargar Código Fuente (.ZIP)"**.
4. En GitHub.com, crea un nuevo repositorio y usa la opción **"Upload files"** arrastrando los archivos descomprimidos.

---

## 🌐 Publicar Gratis en GitHub Pages (24/7 en Internet)

El proyecto incluye el flujo de trabajo automático de **GitHub Actions** en `.github/workflows/deploy.yml`.

1. En tu repositorio de GitHub, dirígete a la pestaña **Settings** (Configuración).
2. En el menú lateral izquierdo, haz clic en **Pages**.
3. En la sección **Build and deployment > Source**, selecciona:
   👉 **GitHub Actions**
4. ¡Listo! En unos 60 segundos tu aplicación estará publicada y accesible públicamente en:
   `https://<TU-USUARIO>.github.io/<NOMBRE-REPOSITORIO>/`

---

## 🧱 Tecnologías Utilizadas

- **Framework**: React 19 + TypeScript
- **Bundler**: Vite 8.3 con configuración de rutas relativas (`base: './'`)
- **Estilos**: Tailwind CSS 4 con sistema de tokens urbano industrial
- **Iconos**: Lucide React
- **Gráficos**: Recharts
- **PDFs**: jsPDF + jspdf-autotable
- **PWA**: vite-plugin-pwa (Service Workers + Web App Manifest)
- **Compresión**: JSZip
- **Almacenamiento**: IndexedDB + LocalStorage con soporte opcional de Google Drive API

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia MIT. Eres libre de usarlo, modificarlo y desplegarlo para uso personal o comercial.
