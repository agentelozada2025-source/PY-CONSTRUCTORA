import React, { useState, useMemo, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { 
  Contract, 
  FileAttachment, 
  Payment, 
  Expense,
  PaymentMethod,
  ExpenseCategory
} from '../types';
import { 
  formatCurrency, 
  formatDate, 
  formatFileSize, 
  formatExpenseCategory 
} from '../utils/formatters';
import { readFileAsBase64 } from '../utils/storage';
import { 
  uploadDocumentToContractDrive,
  TARGET_DRIVE_FOLDER_ID,
  TARGET_DRIVE_FOLDER_URL,
  isDriveConnected,
  getAppsScriptUrl,
  DocumentDriveCategory
} from '../services/googleDriveService';
import { getAccessToken, googleSignIn } from '../services/googleAuthService';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  Download, 
  Eye, 
  Upload, 
  Trash2, 
  FileCheck, 
  DollarSign, 
  Receipt, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  FileArchive, 
  HardDrive, 
  ShieldCheck, 
  AlertCircle,
  Plus,
  RefreshCw,
  FileImage,
  Layers,
  ChevronRight,
  ExternalLink,
  Cloud,
  CloudUpload,
  Check,
  Sparkles
} from 'lucide-react';

interface ContractDocumentArchiveProps {
  contract: Contract;
  onUpdateContract: (updated: Contract) => void;
  onPreviewAttachment: (attachment: FileAttachment, title: string) => void;
}

type ArchiveFolderCategory = 'ALL' | 'CONTRATOS' | 'VOUCHERS' | 'VENTAS' | 'GASTOS';

interface CategorizedDocument {
  id: string;
  category: DocumentDriveCategory;
  folderName: string;
  title: string;
  subtitle: string;
  amount?: number;
  date?: string;
  file: FileAttachment;
  origin: 'contract' | 'payment_voucher' | 'payment_invoice' | 'final_invoice' | 'expense_invoice' | 'expense_voucher';
  originId?: string;
}

