import React from 'react';
import { 
  FileText, 
  Calendar, 
  TrendingUp, 
  Settings2, 
  Plus
} from 'lucide-react';
import { AppModule } from './Navbar';

interface MobileBottomNavProps {
  activeModule: AppModule;
  onChangeModule: (module: AppModule) => void;
  onNewContract: () => void;
  onOpenToolsModal: () => void;
  totalContracts: number;
  overdueCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeModule,
  onChangeModule,
  onNewContract,
  onOpenToolsModal,
  totalContracts,
  overdueCount = 0,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#090C13]/95 backdrop-blur-lg border-t border-[#202738] shadow-[0_-8px_24px_rgba(0,0,0,0.6)]">
      {/* 1px Caution Hazard Top Accent */}
      <div className="h-[2px] w-full urban-hazard-strip opacity-70"></div>
      
      <div className="grid grid-cols-5 items-center h-16 px-1 safe-area-pb">
        {/* 1. Contratos */}
        <button
          type="button"
          onClick={() => onChangeModule('contracts')}
          className={`flex flex-col items-center justify-center h-full transition-colors relative cursor-pointer active:scale-95 ${
            activeModule === 'contracts'
              ? 'text-amber-400 font-black'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <div className="relative">
            <FileText className={`w-5 h-5 ${activeModule === 'contracts' ? 'stroke-[2.5]' : ''}`} />
            {totalContracts > 0 && (
              <span className={`absolute -top-1 -right-2 text-[9px] font-mono px-1 py-0.2 rounded-full font-bold ${
                activeModule === 'contracts' ? 'bg-amber-400 text-slate-950' : 'bg-[#1E2538] text-slate-300'
              }`}>
                {totalContracts}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1">Contratos</span>
          {activeModule === 'contracts' && (
            <span className="w-1 h-1 rounded-full bg-amber-400 mt-0.5"></span>
          )}
        </button>

        {/* 2. Cobranzas */}
        <button
          type="button"
          onClick={() => onChangeModule('collections')}
          className={`flex flex-col items-center justify-center h-full transition-colors relative cursor-pointer active:scale-95 ${
            activeModule === 'collections'
              ? 'text-amber-400 font-black'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <div className="relative">
            <Calendar className={`w-5 h-5 ${activeModule === 'collections' ? 'stroke-[2.5]' : ''}`} />
            {overdueCount > 0 && (
              <span className="absolute -top-1 -right-2 text-[9px] font-mono px-1 py-0.2 rounded-full font-black bg-rose-600 text-white animate-pulse">
                {overdueCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1">Cobranzas</span>
          {activeModule === 'collections' && (
            <span className="w-1 h-1 rounded-full bg-amber-400 mt-0.5"></span>
          )}
        </button>

        {/* 3. Botón Central: + Nueva Obra */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={onNewContract}
            className="w-12 h-12 -mt-4 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/25 border-2 border-[#090C13] active:scale-90 transition-transform cursor-pointer"
            title="Crear Nuevo Contrato de Obra"
            aria-label="Nuevo Contrato"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* 4. Finanzas & Resumen */}
        <button
          type="button"
          onClick={() => onChangeModule('finances')}
          className={`flex flex-col items-center justify-center h-full transition-colors relative cursor-pointer active:scale-95 ${
            activeModule === 'finances'
              ? 'text-amber-400 font-black'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <TrendingUp className={`w-5 h-5 ${activeModule === 'finances' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] tracking-tight mt-1">Finanzas</span>
          {activeModule === 'finances' && (
            <span className="w-1 h-1 rounded-full bg-amber-400 mt-0.5"></span>
          )}
        </button>

        {/* 5. Herramientas & Menú */}
        <button
          type="button"
          onClick={onOpenToolsModal}
          className="flex flex-col items-center justify-center h-full text-slate-400 hover:text-slate-200 font-medium transition-colors relative cursor-pointer active:scale-95"
          title="Herramientas, Respaldo y GitHub"
        >
          <Settings2 className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Ajustes</span>
        </button>
      </div>
    </div>
  );
};
