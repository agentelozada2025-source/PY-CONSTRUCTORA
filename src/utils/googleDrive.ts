import { User } from 'firebase/auth';
import { 
  auth, 
  googleSignIn as authGoogleSignIn, 
  getAccessToken, 
  initAuth, 
  logout,
  autoConnectDrive
} from '../services/googleAuthService';
import { 
  getAppsScriptUrl, 
  setAppsScriptUrl 
} from '../services/googleDriveService';

export { autoConnectDrive, getAppsScriptUrl, setAppsScriptUrl };

/**
 * ID y enlace directo a la carpeta destino oficial en Google Drive
 */
export const GOOGLE_DRIVE_TARGET_FOLDER_ID = '1qmD_GbS5OUbiXC_vHB3h4c1qrB5ZpCA2';
export const GOOGLE_DRIVE_TARGET_FOLDER_URL = `https://drive.google.com/drive/folders/${GOOGLE_DRIVE_TARGET_FOLDER_ID}`;

/**
 * Scope de OAuth específico requerido para interactuar con archivos en Google Drive
 */
export const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
];

export { auth };

export interface GoogleDriveUploadResult {
  fileId: string;
  name: string;
  webViewLink: string;
  size?: number;
  folderId: string;
  folderUrl: string;
}

export interface UploadFileOptions {
  /**
   * Archivo a subir: puede ser un objeto File del navegador,
   * un Blob, o un objeto con { name, dataUrl, mimeType }
   */
  file: File | Blob | { name: string; dataUrl: string; mimeType?: string };
  /**
   * Nombre deseado para el archivo en Google Drive (opcional, por defecto toma el nombre del archivo)
   */
  fileName?: string;
  /**
   * Carpeta de destino (opcional, por defecto se sube a GOOGLE_DRIVE_TARGET_FOLDER_ID)
   */
  folderId?: string;
  /**
   * Descripción o metadatos del archivo en Drive (opcional)
   */
  description?: string;
  /**
   * Token de acceso previo (opcional; si no se provee, se utiliza el token en memoria o se solicita inicio de sesión)
   */
  accessToken?: string;
}

/**
 * Inicia el flujo de autenticación con Google mediante ventana emergente
 * y obtiene el token de acceso con los permisos de Drive.
 */
export async function signInWithGoogle(): Promise<{ user: User; accessToken: string } | null> {
  return await authGoogleSignIn();
}

/**
 * Obtiene el token de acceso actual en memoria si está disponible.
 */
export async function getDriveAccessToken(): Promise<string | null> {
  return await getAccessToken();
}

/**
 * Verifica si el usuario actual tiene sesión activa con token disponible.
 */
export async function isDriveAuthenticated(): Promise<boolean> {
  if (getAppsScriptUrl()) {
    return true;
  }
  const token = await getAccessToken();
  return !!token;
}

/**
 * Escucha cambios en el estado de autenticación de Firebase
 */
export function subscribeAuthState(
  callback: (user: User | null, token: string | null) => void
): () => void {
  return initAuth(
    (user, token) => callback(user, token),
    () => callback(null, null)
  );
}

/**
 * Cierra la sesión activa de Google y limpia el token en memoria
 */
export async function signOutGoogle(): Promise<void> {
  await logout();
}

/**
 * Convierte un dataUrl (formato base64) en un objeto Blob para transferencia binaria
 */
export function dataUrlToBlob(dataUrl: string): { blob: Blob; mimeType: string } {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0]?.match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const byteString = atob(parts[1] || '');
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return { blob: new Blob([ab], { type: mimeType }), mimeType };
}

/**
 * Sube un archivo binario a una carpeta específica en Google Drive usando la API REST v3 (multipart)
 */
