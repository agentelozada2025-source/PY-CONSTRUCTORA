import React, { useState, useMemo } from 'react';
import { 
  Contract, 
  PaymentScheduleItem, 
  Payment, 
  PaymentMethod, 
  FileAttachment 
} from '../../types';
import { 
  formatCurrency, 
  formatDate 
} from '../../utils/formatters';
import { readFileAsBase64 } from '../../utils/storage';
import { uploadDocumentToContractDrive } from '../../services/googleDriveService';
import { 
  Building2, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  ExternalLink, 
  ArrowUpDown, 
  FileText, 
  Phone, 
  Paperclip, 
  Upload, 
  X, 
  ShieldAlert, 
  Wallet,
  Receipt,
  Check
} from 'lucide-react';

interface CollectionsModuleProps {
  contracts: Contract[];
  onSelectContract: (contract: Contract) => void;
  onOpenNewContract: () => void;
  onUpdateContract?: (contract: Contract) => Promise<void> | void;
  onOpenViewer?: (attachment: FileAttachment, title: string) => void;
}

type CollectionFilter = 'ALL' | 'PENDING' | 'OVERDUE' | 'COMPLETED';

interface ContractCollectionAnalysis {
  contract: Contract;
  totalContract: number;
  totalPaid: number;
  pendingBalance: number;
  collectionProgressPercent: number;
  
  totalMilestonesCount: number;
  paidMilestonesCount: number;
  pendingMilestonesCount: number;
  overdueMilestonesCount: number;
  
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;

  hasOverdue: boolean;
  nextDueDate: Date | null;
  daysToNextDue: number | null;
  
  isFullyPaid: boolean;
  milestones: Array<{
    item: PaymentScheduleItem;
    isPaid: boolean;
    dueDate: Date;
    daysDiff: number;
    isOverdue: boolean;
    isUpcoming: boolean;
  }>;
}

