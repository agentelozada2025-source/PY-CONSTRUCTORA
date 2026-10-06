import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Trash2,
  HelpCircle,
  FileCode,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { 
  getAppsScriptUrl, 
  setAppsScriptUrl, 
  TARGET_DRIVE_FOLDER_ID,
  TARGET_DRIVE_FOLDER_URL
} from '../services/googleDriveService';

interface GoogleAppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged?: () => void;
}

const APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * OBRACONTROL - BACKEND GOOGLE APPS SCRIPT PARA GOOGLE DRIVE PERMANENTE
 * =========================================================================
 * Carpeta Oficial: 1qmD_GbS5OUbiXC_vHB3h4c1qrB5ZpCA2
 */

var TARGET_FOLDER_ID = '1qmD_GbS5OUbiXC_vHB3h4c1qrB5ZpCA2';

var CATEGORY_FOLDERS = {
  'CONTRATOS': '1. Contratos y Legal',
  'VOUCHERS': '2. Vouchers de Cobranza',
  'VENTAS': '3. Facturación y Ventas',
  'GASTOS': '4. Comprobantes de Gastos y Compras'
};

function doGet(e) {
  try {
    var folder = DriveApp.getFolderById(TARGET_FOLDER_ID);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Conexión permanente con Google Drive activa y funcionando.',
      folderName: folder.getName(),
      folderId: folder.getId(),
      folderUrl: folder.getUrl(),
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'No se pudo acceder a la carpeta destino: ' + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('No se recibieron datos en el cuerpo del POST');
    }

    var payload = JSON.parse(e.postData.contents);

    // Ping / Verificación rápida
    if (payload.action === 'ping' || payload.action === 'verify') {
      var checkFolder = DriveApp.getFolderById(TARGET_FOLDER_ID);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Verificación exitosa. La carpeta oficial "' + checkFolder.getName() + '" está conectada permanentemente.',
        folderId: checkFolder.getId(),
        folderName: checkFolder.getName(),
        folderUrl: checkFolder.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var fileName = payload.fileName || payload.name || ('documento_' + new Date().getTime() + '.pdf');
    var mimeType = payload.mimeType || 'application/octet-stream';
    var base64Data = payload.base64Data || payload.dataUrl;
    var contractNumber = payload.contractNumber || 'Obra';
    var clientName = payload.clientName || 'Cliente';
    var category = payload.category || 'CONTRATOS';
    var description = payload.description || ('Documento: ' + fileName);

    if (!base64Data) {
      throw new Error('Falta el contenido del archivo en base64');
    }

    var cleanBase64 = base64Data;
    if (cleanBase64.indexOf(',') > -1) {
      cleanBase64 = cleanBase64.split(',')[1];
    }

    var decodedBytes = Utilities.base64Decode(cleanBase64);
    var blob = Utilities.newBlob(decodedBytes, mimeType, fileName);

    var rootFolder = DriveApp.getFolderById(TARGET_FOLDER_ID);
    var targetFolder = rootFolder;
    var contractFolder = null;

    if (contractNumber && contractNumber !== 'General') {
      var contractFolderName = ('[' + contractNumber + '] ' + clientName).trim();
      contractFolder = getOrCreateSubfolder(rootFolder, contractFolderName);
      var subfolderName = CATEGORY_FOLDERS[category] || '1. Contratos y Legal';
      targetFolder = getOrCreateSubfolder(contractFolder, subfolderName);
    } else if (payload.folderId) {
      try {
        targetFolder = DriveApp.getFolderById(payload.folderId);
      } catch (err) {
        targetFolder = rootFolder;
      }
    }

    var file = targetFolder.createFile(blob);
    if (description) {
      file.setDescription(description);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      fileId: file.getId(),
      name: file.getName(),
      webViewLink: file.getUrl(),
      size: file.getSize(),
      folderId: targetFolder.getId(),
      folderUrl: targetFolder.getUrl(),
      contractFolderUrl: contractFolder ? contractFolder.getUrl() : targetFolder.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSubfolder(parentFolder, folderName) {
  var folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parentFolder.createFolder(folderName);
}`;

export const GoogleAppsScriptModal: React.FC<GoogleAppsScriptModalProps> = ({
  isOpen,
  onClose,
  onConfigChanged,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const saved = getAppsScriptUrl();
      setCurrentUrl(saved);
      setUrlInput(saved || '');
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Error al copiar código:', err);
    }
  };

  const handleSaveUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setAppsScriptUrl(null);
      setCurrentUrl(null);
      setTestResult({ success: true, message: 'Se ha restablecido la conexión estándar OAuth.' });
      if (onConfigChanged) onConfigChanged();
      return;
    }

    if (!trimmed.startsWith('https://script.google.com/')) {
      alert('La URL ingresada debe comenzar con "https://script.google.com/.../exec"');
      return;
    }

    setAppsScriptUrl(trimmed);
    setCurrentUrl(trimmed);
    setTestResult({ success: true, message: '¡URL de Google Apps Script guardada correctamente!' });
    if (onConfigChanged) onConfigChanged();
  };

  const handleClearUrl = () => {
    setAppsScriptUrl(null);
    setCurrentUrl(null);
    setUrlInput('');
    setTestResult({ success: true, message: 'Se ha eliminado la URL. Ahora se usará la conexión OAuth.' });
    if (onConfigChanged) onConfigChanged();
  };

  const handleTestConnection = async () => {
    const targetUrl = urlInput.trim() || currentUrl;
    if (!targetUrl) {
      alert('Ingresa primero la URL de tu Google Apps Script');
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'ping' }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.status === 'success') {
        setTestResult({
          success: true,
          message: data.message || '✅ ¡Conexión permanente exitosa con tu Google Drive! Todos los archivos se guardarán 24/7 sin pedir sesión.',
        });
      } else {
        setTestResult({
          success: false,
          message: '⚠️ ' + (data.message || 'El script respondió con error.'),
        });
      }
    } catch (err: any) {
      console.error('Error probando Apps Script:', err);
      setTestResult({
        success: false,
        message: '❌ No se pudo conectar con el script. Verifica que la implementación esté en "Cualquier usuario (Anyone)" y termine en "/exec".',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-70 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-6 overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Google Drive Permanente (Google Apps Script)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  SIEMPRE CONECTADO 24/7
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Guarda contratos y comprobantes sin ventanas emergentes, sin pedir login y sin que caduque la sesión.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs text-slate-700">
          {/* Carpeta Destino Oficial */}
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sky-950 text-xs">Carpeta Oficial Vinculada:</span>
              <code className="font-mono bg-white px-2 py-0.5 rounded border border-sky-200 text-sky-900 font-bold">
                {TARGET_DRIVE_FOLDER_ID}
              </code>
            </div>
            <a
              href={TARGET_DRIVE_FOLDER_URL}
              target="_blank"
              rel="noreferrer"
              className="text-sky-800 hover:underline font-bold inline-flex items-center gap-1 text-xs"
            >
              <span>Abrir en Google Drive ↗</span>
            </a>
          </div>

          {/* Configuración de URL del Web App */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-900">
              URL de la Aplicación Web (Google Apps Script Web App URL):
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                className="flex-1 px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 bg-white"
              />
              <button
                type="button"
                onClick={handleSaveUrl}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                Guardar URL
              </button>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || (!urlInput.trim() && !currentUrl)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap inline-flex items-center gap-1.5"
              >
                {isTesting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Probando...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Probar Conexión</span>
                  </>
                )}
              </button>
              {currentUrl && (
                <button
                  type="button"
                  onClick={handleClearUrl}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  title="Eliminar URL de Apps Script y volver a OAuth"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {testResult && (
              <div className={`p-3 rounded-xl border text-xs font-medium ${
                testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                {testResult.message}
              </div>
            )}

            {currentUrl ? (
              <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Modo Permanente Activo: Los archivos se subirán directamente sin pedir inicio de sesión.</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-500">
                Pega la URL de tu script publicado arriba para activar la subida directa y permanente 24/7.
              </p>
            )}
          </div>

          {/* Tutorial Paso a Paso */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-sky-600" />
              <span>Instrucciones de Implementación (Solo toma 2 minutos)</span>
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-xs leading-relaxed text-slate-700">
              <li>
                Entra a <a href="https://script.google.com/home/start" target="_blank" rel="noreferrer" className="text-sky-600 font-bold hover:underline">script.google.com ↗</a> con tu cuenta de Google (<span className="font-semibold text-slate-900">agentelozada2025@gmail.com</span>) y haz clic en <strong>"Nuevo proyecto"</strong>.
              </li>
              <li>
                Borra el código que aparezca en el editor, haz clic en el botón <strong>"Copiar Código Apps Script"</strong> que está abajo y pégalo.
              </li>
              <li>
                Haz clic en el botón azul superior <strong>"Implementar"</strong> (arriba a la derecha) &gt; <strong>"Nueva implementación"</strong>.
              </li>
              <li>
                Haz clic en el ícono de engranaje ⚙️ (Seleccionar tipo) &gt; elige <strong>"Aplicación web"</strong> y configura:
                <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5 text-slate-800">
                  <li><strong>Ejecutar como:</strong> Yo (tu cuenta)</li>
                  <li><strong>Quién tiene acceso:</strong> Cualquier usuario (Anyone)</li>
                </ul>
              </li>
              <li>
                Haz clic en <strong>"Implementar"</strong>, concede los permisos de Google Drive cuando te los solicite, y copia la <strong>URL de la aplicación web</strong> que termina en <code>/exec</code>.
              </li>
              <li>
                Pega esa URL en el campo de arriba y haz clic en <strong>"Guardar URL"</strong> y <strong>"Probar Conexión"</strong>.
              </li>
            </ol>
          </div>

          {/* Código Fuente para Copiar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-sky-600" />
                <span>Código Fuente de Google Apps Script (Code.gs):</span>
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>¡Copiado al Portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Código</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-64 border border-slate-800 leading-normal">
                {APPS_SCRIPT_CODE}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {currentUrl ? '✓ Modo Permanente Activo' : 'Modo Estándar (OAuth Activo)'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
