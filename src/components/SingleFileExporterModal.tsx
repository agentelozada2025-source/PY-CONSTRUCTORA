import React, { useState } from 'react';
import { generateSingleFileHtmlCode } from '../utils/exportSingleFileHtml';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileCode, 
  Layers, 
  ShieldCheck, 
  HardDrive 
} from 'lucide-react';

interface SingleFileExporterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SingleFileExporterModal: React.FC<SingleFileExporterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const htmlCode = generateSingleFileHtmlCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([htmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ObraControl_SingleFile_index.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                Versión Single-File (Archivo Único HTML)
              </h3>
              <p className="text-xs text-slate-400">
                HTML5 + Tailwind CSS CDN + JavaScript Nativo ES6 100% Autónomo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Benefits pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <HardDrive className="w-4 h-4 text-sky-600 mb-1" />
              <h4 className="text-xs font-bold text-slate-900">100% Offline</h4>
              <p className="text-[11px] text-slate-500">
                Funciona sin conexión a internet ni servidor.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mb-1" />
              <h4 className="text-xs font-bold text-slate-900">Persistencia Local</h4>
              <p className="text-[11px] text-slate-500">
                Guarda contratos y váuchers en IndexedDB de tu navegador.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <Layers className="w-4 h-4 text-purple-600 mb-1" />
              <h4 className="text-xs font-bold text-slate-900">Un Solo Archivo</h4>
              <p className="text-[11px] text-slate-500">
                Copia y pega en un archivo <code className="text-sky-700">index.html</code>.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Código Fuente Completo Listo para Ejecutar:
            </label>
            <div className="relative">
              <textarea
                readOnly
                value={htmlCode}
                rows={9}
                className="w-full p-3 font-mono text-xs bg-slate-950 text-slate-300 rounded-xl border border-slate-800 focus:outline-none select-all"
              />
              <button
                onClick={handleCopy}
                className="absolute top-3 right-3 px-3 py-1.5 text-xs font-bold rounded-lg transition-all inline-flex items-center gap-1.5 shadow-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Código</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-sky-50 rounded-xl p-3 border border-sky-200 text-xs text-sky-900">
            <span className="font-bold">¿Cómo utilizar este archivo?</span>
            <p className="mt-0.5 text-sky-800 leading-relaxed text-[11px]">
              Descarga el archivo o cópialo en un bloc de notas y guárdalo como <code className="font-bold font-mono">index.html</code>. Luego haz doble clic para abrirlo con Chrome, Edge o Safari. Podrás gestionar contratos, adjuntar váuchers de Yape, calcular saldos e importar/exportar respaldos sin requerir Node.js ni instalaciones adicionales.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado al Portapapeles' : 'Copiar Código'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-all inline-flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Descargar index.html</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
