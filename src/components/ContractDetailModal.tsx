import React, { useState, useRef } from 'react';
import { 
  Contract, 
  ContractStatus, 
  Payment, 
  PaymentMethod, 
  FileAttachment, 
  PaymentScheduleItem,
  Expense,
  ExpenseCategory,
  FinalInvoice
} from '../types';
import { 
  formatCurrency, 
  formatDate, 
  calculateFinancials, 
  formatFileSize, 
  formatExpenseCategory,
  getContractPaymentAlerts 
} from '../utils/formatters';
import { readFileAsBase64 } from '../utils/storage';
import { 
  uploadFileToTargetDrive, 
  uploadDocumentToContractDrive,
  DocumentDriveCategory,
  TARGET_DRIVE_FOLDER_ID, 
  TARGET_DRIVE_FOLDER_URL,
  getAppsScriptUrl 
} from '../services/googleDriveService';
import { getAccessToken, googleSignIn } from '../services/googleAuthService';
import { 
  Building, 
  X, 
  FileDown, 
  Edit3, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  Receipt, 
  Plus, 
  Trash2, 
  Eye, 
  Download, 
  Upload, 
  Phone, 
  Mail, 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  Send, 
  FileText, 
  Check, 
  FileCheck, 
  AlertTriangle, 
  Tag, 
  ChevronDown, 
  ChevronUp, 
  Wallet, 
  MessageCircle,
  Sparkles,
  Layers,
  ExternalLink,
  CloudUpload,
  FolderOpen
} from 'lucide-react';
import { ContractDocumentArchive } from './ContractDocumentArchive';
import { generateSingleContractDossierPdf, downloadPdfDocument } from '../services/pdfService';

interface ContractDetailModalProps {
  isOpen: boolean;
  contract: Contract | null;
  onClose: () => void;
  onUpdateContract: (updated: Contract) => void;
  onDeleteContract: (id: string) => void;
  onOpenViewer: (attachment: FileAttachment, title: string) => void;
  onEditContract: (contract: Contract) => void;
}

