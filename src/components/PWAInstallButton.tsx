import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, Share2, PlusSquare, X, Check } from 'lucide-react';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA on the home screen
  if (isInstalled) {
    if (compact) return null;
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 rounded-lg">
        <Check className="w-3.5 h-3.5 text-emerald-400" />
        <span>Instalado en Dispositivo</span>
      </span>
    );
  }

  // Chromium / Android / Desktop flow with automatic beforeinstallprompt
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={`inline-flex items-center gap-1.5 font-black rounded-lg transition-all cursor-pointer shadow-sm active:scale-95 whitespace-nowrap ${
          compact
            ? 'px-2.5 py-1 text-[11px] bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border border-amber-300/60'
            : 'px-3.5 py-2 text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-300'
        }`}
        title="Instalar ObraControl en tu celular como app nativa"
      >
        <Smartphone className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Instalar en Móvil</span>
      </button>
    );
  }

  // iOS Safari flow (Apple Safari does not fire beforeinstallprompt)
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center gap-1.5 font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            compact
              ? 'px-2 py-1 text-[11px] bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
              : 'px-3.5 py-2 text-xs bg-[#161C2C] hover:bg-[#1E253A] text-amber-400 border border-amber-400/30'
          }`}
          title="Instrucciones para instalar en iPhone o iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          <span>Instalar en iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-70 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-[#101420] border border-[#2A344D] p-5 shadow-2xl text-slate-200 animate-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#202738]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black text-white font-mono">Instalar en iPhone / iPad</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 my-4 text-xs">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#161C2C] border border-[#222B3D]">
                  <div className="w-6 h-6 rounded-md bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold font-mono shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <span>Toca el botón</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">
                        <Share2 className="w-3 h-3 text-sky-400" /> Compartir
                      </span>
                    </p>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Se encuentra en la barra inferior de Safari en tu iPhone.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#161C2C] border border-[#222B3D]">
                  <div className="w-6 h-6 rounded-md bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold font-mono shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <span>Selecciona</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">
                        <PlusSquare className="w-3 h-3 text-emerald-400" /> Agregar a Inicio
                      </span>
                    </p>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Desliza hacia abajo en las opciones del menú y confirma en &quot;Agregar&quot;.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback for desktop browsers without prompt active
  if (!compact) {
    return (
      <button
        type="button"
        onClick={() => {
          alert('Para instalar en tu celular o tablet, abre este enlace desde el navegador de tu teléfono móvil (Chrome o Safari) y toca en "Instalar" o "Agregar a pantalla de inicio".');
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-400 bg-[#161C2C] hover:bg-[#1E253A] border border-amber-400/30 rounded-lg transition-colors cursor-pointer"
        title="Instalar aplicación en dispositivo"
      >
        <Smartphone className="w-3.5 h-3.5 text-amber-400" />
        <span>Instalar App</span>
      </button>
    );
  }

  return null;
};