export const CollectionsModule: React.FC<CollectionsModuleProps> = ({
  contracts,
  onSelectContract,
  onOpenNewContract,
  onUpdateContract,
  onOpenViewer
}) => {
  const [filter, setFilter] = useState<CollectionFilter>('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'balance-desc' | 'total-desc' | 'client' | 'next-due'>('balance-desc');
  const [expandedContractIds, setExpandedContractIds] = useState<Set<string>>(new Set());

  // Modal de Registro Formal de Cobro
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTargetContract, setPaymentTargetContract] = useState<Contract | null>(null);
  const [paymentTargetMilestone, setPaymentTargetMilestone] = useState<PaymentScheduleItem | null>(null);
  
  // Campos del formulario de cobro
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transferencia Bancaria');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentInvoiceNumber, setPaymentInvoiceNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentVoucherFile, setPaymentVoucherFile] = useState<FileAttachment | undefined>(undefined);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Modal para Subir Factura Global en PDF
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceTargetContract, setInvoiceTargetContract] = useState<Contract | null>(null);
  const [invoiceNumberInput, setInvoiceNumberInput] = useState('');
  const [invoiceDateInput, setInvoiceDateInput] = useState(() => new Date().toISOString().slice(0, 10));
  const [invoiceNotesInput, setInvoiceNotesInput] = useState('');
  const [invoicePdfFile, setInvoicePdfFile] = useState<FileAttachment | undefined>(undefined);
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);

  // Abrir modal de Factura Global en PDF
  const handleOpenInvoiceModal = (contract: Contract) => {
    setInvoiceTargetContract(contract);
    setInvoiceNumberInput(contract.invoice?.invoiceNumber || '');
    setInvoiceDateInput(contract.invoice?.issueDate || new Date().toISOString().slice(0, 10));
    setInvoiceNotesInput(contract.invoice?.notes || '');
    setInvoicePdfFile(contract.invoice?.file || undefined);
    setIsInvoiceModalOpen(true);
  };

  // Subir archivo PDF de Factura Global
  const handleInvoicePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const attachment: FileAttachment = {
        name: file.name,
        type: file.type || 'application/pdf',
        size: file.size,
        dataUrl: base64,
        uploadedAt: new Date().toISOString()
      };
      setInvoicePdfFile(attachment);
    };
    reader.readAsDataURL(file);
  };

  // Guardar Factura Global en PDF
  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceTargetContract || !onUpdateContract) return;

    if (!invoiceNumberInput.trim()) {
      alert('Por favor ingresa el número de la factura global');
      return;
    }

    setIsSavingInvoice(true);
    try {
      const updatedContract: Contract = {
        ...invoiceTargetContract,
        invoice: {
          invoiceNumber: invoiceNumberInput.trim(),
          issueDate: invoiceDateInput || new Date().toISOString().slice(0, 10),
          notes: invoiceNotesInput.trim() || undefined,
          file: invoicePdfFile,
          updatedAt: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      };

      await onUpdateContract(updatedContract);
      setIsInvoiceModalOpen(false);
      setInvoiceTargetContract(null);
    } catch (err) {
      console.error('Error guardando factura global:', err);
      alert('Error al guardar la factura global');
    } finally {
      setIsSavingInvoice(false);
    }
  };

  // Desvincular Factura Global
  const handleDeleteInvoice = async (contract: Contract) => {
    if (!onUpdateContract) return;
    if (window.confirm(`¿Deseas desvincular la Factura Global del contrato ${contract.contractNumber}?`)) {
      const updatedContract: Contract = {
        ...contract,
        invoice: null,
        updatedAt: new Date().toISOString()
      };
      await onUpdateContract(updatedContract);
    }
  };

  // Toggle para expandir/colapsar contrato
  const toggleExpand = (contractId: string) => {
    setExpandedContractIds((prev) => {
      const next = new Set(prev);
      if (next.has(contractId)) {
        next.delete(contractId);
      } else {
        next.add(contractId);
      }
      return next;
    });
  };

  // Abrir modal de cobro para un contrato o cuota específica
  const handleOpenPaymentModal = (contract: Contract, milestone?: PaymentScheduleItem) => {
    setPaymentTargetContract(contract);
    setPaymentTargetMilestone(milestone || null);
    
    // Sugerir monto
    if (milestone) {
      setPaymentAmount(String(milestone.amount));
      setPaymentReference(`Cobro cuota: ${milestone.title}`);
    } else {
      const totalPaid = (contract.payments || []).reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
      const pending = Math.max(0, (Number(contract.totalAmount) || 0) - totalPaid);
      setPaymentAmount(pending > 0 ? String(pending) : '');
      setPaymentReference('Abono directo de obra');
    }
    
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentMethod('Transferencia Bancaria');
    setPaymentInvoiceNumber('');
    setPaymentNotes('');
    setPaymentVoucherFile(undefined);
    setIsPaymentModalOpen(true);
  };

  // Subir váucher en modal
  const handleVoucherUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await readFileAsBase64(file);
      let driveFileId: string | undefined = undefined;
      let driveUrl: string | undefined = undefined;

      if (paymentTargetContract) {
        try {
          const driveRes = await uploadDocumentToContractDrive({
            contractNumber: paymentTargetContract.contractNumber,
            clientName: paymentTargetContract.clientName,
            category: 'VOUCHERS',
            fileOrDataUrl: file,
            customDescription: `Voucher Cobro: ${paymentTargetContract.contractNumber}`,
          });
          if (driveRes) {
            driveFileId = driveRes.fileId;
            driveUrl = driveRes.driveUrl;
          }
        } catch (driveErr) {
          console.warn('Drive auto-upload notice (file saved locally):', driveErr);
        }
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
      setPaymentVoucherFile(attachment);
    } catch (err) {
      console.error('Error reading voucher file:', err);
    }
  };

  // Guardar formalmente el cobro
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTargetContract || !onUpdateContract) return;

    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const newPayment: Payment = {
        id: `pay-${Date.now()}`,
        date: paymentDate,
        amount: amt,
        method: paymentMethod,
        reference: paymentReference.trim() || 'Abono directo',
        receiptFile: paymentVoucherFile,
        voucherFile: paymentVoucherFile,
        invoiceNumber: paymentInvoiceNumber.trim() || undefined,
        notes: paymentNotes.trim() || undefined,
        createdAt: new Date().toISOString()
      };

      const updatedPayments = [...(paymentTargetContract.payments || []), newPayment];
      const newPaidTotal = updatedPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
      const totalContract = Number(paymentTargetContract.totalAmount) || 0;
      const newBalance = Math.max(0, totalContract - newPaidTotal);

      // Sincronizar cuotas del cronograma con el monto acumulado pagado
      let running = 0;
      const updatedSchedule = (paymentTargetContract.paymentSchedule || []).map((s) => {
        running += Number(s.amount) || 0;
        if (newPaidTotal >= running - 0.01) {
          return { ...s, isPaid: true };
        }
        return s;
      });

      let updatedStatus = paymentTargetContract.status;
      if (newBalance <= 0.01 && paymentTargetContract.status === 'EN_EJECUCION') {
        updatedStatus = 'OBRA_TERMINADA';
      }

      const updatedContract: Contract = {
        ...paymentTargetContract,
        payments: updatedPayments,
        paymentSchedule: updatedSchedule.length > 0 ? updatedSchedule : paymentTargetContract.paymentSchedule,
        status: updatedStatus,
        updatedAt: new Date().toISOString()
      };

      await onUpdateContract(updatedContract);
      setIsPaymentModalOpen(false);
      setPaymentTargetContract(null);
      setPaymentTargetMilestone(null);
    } catch (err) {
      console.error('Error guardando cobro:', err);
      alert('Ocurrió un error al guardar el cobro');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Análisis integral de cada contrato por filas
  const contractAnalyses = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return contracts.map((contract): ContractCollectionAnalysis => {
      const totalContract = Number(contract.totalAmount) || 0;
      const payments = contract.payments || [];
      const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
      const pendingBalance = Math.max(0, totalContract - totalPaid);
      const isFullyPaid = pendingBalance <= 0.01 && totalContract > 0;
      const progressPercent = totalContract > 0 ? Math.min(100, Math.round((totalPaid / totalContract) * 100)) : 0;

      const schedule = contract.paymentSchedule || [];

      let runningSchedulePaid = 0;
      const enrichedMilestones = schedule.map((item) => {
        runningSchedulePaid += Number(item.amount) || 0;
        const due = new Date(item.dueDate);
        due.setHours(0, 0, 0, 0);
        const diffTime = due.getTime() - today.getTime();
        const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Solo es pagada si hay registro de pagos acumulados que la cubran, o si el contrato concluyó
        const isCovered = totalPaid >= runningSchedulePaid - 0.01;
        const isPaid = Boolean(item.isPaid || contract.status === 'PAGADO_CONCLUIDO' || isCovered);
        const isOverdue = !isPaid && daysDiff < 0;
        const isUpcoming = !isPaid && daysDiff >= 0 && daysDiff <= 14;

        return {
          item,
          isPaid,
          dueDate: due,
          daysDiff,
          isOverdue,
          isUpcoming,
        };
      });

      const paidMilestones = enrichedMilestones.filter((m) => m.isPaid);
      const pendingMilestones = enrichedMilestones.filter((m) => !m.isPaid);
      const overdueMilestones = enrichedMilestones.filter((m) => m.isOverdue);

      let paidCount = 0;
      let pendingCount = 0;
      let overdueCount = 0;
      let paidAmt = 0;
      let pendingAmt = 0;
      let overdueAmt = 0;

      if (schedule.length > 0) {
        paidCount = paidMilestones.length;
        pendingCount = pendingMilestones.length;
        overdueCount = overdueMilestones.length;
        paidAmt = Math.min(totalContract, Math.max(paidMilestones.reduce((acc, m) => acc + (Number(m.item.amount) || 0), 0), totalPaid));
        pendingAmt = Math.max(0, totalContract - paidAmt);
        overdueAmt = overdueMilestones.reduce((acc, m) => acc + (Number(m.item.amount) || 0), 0);
      } else {
        // Obra sin cronograma explícito: se computa por pagos registrados y saldo
        paidCount = payments.length;
        pendingCount = pendingBalance > 0 ? 1 : 0;
        overdueCount = 0;
        paidAmt = totalPaid;
        pendingAmt = pendingBalance;
        overdueAmt = 0;
      }

      // Próximo vencimiento
      let nextDueDate: Date | null = null;
      let daysToNextDue: number | null = null;
      if (pendingMilestones.length > 0) {
        const sortedPending = [...pendingMilestones].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
        nextDueDate = sortedPending[0].dueDate;
        daysToNextDue = sortedPending[0].daysDiff;
      }

      return {
        contract,
        totalContract,
        totalPaid,
        pendingBalance,
        collectionProgressPercent: progressPercent,
        totalMilestonesCount: schedule.length > 0 ? schedule.length : (payments.length + (pendingBalance > 0 ? 1 : 0)),
        paidMilestonesCount: paidCount,
        pendingMilestonesCount: pendingCount,
        overdueMilestonesCount: overdueCount,
        paidAmount: paidAmt,
        pendingAmount: pendingAmt,
        overdueAmount: overdueAmt,
        hasOverdue: overdueCount > 0,
        nextDueDate,
        daysToNextDue,
        isFullyPaid,
        milestones: enrichedMilestones,
      };
    });
  }, [contracts]);

  // Totales globales para KPIs
  const globalStats = useMemo(() => {
    let grandContracted = 0;
    let grandPaid = 0;
    let grandPending = 0;
    let grandOverdue = 0;
    let totalPaidCuotas = 0;
    let totalPendingCuotas = 0;
    let totalOverdueCuotas = 0;
    let fullyPaidContractsCount = 0;
    let pendingContractsCount = 0;
    let overdueContractsCount = 0;

    contractAnalyses.forEach((a) => {
      grandContracted += a.totalContract;
      grandPaid += a.totalPaid;
      grandPending += a.pendingBalance;
      grandOverdue += a.overdueAmount;
      totalPaidCuotas += a.paidMilestonesCount;
      totalPendingCuotas += a.pendingMilestonesCount;
      totalOverdueCuotas += a.overdueMilestonesCount;

      if (a.isFullyPaid) {
        fullyPaidContractsCount++;
      } else {
        pendingContractsCount++;
      }
      if (a.hasOverdue) {
        overdueContractsCount++;
      }
    });

    const globalCollectionRate = grandContracted > 0 ? Math.round((grandPaid / grandContracted) * 100) : 0;

    return {
      grandContracted,
      grandPaid,
      grandPending,
      grandOverdue,
      totalPaidCuotas,
      totalPendingCuotas,
      totalOverdueCuotas,
      fullyPaidContractsCount,
      pendingContractsCount,
      overdueContractsCount,
      globalCollectionRate
    };
  }, [contractAnalyses]);

  // Filtrado de contratos por fila
  const filteredAnalyses = useMemo(() => {
    const normalize = (txt?: string) =>
      (txt || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const q = normalize(search.trim());

    return contractAnalyses.filter((item) => {
      // Filtro de estado
      if (filter === 'PENDING' && item.isFullyPaid) return false;
      if (filter === 'OVERDUE' && !item.hasOverdue) return false;
      if (filter === 'COMPLETED' && !item.isFullyPaid) return false;

      // Filtro de búsqueda
      if (q) {
        const client = normalize(item.contract.clientName);
        const code = normalize(item.contract.contractNumber);
        const loc = normalize(item.contract.location);
        const desc = normalize(item.contract.description);
        const hasMilestoneMatch = item.milestones.some((m) => normalize(m.item.title).includes(q));
        return client.includes(q) || code.includes(q) || loc.includes(q) || desc.includes(q) || hasMilestoneMatch;
      }

      return true;
    });
  }, [contractAnalyses, filter, search]);

  // Ordenamiento de filas
  const sortedAnalyses = useMemo(() => {
    return [...filteredAnalyses].sort((a, b) => {
      if (sortBy === 'balance-desc') {
        return b.pendingBalance - a.pendingBalance;
      }
      if (sortBy === 'total-desc') {
        return b.totalContract - a.totalContract;
      }
      if (sortBy === 'client') {
        return a.contract.clientName.localeCompare(b.contract.clientName);
      }
      if (sortBy === 'next-due') {
        const timeA = a.nextDueDate ? a.nextDueDate.getTime() : Infinity;
        const timeB = b.nextDueDate ? b.nextDueDate.getTime() : Infinity;
        return timeA - timeB;
      }
      return 0;
    });
  }, [filteredAnalyses, sortBy]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header del Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#202738]">
        <div>
          <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2 font-mono">
            <Calendar className="w-5 h-5 text-amber-400" />
            <span>Módulo de Cobranzas por Contrato</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitoreo por filas de contrato con especificación de cuotas cobradas, cuotas por cobrar y registro formal de abonos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenNewContract}
            className="px-3.5 py-1.5 text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-sm border border-amber-300/40 inline-flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Nuevo Contrato</span>
          </button>
        </div>
      </div>

      {/* 4 Tarjetas de Métricas de Cobranza (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Total Cartera */}
        <div 
          onClick={() => setFilter('ALL')}
          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-lg ${
            filter === 'ALL'
              ? 'ring-1 ring-amber-400 bg-[#161C2C] border-amber-400/50'
              : 'bg-[#101420] border-[#202738] hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Total Contratado</span>
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#182030] text-amber-400 border border-amber-400/30">
              {contracts.length} {contracts.length === 1 ? 'obra' : 'obras'}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white tracking-tight font-mono">
            {formatCurrency(globalStats.grandContracted)}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 bg-[#182030] rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-400 rounded-full"
                style={{ width: `${globalStats.globalCollectionRate}%` }}
              />
            </div>
            <span className="text-[10px] font-bold font-mono text-amber-400">{globalStats.globalCollectionRate}% cobrado</span>
          </div>
        </div>

        {/* 2. Cuotas Cobradas (Total Recaudado) */}
        <div 
          onClick={() => setFilter('COMPLETED')}
          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-lg ${
            filter === 'COMPLETED'
              ? 'ring-1 ring-emerald-400 bg-[#161C2C] border-emerald-400/50'
              : 'bg-[#101420] border-[#202738] hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cuotas Cobradas</span>
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/50">
              {globalStats.totalPaidCuotas} cobradas
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight font-mono">
            {formatCurrency(globalStats.grandPaid)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            {globalStats.fullyPaidContractsCount} obras totalmente canceladas
          </p>
        </div>

        {/* 3. Cuotas por Cobrar (Faltan Cobrar) */}
        <div 
          onClick={() => setFilter('PENDING')}
          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-lg ${
            filter === 'PENDING'
              ? 'ring-1 ring-sky-400 bg-[#161C2C] border-sky-400/50'
              : 'bg-[#101420] border-[#202738] hover:border-sky-500/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-sky-400 font-mono flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>Faltan por Cobrar</span>
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-500/50">
              {globalStats.totalPendingCuotas} pendientes
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-400 tracking-tight font-mono">
            {formatCurrency(globalStats.grandPending)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            {globalStats.pendingContractsCount} obras con saldo pendiente
          </p>
        </div>

        {/* 4. Cuotas Vencidas (Mora) */}
        <div 
          onClick={() => setFilter('OVERDUE')}
          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-lg ${
            filter === 'OVERDUE'
              ? 'ring-1 ring-red-400 bg-[#161C2C] border-red-400/50'
              : 'bg-[#101420] border-[#202738] hover:border-red-500/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-400 font-mono flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Cuotas Vencidas</span>
            </span>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
              globalStats.totalOverdueCuotas > 0 ? 'bg-red-950 text-red-300 border border-red-500/50 animate-pulse' : 'bg-[#182030] text-slate-400'
            }`}>
              {globalStats.totalOverdueCuotas} en mora
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-400 tracking-tight font-mono">
            {formatCurrency(globalStats.grandOverdue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            {globalStats.totalOverdueCuotas > 0 ? 'Requieren cobro inmediato' : 'Sin atrasos en cartera'}
          </p>
        </div>
      </div>

      {/* Barra de Filtros, Búsqueda y Ordenamiento */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Búsqueda en tiempo real */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, N° contrato o concepto de cuota..."
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 font-medium"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Botones de Filtro */}
        <div className="flex items-center flex-wrap gap-1.5">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200'
            }`}
          >
            Todos ({contracts.length})
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'PENDING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-800 hover:bg-amber-50 bg-amber-50/50 border border-amber-200'
            }`}
          >
            Con Saldo Pendiente ({globalStats.pendingContractsCount})
          </button>
          <button
            onClick={() => setFilter('OVERDUE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer ${
              filter === 'OVERDUE'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-red-700 hover:bg-red-50 bg-red-50/50 border border-red-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Vencidos ({globalStats.overdueContractsCount})</span>
          </button>
          <button
            onClick={() => setFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer ${
              filter === 'COMPLETED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-800 hover:bg-emerald-50 bg-emerald-50/60 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% Cobrados ({globalStats.fullyPaidContractsCount})</span>
          </button>
        </div>

        {/* Ordenamiento */}
        <div className="flex items-center gap-1.5 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="balance-desc">Mayor saldo pendiente</option>
            <option value="total-desc">Mayor monto contratado</option>
            <option value="client">Cliente (A-Z)</option>
            <option value="next-due">Próximo vencimiento</option>
          </select>
        </div>
      </div>

      {/* TABLA PRINCIPAL: ORGANIZADA POR FILAS DE CONTRATO */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50/90 text-[11px] font-black uppercase tracking-wider text-slate-600">
              <tr>
                <th className="py-3.5 px-4">Contrato & Cliente</th>
                <th className="py-3.5 px-3 text-right">Monto Contratado</th>
                <th className="py-3.5 px-3 text-right bg-emerald-50/40 border-x border-emerald-100/60 text-emerald-950">
                  Cuotas Cobradas
                </th>
                <th className="py-3.5 px-3 text-right bg-amber-50/40 border-r border-amber-100/60 text-amber-950">
                  Faltan por Cobrar
                </th>
                <th className="py-3.5 px-3 text-center">Progreso</th>
                <th className="py-3.5 px-3 text-center">Próximo Vencimiento</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {sortedAnalyses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">No se encontraron contratos con los filtros aplicados</p>
                    <p className="text-xs text-slate-400 mt-1">Prueba cambiando la búsqueda o los filtros superiores.</p>
                  </td>
                </tr>
              ) : (
                sortedAnalyses.map((analysis) => {
                  const { contract } = analysis;
                  const isExpanded = expandedContractIds.has(contract.id);

                  return (
                    <React.Fragment key={contract.id}>
                      {/* FILA PRINCIPAL DEL CONTRATO */}
                      <tr 
                        className={`hover:bg-slate-50/80 transition-colors ${
                          analysis.hasOverdue ? 'bg-red-50/15' : analysis.isFullyPaid ? 'bg-emerald-50/10' : ''
                        }`}
                      >
                        {/* 1. Contrato & Cliente */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-start gap-2.5">
                            <button
                              type="button"
                              onClick={() => toggleExpand(contract.id)}
                              className="mt-0.5 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                              title={isExpanded ? 'Ocultar cuotas' : 'Ver cuotas del contrato'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-indigo-600 stroke-[2.5]" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-black text-slate-900 text-xs bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                  {contract.contractNumber}
                                </span>
                                <span className="font-bold text-slate-900 truncate">
                                  {contract.clientName}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                                {contract.location || contract.description || 'Sin ubicación registrada'}
                              </p>
                              {contract.phone && (
                                <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                                  <Phone className="w-3 h-3" />
                                  <span>{contract.phone}</span>
                                </div>
                              )}

                              {/* Indicador de Factura Global de Obra */}
                              <div className="mt-1">
                                {contract.invoice ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (contract.invoice?.file && onOpenViewer) {
                                        onOpenViewer(contract.invoice.file, `Factura Global: ${contract.invoice.invoiceNumber}`);
                                      } else {
                                        handleOpenInvoiceModal(contract);
                                      }
                                    }}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100 transition-colors cursor-pointer"
                                    title={contract.invoice.file ? 'Ver Factura Global en PDF' : 'Subir archivo PDF de la Factura'}
                                  >
                                    <FileText className="w-3 h-3 text-sky-600" />
                                    <span>Factura: {contract.invoice.invoiceNumber}</span>
                                    {contract.invoice.file && <span className="text-[9px] bg-sky-200 text-sky-900 px-1 rounded">PDF</span>}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenInvoiceModal(contract);
                                    }}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-500 hover:text-sky-700 hover:bg-sky-50 border border-dashed border-slate-200 hover:border-sky-300 transition-colors cursor-pointer"
                                    title="Subir Factura Global de esta obra en PDF"
                                  >
                                    <Upload className="w-2.5 h-2.5 text-slate-400" />
                                    <span>+ Factura Global (PDF)</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Monto Contratado */}
                        <td className="py-3.5 px-3 text-right">
                          <div className="font-mono font-black text-slate-900 text-sm">
                            {formatCurrency(analysis.totalContract)}
                          </div>
                          <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                            contract.status === 'PAGADO_CONCLUIDO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : contract.status === 'OBRA_TERMINADA'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {contract.status === 'PAGADO_CONCLUIDO' 
                              ? 'Concluido' 
                              : contract.status === 'OBRA_TERMINADA' 
                              ? 'Obra Terminada' 
                              : 'En Ejecución'}
                          </span>
                        </td>

                        {/* 3. Cuotas Cobradas (Columnas solicitadas) */}
                        <td className="py-3.5 px-3 text-right bg-emerald-50/20 border-x border-emerald-100/50">
                          <div className="font-mono font-black text-emerald-700 text-sm">
                            {formatCurrency(analysis.paidAmount)}
                          </div>
                          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 mt-0.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>
                              {analysis.paidMilestonesCount} {analysis.paidMilestonesCount === 1 ? 'cuota cobrada' : 'cuotas cobradas'}
                            </span>
                          </div>
                        </td>

                        {/* 4. Cuotas por Cobrar (Faltan cobrar) */}
                        <td className="py-3.5 px-3 text-right bg-amber-50/20 border-r border-amber-100/50">
                          <div className={`font-mono font-black text-sm ${
                            analysis.pendingAmount > 0 ? 'text-amber-800' : 'text-slate-400'
                          }`}>
                            {formatCurrency(analysis.pendingAmount)}
                          </div>
                          <div className="mt-0.5">
                            {analysis.pendingMilestonesCount > 0 ? (
                              <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                                analysis.hasOverdue ? 'text-red-700 font-extrabold' : 'text-amber-800'
                              }`}>
                                {analysis.hasOverdue && <AlertTriangle className="w-3 h-3 text-red-600" />}
                                <span>
                                  {analysis.pendingMilestonesCount} {analysis.pendingMilestonesCount === 1 ? 'falta cobrar' : 'faltan cobrar'}
                                </span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-700">0 pendientes</span>
                            )}
                          </div>
                        </td>

                        {/* 5. Progreso */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="w-24 mx-auto">
                            <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                              <span className="text-slate-500 font-mono">{analysis.collectionProgressPercent}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  analysis.collectionProgressPercent >= 100 
                                    ? 'bg-emerald-500' 
                                    : analysis.collectionProgressPercent > 50 
                                    ? 'bg-indigo-500' 
                                    : 'bg-amber-500'
                                }`}
                                style={{ width: `${analysis.collectionProgressPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* 6. Próximo Vencimiento */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          {analysis.isFullyPaid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              <Check className="w-3 h-3 stroke-[3]" />
                              Cancelado 100%
                            </span>
                          ) : analysis.nextDueDate ? (
                            <div>
                              <span className="font-semibold text-slate-800 text-[11px] block">
                                {formatDate(analysis.nextDueDate)}
                              </span>
                              {analysis.daysToNextDue !== null && (
                                <span className={`text-[10px] font-bold block mt-0.5 ${
                                  analysis.daysToNextDue < 0 
                                    ? 'text-red-600' 
                                    : analysis.daysToNextDue <= 7 
                                    ? 'text-amber-600' 
                                    : 'text-slate-500'
                                }`}>
                                  {analysis.daysToNextDue < 0 
                                    ? `Vencida hace ${Math.abs(analysis.daysToNextDue)}d` 
                                    : analysis.daysToNextDue === 0 
                                    ? '¡Vence hoy!' 
                                    : `En ${analysis.daysToNextDue} días`}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Sin cuotas programadas</span>
                          )}
                        </td>

                        {/* 7. Acciones */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {/* Botón Registrar Cobro */}
                            {analysis.pendingAmount > 0 && onUpdateContract && (
                              <button
                                type="button"
                                onClick={() => handleOpenPaymentModal(contract)}
                                className="px-2.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs inline-flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                                title="Registrar nuevo cobro o abono con comprobante"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                                <span>Registrar Cobro</span>
                              </button>
                            )}

                            {/* Botón Factura Global PDF */}
                            {contract.invoice?.file ? (
                              <button
                                type="button"
                                onClick={() => onOpenViewer ? onOpenViewer(contract.invoice!.file!, `Factura Global: ${contract.invoice?.invoiceNumber}`) : window.open(contract.invoice!.file!.dataUrl)}
                                className="px-2 py-1.5 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                                title={`Ver Factura Global en PDF (${contract.invoice.invoiceNumber})`}
                              >
                                <FileText className="w-3.5 h-3.5 text-sky-600" />
                                <span className="hidden sm:inline">Factura PDF</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenInvoiceModal(contract)}
                                className="px-2 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-sky-50 hover:text-sky-700 border border-slate-200 hover:border-sky-300 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                                title="Subir Factura Global de esta obra en PDF"
                              >
                                <Upload className="w-3.5 h-3.5 text-slate-400" />
                                <span className="hidden sm:inline">+ Factura PDF</span>
                              </button>
                            )}

                            {/* Desplegar cuotas */}
                            <button
                              type="button"
                              onClick={() => toggleExpand(contract.id)}
                              className="px-2 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                              title={isExpanded ? 'Ocultar desglose de cuotas' : 'Ver desglose de cuotas'}
                            >
                              <span>{isExpanded ? 'Ocultar' : 'Ver Cuotas'}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            {/* Ficha Completa */}
                            <button
                              type="button"
                              onClick={() => onSelectContract(contract)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Abrir ficha completa de la obra"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* FILA EXPANDIBLE: DESGLOSE DETALLADO DE CUOTAS Y PAGOS */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70 border-b-2 border-slate-200">
                          <td colSpan={7} className="p-4 sm:p-5">
                            <div className="space-y-4 max-w-5xl mx-auto">
                              {/* Encabezado del Desglose */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                                <div>
                                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                                    <Receipt className="w-4 h-4 text-indigo-600" />
                                    <span>Desglose de Cuotas Pactadas ({contract.contractNumber} - {contract.clientName})</span>
                                  </h4>
                                  <p className="text-[11px] text-slate-500 mt-0.5">
                                    Nota contable: Cada cuota se marca como cobrada únicamente cuando se registra su respectivo pago/abono con comprobante.
                                  </p>
                                </div>

                                {analysis.pendingAmount > 0 && onUpdateContract && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPaymentModal(contract)}
                                    className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg inline-flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Registrar Cobro para esta Obra</span>
                                  </button>
                                )}
                              </div>

                              {/* Subtabla de Cuotas del Contrato */}
                              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                                <div className="px-3.5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-800">Cronograma de Cuotas</span>
                                  <span className="text-[11px] text-slate-500 font-mono font-semibold">
                                    {analysis.paidMilestonesCount} de {analysis.totalMilestonesCount} cuotas cobradas
                                  </span>
                                </div>

                                {analysis.milestones.length === 0 ? (
                                  <div className="p-4 text-center text-xs text-slate-400">
                                    Este contrato no tiene un cronograma de cuotas registrado. Puedes registrar un cobro directo con el botón superior.
                                  </div>
                                ) : (
                                  <div className="divide-y divide-slate-100">
                                    {analysis.milestones.map(({ item, isPaid, dueDate, daysDiff, isOverdue }) => (
                                      <div 
                                        key={item.id} 
                                        className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                          isPaid ? 'bg-emerald-50/20' : isOverdue ? 'bg-red-50/20' : 'hover:bg-slate-50/50'
                                        }`}
                                      >
                                        <div className="flex items-start gap-2.5">
                                          <div className="mt-0.5">
                                            {isPaid ? (
                                              <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                                              </div>
                                            ) : isOverdue ? (
                                              <div className="w-6 h-6 rounded-md bg-red-100 text-red-700 flex items-center justify-center">
                                                <AlertTriangle className="w-4 h-4" />
                                              </div>
                                            ) : (
                                              <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center">
                                                <Clock className="w-4 h-4" />
                                              </div>
                                            )}
                                          </div>

                                          <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className="font-bold text-slate-900 text-xs">{item.title}</span>
                                              {isPaid ? (
                                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 inline-flex items-center gap-1">
                                                  <Check className="w-3 h-3 stroke-[2.5]" />
                                                  Cobrada ✓
                                                </span>
                                              ) : isOverdue ? (
                                                <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                                                  Vencida hace {Math.abs(daysDiff)} {Math.abs(daysDiff) === 1 ? 'día' : 'días'}
                                                </span>
                                              ) : (
                                                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                                                  Falta cobrar (en {daysDiff} días)
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-[11px] text-slate-500 mt-0.5">
                                              Fecha pactada de vencimiento: <strong className="text-slate-700">{formatDate(dueDate)}</strong>
                                              {item.notes && <span className="ml-2 italic text-slate-400">({item.notes})</span>}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                          <div className="text-right">
                                            <span className="text-[10px] text-slate-400 block uppercase font-medium">Monto Cuota</span>
                                            <span className={`font-mono font-black text-sm ${
                                              isPaid ? 'text-emerald-700' : isOverdue ? 'text-red-700' : 'text-slate-900'
                                            }`}>
                                              {formatCurrency(item.amount)}
                                            </span>
                                          </div>

                                          {!isPaid && onUpdateContract && (
                                            <button
                                              type="button"
                                              onClick={() => handleOpenPaymentModal(contract, item)}
                                              className="px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                                              title="Registrar cobro de esta cuota específica"
                                            >
                                              <DollarSign className="w-3.5 h-3.5" />
                                              <span>Registrar Cobro</span>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Subtabla de Pagos y Abonos Formalmente Registrados */}
                              {(contract.payments || []).length > 0 && (
                                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                                  <div className="px-3.5 py-2 bg-emerald-50/60 border-b border-emerald-100 flex items-center justify-between">
                                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                                      <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Abonos y Comprobantes Registrados ({contract.payments?.length})</span>
                                    </span>
                                    <span className="text-xs font-mono font-black text-emerald-800">
                                      Total abonado: {formatCurrency(analysis.totalPaid)}
                                    </span>
                                  </div>

                                  <div className="divide-y divide-slate-100">
                                    {contract.payments?.map((payment, pIdx) => (
                                      <div key={payment.id || pIdx} className="p-3 flex items-center justify-between gap-3 text-xs">
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center font-mono font-bold text-[10px]">
                                            #{pIdx + 1}
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span className="font-bold text-slate-900">{payment.reference || 'Abono'}</span>
                                              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                                                {payment.method}
                                              </span>
                                              {payment.invoiceNumber && (
                                                <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded font-mono font-bold border border-indigo-200">
                                                  Doc: {payment.invoiceNumber}
                                                </span>
                                              )}
                                            </div>
                                            <span className="text-[10px] text-slate-400">
                                              Fecha de abono: {formatDate(payment.date)}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          {payment.voucherFile && onOpenViewer && (
                                            <button
                                              type="button"
                                              onClick={() => onOpenViewer(payment.voucherFile!, `Váucher de Cobro - ${contract.contractNumber}`)}
                                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
                                              title="Ver váucher adjunto"
                                            >
                                              <Paperclip className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                          <span className="font-mono font-black text-emerald-700 text-xs sm:text-sm">
                                            {formatCurrency(payment.amount)}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* SECCIÓN DEDICADA: FACTURA GLOBAL DE LA OBRA (PDF) */}
                              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                                <div className="px-3.5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>Factura Global de Liquidación de la Obra (PDF)</span>
                                  </span>
                                  {contract.invoice && (
                                    <span className="text-[11px] font-mono font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                                      {contract.invoice.invoiceNumber}
                                    </span>
                                  )}
                                </div>

                                <div className="p-4">
                                  {contract.invoice ? (
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-sky-50/40 p-3.5 rounded-xl border border-sky-100">
                                      <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                                          <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-mono font-black text-slate-900 text-xs">
                                              Factura: {contract.invoice.invoiceNumber}
                                            </span>
                                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                              Emitida
                                            </span>
                                          </div>
                                          <p className="text-[11px] text-slate-500 mt-0.5">
                                            Fecha de emisión: <strong className="text-slate-700">{formatDate(contract.invoice.issueDate)}</strong>
                                            {contract.invoice.notes && <span className="ml-2 italic text-slate-400">({contract.invoice.notes})</span>}
                                          </p>
                                          {contract.invoice.file && (
                                            <p className="text-[11px] text-slate-600 font-medium mt-1 flex items-center gap-1">
                                              <Paperclip className="w-3 h-3 text-slate-400" />
                                              <span>Archivo PDF: {contract.invoice.file.name}</span>
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 self-end sm:self-auto">
                                        {contract.invoice.file && onOpenViewer && (
                                          <button
                                            type="button"
                                            onClick={() => onOpenViewer(contract.invoice!.file!, `Factura Global: ${contract.invoice?.invoiceNumber}`)}
                                            className="px-3 py-1.5 text-xs font-bold text-sky-700 bg-white hover:bg-sky-50 border border-sky-200 rounded-lg inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                                          >
                                            <FileText className="w-3.5 h-3.5" />
                                            <span>Ver PDF</span>
                                          </button>
                                        )}

                                        {onUpdateContract && (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() => handleOpenInvoiceModal(contract)}
                                              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg inline-flex items-center gap-1 cursor-pointer transition-colors"
                                              title="Modificar datos o reemplazar PDF de la factura"
                                            >
                                              <Upload className="w-3.5 h-3.5 text-slate-500" />
                                              <span>Cambiar PDF</span>
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => handleDeleteInvoice(contract)}
                                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                                              title="Desvincular factura global"
                                            >
                                              <X className="w-4 h-4" />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center py-4 px-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                                      <p className="text-xs font-bold text-slate-700">Sin Factura Global adjunta</p>
                                      <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
                                        Si emitiste una factura global de liquidación por el total o cierre de esta obra, puedes adjuntar el PDF oficial aquí.
                                      </p>
                                      {onUpdateContract && (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenInvoiceModal(contract)}
                                          className="mt-3 px-3 py-1.5 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                                        >
                                          <Upload className="w-3.5 h-3.5" />
                                          <span>Subir Factura Global en PDF</span>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
            {/* Pie de tabla con totales */}
            {sortedAnalyses.length > 0 && (
              <tfoot className="bg-slate-50 border-t-2 border-slate-200 text-xs font-bold text-slate-800">
                <tr>
                  <td className="py-3 px-4 uppercase tracking-wider text-slate-500">
                    Totales ({sortedAnalyses.length} {sortedAnalyses.length === 1 ? 'contrato' : 'contratos'}):
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                    {formatCurrency(sortedAnalyses.reduce((acc, a) => acc + a.totalContract, 0))}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-emerald-700 bg-emerald-50/40 border-x border-emerald-100">
                    {formatCurrency(sortedAnalyses.reduce((acc, a) => acc + a.paidAmount, 0))}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-amber-700 bg-amber-50/40 border-r border-amber-100">
                    {formatCurrency(sortedAnalyses.reduce((acc, a) => acc + a.pendingAmount, 0))}
                  </td>
                  <td colSpan={3} className="py-3 px-4 text-slate-400 text-right font-medium">
                    Total por cobrar en selección: {formatCurrency(sortedAnalyses.reduce((acc, a) => acc + a.pendingAmount, 0))}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* MODAL FORMAL DE REGISTRO DE COBRO / ABONO */}
      {isPaymentModalOpen && paymentTargetContract && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Registrar Cobro / Abono Formal
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Contrato: <span className="font-bold text-slate-700">{paymentTargetContract.contractNumber}</span> - {paymentTargetContract.clientName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4">
              {paymentTargetMilestone && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center justify-between">
                  <div>
                    <span className="font-bold block">Cobrando hito pactado:</span>
                    <span>{paymentTargetMilestone.title}</span>
                  </div>
                  <span className="font-mono font-black text-indigo-700 text-sm">
                    {formatCurrency(paymentTargetMilestone.amount)}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Monto a Cobrar (S/) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="ej. 5000.00"
                    className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha del Cobro *
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Medio de Pago *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  >
                    <option value="Transferencia Bancaria">Transferencia Bancaria (BCP/BBVA/Interbank)</option>
                    <option value="Yape">Yape</option>
                    <option value="Plin">Plin</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    N° Operación / Referencia *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="ej. Op. 482910 BCP o Abono 50%"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  N° Factura / Boleta Emitida <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="text"
                  value={paymentInvoiceNumber}
                  onChange={(e) => setPaymentInvoiceNumber(e.target.value)}
                  placeholder="ej. F001-000452 o B001-0021"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Váucher de Pago / Constancia <span className="text-slate-400 font-normal">(Foto o PDF)</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 border border-dashed border-slate-300 rounded-lg p-2.5 text-center cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleVoucherUpload}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                      <Upload className="w-4 h-4 text-emerald-600" />
                      <span>{paymentVoucherFile ? paymentVoucherFile.name : 'Subir váucher o captura de pago'}</span>
                    </div>
                  </label>
                  {paymentVoucherFile && (
                    <button
                      type="button"
                      onClick={() => setPaymentVoucherFile(undefined)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      title="Quitar archivo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observaciones / Notas <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="ej. Abonado por el titular en cuenta corriente"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmittingPayment ? 'Registrando...' : 'Confirmar y Registrar Cobro'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL PARA SUBIR FACTURA GLOBAL EN PDF */}
      {isInvoiceModalOpen && invoiceTargetContract && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Subir Factura Global de la Obra en PDF
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Contrato: <span className="font-bold text-slate-700">{invoiceTargetContract.contractNumber}</span> - {invoiceTargetContract.clientName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsInvoiceModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Monto Total de Obra:</span>
                  <strong className="font-mono text-slate-900 text-sm font-black">
                    {formatCurrency(invoiceTargetContract.totalAmount)}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    N° de Factura SUNAT *
                  </label>
                  <input
                    type="text"
                    required
                    value={invoiceNumberInput}
                    onChange={(e) => setInvoiceNumberInput(e.target.value)}
                    placeholder="ej. F001-000452 o E001-89"
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha de Emisión *
                  </label>
                  <input
                    type="date"
                    required
                    value={invoiceDateInput}
                    onChange={(e) => setInvoiceDateInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Documento PDF de la Factura *
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 border-2 border-dashed border-sky-300 rounded-xl p-3 text-center cursor-pointer hover:bg-sky-50/50 transition-colors bg-sky-50/20">
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={handleInvoicePdfUpload}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center gap-1 text-xs text-slate-600">
                      <Upload className="w-5 h-5 text-sky-600" />
                      <span className="font-bold text-sky-900">
                        {invoicePdfFile ? invoicePdfFile.name : 'Haz clic para seleccionar el PDF de la factura'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {invoicePdfFile ? `${(invoicePdfFile.size / 1024).toFixed(1)} KB` : 'Archivos admitidos: PDF, JPG, PNG'}
                      </span>
                    </div>
                  </label>
                  {invoicePdfFile && (
                    <button
                      type="button"
                      onClick={() => setInvoicePdfFile(undefined)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                      title="Quitar archivo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observaciones / Detracción / Retención <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="text"
                  value={invoiceNotesInput}
                  onChange={(e) => setInvoiceNotesInput(e.target.value)}
                  placeholder="ej. Sujeto a detracción SPOT 4% Banco de la Nación"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingInvoice}
                  className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isSavingInvoice ? 'Guardando...' : 'Guardar Factura Global'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