export const ContractDetailModal: React.FC<ContractDetailModalProps> = ({
  isOpen,
  contract,
  onClose,
  onUpdateContract,
  onDeleteContract,
  onOpenViewer,
  onEditContract,
}) => {
  // Modules: datos, ingresos, gastos, and archivos (expediente de carpetas)
  type MainTab = 'datos' | 'ingresos' | 'gastos' | 'archivos';
  const [activeTab, setActiveTab] = useState<MainTab>('datos');

  // Total documents count for this contract
  const totalContractDocsCount = React.useMemo(() => {
    let count = 0;
    if (contract?.contractFile) count++;
    if (contract?.payments) {
      contract.payments.forEach(p => {
        if (p.voucherFile || p.receiptFile) count++;
        if (p.invoiceFile) count++;
      });
    }
    if (contract?.invoice?.file) count++;
    if (contract?.expenses) {
      contract.expenses.forEach(e => {
        if (e.invoiceFile || e.receiptFile) count++;
        if (e.voucherFile) count++;
      });
    }
    return count;
  }, [contract]);

  // Status notes state
  const [statusNotes, setStatusNotes] = useState(contract?.statusNotes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaveNotice, setNotesSaveNotice] = useState<string | null>(null);

  // PDF Dossier Export state
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Contract File Upload State
  const [isUploadingContract, setIsUploadingContract] = useState(false);
  const [contractNotice, setContractNotice] = useState<string | null>(null);

  // --- MODULE 1: Schedule Form State ---
  const [isScheduleFormOpen, setIsScheduleFormOpen] = useState(false);
  const [newScheduleTitle, setNewScheduleTitle] = useState('');
  const [newScheduleDate, setNewScheduleDate] = useState('');
  const [newScheduleAmount, setNewScheduleAmount] = useState('');
  const [newScheduleNotes, setNewScheduleNotes] = useState('');

  // --- MODULE 2: Ingresos / Cobros Form State ---
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [incomeDate, setIncomeDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeMethod, setIncomeMethod] = useState<PaymentMethod>('Transferencia Bancaria');
  const [incomeReference, setIncomeReference] = useState('');
  const [incomeNotes, setIncomeNotes] = useState('');
  const [incomeInvoiceNumber, setIncomeInvoiceNumber] = useState('');
  const [incomeVoucherFile, setIncomeVoucherFile] = useState<FileAttachment | undefined>(undefined);
  const [incomeInvoiceFile, setIncomeInvoiceFile] = useState<FileAttachment | undefined>(undefined);
  const [isUploadingIncomeVoucher, setIsUploadingIncomeVoucher] = useState(false);
  const [isUploadingIncomeInvoice, setIsUploadingIncomeInvoice] = useState(false);

  // Final invoice state
  const [showFinalInvoiceForm, setShowFinalInvoiceForm] = useState(false);
  const [finalInvoiceNum, setFinalInvoiceNum] = useState(contract?.invoice?.invoiceNumber || '');
  const [finalInvoiceDate, setFinalInvoiceDate] = useState(contract?.invoice?.issueDate || '');
  const [finalInvoiceNotes, setFinalInvoiceNotes] = useState(contract?.invoice?.notes || '');
  const [finalInvoiceFile, setFinalInvoiceFile] = useState<FileAttachment | undefined>(contract?.invoice?.file);

  // --- MODULE 3: Gastos Form State ---
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('MATERIALES');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseSupplier, setExpenseSupplier] = useState('');
  const [expenseInvoiceNumber, setExpenseInvoiceNumber] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expensePaymentMethod, setExpensePaymentMethod] = useState<PaymentMethod>('Transferencia Bancaria');
  const [expenseNotes, setExpenseNotes] = useState('');
  const [expenseInvoiceFile, setExpenseInvoiceFile] = useState<FileAttachment | undefined>(undefined);
  const [expenseVoucherFile, setExpenseVoucherFile] = useState<FileAttachment | undefined>(undefined);
  const [isUploadingExpenseInvoice, setIsUploadingExpenseInvoice] = useState(false);
  const [isUploadingExpenseVoucher, setIsUploadingExpenseVoucher] = useState(false);
  const [expenseFilterCategory, setExpenseFilterCategory] = useState<string>('ALL');
  const [expenseSearch, setExpenseSearch] = useState('');

  // Sync state whenever contract changes or modal opens
  React.useEffect(() => {
    if (contract) {
      setStatusNotes(contract.statusNotes || '');
      setFinalInvoiceNum(contract.invoice?.invoiceNumber || '');
      setFinalInvoiceDate(contract.invoice?.issueDate || '');
      setFinalInvoiceNotes(contract.invoice?.notes || '');
      setFinalInvoiceFile(contract.invoice?.file);
    }
  }, [contract?.id, isOpen]);

  if (!isOpen || !contract) return null;

  // Calculations
  const financials = calculateFinancials(contract);
  const schedule = contract.paymentSchedule || [];
  const payments = contract.payments || [];
  const expenses = contract.expenses || [];

  const totalContract = Number(contract.totalAmount) || 0;
  const totalScheduled = schedule.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  const scheduleDifference = totalContract - totalScheduled;

  // Timeline situation calculation
  const getTimelineSituation = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(contract.startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(contract.estimatedEndDate);
    end.setHours(0, 0, 0, 0);

    const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const elapsedDays = Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const percentElapsed = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));
    const isOverdue = remainingDays < 0 && contract.status !== 'PAGADO_CONCLUIDO';

    return {
      totalDays,
      elapsedDays,
      remainingDays,
      percentElapsed,
      isOverdue,
    };
  };

  const timeline = getTimelineSituation();

  // Helper to auto-upload to Google Drive into contract folder and category subfolder
  const tryUploadToGoogleDrive = async (
    file: File | { name: string; dataUrl: string; mimeType?: string }, 
    desc: string,
    category: DocumentDriveCategory = 'CONTRATOS'
  ): Promise<{ driveFileId?: string; driveUrl?: string }> => {
    try {
      const res = await uploadDocumentToContractDrive({
        contractNumber: contract.contractNumber,
        clientName: contract.clientName,
        category,
        fileOrDataUrl: file,
        customDescription: desc,
      });
      if (res) {
        return { driveFileId: res.fileId, driveUrl: res.driveUrl };
      }
      return {};
    } catch (err) {
      console.warn('Google Drive auto-upload notice (file saved locally):', err);
      return {};
    }
  };

  // Helper to sync an already stored attachment to Drive
  const handleSyncAttachmentToDrive = async (
    attachment: FileAttachment,
    onSuccess: (updated: FileAttachment) => void,
    desc: string,
    category: DocumentDriveCategory = 'CONTRATOS'
  ) => {
    try {
      let token = await getAccessToken();
      const appsScriptUrl = getAppsScriptUrl();
      if (!token && !appsScriptUrl) {
        const authRes = await googleSignIn();
        if (!authRes?.accessToken) {
          alert('Se requiere iniciar sesión con Google o configurar Google Apps Script para sincronizar.');
          return;
        }
        token = authRes.accessToken;
      }
      const res = await uploadDocumentToContractDrive({
        contractNumber: contract.contractNumber,
        clientName: contract.clientName,
        category,
        fileOrDataUrl: { name: attachment.name, dataUrl: attachment.dataUrl, mimeType: attachment.type },
        customDescription: desc,
      });
      if (res) {
        const updated: FileAttachment = {
          ...attachment,
          driveFileId: res.fileId,
          driveUrl: res.driveUrl,
        };
        onSuccess(updated);
        alert('¡Documento guardado con éxito en la carpeta correspondiente de Google Drive!');
      } else {
        alert('No se pudo completar la sincronización con Google Drive.');
      }
    } catch (err: any) {
      console.error('Error uploading to Drive:', err);
      alert(err.message || 'Error al subir a Google Drive');
    }
  };

  // Export dossier PDF handler
  const handleDownloadDossierPdf = async () => {
    setIsExportingPdf(true);
    try {
      const doc = await generateSingleContractDossierPdf(contract);
      const safeName = `Dossier_${contract.contractNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      downloadPdfDocument(doc, safeName);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert('Error al generar el dossier PDF del contrato');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Change Situational Status
  const handleStatusChange = (newStatus: ContractStatus) => {
    const updatedContract: Contract = {
      ...contract,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    onUpdateContract(updatedContract);
  };

  // Save Status Notes
  const handleSaveStatusNotes = () => {
    setIsSavingNotes(true);
    const updatedContract: Contract = {
      ...contract,
      statusNotes: statusNotes.trim(),
      updatedAt: new Date().toISOString(),
    };
    onUpdateContract(updatedContract);
    setTimeout(() => {
      setIsSavingNotes(false);
      setNotesSaveNotice('Observación situacional guardada con éxito.');
      setTimeout(() => setNotesSaveNotice(null), 3000);
    }, 200);
  };

  // Contract PDF Upload
  const handleContractPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploadingContract(true);
      try {
        const base64 = await readFileAsBase64(file);
        const driveData = await tryUploadToGoogleDrive(file, `Contrato: ${contract.contractNumber}`, 'CONTRATOS');

        const attachment: FileAttachment = {
          name: file.name,
          type: file.type || 'application/pdf',
          size: file.size,
          dataUrl: base64,
          uploadedAt: new Date().toISOString(),
          driveFileId: driveData.driveFileId,
          driveUrl: driveData.driveUrl,
        };

        const updatedContract: Contract = {
          ...contract,
          contractFile: attachment,
          updatedAt: new Date().toISOString(),
        };
        onUpdateContract(updatedContract);
        setContractNotice(driveData.driveUrl ? '¡Contrato en PDF subido y guardado en Google Drive!' : '¡Contrato en PDF subido y guardado localmente!');
        setTimeout(() => setContractNotice(null), 3500);
      } catch (err) {
        console.error('Error uploading contract PDF:', err);
        alert('Error al leer el archivo PDF seleccionado');
      } finally {
        setIsUploadingContract(false);
        e.target.value = '';
      }
    }
  };

  const handleRemoveContractPdf = () => {
    if (window.confirm('¿Deseas quitar el archivo del contrato adjunto?')) {
      const updatedContract: Contract = {
        ...contract,
        contractFile: undefined,
        updatedAt: new Date().toISOString(),
      };
      onUpdateContract(updatedContract);
      setContractNotice('Documento de contrato retirado.');
      setTimeout(() => setContractNotice(null), 3000);
    }
  };

  // --- SCHEDULE HANDLERS ---
  const handleAddScheduleItem = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(newScheduleAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Ingresa un monto válido mayor a 0');
      return;
    }
    if (!newScheduleDate) {
      alert('Selecciona la fecha límite de pago');
      return;
    }

    const newItem: PaymentScheduleItem = {
      id: `sch-${Date.now()}`,
      title: newScheduleTitle.trim() || `Cuota ${schedule.length + 1}`,
      dueDate: newScheduleDate,
      amount: amountNum,
      isPaid: false,
      notes: newScheduleNotes.trim(),
    };

    const updated = [...schedule, newItem].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

    const updatedContract: Contract = {
      ...contract,
      paymentSchedule: updated,
      updatedAt: new Date().toISOString(),
    };
    onUpdateContract(updatedContract);

    setNewScheduleTitle('');
    setNewScheduleAmount('');
    setNewScheduleNotes('');
    setIsScheduleFormOpen(false);
  };

  const handleToggleSchedulePaid = (item: PaymentScheduleItem) => {
    const updated = schedule.map(it => 
      it.id === item.id ? { ...it, isPaid: !it.isPaid } : it
    );
    onUpdateContract({
      ...contract,
      paymentSchedule: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteScheduleItem = (id: string) => {
    if (window.confirm('¿Eliminar esta fecha de pago del cronograma?')) {
      const updated = schedule.filter(it => it.id !== id);
      onUpdateContract({
        ...contract,
        paymentSchedule: updated,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const applyScheduleTemplateInModule = (type: '50-50' | '40-30-30' | '100') => {
    const total = totalContract;
    if (total <= 0) return;

    const start = contract.startDate || new Date().toISOString().split('T')[0];
    const end = contract.estimatedEndDate || new Date().toISOString().split('T')[0];

    const sDate = new Date(start);
    const eDate = new Date(end);
    const midTime = sDate.getTime() + (eDate.getTime() - sDate.getTime()) / 2;
    const midDateStr = new Date(midTime).toISOString().split('T')[0];

    let newItems: PaymentScheduleItem[] = [];

    if (type === '100') {
      newItems = [
        {
          id: `sch-${Date.now()}-1`,
          title: 'Pago Único Contra Entrega (100%)',
          dueDate: end,
          amount: total,
          isPaid: false,
        }
      ];
    } else if (type === '50-50') {
      const p1 = Math.round((total * 0.5) * 100) / 100;
      const p2 = Math.round((total - p1) * 100) / 100;
      newItems = [
        {
          id: `sch-${Date.now()}-1`,
          title: 'Anticipo Inicial de Firma (50%)',
          dueDate: start,
          amount: p1,
          isPaid: false,
        },
        {
          id: `sch-${Date.now()}-2`,
          title: 'Saldo Final Contra Entrega (50%)',
          dueDate: end,
          amount: p2,
          isPaid: false,
        }
      ];
    } else if (type === '40-30-30') {
      const p1 = Math.round((total * 0.4) * 100) / 100;
      const p2 = Math.round((total * 0.3) * 100) / 100;
      const p3 = Math.round((total - p1 - p2) * 100) / 100;
      newItems = [
        {
          id: `sch-${Date.now()}-1`,
          title: 'Anticipo Inicial de Replanteo (40%)',
          dueDate: start,
          amount: p1,
          isPaid: false,
        },
        {
          id: `sch-${Date.now()}-2`,
          title: 'Valorización de Avance de Obra (30%)',
          dueDate: midDateStr,
          amount: p2,
          isPaid: false,
        },
        {
          id: `sch-${Date.now()}-3`,
          title: 'Saldo Final y Conformidad (30%)',
          dueDate: end,
          amount: p3,
          isPaid: false,
        }
      ];
    }

    onUpdateContract({
      ...contract,
      paymentSchedule: newItems,
      updatedAt: new Date().toISOString(),
    });
  };

  // Jump from schedule milestone directly to register income in Module 2
  const handleCollectScheduleMilestone = (item: PaymentScheduleItem) => {
    setActiveTab('ingresos');
    setShowIncomeForm(true);
    setIncomeAmount(item.amount.toString());
    setIncomeReference(item.title);
    setIncomeNotes(`Cobro correspondiente a: ${item.title}`);
    setIncomeDate(new Date().toISOString().split('T')[0]);
  };

  // --- MODULE 2: INGRESOS / COBROS HANDLERS ---
  const handleIncomeVoucherUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploadingIncomeVoucher(true);
      try {
        const base64 = await readFileAsBase64(file);
        const driveData = await tryUploadToGoogleDrive(file, `Voucher Cobro: ${contract.contractNumber} (${incomeReference || 'Abono'})`, 'VOUCHERS');

        setIncomeVoucherFile({
          name: file.name,
          type: file.type || 'image/jpeg',
          size: file.size,
          dataUrl: base64,
          uploadedAt: new Date().toISOString(),
          driveFileId: driveData.driveFileId,
          driveUrl: driveData.driveUrl,
        });
      } catch (err) {
        console.error('Error reading income voucher file', err);
      } finally {
        setIsUploadingIncomeVoucher(false);
      }
    }
  };

  const handleIncomeInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploadingIncomeInvoice(true);
      try {
        const base64 = await readFileAsBase64(file);
        const driveData = await tryUploadToGoogleDrive(file, `Comprobante Cobro: ${contract.contractNumber} (${incomeInvoiceNumber || 'Factura'})`, 'VENTAS');

        setIncomeInvoiceFile({
          name: file.name,
          type: file.type || 'application/pdf',
          size: file.size,
          dataUrl: base64,
          uploadedAt: new Date().toISOString(),
          driveFileId: driveData.driveFileId,
          driveUrl: driveData.driveUrl,
        });
      } catch (err) {
        console.error('Error reading income invoice file', err);
      } finally {
        setIsUploadingIncomeInvoice(false);
      }
    }
  };

  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(incomeAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Ingresa un monto válido para el cobro');
      return;
    }

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      date: incomeDate,
      amount: amountNum,
      method: incomeMethod,
      reference: incomeReference.trim() || 'Abono directo',
      receiptFile: incomeVoucherFile,
      voucherFile: incomeVoucherFile,
      invoiceFile: incomeInvoiceFile,
      invoiceNumber: incomeInvoiceNumber.trim() || undefined,
      notes: incomeNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedPayments = [...payments, newPayment];
    const newPaidTotal = updatedPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const newBalance = Math.max(0, totalContract - newPaidTotal);

    let updatedStatus = contract.status;
    if (newBalance <= 0.01 && contract.status === 'EN_EJECUCION') {
      updatedStatus = 'OBRA_TERMINADA';
    }

    // Synchronize paymentSchedule milestones with cumulative amount paid
    let runningPaid = 0;
    const updatedSchedule = (contract.paymentSchedule || []).map((s) => {
      runningPaid += Number(s.amount) || 0;
      if (newPaidTotal >= runningPaid - 0.01) {
        return { ...s, isPaid: true };
      }
      return s;
    });

    const updatedContract: Contract = {
      ...contract,
      payments: updatedPayments,
      paymentSchedule: updatedSchedule.length > 0 ? updatedSchedule : contract.paymentSchedule,
      status: updatedStatus,
      updatedAt: new Date().toISOString(),
    };
    onUpdateContract(updatedContract);

    // Reset income form
    setIncomeAmount('');
    setIncomeReference('');
    setIncomeNotes('');
    setIncomeInvoiceNumber('');
    setIncomeVoucherFile(undefined);
    setIncomeInvoiceFile(undefined);
    setShowIncomeForm(false);
  };

  const handleDeleteIncome = (paymentId: string) => {
    if (window.confirm('¿Deseas eliminar este registro de cobro? El saldo se actualizará automáticamente.')) {
      const updated = payments.filter(p => p.id !== paymentId);
      const newPaidTotal = updated.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
      let runningPaid = 0;
      const updatedSchedule = (contract.paymentSchedule || []).map((s) => {
        runningPaid += Number(s.amount) || 0;
        return { ...s, isPaid: newPaidTotal >= runningPaid - 0.01 };
      });

      onUpdateContract({
        ...contract,
        payments: updated,
        paymentSchedule: updatedSchedule.length > 0 ? updatedSchedule : contract.paymentSchedule,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Quick file attachment to existing payment
  const handleAttachFileToPayment = async (
    payment: Payment, 
    type: 'voucher' | 'invoice', 
    file: File
  ) => {
    try {
      const base64 = await readFileAsBase64(file);
      const driveData = await tryUploadToGoogleDrive(
        file, 
        type === 'voucher' ? `Voucher: ${contract.contractNumber}` : `Comprobante: ${contract.contractNumber}`,
        type === 'voucher' ? 'VOUCHERS' : 'VENTAS'
      );

      const attachment: FileAttachment = {
        name: file.name,
        type: file.type || (type === 'voucher' ? 'image/jpeg' : 'application/pdf'),
        size: file.size,
        dataUrl: base64,
        uploadedAt: new Date().toISOString(),
        driveFileId: driveData.driveFileId,
        driveUrl: driveData.driveUrl,
      };

      const updatedPayments = payments.map(p => {
        if (p.id === payment.id) {
          if (type === 'voucher') {
            return { ...p, voucherFile: attachment, receiptFile: attachment };
          } else {
            return { ...p, invoiceFile: attachment };
          }
        }
        return p;
      });

      onUpdateContract({
        ...contract,
        payments: updatedPayments,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error attaching file to payment:', err);
      alert('Error al adjuntar archivo');
    }
  };

  // Save Final Invoice
  const handleFinalInvoiceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const base64 = await readFileAsBase64(file);
        const driveData = await tryUploadToGoogleDrive(file, `Factura Global: ${contract.contractNumber}`, 'VENTAS');
        const attachment: FileAttachment = {
          name: file.name,
          type: file.type || 'application/pdf',
          size: file.size,
          dataUrl: base64,
          uploadedAt: new Date().toISOString(),
          driveFileId: driveData.driveFileId,
          driveUrl: driveData.driveUrl,
        };
        setFinalInvoiceFile(attachment);
      } catch (err) {
        console.error('Error uploading invoice file:', err);
      }
    }
  };

  const handleSaveFinalInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalInvoiceNum.trim()) {
      alert('Ingresa el número de la factura final (ej. F001-000452)');
      return;
    }

    const updatedContract: Contract = {
      ...contract,
      invoice: {
        invoiceNumber: finalInvoiceNum.trim(),
        issueDate: finalInvoiceDate || new Date().toISOString().split('T')[0],
        notes: finalInvoiceNotes.trim(),
        file: finalInvoiceFile,
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };
    onUpdateContract(updatedContract);
    setShowFinalInvoiceForm(false);
  };

  // --- MODULE 3: GASTOS HANDLERS ---
  const handleExpenseInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploadingExpenseInvoice(true);
      try {
        const base64 = await readFileAsBase64(file);
        const driveData = await tryUploadToGoogleDrive(file, `Factura Gasto: ${contract.contractNumber} (${expenseSupplier || 'Proveedor'})`, 'GASTOS');

        setExpenseInvoiceFile({
          name: file.name,
          type: file.type || 'application/pdf',
          size: file.size,
          dataUrl: base64,
          uploadedAt: new Date().toISOString(),
          driveFileId: driveData.driveFileId,
          driveUrl: driveData.driveUrl,
        });
      } catch (err) {
        console.error('Error reading expense invoice file', err);
      } finally {
        setIsUploadingExpenseInvoice(false);
      }
    }
  };

  const handleExpenseVoucherUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploadingExpenseVoucher(true);
      try {
        const base64 = await readFileAsBase64(file);
        const driveData = await tryUploadToGoogleDrive(file, `Voucher Pago Gasto: ${contract.contractNumber} (${expenseSupplier || 'Proveedor'})`, 'GASTOS');

        setExpenseVoucherFile({
          name: file.name,
          type: file.type || 'image/jpeg',
          size: file.size,
          dataUrl: base64,
          uploadedAt: new Date().toISOString(),
          driveFileId: driveData.driveFileId,
          driveUrl: driveData.driveUrl,
        });
      } catch (err) {
        console.error('Error reading expense voucher file', err);
      } finally {
        setIsUploadingExpenseVoucher(false);
      }
    }
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(expenseAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Ingresa un monto de gasto válido mayor a 0');
      return;
    }
    if (!expenseDescription.trim()) {
      alert('Ingresa la descripción del gasto');
      return;
    }

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      date: expenseDate,
      category: expenseCategory,
      description: expenseDescription.trim(),
      supplier: expenseSupplier.trim() || 'Proveedor General',
      invoiceNumber: expenseInvoiceNumber.trim() || 'Sin Comprobante',
      amount: amountNum,
      paymentMethod: expensePaymentMethod,
      invoiceFile: expenseInvoiceFile,
      voucherFile: expenseVoucherFile,
      receiptFile: expenseInvoiceFile,
      notes: expenseNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedExpenses = [newExpense, ...expenses];
    onUpdateContract({
      ...contract,
      expenses: updatedExpenses,
      updatedAt: new Date().toISOString(),
    });

    // Reset form
    setExpenseDescription('');
    setExpenseSupplier('');
    setExpenseInvoiceNumber('');
    setExpenseAmount('');
    setExpenseNotes('');
    setExpenseInvoiceFile(undefined);
    setExpenseVoucherFile(undefined);
    setShowExpenseForm(false);
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('¿Deseas eliminar este registro de gasto? Se recalculará la utilidad del contrato.')) {
      const updated = expenses.filter(e => e.id !== id);
      onUpdateContract({
        ...contract,
        expenses: updated,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Quick file attachment to existing expense
  const handleAttachFileToExpense = async (
    expense: Expense, 
    type: 'invoice' | 'voucher', 
    file: File
  ) => {
    try {
      const base64 = await readFileAsBase64(file);
      const driveData = await tryUploadToGoogleDrive(
        file, 
        type === 'invoice' ? `Factura Gasto: ${contract.contractNumber}` : `Voucher Pago: ${contract.contractNumber}`,
        'GASTOS'
      );

      const attachment: FileAttachment = {
        name: file.name,
        type: file.type || 'application/pdf',
        size: file.size,
        dataUrl: base64,
        uploadedAt: new Date().toISOString(),
        driveFileId: driveData.driveFileId,
        driveUrl: driveData.driveUrl,
      };

      const updatedExpenses = expenses.map(e => {
        if (e.id === expense.id) {
          if (type === 'invoice') {
            return { ...e, invoiceFile: attachment, receiptFile: attachment };
          } else {
            return { ...e, voucherFile: attachment };
          }
        }
        return e;
      });

      onUpdateContract({
        ...contract,
        expenses: updatedExpenses,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error attaching file to expense:', err);
      alert('Error al adjuntar archivo');
    }
  };

  // Filtered expenses
  const filteredExpenses = expenses.filter(e => {
    if (expenseFilterCategory !== 'ALL' && e.category !== expenseFilterCategory) {
      return false;
    }
    if (expenseSearch.trim()) {
      const q = expenseSearch.toLowerCase();
      const matchDesc = e.description.toLowerCase().includes(q);
      const matchSupp = e.supplier.toLowerCase().includes(q);
      const matchInv = (e.invoiceNumber || '').toLowerCase().includes(q);
      if (!matchDesc && !matchSupp && !matchInv) return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-4 overflow-hidden border border-slate-200 flex flex-col max-h-[95vh]">
        {/* Top Header */}
        <div className="px-5 sm:px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-base font-bold text-white tracking-wide">
                  {contract.contractNumber}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs sm:text-sm text-slate-200 font-semibold truncate max-w-xs sm:max-w-md">
                  {contract.clientName}
                </span>
              </div>
              <div className="flex items-center flex-wrap gap-2 text-[11px] text-slate-400 mt-0.5">
                <span>{contract.docType}: {contract.docNumber}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {contract.phone}
                </span>
                {contract.location && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-rose-300 font-medium">
                      <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                      <span>{contract.location}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons on top right */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('archivos')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'archivos'
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'text-sky-300 hover:text-white bg-slate-800 hover:bg-sky-900/60 border border-slate-700 hover:border-sky-500/50'
              }`}
              title="Abrir expediente de carpetas y documentos de este contrato"
            >
              <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Expediente ({totalContractDocsCount})</span>
            </button>

            <button
              onClick={handleDownloadDossierPdf}
              disabled={isExportingPdf}
              className="px-2.5 py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-slate-800 hover:bg-rose-900/40 border border-slate-700 hover:border-rose-500/50 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Descargar Dossier Completo en PDF"
            >
              {isExportingPdf ? (
                <div className="w-3.5 h-3.5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <FileDown className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span className="hidden sm:inline">Dossier PDF</span>
            </button>

            <button
              onClick={() => onEditContract(contract)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Editar datos del contrato"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              onClick={() => onDeleteContract(contract.id)}
              className="p-1.5 text-rose-300 hover:text-white hover:bg-rose-900/60 rounded-lg transition-colors cursor-pointer"
              title="Eliminar este contrato"
            >
              <Trash2 className="w-4 h-4 text-rose-400 hover:text-white" />
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 Módulos - Segmented Navigation Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-2">
            {/* Módulo 1 */}
            <button
              type="button"
              onClick={() => setActiveTab('datos')}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap inline-flex items-center gap-2 cursor-pointer shadow-xs ${
                activeTab === 'datos'
                  ? 'bg-sky-700 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>1. Datos del Contrato y Estado Situacional</span>
              {contract.contractFile && (
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${activeTab === 'datos' ? 'bg-sky-900 text-sky-200' : 'bg-slate-100 text-slate-600'}`}>
                  PDF ✓
                </span>
              )}
            </button>

            {/* Módulo 2 */}
            <button
              type="button"
              onClick={() => setActiveTab('ingresos')}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap inline-flex items-center gap-2 cursor-pointer shadow-xs ${
                activeTab === 'ingresos'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>2. Ingresos / Cobros</span>
              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full font-mono ${activeTab === 'ingresos' ? 'bg-emerald-900 text-emerald-200' : 'bg-emerald-50 text-emerald-700'}`}>
                {payments.length}
              </span>
            </button>

            {/* Módulo 3 */}
            <button
              type="button"
              onClick={() => setActiveTab('gastos')}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap inline-flex items-center gap-2 cursor-pointer shadow-xs ${
                activeTab === 'gastos'
                  ? 'bg-rose-700 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>3. Gastos de Obra</span>
              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full font-mono ${activeTab === 'gastos' ? 'bg-rose-900 text-rose-200' : 'bg-rose-50 text-rose-700'}`}>
                {expenses.length}
              </span>
            </button>

            {/* Módulo 4: Archivo & Carpetas */}
            <button
              type="button"
              onClick={() => setActiveTab('archivos')}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap inline-flex items-center gap-2 cursor-pointer shadow-xs ${
                activeTab === 'archivos'
                  ? 'bg-slate-900 text-white shadow-sm ring-2 ring-sky-400/40'
                  : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
              }`}
            >
              <FolderOpen className="w-4 h-4 text-sky-500" />
              <span>4. Archivo & Carpetas</span>
              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full font-mono ${activeTab === 'archivos' ? 'bg-sky-900 text-sky-200' : 'bg-sky-100 text-sky-800'}`}>
                {totalContractDocsCount}
              </span>
            </button>
          </div>

          {/* Quick Balance Status on Right */}
          <div className="hidden md:flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Saldo por cobrar:</span>
            <span className={`font-mono font-bold ${financials.pendingBalance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
              {formatCurrency(financials.pendingBalance)}
            </span>
          </div>
        </div>

        {/* Scrollable Module Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* ========================================================================= */}
          {/* MÓDULO 1: DATOS DEL CONTRATO Y ESTADO SITUACIONAL */}
          {/* ========================================================================= */}
          {activeTab === 'datos' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* 1.1 ESTADO SITUACIONAL DE LA OBRA */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-sm border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
                      <Clock className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">
                        Estado Situacional de la Obra
                      </h4>
                      <p className="text-xs text-slate-400">
                        Control de fase de ejecución y tiempo contractual
                      </p>
                    </div>
                  </div>

                  {/* Selector interactivo de Estado Situacional */}
                  <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => handleStatusChange('EN_EJECUCION')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        contract.status === 'EN_EJECUCION'
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      En Ejecución
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange('OBRA_TERMINADA')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        contract.status === 'OBRA_TERMINADA'
                          ? 'bg-sky-500 text-slate-950 shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Obra Terminada (x Cobrar)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange('PAGADO_CONCLUIDO')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        contract.status === 'PAGADO_CONCLUIDO'
                          ? 'bg-emerald-500 text-slate-950 shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Pagado y Concluido
                    </button>
                  </div>
                </div>

                {/* Grid Situacional: Plazos, Días y Avance */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
                    <span className="text-[11px] text-slate-400 block font-medium">Plazo Contractual</span>
                    <span className="text-xs font-bold text-white block mt-0.5">
                      {formatDate(contract.startDate)} ➔ {formatDate(contract.estimatedEndDate)}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-1">
                      Duración total pactada: <strong>{timeline.totalDays} días</strong>
                    </span>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
                    <span className="text-[11px] text-slate-400 block font-medium">Situación del Tiempo</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-sm font-black font-mono ${timeline.isOverdue ? 'text-red-400' : 'text-emerald-400'}`}>
                        {timeline.remainingDays >= 0 ? `${timeline.remainingDays} días restantes` : `Plazo vencido hace ${Math.abs(timeline.remainingDays)} d`}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${timeline.isOverdue ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${timeline.percentElapsed}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
                    <span className="text-[11px] text-slate-400 block font-medium">Avance de Cobranza</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-sm font-black text-white font-mono">
                        {financials.progressPercent}%
                      </span>
                      <span className="text-xs text-emerald-400 font-mono font-bold">
                        {formatCurrency(financials.totalPaid)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${financials.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bitácora de Estado Situacional */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <span>Notas u Observaciones del Estado Situacional de la Obra:</span>
                    </label>
                    {notesSaveNotice && (
                      <span className="text-xs text-emerald-400 font-bold animate-in fade-in">
                        ✓ {notesSaveNotice}
                      </span>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    <textarea
                      rows={2}
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      placeholder="ej. Obra al 75% de avance físico. Se completó el tendido de tuberías y tableros. Próxima semana pruebas de presión y entrega de acta..."
                      className="flex-1 px-3 py-2 text-xs bg-slate-950/80 border border-slate-700 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium leading-relaxed"
                    />
                    <button
                      type="button"
                      onClick={handleSaveStatusNotes}
                      disabled={isSavingNotes}
                      className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer"
                    >
                      {isSavingNotes ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 1.2 DATOS GENERALES DEL CONTRATO */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-sky-100 text-sky-700 rounded-lg">
                      <Building className="w-4 h-4" />
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                      Datos Generales del Contrato
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEditContract(contract)}
                    className="px-3 py-1.5 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar Datos</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block font-medium">Cliente / Razón Social</span>
                    <span className="font-bold text-slate-900 text-sm block mt-0.5">
                      {contract.clientName}
                    </span>
                    <span className="text-slate-500 font-mono mt-0.5 block">
                      {contract.docType}: {contract.docNumber}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block font-medium">Contacto y Canales</span>
                    <div className="flex items-center gap-2 mt-1">
                      <a 
                        href={`tel:${contract.phone}`} 
                        className="font-bold text-sky-700 hover:underline inline-flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        {contract.phone}
                      </a>
                      <a
                        href={`https://wa.me/${contract.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"
                        title="Abrir WhatsApp"
                      >
                        <MessageCircle className="w-3 h-3" />
                      </a>
                    </div>
                    {contract.clientEmail ? (
                      <a 
                        href={`mailto:${contract.clientEmail}`} 
                        className="text-slate-600 hover:text-sky-700 block truncate mt-1"
                      >
                        {contract.clientEmail}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic block mt-1">Sin correo registrado</span>
                    )}
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block font-medium">Ubicación de la Obra</span>
                    <div className="flex items-start gap-1 text-slate-800 font-semibold mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span>{contract.location || 'No especificada'}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block font-medium">Monto Total Contratado</span>
                    <span className="font-black text-slate-900 text-base font-mono block mt-0.5 text-emerald-800">
                      {formatCurrency(contract.totalAmount)}
                    </span>
                    <span className="text-slate-400 block text-[11px] mt-0.5">Moneda en Soles (S/)</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <span className="text-slate-400 block font-medium">Descripción / Objeto de la Obra</span>
                  <p className="text-slate-800 font-medium mt-0.5 leading-relaxed">
                    {contract.description}
                  </p>
                </div>
              </div>

              {/* 1.3 FECHAS DE PAGO (CRONOGRAMA DE PAGOS / CUOTAS) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                        Fechas de Pago (Cronograma de Cuotas)
                      </h4>
                      <p className="text-xs text-slate-500">
                        Hitos de pago pactados para controlar vencimientos y cobranzas
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => applyScheduleTemplateInModule('50-50')}
                      className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg cursor-pointer"
                      title="Generar 50% anticipo y 50% saldo final"
                    >
                      50% / 50%
                    </button>
                    <button
                      type="button"
                      onClick={() => applyScheduleTemplateInModule('40-30-30')}
                      className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg cursor-pointer"
                      title="Generar 40% anticipo, 30% avance y 30% saldo"
                    >
                      40% / 30% / 30%
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsScheduleFormOpen(!isScheduleFormOpen)}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isScheduleFormOpen ? 'Cerrar' : '+ Poner Fecha de Pago'}</span>
                    </button>
                  </div>
                </div>

                {/* Form to add payment date */}
                {isScheduleFormOpen && (
                  <form onSubmit={handleAddScheduleItem} className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 space-y-3 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Título de la Cuota / Hito *
                        </label>
                        <input
                          type="text"
                          required
                          value={newScheduleTitle}
                          onChange={(e) => setNewScheduleTitle(e.target.value)}
                          placeholder="ej. Anticipo de inicio 40%"
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Fecha Límite de Pago *
                        </label>
                        <input
                          type="date"
                          required
                          value={newScheduleDate}
                          onChange={(e) => setNewScheduleDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Monto Pactado (S/) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={newScheduleAmount}
                          onChange={(e) => setNewScheduleAmount(e.target.value)}
                          placeholder={scheduleDifference > 0 ? scheduleDifference.toFixed(2) : '10000.00'}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Notas u Observaciones del Hito (Opcional)
                      </label>
                      <input
                        type="text"
                        value={newScheduleNotes}
                        onChange={(e) => setNewScheduleNotes(e.target.value)}
                        placeholder="ej. Condicionado a la entrega de informe de replanteo"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsScheduleFormOpen(false)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
                      >
                        Agregar Fecha de Pago
                      </button>
                    </div>
                  </form>
                )}

                {/* Schedule list */}
                {schedule.length > 0 ? (
                  <div className="space-y-2">
                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-white">
                      {schedule.map((item, idx) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const due = new Date(item.dueDate);
                        due.setHours(0, 0, 0, 0);
                        const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                        return (
                          <div key={item.id} className="p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleToggleSchedulePaid(item)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  item.isPaid 
                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                                    : 'bg-slate-100 text-slate-400 hover:text-emerald-600'
                                }`}
                                title={item.isPaid ? 'Marcar como pendiente' : 'Marcar como pagado'}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-900">
                                    #{idx + 1} {item.title}
                                  </span>
                                  {item.isPaid ? (
                                    <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                                      PAGADO
                                    </span>
                                  ) : diff < 0 ? (
                                    <span className="text-[10px] font-extrabold px-2 py-0.5 bg-red-100 text-red-800 rounded-md">
                                      Vencido hace {Math.abs(diff)} d
                                    </span>
                                  ) : diff === 0 ? (
                                    <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md">
                                      Vence hoy
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-100 text-sky-800 rounded-md">
                                      En {diff} días
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                  <span>Fecha: {formatDate(item.dueDate)}</span>
                                  {item.notes && <span>• {item.notes}</span>}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-sm font-black font-mono text-slate-900">
                                {formatCurrency(item.amount)}
                              </span>

                              {!item.isPaid && (
                                <button
                                  type="button"
                                  onClick={() => handleCollectScheduleMilestone(item)}
                                  className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg inline-flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Pasar al módulo de ingresos para registrar este cobro con su voucher y comprobante"
                                >
                                  <DollarSign className="w-3.5 h-3.5" />
                                  <span>Cobrar</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteScheduleItem(item.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                                title="Eliminar cuota"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between text-xs px-2 pt-1">
                      <span className="text-slate-600">
                        Total en cronograma: <strong className="font-mono text-slate-900">{formatCurrency(totalScheduled)}</strong> de {formatCurrency(totalContract)}
                      </span>
                      <span className={`font-bold ${Math.abs(scheduleDifference) < 0.1 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {Math.abs(scheduleDifference) < 0.1 
                          ? '✓ Cronograma cuadra al 100%' 
                          : scheduleDifference > 0 
                            ? `Saldo sin programar: ${formatCurrency(scheduleDifference)}` 
                            : `Excede por: ${formatCurrency(Math.abs(scheduleDifference))}`}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300 text-center">
                    <p className="text-xs text-slate-500">
                      No hay fechas de pago programadas todavía. Puedes presionar <button onClick={() => applyScheduleTemplateInModule('50-50')} className="font-bold text-indigo-600 hover:underline">50%/50%</button> o <button onClick={() => setIsScheduleFormOpen(true)} className="font-bold text-indigo-600 hover:underline">+ Poner Fecha de Pago</button> para agregarlas.
                    </p>
                  </div>
                )}
              </div>

              {/* 1.4 SUBIR CONTRATO PDF */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-sky-100 text-sky-700 rounded-lg">
                      <FileCheck className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                        Contrato PDF Firmado
                      </h4>
                      <p className="text-xs text-slate-500">
                        Almacenamiento seguro en la carpeta designada de Google Drive
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={TARGET_DRIVE_FOLDER_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-sky-700 hover:underline inline-flex items-center gap-1"
                      title="Abrir carpeta en Google Drive"
                    >
                      <span>Carpeta Drive ↗</span>
                    </a>
                    {contractNotice && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 animate-in fade-in">
                        {contractNotice}
                      </span>
                    )}
                  </div>
                </div>

                {contract.contractFile ? (
                  <div className="bg-sky-50/70 p-4 rounded-xl border border-sky-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-white text-sky-700 rounded-xl border border-sky-100 shadow-2xs">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900">
                          {contract.contractFile.name}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span>Subido: {formatDate(contract.contractFile.uploadedAt)}</span>
                          <span>•</span>
                          <span>{formatFileSize(contract.contractFile.size)}</span>
                          {contract.contractFile.driveUrl && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-700 font-bold">✓ En Drive</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenViewer(contract.contractFile!, `Contrato: ${contract.contractNumber}`)}
                        className="px-3 py-1.5 text-xs font-bold text-sky-700 bg-white hover:bg-sky-100 border border-sky-300 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver PDF</span>
                      </button>

                      {contract.contractFile.driveUrl ? (
                        <a
                          href={contract.contractFile.driveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                          <span>En Drive</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSyncAttachmentToDrive(
                            contract.contractFile!,
                            (updated) => onUpdateContract({ ...contract, contractFile: updated }),
                            `Contrato: ${contract.contractNumber}`
                          )}
                          className="px-2.5 py-1.5 text-xs font-bold text-sky-700 bg-white hover:bg-sky-50 border border-sky-200 rounded-lg inline-flex items-center gap-1"
                        >
                          <CloudUpload className="w-3.5 h-3.5" />
                          <span>Subir a Drive</span>
                        </button>
                      )}

                      <a
                        href={contract.contractFile.dataUrl}
                        download={contract.contractFile.name}
                        className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar</span>
                      </a>

                      <label className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Reemplazar</span>
                        <input
                          type="file"
                          accept="application/pdf,image/*"
                          onChange={handleContractPdfUpload}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={handleRemoveContractPdf}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="Quitar contrato adjunto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:bg-slate-50 transition-colors">
                    <Upload className="w-8 h-8 text-sky-500 mx-auto mb-2" />
                    <label className="cursor-pointer text-xs font-bold text-sky-600 hover:text-sky-700 block">
                      <span>Seleccionar o arrastrar el archivo PDF del contrato firmado</span>
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={handleContractPdfUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {isUploadingContract ? 'Subiendo documento a Google Drive...' : 'Se admiten contratos firmados en formato PDF o imagen escaneada'}
                    </p>
                  </div>
                )}
              </div>

              {/* 1.5 ACCIÓN DE ELIMINAR REGISTRO */}
              <div className="bg-red-50/50 p-4 rounded-2xl border border-red-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-900">
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span>Eliminar Registro del Contrato</span>
                  </div>
                  <p className="text-[11px] text-red-700/80 mt-0.5 max-w-xl">
                    Borra permanentemente este contrato ({contract.contractNumber}), incluyendo su cronograma de cuotas, comprobantes, registro de ingresos y gastos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteContract(contract.id)}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Eliminar Registro</span>
                </button>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* MÓDULO 2: INGRESOS / COBROS */}
          {/* ========================================================================= */}
          {activeTab === 'ingresos' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* 2.1 RESUMEN FINANCIERO DE COBROS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Total Contratado
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1 block">
                    {formatCurrency(financials.totalAmount)}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">Monto pactado de obra</span>
                </div>

                <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Total Cobrado (Ingresado)
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono mt-1 block">
                    {formatCurrency(financials.totalPaid)}
                  </span>
                  <span className="text-[11px] text-emerald-700 mt-1 block font-medium">
                    {financials.paymentCount} cobro(s) registrados ({financials.progressPercent}%)
                  </span>
                </div>

                <div className={`p-4 rounded-xl border ${financials.pendingBalance > 0 ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-[11px] font-bold uppercase tracking-wider block ${financials.pendingBalance > 0 ? 'text-amber-800' : 'text-slate-500'}`}>
                    Saldo Pendiente de Cobro
                  </span>
                  <span className={`text-xl sm:text-2xl font-black font-mono mt-1 block ${financials.pendingBalance > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                    {formatCurrency(financials.pendingBalance)}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {financials.pendingBalance <= 0 ? '✓ Contrato 100% cobrado' : 'Pendiente por cobrar'}
                  </span>
                </div>
              </div>

              {/* Botón para abrir el formulario de ingreso */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Historial de Ingresos / Cobros Recibidos
                  </h4>
                  <p className="text-xs text-slate-500">
                    Comprobantes y vouchers archivados en tu Google Drive
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowIncomeForm(!showIncomeForm)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    showIncomeForm 
                      ? 'bg-slate-200 text-slate-800' 
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>{showIncomeForm ? 'Cerrar Formulario' : '+ Registrar Cobro / Ingreso'}</span>
                </button>
              </div>

              {/* Formulario de registro de cobro con voucher y comprobante */}
              {showIncomeForm && (
                <form onSubmit={handleAddIncome} className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200 space-y-4 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-emerald-600 text-white rounded-lg">
                      <DollarSign className="w-4 h-4" />
                    </span>
                    <h5 className="text-xs font-black uppercase tracking-wider text-emerald-950">
                      Registrar Cobro: Datos, Voucher y Comprobante Emitido
                    </h5>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Fecha del Cobro *
                      </label>
                      <input
                        type="date"
                        required
                        value={incomeDate}
                        onChange={(e) => setIncomeDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Monto Ingresado (S/) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={incomeAmount}
                        onChange={(e) => setIncomeAmount(e.target.value)}
                        placeholder="ej. 5000.00"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-emerald-500 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Medio de Pago *
                      </label>
                      <select
                        value={incomeMethod}
                        onChange={(e) => setIncomeMethod(e.target.value as PaymentMethod)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-emerald-500 font-medium"
                      >
                        <option value="Transferencia Bancaria">Transferencia Bancaria (BCP/BBVA/Interbank)</option>
                        <option value="Yape">Yape</option>
                        <option value="Plin">Plin</option>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        N° de Operación / Referencia de Voucher *
                      </label>
                      <input
                        type="text"
                        required
                        value={incomeReference}
                        onChange={(e) => setIncomeReference(e.target.value)}
                        placeholder="ej. OP-9812450 o Yape 782914"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-emerald-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        N° de Comprobante Emitido (Factura / Boleta)
                      </label>
                      <input
                        type="text"
                        value={incomeInvoiceNumber}
                        onChange={(e) => setIncomeInvoiceNumber(e.target.value)}
                        placeholder="ej. F001-000452 o B001-120"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Dos subidas de archivo: 1) Voucher del dinero ingresado, 2) Comprobante emitido */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {/* Voucher de dinero */}
                    <div className="bg-white p-3.5 rounded-xl border border-emerald-200">
                      <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                        <span>1. Voucher del Dinero Ingresado</span>
                      </label>
                      <p className="text-[11px] text-slate-400 mb-2">
                        Captura de Yape/Plin o constancia bancaria (se guarda en Google Drive)
                      </p>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleIncomeVoucherUpload}
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                      />
                      {incomeVoucherFile && (
                        <div className="mt-1.5 flex items-center justify-between text-[11px]">
                          <span className="text-emerald-700 font-bold truncate">
                            ✓ {incomeVoucherFile.name}
                          </span>
                          {incomeVoucherFile.driveUrl && (
                            <span className="text-sky-700 font-bold">✓ En Drive</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Comprobante emitido */}
                    <div className="bg-white p-3.5 rounded-xl border border-emerald-200">
                      <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-sky-600" />
                        <span>2. Comprobante Emitido al Cliente</span>
                      </label>
                      <p className="text-[11px] text-slate-400 mb-2">
                        Factura electrónica o boleta emitida por este abono
                      </p>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleIncomeInvoiceUpload}
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
                      />
                      {incomeInvoiceFile && (
                        <div className="mt-1.5 flex items-center justify-between text-[11px]">
                          <span className="text-sky-700 font-bold truncate">
                            ✓ {incomeInvoiceFile.name}
                          </span>
                          {incomeInvoiceFile.driveUrl && (
                            <span className="text-sky-700 font-bold">✓ En Drive</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Notas u Observaciones del Cobro
                    </label>
                    <input
                      type="text"
                      value={incomeNotes}
                      onChange={(e) => setIncomeNotes(e.target.value)}
                      placeholder="ej. Pago de adelanto 50% según contrato"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-emerald-200">
                    <button
                      type="button"
                      onClick={() => setShowIncomeForm(false)}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isUploadingIncomeVoucher || isUploadingIncomeInvoice}
                      className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Guardar Cobro</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de cobros registrados */}
              {payments.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3.5">Fecha</th>
                        <th className="py-3 px-3.5">Monto (S/)</th>
                        <th className="py-3 px-3.5">Medio de Pago</th>
                        <th className="py-3 px-3.5">N° Operación</th>
                        <th className="py-3 px-3.5 text-center">Voucher de Dinero</th>
                        <th className="py-3 px-3.5 text-center">Comprobante Emitido</th>
                        <th className="py-3 px-3.5">Notas</th>
                        <th className="py-3 px-3.5 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.map((p) => {
                        const voucher = p.voucherFile || p.receiptFile;
                        const invoice = p.invoiceFile;

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3.5 whitespace-nowrap font-medium text-slate-700">
                              {formatDate(p.date)}
                            </td>

                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <span className="font-mono font-black text-sm text-emerald-700">
                                {formatCurrency(p.amount)}
                              </span>
                            </td>

                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-800 border border-slate-200">
                                {p.method}
                              </span>
                            </td>

                            <td className="py-3 px-3.5 whitespace-nowrap font-mono text-xs font-semibold text-slate-800">
                              {p.reference}
                            </td>

                            {/* Voucher de dinero adjunto */}
                            <td className="py-3 px-3.5 whitespace-nowrap text-center">
                              {voucher ? (
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => onOpenViewer(voucher, `Voucher de Abono: ${p.reference}`)}
                                    className="px-2.5 py-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Ver</span>
                                  </button>
                                  {voucher.driveUrl ? (
                                    <a
                                      href={voucher.driveUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded"
                                      title="Abrir voucher en Google Drive"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleSyncAttachmentToDrive(
                                        voucher,
                                        (updated) => {
                                          const updatedPayments = payments.map(item => item.id === p.id ? { ...item, voucherFile: updated, receiptFile: updated } : item);
                                          onUpdateContract({ ...contract, payments: updatedPayments });
                                        },
                                        `Voucher: ${p.reference}`
                                      )}
                                      className="p-1 text-sky-600 hover:bg-sky-50 rounded"
                                      title="Subir a Google Drive"
                                    >
                                      <CloudUpload className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <label className="px-2 py-1 text-[10px] font-semibold text-slate-500 hover:text-purple-700 border border-dashed border-slate-300 rounded-lg inline-flex items-center gap-1 cursor-pointer">
                                  <Upload className="w-2.5 h-2.5" />
                                  <span>+ Subir</span>
                                  <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => e.target.files?.[0] && handleAttachFileToPayment(p, 'voucher', e.target.files[0])}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </td>

                            {/* Comprobante emitido adjunto */}
                            <td className="py-3 px-3.5 whitespace-nowrap text-center">
                              {invoice ? (
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => onOpenViewer(invoice, `Comprobante: ${p.invoiceNumber || p.reference}`)}
                                    className="px-2.5 py-1 text-[11px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>{p.invoiceNumber || 'Ver'}</span>
                                  </button>
                                  {invoice.driveUrl ? (
                                    <a
                                      href={invoice.driveUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded"
                                      title="Abrir factura en Google Drive"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleSyncAttachmentToDrive(
                                        invoice,
                                        (updated) => {
                                          const updatedPayments = payments.map(item => item.id === p.id ? { ...item, invoiceFile: updated } : item);
                                          onUpdateContract({ ...contract, payments: updatedPayments });
                                        },
                                        `Comprobante: ${p.invoiceNumber || p.reference}`
                                      )}
                                      className="p-1 text-sky-600 hover:bg-sky-50 rounded"
                                      title="Subir a Google Drive"
                                    >
                                      <CloudUpload className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <label className="px-2 py-1 text-[10px] font-semibold text-slate-500 hover:text-sky-700 border border-dashed border-slate-300 rounded-lg inline-flex items-center gap-1 cursor-pointer">
                                  <Upload className="w-2.5 h-2.5" />
                                  <span>+ Subir Factura</span>
                                  <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => e.target.files?.[0] && handleAttachFileToPayment(p, 'invoice', e.target.files[0])}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </td>

                            <td className="py-3 px-3.5 text-slate-600 max-w-xs truncate">
                              {p.notes || '-'}
                            </td>

                            <td className="py-3 px-3.5 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleDeleteIncome(p.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                                title="Eliminar abono"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300 text-center">
                  <DollarSign className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">
                    Aún no se han registrado cobros o ingresos para este contrato
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Usa el botón "+ Registrar Cobro / Ingreso" para asentar abonos en banco, Yape o transferencias.
                  </p>
                </div>
              )}

              {/* Sección Opcional: Factura Final Global de Liquidación */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-slate-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-800">Factura Final Global de Liquidación (Opcional)</span>
                      <p className="text-[11px] text-slate-500">
                        {contract.invoice ? `Emitida: ${contract.invoice.invoiceNumber} (${formatDate(contract.invoice.issueDate)})` : 'Si emites una factura global por el 100% de la obra, regístrala aquí.'}
                      </p>
                    </div>
                  </div>

                  {contract.invoice?.file && (
                    <button
                      type="button"
                      onClick={() => onOpenViewer(contract.invoice!.file!, `Factura Final: ${contract.invoice?.invoiceNumber}`)}
                      className="px-2.5 py-1 text-xs font-bold text-sky-700 bg-white border border-sky-200 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Ver Factura Final</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowFinalInvoiceForm(!showFinalInvoiceForm)}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    {showFinalInvoiceForm ? 'Cerrar' : contract.invoice ? 'Modificar' : '+ Agregar Factura Global'}
                  </button>
                </div>

                {showFinalInvoiceForm && (
                  <form onSubmit={handleSaveFinalInvoice} className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">N° de Factura Final *</label>
                        <input
                          type="text"
                          required
                          value={finalInvoiceNum}
                          onChange={(e) => setFinalInvoiceNum(e.target.value)}
                          placeholder="ej. F001-000123"
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Fecha de Emisión</label>
                        <input
                          type="date"
                          value={finalInvoiceDate}
                          onChange={(e) => setFinalInvoiceDate(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Archivo PDF de la Factura Global
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="flex-1 border border-dashed border-slate-300 rounded-lg p-2 text-center cursor-pointer hover:bg-slate-50 transition-colors">
                          <input
                            type="file"
                            accept="application/pdf,image/*"
                            onChange={handleFinalInvoiceFileUpload}
                            className="hidden"
                          />
                          <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                            <Upload className="w-4 h-4 text-sky-600" />
                            <span>{finalInvoiceFile ? finalInvoiceFile.name : 'Seleccionar PDF de la Factura Global'}</span>
                          </div>
                        </label>
                        {finalInvoiceFile && (
                          <button
                            type="button"
                            onClick={() => setFinalInvoiceFile(undefined)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                            title="Quitar archivo"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Observaciones / Notas (Opcional)</label>
                      <input
                        type="text"
                        value={finalInvoiceNotes}
                        onChange={(e) => setFinalInvoiceNotes(e.target.value)}
                        placeholder="ej. Sujeto a detracción SPOT 4% o Retención de IGV"
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowFinalInvoiceForm(false)}
                        className="px-3 py-1 text-xs text-slate-600 bg-white border border-slate-300 rounded-lg"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg cursor-pointer"
                      >
                        Guardar Factura Global
                      </button>
                    </div>
                  </form>
                )}
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* MÓDULO 3: GASTOS DE OBRA */}
          {/* ========================================================================= */}
          {activeTab === 'gastos' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* 3.1 RESUMEN FINANCIERO DE GASTOS Y RENTABILIDAD */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Cobrado a la Fecha
                  </span>
                  <span className="text-xl font-black text-emerald-700 font-mono mt-1 block">
                    {formatCurrency(financials.totalPaid)}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">Ingresos reales</span>
                </div>

                <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200">
                  <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
                    Total Gastos Ejecutados
                  </span>
                  <span className="text-xl font-black text-rose-700 font-mono mt-1 block">
                    {formatCurrency(financials.totalExpenses)}
                  </span>
                  <span className="text-[11px] text-rose-700 mt-1 block font-medium">
                    {financials.expenseCount} egreso(s) registrados
                  </span>
                </div>

                <div className={`p-4 rounded-xl border ${financials.netProfit >= 0 ? 'bg-emerald-50/70 border-emerald-300' : 'bg-rose-50/70 border-rose-300'}`}>
                  <span className="text-[11px] font-bold uppercase tracking-wider block text-slate-700">
                    Utilidad Real a la Fecha
                  </span>
                  <span className={`text-xl font-black font-mono mt-1 block ${financials.netProfit >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                    {formatCurrency(financials.netProfit)}
                  </span>
                  <span className="text-[11px] font-bold text-slate-600 mt-1 block">
                    Margen actual: {financials.profitMarginPercent}%
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Utilidad Proyectada
                  </span>
                  <span className="text-xl font-black text-slate-900 font-mono mt-1 block">
                    {formatCurrency(financials.projectedProfit)}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Margen final: {financials.projectedMarginPercent}%
                  </span>
                </div>
              </div>

              {/* Botón para abrir el formulario de gasto */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Registro de Gastos de Obra
                  </h4>
                  <p className="text-xs text-slate-500">
                    Facturas de compras y vouchers archivados en tu Google Drive
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowExpenseForm(!showExpenseForm)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    showExpenseForm 
                      ? 'bg-slate-200 text-slate-800' 
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>{showExpenseForm ? 'Cerrar Formulario' : '+ Registrar Gasto de Obra'}</span>
                </button>
              </div>

              {/* Formulario de registro de gasto */}
              {showExpenseForm && (
                <form onSubmit={handleAddExpense} className="bg-rose-50/60 p-5 rounded-2xl border border-rose-200 space-y-4 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-rose-600 text-white rounded-lg">
                      <Receipt className="w-4 h-4" />
                    </span>
                    <h5 className="text-xs font-black uppercase tracking-wider text-rose-950">
                      Registrar Gasto: Comprobante y Voucher de Pago
                    </h5>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Fecha del Gasto *
                      </label>
                      <input
                        type="date"
                        required
                        value={expenseDate}
                        onChange={(e) => setExpenseDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Rubro / Categoría *
                      </label>
                      <select
                        value={expenseCategory}
                        onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-rose-500 font-medium"
                      >
                        <option value="MATERIALES">Materiales (Cemento, fierro, acabados)</option>
                        <option value="MANO_DE_OBRA">Mano de Obra (Jornales, cuadrilla)</option>
                        <option value="EQUIPOS_HERRAMIENTAS">Equipos y Herramientas (Alquiler/compra)</option>
                        <option value="TRANSPORTE_LOGISTICA">Transporte y Fletes</option>
                        <option value="SUBCONTRATOS">Subcontratos Especializados</option>
                        <option value="OTROS">Otros / Gastos Menores</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Monto del Gasto (S/) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                        placeholder="ej. 3850.00"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-rose-500 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Medio de Pago Utilizado *
                      </label>
                      <select
                        value={expensePaymentMethod}
                        onChange={(e) => setExpensePaymentMethod(e.target.value as PaymentMethod)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-rose-500 font-medium"
                      >
                        <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                        <option value="Yape">Yape</option>
                        <option value="Plin">Plin</option>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Concepto / Descripción del Gasto *
                      </label>
                      <input
                        type="text"
                        required
                        value={expenseDescription}
                        onChange={(e) => setExpenseDescription(e.target.value)}
                        placeholder="ej. Compra de 50 bolsas de cemento Sol y arena gruesa"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-rose-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Proveedor o Razón Social
                      </label>
                      <input
                        type="text"
                        value={expenseSupplier}
                        onChange={(e) => setExpenseSupplier(e.target.value)}
                        placeholder="ej. Ferretería El Maestro S.A.C."
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        N° Factura / Boleta / Recibo
                      </label>
                      <input
                        type="text"
                        value={expenseInvoiceNumber}
                        onChange={(e) => setExpenseInvoiceNumber(e.target.value)}
                        placeholder="ej. F001-004512"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-rose-500 font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Notas / Detalle de la Compra
                      </label>
                      <input
                        type="text"
                        value={expenseNotes}
                        onChange={(e) => setExpenseNotes(e.target.value)}
                        placeholder="ej. Puesto en obra con guía de remisión N° 124"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  {/* Dos subidas de archivo: 1) Comprobante de gasto, 2) Voucher de pago */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {/* Comprobante de Gasto */}
                    <div className="bg-white p-3.5 rounded-xl border border-rose-200">
                      <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-rose-600" />
                        <span>1. Comprobante de Gasto (Factura / Boleta)</span>
                      </label>
                      <p className="text-[11px] text-slate-400 mb-2">
                        PDF o foto de la factura del proveedor (se guarda en Google Drive)
                      </p>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleExpenseInvoiceUpload}
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 cursor-pointer"
                      />
                      {expenseInvoiceFile && (
                        <div className="mt-1.5 flex items-center justify-between text-[11px]">
                          <span className="text-rose-700 font-bold truncate">
                            ✓ {expenseInvoiceFile.name}
                          </span>
                          {expenseInvoiceFile.driveUrl && (
                            <span className="text-sky-700 font-bold">✓ En Drive</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Voucher de Pago */}
                    <div className="bg-white p-3.5 rounded-xl border border-rose-200">
                      <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                        <span>2. Voucher de Pago al Proveedor</span>
                      </label>
                      <p className="text-[11px] text-slate-400 mb-2">
                        Constancia de la transferencia o Yape (se guarda en Google Drive)
                      </p>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleExpenseVoucherUpload}
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      />
                      {expenseVoucherFile && (
                        <div className="mt-1.5 flex items-center justify-between text-[11px]">
                          <span className="text-blue-700 font-bold truncate">
                            ✓ {expenseVoucherFile.name}
                          </span>
                          {expenseVoucherFile.driveUrl && (
                            <span className="text-sky-700 font-bold">✓ En Drive</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-rose-200">
                    <button
                      type="button"
                      onClick={() => setShowExpenseForm(false)}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isUploadingExpenseInvoice || isUploadingExpenseVoucher}
                      className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Guardar Gasto</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Filtros de búsqueda para gastos */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <input
                    type="text"
                    value={expenseSearch}
                    onChange={(e) => setExpenseSearch(e.target.value)}
                    placeholder="Buscar por descripción, proveedor o factura..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setExpenseFilterCategory('ALL')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                      expenseFilterCategory === 'ALL' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    Todos ({expenses.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseFilterCategory('MATERIALES')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                      expenseFilterCategory === 'MATERIALES' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    Materiales
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseFilterCategory('MANO_DE_OBRA')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                      expenseFilterCategory === 'MANO_DE_OBRA' ? 'bg-amber-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    Mano de Obra
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseFilterCategory('EQUIPOS_HERRAMIENTAS')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                      expenseFilterCategory === 'EQUIPOS_HERRAMIENTAS' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    Equipos
                  </button>
                </div>
              </div>

              {/* Lista de gastos registrados */}
              {filteredExpenses.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3.5">Fecha</th>
                        <th className="py-3 px-3.5">Rubro</th>
                        <th className="py-3 px-3.5">Descripción & Proveedor</th>
                        <th className="py-3 px-3.5">N° Comprobante</th>
                        <th className="py-3 px-3.5 text-right">Monto (S/)</th>
                        <th className="py-3 px-3.5 text-center">Comprobante de Gasto</th>
                        <th className="py-3 px-3.5 text-center">Voucher de Pago</th>
                        <th className="py-3 px-3.5 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredExpenses.map((exp) => {
                        const catMeta = formatExpenseCategory(exp.category);
                        const invFile = exp.invoiceFile || exp.receiptFile;
                        const vchFile = exp.voucherFile;

                        return (
                          <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3.5 whitespace-nowrap font-medium text-slate-700">
                              {formatDate(exp.date)}
                            </td>

                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border ${catMeta.color}`}>
                                {catMeta.label}
                              </span>
                            </td>

                            <td className="py-3 px-3.5">
                              <p className="font-bold text-slate-900 leading-tight">
                                {exp.description}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Prov: <span className="font-semibold text-slate-700">{exp.supplier}</span>
                              </p>
                            </td>

                            <td className="py-3 px-3.5 whitespace-nowrap font-mono text-xs font-semibold text-slate-800">
                              {exp.invoiceNumber || '-'}
                            </td>

                            <td className="py-3 px-3.5 whitespace-nowrap text-right">
                              <span className="font-mono font-black text-sm text-rose-700">
                                {formatCurrency(exp.amount)}
                              </span>
                            </td>

                            {/* Comprobante de gasto adjunto */}
                            <td className="py-3 px-3.5 whitespace-nowrap text-center">
                              {invFile ? (
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => onOpenViewer(invFile, `Comprobante de Gasto: ${exp.invoiceNumber || exp.description}`)}
                                    className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Ver</span>
                                  </button>
                                  {invFile.driveUrl ? (
                                    <a
                                      href={invFile.driveUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded"
                                      title="Abrir factura en Google Drive"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleSyncAttachmentToDrive(
                                        invFile,
                                        (updated) => {
                                          const updatedExpenses = expenses.map(item => item.id === exp.id ? { ...item, invoiceFile: updated, receiptFile: updated } : item);
                                          onUpdateContract({ ...contract, expenses: updatedExpenses });
                                        },
                                        `Factura Gasto: ${exp.description}`
                                      )}
                                      className="p-1 text-sky-600 hover:bg-sky-50 rounded"
                                      title="Subir a Google Drive"
                                    >
                                      <CloudUpload className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <label className="px-2 py-1 text-[10px] font-semibold text-slate-500 hover:text-rose-700 border border-dashed border-slate-300 rounded-lg inline-flex items-center gap-1 cursor-pointer">
                                  <Upload className="w-2.5 h-2.5" />
                                  <span>+ Subir Factura</span>
                                  <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => e.target.files?.[0] && handleAttachFileToExpense(exp, 'invoice', e.target.files[0])}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </td>

                            {/* Voucher de pago adjunto */}
                            <td className="py-3 px-3.5 whitespace-nowrap text-center">
                              {vchFile ? (
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => onOpenViewer(vchFile, `Voucher de Pago: ${exp.supplier}`)}
                                    className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Ver</span>
                                  </button>
                                  {vchFile.driveUrl ? (
                                    <a
                                      href={vchFile.driveUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded"
                                      title="Abrir voucher en Google Drive"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleSyncAttachmentToDrive(
                                        vchFile,
                                        (updated) => {
                                          const updatedExpenses = expenses.map(item => item.id === exp.id ? { ...item, voucherFile: updated } : item);
                                          onUpdateContract({ ...contract, expenses: updatedExpenses });
                                        },
                                        `Voucher Pago: ${exp.supplier}`
                                      )}
                                      className="p-1 text-sky-600 hover:bg-sky-50 rounded"
                                      title="Subir a Google Drive"
                                    >
                                      <CloudUpload className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <label className="px-2 py-1 text-[10px] font-semibold text-slate-500 hover:text-blue-700 border border-dashed border-slate-300 rounded-lg inline-flex items-center gap-1 cursor-pointer">
                                  <Upload className="w-2.5 h-2.5" />
                                  <span>+ Subir Voucher</span>
                                  <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => e.target.files?.[0] && handleAttachFileToExpense(exp, 'voucher', e.target.files[0])}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </td>

                            <td className="py-3 px-3.5 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                                title="Eliminar gasto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300 text-center">
                  <Receipt className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">
                    No se encontraron gastos registrados para los criterios seleccionados
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Registra compras de materiales, planillas o servicios con sus comprobantes y vouchers de pago.
                  </p>
                </div>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* MÓDULO 4: EXPEDIENTE Y CARPETAS DE DOCUMENTOS */}
          {/* ========================================================================= */}
          {activeTab === 'archivos' && (
            <ContractDocumentArchive
              contract={contract}
              onUpdateContract={onUpdateContract}
              onPreviewAttachment={onOpenViewer}
            />
          )}

        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-3 text-slate-600">
            <span>Última actualización: <strong className="text-slate-700 font-medium">{formatDate(contract.updatedAt)}</strong></span>
            <span>•</span>
            <button
              type="button"
              onClick={() => setActiveTab('archivos')}
              className="text-sky-700 hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Expediente: {totalContractDocsCount} documentos en carpetas</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`¿Estás seguro de eliminar por completo el contrato ${contract.contractNumber}? Esta acción no se puede deshacer.`)) {
                  onDeleteContract(contract.id);
                }
              }}
              className="px-3 py-1.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar Contrato</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