async function uploadBlobToDriveFolder(
  blob: Blob,
  fileName: string,
  mimeType: string,
  folderId: string,
  token: string,
  description?: string
): Promise<GoogleDriveUploadResult> {
  const metadata = {
    name: fileName,
    parents: [folderId],
    description: description || 'Documento subido desde ObraControl',
  };

  const boundary = '-------DriveUploadBoundary' + Date.now();
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataPart = delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata);

  const fileHeaderPart = delimiter +
    `Content-Type: ${mimeType}\r\n\r\n`;

  const arrayBuffer = await blob.arrayBuffer();

  const enc = new TextEncoder();
  const p1 = enc.encode(metadataPart);
  const p2 = enc.encode(fileHeaderPart);
  const p3 = new Uint8Array(arrayBuffer);
  const p4 = enc.encode(closeDelimiter);

  const totalLength = p1.length + p2.length + p3.length + p4.length;
  const combined = new Uint8Array(totalLength);
  combined.set(p1, 0);
  combined.set(p2, p1.length);
  combined.set(p3, p1.length + p2.length);
  combined.set(p4, p1.length + p2.length + p3.length);

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,size,parents',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: combined,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = errorData?.error?.message || `Error HTTP ${response.status}: ${response.statusText}`;
    throw new Error(`Fallo al subir a Google Drive: ${message}`);
  }

  const data = await response.json();
  const webViewLink = data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`;

  return {
    fileId: data.id,
    name: data.name,
    webViewLink,
    size: data.size ? parseInt(data.size, 10) : undefined,
    folderId,
    folderUrl: `https://drive.google.com/drive/folders/${folderId}`,
  };
}

/**
 * Función principal para subir archivos a la carpeta designada de Google Drive.
 * Si el usuario no ha iniciado sesión, abrirá automáticamente la ventana de autenticación.
 *
 * @param options Configuración del archivo, destino y descripción
 * @returns Información del archivo subido en Google Drive con su enlace de visualización
 */
