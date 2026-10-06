import React from 'react';
import { 
  Building2, 
  Plus, 
  FileText, 
  TrendingUp, 
  Calendar, 
  FileDown,
  Settings2,
  Sun,
  Moon
} from 'lucide-react';
import { GoogleDriveSyncBadge } from './GoogleDriveSyncBadge';
import { PWAInstallButton } from './PWAInstallButton';

export type AppModule = 'contracts' | 'collections' | 'finances';

interface NavbarProps {
  activeModule: AppModule;
  onChangeModule: (module: AppModule) => void;
  onNewContract: () => void;
  onOpenPdfModal: () => void;
  onOpenToolsModal?: () => void;
  overdueCount?: number;
  totalContracts: number;
  urbanTheme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeModule,
  onChangeModule,
  onNewContract,
  onOpenPdfModal,
  onOpenToolsModal,
  overdueCount = 0,
  totalContracts,
  urbanTheme = 'dark',
  onToggleTheme,
}) => {
  return (
    <header className="bg-[#090C13] border-b border-[#20283C] sticky top-0 z-30 shadow-xl">
      {/* Top 2px Industrial Caution Strip */}
      <div className="h-[2px] w-full urban-hazard-strip opacity-80"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single Brand Element */}
        <div 
          onClick={() => onChangeModule('contracts')}
          className="flex items-center gap-2.5 shrink-0 cursor-pointer group select-none"
          title="Ir a Contratos"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-sm border border-amber-300/60 font-black">
            <Building2 className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-wider text-white leading-none uppercase">
                Obra<span className="text-amber-400">Control</span>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Sistema operativo offline y en la nube"></span>
            </div>
            <span className="text-[9px] text-amber-400/90 block leading-tight font-extrabold uppercase tracking-widest mt-0.5 font-mono">
              Urban Engineering OS
            </span>
          </div>
        </div>

        {/* Zone 2: Strictly the 3 Modules in User-Requested Order: 1. Contratos, 2. Cobranzas, 3. Finanzas & Resumen (Desktop: hidden on mobile, handled by MobileBottomNav) */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1">
          {/* 1. Contratos */}
          <button
            type="button"
            onClick={() => onChangeModule('contracts')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer ${
              activeModule === 'contracts'
                ? 'bg-amber-400 text-slate-950 shadow-sm font-black ring-1 ring-amber-300'
                : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Contratos</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
              activeModule === 'contracts' ? 'bg-slate-950/25 text-slate-950 font-black' : 'bg-white/10 text-slate-300'
            }`}>
              {totalContracts}
            </span>
          </button>

          {/* 2. Cobranzas */}
          <button
            type="button"
            onClick={() => onChangeModule('collections')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer ${
              activeModule === 'collections'
                ? 'bg-amber-400 text-slate-950 shadow-sm font-black ring-1 ring-amber-300'
                : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'
            }`}
          >
            <Calendar className={`w-3.5 h-3.5 ${activeModule === 'collections' ? 'text-slate-950' : 'text-amber-400'}`} />
            <span>Cobranzas</span>
            {overdueCount > 0 && (
              <span className="text-[10px] font-black font-mono px-1.5 py-0.2 rounded-md bg-red-600 text-white animate-pulse">
                {overdueCount}
              </span>
            )}
          </button>

          {/* 3. Finanzas y Resumen */}
          <button
            type="button"
            onClick={() => onChangeModule('finances')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer ${
              activeModule === 'finances'
                ? 'bg-amber-400 text-slate-950 shadow-sm font-black ring-1 ring-amber-300'
                : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'
            }`}
          >
            <TrendingUp className={`w-3.5 h-3.5 ${activeModule === 'finances' ? 'text-slate-950' : 'text-emerald-400'}`} />
            <span>Finanzas & Resumen</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-1.5 sm:px-2 text-xs font-bold rounded-lg border transition-all cursor-pointer inline-flex items-center gap-1 bg-[#151A29] hover:bg-[#1C2337] text-amber-400 border-[#2A354C] hover:border-amber-400/60 min-h-[36px] min-w-[36px] justify-center"
              title={urbanTheme === 'dark' ? 'Modo actual: Asfalto Urbano. Clic para cambiar a Concreto Claro' : 'Modo actual: Concreto Claro. Clic para cambiar a Asfalto Urbano'}
            >
              {urbanTheme === 'dark' ? (
                <>
                  <Moon className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-amber-400" />
                  <span className="hidden md:inline font-mono text-[10px] uppercase tracking-wider text-amber-300">Asfalto</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-amber-500" />
                  <span className="hidden md:inline font-mono text-[10px] uppercase tracking-wider text-amber-600">Concreto</span>
                </>
              )}
            </button>
          )}

          <GoogleDriveSyncBadge compact={true} />

          <button
            type="button"
            onClick={onOpenPdfModal}
            className="hidden sm:inline-flex px-2.5 py-1.5 text-xs font-bold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-lg items-center gap-1.5 transition-colors cursor-pointer"
            title="Generar y descargar informe PDF con jsPDF"
          >
            <FileDown className="w-3.5 h-3.5 text-rose-400" />
            <span>Reporte PDF</span>
          </button>

          {onOpenToolsModal && (
            <button
              type="button"
              onClick={onOpenToolsModal}
              className="p-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Herramientas, Respaldo y Publicación en GitHub"
            >
              <Settings2 className="w-4 h-4 text-slate-300" />
            </button>
          )}

          <button
            type="button"
            onClick={onNewContract}
            className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-sm border border-amber-300/40 transition-all items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nuevo Contrato</span>
          </button>
        </div>
      </div>
    </header>
  );
};
