/**
 * Generates the complete, standalone single-file HTML code with Tailwind CSS CDN,
 * inline Heroicons SVGs, IndexedDB persistence, modal views, file upload, and Yape/voucher management.
 * Ready to save as index.html and run in any browser offline.
 */
export function generateSingleFileHtmlCode(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ObraControl - Gestión de Contratos y Cobranzas</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Google Fonts: Plus Jakarta Sans -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
          }
        }
      }
    }
  </script>
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #f1f5f9; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 9999px; }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 antialiased min-h-screen flex flex-col">

  <!-- TOP HEADER -->
  <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-bold tracking-tight text-slate-900 leading-tight">ObraControl</h1>
            <span class="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">Contratistas</span>
          </div>
          <p class="text-xs text-slate-500">Gestión de Contratos, Cobranzas (Yape/Bancos) y Facturación</p>
        </div>
      </div>

      <div class="flex items-center flex-wrap gap-2">
        <button onclick="loadDemoData()" class="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
          Cargar Demo
        </button>
        <button onclick="exportBackup()" class="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors inline-flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Exportar
        </button>
        <label class="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer">
          <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
          Importar
          <input type="file" id="importInput" accept=".json" onchange="importBackup(event)" class="hidden">
        </label>
        <button onclick="openNewContractModal()" class="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-all inline-flex items-center gap-1.5 hover:shadow">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Nuevo Contrato
        </button>
      </div>
    </div>
  </header>

  <!-- MAIN CONTAINER -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">

    <!-- KPI CARDS -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5" id="kpiContainer">
      <!-- Generated via JS -->
    </div>

    <!-- MONITOR DE COBRANZAS Y VENCIMIENTOS -->
    <div id="alertsBannerContainer"></div>

    <!-- VIEW SWITCHER: GESTIÓN DE CONTRATOS VS RESUMEN GLOBAL DE RENTABILIDAD -->
    <div class="flex items-center gap-2 border-b border-slate-200 pb-3">
      <button onclick="setDashboardTab('contracts')" id="tab-contracts-btn" class="px-4 py-2 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 bg-slate-900 text-white shadow-xs">
        <span>Gestión de Contratos & Obras</span>
        <span id="contractsTabCountBadge" class="text-[10px] px-2 py-0.5 rounded-full font-mono bg-slate-800 text-slate-200">0</span>
      </button>
      <button onclick="setDashboardTab('profit-summary')" id="tab-profit-btn" class="px-4 py-2 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 bg-white text-slate-600 hover:bg-slate-100 border border-slate-200">
        <span>Resumen Global: Ingresos, Gastos & Ganancia</span>
        <span class="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Rentabilidad</span>
      </button>
    </div>

    <!-- SECCIÓN VISTA DE CONTRATOS -->
    <div id="contractsViewSection" class="space-y-6">
      <!-- SEARCH & FILTER BAR -->
      <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div class="relative w-full md:w-96">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <input type="text" id="searchInput" oninput="handleSearch(this.value)" placeholder="Buscar cliente, contrato, RUC o descripción..." class="block w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900 placeholder-slate-400">
        </div>

        <div class="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
          <span class="text-xs font-semibold text-slate-500">Filtrar:</span>
          <button onclick="setFilter('ALL')" id="filter-ALL" class="filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-sky-600 text-white">Todos</button>
          <button onclick="setFilter('OVERDUE')" id="filter-OVERDUE" class="filter-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-colors bg-red-50 text-red-700 hover:bg-red-100 border border-red-300 hidden">⚠️ Vencidos (<span id="overdueCountBadge">0</span>)</button>
          <button onclick="setFilter('UPCOMING')" id="filter-UPCOMING" class="filter-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-colors bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 hidden">📅 Próximos (<span id="upcomingCountBadge">0</span>)</button>
          <button onclick="setFilter('EN_EJECUCION')" id="filter-EN_EJECUCION" class="filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200">En Ejecución</button>
          <button onclick="setFilter('OBRA_TERMINADA')" id="filter-OBRA_TERMINADA" class="filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200">Obra Terminada</button>
          <button onclick="setFilter('PAGADO_CONCLUIDO')" id="filter-PAGADO_CONCLUIDO" class="filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200">Pagado y Concluido</button>
        </div>
      </div>

      <!-- CONTRACTS GRID -->
      <div id="contractsGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <!-- Injected via JavaScript -->
      </div>

      <!-- EMPTY STATE -->
      <div id="emptyState" class="hidden text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs p-8">
        <div class="w-16 h-16 mx-auto mb-4 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        </div>
        <h3 class="text-base font-bold text-slate-900">No se encontraron contratos</h3>
        <p class="text-sm text-slate-500 max-w-md mx-auto mt-1">Crea tu primer contrato con el botón superior o carga los datos de demostración para explorar el sistema.</p>
        <div class="mt-5 flex justify-center gap-3">
          <button onclick="loadDemoData()" class="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg">Cargar Demo</button>
          <button onclick="openNewContractModal()" class="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-lg">Crear Contrato</button>
        </div>
      </div>
    </div>

    <!-- SECCIÓN DE RESUMEN GLOBAL DE RENTABILIDAD (TODOS LOS CONTRATOS) -->
    <div id="globalProfitViewSection" class="hidden space-y-6">
      <!-- Injected via renderGlobalProfitSummary() -->
    </div>
  </main>

  <!-- MODAL: NUEVO / EDITAR CONTRATO -->
  <div id="contractModal" class="fixed inset-0 z-50 hidden bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-xl my-8 overflow-hidden border border-slate-200 animate-in fade-in duration-200">
      <div class="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="p-1.5 bg-sky-500/20 text-sky-400 rounded-lg">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          </div>
          <h3 class="text-base font-bold" id="contractModalTitle">Registrar Nuevo Contrato</h3>
        </div>
        <button onclick="closeContractModal()" class="text-slate-400 hover:text-white p-1 rounded-lg">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <form id="contractForm" onsubmit="handleSaveContract(event)" class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
        <input type="hidden" id="contractId">

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">N° de Contrato *</label>
            <input type="text" id="formContractNumber" required placeholder="ej. CONT-2026-001" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Monto Total Contratado (S/) *</label>
            <input type="number" step="0.01" min="1" id="formTotalAmount" required placeholder="ej. 25000.00" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-semibold">
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Cliente / Razón Social *</label>
          <input type="text" id="formClientName" required placeholder="ej. Constructora & Inmobiliaria Los Pinos S.A.C." class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500">
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Tipo Doc.</label>
            <select id="formDocType" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white">
              <option value="RUC">RUC</option>
              <option value="DNI">DNI</option>
            </select>
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs font-bold text-slate-700 mb-1">N° Documento (DNI/RUC) *</label>
            <input type="text" id="formDocNumber" required placeholder="ej. 20601234567" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono">
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Teléfono de Contacto *</label>
          <input type="text" id="formPhone" required placeholder="ej. +51 987 654 321" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500">
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Descripción de la Obra o Servicio *</label>
          <textarea id="formDescription" required rows="2" placeholder="ej. Remodelación general, instalación de redes sanitarias y acabados" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"></textarea>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Fecha de Inicio *</label>
            <input type="date" id="formStartDate" required class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Fecha Estimada de Entrega *</label>
            <input type="date" id="formEstimatedEndDate" required class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500">
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Adjuntar Contrato Firmado (PDF o Imagen)</label>
          <input type="file" id="formContractFile" accept="application/pdf,image/*" class="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer">
          <p id="contractFileCurrent" class="text-xs text-slate-500 mt-1 italic"></p>
        </div>

        <div class="pt-4 border-t border-slate-200 flex justify-end gap-3">
          <button type="button" onclick="closeContractModal()" class="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">Cancelar</button>
          <button type="submit" class="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm">Guardar Contrato</button>
        </div>
      </form>
    </div>
  </div>

  <!-- MODAL: FICHA DETALLADA DEL CONTRATO (ABONOS / FACTURA / CIERRE) -->
  <div id="detailModal" class="fixed inset-0 z-50 hidden bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-6 overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
      <!-- Header -->
      <div class="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
        <div>
          <div class="flex items-center gap-2">
            <span id="detailContractCode" class="text-base font-bold font-mono tracking-tight text-white">CONT-2026-001</span>
            <span id="detailStatusBadge" class="text-xs font-semibold px-2.5 py-0.5 rounded-full"></span>
          </div>
          <p id="detailClientName" class="text-xs text-slate-300 font-medium"></p>
        </div>
        <button onclick="closeDetailModal()" class="text-slate-400 hover:text-white p-1 rounded-lg">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <!-- MODAL TABS BAR -->
      <div class="bg-slate-100 border-b border-slate-200 px-4 sm:px-6 py-2 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
        <button type="button" onclick="setDetailTab('all')" id="detail-tab-all" class="detail-tab-btn px-3 py-1.5 rounded-lg font-bold bg-white text-slate-900 shadow-2xs whitespace-nowrap">Vista Completa</button>
        <button type="button" onclick="setDetailTab('schedule')" id="detail-tab-schedule" class="detail-tab-btn px-3 py-1.5 rounded-lg font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 whitespace-nowrap">Calendario Pagos</button>
        <button type="button" onclick="setDetailTab('payments')" id="detail-tab-payments" class="detail-tab-btn px-3 py-1.5 rounded-lg font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 whitespace-nowrap">Abonos & Váuchers</button>
        <button type="button" onclick="setDetailTab('expenses')" id="detail-tab-expenses" class="detail-tab-btn px-3 py-1.5 rounded-lg font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 whitespace-nowrap inline-flex items-center gap-1">
          <span>Gastos & Facturas</span>
          <span id="detailExpensesCountBadge" class="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-rose-100 text-rose-800">0</span>
        </button>
        <button type="button" onclick="setDetailTab('contract-doc')" id="detail-tab-contract-doc" class="detail-tab-btn px-3 py-1.5 rounded-lg font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 whitespace-nowrap">Contrato Firmado</button>
        <button type="button" onclick="setDetailTab('invoice')" id="detail-tab-invoice" class="detail-tab-btn px-3 py-1.5 rounded-lg font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 whitespace-nowrap">Factura SUNAT</button>
      </div>

      <!-- Scrollable content -->
      <div class="p-6 overflow-y-auto flex-1 space-y-6">

        <!-- Banner de Cancelación 100% si aplica -->
        <div id="paidBanner" class="hidden bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            </div>
            <div>
              <h4 class="text-sm font-bold text-emerald-900">¡Contrato 100% Pagado!</h4>
              <p class="text-xs text-emerald-700">El saldo pendiente es S/ 0.00. Puedes cambiar el estado a "CONTRATO PAGADO Y CONCLUIDO".</p>
            </div>
          </div>
          <button onclick="changeStatusToCompleted()" class="px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs shrink-0">
            Concluir Contrato
          </button>
        </div>

        <!-- ALERTA DE VENCIMIENTO / PRÓXIMO COBRO -->
        <div id="detailAlertBannerContainer"></div>

        <!-- 1. RESUMEN FINANCIERO & RENTABILIDAD -->
        <div id="detailSectionFinancials" class="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3.5">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-center sm:text-left">
            <div class="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Monto Contratado Total</span>
              <span id="detailTotalAmount" class="text-lg font-bold text-slate-900 font-mono">S/ 0.00</span>
            </div>
            <div class="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
              <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block">Total Cobrado (Ingresos)</span>
              <span id="detailTotalPaid" class="text-lg font-bold text-emerald-700 font-mono">S/ 0.00</span>
            </div>
            <div class="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
              <span class="text-[11px] font-bold uppercase tracking-wider text-rose-600 block">Gastos Totales de Obra</span>
              <span id="detailTotalExpenses" class="text-lg font-bold text-rose-700 font-mono">S/ 0.00</span>
            </div>
            <div class="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
              <span class="text-[11px] font-bold uppercase tracking-wider text-amber-600 block">Saldo Pendiente por Cobrar</span>
              <span id="detailPendingBalance" class="text-lg font-bold text-amber-700 font-mono">S/ 0.00</span>
            </div>
          </div>

          <!-- Ganancia Neta Realizada y Proyectada -->
          <div class="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div id="detailProfitIconBg" class="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 bg-emerald-600 shadow-md shadow-emerald-500/20">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/></svg>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Ganancia Neta Realizada (Cobrado - Gastos)</span>
                  <span id="detailProfitMarginBadge" class="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">0% margen</span>
                </div>
                <span id="detailNetProfit" class="text-2xl font-black font-mono text-emerald-800">S/ 0.00</span>
              </div>
            </div>
            <div class="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 w-full sm:w-auto">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Utilidad Proyectada al 100%</span>
              <span id="detailProjectedProfit" class="text-lg font-black text-slate-900 font-mono">S/ 0.00</span>
              <span class="text-[10px] text-slate-500 block">Margen estimado: <strong id="detailProjectedMargin">0%</strong></span>
            </div>
          </div>

          <!-- Barra de Progreso -->
          <div>
            <div class="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
              <span>Progreso de Pagos Realizados</span>
              <span id="detailProgressText">0%</span>
            </div>
            <div class="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div id="detailProgressBar" class="h-full bg-emerald-500 transition-all duration-300" style="width: 0%"></div>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-slate-700">Cambiar Estado Manualmente:</span>
              <select id="detailStatusSelect" onchange="handleStatusChange(this.value)" class="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white font-medium">
                <option value="EN_EJECUCION">En Ejecución (Con Saldo)</option>
                <option value="OBRA_TERMINADA">Obra Terminada (Pendiente Cobro)</option>
                <option value="PAGADO_CONCLUIDO">Contrato Pagado y Concluido</option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <button id="viewContractFileBtn" class="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold inline-flex items-center gap-1">
                Ver Contrato Firmado
              </button>
            </div>
          </div>
        </div>

        <!-- SECCIÓN: DOCUMENTO DEL CONTRATO FIRMADO (SUBIR / REEMPLAZAR / VER) -->
        <div id="detailSectionContractDoc" class="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-sky-500"></span>
              Documento del Contrato Firmado (PDF o Imagen)
            </h4>
            <span id="detailContractBadge" class="text-[11px] font-semibold px-2 py-0.5 rounded-full"></span>
          </div>
          <input type="file" id="detailContractFileInput" accept="application/pdf,image/*" onchange="handleDetailContractUpload(event)" class="hidden">
          <div id="detailContractFileContainer"></div>
        </div>

        <!-- SECCIÓN: CALENDARIO Y CRONOGRAMA DE PAGOS -->
        <div id="detailSectionSchedule" class="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <h4 class="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
                Calendario y Cronograma de Pagos del Cliente
              </h4>
              <p class="text-xs text-slate-500">Fechas de vencimiento y montos pactados para cuotas o valorizaciones</p>
            </div>
            <button onclick="toggleScheduleForm()" class="px-3 py-1.5 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg inline-flex items-center gap-1 shadow-2xs self-start sm:self-auto">
              + Agregar Cuota
            </button>
          </div>

          <form id="scheduleItemForm" onsubmit="handleAddScheduleItem(event)" class="hidden bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Concepto / Hito *</label>
                <input type="text" id="scheduleTitle" required placeholder="ej. Anticipo 30% o Valorización 2" class="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white">
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Fecha de Pago Pactada *</label>
                <input type="date" id="scheduleDueDate" required class="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white">
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Monto a Cobrar (S/) *</label>
                <input type="number" step="0.01" min="0.50" id="scheduleAmount" required placeholder="0.00" class="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono font-bold">
              </div>
            </div>
            <div class="flex justify-end gap-2">
              <button type="button" onclick="toggleScheduleForm()" class="px-3 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg">Cancelar</button>
              <button type="submit" class="px-4 py-1 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg">Guardar Cuota</button>
            </div>
          </form>

          <div id="detailScheduleContainer" class="space-y-2"></div>
        </div>

        <!-- 2. REGISTRO DE ABONOS Y COMPROBANTES -->
        <div id="detailSectionPayments" class="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              Registro de Abonos / Pagos Parciales (Yape / Banco)
            </h4>
            <span class="text-xs text-slate-500 font-medium" id="abonosCountText">0 abonos registrados</span>
          </div>

          <!-- Formulario rápido de abono -->
          <form id="abonoForm" onsubmit="handleAddAbono(event)" class="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">Fecha Pago *</label>
              <input type="date" id="abonoDate" required class="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white">
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">Monto Abonado (S/) *</label>
              <input type="number" step="0.01" min="0.50" id="abonoAmount" required placeholder="0.00" class="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono font-bold">
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">Medio de Pago *</label>
              <select id="abonoMethod" class="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium">
                <option value="Yape">Yape</option>
                <option value="Plin">Plin</option>
                <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">N° Operación / Ref.</label>
              <input type="text" id="abonoReference" placeholder="ej. OP-104928" class="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono">
            </div>
            <div class="sm:col-span-2 lg:col-span-1">
              <label class="block text-[11px] font-bold text-slate-700 mb-1">Váucher (Foto/PDF)</label>
              <input type="file" id="abonoFile" accept="image/*,application/pdf" capture="environment" class="w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-sky-100 file:text-sky-800">
            </div>
            <div class="sm:col-span-2 lg:col-span-5 flex justify-end gap-2 pt-1">
              <button type="submit" class="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs inline-flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                Registrar Abono
              </button>
            </div>
          </form>

          <!-- Tabla histórica de abonos -->
          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left">
              <thead class="text-[11px] uppercase bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th class="px-3 py-2">Fecha</th>
                  <th class="px-3 py-2">Medio</th>
                  <th class="px-3 py-2">N° Operación</th>
                  <th class="px-3 py-2 text-right">Monto</th>
                  <th class="px-3 py-2 text-center">Comprobante</th>
                  <th class="px-3 py-2 text-right">Acción</th>
                </tr>
              </thead>
              <tbody id="abonosTableBody" class="divide-y divide-slate-100">
                <!-- Injected via JS -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- 3. REGISTRO DE GASTOS Y FACTURAS DE OBRA -->
        <div id="detailSectionExpenses" class="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <h4 class="text-sm font-bold text-slate-900">Registro de Gastos y Facturas de Obra</h4>
                <span id="detailExpensesCountHeader" class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">0 gastos</span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">Registra compras de materiales, planillas, alquileres y adjunta facturas/boletas escaneadas o fotos</p>
            </div>
            <button type="button" onclick="toggleExpenseForm()" class="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg inline-flex items-center gap-1 shadow-2xs self-start sm:self-auto">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              <span>+ Nuevo Gasto</span>
            </button>
          </div>

          <!-- Rentabilidad Box del Contrato (Ingresos vs Gastos vs Utilidad) -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-[10px] uppercase font-bold text-slate-500 block">Ingresos Cobrados</span>
              <span id="expBoxTotalPaid" class="text-base font-bold font-mono text-emerald-700">S/ 0.00</span>
              <span class="text-[10px] text-slate-400 block mt-0.5">Abonos recibidos</span>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-[10px] uppercase font-bold text-rose-700 block">Gastos Totales</span>
              <span id="expBoxTotalExpenses" class="text-base font-bold font-mono text-rose-700">S/ 0.00</span>
              <span class="text-[10px] text-slate-400 block mt-0.5">Costos ejecutados</span>
            </div>
            <div id="expBoxProfitCard" class="p-3 rounded-xl border bg-emerald-50 border-emerald-300">
              <div class="flex items-center justify-between">
                <span class="text-[10px] uppercase font-bold text-slate-800">Ganancia Neta Real</span>
                <span id="expBoxMargin" class="text-[10px] font-bold text-emerald-800">0% margen</span>
              </div>
              <span id="expBoxNetProfit" class="text-base font-black font-mono text-emerald-800">S/ 0.00</span>
              <span class="text-[10px] text-slate-500 block mt-0.5">Cobrado - Gastos</span>
            </div>
          </div>

          <!-- Formulario Agregar Gasto -->
          <form id="expenseForm" onsubmit="handleAddExpense(event)" class="hidden bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div class="flex items-center justify-between pb-1 border-b border-slate-200">
              <span class="text-xs font-bold text-slate-800 uppercase tracking-wider">Nuevo Comprobante de Gasto</span>
              <span class="text-[11px] text-slate-500">* Obligatorios</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Fecha del Gasto *</label>
                <input type="date" id="expenseDate" required class="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white">
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Rubro / Categoría *</label>
                <select id="expenseCategory" required class="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium">
                  <option value="MATERIALES">Materiales & Insumos</option>
                  <option value="MANO_DE_OBRA">Mano de Obra & Planillas</option>
                  <option value="EQUIPOS_HERRAMIENTAS">Equipos & Maquinaria</option>
                  <option value="TRANSPORTE_LOGISTICA">Transporte, Fletes & Combustible</option>
                  <option value="SUBCONTRATOS">Subcontratos Externos</option>
                  <option value="OTROS">Otros Gastos de Obra</option>
                </select>
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Monto Gastado (S/) *</label>
                <input type="number" step="0.01" min="0.10" id="expenseAmount" required placeholder="0.00" class="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono font-bold text-rose-700">
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Medio de Pago *</label>
                <select id="expensePaymentMethod" required class="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium">
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  <option value="Yape">Yape</option>
                  <option value="Plin">Plin</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Proveedor / Empresa</label>
                <input type="text" id="expenseSupplier" placeholder="ej. Ferretería El Maestro S.A.C." class="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white">
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">N° Factura / Boleta / Recibo</label>
                <input type="text" id="expenseInvoiceNumber" placeholder="ej. F001-008920 o B002-14" class="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono">
              </div>
              <div class="sm:col-span-2">
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Concepto / Descripción del Gasto *</label>
                <input type="text" id="expenseDescription" required placeholder="ej. Compra de 40 bolsas de cemento Sol y aditivo" class="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white">
              </div>
              <div class="sm:col-span-2 lg:col-span-3">
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Adjuntar Factura de Gasto (PDF o Foto del comprobante)</label>
                <input type="file" id="expenseInvoiceFile" accept="image/*,application/pdf" capture="environment" class="w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-rose-100 file:text-rose-800">
              </div>
              <div class="sm:col-span-2 lg:col-span-1">
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Notas internas</label>
                <input type="text" id="expenseNotes" placeholder="ej. Maestro Juan" class="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white">
              </div>
            </div>

            <div class="flex justify-end gap-2 pt-1 border-t border-slate-200">
              <button type="button" onclick="toggleExpenseForm()" class="px-3 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg">Cancelar</button>
              <button type="submit" class="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs inline-flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                Guardar Gasto & Comprobante
              </button>
            </div>
          </form>

          <!-- Tabla de Gastos -->
          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left">
              <thead class="text-[11px] uppercase bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th class="px-3 py-2">Fecha</th>
                  <th class="px-3 py-2">Rubro</th>
                  <th class="px-3 py-2">Concepto & Proveedor</th>
                  <th class="px-3 py-2">N° Factura</th>
                  <th class="px-3 py-2">Medio</th>
                  <th class="px-3 py-2 text-right">Monto</th>
                  <th class="px-3 py-2 text-center">Factura Adjunta</th>
                  <th class="px-3 py-2 text-right">Acción</th>
                </tr>
              </thead>
              <tbody id="expensesTableBody" class="divide-y divide-slate-100">
                <!-- Injected via JS -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- 4. ADJUNTAR FACTURA ELECTRÓNICA FINAL -->
        <div id="detailSectionInvoice" class="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-sky-500"></span>
              Factura Electrónica Final
            </h4>
            <span id="invoiceStatusBadge" class="text-[11px] font-semibold px-2 py-0.5 rounded-full"></span>
          </div>

          <form id="invoiceForm" onsubmit="handleSaveInvoice(event)" class="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">N° de Factura Emitida</label>
              <input type="text" id="invoiceNumber" placeholder="ej. F001-00452 o E001-89" class="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono font-bold">
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">Fecha de Emisión</label>
              <input type="date" id="invoiceDate" class="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white">
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">Archivo Factura (PDF/Imagen)</label>
              <input type="file" id="invoiceFile" accept="application/pdf,image/*" class="w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-sky-100 file:text-sky-800">
            </div>
            <div class="sm:col-span-3">
              <label class="block text-[11px] font-bold text-slate-700 mb-1">Notas de Facturación / Detracción / SUNAT</label>
              <input type="text" id="invoiceNotes" placeholder="ej. Sujeto a detracción SPOT 4% o Retención de IGV 3%" class="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white">
            </div>
            <div class="sm:col-span-3 flex justify-end gap-2 pt-1">
              <button id="viewInvoiceDocBtn" type="button" class="hidden px-3 py-1.5 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg inline-flex items-center gap-1">
                Ver Factura Adjunta
              </button>
              <button type="submit" class="px-4 py-1.5 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-lg shadow-xs">
                Guardar Factura
              </button>
            </div>
          </form>
        </div>

      </div>

      <!-- Footer -->
      <div class="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
        <button onclick="confirmDeleteCurrentContract()" class="text-xs text-red-600 hover:text-red-700 font-semibold inline-flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          Eliminar Contrato
        </button>
        <button onclick="closeDetailModal()" class="px-5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-lg">
          Listo / Cerrar
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL: VISOR DE DOCUMENTOS / COMPROBANTES -->
  <div id="viewerModal" class="fixed inset-0 z-60 hidden bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-700 flex flex-col max-h-[90vh]">
      <div class="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
        <div class="flex items-center gap-2 truncate pr-4">
          <svg class="w-5 h-5 text-sky-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          <span id="viewerTitle" class="text-xs sm:text-sm font-bold truncate">Visor de Documento</span>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <a id="viewerDownloadBtn" download="documento" class="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Descargar
          </a>
          <button onclick="closeViewerModal()" class="text-slate-400 hover:text-white p-1 rounded-lg">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
      <div id="viewerContent" class="flex-1 p-4 bg-slate-900/90 overflow-auto flex items-center justify-center min-h-[350px]">
        <!-- Image or iframe injected here -->
      </div>
    </div>
  </div>

  <!-- JAVASCRIPT ES6 INTEGRADO -->
  <script>
    // --- ESTADO GLOBAL ---
    let contracts = [];
    let currentFilter = 'ALL';
    let searchQuery = '';
    let activeContractId = null;
    let currentDashboardTab = 'contracts'; // 'contracts' | 'profit-summary'
    let currentDetailTab = 'all'; // 'all' | 'schedule' | 'payments' | 'expenses' | 'contract-doc' | 'invoice'

    function setDashboardTab(tab) {
      currentDashboardTab = tab;
      const contractsBtn = document.getElementById('tab-contracts-btn');
      const profitBtn = document.getElementById('tab-profit-btn');
      const contractsSection = document.getElementById('contractsViewSection');
      const profitSection = document.getElementById('globalProfitViewSection');

      if (tab === 'profit-summary') {
        if (contractsBtn) contractsBtn.className = 'px-4 py-2 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 bg-white text-slate-600 hover:bg-slate-100 border border-slate-200';
        if (profitBtn) profitBtn.className = 'px-4 py-2 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 bg-slate-900 text-white shadow-xs';
        if (contractsSection) contractsSection.classList.add('hidden');
        if (profitSection) {
          profitSection.classList.remove('hidden');
          renderGlobalProfitSummary();
        }
      } else {
        if (contractsBtn) contractsBtn.className = 'px-4 py-2 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 bg-slate-900 text-white shadow-xs';
        if (profitBtn) profitBtn.className = 'px-4 py-2 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 bg-white text-slate-600 hover:bg-slate-100 border border-slate-200';
        if (contractsSection) contractsSection.classList.remove('hidden');
        if (profitSection) profitSection.classList.add('hidden');
        renderContracts();
      }
    }

    function setDetailTab(tab) {
      currentDetailTab = tab;
      document.querySelectorAll('.detail-tab-btn').forEach(btn => {
        btn.classList.remove('bg-white', 'text-slate-900', 'shadow-2xs');
        btn.classList.add('text-slate-600', 'hover:text-slate-900', 'hover:bg-slate-200/60');
      });
      const activeBtn = document.getElementById('detail-tab-' + tab);
      if (activeBtn) {
        activeBtn.classList.remove('text-slate-600', 'hover:text-slate-900', 'hover:bg-slate-200/60');
        activeBtn.classList.add('bg-white', 'text-slate-900', 'shadow-2xs');
      }

      const sFin = document.getElementById('detailSectionFinancials');
      const sDoc = document.getElementById('detailSectionContractDoc');
      const sSch = document.getElementById('detailSectionSchedule');
      const sPay = document.getElementById('detailSectionPayments');
      const sExp = document.getElementById('detailSectionExpenses');
      const sInv = document.getElementById('detailSectionInvoice');

      if (tab === 'all') {
        if (sFin) sFin.classList.remove('hidden');
        if (sDoc) sDoc.classList.remove('hidden');
        if (sSch) sSch.classList.remove('hidden');
        if (sPay) sPay.classList.remove('hidden');
        if (sExp) sExp.classList.remove('hidden');
        if (sInv) sInv.classList.remove('hidden');
      } else {
        if (sFin) sFin.classList.toggle('hidden', tab !== 'schedule' && tab !== 'payments' && tab !== 'expenses');
        if (sDoc) sDoc.classList.toggle('hidden', tab !== 'contract-doc');
        if (sSch) sSch.classList.toggle('hidden', tab !== 'schedule');
        if (sPay) sPay.classList.toggle('hidden', tab !== 'payments');
        if (sExp) sExp.classList.toggle('hidden', tab !== 'expenses');
        if (sInv) sInv.classList.toggle('hidden', tab !== 'invoice');
      }
    }

    const DB_NAME = 'ObraControlDB';
    const DB_STORE = 'contracts';

    // --- BASE DE DATOS LOCAL (IndexedDB + fallback localStorage) ---
    function openDB() {
      return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
          resolve(null);
          return;
        }
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(DB_STORE)) {
            db.createObjectStore(DB_STORE, { keyPath: 'id' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });
    }

    async function loadAllContracts() {
      try {
        const db = await openDB();
        if (db) {
          const tx = db.transaction(DB_STORE, 'readonly');
          const store = tx.objectStore(DB_STORE);
          const req = store.getAll();
          req.onsuccess = () => {
            contracts = req.result || [];
            if (contracts.length === 0) {
              const local = localStorage.getItem('obra_control_contracts_v1');
              contracts = local ? JSON.parse(local) : [];
            }
            renderApp();
          };
          req.onerror = () => {
            fallbackLoad();
          };
        } else {
          fallbackLoad();
        }
      } catch (e) {
        fallbackLoad();
      }
    }

    function fallbackLoad() {
      const local = localStorage.getItem('obra_control_contracts_v1');
      contracts = local ? JSON.parse(local) : [];
      renderApp();
    }

    async function saveContractToStorage(contract) {
      localStorage.setItem('obra_control_contracts_v1', JSON.stringify(contracts));
      try {
        const db = await openDB();
        if (db) {
          const tx = db.transaction(DB_STORE, 'readwrite');
          tx.objectStore(DB_STORE).put(contract);
        }
      } catch (e) {
        console.warn(e);
      }
    }

    async function deleteContractFromStorage(id) {
      contracts = contracts.filter(c => c.id !== id);
      localStorage.setItem('obra_control_contracts_v1', JSON.stringify(contracts));
      try {
        const db = await openDB();
        if (db) {
          const tx = db.transaction(DB_STORE, 'readwrite');
          tx.objectStore(DB_STORE).delete(id);
        }
      } catch (e) {
        console.warn(e);
      }
    }

    // --- FORMATEADORES ---
    function formatMoney(amount) {
      return 'S/ ' + (Number(amount) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function formatDate(dateStr) {
      if (!dateStr) return '-';
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return parts[2] + '/' + parts[1] + '/' + parts[0];
      }
      return dateStr;
    }

    function calculateFinancials(contract) {
      const total = Number(contract.totalAmount) || 0;
      const totalPaid = (contract.payments || []).reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
      const pending = Math.max(0, total - totalPaid);
      const percent = total > 0 ? Math.min(100, Math.round((totalPaid / total) * 100)) : 0;
      const totalExpenses = (contract.expenses || []).reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
      const expenseCount = (contract.expenses || []).length;
      const netProfit = totalPaid - totalExpenses;
      const profitMarginPercent = totalPaid > 0 ? Math.round((netProfit / totalPaid) * 100) : 0;
      const projectedProfit = total - totalExpenses;
      const projectedMarginPercent = total > 0 ? Math.round((projectedProfit / total) * 100) : 0;
      return { 
        total, 
        totalPaid, 
        pending, 
        percent, 
        isFullyPaid: pending <= 0.01 && total > 0,
        totalExpenses,
        expenseCount,
        netProfit,
        profitMarginPercent,
        projectedProfit,
        projectedMarginPercent
      };
    }

    // --- RENDER APP & KPIS ---
    function renderApp() {
      renderKPIs();
      renderContracts();
      renderGlobalProfitSummary();
    }

    function renderKPIs() {
      const totalCount = contracts.length;
      const totalContracted = contracts.reduce((acc, c) => acc + (Number(c.totalAmount) || 0), 0);
      let totalCobrado = 0;
      let totalExpensesGlobal = 0;
      contracts.forEach(c => {
        (c.payments || []).forEach(p => totalCobrado += (Number(p.amount) || 0));
        (c.expenses || []).forEach(e => totalExpensesGlobal += (Number(e.amount) || 0));
      });
      const pendingCobro = Math.max(0, totalContracted - totalCobrado);
      const globalPercent = totalContracted > 0 ? Math.round((totalCobrado / totalContracted) * 100) : 0;
      const globalNetProfit = totalCobrado - totalExpensesGlobal;
      const globalProfitMargin = totalCobrado > 0 ? Math.round((globalNetProfit / totalCobrado) * 100) : 0;

      const contractsBadge = document.getElementById('contractsTabCountBadge');
      if (contractsBadge) contractsBadge.innerText = totalCount;

      function getContractPaymentAlerts(contract) {
        const schedule = contract.paymentSchedule || [];
        const unpaid = schedule.filter(item => !item.isPaid);
        if (unpaid.length === 0) {
          return { hasOverdue: false, overdueCount: 0, overdueTotal: 0, overdueItems: [], hasUpcoming: false, upcomingCount: 0, upcomingTotal: 0, upcomingItems: [] };
        }
        const today = new Date();
        today.setHours(0,0,0,0);
        const mapped = unpaid.map(item => {
          const due = new Date(item.dueDate);
          due.setHours(0,0,0,0);
          const daysDiff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return { item, daysDiff };
        });
        const overdueItems = mapped.filter(m => m.daysDiff < 0).sort((a,b) => a.daysDiff - b.daysDiff);
        const upcomingItems = mapped.filter(m => m.daysDiff >= 0 && m.daysDiff <= 14).sort((a,b) => a.daysDiff - b.daysDiff);
        return {
          hasOverdue: overdueItems.length > 0,
          overdueCount: overdueItems.length,
          overdueTotal: overdueItems.reduce((acc, c) => acc + (c.item.amount || 0), 0),
          overdueItems,
          hasUpcoming: upcomingItems.length > 0,
          upcomingCount: upcomingItems.length,
          upcomingTotal: upcomingItems.reduce((acc, c) => acc + (c.item.amount || 0), 0),
          upcomingItems
        };
      }

      // Check global alerts
      let totalOverdueCount = 0;
      let totalOverdueAmount = 0;
      let totalUpcomingCount = 0;
      let totalUpcomingAmount = 0;

      contracts.filter(c => c.status !== 'PAGADO_CONCLUIDO').forEach(c => {
        const a = getContractPaymentAlerts(c);
        if (a.hasOverdue) {
          totalOverdueCount += a.overdueCount;
          totalOverdueAmount += a.overdueTotal;
        }
        if (a.hasUpcoming) {
          totalUpcomingCount += a.upcomingCount;
          totalUpcomingAmount += a.upcomingTotal;
        }
      });

      const overdueBtn = document.getElementById('filter-OVERDUE');
      const upcomingBtn = document.getElementById('filter-UPCOMING');
      if (overdueBtn) {
        if (totalOverdueCount > 0) {
          overdueBtn.classList.remove('hidden');
          const badge = document.getElementById('overdueCountBadge');
          if (badge) badge.innerText = totalOverdueCount;
        } else {
          overdueBtn.classList.add('hidden');
        }
      }
      if (upcomingBtn) {
        if (totalUpcomingCount > 0) {
          upcomingBtn.classList.remove('hidden');
          const badge = document.getElementById('upcomingCountBadge');
          if (badge) badge.innerText = totalUpcomingCount;
        } else {
          upcomingBtn.classList.add('hidden');
        }
      }

      const alertContainer = document.getElementById('alertsBannerContainer');
      if (alertContainer) {
        if (totalOverdueCount > 0 || totalUpcomingCount > 0) {
          alertContainer.innerHTML = \`
            <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-3.5 rounded-xl border \${totalOverdueCount > 0 ? 'bg-red-50 border-red-200 text-red-900' : 'bg-slate-50 border-slate-200 text-slate-600'}">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold uppercase tracking-wider">\${totalOverdueCount > 0 ? '⚠️ Pagos Vencidos' : 'Pagos al Día'}</span>
                  <span class="text-xs font-mono font-bold">\${formatMoney(totalOverdueAmount)}</span>
                </div>
                <p class="text-xs mt-1">\${totalOverdueCount > 0 ? totalOverdueCount + ' cuota(s) vencida(s) en calendario. Clic en el filtro de arriba para gestionar.' : 'Sin vencimientos pendientes.'}</p>
              </div>
              <div class="p-3.5 rounded-xl border \${totalUpcomingCount > 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-600'}">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold uppercase tracking-wider">📅 Próximos Cobros (14 Días)</span>
                  <span class="text-xs font-mono font-bold">\${formatMoney(totalUpcomingAmount)}</span>
                </div>
                <p class="text-xs mt-1">\${totalUpcomingCount > 0 ? totalUpcomingCount + ' hito(s) programados para cobro en los próximos 14 días.' : 'Sin cuotas próximas.'}</p>
              </div>
            </div>
          \`;
        } else {
          alertContainer.innerHTML = '';
        }
      }

      const container = document.getElementById('kpiContainer');
      container.innerHTML = \`
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div class="flex items-center justify-between text-slate-500 mb-1">
            <span class="text-xs font-bold uppercase tracking-wider">Contratos Registrados</span>
            <div class="p-2 bg-slate-100 rounded-lg text-slate-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
          </div>
          <div class="text-2xl font-bold text-slate-900">\${totalCount}</div>
          <p class="text-xs text-slate-500 mt-1">\${contracts.filter(c => c.status === 'PAGADO_CONCLUIDO').length} concluidos</p>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div class="flex items-center justify-between text-slate-500 mb-1">
            <span class="text-xs font-bold uppercase tracking-wider">Total Contratado</span>
            <div class="p-2 bg-sky-50 rounded-lg text-sky-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
          </div>
          <div class="text-2xl font-bold text-slate-900 font-mono">\${formatMoney(totalContracted)}</div>
          <p class="text-xs text-slate-500 mt-1">Cartera de proyectos</p>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div class="flex items-center justify-between text-slate-500 mb-1">
            <span class="text-xs font-bold uppercase tracking-wider">Total Cobrado</span>
            <div class="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
          </div>
          <div class="text-2xl font-bold text-emerald-700 font-mono">\${formatMoney(totalCobrado)}</div>
          <div class="flex items-center gap-1.5 mt-1">
            <div class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full bg-emerald-500" style="width: \${globalPercent}%"></div>
            </div>
            <span class="text-xs font-bold text-emerald-600">\${globalPercent}%</span>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div class="flex items-center justify-between text-slate-500 mb-1">
            <span class="text-xs font-bold uppercase tracking-wider">Cuentas por Cobrar</span>
            <div class="p-2 bg-amber-50 rounded-lg text-amber-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
          </div>
          <div class="text-2xl font-bold text-amber-700 font-mono">\${formatMoney(pendingCobro)}</div>
          <p class="text-xs text-amber-600 mt-1 font-semibold">Saldos por liquidar</p>
        </div>

        <div onclick="setDashboardTab('profit-summary')" class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs cursor-pointer hover:border-emerald-300 transition-colors">
          <div class="flex items-center justify-between text-slate-500 mb-1">
            <span class="text-xs font-bold uppercase tracking-wider text-emerald-800">Ganancia Neta Real</span>
            <div class="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
            </div>
          </div>
          <div class="text-2xl font-black \${globalNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'} font-mono">\${formatMoney(globalNetProfit)}</div>
          <div class="flex items-center justify-between text-xs mt-1">
            <span class="text-slate-500">Gastos: <strong class="text-rose-600">\${formatMoney(totalExpensesGlobal)}</strong></span>
            <span class="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">\${globalProfitMargin}% margen</span>
          </div>
        </div>
      \`;
    }

    function renderContracts() {
      const grid = document.getElementById('contractsGrid');
      const emptyState = document.getElementById('emptyState');

      const filtered = contracts.filter(c => {
        const a = getContractPaymentAlerts(c);
        let matchesStatus = true;
        if (currentFilter === 'ALL') matchesStatus = true;
        else if (currentFilter === 'OVERDUE') matchesStatus = a.hasOverdue && c.status !== 'PAGADO_CONCLUIDO';
        else if (currentFilter === 'UPCOMING') matchesStatus = a.hasUpcoming && c.status !== 'PAGADO_CONCLUIDO';
        else matchesStatus = c.status === currentFilter;

        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = !q || 
          c.contractNumber.toLowerCase().includes(q) ||
          c.clientName.toLowerCase().includes(q) ||
          (c.location && c.location.toLowerCase().includes(q)) ||
          (c.docNumber && c.docNumber.toLowerCase().includes(q)) ||
          (c.description && c.description.toLowerCase().includes(q));
        return matchesStatus && matchesSearch;
      });

      if (filtered.length === 0) {
        grid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
      }

      emptyState.classList.add('hidden');

      grid.innerHTML = filtered.map(c => {
        const fin = calculateFinancials(c);
        const a = getContractPaymentAlerts(c);

        let badgeHtml = '';
        if (c.status === 'PAGADO_CONCLUIDO') {
          badgeHtml = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> PAGADO Y CONCLUIDO</span>';
        } else if (c.status === 'OBRA_TERMINADA') {
          badgeHtml = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> OBRA CONCLUIDA (PENDIENTE)</span>';
        } else {
          badgeHtml = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3"/></svg> EN EJECUCIÓN (CON SALDO)</span>';
        }

        let alertBadge = '';
        let cardAlertHtml = '';
        let cardBorder = 'border-slate-200';
        if (a.hasOverdue && c.status !== 'PAGADO_CONCLUIDO') {
          cardBorder = 'border-red-300 border-l-4 border-l-red-500 shadow-rose-50';
          alertBadge = '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse">⚠️ PAGO VENCIDO</span>';
          cardAlertHtml = \`
            <div class="mt-2.5 p-2 bg-red-50 border border-red-200 rounded-lg text-xs flex items-center justify-between">
              <span class="text-red-800 font-bold truncate">⚠️ Vencido (\${Math.abs(a.overdueItems[0].daysDiff)}d): \${a.overdueItems[0].item.title}</span>
              <span class="font-mono font-bold text-red-900 shrink-0 ml-1">\${formatMoney(a.overdueItems[0].item.amount)}</span>
            </div>
          \`;
        } else if (a.hasUpcoming && c.status !== 'PAGADO_CONCLUIDO') {
          cardBorder = 'border-indigo-300 border-l-4 border-l-indigo-500';
          alertBadge = '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">📅 PRÓXIMO COBRO</span>';
          cardAlertHtml = \`
            <div class="mt-2.5 p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-xs flex items-center justify-between">
              <span class="text-indigo-800 font-bold truncate">📅 \${a.upcomingItems[0].daysDiff === 0 ? '¡Vence Hoy!' : 'Vence en ' + a.upcomingItems[0].daysDiff + 'd'}: \${a.upcomingItems[0].item.title}</span>
              <span class="font-mono font-bold text-indigo-900 shrink-0 ml-1">\${formatMoney(a.upcomingItems[0].item.amount)}</span>
            </div>
          \`;
        }

        return \`
          <div class="bg-white rounded-xl border \${cardBorder} p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div class="flex items-start justify-between gap-2 mb-2">
                <span class="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">\${c.contractNumber}</span>
                <div class="flex flex-col items-end gap-1">
                  \${badgeHtml}
                  \${alertBadge}
                </div>
              </div>

              <h3 class="text-sm font-bold text-slate-900 line-clamp-1">\${c.clientName}</h3>
              <p class="text-xs text-slate-500 font-mono mt-0.5">\${c.docType}: \${c.docNumber || '-'} | Tel: \${c.phone || '-'}</p>
              
              <p class="text-xs text-slate-600 mt-2 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">\${c.description}</p>

              \${cardAlertHtml}

              <!-- Avance financiero -->
              <div class="mt-4 pt-3 border-t border-slate-100">
                <div class="flex justify-between items-center text-xs mb-1">
                  <span class="font-semibold text-slate-500">Cobrado (\${fin.percent}%)</span>
                  <span class="font-mono font-bold text-emerald-700">\${formatMoney(fin.totalPaid)}</span>
                </div>
                <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div class="h-full bg-emerald-500" style="width: \${fin.percent}%"></div>
                </div>

                <div class="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                  <div>
                    <span class="text-[10px] uppercase font-bold text-slate-500 block">Monto Contrato</span>
                    <span class="font-bold text-slate-900 font-mono">\${formatMoney(fin.total)}</span>
                  </div>
                  <div class="text-right">
                    <span class="text-[10px] uppercase font-bold text-amber-600 block">Saldo Pendiente</span>
                    <span class="font-bold font-mono \${fin.pending > 0 ? 'text-amber-700' : 'text-emerald-700'}">\${formatMoney(fin.pending)}</span>
                  </div>
                </div>

                <div class="mt-2 grid grid-cols-2 gap-2 text-xs bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                  <div>
                    <span class="text-[10px] uppercase font-bold text-rose-600 block">Gastos (\${fin.expenseCount})</span>
                    <span class="font-bold text-rose-700 font-mono">\${formatMoney(fin.totalExpenses)}</span>
                  </div>
                  <div class="text-right">
                    <span class="text-[10px] uppercase font-bold text-emerald-800 block">Ganancia Neta (\${fin.profitMarginPercent}%)</span>
                    <span class="font-bold font-mono \${fin.netProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'}">\${formatMoney(fin.netProfit)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div class="flex items-center gap-1 text-[11px] text-slate-500">
                <span class="\${c.contractFile ? 'text-emerald-600 font-semibold' : 'text-slate-400'}">📄 Contrato</span>
                <span>•</span>
                <span class="\${c.invoice ? 'text-sky-600 font-semibold' : 'text-slate-400'}">🧾 Factura</span>
              </div>
              <button onclick="openDetailModal('\${c.id}')" class="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs inline-flex items-center gap-1">
                Ver Ficha
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        \`;
      }).join('');
    }

    // --- FILTROS Y BÚSQUEDA ---
    function handleSearch(val) {
      searchQuery = val;
      renderContracts();
    }

    function setFilter(status) {
      currentFilter = status;
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('bg-sky-600', 'text-white');
        btn.classList.add('bg-slate-100', 'text-slate-600');
      });
      const activeBtn = document.getElementById('filter-' + status);
      if (activeBtn) {
        activeBtn.classList.remove('bg-slate-100', 'text-slate-600');
        activeBtn.classList.add('bg-sky-600', 'text-white');
      }
      renderContracts();
    }

    // --- MODAL NUEVO CONTRATO ---
    function openNewContractModal() {
      document.getElementById('contractModalTitle').innerText = 'Registrar Nuevo Contrato';
      document.getElementById('contractId').value = '';
      document.getElementById('contractForm').reset();
      
      const year = new Date().getFullYear();
      const nextNum = 'CONT-' + year + '-' + String(contracts.length + 1).padStart(3, '0');
      document.getElementById('formContractNumber').value = nextNum;
      
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('formStartDate').value = today;

      document.getElementById('contractFileCurrent').innerText = '';
      document.getElementById('contractModal').classList.remove('hidden');
    }

    function closeContractModal() {
      document.getElementById('contractModal').classList.add('hidden');
    }

    async function handleSaveContract(e) {
      e.preventDefault();
      const id = document.getElementById('contractId').value || 'cont-' + Date.now();
      const existing = contracts.find(c => c.id === id);

      const contractNumber = document.getElementById('formContractNumber').value.trim();
      const totalAmount = parseFloat(document.getElementById('formTotalAmount').value);
      const clientName = document.getElementById('formClientName').value.trim();
      const docType = document.getElementById('formDocType').value;
      const docNumber = document.getElementById('formDocNumber').value.trim();
      const phone = document.getElementById('formPhone').value.trim();
      const description = document.getElementById('formDescription').value.trim();
      const startDate = document.getElementById('formStartDate').value;
      const estimatedEndDate = document.getElementById('formEstimatedEndDate').value;

      let contractFile = existing ? existing.contractFile : null;
      const fileInput = document.getElementById('formContractFile');
      if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        const base64 = await readFileAsBase64(file);
        contractFile = {
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: base64,
          uploadedAt: new Date().toISOString()
        };
      }

      const contract = {
        id,
        contractNumber,
        totalAmount,
        clientName,
        docType,
        docNumber,
        phone,
        description,
        startDate,
        estimatedEndDate,
        status: existing ? existing.status : 'EN_EJECUCION',
        contractFile,
        payments: existing ? existing.payments : [],
        invoice: existing ? existing.invoice : null,
        createdAt: existing ? existing.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const idx = contracts.findIndex(c => c.id === id);
      if (idx >= 0) {
        contracts[idx] = contract;
      } else {
        contracts.unshift(contract);
      }

      await saveContractToStorage(contract);
      closeContractModal();
      renderApp();
      if (activeContractId === id) {
        openDetailModal(id);
      }
    }

    // --- MODAL DETALLE / FICHA DEL CONTRATO ---
    function openDetailModal(id) {
      const contract = contracts.find(c => c.id === id);
      if (!contract) return;
      activeContractId = id;

      const fin = calculateFinancials(contract);

      document.getElementById('detailContractCode').innerText = contract.contractNumber;
      document.getElementById('detailClientName').innerText = contract.clientName + ' (' + contract.docType + ': ' + contract.docNumber + ')';

      const badge = document.getElementById('detailStatusBadge');
      if (contract.status === 'PAGADO_CONCLUIDO') {
        badge.className = 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300';
        badge.innerText = 'CONTRATO PAGADO Y CONCLUIDO';
      } else if (contract.status === 'OBRA_TERMINADA') {
        badge.className = 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300';
        badge.innerText = 'OBRA CONCLUIDA (PENDIENTE COBRO)';
      } else {
        badge.className = 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300';
        badge.innerText = 'EN EJECUCIÓN (CON SALDO)';
      }

      document.getElementById('detailTotalAmount').innerText = formatMoney(fin.total);
      document.getElementById('detailTotalPaid').innerText = formatMoney(fin.totalPaid);
      document.getElementById('detailPendingBalance').innerText = formatMoney(fin.pending);
      document.getElementById('detailProgressText').innerText = fin.percent + '% pagado';
      document.getElementById('detailProgressBar').style.width = fin.percent + '%';

      // Gastos y Utilidad Neta Real
      const detExpEl = document.getElementById('detailTotalExpenses');
      if (detExpEl) detExpEl.innerText = formatMoney(fin.totalExpenses);

      const detNetEl = document.getElementById('detailNetProfit');
      if (detNetEl) {
        detNetEl.innerText = formatMoney(fin.netProfit);
        detNetEl.className = fin.netProfit >= 0 ? 'text-2xl font-black font-mono text-emerald-800' : 'text-2xl font-black font-mono text-rose-700';
      }

      const detMargEl = document.getElementById('detailProfitMarginBadge');
      if (detMargEl) {
        detMargEl.innerText = fin.profitMarginPercent + '% margen';
        detMargEl.className = fin.netProfit >= 0
          ? 'text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300'
          : 'text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300';
      }

      const detProjEl = document.getElementById('detailProjectedProfit');
      if (detProjEl) detProjEl.innerText = formatMoney(fin.projectedProfit);

      const detProjMarg = document.getElementById('detailProjectedMargin');
      if (detProjMarg) detProjMarg.innerText = fin.projectedMarginPercent + '%';

      // Rentabilidad Box (Gastos Section)
      const expBoxPaid = document.getElementById('expBoxTotalPaid');
      if (expBoxPaid) expBoxPaid.innerText = formatMoney(fin.totalPaid);

      const expBoxExp = document.getElementById('expBoxTotalExpenses');
      if (expBoxExp) expBoxExp.innerText = formatMoney(fin.totalExpenses);

      const expBoxProf = document.getElementById('expBoxNetProfit');
      if (expBoxProf) {
        expBoxProf.innerText = formatMoney(fin.netProfit);
        expBoxProf.className = fin.netProfit >= 0 ? 'text-base font-black font-mono text-emerald-800' : 'text-base font-black font-mono text-rose-700';
      }

      const expBoxMarg = document.getElementById('expBoxMargin');
      if (expBoxMarg) expBoxMarg.innerText = fin.profitMarginPercent + '% margen';

      const expBoxCard = document.getElementById('expBoxProfitCard');
      if (expBoxCard) {
        expBoxCard.className = fin.netProfit >= 0 ? 'p-3 rounded-xl border bg-emerald-50 border-emerald-300' : 'p-3 rounded-xl border bg-rose-50 border-rose-300';
      }

      const expBadge = document.getElementById('detailExpensesCountBadge');
      if (expBadge) expBadge.innerText = fin.expenseCount;

      const expHeader = document.getElementById('detailExpensesCountHeader');
      if (expHeader) expHeader.innerText = fin.expenseCount + ' gasto(s)';

      // Reset expense form
      const expDate = document.getElementById('expenseDate');
      if (expDate) expDate.value = new Date().toISOString().split('T')[0];
      const expAmt = document.getElementById('expenseAmount');
      if (expAmt) expAmt.value = '';
      const expSup = document.getElementById('expenseSupplier');
      if (expSup) expSup.value = '';
      const expInvN = document.getElementById('expenseInvoiceNumber');
      if (expInvN) expInvN.value = '';
      const expDesc = document.getElementById('expenseDescription');
      if (expDesc) expDesc.value = '';
      const expFile = document.getElementById('expenseInvoiceFile');
      if (expFile) expFile.value = '';
      const expNotes = document.getElementById('expenseNotes');
      if (expNotes) expNotes.value = '';

      document.getElementById('detailStatusSelect').value = contract.status;

      // Banner 100%
      const paidBanner = document.getElementById('paidBanner');
      if (fin.isFullyPaid && contract.status !== 'PAGADO_CONCLUIDO') {
        paidBanner.classList.remove('hidden');
      } else {
        paidBanner.classList.add('hidden');
      }

      // Alerta de Vencimiento / Próximo Cobro en Ficha
      const alerts = getContractPaymentAlerts(contract);
      const alertContainer = document.getElementById('detailAlertBannerContainer');
      if (alertContainer) {
        if (alerts.hasOverdue && contract.status !== 'PAGADO_CONCLUIDO' && alerts.overdueItems.length > 0) {
          alertContainer.innerHTML = \`
            <div class="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs mb-4">
              <div>
                <span class="font-bold text-red-900 text-sm block">⚠️ ¡Alerta! \${alerts.overdueCount} Hito(s) de Pago Vencido(s)</span>
                <span class="text-red-700">Total vencido: <strong>\${formatMoney(alerts.overdueTotal)}</strong>. El más urgente: "\${alerts.overdueItems[0].item.title}" venció hace \${Math.abs(alerts.overdueItems[0].daysDiff)} días (\${formatDate(alerts.overdueItems[0].item.dueDate)}).</span>
              </div>
              <button onclick="cobrarScheduleItem('\${alerts.overdueItems[0].item.id}')" class="px-3.5 py-1.5 font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shrink-0 shadow-xs">Cobrar Hito Ahora</button>
            </div>
          \`;
        } else if (alerts.hasUpcoming && contract.status !== 'PAGADO_CONCLUIDO' && alerts.upcomingItems.length > 0) {
          alertContainer.innerHTML = \`
            <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs mb-4">
              <div>
                <span class="font-bold text-indigo-950 text-sm block">📅 Próximo Cobro Programado en Calendario</span>
                <span class="text-indigo-800">Hito "\${alerts.upcomingItems[0].item.title}" vence \${alerts.upcomingItems[0].daysDiff === 0 ? '¡Hoy mismo!' : 'en ' + alerts.upcomingItems[0].daysDiff + ' días'} (\${formatDate(alerts.upcomingItems[0].item.dueDate)}) por <strong>\${formatMoney(alerts.upcomingItems[0].item.amount)}</strong>.</span>
              </div>
              <button onclick="cobrarScheduleItem('\${alerts.upcomingItems[0].item.id}')" class="px-3.5 py-1.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shrink-0 shadow-xs">Cobrar Hito</button>
            </div>
          \`;
        } else {
          alertContainer.innerHTML = '';
        }
      }

      // Contrato firmado button
      const viewContBtn = document.getElementById('viewContractFileBtn');
      if (contract.contractFile) {
        viewContBtn.classList.remove('hidden');
        viewContBtn.onclick = () => viewDocument(contract.contractFile.dataUrl, 'Contrato Firmado: ' + contract.contractNumber, contract.contractFile.name, contract.contractFile.type);
      } else {
        viewContBtn.classList.add('hidden');
      }

      // Reset abono form
      document.getElementById('abonoDate').value = new Date().toISOString().split('T')[0];
      document.getElementById('abonoAmount').value = '';
      document.getElementById('abonoReference').value = '';
      document.getElementById('abonoFile').value = '';

      renderContractFileSection(contract);
      renderPaymentScheduleSection(contract);
      renderAbonosTable(contract);
      renderInvoiceSection(contract);
      renderExpensesSection(contract);
      setDetailTab('all');

      document.getElementById('detailModal').classList.remove('hidden');
    }

    function closeDetailModal() {
      document.getElementById('detailModal').classList.add('hidden');
      activeContractId = null;
    }

    function renderContractFileSection(contract) {
      const badge = document.getElementById('detailContractBadge');
      const container = document.getElementById('detailContractFileContainer');

      if (contract.contractFile) {
        badge.className = 'text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800';
        badge.innerText = 'Contrato Adjunto';

        container.innerHTML = \`
          <div class="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div class="flex items-center gap-3 overflow-hidden">
              <div class="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 border border-sky-200">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </div>
              <div class="overflow-hidden">
                <p class="text-xs font-bold text-slate-900 truncate">\${contract.contractFile.name}</p>
                <p class="text-[11px] text-slate-500 mt-0.5">\${formatDate(contract.contractFile.uploadedAt || '')}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="viewDocument('\${contract.contractFile.dataUrl}', 'Contrato: \${contract.contractNumber}', '\${contract.contractFile.name}', '\${contract.contractFile.type}')" class="px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700">Ver</button>
              <a href="\${contract.contractFile.dataUrl}" download="\${contract.contractFile.name}" class="px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700">Descargar</a>
              <button onclick="document.getElementById('detailContractFileInput').click()" class="px-3 py-1.5 text-xs font-bold bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded-lg text-sky-700">Reemplazar PDF</button>
              <button onclick="removeContractFile()" class="p-1.5 text-slate-400 hover:text-red-600 rounded" title="Quitar documento">✕</button>
            </div>
          </div>
        \`;
      } else {
        badge.className = 'text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800';
        badge.innerText = 'Pendiente de Subir';

        container.innerHTML = \`
          <div onclick="document.getElementById('detailContractFileInput').click()" class="border-2 border-dashed border-slate-300 hover:border-sky-500 hover:bg-sky-50/40 rounded-xl p-6 text-center cursor-pointer transition-all">
            <svg class="w-8 h-8 text-sky-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
            <h5 class="text-xs font-bold text-slate-800">Haz clic para subir el Contrato Firmado (PDF o Imagen)</h5>
            <p class="text-[11px] text-slate-500 mt-1">Puedes adjuntar el documento escaneado en cualquier momento.</p>
            <button type="button" class="mt-3 px-4 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg">Seleccionar Archivo PDF</button>
          </div>
        \`;
      }
    }

    async function handleDetailContractUpload(e) {
      const contract = contracts.find(c => c.id === activeContractId);
      if (!contract) return;

      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const base64 = await readFileAsBase64(file);
      contract.contractFile = {
        name: file.name,
        type: file.type || 'application/pdf',
        size: file.size,
        dataUrl: base64,
        uploadedAt: new Date().toISOString()
      };

      await saveContractToStorage(contract);
      renderApp();
      openDetailModal(activeContractId);
      alert('¡Contrato firmado subido y guardado con éxito!');
      e.target.value = '';
    }

    async function removeContractFile() {
      if (!confirm('¿Deseas quitar el contrato adjunto?')) return;
      const contract = contracts.find(c => c.id === activeContractId);
      if (!contract) return;

      contract.contractFile = null;
      await saveContractToStorage(contract);
      renderApp();
      openDetailModal(activeContractId);
    }

    // --- CRONOGRAMA Y CALENDARIO DE PAGOS ---
    function toggleScheduleForm() {
      const f = document.getElementById('scheduleItemForm');
      f.classList.toggle('hidden');
      if (!f.classList.contains('hidden')) {
        document.getElementById('scheduleTitle').value = '';
        document.getElementById('scheduleDueDate').value = '';
        document.getElementById('scheduleAmount').value = '';
      }
    }

    function renderPaymentScheduleSection(contract) {
      const container = document.getElementById('detailScheduleContainer');
      const schedule = contract.paymentSchedule || [];

      if (schedule.length === 0) {
        container.innerHTML = \`
          <div class="text-center py-5 bg-slate-50 rounded-xl border border-dashed border-slate-300 p-4">
            <p class="text-xs font-bold text-slate-700">Sin fechas de pago programadas</p>
            <p class="text-[11px] text-slate-500 mt-0.5">Agrega las fechas pactadas para cuotas o valorizaciones con el botón superior.</p>
          </div>
        \`;
        return;
      }

      const today = new Date();
      today.setHours(0,0,0,0);

      container.innerHTML = schedule.map(item => {
        const due = new Date(item.dueDate);
        due.setHours(0,0,0,0);
        const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        let badge = '';
        let rowClass = 'bg-white border-slate-200';
        if (item.isPaid) {
          badge = '<span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">Pagado</span>';
          rowClass = 'bg-emerald-50/40 border-emerald-200';
        } else if (diffDays < 0) {
          badge = \`<span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-800">Vencido (\${Math.abs(diffDays)}d)</span>\`;
          rowClass = 'bg-red-50/40 border-red-300';
        } else if (diffDays === 0) {
          badge = '<span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900">¡Vence hoy!</span>';
          rowClass = 'bg-amber-50/50 border-amber-300';
        } else {
          badge = \`<span class="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-sky-50 text-sky-800">Vence en \${diffDays}d</span>\`;
        }

        const payBtn = !item.isPaid ? \`<button onclick="cobrarScheduleItem('\${item.id}')" class="px-2 py-1 text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded">Cobrar</button>\` : '';

        return \`
          <div class="p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 \${rowClass}">
            <div class="flex items-center gap-2.5">
              <button onclick="handleToggleSchedulePaid('\${item.id}')" class="w-5 h-5 rounded border \${item.isPaid ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-300 bg-white'} flex items-center justify-center text-xs">
                \${item.isPaid ? '✓' : ''}
              </button>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-slate-800">\${item.title}</span>
                  \${badge}
                </div>
                <p class="text-[11px] text-slate-500">Fecha pactada: \${formatDate(item.dueDate)}</p>
              </div>
            </div>
            <div class="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
              <span class="font-mono font-bold text-xs \${item.isPaid ? 'line-through text-slate-400' : 'text-slate-900'}">\${formatMoney(item.amount)}</span>
              <div class="flex items-center gap-1.5">
                \${payBtn}
                <button onclick="handleDeleteScheduleItem('\${item.id}')" class="p-1 text-slate-400 hover:text-red-600 rounded">✕</button>
              </div>
            </div>
          </div>
        \`;
      }).join('');
    }

    async function handleAddScheduleItem(e) {
      e.preventDefault();
      const contract = contracts.find(c => c.id === activeContractId);
      if (!contract) return;

      const title = document.getElementById('scheduleTitle').value.trim();
      const dueDate = document.getElementById('scheduleDueDate').value;
      const amount = parseFloat(document.getElementById('scheduleAmount').value);

      if (!contract.paymentSchedule) contract.paymentSchedule = [];
      contract.paymentSchedule.push({
        id: 'sch-' + Date.now(),
        title,
        dueDate,
        amount,
        isPaid: false
      });
      contract.paymentSchedule.sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

      await saveContractToStorage(contract);
      renderApp();
      openDetailModal(activeContractId);
      toggleScheduleForm();
    }

    async function handleToggleSchedulePaid(itemId) {
      const contract = contracts.find(c => c.id === activeContractId);
      if (!contract || !contract.paymentSchedule) return;

      contract.paymentSchedule = contract.paymentSchedule.map(item => {
        if (item.id === itemId) return { ...item, isPaid: !item.isPaid };
        return item;
      });

      await saveContractToStorage(contract);
      renderApp();
      openDetailModal(activeContractId);
    }

    async function handleDeleteScheduleItem(itemId) {
      if (!confirm('¿Eliminar esta cuota del cronograma?')) return;
      const contract = contracts.find(c => c.id === activeContractId);
      if (!contract || !contract.paymentSchedule) return;

      contract.paymentSchedule = contract.paymentSchedule.filter(item => item.id !== itemId);
      await saveContractToStorage(contract);
      renderApp();
      openDetailModal(activeContractId);
    }

    function cobrarScheduleItem(itemId) {
      const contract = contracts.find(c => c.id === activeContractId);
      if (!contract || !contract.paymentSchedule) return;
      const item = contract.paymentSchedule.find(s => s.id === itemId);
      if (!item) return;

      document.getElementById('abonoAmount').value = item.amount.toFixed(2);
      document.getElementById('abonoReference').value = item.title;
      document.getElementById('abonoDate').value = new Date().toISOString().split('T')[0];

      const formEl = document.getElementById('abonoForm');
      if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function renderAbonosTable(contract) {
      const tbody = document.getElementById('abonosTableBody');
      const payments = contract.payments || [];
      document.getElementById('abonosCountText').innerText = payments.length + ' abono(s) registrado(s)';

      if (payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-3 py-6 text-center text-slate-400 italic">No hay abonos registrados para este contrato aún. Registra el primero arriba.</td></tr>';
        return;
      }

      tbody.innerHTML = payments.map(p => {
        let compHtml = '<span class="text-slate-300">-</span>';
        if (p.receiptFile) {
          compHtml = \`<button onclick="viewDocument('\${p.receiptFile.dataUrl}', 'Comprobante: \${p.reference || p.method}', '\${p.receiptFile.name}', '\${p.receiptFile.type}')" class="px-2 py-0.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded text-[11px] font-semibold inline-flex items-center gap-1 border border-sky-200">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg> Ver
          </button>\`;
        }

        return \`
          <tr class="hover:bg-slate-50/80">
            <td class="px-3 py-2.5 font-medium text-slate-700">\${formatDate(p.date)}</td>
            <td class="px-3 py-2.5">
              <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold \${p.method === 'Yape' ? 'bg-purple-100 text-purple-800' : p.method === 'Plin' ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-100 text-slate-700'}">\${p.method}</span>
            </td>
            <td class="px-3 py-2.5 font-mono text-slate-600">\${p.reference || '-'}</td>
            <td class="px-3 py-2.5 text-right font-mono font-bold text-slate-900">\${formatMoney(p.amount)}</td>
            <td class="px-3 py-2.5 text-center">\${compHtml}</td>
            <td class="px-3 py-2.5 text-right">
              <button onclick="deleteAbono('\${p.id}')" class="text-slate-400 hover:text-red-600 p-1 rounded" title="Eliminar abono">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </td>
          </tr>
        \`;
      }).join('');
    }

    async function handleAddAbono(e) {
      e.preventDefault();
      const contract = contracts.find(c => c.id === activeContractId);
      if (!contract) return;

      const date = document.getElementById('abonoDate').value;
      const amount = parseFloat(document.getElementById('abonoAmount').value);
      const method = document.getElementById('abonoMethod').value;
      const reference = document.getElementById('abonoReference').value.trim();

      let receiptFile = null;
      const fileInput = document.getElementById('abonoFile');
      if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        const base64 = await readFileAsBase64(file);
        receiptFile = {
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: base64,
          uploadedAt: new Date().toISOString()
        };
      }

      const payment = {
        id: 'pay-' + Date.now(),
        date,
        amount,
        method,
        reference,
        receiptFile,
        createdAt: new Date().toISOString()
      };

      if (!contract.payments) contract.payments = [];
      contract.payments.push(payment);

      // Si el saldo llega a 0, sugerir estado concluido
      const fin = calculateFinancials(contract);
      if (fin.isFullyPaid && contract.status === 'EN_EJECUCION') {
        contract.status = 'OBRA_TERMINADA';
      }

      await saveContractToStorage(contract);
      renderApp();
      openDetailModal(activeContractId);
    }

    async function deleteAbono(paymentId) {
      if (!confirm('¿Eliminar este abono registrado? Se recalculará el saldo pendiente.')) return;
      const contract = contracts.find(c => c.id === activeContractId);
      if (!contract) return;

      contract.payments = (contract.payments || []).filter(p => p.id !== paymentId);
      await saveContractToStorage(contract);
      renderApp();
      openDetailModal(activeContractId);
    }

    function renderInvoiceSection(contract) {
      const inv = contract.invoice;
      const badge = document.getElementById('invoiceStatusBadge');
      const viewBtn = document.getElementById('viewInvoiceDocBtn');

      if (inv && inv.invoiceNumber) {
        document.getElementById('invoiceNumber').value = inv.invoiceNumber;
        document.getElementById('invoiceDate').value = inv.issueDate || '';
        document.getElementById('invoiceNotes').value = inv.notes || '';
        badge.className = 'text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800';
        badge.innerText = 'Factura Registrada (' + inv.invoiceNumber + ')';

        if (inv.file) {
          viewBtn.classList.remove('hidden');
          viewBtn.onclick = () => viewDocument(inv.file.dataUrl, 'Factura: ' + inv.invoiceNumber, inv.file.name, inv.file.type);
        } else {
          viewBtn.classList.add('hidden');
        }
      } else {
        document.getElementById('invoiceNumber').value = '';
        document.getElementById('invoiceDate').value = '';
        document.getElementById('invoiceNotes').value = '';
        badge.className = 'text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500';
        badge.innerText = 'Pendiente de Emisión';
        viewBtn.classList.add('hidden');
      }
    }

    async function handleSaveInvoice(e) {
      e.preventDefault();
      const contract = contracts.find(c => c.id === activeContractId);
      if (!contract) return;

      const invoiceNumber = document.getElementById('invoiceNumber').value.trim();
      const issueDate = document.getElementById('invoiceDate').value;
      const notes = document.getElementById('invoiceNotes').value.trim();

      let file = contract.invoice ? contract.invoice.file : null;
      const fileInput = document.getElementById('invoiceFile');
      if (fileInput.files && fileInput.files[0]) {
        const f = fileInput.files[0];
        const base64 = await readFileAsBase64(f);
        file = {
          name: f.name,
          type: f.type,
          size: f.size,
          dataUrl: base64,
          uploadedAt: new Date().toISOString()
        };
      }

      contract.invoice = {
        invoiceNumber,
        issueDate,
        notes,
        file,
        updatedAt: new Date().toISOString()
      };

      await saveContractToStorage(contract);
      renderApp();
      openDetailModal(activeContractId);
      alert('Información de factura electrónica guardada con éxito.');
    }

    async function handleStatusChange(newStatus) {
      const contract = contracts.find(c => c.id === activeContractId);
      if (!contract) return;
      contract.status = newStatus;
      await saveContractToStorage(contract);
      renderApp();
      openDetailModal(activeContractId);
    }

    async function changeStatusToCompleted() {
      handleStatusChange('PAGADO_CONCLUIDO');
    }

    async function confirmDeleteCurrentContract() {
      if (confirm('¿Estás seguro de eliminar este contrato y todo su historial de comprobantes? Esta acción no se puede deshacer.')) {
        await deleteContractFromStorage(activeContractId);
        closeDetailModal();
        renderApp();
      }
    }

    // --- REGISTRO DE GASTOS Y FACTURAS DE OBRA ---
    function toggleExpenseForm() {
      const f = document.getElementById('expenseForm');
      if (!f) return;
      f.classList.toggle('hidden');
      if (!f.classList.contains('hidden')) {
        document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('expenseAmount').value = '';
        document.getElementById('expenseSupplier').value = '';
        document.getElementById('expenseInvoiceNumber').value = '';
        document.getElementById('expenseDescription').value = '';
        document.getElementById('expenseInvoiceFile').value = '';
        document.getElementById('expenseNotes').value = '';
        f.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    const CATEGORY_MAP = {
      MATERIALES: { label: 'Materiales & Insumos', cls: 'bg-amber-100 text-amber-800' },
      MANO_DE_OBRA: { label: 'Mano de Obra', cls: 'bg-blue-100 text-blue-800' },
      EQUIPOS_HERRAMIENTAS: { label: 'Equipos & Maq.', cls: 'bg-indigo-100 text-indigo-800' },
      TRANSPORTE_LOGISTICA: { label: 'Transporte & Fletes', cls: 'bg-cyan-100 text-cyan-800' },
      SUBCONTRATOS: { label: 'Subcontratos', cls: 'bg-purple-100 text-purple-800' },
      OTROS: { label: 'Otros Gastos', cls: 'bg-slate-100 text-slate-700' }
    };

    function renderExpensesSection(contract) {
      const tbody = document.getElementById('expensesTableBody');
      if (!tbody) return;
      const expenses = contract.expenses || [];

      if (expenses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="px-3 py-6 text-center text-slate-400 italic">No hay gastos ni facturas de compra registradas para esta obra aún. Registra el primero arriba.</td></tr>';
        return;
      }

      tbody.innerHTML = expenses.map(e => {
        const catInfo = CATEGORY_MAP[e.category] || { label: e.category, cls: 'bg-slate-100 text-slate-700' };

        let compHtml = '<span class="text-slate-300">-</span>';
        if (e.invoiceFile) {
          compHtml = \`
            <div class="flex items-center justify-center gap-1">
              <button onclick="viewDocument('\${e.invoiceFile.dataUrl}', 'Factura de Gasto: \${e.invoiceNumber || e.description}', '\${e.invoiceFile.name}', '\${e.invoiceFile.type}')" class="px-2 py-0.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-[11px] font-semibold inline-flex items-center gap-1 border border-rose-200">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg> Ver
              </button>
              <a href="\${e.invoiceFile.dataUrl}" download="\${e.invoiceFile.name}" class="p-1 text-slate-400 hover:text-slate-700 rounded" title="Descargar comprobante">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              </a>
            </div>
          \`;
        }

        return \`
          <tr class="hover:bg-slate-50/80">
            <td class="px-3 py-2.5 font-medium text-slate-700 whitespace-nowrap">\${formatDate(e.date)}</td>
            <td class="px-3 py-2.5 whitespace-nowrap">
              <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold \${catInfo.cls}">\${catInfo.label}</span>
            </td>
            <td class="px-3 py-2.5">
              <p class="font-bold text-slate-900 leading-tight">\${e.description}</p>
              \${e.supplier ? '<p class="text-[10px] text-slate-500 mt-0.5">Prov: ' + e.supplier + '</p>' : ''}
              \${e.notes ? '<p class="text-[10px] text-slate-400 italic mt-0.5">' + e.notes + '</p>' : ''}
            </td>
            <td class="px-3 py-2.5 font-mono text-slate-700 whitespace-nowrap">\${e.invoiceNumber ? '<span class="px-1.5 py-0.5 rounded bg-slate-100 font-bold">' + e.invoiceNumber + '</span>' : '<span class="text-slate-400 italic">Sin N°</span>'}</td>
            <td class="px-3 py-2.5 whitespace-nowrap text-slate-600 text-[11px]">\${e.paymentMethod || '-'}</td>
            <td class="px-3 py-2.5 text-right font-mono font-bold text-rose-700 whitespace-nowrap">\${formatMoney(e.amount)}</td>
            <td class="px-3 py-2.5 text-center whitespace-nowrap">\${compHtml}</td>
            <td class="px-3 py-2.5 text-right whitespace-nowrap">
              <button onclick="deleteExpense('\${e.id}')" class="text-slate-400 hover:text-red-600 p-1 rounded transition-colors" title="Eliminar gasto">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </td>
          </tr>
        \`;
      }).join('');
    }

    async function handleAddExpense(e) {
      e.preventDefault();
      const contract = contracts.find(c => c.id === activeContractId);
      if (!contract) return;

      const date = document.getElementById('expenseDate').value;
      const category = document.getElementById('expenseCategory').value;
      const amount = parseFloat(document.getElementById('expenseAmount').value);
      const paymentMethod = document.getElementById('expensePaymentMethod').value;
      const supplier = document.getElementById('expenseSupplier').value.trim();
      const invoiceNumber = document.getElementById('expenseInvoiceNumber').value.trim();
      const description = document.getElementById('expenseDescription').value.trim();
      const notes = document.getElementById('expenseNotes').value.trim();

      let invoiceFile = null;
      const fileInput = document.getElementById('expenseInvoiceFile');
      if (fileInput && fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        const base64 = await readFileAsBase64(file);
        invoiceFile = {
          name: file.name,
          type: file.type || 'image/jpeg',
          size: file.size,
          dataUrl: base64,
          uploadedAt: new Date().toISOString()
        };
      }

      const expense = {
        id: 'exp-' + Date.now(),
        date,
        category,
        amount,
        paymentMethod,
        supplier: supplier || undefined,
        invoiceNumber: invoiceNumber || undefined,
        description,
        invoiceFile,
        notes: notes || undefined,
        createdAt: new Date().toISOString()
      };

      if (!contract.expenses) contract.expenses = [];
      contract.expenses.push(expense);

      await saveContractToStorage(contract);
      renderApp();
      openDetailModal(activeContractId);
      toggleExpenseForm();
      alert('¡Gasto y factura adjunta guardados con éxito!');
    }

    async function deleteExpense(expenseId) {
      if (!confirm('¿Eliminar este registro de gasto y su factura adjunta? Se recalculará la rentabilidad del contrato.')) return;
      const contract = contracts.find(c => c.id === activeContractId);
      if (!contract) return;

      contract.expenses = (contract.expenses || []).filter(e => e.id !== expenseId);
      await saveContractToStorage(contract);
      renderApp();
      openDetailModal(activeContractId);
    }

    // --- RESUMEN GLOBAL DE RENTABILIDAD (TODOS LOS CONTRATOS) ---
    function renderGlobalProfitSummary() {
      const section = document.getElementById('globalProfitViewSection');
      if (!section) return;

      let totalContracted = 0;
      let totalCobrado = 0;
      let totalExpenses = 0;
      let totalInvoicesCount = 0;
      const categoryTotals = {
        MATERIALES: 0,
        MANO_DE_OBRA: 0,
        EQUIPOS_HERRAMIENTAS: 0,
        TRANSPORTE_LOGISTICA: 0,
        SUBCONTRATOS: 0,
        OTROS: 0
      };

      contracts.forEach(c => {
        totalContracted += (Number(c.totalAmount) || 0);
        (c.payments || []).forEach(p => totalCobrado += (Number(p.amount) || 0));
        (c.expenses || []).forEach(e => {
          const amt = (Number(e.amount) || 0);
          totalExpenses += amt;
          if (e.invoiceFile) totalInvoicesCount++;
          if (categoryTotals[e.category] !== undefined) {
            categoryTotals[e.category] += amt;
          } else {
            categoryTotals.OTROS += amt;
          }
        });
      });

      const netProfitGlobal = totalCobrado - totalExpenses;
      const profitMarginGlobal = totalCobrado > 0 ? Math.round((netProfitGlobal / totalCobrado) * 100) : 0;
      const pendingCobro = Math.max(0, totalContracted - totalCobrado);
      const projectedProfitGlobal = totalContracted - totalExpenses;
      const projectedMarginGlobal = totalContracted > 0 ? Math.round((projectedProfitGlobal / totalContracted) * 100) : 0;

      section.innerHTML = \`
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div class="flex items-center gap-2">
                <span class="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                </span>
                <h2 class="text-xl font-bold text-slate-900">Resumen Consolidado de Rentabilidad de Todos los Contratos</h2>
              </div>
              <p class="text-xs text-slate-500 mt-1">Comparativa completa de Ingresos Reales Cobrados vs Gastos de Obras = Ganancia Neta Real y Margen de Utilidad por Proyecto</p>
            </div>
            <button onclick="setDashboardTab('contracts')" class="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl self-start md:self-auto inline-flex items-center gap-1.5">
              <span>← Volver a Vista de Contratos</span>
            </button>
          </div>

          <!-- 5 CARDS RESUMEN DE RENTABILIDAD GLOBAL -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/60 shadow-2xs">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Total Contratado</span>
              <span class="text-xl font-bold font-mono text-slate-900 block mt-1">\${formatMoney(totalContracted)}</span>
              <span class="text-[11px] text-slate-500 mt-1 block">\${contracts.length} obras registradas</span>
            </div>

            <div class="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-2xs">
              <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">Ingresos Cobrados</span>
              <span class="text-xl font-bold font-mono text-emerald-700 block mt-1">\${formatMoney(totalCobrado)}</span>
              <span class="text-[11px] text-emerald-600 mt-1 block">\${totalContracted > 0 ? Math.round((totalCobrado / totalContracted) * 100) : 0}% de cartera cobrada</span>
            </div>

            <div class="p-4 rounded-xl border border-rose-200 bg-rose-50/40 shadow-2xs">
              <span class="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">Gastos Totales de Obra</span>
              <span class="text-xl font-bold font-mono text-rose-700 block mt-1">\${formatMoney(totalExpenses)}</span>
              <span class="text-[11px] text-rose-600 mt-1 block">\${totalInvoicesCount} facturas/boletas adjuntas</span>
            </div>

            <div class="p-4 rounded-xl border \${netProfitGlobal >= 0 ? 'border-emerald-300 bg-emerald-50' : 'border-rose-300 bg-rose-50'} shadow-2xs">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-black uppercase tracking-wider \${netProfitGlobal >= 0 ? 'text-emerald-900' : 'text-rose-900'}">Ganancia Neta Real</span>
                <span class="text-[10px] font-black px-1.5 py-0.5 rounded-full \${netProfitGlobal >= 0 ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'}">\${profitMarginGlobal}%</span>
              </div>
              <span class="text-xl font-black font-mono \${netProfitGlobal >= 0 ? 'text-emerald-800' : 'text-rose-800'} block mt-1">\${formatMoney(netProfitGlobal)}</span>
              <span class="text-[11px] text-slate-600 mt-1 block">Cobrado - Gastos reales</span>
            </div>

            <div class="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 shadow-2xs">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold uppercase tracking-wider text-indigo-900">Utilidad Proyectada</span>
                <span class="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">\${projectedMarginGlobal}%</span>
              </div>
              <span class="text-xl font-bold font-mono text-indigo-900 block mt-1">\${formatMoney(projectedProfitGlobal)}</span>
              <span class="text-[11px] text-indigo-700 mt-1 block">Saldo pendiente: \${formatMoney(pendingCobro)}</span>
            </div>
          </div>

          <!-- GASTOS POR RUBRO / CATEGORÍA -->
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-800 uppercase tracking-wider">Desglose de Gastos de Obras por Categoría</span>
              <span class="text-xs font-mono font-bold text-slate-700">Total: \${formatMoney(totalExpenses)}</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
              <div class="p-2.5 bg-white rounded-lg border border-slate-200">
                <span class="text-[10px] text-slate-500 block">Materiales</span>
                <span class="font-bold font-mono text-slate-900">\${formatMoney(categoryTotals.MATERIALES)}</span>
              </div>
              <div class="p-2.5 bg-white rounded-lg border border-slate-200">
                <span class="text-[10px] text-slate-500 block">Mano de Obra</span>
                <span class="font-bold font-mono text-slate-900">\${formatMoney(categoryTotals.MANO_DE_OBRA)}</span>
              </div>
              <div class="p-2.5 bg-white rounded-lg border border-slate-200">
                <span class="text-[10px] text-slate-500 block">Equipos & Maq.</span>
                <span class="font-bold font-mono text-slate-900">\${formatMoney(categoryTotals.EQUIPOS_HERRAMIENTAS)}</span>
              </div>
              <div class="p-2.5 bg-white rounded-lg border border-slate-200">
                <span class="text-[10px] text-slate-500 block">Transporte/Fletes</span>
                <span class="font-bold font-mono text-slate-900">\${formatMoney(categoryTotals.TRANSPORTE_LOGISTICA)}</span>
              </div>
              <div class="p-2.5 bg-white rounded-lg border border-slate-200">
                <span class="text-[10px] text-slate-500 block">Subcontratos</span>
                <span class="font-bold font-mono text-slate-900">\${formatMoney(categoryTotals.SUBCONTRATOS)}</span>
              </div>
              <div class="p-2.5 bg-white rounded-lg border border-slate-200">
                <span class="text-[10px] text-slate-500 block">Otros Gastos</span>
                <span class="font-bold font-mono text-slate-900">\${formatMoney(categoryTotals.OTROS)}</span>
              </div>
            </div>
          </div>

          <!-- TABLA CONSOLIDADA POR CADA CONTRATO -->
          <div class="space-y-3">
            <h3 class="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>Rentabilidad Detallada Proyecto por Proyecto</span>
              <span class="text-xs font-normal text-slate-500">\${contracts.length} contrato(s)</span>
            </h3>

            <div class="overflow-x-auto border border-slate-200 rounded-xl">
              <table class="w-full text-xs text-left">
                <thead class="text-[11px] uppercase bg-slate-900 text-slate-200 font-bold">
                  <tr>
                    <th class="px-3.5 py-3">Contrato & Cliente</th>
                    <th class="px-3 py-3 text-center">Estado</th>
                    <th class="px-3 py-3 text-right">Monto Contratado</th>
                    <th class="px-3 py-3 text-right">Ingresos Cobrados</th>
                    <th class="px-3 py-3 text-right">Gastos de Obra</th>
                    <th class="px-3 py-3 text-right">Ganancia Neta Real</th>
                    <th class="px-3 py-3 text-center">Margen %</th>
                    <th class="px-3 py-3 text-right">Utilidad Proyectada</th>
                    <th class="px-3 py-3 text-center">Facturas Gastos</th>
                    <th class="px-3 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 bg-white">
                  \${contracts.map(c => {
                    const fin = calculateFinancials(c);
                    const invoiceCount = (c.expenses || []).filter(e => e.invoiceFile).length;
                    return \`
                      <tr class="hover:bg-slate-50 transition-colors">
                        <td class="px-3.5 py-3">
                          <span class="font-mono font-bold text-slate-900">\${c.contractNumber}</span>
                          <p class="font-semibold text-slate-700 leading-tight">\${c.clientName}</p>
                          <p class="text-[11px] text-slate-500 line-clamp-1">\${c.description}</p>
                        </td>
                        <td class="px-3 py-3 text-center whitespace-nowrap">
                          <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold \${
                            c.status === 'PAGADO_CONCLUIDO' ? 'bg-emerald-100 text-emerald-800' :
                            c.status === 'OBRA_TERMINADA' ? 'bg-sky-100 text-sky-800' :
                            'bg-amber-100 text-amber-800'
                          }">
                            \${c.status === 'PAGADO_CONCLUIDO' ? 'Concluido' : c.status === 'OBRA_TERMINADA' ? 'Terminado' : 'En Ejecución'}
                          </span>
                        </td>
                        <td class="px-3 py-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">\${formatMoney(fin.total)}</td>
                        <td class="px-3 py-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">\${formatMoney(fin.totalPaid)}</td>
                        <td class="px-3 py-3 text-right font-mono font-bold text-rose-700 whitespace-nowrap">\${formatMoney(fin.totalExpenses)}</td>
                        <td class="px-3 py-3 text-right font-mono font-black whitespace-nowrap \${fin.netProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'}">\${formatMoney(fin.netProfit)}</td>
                        <td class="px-3 py-3 text-center whitespace-nowrap">
                          <span class="px-1.5 py-0.5 rounded text-[11px] font-bold font-mono \${fin.netProfit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                            \${fin.profitMarginPercent}%
                          </span>
                        </td>
                        <td class="px-3 py-3 text-right font-mono font-bold text-indigo-900 whitespace-nowrap">\${formatMoney(fin.projectedProfit)}</td>
                        <td class="px-3 py-3 text-center whitespace-nowrap">
                          <span class="px-2 py-0.5 rounded-full text-[11px] font-bold \${invoiceCount > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-500'}">
                            \${invoiceCount} doc(s)
                          </span>
                        </td>
                        <td class="px-3 py-3 text-right whitespace-nowrap">
                          <button onclick="openDetailModal('\${c.id}')" class="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg inline-flex items-center gap-1 shadow-xs">
                            Ver Ficha
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                          </button>
                        </td>
                      </tr>
                    \`;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      \`;
    }

    // --- VISOR DE DOCUMENTOS / VÁUCHERS ---
    function viewDocument(dataUrl, title, filename, mimeType) {
      document.getElementById('viewerTitle').innerText = title || 'Visor de Documento';
      const downloadBtn = document.getElementById('viewerDownloadBtn');
      downloadBtn.href = dataUrl;
      downloadBtn.download = filename || 'documento';

      const content = document.getElementById('viewerContent');
      if (mimeType && mimeType.includes('pdf') && !dataUrl.startsWith('data:image/svg')) {
        content.innerHTML = '<iframe src="' + dataUrl + '" class="w-full h-[65vh] rounded-lg border-0 bg-white"></iframe>';
      } else {
        content.innerHTML = '<img src="' + dataUrl + '" class="max-w-full max-h-[65vh] object-contain rounded-lg shadow-lg bg-white p-2" alt="Documento">';
      }

      document.getElementById('viewerModal').classList.remove('hidden');
    }

    function closeViewerModal() {
      document.getElementById('viewerModal').classList.add('hidden');
    }

    // --- UTILIDADES DE ARCHIVOS ---
    function readFileAsBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    // --- RESPALDO JSON & DATOS DEMO ---
    function exportBackup() {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(contracts, null, 2));
      const a = document.createElement('a');
      a.href = dataStr;
      a.download = 'ObraControl_Respaldo_' + new Date().toISOString().split('T')[0] + '.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    function importBackup(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const parsed = JSON.parse(evt.target.result);
          if (Array.isArray(parsed)) {
            contracts = parsed;
            localStorage.setItem('obra_control_contracts_v1', JSON.stringify(contracts));
            const db = await openDB();
            if (db) {
              const tx = db.transaction(DB_STORE, 'readwrite');
              tx.objectStore(DB_STORE).clear();
              contracts.forEach(c => tx.objectStore(DB_STORE).put(c));
            }
            renderApp();
            alert('¡Respaldo restaurado con éxito!');
          }
        } catch (err) {
          alert('Error al leer el archivo JSON.');
        }
      };
      reader.readAsText(file);
    }

    // Cargar datos de demostración
    function loadDemoData() {
      const sampleVoucherSvg = (title, amount, code, color) => {
        const s = \`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="700" viewBox="0 0 500 700"><rect width="500" height="700" fill="#f8fafc" rx="16"/><rect width="500" height="130" fill="\${color}" rx="16"/><text x="250" y="65" font-family="Arial" font-size="24" font-weight="bold" fill="#ffffff" text-anchor="middle">\${title}</text><text x="250" y="95" font-family="Arial" font-size="14" fill="#e2e8f0" text-anchor="middle">Constancia de Pago Digital</text><text x="250" y="220" font-family="Arial" font-size="16" fill="#64748b" text-anchor="middle">Monto Abonado</text><text x="250" y="270" font-family="Arial" font-size="38" font-weight="bold" fill="#0f172a" text-anchor="middle">\${amount}</text><rect x="40" y="320" width="420" height="1.5" fill="#e2e8f0"/><g transform="translate(50, 360)"><text x="0" y="0" font-family="Arial" font-size="13" fill="#64748b">N° Operación:</text><text x="400" y="0" font-family="Courier" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="end">\${code}</text><text x="0" y="40" font-family="Arial" font-size="13" fill="#64748b">Beneficiario:</text><text x="400" y="40" font-family="Arial" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="end">CONTRATISTA GENERAL</text><text x="0" y="80" font-family="Arial" font-size="13" fill="#64748b">Estado:</text><text x="400" y="80" font-family="Arial" font-size="13" font-weight="bold" fill="#059669" text-anchor="end">EXITOSO / CONFORME</text></g></svg>\`;
        return 'data:image/svg+xml;utf8,' + encodeURIComponent(s);
      };

      contracts = [
        {
          id: 'demo-1',
          contractNumber: 'CONT-2026-001',
          clientName: 'Constructora & Inmobiliaria Los Robles S.A.C.',
          docType: 'RUC',
          docNumber: '20601894231',
          phone: '+51 984 512 870',
          description: 'Instalación de sistema hidroneumático y tuberías en Edificio Los Robles (Etapa 2)',
          startDate: '2026-08-10',
          estimatedEndDate: '2026-10-25',
          totalAmount: 35000,
          status: 'EN_EJECUCION',
          contractFile: {
            name: 'Contrato_Firmado_CONT-2026-001.pdf',
            type: 'image/svg+xml',
            size: 28000,
            dataUrl: sampleVoucherSvg('Contrato Firmado', 'S/ 35,000.00', 'CONT-2026-001', '#0f172a'),
            uploadedAt: new Date().toISOString()
          },
          payments: [
            {
              id: 'p-1',
              date: '2026-08-12',
              amount: 5000,
              method: 'Yape',
              reference: 'OP-782914',
              receiptFile: {
                name: 'Voucher_Yape_S5000.jpg',
                type: 'image/svg+xml',
                size: 15000,
                dataUrl: sampleVoucherSvg('Yape Móvil', 'S/ 5,000.00', 'OP-782914', '#742284'),
                uploadedAt: new Date().toISOString()
              },
              createdAt: new Date().toISOString()
            },
            {
              id: 'p-2',
              date: '2026-09-04',
              amount: 12500,
              method: 'Transferencia Bancaria',
              reference: 'OP-BCP-9812',
              receiptFile: {
                name: 'Voucher_BCP_12500.pdf',
                type: 'image/svg+xml',
                size: 16000,
                dataUrl: sampleVoucherSvg('BCP Transferencia', 'S/ 12,500.00', 'OP-BCP-9812', '#002a8f'),
                uploadedAt: new Date().toISOString()
              },
              createdAt: new Date().toISOString()
            }
          ],
          expenses: [
            {
              id: 'exp-demo-1',
              date: '2026-08-14',
              category: 'MATERIALES',
              supplier: 'Distribuidora Hidráulica del Perú S.A.C.',
              invoiceNumber: 'F001-004512',
              description: 'Tuberías de PPR termo-fusión 2", codos 90° y válvulas esferas pesadas',
              amount: 3850,
              paymentMethod: 'Transferencia Bancaria',
              invoiceFile: {
                name: 'Factura_Materiales_PPR_F001-004512.pdf',
                type: 'image/svg+xml',
                size: 20000,
                dataUrl: sampleVoucherSvg('Factura F001-004512', 'S/ 3,850.00', 'F001-004512', '#be123c'),
                uploadedAt: new Date().toISOString()
              },
              notes: 'Materiales puestos en obra con guía de remisión N° 001-4412',
              createdAt: new Date().toISOString()
            },
            {
              id: 'exp-demo-2',
              date: '2026-08-30',
              category: 'MANO_DE_OBRA',
              supplier: 'Cuadrilla Maestro Juan Ramos',
              invoiceNumber: 'RH-002-140',
              description: 'Planilla quincenal de gasfiteros y montajistas hidroneumáticos',
              amount: 4200,
              paymentMethod: 'Yape',
              invoiceFile: {
                name: 'Recibo_Honorarios_ManoObra.pdf',
                type: 'image/svg+xml',
                size: 18000,
                dataUrl: sampleVoucherSvg('Recibo RH-002-140', 'S/ 4,200.00', 'RH-002-140', '#4338ca'),
                uploadedAt: new Date().toISOString()
              },
              notes: 'Pago quincena agosto con firma de cuaderno de asistencia',
              createdAt: new Date().toISOString()
            },
            {
              id: 'exp-demo-3',
              date: '2026-09-02',
              category: 'EQUIPOS_HERRAMIENTAS',
              supplier: 'Alquileres & Maquinarias San Jorge E.I.R.L.',
              invoiceNumber: 'F002-8841',
              description: 'Alquiler de termofusora industrial 110V y bomba de pruebas hidráulicas',
              amount: 1200,
              paymentMethod: 'Plin',
              invoiceFile: {
                name: 'Factura_Alquiler_Equipos.pdf',
                type: 'image/svg+xml',
                size: 19000,
                dataUrl: sampleVoucherSvg('Factura F002-8841', 'S/ 1,200.00', 'F002-8841', '#0e7490'),
                uploadedAt: new Date().toISOString()
              },
              notes: 'Semana completa de pruebas de estanqueidad de tuberías',
              createdAt: new Date().toISOString()
            }
          ],
          invoice: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'demo-2',
          contractNumber: 'CONT-2026-002',
          clientName: 'Alfaro & Asociados Inversiones S.A.C.',
          docType: 'RUC',
          docNumber: '20556789123',
          phone: '+51 991 234 567',
          description: 'Remodelación integral de oficinas administrativas, drywall y pintura general',
          startDate: '2026-08-01',
          estimatedEndDate: '2026-09-20',
          totalAmount: 18000,
          status: 'PAGADO_CONCLUIDO',
          contractFile: {
            name: 'Contrato_Alfaro_Firmado.pdf',
            type: 'image/svg+xml',
            size: 28000,
            dataUrl: sampleVoucherSvg('Contrato Alfaro', 'S/ 18,000.00', 'CONT-2026-002', '#0f172a'),
            uploadedAt: new Date().toISOString()
          },
          payments: [
            {
              id: 'p-3',
              date: '2026-08-02',
              amount: 9000,
              method: 'Yape',
              reference: 'OP-642199',
              receiptFile: {
                name: 'Voucher_Yape_9000.jpg',
                type: 'image/svg+xml',
                size: 15000,
                dataUrl: sampleVoucherSvg('Yape Empresas', 'S/ 9,000.00', 'OP-642199', '#742284'),
                uploadedAt: new Date().toISOString()
              },
              createdAt: new Date().toISOString()
            },
            {
              id: 'p-4',
              date: '2026-09-25',
              amount: 9000,
              method: 'Transferencia Bancaria',
              reference: 'OP-INT-3310',
              receiptFile: {
                name: 'Voucher_Interbank_9000.pdf',
                type: 'image/svg+xml',
                size: 16000,
                dataUrl: sampleVoucherSvg('Interbank Transferencia', 'S/ 9,000.00', 'OP-INT-3310', '#0039a6'),
                uploadedAt: new Date().toISOString()
              },
              createdAt: new Date().toISOString()
            }
          ],
          expenses: [
            {
              id: 'exp-demo-4',
              date: '2026-08-05',
              category: 'MATERIALES',
              supplier: 'Drywall & Placas del Centro S.A.C.',
              invoiceNumber: 'F001-09821',
              description: 'Placas de yeso ST 1/2", perfiles de acero galvanizado y masilla',
              amount: 5400,
              paymentMethod: 'Transferencia Bancaria',
              invoiceFile: {
                name: 'Factura_Drywall_F001-09821.pdf',
                type: 'image/svg+xml',
                size: 21000,
                dataUrl: sampleVoucherSvg('Factura F001-09821', 'S/ 5,400.00', 'F001-09821', '#be123c'),
                uploadedAt: new Date().toISOString()
              },
              notes: 'Entrega en piso 4 oficinas Miraflores',
              createdAt: new Date().toISOString()
            },
            {
              id: 'exp-demo-5',
              date: '2026-08-28',
              category: 'MANO_DE_OBRA',
              supplier: 'Equipo de Acabados & Pintura Los Olivos',
              invoiceNumber: 'RH-001-042',
              description: 'Mano de obra especializada en encintado, empaste y pintura general',
              amount: 3600,
              paymentMethod: 'Transferencia Bancaria',
              invoiceFile: {
                name: 'Recibo_Honorarios_Pintura.pdf',
                type: 'image/svg+xml',
                size: 18000,
                dataUrl: sampleVoucherSvg('Recibo RH-001-042', 'S/ 3,600.00', 'RH-001-042', '#4338ca'),
                uploadedAt: new Date().toISOString()
              },
              notes: 'Servicio concluido a entera conformidad del cliente',
              createdAt: new Date().toISOString()
            }
          ],
          invoice: {
            invoiceNumber: 'F001-000452',
            issueDate: '2026-09-28',
            notes: 'Factura electrónica emitida y cancelada 100%.',
            file: {
              name: 'Factura_F001-000452.pdf',
              type: 'image/svg+xml',
              size: 20000,
              dataUrl: sampleVoucherSvg('Factura F001-000452', 'S/ 18,000.00', 'F001-000452', '#0284c7'),
              uploadedAt: new Date().toISOString()
            },
            updatedAt: new Date().toISOString()
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      localStorage.setItem('obra_control_contracts_v1', JSON.stringify(contracts));
      renderApp();
      alert('¡Datos de demostración cargados con éxito!');
    }

    // Inicializar
    document.addEventListener('DOMContentLoaded', () => {
      loadAllContracts();
    });
  </script>
</body>
</html>`;
}