export const ContractDocumentArchive: React.FC<ContractDocumentArchiveProps> = ({
  contract,
  onUpdateContract,
  onPreviewAttachment,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ArchiveFolderCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isZipping, setIsZipping] = useState(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [syncProgressMsg, setSyncProgressMsg] = useState<string | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [isDriveAuth, setIsDriveAuth] = useState(false);
  const [contractDriveFolderUrl, setContractDriveFolderUrl] = useState<string | null>(null);

  // Hidden file inputs for direct uploads
  const contractInputRef = useRef<HTMLInputElement>(null);

  // Check Drive Auth status on mount
  useEffect(() => {
    isDriveConnected().then(setIsDriveAuth);
  }, []);

  // Compile all documents across the contract
  const allDocuments = useMemo(() => {
    const docs: CategorizedDocument[] = [];

    // 1. Contrato principal
    if (contract.contractFile) {
      docs.push({
        id: `doc-contract-${contract.id}`,
        category: 'CONTRATOS',
        folderName: '1. Contratos y Legal',
        title: `Contrato Firmado N° ${contract.contractNumber}`,
        subtitle: `${contract.clientName} - Valor: ${formatCurrency(contract.totalAmount)}`,
        amount: contract.totalAmount,
        date: contract.startDate,
        file: contract.contractFile,
        origin: 'contract',
      });
    }

    // 2. Vouchers de Cobranza (Payments)
    if (contract.payments && contract.payments.length > 0) {
      contract.payments.forEach((payment, idx) => {
        const voucher = payment.voucherFile || payment.receiptFile;
        if (voucher) {
          docs.push({
            id: `doc-voucher-${payment.id}`,
            category: 'VOUCHERS',
            folderName: '2. Vouchers de Cobranza',
            title: `Voucher de Abono #${idx + 1} (${payment.method})`,
            subtitle: `Ref/Op: ${payment.reference || 'S/N'} • ${payment.notes || 'Abono a cuenta'}`,
            amount: payment.amount,
            date: payment.date,
            file: voucher,
            origin: 'payment_voucher',
            originId: payment.id,
          });
        }

        // Comprobante emitido al cliente en ese pago
        if (payment.invoiceFile) {
          docs.push({
            id: `doc-pay-inv-${payment.id}`,
            category: 'VENTAS',
            folderName: '3. Facturación y Ventas',
            title: `Comprobante de Venta ${payment.invoiceNumber ? `(${payment.invoiceNumber})` : `#${idx + 1}`}`,
            subtitle: `Emitido a ${contract.clientName} por cobro de ${formatCurrency(payment.amount)}`,
            amount: payment.amount,
            date: payment.date,
            file: payment.invoiceFile,
            origin: 'payment_invoice',
            originId: payment.id,
          });
        }
      });
    }

    // 3. Factura Global Final
    if (contract.invoice?.file) {
      docs.push({
        id: `doc-final-inv-${contract.id}`,
        category: 'VENTAS',
        folderName: '3. Facturación y Ventas',
        title: `Factura Global Oficial: ${contract.invoice.invoiceNumber}`,
        subtitle: `Emitida: ${formatDate(contract.invoice.issueDate)} • ${contract.invoice.notes || 'Factura consolidada de obra'}`,
        amount: contract.totalAmount,
        date: contract.invoice.issueDate,
        file: contract.invoice.file,
        origin: 'final_invoice',
      });
    }

    // 4. Comprobantes de Gastos y Compras (Expenses)
    if (contract.expenses && contract.expenses.length > 0) {
      contract.expenses.forEach((expense, idx) => {
        const invFile = expense.invoiceFile || expense.receiptFile;
        if (invFile) {
          docs.push({
            id: `doc-exp-inv-${expense.id}`,
            category: 'GASTOS',
            folderName: '4. Comprobantes de Gastos y Compras',
            title: `Factura/Boleta Gasto: ${expense.supplier || 'Proveedor'}`,
            subtitle: `[${formatExpenseCategory(expense.category)}] ${expense.description} • Comprobante: ${expense.invoiceNumber || 'S/N'}`,
            amount: expense.amount,
            date: expense.date,
            file: invFile,
            origin: 'expense_invoice',
            originId: expense.id,
          });
        }

        if (expense.voucherFile) {
          docs.push({
            id: `doc-exp-vouc-${expense.id}`,
            category: 'GASTOS',
            folderName: '4. Comprobantes de Gastos y Compras',
            title: `Voucher de Pago a Proveedor: ${expense.supplier}`,
            subtitle: `Pago vía ${expense.paymentMethod} por ${formatCurrency(expense.amount)}`,
            amount: expense.amount,
            date: expense.date,
            file: expense.voucherFile,
            origin: 'expense_voucher',
            originId: expense.id,
          });
        }
      });
    }

    return docs;
  }, [contract]);

  // Statistics
  const counts = useMemo(() => {
    const contractsCount = allDocuments.filter(d => d.category === 'CONTRATOS').length;
    const vouchersCount = allDocuments.filter(d => d.category === 'VOUCHERS').length;
    const salesCount = allDocuments.filter(d => d.category === 'VENTAS').length;
    const expensesCount = allDocuments.filter(d => d.category === 'GASTOS').length;
    const syncedDriveCount = allDocuments.filter(d => !!d.file.driveFileId).length;
    const totalSize = allDocuments.reduce((acc, d) => acc + (d.file.size || 0), 0);

    return {
      all: allDocuments.length,
      contracts: contractsCount,
      vouchers: vouchersCount,
      sales: salesCount,
      expenses: expensesCount,
      syncedDrive: syncedDriveCount,
      totalSize,
    };
  }, [allDocuments]);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return allDocuments.filter(doc => {
      if (selectedCategory !== 'ALL' && doc.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = doc.title.toLowerCase().includes(q);
        const matchSub = doc.subtitle.toLowerCase().includes(q);
        const matchFile = doc.file.name.toLowerCase().includes(q);
        if (!matchTitle && !matchSub && !matchFile) return false;
      }
      return true;
    });
  }, [allDocuments, selectedCategory, searchQuery]);

  // Helper to trigger single file download
  const handleDownloadFile = (file: FileAttachment, suggestedName?: string) => {
    try {
      const link = document.createElement('a');
      link.href = file.dataUrl;
      link.download = suggestedName || file.name || 'documento.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading file:', err);
    }
  };

  // ZIP Generation: Download full contract folder structured by document type
  const handleDownloadFullZip = async () => {
    if (allDocuments.length === 0) {
      alert('No hay documentos adjuntos en este contrato para descargar.');
      return;
    }

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const sanitizedContractNum = contract.contractNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
      const sanitizedClient = contract.clientName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const rootFolderName = `[${sanitizedContractNum}]_${sanitizedClient}`;
      const rootFolder = zip.folder(rootFolderName);

      if (!rootFolder) {
        throw new Error('No se pudo inicializar la carpeta ZIP');
      }

      // Create 4 subfolders
      const folderLegal = rootFolder.folder('1_Contratos_y_Legal');
      const folderVouchers = rootFolder.folder('2_Vouchers_Cobranzas');
      const folderVentas = rootFolder.folder('3_Facturas_y_Ventas');
      const folderGastos = rootFolder.folder('4_Comprobantes_Gastos_Compras');

      // Add files to respective folders
      allDocuments.forEach((doc, idx) => {
        let targetFolder = folderLegal;
        if (doc.category === 'VOUCHERS') targetFolder = folderVouchers;
        if (doc.category === 'VENTAS') targetFolder = folderVentas;
        if (doc.category === 'GASTOS') targetFolder = folderGastos;

        if (targetFolder && doc.file.dataUrl) {
          const parts = doc.file.dataUrl.split(',');
          if (parts.length === 2) {
            const base64Content = parts[1];
            const ext = doc.file.name.includes('.') 
              ? doc.file.name.substring(doc.file.name.lastIndexOf('.'))
              : (doc.file.type.includes('pdf') ? '.pdf' : '.jpg');
            
            const cleanTitle = doc.title
              .replace(/[^a-zA-Z0-9_-]/g, '_')
              .substring(0, 45);

            const fileName = `${idx + 1}_${cleanTitle}${ext}`;
            targetFolder.file(fileName, base64Content, { base64: true });
          }
        }
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${rootFolderName}_Expediente_Completo.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error generating zip:', err);
      alert('Error al generar el archivo ZIP: ' + (err.message || 'Intente nuevamente'));
    } finally {
      setIsZipping(false);
    }
  };

  // Google Drive: Sync all documents of this contract into the specific contract folder and 4 subfolders
  const handleSyncAllToGoogleDrive = async () => {
    if (allDocuments.length === 0) {
      alert('No hay documentos cargados en este contrato para subir a Google Drive.');
      return;
    }

    setIsSyncingDrive(true);
    setSyncProgressMsg('Verificando acceso a Google Drive...');

    try {
      let token = await getAccessToken();
      const appsScriptUrl = getAppsScriptUrl();
      if (!token && !appsScriptUrl) {
        setSyncProgressMsg('Abriendo inicio de sesión de Google...');
        const authRes = await googleSignIn();
        if (!authRes?.accessToken) {
          setIsSyncingDrive(false);
          setSyncProgressMsg(null);
          return;
        }
        token = authRes.accessToken;
        setIsDriveAuth(true);
      } else if (appsScriptUrl) {
        setIsDriveAuth(true);
      }

      setSyncProgressMsg('Preparando carpetas en Google Drive...');
      let updatedContract: Contract = { ...contract };
      let lastFolderUrl: string | undefined = undefined;
      let countUploaded = 0;

      for (let i = 0; i < allDocuments.length; i++) {
        const doc = allDocuments[i];
        setSyncProgressMsg(`Subiendo (${i + 1}/${allDocuments.length}): ${doc.title}...`);

        try {
          const driveRes = await uploadDocumentToContractDrive({
            contractNumber: contract.contractNumber,
            clientName: contract.clientName,
            category: doc.category,
            fileOrDataUrl: {
              name: doc.file.name,
              dataUrl: doc.file.dataUrl,
              mimeType: doc.file.type,
            },
            customDescription: `${doc.title} • ${doc.subtitle}`,
          });

          if (driveRes) {
            countUploaded++;
            if (driveRes.folderUrl) {
              lastFolderUrl = driveRes.folderUrl;
              setContractDriveFolderUrl(driveRes.folderUrl);
            }

            const updatedFile: FileAttachment = {
              ...doc.file,
              driveFileId: driveRes.fileId,
              driveUrl: driveRes.driveUrl,
            };

            // Map updated file back into contract state
            if (doc.origin === 'contract') {
              updatedContract.contractFile = updatedFile;
            } else if (doc.origin === 'payment_voucher') {
              updatedContract.payments = (updatedContract.payments || []).map(p => 
                p.id === doc.originId ? { ...p, voucherFile: updatedFile, receiptFile: updatedFile } : p
              );
            } else if (doc.origin === 'payment_invoice') {
              updatedContract.payments = (updatedContract.payments || []).map(p => 
                p.id === doc.originId ? { ...p, invoiceFile: updatedFile } : p
              );
            } else if (doc.origin === 'final_invoice' && updatedContract.invoice) {
              updatedContract.invoice = { ...updatedContract.invoice, file: updatedFile };
            } else if (doc.origin === 'expense_invoice') {
              updatedContract.expenses = (updatedContract.expenses || []).map(e => 
                e.id === doc.originId ? { ...e, invoiceFile: updatedFile, receiptFile: updatedFile } : e
              );
            } else if (doc.origin === 'expense_voucher') {
              updatedContract.expenses = (updatedContract.expenses || []).map(e => 
                e.id === doc.originId ? { ...e, voucherFile: updatedFile } : e
              );
            }
          }
        } catch (fileErr) {
          console.error(`Error uploading doc ${doc.title}:`, fileErr);
        }
      }

      updatedContract.updatedAt = new Date().toISOString();
      onUpdateContract(updatedContract);

      setSyncNotice(`¡${countUploaded} documento(s) sincronizados con éxito en Google Drive dentro de su carpeta por contrato!`);
      setTimeout(() => setSyncNotice(null), 6000);
    } catch (err: any) {
      console.error('Error syncing to Drive:', err);
      alert(err.message || 'Error al sincronizar con Google Drive');
    } finally {
      setIsSyncingDrive(false);
      setSyncProgressMsg(null);
    }
  };

  // Sync a single document to Google Drive
  const handleSyncSingleDoc = async (doc: CategorizedDocument) => {
    setIsSyncingDrive(true);
    setSyncProgressMsg(`Subiendo a Google Drive: ${doc.title}...`);

    try {
      let token = await getAccessToken();
      const appsScriptUrl = getAppsScriptUrl();
      if (!token && !appsScriptUrl) {
        const authRes = await googleSignIn();
        if (!authRes?.accessToken) {
          setIsSyncingDrive(false);
          setSyncProgressMsg(null);
          return;
        }
        setIsDriveAuth(true);
      } else if (appsScriptUrl) {
        setIsDriveAuth(true);
      }

      const driveRes = await uploadDocumentToContractDrive({
        contractNumber: contract.contractNumber,
        clientName: contract.clientName,
        category: doc.category,
        fileOrDataUrl: {
          name: doc.file.name,
          dataUrl: doc.file.dataUrl,
          mimeType: doc.file.type,
        },
        customDescription: `${doc.title} • ${doc.subtitle}`,
      });

      if (driveRes) {
        if (driveRes.folderUrl) {
          setContractDriveFolderUrl(driveRes.folderUrl);
        }

        const updatedFile: FileAttachment = {
          ...doc.file,
          driveFileId: driveRes.fileId,
          driveUrl: driveRes.driveUrl,
        };

        let updatedContract: Contract = { ...contract };
        if (doc.origin === 'contract') {
          updatedContract.contractFile = updatedFile;
        } else if (doc.origin === 'payment_voucher') {
          updatedContract.payments = (updatedContract.payments || []).map(p => 
            p.id === doc.originId ? { ...p, voucherFile: updatedFile, receiptFile: updatedFile } : p
          );
        } else if (doc.origin === 'payment_invoice') {
          updatedContract.payments = (updatedContract.payments || []).map(p => 
            p.id === doc.originId ? { ...p, invoiceFile: updatedFile } : p
          );
        } else if (doc.origin === 'final_invoice' && updatedContract.invoice) {
          updatedContract.invoice = { ...updatedContract.invoice, file: updatedFile };
        } else if (doc.origin === 'expense_invoice') {
          updatedContract.expenses = (updatedContract.expenses || []).map(e => 
            e.id === doc.originId ? { ...e, invoiceFile: updatedFile, receiptFile: updatedFile } : e
          );
        } else if (doc.origin === 'expense_voucher') {
          updatedContract.expenses = (updatedContract.expenses || []).map(e => 
            e.id === doc.originId ? { ...e, voucherFile: updatedFile } : e
          );
        }

        updatedContract.updatedAt = new Date().toISOString();
        onUpdateContract(updatedContract);

        setSyncNotice(`Documento guardado en Google Drive.`);
        setTimeout(() => setSyncNotice(null), 4000);
      }
    } catch (err: any) {
      console.error('Error syncing single file:', err);
      alert(err.message || 'Error al subir a Google Drive');
    } finally {
      setIsSyncingDrive(false);
      setSyncProgressMsg(null);
    }
  };

  // Upload/replace main contract file with auto-drive upload
  const handleUploadContractFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const base64 = await readFileAsBase64(file);
        
        let driveFileId: string | undefined = undefined;
        let driveUrl: string | undefined = undefined;

        try {
          const driveRes = await uploadDocumentToContractDrive({
            contractNumber: contract.contractNumber,
            clientName: contract.clientName,
            category: 'CONTRATOS',
            fileOrDataUrl: file,
            customDescription: `Contrato firmado: ${contract.contractNumber}`,
          });
          if (driveRes) {
            driveFileId = driveRes.fileId;
            driveUrl = driveRes.driveUrl;
            if (driveRes.folderUrl) setContractDriveFolderUrl(driveRes.folderUrl);
          }
        } catch (driveErr) {
          console.warn('Drive upload failed or not authenticated:', driveErr);
        }

        const attachment: FileAttachment = {
          name: file.name,
          type: file.type || 'application/pdf',
          size: file.size,
          dataUrl: base64,
          uploadedAt: new Date().toISOString(),
          driveFileId,
          driveUrl,
        };

        const updated: Contract = {
          ...contract,
          contractFile: attachment,
          updatedAt: new Date().toISOString(),
        };
        onUpdateContract(updated);
        setSyncNotice(driveUrl ? '¡Contrato firmado guardado en la carpeta de Google Drive y en la app!' : 'Contrato firmado guardado en el expediente.');
        setTimeout(() => setSyncNotice(null), 4000);
      } catch (err) {
        console.error('Error uploading contract file:', err);
        alert('Error al procesar el archivo');
      }
    }
  };

  // Delete document handler
  const handleDeleteDoc = (doc: CategorizedDocument) => {
    if (!confirm(`¿Eliminar el documento "${doc.title}" de este contrato?`)) {
      return;
    }

    if (doc.origin === 'contract') {
      onUpdateContract({
        ...contract,
        contractFile: undefined,
        updatedAt: new Date().toISOString(),
      });
    } else if (doc.origin === 'payment_voucher') {
      const updatedPayments = (contract.payments || []).map(p => {
        if (p.id === doc.originId) {
          return { ...p, voucherFile: undefined, receiptFile: undefined };
        }
        return p;
      });
      onUpdateContract({
        ...contract,
        payments: updatedPayments,
        updatedAt: new Date().toISOString(),
      });
    } else if (doc.origin === 'payment_invoice') {
      const updatedPayments = (contract.payments || []).map(p => {
        if (p.id === doc.originId) {
          return { ...p, invoiceFile: undefined };
        }
        return p;
      });
      onUpdateContract({
        ...contract,
        payments: updatedPayments,
        updatedAt: new Date().toISOString(),
      });
    } else if (doc.origin === 'final_invoice') {
      onUpdateContract({
        ...contract,
        invoice: contract.invoice ? { ...contract.invoice, file: undefined } : null,
        updatedAt: new Date().toISOString(),
      });
    } else if (doc.origin === 'expense_invoice') {
      const updatedExpenses = (contract.expenses || []).map(e => {
        if (e.id === doc.originId) {
          return { ...e, invoiceFile: undefined, receiptFile: undefined };
        }
        return e;
      });
      onUpdateContract({
        ...contract,
        expenses: updatedExpenses,
        updatedAt: new Date().toISOString(),
      });
    } else if (doc.origin === 'expense_voucher') {
      const updatedExpenses = (contract.expenses || []).map(e => {
        if (e.id === doc.originId) {
          return { ...e, voucherFile: undefined };
        }
        return e;
      });
      onUpdateContract({
        ...contract,
        expenses: updatedExpenses,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Hidden file inputs */}
      <input 
        ref={contractInputRef}
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={handleUploadContractFile}
      />

      {/* Root Folder & Google Drive Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-sky-900/60 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-400/40 flex items-center justify-center shrink-0 shadow-inner">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 font-mono text-xs font-bold border border-sky-400/30">
                  CARPETA DE OBRA
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs text-slate-300 font-medium">
                  {contract.clientName}
                </span>
                {counts.syncedDrive > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <CheckCircle2 className="w-3 h-3" />
                    {counts.syncedDrive} en Drive
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-white mt-1">
                [{contract.contractNumber}] {contract.clientName}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>Estructura por tipo de documento</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">{counts.all} archivos resguardados</span>
                <span>•</span>
                <span>{formatFileSize(counts.totalSize)}</span>
              </p>
            </div>
          </div>

          {/* Quick Folder Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Direct Link to Google Drive root folder */}
            <a
              href={contractDriveFolderUrl || TARGET_DRIVE_FOLDER_URL}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 text-xs font-bold text-sky-200 bg-sky-900/60 hover:bg-sky-800 border border-sky-500/40 rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Abrir la carpeta compartida en Google Drive"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
              <span>{contractDriveFolderUrl ? 'Ver Carpeta en Drive' : 'Carpeta Drive Oficial'}</span>
              <ExternalLink className="w-3 h-3 text-sky-400" />
            </a>

            {/* Sync All to Drive Button */}
            <button
              type="button"
              onClick={handleSyncAllToGoogleDrive}
              disabled={isSyncingDrive || counts.all === 0}
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 rounded-xl transition-all shadow-md inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Crear la carpeta en Google Drive y subir todos los documentos organizados por subcarpeta"
            >
              {isSyncingDrive ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                  <span>{syncProgressMsg || 'Sincronizando Drive...'}</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4 text-slate-950" />
                  <span>Sincronizar a Google Drive</span>
                </>
              )}
            </button>

            {/* ZIP Download */}
            <button
              type="button"
              onClick={handleDownloadFullZip}
              disabled={isZipping || counts.all === 0}
              className="px-3.5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Descargar copia de respaldo en archivo ZIP con carpetas"
            >
              {isZipping ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <FileArchive className="w-3.5 h-3.5 text-sky-400" />
              )}
              <span className="hidden sm:inline">ZIP</span>
            </button>

            {/* Upload contract */}
            <button
              type="button"
              onClick={() => contractInputRef.current?.click()}
              className="p-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              title="Subir contrato firmado"
            >
              <Upload className="w-4 h-4 text-sky-400" />
            </button>
          </div>
        </div>

        {/* Sync or upload notices */}
        {syncNotice && (
          <div className="mt-3.5 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncNotice}</span>
            </div>
            <a
              href={contractDriveFolderUrl || TARGET_DRIVE_FOLDER_URL}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-extrabold text-white underline inline-flex items-center gap-1"
            >
              <span>Abrir en Drive</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      {/* 4 Category Subfolders Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Subfolder 1: Contrato */}
        <button
          type="button"
          onClick={() => setSelectedCategory(selectedCategory === 'CONTRATOS' ? 'ALL' : 'CONTRATOS')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
            selectedCategory === 'CONTRATOS'
              ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-400/30 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-sky-100 text-sky-700">
              <FileText className="w-5 h-5" />
            </div>
            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
              counts.contracts > 0 ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-500'
            }`}>
              {counts.contracts} doc
            </span>
          </div>
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
            1. Contratos y Legal
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Contrato firmado en PDF / Adendas
          </p>
        </button>

        {/* Subfolder 2: Vouchers */}
        <button
          type="button"
          onClick={() => setSelectedCategory(selectedCategory === 'VOUCHERS' ? 'ALL' : 'VOUCHERS')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
            selectedCategory === 'VOUCHERS'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/30 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
              counts.vouchers > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
            }`}>
              {counts.vouchers} doc
            </span>
          </div>
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
            2. Vouchers de Cobranza
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Comprobantes de abonos y cuotas
          </p>
        </button>

        {/* Subfolder 3: Ventas */}
        <button
          type="button"
          onClick={() => setSelectedCategory(selectedCategory === 'VENTAS' ? 'ALL' : 'VENTAS')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
            selectedCategory === 'VENTAS'
              ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-400/30 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
              <FileCheck className="w-5 h-5" />
            </div>
            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
              counts.sales > 0 ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500'
            }`}>
              {counts.sales} doc
            </span>
          </div>
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
            3. Facturación / Ventas
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Factura global y comprobantes
          </p>
        </button>

        {/* Subfolder 4: Gastos */}
        <button
          type="button"
          onClick={() => setSelectedCategory(selectedCategory === 'GASTOS' ? 'ALL' : 'GASTOS')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
            selectedCategory === 'GASTOS'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/30 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
              <Receipt className="w-5 h-5" />
            </div>
            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
              counts.expenses > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-500'
            }`}>
              {counts.expenses} doc
            </span>
          </div>
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
            4. Gastos y Compras
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Facturas de compra y pagos
          </p>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-50/90 p-3 sm:p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
            }`}
          >
            Todas las Carpetas ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('CONTRATOS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'CONTRATOS'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
            }`}
          >
            Contratos ({counts.contracts})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('VOUCHERS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'VOUCHERS'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
            }`}
          >
            Vouchers ({counts.vouchers})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('VENTAS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'VENTAS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
            }`}
          >
            Ventas ({counts.sales})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('GASTOS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'GASTOS'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
            }`}
          >
            Gastos ({counts.expenses})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar documento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Document List View */}
      {filteredDocs.length > 0 ? (
        <div className="space-y-2.5">
          {filteredDocs.map((doc) => {
            const isPdf = doc.file.type.includes('pdf');
            let badgeBg = 'bg-sky-50 text-sky-700 border-sky-200';
            if (doc.category === 'VOUCHERS') badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            if (doc.category === 'VENTAS') badgeBg = 'bg-indigo-50 text-indigo-700 border-indigo-200';
            if (doc.category === 'GASTOS') badgeBg = 'bg-rose-50 text-rose-700 border-rose-200';

            return (
              <div
                key={doc.id}
                className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* Thumbnail / Icon */}
                  <button
                    type="button"
                    onClick={() => onPreviewAttachment(doc.file, doc.title)}
                    className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform cursor-pointer overflow-hidden relative"
                    title="Click para previsualizar"
                  >
                    {!isPdf && doc.file.dataUrl ? (
                      <img 
                        src={doc.file.dataUrl} 
                        alt={doc.file.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileText className="w-5 h-5 text-rose-500" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${badgeBg}`}>
                        {doc.folderName}
                      </span>
                      {doc.date && (
                        <span className="text-[11px] text-slate-400">
                          {formatDate(doc.date)}
                        </span>
                      )}
                      {doc.amount !== undefined && (
                        <span className="text-[11px] font-mono font-bold text-slate-700">
                          • {formatCurrency(doc.amount)}
                        </span>
                      )}

                      {/* Google Drive Status Badge */}
                      {doc.file.driveUrl ? (
                        <a
                          href={doc.file.driveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100 transition-colors"
                          title="Abrir este archivo directamente en Google Drive"
                        >
                          <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
                          <span>En Drive</span>
                          <ExternalLink className="w-2.5 h-2.5 text-emerald-700" />
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          Guardado local
                        </span>
                      )}
                    </div>

                    <h5 className="text-xs sm:text-sm font-bold text-slate-900 truncate mt-0.5">
                      {doc.title}
                    </h5>

                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {doc.subtitle}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-1">
                      <span className="truncate max-w-[200px]">{doc.file.name}</span>
                      <span>•</span>
                      <span>{formatFileSize(doc.file.size)}</span>
                      {doc.file.uploadedAt && (
                        <>
                          <span>•</span>
                          <span>Subido: {new Date(doc.file.uploadedAt).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  {/* Single file upload to Drive if not uploaded */}
                  {!doc.file.driveUrl && (
                    <button
                      type="button"
                      onClick={() => handleSyncSingleDoc(doc)}
                      disabled={isSyncingDrive}
                      className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                      title="Subir este archivo específico a la carpeta correspondiente de Google Drive"
                    >
                      <CloudUpload className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="hidden sm:inline">Subir a Drive</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onPreviewAttachment(doc.file, doc.title)}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                    title="Ver documento en pantalla completa"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ver</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadFile(doc.file, `${contract.contractNumber}_${doc.title}`)}
                    className="px-2.5 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                    title="Descargar este archivo individual"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-600" />
                    <span>Descargar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteDoc(doc)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Quitar este archivo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Folder className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-700">
              No hay documentos {selectedCategory !== 'ALL' ? `en la carpeta "${selectedCategory}"` : 'en este expediente'}
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Los contratos, vouchers de cobros, facturas de venta y comprobantes de gastos que subas en la ficha se archivarán automáticamente en Google Drive y en la app.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => contractInputRef.current?.click()}
              className="px-4 py-2 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-sky-600" />
              <span>Subir Contrato en PDF</span>
            </button>
            <a
              href={TARGET_DRIVE_FOLDER_URL}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors inline-flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
              <span>Ver Carpeta Drive Principal</span>
            </a>
          </div>
        </div>
      )}

      {/* Safety notice and Drive link */}
      <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Carpeta destino Google Drive: <strong className="font-mono text-slate-800">{TARGET_DRIVE_FOLDER_ID}</strong>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={contractDriveFolderUrl || TARGET_DRIVE_FOLDER_URL}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-sky-600 hover:text-sky-800 hover:underline inline-flex items-center gap-1"
          >
            <span>Abrir en Google Drive</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            type="button"
            onClick={handleDownloadFullZip}
            disabled={counts.all === 0}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 hover:underline cursor-pointer disabled:opacity-40"
          >
            Exportar todo en ZIP →
          </button>
        </div>
      </div>
    </div>
  );
};
