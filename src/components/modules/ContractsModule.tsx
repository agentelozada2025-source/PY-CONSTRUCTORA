import React, { useState, useMemo } from 'react';
import { Contract } from '../../types';
import { formatCurrency, calculateFinancials } from '../../utils/formatters';
import { ContractList, ExtendedFilter } from '../ContractList';
import { 
  Building2, 
  Plus, 
  FileCheck2, 
  Clock, 
  CheckCircle2, 
  Wallet, 
  CircleDollarSign,
  FileDown,
  Search,
  X
} from 'lucide-react';

interface ContractsModuleProps {
  contracts: Contract[];
  onSelectContract: (contract: Contract) => void;
  onNewContract: () => void;
  onDeleteContract?: (id: string) => void;
  onLoadDemo: () => void;
  onOpenPdfModal: () => void;
  currentFilter?: ExtendedFilter;
  onFilterChange?: (filter: ExtendedFilter) => void;
  searchTerm?: string;
  onSearchChange?: (query: string) => void;
}

export const ContractsModule: React.FC<ContractsModuleProps> = ({
  contracts,
  onSelectContract,
  onNewContract,
  onDeleteContract,
  onLoadDemo,
  onOpenPdfModal,
  currentFilter,
  onFilterChange,
  searchTerm: externalSearchTerm,
  onSearchChange: externalOnSearchChange,
}) => {
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const searchQuery = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;
  const setSearchQuery = (val: string) => {
    if (externalOnSearchChange) {
      externalOnSearchChange(val);
    } else {
      setInternalSearchTerm(val);
    }
  };

  const normalizeText = (text?: string): string => {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  // Real-time filtering by client name or contract number
  const filteredContracts = useMemo(() => {
    const q = normalizeText(searchQuery.trim());
    if (!q) return contracts;
    return contracts.filter(
      (c) =>
        normalizeText(c.clientName).includes(q) ||
        normalizeText(c.contractNumber).includes(q)
    );
  }, [contracts, searchQuery]);

  // Quick summary numbers
  const total = contracts.length;
  const inProgress = contracts.filter(c => c.status === 'EN_EJECUCION').length;
  const completed = contracts.filter(c => c.status === 'PAGADO_CONCLUIDO').length;
  const pendingCollection = contracts.filter(c => c.status === 'OBRA_TERMINADA').length;

  let totalContracted = 0;
  let totalCollected = 0;
  contracts.forEach(c => {
    const fin = calculateFinancials(c);
    totalContracted += fin.totalAmount;
    totalCollected += fin.totalPaid;
  });
  const collectionRate = totalContracted > 0 ? Math.round((totalCollected / totalContracted) * 100) : 0;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Compact Top Summary Strip */}
      <div className="bg-[#101420] rounded-xl border border-[#202738] p-3.5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        {/* Left: Quick Counts */}
        <div className="flex items-center flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Obras en Cartera:</span>
            <span className="font-black text-amber-400 font-mono text-sm">{total}</span>
          </div>

          <span className="text-slate-700 hidden sm:inline">·</span>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span className="text-slate-300 font-medium">En Ejecución:</span>
            <span className="font-bold text-amber-400 font-mono">{inProgress}</span>
          </div>

          {pendingCollection > 0 && (
            <>
              <span className="text-slate-700 hidden sm:inline">·</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                <span className="text-slate-300 font-medium">Concluidas x Cobrar:</span>
                <span className="font-bold text-sky-400 font-mono">{pendingCollection}</span>
              </div>
            </>
          )}

          <span className="text-slate-700 hidden sm:inline">·</span>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-slate-300 font-medium">Pagadas / Cerradas:</span>
            <span className="font-bold text-emerald-400 font-mono">{completed}</span>
          </div>
        </div>

        {/* Right: Quick Financial Progress & New Contract CTA */}
        <div className="flex items-center gap-4 ml-auto">
          <div className="hidden lg:flex items-center gap-3 text-xs border-r border-[#202738] pr-4">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider">Recaudación Global</span>
              <span className="font-extrabold text-white font-mono">
                {formatCurrency(totalCollected)} <span className="text-slate-500 font-normal">/ {formatCurrency(totalContracted)}</span>
              </span>
            </div>
            <div className="w-16 h-2 bg-[#1A2131] rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-400 rounded-full transition-all"
                style={{ width: `${collectionRate}%` }}
              />
            </div>
            <span className="font-bold text-emerald-400 font-mono text-[11px]">{collectionRate}%</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenPdfModal}
              className="px-2.5 py-1.5 text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Generar resumen en PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            <button
              type="button"
              onClick={onNewContract}
              className="px-3.5 py-1.5 text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-sm border border-amber-300/40 transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Nuevo Contrato</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Search Field for Client Name or Contract Number */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 text-sky-600" />
            </div>
            <input
              type="text"
              id="contract-search-input"
              data-testid="contract-search-input"
              aria-label="Buscar contratos por cliente o número de contrato"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar contratos por cliente o número de contrato (ej. Lozada, CT-2025)..."
              className="block w-full pl-9 pr-24 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900 placeholder-slate-400 transition-all font-medium"
            />
            {searchQuery.trim() && (
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">
                  {filteredContracts.length} {filteredContracts.length === 1 ? 'coincidencia' : 'coincidencias'}
                </span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
                  title="Borrar búsqueda"
                  aria-label="Borrar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {searchQuery.trim() && (
            <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
              <span>Filtrando por cliente o N°:</span>
              <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                "{searchQuery.trim()}"
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-sky-600 hover:text-sky-800 font-semibold underline underline-offset-2 cursor-pointer ml-1"
              >
                Limpiar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Contract List with Search, Location Filters & Sorting */}
      <ContractList
        contracts={filteredContracts}
        onSelectContract={onSelectContract}
        onNewContract={onNewContract}
        onDeleteContract={onDeleteContract}
        onLoadDemo={onLoadDemo}
        onOpenPdfModal={onOpenPdfModal}
        currentFilter={currentFilter}
        onFilterChange={onFilterChange}
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        hideSearchInput={true}
      />
    </div>
  );
};
