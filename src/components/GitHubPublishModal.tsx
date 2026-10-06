import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Terminal, 
  Globe, 
  Download, 
  FolderGit2, 
  CheckCircle2, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface GitHubPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubPublishModal: React.FC<GitHubPublishModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [username, setUsername] = useState('mi-usuario');
  const [repoName, setRepoName] = useState('obracontrol');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const repoUrl = `https://github.com/${username.trim() || 'mi-usuario'}/${repoName.trim() || 'obracontrol'}.git`;
  const pagesUrl = `https://${username.trim() || 'mi-usuario'}.github.io/${repoName.trim() || 'obracontrol'}/`;

  const gitCommands = `# 1. Inicializar git y registrar archivos
git init
git add .
git commit -m "feat: primer commit de ObraControl"

# 2. Conectar tu repositorio de GitHub
git remote add origin ${repoUrl}
git branch -M main

# 3. Subir código a GitHub
git push -u origin main`;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0D111A] text-slate-100 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#232D42] animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="sticky top-0 bg-[#0D111A]/95 backdrop-blur-md px-5 py-4 border-b border-[#1E2638] flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#161D2B] border border-amber-400/40 text-amber-400 flex items-center justify-center shadow-inner">
              <FolderGit2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white uppercase font-mono">
                  Publicar en <span className="text-amber-400">GitHub</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 font-bold">
                  GitHub Pages Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Guía interactiva y comandos listos para subir tu código y hospedar la app gratis
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1A2234] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-5 text-xs">
          {/* Quick Config: Username & Repo Name */}
          <div className="bg-[#121724] p-4 rounded-xl border border-[#20293D] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400 text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Personaliza tus datos de GitHub</span>
              </span>
              <span className="text-[11px] text-slate-400">Los comandos se actualizarán automáticamente</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Tu Usuario en GitHub:
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ej. juan-constructor"
                  className="w-full px-3 py-2 bg-[#090C13] border border-[#263148] rounded-lg text-white font-mono text-xs focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Nombre del Repositorio:
                </label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="ej. obracontrol"
                  className="w-full px-3 py-2 bg-[#090C13] border border-[#263148] rounded-lg text-white font-mono text-xs focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Step 1: Create Repo */}
          <div className="bg-[#121724] p-4 rounded-xl border border-[#20293D] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-[11px] font-mono">
                  1
                </span>
                <span className="font-bold text-white text-xs">
                  Crear Repositorio en GitHub
                </span>
              </div>
              <a
                href="https://github.com/new"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 text-xs font-bold bg-[#1C253B] hover:bg-amber-400 hover:text-slate-950 text-amber-400 border border-amber-400/30 rounded-lg inline-flex items-center gap-1.5 transition-colors"
              >
                <span>Abrir github.com/new</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-slate-400 text-[11px] pl-7">
              Crea un nuevo repositorio público o privado con el nombre <strong className="text-white font-mono">{repoName || 'obracontrol'}</strong>. No es necesario añadir README ni .gitignore inicial porque ya están incluidos en este proyecto.
            </p>
          </div>

          {/* Step 2: Push Commands */}
          <div className="bg-[#121724] p-4 rounded-xl border border-[#20293D] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-[11px] font-mono">
                  2
                </span>
                <span className="font-bold text-white text-xs">
                  Ejecutar comandos en la Terminal (Subir Código)
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(gitCommands, 'commands')}
                className="px-2.5 py-1 text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedKey === 'commands' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Todos</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-[#090C13] p-3 rounded-lg border border-[#1E2638] font-mono text-[11px] text-amber-300 overflow-x-auto whitespace-pre leading-relaxed select-all">
              {gitCommands}
            </div>
          </div>

          {/* Step 3: Enable GitHub Pages */}
          <div className="bg-[#121724] p-4 rounded-xl border border-[#20293D] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-400 text-slate-950 font-black flex items-center justify-center text-[11px] font-mono">
                  3
                </span>
                <span className="font-bold text-white text-xs">
                  Activar Web Pública Gratis (GitHub Pages)
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                100% Automático
              </span>
            </div>
            
            <p className="text-slate-400 text-[11px] pl-7 leading-relaxed">
              El repositorio ya incluye el archivo de despliegue automático <code className="bg-[#090C13] px-1 py-0.5 rounded text-amber-300 font-mono">.github/workflows/deploy.yml</code>.
            </p>

            <div className="ml-7 bg-[#090C13] p-3 rounded-lg border border-[#1E2638] space-y-1 text-[11px] text-slate-300">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>En GitHub, ve a la pestaña <strong>Settings &gt; Pages</strong> de tu repositorio.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>En <strong>Source</strong>, selecciona <strong>GitHub Actions</strong>.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Tu app estará publicada en vivo en: <a href={pagesUrl} target="_blank" rel="noreferrer" className="text-amber-400 hover:underline font-mono font-bold">{pagesUrl}</a></span>
              </div>
            </div>
          </div>

          {/* Key Advantages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-[#121724] rounded-xl border border-[#20293D] flex items-center gap-2.5">
              <Globe className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <h4 className="font-bold text-white text-[11px]">Rutas Relativas Garantizadas</h4>
                <p className="text-[10px] text-slate-400">Vite está configurado con <code className="text-amber-300">base: './'</code> para que funcione en cualquier subcarpeta de GitHub Pages.</p>
              </div>
            </div>

            <div className="p-3 bg-[#121724] rounded-xl border border-[#20293D] flex items-center gap-2.5">
              <Terminal className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-bold text-white text-[11px]">Git Inicializado & Documentado</h4>
                <p className="text-[10px] text-slate-400">Incluye README.md completo con arquitectura y .gitignore optimizado.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-[#090C13] border-t border-[#1E2638] flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500">
            ObraControl v1.0 · Ready for GitHub
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
