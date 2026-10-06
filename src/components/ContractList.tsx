import React, { useState } from 'react';
import { Contract, ContractStatus } from '../types';
import { 
  formatCurrency, 
  formatDate, 
  calculateFinancials, 
  getContractPaymentAlerts,
  getGlobalPaymentAlerts
} from '../utils/formatters';
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar, 
  FileText, 
  Receipt, 
  ChevronRight, 
  Phone, 
  ArrowUpDown, 
  FileCheck,
  AlertTriangle,
  Send,
  Sparkles,
  FileDown,
  MapPin,
  X,
  Building,
  CalendarRange,
  Eye,
  Trash2,
  FolderOpen
} from 'lucide-react';

export type ExtendedFilter = 'ALL' | ContractStatus | 'OVERDUE' | 'UPCOMING';

interface ContractListProps {
  contracts: Contract[];
  onSelectContract: (contract: Contract) => void;
  onNewContract: () => void;
  onDeleteContract?: (id: string) => void;
  onLoadDemo: () => void;
  onOpenPdfModal?: () => void;
  currentFilter?: ExtendedFilter;
  onFilterChange?: (filter: ExtendedFilter) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  hideSearchInput?: boolean;
}

export const ContractList: React.FC<ContractListProps> = ({
  contracts,
  onSelectContract,
  onNewContract,
  onDeleteContract,
  onLoadDemo,
  onOpenPdfModal,
  currentFilter: externalFilter,
  onFilterChange: externalOnFilterChange,
  searchTerm: externalSearch,
  onSearchChange: externalOnSearchChange,
  hideSearchInput = false,
}) => {
  const [internalSearch, setInternalSearch] = useState('');
  const search = externalSearch !== undefined ? externalSearch : internalSearch;
  const setSearch = externalOnSearchChange || setInternalSearch;
  const [internalFilter, setInternalFilter] = useState<ExtendedFilter>('ALL');
  const [sortBy, setSortBy] = useState<'recent' | 'amount-high' | 'balance-high'>('recent');

  // Date Range Filtering State (Start Date vs Estimated End Date vs Active Period)
  const [dateFilterField, setDateFilterField] = useState<'startDate' | 'estimatedEndDate' | 'activeInPeriod'>('startDate');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);

  // Date Presets Handler
  const handleSetDatePreset = (preset: 'thisMonth' | 'nextMonth' | 'last3Months' | 'thisYear' | 'clear') => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();

    if (preset === 'clear') {
      setDateFrom('');
      setDateTo('');
      return;
    }

    const pad = (n: number) => String(n).padStart(2, '0');

    if (preset === 'thisMonth') {
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0);
      setDateFrom(`${y}-${pad(m + 1)}-01`);
      setDateTo(`${y}-${pad(m + 1)}-${pad(end.getDate())}`);
    } else if (preset === 'nextMonth') {
      const nextM = m + 1;
      const nextY = nextM > 11 ? y + 1 : y;
      const targetM = nextM % 12;
      const end = new Date(nextY, targetM + 1, 0);
      setDateFrom(`${nextY}-${pad(targetM + 1)}-01`);
      setDateTo(`${nextY}-${pad(targetM + 1)}-${pad(end.getDate())}`);
    } else if (preset === 'last3Months') {
      const startM = m - 2;
      const startY = startM < 0 ? y - 1 : y;
      const targetStartM = (startM + 12) % 12;
      const end = new Date(y, m + 1, 0);
      setDateFrom(`${startY}-${pad(targetStartM + 1)}-01`);
      setDateTo(`${y}-${pad(m + 1)}-${pad(end.getDate())}`);
    } else if (preset === 'thisYear') {
      setDateFrom(`${y}-01-01`);
      setDateTo(`${y}-12-31`);
    }
  };

  const activeFilter = externalFilter !== undefined ? externalFilter : internalFilter;
  const setStatusFilter = (f: ExtendedFilter) => {
    if (externalOnFilterChange) {
      externalOnFilterChange(f);
    } else {
      setInternalFilter(f);
    }
  };

  // Global alerts for badge counts
  const globalAlerts = getGlobalPaymentAlerts(contracts, 14);

  // Filter logic
  const filtered = contracts.filter((c) => {
    const alerts = getContractPaymentAlerts(c, 14);

    let matchesStatus = true;
    if (activeFilter === 'ALL') {
      matchesStatus = true;
    } else if (activeFilter === 'OVERDUE') {
      matchesStatus = alerts.hasOverdue && c.status !== 'PAGADO_CONCLUIDO';
    } else if (activeFilter === 'UPCOMING') {
      matchesStatus = alerts.hasUpcoming && c.status !== 'PAGADO_CONCLUIDO';
    } else {
      matchesStatus = c.status === activeFilter;
    }

    // Real-time search by clientName, contractNumber, location, docNumber, description
    const normalizeText = (text?: string): string => {
      if (!text) return '';
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    };

    const q = normalizeText(search.trim());
    const matchesSearch =
      !q ||
      normalizeText(c.clientName).includes(q) ||
      normalizeText(c.contractNumber).includes(q) ||
      normalizeText(c.location).includes(q) ||
      normalizeText(c.docNumber).includes(q) ||
      normalizeText(c.description).includes(q);

    // Date range filtering (by start date, end date, or active within period)
    let matchesDate = true;
    if (dateFrom || dateTo) {
      const contractStart = c.startDate ? c.startDate.slice(0, 10) : '';
      const contractEnd = c.estimatedEndDate ? c.estimatedEndDate.slice(0, 10) : '';

      if (dateFilterField === 'startDate') {
        if (dateFrom && contractStart && contractStart < dateFrom) matchesDate = false;
        if (dateTo && contractStart && contractStart > dateTo) matchesDate = false;
        if (!contractStart) matchesDate = false;
      } else if (dateFilterField === 'estimatedEndDate') {
        if (dateFrom && contractEnd && contractEnd < dateFrom) matchesDate = false;
        if (dateTo && contractEnd && contractEnd > dateTo) matchesDate = false;
        if (!contractEnd) matchesDate = false;
      } else if (dateFilterField === 'activeInPeriod') {
        // Active in period: starts on or before dateTo and ends on or after dateFrom
        if (dateTo && contractStart && contractStart > dateTo) matchesDate = false;
        if (dateFrom && contractEnd && contractEnd < dateFrom) matchesDate = false;
      }
    }

    return matchesStatus && matchesSearch && matchesDate;
  });

  // Extract distinct locations for quick search chips
  const distinctLocations = React.useMemo(() => {
    const set = new Set<string>();
    contracts.forEach((c) => {
      if (c.location && c.location.trim()) {
        // Extract district or general location e.g. "San Isidro", "Santiago de Surco", "Miraflores"
        const mainPart = c.location.split(',')[0].trim();
        if (mainPart) set.add(mainPart);
      }
    });
    return Array.from(set).slice(0, 5);
  }, [contracts]);

  // Sort logic
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'amount-high') {
      return (b.totalAmount || 0) - (a.totalAmount || 0);
    }
    if (sortBy === 'balance-high') {
      const balA = calculateFinancials(a).pendingBalance;
      const balB = calculateFinancials(b).pendingBalance;
      return balB - balA;
    }
    // 'recent' by creation date or start date
    return new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime();
  });

  // Status Badges
  const renderStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case 'PAGADO_CONCLUIDO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black font-mono bg-emerald-950/70 text-emerald-300 border border-emerald-500/50 shadow-2xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 stroke-[2.5]" />
            CONCLUIDO & PAGADO
          </span>
        );
      case 'OBRA_TERMINADA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black font-mono bg-sky-950/70 text-sky-300 border border-sky-500/50 shadow-2xs">
            <Clock className="w-3 h-3 text-sky-400 shrink-0 stroke-[2.5]" />
            OBRA ENTREGADA (POR COBRAR)
          </span>
        );
      case 'EN_EJECUCION':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black font-mono bg-amber-950/70 text-amber-300 border border-amber-500/50 shadow-2xs">
            <AlertCircle className="w-3 h-3 text-amber-400 shrink-0 stroke-[2.5]" />
            EN EJECUCIÓN (CON SALDO)
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search + Filters + Sort */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input with Clear Button and Result Counter */}
          {!hideSearchInput && (
            <div className="relative flex-1 max-w-lg">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4 text-sky-600" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por cliente, N° contrato o ubicación de obra (ej. San Isidro)..."
                className="block w-full pl-9 pr-24 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900 placeholder-slate-400 transition-all font-medium"
              />
              {search.trim() && (
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">
                    {filtered.length} {filtered.length === 1 ? 'coincidencia' : 'coincidencias'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
                    title="Borrar búsqueda"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Filter Pills with Overdue and Upcoming Indicators */}
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="text-xs font-semibold text-slate-500 mr-1 hidden sm:inline">Filtrar:</span>
            
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({contracts.length})
            </button>

          {/* Overdue Filter Flag */}
          {globalAlerts.totalOverdueCount > 0 && (
            <button
              onClick={() => setStatusFilter('OVERDUE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
                activeFilter === 'OVERDUE'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-300'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${activeFilter === 'OVERDUE' ? 'text-white' : 'text-red-600'}`} />
              <span>Vencidos ({globalAlerts.totalOverdueCount})</span>
            </button>
          )}

          {/* Upcoming Filter Flag */}
          {globalAlerts.totalUpcomingCount > 0 && (
            <button
              onClick={() => setStatusFilter('UPCOMING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
                activeFilter === 'UPCOMING'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <Clock className={`w-3.5 h-3.5 ${activeFilter === 'UPCOMING' ? 'text-white' : 'text-indigo-600'}`} />
              <span>Próximos ({globalAlerts.totalUpcomingCount})</span>
            </button>
          )}

          <button
            onClick={() => setStatusFilter('EN_EJECUCION')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 ${
              activeFilter === 'EN_EJECUCION'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            En Ejecución
          </button>

          <button
            onClick={() => setStatusFilter('OBRA_TERMINADA')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 ${
              activeFilter === 'OBRA_TERMINADA'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            Obra Concluida
          </button>

          <button
            onClick={() => setStatusFilter('PAGADO_CONCLUIDO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 ${
              activeFilter === 'PAGADO_CONCLUIDO'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Concluidos
          </button>
        </div>

        {/* Sort & PDF Export */}
        <div className="flex items-center gap-2 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 flex-wrap">
          {onOpenPdfModal && (
            <button
              type="button"
              onClick={onOpenPdfModal}
              className="px-2.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer"
              title="Generar y descargar reporte financiero en PDF de los contratos"
            >
              <FileDown className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Reporte</span> PDF
            </button>
          )}

          {/* Date Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              dateFrom || dateTo
                ? 'bg-sky-600 text-white shadow-2xs font-bold'
                : isDateFilterOpen
                ? 'bg-slate-200 text-slate-900'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
            title="Filtrar contratos por rango de fechas (inicio o finalización)"
          >
            <CalendarRange className={`w-3.5 h-3.5 ${dateFrom || dateTo ? 'text-white' : 'text-slate-500'}`} />
            <span>Fechas</span>
            {(dateFrom || dateTo) && (
              <span className="text-[10px] bg-sky-800 text-sky-100 px-1.5 py-0.2 rounded font-mono font-bold">
                Activo
              </span>
            )}
          </button>

          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="recent">Más recientes</option>
              <option value="amount-high">Mayor monto contratado</option>
              <option value="balance-high">Mayor saldo pendiente</option>
            </select>
          </div>
        </div>

        {/* Date Range Filter Expandable Panel */}
        {(isDateFilterOpen || dateFrom || dateTo) && (
          <div className="pt-3 border-t border-slate-100 bg-slate-50/80 p-3 rounded-xl border border-slate-200/90 animate-in fade-in space-y-2.5 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px] uppercase tracking-wide">
                  <CalendarRange className="w-3.5 h-3.5 text-sky-600" />
                  <span>Filtrar por:</span>
                </span>
                
                {/* Field selector tabs */}
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setDateFilterField('startDate')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      dateFilterField === 'startDate'
                        ? 'bg-sky-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Fecha de Inicio
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateFilterField('estimatedEndDate')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      dateFilterField === 'estimatedEndDate'
                        ? 'bg-sky-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Fecha de Finalización
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateFilterField('activeInPeriod')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      dateFilterField === 'activeInPeriod'
                        ? 'bg-sky-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Vigente en el Periodo
                  </button>
                </div>
              </div>

              {/* Clear button if active */}
              {(dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={() => handleSetDatePreset('clear')}
                  className="text-rose-600 hover:text-rose-800 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                >
                  <X className="w-3 h-3 stroke-[2.5]" />
                  <span>Limpiar filtro de fechas</span>
                </button>
              )}
            </div>

            {/* Inputs and Presets row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 flex-wrap">
              {/* Date pickers */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Desde:</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono shadow-2xs"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Hasta:</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono shadow-2xs"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400 text-[11px] mr-0.5 hidden lg:inline">Periodos:</span>
                <button
                  type="button"
                  onClick={() => handleSetDatePreset('thisMonth')}
                  className="px-2 py-0.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium transition-colors cursor-pointer shadow-2xs"
                >
                  Este Mes
                </button>
                <button
                  type="button"
                  onClick={() => handleSetDatePreset('nextMonth')}
                  className="px-2 py-0.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium transition-colors cursor-pointer shadow-2xs"
                >
                  Próximo Mes
                </button>
                <button
                  type="button"
                  onClick={() => handleSetDatePreset('last3Months')}
                  className="px-2 py-0.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium transition-colors cursor-pointer shadow-2xs"
                >
                  Últimos 3m
                </button>
                <button
                  type="button"
                  onClick={() => handleSetDatePreset('thisYear')}
                  className="px-2 py-0.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium transition-colors cursor-pointer shadow-2xs"
                >
                  Este Año
                </button>
              </div>
            </div>

            {/* Summary explanation when active */}
            {(dateFrom || dateTo) && (
              <div className="text-[11px] text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200 flex items-center justify-between">
                <span>
                  Mostrando contratos con <strong>{dateFilterField === 'startDate' ? 'fecha de inicio' : dateFilterField === 'estimatedEndDate' ? 'fecha de entrega/finalización' : 'vigencia'}</strong> {dateFrom ? `desde ${formatDate(dateFrom)}` : ''} {dateTo ? `hasta ${formatDate(dateTo)}` : ''} ({filtered.length} {filtered.length === 1 ? 'coincidencia' : 'coincidencias'}).
                </span>
                <button
                  type="button"
                  onClick={() => handleSetDatePreset('clear')}
                  className="text-sky-900 hover:underline font-bold text-[10px] ml-2 cursor-pointer"
                >
                  Restablecer
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Filter by Work Location */}
        {distinctLocations.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2.5 border-t border-slate-100 text-xs">
            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>Ubicación de Obra:</span>
            </span>
            {distinctLocations.map((loc) => {
              const isSelected = search.toLowerCase().trim() === loc.toLowerCase().trim();
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setSearch('');
                    } else {
                      setSearch(loc);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200'
                  }`}
                >
                  <span>{loc}</span>
                  {isSelected && <X className="w-3 h-3 stroke-[2.5]" />}
                </button>
              );
            })}
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-[11px] text-sky-700 hover:underline font-semibold ml-1 cursor-pointer"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        )}
      </div>

      {/* Contracts Content: Cuadro Desktop y Tarjetas Móviles Touch-First */}
      {sorted.length > 0 ? (
        <div className="bg-[#101420] rounded-xl border border-[#202738] shadow-lg overflow-hidden">
            {/* 1. Mobile Touch-Friendly Card Feed (< md) */}
            <div className="md:hidden divide-y divide-[#1D2436]">
              {sorted.map((contract) => {
                const financials = calculateFinancials(contract);
                const alerts = getContractPaymentAlerts(contract, 14);
                const percentPaid = financials.totalAmount > 0 
                  ? Math.min(100, Math.round((financials.totalPaid / financials.totalAmount) * 100))
                  : 0;

                return (
                  <div 
                    key={contract.id}
                    onClick={() => onSelectContract(contract)}
                    className="p-4 hover:bg-[#161C2C] active:bg-[#1A2234] transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0 flex-1">
                        <span className="font-mono font-extrabold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30 text-xs">
                          {contract.contractNumber}
                        </span>
                        <h4 className="font-black text-white text-sm mt-1 truncate">
                          {contract.clientName}
                        </h4>
                      </div>
                      <div className="shrink-0">
                        {renderStatusBadge(contract.status)}
                      </div>
                    </div>

                    {contract.location && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 my-1">
                        <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                        <span className="truncate">{contract.location}</span>
                      </p>
                    )}

                    <div className="bg-[#090C13] p-2.5 rounded-lg border border-[#1C2335] my-2.5">
                      <div className="flex items-center justify-between text-xs mb-1 font-mono">
                        <span className="text-slate-400">Total: <strong className="text-white font-mono">{formatCurrency(contract.totalAmount)}</strong></span>
                        <span className="text-amber-400 font-mono font-bold">Saldo: {formatCurrency(financials.pendingBalance)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#1C2335] rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${percentPaid}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                        <span className="text-emerald-400 font-semibold">{formatCurrency(financials.totalPaid)} cobrado</span>
                        <span>{percentPaid}%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-400 font-mono">
                        {formatDate(contract.startDate)} → {formatDate(contract.estimatedEndDate)}
                      </span>
                      <span className="text-amber-400 font-bold flex items-center gap-0.5 font-mono">
                        Ver obra →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2. Desktop Full Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#090C13] border-b border-[#222A3E] text-[10px] font-mono font-black uppercase tracking-wider text-slate-300 select-none">
                    <th className="py-3 px-3.5 font-bold text-amber-400">N° Contrato</th>
                    <th className="py-3 px-3.5 font-bold text-slate-200">Cliente & Obra</th>
                    <th className="py-3 px-3.5 font-bold text-slate-200">Ubicación</th>
                    <th className="py-3 px-3.5 font-bold text-slate-200">Estado</th>
                    <th className="py-3 px-3.5 font-bold text-slate-200">Periodo</th>
                    <th className="py-3 px-3.5 font-bold text-right text-slate-200">Contratado</th>
                    <th className="py-3 px-3.5 font-bold text-right text-emerald-400">Cobrado</th>
                    <th className="py-3 px-3.5 font-bold text-right text-amber-300">Saldo Pendiente</th>
                    <th className="py-3 px-3.5 font-bold text-slate-200">Próximo Cobro</th>
                    <th className="py-3 px-3.5 font-bold text-center text-slate-200">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1D2436]">
                  {sorted.map((contract) => {
                    const financials = calculateFinancials(contract);
                    const alerts = getContractPaymentAlerts(contract, 14);
                    const percentPaid = financials.totalAmount > 0 
                      ? Math.min(100, Math.round((financials.totalPaid / financials.totalAmount) * 100))
                      : 0;

                    const nextPendingMilestone = (contract.paymentSchedule || []).find(s => !s.isPaid);

                    return (
                      <tr 
                        key={contract.id}
                        onClick={() => onSelectContract(contract)}
                        className={`hover:bg-[#161C2C] transition-colors cursor-pointer group ${
                          alerts.hasOverdue && contract.status !== 'PAGADO_CONCLUIDO'
                            ? 'bg-red-950/20 hover:bg-red-950/40'
                            : ''
                        }`}
                      >
                        {/* 1. N° Contrato */}
                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          <span className="font-mono font-extrabold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30 text-xs">
                            {contract.contractNumber}
                          </span>
                          {contract.invoice?.invoiceNumber && (
                            <span className="text-[10px] text-sky-700 font-mono block mt-0.5 font-medium">
                              Fac: {contract.invoice.invoiceNumber}
                            </span>
                          )}
                          {(() => {
                            let docCount = 0;
                            if (contract.contractFile) docCount++;
                            if (contract.invoice?.file) docCount++;
                            if (contract.payments) {
                              contract.payments.forEach(p => {
                                if (p.voucherFile || p.receiptFile) docCount++;
                                if (p.invoiceFile) docCount++;
                              });
                            }
                            if (contract.expenses) {
                              contract.expenses.forEach(e => {
                                if (e.invoiceFile || e.receiptFile) docCount++;
                                if (e.voucherFile) docCount++;
                              });
                            }
                            if (docCount > 0) {
                              return (
                                <span className="inline-flex items-center gap-1 text-[10px] text-sky-800 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200 mt-1 block w-fit font-medium">
                                  <FolderOpen className="w-2.5 h-2.5 text-sky-600" />
                                  <span>{docCount} doc(s)</span>
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </td>

                        {/* 2. Cliente & Obra */}
                        <td className="py-3.5 px-3.5 max-w-[200px]">
                          <p className="font-bold text-slate-900 group-hover:text-sky-700 transition-colors truncate">
                            {contract.clientName}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                            <span className="font-mono">{contract.docType}: {contract.docNumber || '-'}</span>
                            {contract.phone && (
                              <>
                                <span>·</span>
                                <span className="inline-flex items-center gap-0.5 text-slate-500">
                                  <Phone className="w-2.5 h-2.5" />
                                  <span>{contract.phone}</span>
                                </span>
                              </>
                            )}
                          </div>
                          {contract.description && (
                            <p className="text-[10px] text-slate-400 truncate mt-0.5 max-w-[220px]">
                              {contract.description}
                            </p>
                          )}
                        </td>

                        {/* 3. Ubicación */}
                        <td className="py-3.5 px-3.5 whitespace-nowrap text-slate-600">
                          {contract.location ? (
                            <span className="inline-flex items-center gap-1 text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-100 text-slate-700">
                              <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                              <span className="truncate max-w-[130px] font-medium">{contract.location}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">-</span>
                          )}
                        </td>

                        {/* 4. Estado */}
                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          {renderStatusBadge(contract.status)}
                          {alerts.hasOverdue && contract.status !== 'PAGADO_CONCLUIDO' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-700 bg-red-100 px-1.5 py-0.2 rounded-full mt-1 block w-fit">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>{alerts.overdueCount} pago(s) vencido(s)</span>
                            </span>
                          )}
                          {!alerts.hasOverdue && alerts.hasUpcoming && contract.status !== 'PAGADO_CONCLUIDO' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded-full border border-indigo-200 mt-1 block w-fit">
                              <Clock className="w-2.5 h-2.5 text-indigo-600" />
                              <span>Cobro próximo</span>
                            </span>
                          )}
                        </td>

                        {/* 5. Periodo (Inicio / Entrega) */}
                        <td className="py-3.5 px-3.5 whitespace-nowrap text-[11px] font-mono text-slate-600">
                          <div>
                            <span className="text-slate-400 font-sans">Inic:</span> {formatDate(contract.startDate)}
                          </div>
                          <div className="text-slate-500 mt-0.5">
                            <span className="text-slate-400 font-sans">Entr:</span> {formatDate(contract.estimatedEndDate)}
                          </div>
                        </td>

                        {/* 6. Monto Contratado */}
                        <td className="py-3.5 px-3.5 whitespace-nowrap text-right font-mono font-bold text-slate-900 text-xs">
                          {formatCurrency(contract.totalAmount)}
                        </td>

                        {/* 7. Cobrado Real */}
                        <td className="py-3.5 px-3.5 whitespace-nowrap text-right">
                          <span className="font-mono font-extrabold text-emerald-700 text-xs block">
                            {formatCurrency(financials.totalPaid)}
                          </span>
                          <div className="flex items-center justify-end gap-1.5 mt-1">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 rounded-full" 
                                style={{ width: `${percentPaid}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 font-semibold">{percentPaid}%</span>
                          </div>
                        </td>

                        {/* 8. Saldo Pendiente */}
                        <td className="py-3.5 px-3.5 whitespace-nowrap text-right font-mono">
                          <span className={`text-xs font-black ${
                            financials.pendingBalance > 0 ? 'text-amber-700' : 'text-emerald-700'
                          }`}>
                            {formatCurrency(financials.pendingBalance)}
                          </span>
                          {financials.pendingBalance === 0 && (
                            <span className="text-[10px] text-emerald-600 block font-sans font-semibold">100% cobrado</span>
                          )}
                        </td>

                        {/* 9. Próximo Cobro */}
                        <td className="py-3.5 px-3.5 whitespace-nowrap text-[11px]">
                          {contract.status === 'PAGADO_CONCLUIDO' ? (
                            <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Completado</span>
                            </span>
                          ) : nextPendingMilestone ? (
                            <div>
                              <p className="font-bold text-slate-800 truncate max-w-[130px]">
                                {nextPendingMilestone.title}
                              </p>
                              <p className="font-mono text-slate-500 text-[10px] mt-0.5">
                                {formatDate(nextPendingMilestone.dueDate)} · {formatCurrency(nextPendingMilestone.amount)}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Sin cuotas pendientes</span>
                          )}
                        </td>

                        {/* 10. Acciones */}
                        <td className="py-3.5 px-3.5 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onSelectContract(contract)}
                              className="px-2.5 py-1 text-xs font-bold text-white bg-slate-900 hover:bg-sky-600 rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Abrir ficha completa del contrato"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Ficha</span>
                            </button>

                            {onDeleteContract && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteContract(contract.id);
                                }}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                                title={`Eliminar contrato ${contract.contractNumber}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Totals Table Footer */}
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-200 text-xs font-bold text-slate-800">
                    <td colSpan={5} className="py-3.5 px-3.5 uppercase tracking-wider text-slate-500 font-bold">
                      Totales ({sorted.length} {sorted.length === 1 ? 'contrato' : 'contratos'} mostrados):
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono font-black text-slate-900 text-xs sm:text-sm">
                      {formatCurrency(sorted.reduce((acc, c) => acc + (Number(c.totalAmount) || 0), 0))}
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono font-black text-emerald-700 text-xs sm:text-sm">
                      {formatCurrency(sorted.reduce((acc, c) => acc + calculateFinancials(c).totalPaid, 0))}
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono font-black text-amber-700 text-xs sm:text-sm">
                      {formatCurrency(sorted.reduce((acc, c) => acc + calculateFinancials(c).pendingBalance, 0))}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 mx-auto flex items-center justify-center mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            No se encontraron contratos con los filtros aplicados
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            {activeFilter === 'OVERDUE'
              ? 'No hay contratos con cuotas vencidas pendientes de cobro.'
              : activeFilter === 'UPCOMING'
              ? 'No hay contratos con pagos programados para los próximos 14 días.'
              : search
              ? `No hay contratos que coincidan con el término "${search}".`
              : 'Empieza registrando tu primer contrato de obra o carga los datos de demostración.'}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {search && (
              <button
                onClick={() => setSearch('')}
                className="px-4 py-2 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Borrar búsqueda "{search}"</span>
              </button>
            )}
            {activeFilter !== 'ALL' && (
              <button
                onClick={() => setStatusFilter('ALL')}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Limpiar Filtros
              </button>
            )}
            <button
              onClick={onNewContract}
              className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors"
            >
              Nuevo Contrato
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
