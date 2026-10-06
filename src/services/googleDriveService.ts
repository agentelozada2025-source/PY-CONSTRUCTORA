import { getAccessToken, googleSignIn, autoConnectDrive } from './googleAuthService';
export { 
  testDriveFolderAccess, 
  verifyDriveFolderAccess, 
  autoConnectDrive,
  type DriveFolderVerificationResult 
} from '../utils/googleDrive';

export const TARGET_DRIVE_FOLDER_ID = '1qmD_GbS5OUbiXC_vHB3h4c1qrB5ZpCA2';
export const TARGET_DRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${TARGET_DRIVE_FOLDER_ID}`;

/**
 * Obtiene la URL configurada de Google Apps Script para conexión permanente 24/7
 */
export const getAppsScriptUrl = (): string | null => {
  return localStorage.getItem('obracontrol_apps_script_url') || (import.meta as any).env?.VITE_GOOGLE_APPS_SCRIPT_URL || null;
};

/**
 * Guarda o elimina la URL de Google Apps Script
 */
export const setAppsScriptUrl = (url: string | null): void => {
  if (url && url.trim()) {
    localStorage.setItem('obracontrol_apps_script_url', url.trim());
  } else {
    localStorage.removeItem('obracontrol_apps_script_url');
  }
};

export type DocumentDriveCategory = 'CONTRATOS' | 'VOUCHERS' | 'VENTAS' | 'GASTOS';

export const CATEGORY_FOLDER_NAMES: Record<DocumentDriveCategory, string> = {
  CONTRATOS: '1. Contratos y Legal',
  VOUCHERS: '2. Vouchers de Cobranza',
  VENTAS: '3. Facturación y Ventas',
  GASTOS: '4. Comprobantes de Gastos y Compras',
};

export interface DriveUploadResult {
  fileId: string;
  name: string;
  driveUrl: string;
  size?: number;
  folderId?: string;
  folderUrl?: string;
}

export interface DriveFolderInfo {
  id: string;
  name: string;
  webViewLink: string;
}

/**
 * Converts a dataUrl (base64) to a Blob for uploading
 */
function dataUrlToBlob(dataUrl: string): { blob: Blob; mimeType: string } {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
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
 * Finds or creates a folder inside a parent folder in Google Drive
 */
export async function findOrCreateFolder(
  folderName: string,
  parentId: string,
  token: string
): Promise<DriveFolderInfo> {
  const cleanName = folderName.replace(/'/g, "\\'");
  const q = `'${parentId}' in parents and name = '${cleanName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

  // Search if folder already exists
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,webViewLink)&pageSize=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      const f = data.files[0];
      return {
        id: f.id,
        name: f.name,
        webViewLink: f.webViewLink || `https://drive.google.com/drive/folders/${f.id}`,
      };
    }
  }

  // Create folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => null);
    throw new Error(err?.error?.message || `Error al crear carpeta "${folderName}" en Drive`);
  }

  const newFolder = await createRes.json();
  return {
    id: newFolder.id,
    name: newFolder.name,
    webViewLink: newFolder.webViewLink || `https://drive.google.com/drive/folders/${newFolder.id}`,
  };
}

/**
 * Gets or creates the full contract folder structure inside the target Drive folder:
 * Root -> [ContractNumber] ClientName -> Subfolder (e.g. 2. Vouchers de Cobranza)
 */
export async function getOrCreateContractFolderHierarchy(
  contractNumber: string,
  clientName: string,
  category?: DocumentDriveCategory,
  token?: string
): Promise<{
  contractFolder: DriveFolderInfo;
  targetFolder: DriveFolderInfo;
}> {
  const authToken = token || (await getAccessToken());
  if (!authToken) {
    throw new Error('Google Drive no está conectado. Inicia sesión con Google.');
  }

  // Contract root folder name: "[CT-2025-001] Constructora San Martin"
  const contractFolderName = `[${contractNumber || 'CONTRATO'}] ${clientName || 'Cliente'}`.trim();
  const contractFolder = await findOrCreateFolder(contractFolderName, TARGET_DRIVE_FOLDER_ID, authToken);

  if (!category) {
    return { contractFolder, targetFolder: contractFolder };
  }

  const subfolderName = CATEGORY_FOLDER_NAMES[category];
  const targetFolder = await findOrCreateFolder(subfolderName, contractFolder.id, authToken);

  return { contractFolder, targetFolder };
}

/**
 * Uploads a file directly into a specific folder in Google Drive using multipart upload
 */
