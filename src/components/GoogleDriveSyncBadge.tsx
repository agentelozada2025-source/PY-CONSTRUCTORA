import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  getAccessToken 
} from '../services/googleAuthService';
import { 
  TARGET_DRIVE_FOLDER_ID, 
  TARGET_DRIVE_FOLDER_URL, 
  testDriveFolderAccess,
  getAppsScriptUrl
} from '../services/googleDriveService';
import { ExternalLink, CheckCircle2, AlertCircle, LogOut, ShieldCheck, Zap, Settings } from 'lucide-react';
import { GoogleAppsScriptModal } from './GoogleAppsScriptModal';

interface GoogleDriveSyncBadgeProps {
  onAuthChange?: (user: User | null, token: string | null) => void;
  compact?: boolean;
}

export const GoogleDriveSyncBadge: React.FC<GoogleDriveSyncBadgeProps> = ({ 
  onAuthChange,
  compact = false 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTestingFolder, setIsTestingFolder] = useState(false);
  const [isAppsScriptModalOpen, setIsAppsScriptModalOpen] = useState(false);
  const [hasAppsScript, setHasAppsScript] = useState<boolean>(!!getAppsScriptUrl());

  const refreshAppsScriptStatus = () => {
    setHasAppsScript(!!getAppsScriptUrl());
  };

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
        if (onAuthChange) onAuthChange(currentUser, currentToken);
      },
      () => {
        setUser(null);
        setToken(null);
        if (onAuthChange) onAuthChange(null, null);
      }
    );

    return () => unsubscribe();
  }, [onAuthChange]);

  const handleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        if (onAuthChange) onAuthChange(res.user, res.accessToken);
      }
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
      setErrorMsg('No se pudo conectar con Google Drive.');
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setToken(null);
    if (onAuthChange) onAuthChange(null, null);
  };

  const handleTestFolder = async () => {
    setIsTestingFolder(true);
    try {
      await testDriveFolderAccess(TARGET_DRIVE_FOLDER_ID, true);
    } catch (err: any) {
      console.error('Error al probar carpeta:', err);
    } finally {
      setIsTestingFolder(false);
    }
  };

  if (compact) {
    if (hasAppsScript) {
      return (
        <>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-xs text-emerald-200 shadow-sm">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
            <span className="font-extrabold hidden sm:inline" title="Conexión permanente con Google Apps Script 24/7 sin popups">Drive 24/7</span>
            <a 
              href={TARGET_DRIVE_FOLDER_URL} 
              target="_blank" 
              rel="noreferrer" 
              className="hover:underline text-[11px] font-bold text-emerald-300 inline-flex items-center gap-0.5 ml-0.5"
              title="Abrir carpeta oficial de Google Drive"
            >
              Carpeta <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <button
              type="button"
              onClick={() => setIsAppsScriptModalOpen(true)}
              className="text-emerald-400 hover:text-white transition-colors p-0.5 ml-0.5 cursor-pointer"
              title="Configuración de Google Apps Script 24/7"
            >
              <Settings className="w-3 h-3" />
            </button>
          </div>
          <GoogleAppsScriptModal
            isOpen={isAppsScriptModalOpen}
            onClose={() => setIsAppsScriptModalOpen(false)}
            onConfigChanged={refreshAppsScriptStatus}
          />
        </>
      );
    }

    if (user && token) {
      return (
        <>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-xs text-emerald-200 shadow-sm">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
              <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
              <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
            <span className="font-bold hidden sm:inline" title={user.email || ''}>Drive Conectado</span>
            <a 
              href={TARGET_DRIVE_FOLDER_URL} 
              target="_blank" 
              rel="noreferrer" 
              className="hover:underline text-[11px] font-semibold text-emerald-300 inline-flex items-center gap-0.5"
              title="Abrir carpeta oficial de Google Drive"
            >
              Carpeta <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <button
              type="button"
              onClick={() => setIsAppsScriptModalOpen(true)}
              className="text-amber-400 hover:text-amber-300 transition-colors p-0.5 ml-0.5 cursor-pointer"
              title="Pasar a Modo Permanente 24/7 (Apps Script)"
            >
              <Zap className="w-3 h-3 fill-amber-400" />
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-slate-400 hover:text-red-400 transition-colors p-0.5 ml-0.5 cursor-pointer"
              title={`Cerrar sesión (${user.email || 'Google'})`}
            >
              <LogOut className="w-3 h-3" />
            </button>
          </div>
          <GoogleAppsScriptModal
            isOpen={isAppsScriptModalOpen}
            onClose={() => setIsAppsScriptModalOpen(false)}
            onConfigChanged={refreshAppsScriptStatus}
          />
        </>
      );
    }

    return (
      <>
        <div className="inline-flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleSignIn}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-slate-200 hover:text-white transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            title="Conectar Google Drive para guardar comprobantes y contratos en la carpeta configurada"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
              <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
              <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
            <span>{isLoading ? 'Conectando...' : 'Conectar Drive'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAppsScriptModalOpen(true)}
            className="px-2 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/30 text-xs font-bold transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1"
            title="Activar Conexión Permanente 24/7 con Google Apps Script (Sin popups ni logins continuos)"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="hidden md:inline text-[11px]">24/7</span>
          </button>
        </div>
        <GoogleAppsScriptModal
          isOpen={isAppsScriptModalOpen}
          onClose={() => setIsAppsScriptModalOpen(false)}
          onConfigChanged={refreshAppsScriptStatus}
        />
      </>
    );
  }

  // Full banner / card mode
  return (
    <>
      <div className="bg-gradient-to-r from-blue-50/90 via-sky-50/80 to-indigo-50/90 border border-sky-200/80 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-2xs border border-sky-100 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                  Carpeta Google Drive Vinculada
                </span>
                {hasAppsScript ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <Zap className="w-3 h-3 text-amber-500 fill-amber-400" />
                    PERMANENTE 24/7 (APPS SCRIPT)
                  </span>
                ) : user && token ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3" />
                    CONECTADO (OAUTH)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    <AlertCircle className="w-3 h-3" />
                    REQUIERE AUTORIZACIÓN
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Todos los contratos, vouchers y comprobantes subidos se guardan directamente en tu carpeta oficial.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsAppsScriptModalOpen(true)}
              className="px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Configurar o ver código de Google Apps Script para conexión permanente 24/7 sin login"
            >
              <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span>{hasAppsScript ? 'Configuración 24/7' : 'Conectar Siempre (Apps Script)'}</span>
            </button>

            <button
              type="button"
              onClick={handleTestFolder}
              disabled={isTestingFolder}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              title="Probar acceso y permisos en la carpeta oficial de Google Drive mediante files.get"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isTestingFolder ? 'Verificando...' : 'Probar Acceso a Carpeta'}</span>
            </button>

            <a
              href={TARGET_DRIVE_FOLDER_URL}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 text-xs font-bold text-sky-800 bg-white hover:bg-sky-50 border border-sky-300 rounded-xl inline-flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Abrir carpeta en Google Drive"
            >
              <span>Ver Carpeta Drive</span>
              <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
            </a>

            {user && token ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 font-medium truncate max-w-[150px] sm:max-w-[200px]" title={user.email || ''}>
                  {user.displayName || user.email}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                  title="Desconectar cuenta de Google"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : !hasAppsScript ? (
              <button
                type="button"
                onClick={handleSignIn}
                disabled={isLoading}
                className="px-4 py-1.5 text-xs font-extrabold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>{isLoading ? 'Conectando...' : 'Iniciar Sesión con Google'}</span>
              </button>
            ) : null}
          </div>
        </div>
        {errorMsg && (
          <p className="text-xs text-red-600 mt-2 font-bold">{errorMsg}</p>
        )}
      </div>

      <GoogleAppsScriptModal
        isOpen={isAppsScriptModalOpen}
        onClose={() => setIsAppsScriptModalOpen(false)}
        onConfigChanged={refreshAppsScriptStatus}
      />
    </>
  );
};
