import React, { useRef } from 'react';
import { 
  FileDown, 
  Download, 
  Upload, 
  FileCode, 
  Mail, 
  Sparkles, 
  ShieldCheck, 
  HardDrive,
  Database,
  ArrowRight,
  FolderGit2
} from 'lucide-react';

interface ToolsModuleProps {
  onOpenPdfModal: () => void;
  onExportBackup: () => void;
  onImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenSingleFileModal: () => void;
  onOpenGitHubModal?: () => void;
  onLoadDemo: () => void;
  totalContracts: number;
}

export const ToolsModule: React.FC<ToolsModuleProps> = ({
  onOpenPdfModal,
  onExportBackup,
  onImportBackup,
  onOpenSingleFileModal,
  onOpenGitHubModal,
  onLoadDemo,
  totalContracts
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Database className="w-5 h-5 text-sky-600" />
          <span>Herramientas, Reportes & Respaldo</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Exportación de reportes ejecutivos en PDF, copias de seguridad de datos y versión portable autónoma.
        </p>
      </div>

      {/* Grid of Tool Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. PDF Reports */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <FileDown className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Generador de Reportes PDF
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Crea resúmenes ejecutivos impresos o en PDF con métricas financieras consolidadas, tablas de cobranza, gastos detallados y cronogramas de hitos listos para presentar a inversionistas o clientes.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">Formato A4 Ejecutivo</span>
            <button
              type="button"
              onClick={onOpenPdfModal}
              className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Generar Reporte PDF</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Backup & Restore */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <HardDrive className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Copia de Seguridad (Backup JSON)
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Descarga una copia completa e inalterable de todos tus contratos, váuchers de pago, recibos de gastos y notas en un archivo JSON seguro, o restáurala en cualquier equipo.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] text-slate-400 font-mono">{totalContracts} contratos guardados</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onExportBackup}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg inline-flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Exportar</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg inline-flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>Restaurar</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={onImportBackup}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* 3. Single-File Autonomous HTML */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
              <FileCode className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Aplicativo Portable Offline (Single-File HTML)
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Exporta el sistema entero como un solo archivo <code className="text-[11px] bg-slate-100 px-1 py-0.5 rounded font-mono">.html</code> independiente. Funciona de por vida sin internet, sin servidores, en cualquier computadora o pendrive USB con tus datos integrados.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-sky-700 font-medium">100% Autónomo</span>
            <button
              type="button"
              onClick={onOpenSingleFileModal}
              className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Generar Portable</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4. Demo Data Loader */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Obras y Contratos de Demostración
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Carga un conjunto de obras de ejemplo con váuchers reales de transferencias y Yape, desgloses de gastos de mano de obra y materiales, cronogramas de cuotas y cálculo de márgenes.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Datos de prueba</span>
            <button
              type="button"
              onClick={onLoadDemo}
              className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg inline-flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Cargar Ejemplos</span>
            </button>
          </div>
        </div>

        {/* 5. GitHub & Cloud Publishing */}
        {onOpenGitHubModal && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors md:col-span-2 bg-gradient-to-br from-white via-white to-amber-50/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="w-9 h-9 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center mb-3">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Publicar en GitHub & GitHub Pages</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                    Web 24/7 Gratis
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-2xl">
                  Sube el repositorio de ObraControl a tu cuenta de GitHub con un par de comandos y publica la aplicación web en vivo gratis con GitHub Actions y GitHub Pages para acceder desde cualquier celular o PC.
                </p>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={onOpenGitHubModal}
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 border border-amber-500/40 rounded-lg inline-flex items-center gap-2 transition-all shadow-sm cursor-pointer active:scale-95"
                >
                  <FolderGit2 className="w-4 h-4" />
                  <span>Guía & Comandos Git</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