export async function uploadFileToDrive(
  options: UploadFileOptions
): Promise<GoogleDriveUploadResult> {
  const targetFolderId = options.folderId || GOOGLE_DRIVE_TARGET_FOLDER_ID;

  // 1. Si está configurado Google Apps Script, usar subida directa permanente sin pedir OAuth
  const appsScriptUrl = getAppsScriptUrl();
  if (appsScriptUrl) {
    let base64Data = '';
    let fileName = options.fileName || 'documento';
    let mimeType = 'application/octet-stream';

    const rawFile = options.file;
    if (rawFile instanceof File) {
      fileName = options.fileName || rawFile.name;
      mimeType = rawFile.type || 'application/octet-stream';
      base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(rawFile);
      });
    } else if (rawFile instanceof Blob) {
      fileName = options.fileName || 'archivo';
      mimeType = rawFile.type || 'application/octet-stream';
      base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(rawFile);
      });
    } else if (rawFile && typeof rawFile === 'object' && 'dataUrl' in rawFile) {
      fileName = options.fileName || rawFile.name || 'documento';
      mimeType = rawFile.mimeType || ('type' in rawFile && typeof (rawFile as any).type === 'string' ? (rawFile as any).type : 'application/octet-stream');
      base64Data = rawFile.dataUrl;
    }

    const payload = {
      action: 'upload',
      fileName,
      mimeType,
      base64Data,
      folderId: targetFolderId,
      description: options.description,
    };

    const res = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: Error al comunicarse con Google Apps Script`);
    }

    const data = await res.json();
    if (data.status === 'success') {
      return {
        fileId: data.fileId,
        name: data.name,
        webViewLink: data.webViewLink,
        size: data.size,
        folderId: data.folderId,
        folderUrl: data.folderUrl,
      };
    } else {
      throw new Error(data.message || 'Error en Google Apps Script al subir archivo');
    }
  }

  // 2. Conexión OAuth estándar
  let token = options.accessToken || (await getAccessToken());
  if (!token) {
    const authResult = await signInWithGoogle();
    if (!authResult) {
      throw new Error('Se requiere autenticación de Google para subir archivos a Drive.');
    }
    token = authResult.accessToken;
  }

  // 2. Normalizar el archivo en un Blob, nombre y tipo MIME
  let fileBlob: Blob;
  let fileName = options.fileName || 'documento';
  let mimeType = 'application/octet-stream';

  const rawFile = options.file;

  if (rawFile instanceof File) {
    fileBlob = rawFile;
    fileName = options.fileName || rawFile.name;
    mimeType = rawFile.type || 'application/octet-stream';
  } else if (rawFile instanceof Blob) {
    fileBlob = rawFile;
    mimeType = rawFile.type || 'application/octet-stream';
  } else if (rawFile && typeof rawFile === 'object' && 'dataUrl' in rawFile) {
    const converted = dataUrlToBlob(rawFile.dataUrl);
    fileBlob = converted.blob;
    fileName = options.fileName || rawFile.name || 'documento';
    mimeType = rawFile.mimeType || ('type' in rawFile && typeof (rawFile as any).type === 'string' ? (rawFile as any).type : converted.mimeType);
  } else {
    throw new Error('Formato de archivo no soportado. Proporcione un File, Blob o dataUrl.');
  }

  // 3. Ejecutar subida a la carpeta de Google Drive
  return await uploadBlobToDriveFolder(
    fileBlob,
    fileName,
    mimeType,
    targetFolderId,
    token,
    options.description
  );
}

export interface DriveFolderVerificationResult {
  success: boolean;
  status: 'ok' | 'not_authenticated' | 'not_found' | 'forbidden' | 'trashed' | 'read_only' | 'error';
  folderId: string;
  folderName?: string;
  webViewLink?: string;
  canUpload?: boolean;
  message: string;
  details?: any;
}

/**
 * Función de prueba para verificar la autenticación y la existencia de la carpeta de Drive definida.
 * Realiza una llamada a files.get con el ID de la carpeta en Google Drive API v3
 * y notifica al usuario si el acceso es correcto o si existe algún problema de permisos.
 *
 * @param folderId ID de la carpeta a verificar (por defecto GOOGLE_DRIVE_TARGET_FOLDER_ID)
 * @param notifyUser Si es true (por defecto), muestra una alerta interactiva al usuario en pantalla
 * @returns Resultado estructurado con estado de acceso, detalles y mensaje informativo
 */
export async function testDriveFolderAccess(
  folderId: string = GOOGLE_DRIVE_TARGET_FOLDER_ID,
  notifyUser: boolean = true
): Promise<DriveFolderVerificationResult> {
  // 1. Si está configurado Google Apps Script, verificar mediante llamada al Web App
  const appsScriptUrl = getAppsScriptUrl();
  if (appsScriptUrl) {
    try {
      const res = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'verify' }),
      });

      if (res.ok) {
        const data = await res.json();
        const result: DriveFolderVerificationResult = {
          success: true,
          status: 'ok',
          folderId,
          folderName: data.folderName || 'Carpeta Oficial',
          webViewLink: data.folderUrl || `https://drive.google.com/drive/folders/${folderId}`,
          canUpload: true,
          message: '✅ Conexión Permanente Activa (Google Apps Script). La carpeta oficial está conectada 24/7 sin ventanas emergentes ni caducidad de tokens.',
          details: data,
        };
        if (notifyUser) alert(result.message);
        return result;
      }
    } catch (appsErr: any) {
      console.warn('Fallo al probar Apps Script, continuando con verificación OAuth:', appsErr);
    }
  }

  // 2. Verificar autenticación OAuth
  let token = await getAccessToken();
  if (!token) {
    try {
      const authResult = await signInWithGoogle();
      if (!authResult?.accessToken) {
        const result: DriveFolderVerificationResult = {
          success: false,
          status: 'not_authenticated',
          folderId,
          message: 'No se pudo verificar la carpeta porque no se inició sesión con Google. Conecta tu cuenta e intenta nuevamente.',
        };
        if (notifyUser) alert(result.message);
        return result;
      }
      token = authResult.accessToken;
    } catch (authErr: any) {
      const result: DriveFolderVerificationResult = {
        success: false,
        status: 'not_authenticated',
        folderId,
        message: 'Error al autenticar con Google: ' + (authErr.message || 'Operación cancelada.'),
      };
      if (notifyUser) alert(result.message);
      return result;
    }
  }

  // 2. Llamada a la API files.get con el ID de la carpeta
  try {
    const fields = 'id,name,mimeType,trashed,capabilities,webViewLink,owners';
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(folderId)}?fields=${encodeURIComponent(fields)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();

      // Verificar si la carpeta está en la papelera
      if (data.trashed) {
        const result: DriveFolderVerificationResult = {
          success: false,
          status: 'trashed',
          folderId,
          folderName: data.name,
          webViewLink: data.webViewLink,
          message: `⚠️ La carpeta "${data.name}" existe pero se encuentra en la papelera de Google Drive. Debes restaurarla en Drive para poder almacenar archivos.`,
          details: data,
        };
        if (notifyUser) alert(result.message);
        return result;
      }

      // Verificar permisos de escritura / subida
      const canAddChildren = data.capabilities?.canAddChildren ?? true;
      const canEdit = data.capabilities?.canEdit ?? true;

      if (!canAddChildren && !canEdit) {
        const result: DriveFolderVerificationResult = {
          success: false,
          status: 'read_only',
          folderId,
          folderName: data.name,
          webViewLink: data.webViewLink,
          canUpload: false,
          message: `⚠️ Tienes acceso de solo lectura a la carpeta "${data.name}". No cuentas con permisos para subir archivos o crear subcarpetas. Solicita permisos de edición al propietario de la carpeta.`,
          details: data,
        };
        if (notifyUser) alert(result.message);
        return result;
      }

      // Acceso correcto y verificado
      const result: DriveFolderVerificationResult = {
        success: true,
        status: 'ok',
        folderId,
        folderName: data.name,
        webViewLink: data.webViewLink || `https://drive.google.com/drive/folders/${folderId}`,
        canUpload: true,
        message: `✅ Acceso verificado correctamente: La carpeta oficial "${data.name}" está activa y cuentas con permisos completos para subir y gestionar contratos y comprobantes.`,
        details: data,
      };
      if (notifyUser) alert(result.message);
      return result;
    }

    // Manejo de errores específicos según código HTTP
    if (response.status === 404) {
      const result: DriveFolderVerificationResult = {
        success: false,
        status: 'not_found',
        folderId,
        message: `❌ Carpeta no encontrada (Error 404): No se localizó la carpeta con ID "${folderId}" o la cuenta de Google activa no tiene permisos para acceder a ella. Asegúrate de que la carpeta esté compartida con tu correo.`,
      };
      if (notifyUser) alert(result.message);
      return result;
    }

    if (response.status === 403) {
      const errorData = await response.json().catch(() => null);
      const apiMsg = errorData?.error?.message || 'Permisos insuficientes';
      const result: DriveFolderVerificationResult = {
        success: false,
        status: 'forbidden',
        folderId,
        message: `🚫 Problema de permisos (Error 403): ${apiMsg}. Verifica que tu cuenta tenga permisos en la carpeta y que el scope de Google Drive esté autorizado.`,
        details: errorData,
      };
      if (notifyUser) alert(result.message);
      return result;
    }

    if (response.status === 401) {
      const result: DriveFolderVerificationResult = {
        success: false,
        status: 'not_authenticated',
        folderId,
        message: '🔒 Sesión expirada (Error 401): Tu token de Google ha caducado. Vuelve a iniciar sesión para renovar el acceso.',
      };
      if (notifyUser) alert(result.message);
      return result;
    }

    // Otro código de error HTTP
    const errBody = await response.json().catch(() => null);
    const result: DriveFolderVerificationResult = {
      success: false,
      status: 'error',
      folderId,
      message: `Error al consultar la carpeta en Google Drive (HTTP ${response.status}): ${errBody?.error?.message || response.statusText}`,
      details: errBody,
    };
    if (notifyUser) alert(result.message);
    return result;
  } catch (netErr: any) {
    const result: DriveFolderVerificationResult = {
      success: false,
      status: 'error',
      folderId,
      message: 'Error de red o comunicación con Google Drive API: ' + (netErr.message || 'Fallo de conexión'),
      details: netErr,
    };
    if (notifyUser) alert(result.message);
    return result;
  }
}

/**
 * Alias de conveniencia para testDriveFolderAccess
 */
export const verifyDriveFolderAccess = testDriveFolderAccess;
