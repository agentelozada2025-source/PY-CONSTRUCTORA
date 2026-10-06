/**
 * =========================================================================
 * OBRACONTROL - BACKEND GOOGLE APPS SCRIPT PARA GOOGLE DRIVE PERMANENTE
 * =========================================================================
 * 
 * Este script se ejecuta en Google Apps Script con los permisos de tu cuenta
 * de Google (propietario de la carpeta) y permite a ObraControl subir archivos
 * y crear carpetas 24/7 sin ventanas emergentes ni expiración de tokens.
 * 
 * CARPETA OFICIAL DE DESTINO:
 * https://drive.google.com/drive/folders/1qmD_GbS5OUbiXC_vHB3h4c1qrB5ZpCA2
 */

// ID de la carpeta oficial de ObraControl en Google Drive
var TARGET_FOLDER_ID = '1qmD_GbS5OUbiXC_vHB3h4c1qrB5ZpCA2';

// Estructura de 4 subcarpetas por contrato
var CATEGORY_FOLDERS = {
  'CONTRATOS': '1. Contratos y Legal',
  'VOUCHERS': '2. Vouchers de Cobranza',
  'VENTAS': '3. Facturación y Ventas',
  'GASTOS': '4. Comprobantes de Gastos y Compras'
};

/**
 * Endpoint GET: Prueba de salud y verificación de acceso a la carpeta
 */
function doGet(e) {
  try {
    var folder = DriveApp.getFolderById(TARGET_FOLDER_ID);
    var response = {
      status: 'success',
      message: 'Conexión permanente con Google Drive activa y funcionando.',
      folderName: folder.getName(),
      folderId: folder.getId(),
      folderUrl: folder.getUrl(),
      timestamp: new Date().toISOString()
    };
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    var errorResponse = {
      status: 'error',
      message: 'No se pudo acceder a la carpeta destino: ' + err.toString()
    };
    return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Endpoint POST: Subida de archivos y organización automática en carpetas
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('No se recibieron datos en el cuerpo de la petición POST');
    }

    var payload = JSON.parse(e.postData.contents);

    // Acción de prueba rápida
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

    // Limpiar prefijo dataUrl si viene incluido (ej: data:application/pdf;base64,...)
    var cleanBase64 = base64Data;
    if (cleanBase64.indexOf(',') > -1) {
      cleanBase64 = cleanBase64.split(',')[1];
    }

    // Decodificar base64 a archivo binario Blob
    var decodedBytes = Utilities.base64Decode(cleanBase64);
    var blob = Utilities.newBlob(decodedBytes, mimeType, fileName);

    // 1. Obtener la carpeta raíz oficial en Google Drive
    var rootFolder = DriveApp.getFolderById(TARGET_FOLDER_ID);
    var targetFolder = rootFolder;
    var contractFolder = null;

    // 2. Si viene especificado un contrato, organizar en subcarpeta del contrato y categoría
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

    // 3. Crear el archivo en la subcarpeta correspondiente
    var file = targetFolder.createFile(blob);
    if (description) {
      file.setDescription(description);
    }

    var result = {
      status: 'success',
      fileId: file.getId(),
      name: file.getName(),
      webViewLink: file.getUrl(),
      size: file.getSize(),
      folderId: targetFolder.getId(),
      folderUrl: targetFolder.getUrl(),
      contractFolderUrl: contractFolder ? contractFolder.getUrl() : targetFolder.getUrl()
    };

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    var errObj = {
      status: 'error',
      message: error.toString()
    };
    return ContentService.createTextOutput(JSON.stringify(errObj))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Función auxiliar para buscar o crear una subcarpeta dentro de otra
 */
function getOrCreateSubfolder(parentFolder, folderName) {
  var folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parentFolder.createFolder(folderName);
}