export async function uploadBlobToDriveFolder(
  fileBlob: Blob,
  fileName: string,
  mimeType: string,
  folderId: string,
  token: string,
  customDescription?: string
): Promise<DriveUploadResult> {
  const metadata = {
    name: fileName,
    parents: [folderId],
    description: customDescription || 'Documento de ObraControl',
  };

  const boundary = '-------ObraControlDriveUploadBoundary' + Date.now();
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataPart = delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata);

  const fileHeaderPart = delimiter +
    `Content-Type: ${mimeType}\r\n\r\n`;

  const arrayBuffer = await fileBlob.arrayBuffer();

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
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,size',
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
    const errMsg = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(`Error al subir a Google Drive: ${errMsg}`);
  }

  const data = await response.json();
  const driveUrl = data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`;

  return {
    fileId: data.id,
    name: data.name,
    driveUrl,
    size: data.size ? parseInt(data.size, 10) : undefined,
    folderId,
    folderUrl: `https://drive.google.com/drive/folders/${folderId}`,
  };
}

/**
 * Uploads a document to Google Drive under the specific contract and document category folder:
 * Root Folder -> [N° Contrato] Cliente -> Subcarpeta de Categoría -> Archivo
 */
export async function uploadDocumentToContractDrive(params: {
  contractNumber: string;
  clientName: string;
  category: DocumentDriveCategory;
  fileOrDataUrl: File | { name: string; dataUrl: string; mimeType?: string };
  customDescription?: string;
}): Promise<DriveUploadResult | null> {
  const { fileOrDataUrl, contractNumber, clientName, category, customDescription } = params;

  // 1. Conexión Permanente con Google Apps Script (si está configurada)
  const appsScriptUrl = getAppsScriptUrl();
  if (appsScriptUrl) {
    let base64Data = '';
    let fileName = '';
    let mimeType = 'application/octet-stream';

    if (fileOrDataUrl instanceof File) {
      fileName = fileOrDataUrl.name;
      mimeType = fileOrDataUrl.type || 'application/octet-stream';
      base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(fileOrDataUrl);
      });
    } else {
      fileName = fileOrDataUrl.name;
      mimeType = fileOrDataUrl.mimeType || 'application/octet-stream';
      base64Data = fileOrDataUrl.dataUrl;
    }

    const payload = {
      action: 'upload',
      fileName,
      mimeType,
      base64Data,
      contractNumber,
      clientName,
      category,
      description: customDescription,
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
        driveUrl: data.webViewLink,
        size: data.size,
        folderId: data.folderId,
        folderUrl: data.contractFolderUrl || data.folderUrl,
      };
    } else {
      throw new Error(data.message || 'Error en Google Apps Script al guardar archivo');
    }
  }

  // 2. Conexión estándar mediante OAuth / Firebase Auth
  const token = await getAccessToken();
  if (!token) {
    // If not authenticated, return null so file continues to be saved locally
    return null;
  }

  let fileName = '';
  let fileBlob: Blob;
  let mimeType = 'application/octet-stream';

  if (fileOrDataUrl instanceof File) {
    fileName = fileOrDataUrl.name;
    mimeType = fileOrDataUrl.type || 'application/octet-stream';
    fileBlob = fileOrDataUrl;
  } else {
    fileName = fileOrDataUrl.name;
    const converted = dataUrlToBlob(fileOrDataUrl.dataUrl);
    fileBlob = converted.blob;
    mimeType = fileOrDataUrl.mimeType || converted.mimeType;
  }

  // 1. Get or create Contract Folder and Subfolder in Drive
  const { contractFolder, targetFolder } = await getOrCreateContractFolderHierarchy(
    contractNumber,
    clientName,
    category,
    token
  );

  // 2. Upload file into the target subfolder
  const uploadRes = await uploadBlobToDriveFolder(
    fileBlob,
    fileName,
    mimeType,
    targetFolder.id,
    token,
    customDescription || `Contrato: ${contractNumber} • ${category}`
  );

  return {
    ...uploadRes,
    folderId: contractFolder.id,
    folderUrl: contractFolder.webViewLink,
  };
}

/**
 * Backward compatibility: uploads directly to root folder if no contract specified
 */
export async function uploadFileToTargetDrive(
  fileOrDataUrl: File | { name: string; dataUrl: string; mimeType?: string },
  customDescription?: string
): Promise<DriveUploadResult | null> {
  const token = await getAccessToken();
  if (!token) {
    return null;
  }

  let fileName = '';
  let fileBlob: Blob;
  let mimeType = 'application/octet-stream';

  if (fileOrDataUrl instanceof File) {
    fileName = fileOrDataUrl.name;
    mimeType = fileOrDataUrl.type || 'application/octet-stream';
    fileBlob = fileOrDataUrl;
  } else {
    fileName = fileOrDataUrl.name;
    const converted = dataUrlToBlob(fileOrDataUrl.dataUrl);
    fileBlob = converted.blob;
    mimeType = fileOrDataUrl.mimeType || converted.mimeType;
  }

  return uploadBlobToDriveFolder(
    fileBlob,
    fileName,
    mimeType,
    TARGET_DRIVE_FOLDER_ID,
    token,
    customDescription
  );
}

/**
 * Checks if Google Drive is currently connected (either via Google Apps Script permanent link or OAuth)
 */
export async function isDriveConnected(): Promise<boolean> {
  if (getAppsScriptUrl()) {
    return true; // Permanently connected 24/7!
  }
  const token = await getAccessToken();
  return !!token;
}
