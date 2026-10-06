import React, { useState, useMemo } from 'react';
import { Contract, FileAttachment, PaymentMethod } from '../types';
import { formatCurrency, formatDate, formatExpenseCategory } from '../utils/formatters';
import { 
  Receipt, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Eye, 
  Download, 
  ExternalLink, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  ArrowUpDown, 
  Building2, 
  Calendar, 
  Wallet, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  FolderOpen,
  DollarSign,
  Paperclip
} from 'lucide-react';

export type VoucherFlowType = 'VENTA' | 'GASTO';

export interface VoucherRecordItem {
  id: string;
  flowType: VoucherFlowType;
  subType: 'FACTURA_VENTA' | 'VOUCHER_COBRANZA' | 'FACTURA_GLOBAL' | 'COMPROBANTE_GASTO' | 'VOUCHER_GASTO';
  categoryLabel: string;
  voucherNumber: string;
  date: string;
  amount: number;
  entityName: string; // Cliente o Proveedor
  entityRole: 'Cliente' | 'Proveedor';
  contractId: string;
  contractNumber: string;
  contractClientName: string;
  paymentMethod?: string;
  description: string;
  attachment?: FileAttachment;
}

interface FinancialVouchersLedgerProps {
  contracts: Contract[];
  onSelectContract: (contract: Contract) => void;
  onOpenViewer?: (attachment: FileAttachment, title: string) => void;
}

export const FinancialVouchersLedger: React.FC<FinancialVouchersLedgerProps> = ({
  contracts,
  onSelectContract,
  onOpenViewer,
}) => {
  // Filters state
  const [filterType, setFilterType] = useState<'ALL' | 'VENTA' | 'GASTO'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContractFilter, setSelectedContractFilter] = useState<string>('ALL');
  const [attachmentFilter, setAttachmentFilter] = useState<'ALL' | 'WITH_ATTACHMENT' | 'WITHOUT_ATTACHMENT'>('ALL');
  const [monthFilter, setMonthFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Extract all voucher records across all contracts
  const allVoucherRecords = useMemo(() => {
    const list: VoucherRecordItem[] = [];

    contracts.forEach((c) => {
      // 1. Venta: Factura Final Global si existe
      if (c.invoice) {
        list.push({
          id: `final-inv-${c.id}`,
          flowType: 'VENTA',
          subType: 'FACTURA_GLOBAL',
          categoryLabel: 'Factura Final Global',
          voucherNumber: c.invoice.invoiceNumber || 'Factura Final',
          date: c.invoice.issueDate || c.startDate,
          amount: c.totalAmount,
          entityName: c.clientName,
          entityRole: 'Cliente',
          contractId: c.id,
          contractNumber: c.contractNumber,
          contractClientName: c.clientName,
          paymentMethod: 'Facturación Global',
          description: c.invoice.notes || `Factura de liquidación de obra - ${c.description}`,
          attachment: c.invoice.file,
        });
      }

      // 2. Venta: Pagos y Cobranzas
      (c.payments || []).forEach((p, idx) => {
        // A) Si tiene número de comprobante o comprobante de venta emitido
        if (p.invoiceNumber || p.invoiceFile) {
          list.push({
            id: `pay-inv-${p.id}`,
            flowType: 'VENTA',
            subType: 'FACTURA_VENTA',
            categoryLabel: 'Comprobante de Venta',
            voucherNumber: p.invoiceNumber || `Comprobante #${idx + 1}`,
            date: p.date,
            amount: Number(p.amount) || 0,
            entityName: c.clientName,
            entityRole: 'Cliente',
            contractId: c.id,
            contractNumber: c.contractNumber,
            contractClientName: c.clientName,
            paymentMethod: p.method,
            description: p.notes || `Comprobante de cobranza #${idx + 1} (${p.method})`,
            attachment: p.invoiceFile,
          });
        }

        // B) Si tiene voucher bancario / constancia de transferencia
        if (p.voucherFile || p.receiptFile || (!p.invoiceNumber && !p.invoiceFile)) {
          list.push({
            id: `pay-vouch-${p.id}`,
            flowType: 'VENTA',
            subType: 'VOUCHER_COBRANZA',
            categoryLabel: 'Voucher de Cobranza',
            voucherNumber: p.reference ? `Op. ${p.reference}` : `Abono #${idx + 1}`,
            date: p.date,
            amount: Number(p.amount) || 0,
            entityName: c.clientName,
            entityRole: 'Cliente',
            contractId: c.id,
            contractNumber: c.contractNumber,
            contractClientName: c.clientName,
            paymentMethod: p.method,
            description: p.notes || `Abono a cuenta con ${p.method}${p.reference ? ` (Ref: ${p.reference})` : ''}`,
            attachment: p.voucherFile || p.receiptFile,
          });
        }
      });

      // 3. Gastos y Compras
      (c.expenses || []).forEach((e, idx) => {
        const catMeta = formatExpenseCategory(e.category);

        // A) Comprobante / Factura / Boleta del Proveedor
        list.push({
          id: `exp-inv-${e.id}`,
          flowType: 'GASTO',
          subType: 'COMPROBANTE_GASTO',
          categoryLabel: catMeta.label || 'Gasto Operativo',
          voucherNumber: e.invoiceNumber || `Factura/Boleta Prov. #${idx + 1}`,
          date: e.date,
          amount: Number(e.amount) || 0,
          entityName: e.supplier || 'Proveedor de Obra',
          entityRole: 'Proveedor',
          contractId: c.id,
          contractNumber: c.contractNumber,
          contractClientName: c.clientName,
          paymentMethod: e.paymentMethod,
          description: e.description || `Compra de ${catMeta.label}`,
          attachment: e.invoiceFile || e.receiptFile,
        });

        // B) Si tiene voucher de pago por separado al proveedor
        if (e.voucherFile) {
          list.push({
            id: `exp-vouch-${e.id}`,
            flowType: 'GASTO',
            subType: 'VOUCHER_GASTO',
            categoryLabel: 'Voucher Pago Proveedor',
            voucherNumber: `Voucher Pago: ${e.supplier || 'Proveedor'}`,
            date: e.date,
            amount: Number(e.amount) || 0,
            entityName: e.supplier || 'Proveedor de Obra',
            entityRole: 'Proveedor',
            contractId: c.id,
            contractNumber: c.contractNumber,
            contractClientName: c.clientName,
            paymentMethod: e.paymentMethod,
            description: `Constancia de transferencia bancaria / pago por ${e.description}`,
            attachment: e.voucherFile,
          });
        }
      });
    });

    return list;
  }, [contracts]);

  // Unique months available for filtering
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    allVoucherRecords.forEach((item) => {
      if (item.date && item.date.length >= 7) {
        monthSet.add(item.date.slice(0, 7));
      }
    });
    return Array.from(monthSet).sort().reverse();
  }, [allVoucherRecords]);

  // Filter and sort records
  const filteredRecords = useMemo(() => {
    return allVoucherRecords.filter((item) => {
      // 1. Flow type filter
      if (filterType !== 'ALL' && item.flowType !== filterType) {
        return false;
      }

      // 2. Contract filter
      if (selectedContractFilter !== 'ALL' && item.contractId !== selectedContractFilter) {
        return false;
      }

      // 3. Attachment filter
      if (attachmentFilter === 'WITH_ATTACHMENT' && !item.attachment) {
        return false;
      }
      if (attachmentFilter === 'WITHOUT_ATTACHMENT' && item.attachment) {
        return false;
      }

      // 4. Month filter
      if (monthFilter !== 'ALL' && !item.date.startsWith(monthFilter)) {
        return false;
      }

      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNumber = item.voucherNumber.toLowerCase().includes(q);
        const matchEntity = item.entityName.toLowerCase().includes(q);
        const matchContract = item.contractNumber.toLowerCase().includes(q) || item.contractClientName.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchCat = item.categoryLabel.toLowerCase().includes(q);
        const matchMethod = (item.paymentMethod || '').toLowerCase().includes(q);

        if (!matchNumber && !matchEntity && !matchContract && !matchDesc && !matchCat && !matchMethod) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date-desc') {
        return b.date.localeCompare(a.date);
      }
      if (sortBy === 'date-asc') {
        return a.date.localeCompare(b.date);
      }
      if (sortBy === 'amount-desc') {
        return b.amount - a.amount;
      }
      if (sortBy === 'amount-asc') {
        return a.amount - b.amount;
      }
      return 0;
    });
  }, [allVoucherRecords, filterType, selectedContractFilter, attachmentFilter, monthFilter, searchQuery, sortBy]);

  // Aggregated totals of the filtered records
  const { totalSales, totalExpenses, countSales, countExpenses, countWithAttachment } = useMemo(() => {
    let sales = 0;
    let expenses = 0;
    let sCount = 0;
    let eCount = 0;
    let withAtt = 0;

    filteredRecords.forEach((item) => {
      if (item.flowType === 'VENTA') {
        sales += item.amount;
        sCount++;
      } else {
        expenses += item.amount;
        eCount++;
      }
      if (item.attachment) {
        withAtt++;
      }
    });

    return {
      totalSales: sales,
      totalExpenses: expenses,
      countSales: sCount,
      countExpenses: eCount,
      countWithAttachment: withAtt,
    };
  }, [filteredRecords]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Helper to copy text to clipboard
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to export filtered table to CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert('No hay registros en la vista actual para exportar.');
      return;
    }

    const headers = [
      'Tipo Flujo',
      'Categoria',
      'N° Comprobante / Referencia',
      'Fecha',
      'Cliente o Proveedor',
      'Rol',
      'N° Contrato',
      'Obra / Cliente Contrato',
      'Metodo de Pago',
      'Monto (S/)',
      'Tiene Respaldo Digital',
      'Enlace Google Drive',
      'Descripcion / Concepto'
    ];

    const rows = filteredRecords.map(item => [
      item.flowType,
      item.categoryLabel,
      `"${item.voucherNumber.replace(/"/g, '""')}"`,
      item.date,
      `"${item.entityName.replace(/"/g, '""')}"`,
      item.entityRole,
      `"${item.contractNumber}"`,
      `"${item.contractClientName.replace(/"/g, '""')}"`,
      `"${item.paymentMethod || 'N/A'}"`,
      item.amount.toFixed(2),
      item.attachment ? 'SI' : 'NO',
      item.attachment?.driveUrl ? `"${item.attachment.driveUrl}"` : '',
      `"${item.description.replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Registro_Comprobantes_Ventas_Gastos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper to trigger direct file download
  const handleDownloadAttachment = (file: FileAttachment, suggestedName?: string) => {
    try {
      const link = document.createElement('a');
      link.href = file.dataUrl;
      link.download = suggestedName || file.name || 'comprobante.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading attachment:', err);
    }
  };

  return (
    <div className="bg-[#101420] rounded-2xl border border-[#202738] shadow-lg overflow-hidden space-y-4">
      {/* 1. Header con Título y Botón Exportar */}
      <div className="p-4 sm:p-5 border-b border-[#202738] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center border border-amber-400/30 shrink-0 font-mono">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-tight font-mono">
                  Cuadro de Registro de Comprobantes de Ventas y Gastos
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#1A2131] text-amber-400 border border-amber-400/30">
                  {filteredRecords.length} {filteredRecords.length === 1 ? 'comprobante' : 'comprobantes'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Libro auxiliar consolidado de facturas, boletas de clientes, comprobantes de compras a proveedores y vouchers bancarios de todas las obras.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-bold text-slate-200 bg-[#161C2C] hover:bg-[#1E253A] border border-[#263148] rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Exportar listado a archivo Excel CSV con formato UTF-8"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exportar Cuadro a Excel</span>
          </button>
        </div>
      </div>

      {/* 2. Mini Barra de Resumen Contable / Totales de la Selección */}
      <div className="px-4 sm:px-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#0A0D14] border border-[#1E2638] rounded-xl p-3">
          {/* Total Ventas Comprobadas */}
          <div className="bg-[#121624] p-2.5 rounded-lg border border-[#202738] shadow-2xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Comprobantes de Ventas ({countSales})
            </span>
            <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
              {formatCurrency(totalSales)}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Facturas, boletas y cobranzas</span>
          </div>

          {/* Total Gastos Comprobados */}
          <div className="bg-[#121624] p-2.5 rounded-lg border border-[#202738] shadow-2xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 font-mono flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              Comprobantes de Gastos ({countExpenses})
            </span>
            <div className="text-base font-black text-rose-400 font-mono mt-0.5">
              {formatCurrency(totalExpenses)}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Compras, proveedores y cuadrillas</span>
          </div>

          {/* Balance Neto */}
          <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Flujo Neto Comprobado
            </span>
            <div className={`text-base font-black font-mono mt-0.5 ${
              totalSales - totalExpenses >= 0 ? 'text-emerald-700' : 'text-red-700'
            }`}>
              {formatCurrency(totalSales - totalExpenses)}
            </div>
            <span className="text-[10px] text-slate-400">Diferencia neta registrada</span>
          </div>

          {/* Respaldo Digital */}
          <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Con Respaldo Digital
            </span>
            <div className="text-base font-extrabold text-sky-900 font-mono mt-0.5">
              {countWithAttachment} <span className="text-xs font-normal text-slate-500">/ {filteredRecords.length}</span>
            </div>
            <span className="text-[10px] text-slate-400">Archivos PDF / Imágenes</span>
          </div>
        </div>
      </div>

      {/* 3. Filtros y Búsqueda */}
      <div className="px-4 sm:px-5 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Segment Toggle: Todos | Ventas | Gastos */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl shrink-0 self-start">
            <button
              type="button"
              onClick={() => { setFilterType('ALL'); setCurrentPage(1); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({allVoucherRecords.length})
            </button>
            <button
              type="button"
              onClick={() => { setFilterType('VENTA'); setCurrentPage(1); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                filterType === 'VENTA'
                  ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-emerald-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Ventas & Cobros</span>
            </button>
            <button
              type="button"
              onClick={() => { setFilterType('GASTO'); setCurrentPage(1); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                filterType === 'GASTO'
                  ? 'bg-white text-rose-800 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-rose-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Gastos & Compras</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Buscar por N° comprobante, cliente, proveedor, obra..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white placeholder-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Sub-filtros: Contrato, Mes, Respaldo, Orden */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          {/* Filtro Contrato */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Obra:</span>
            <select
              value={selectedContractFilter}
              onChange={(e) => { setSelectedContractFilter(e.target.value); setCurrentPage(1); }}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:ring-1 focus:ring-sky-500 font-medium"
            >
              <option value="ALL">Todas las obras ({contracts.length})</option>
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.contractNumber} - {c.clientName.substring(0, 24)}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Periodo / Mes */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Mes:</span>
            <select
              value={monthFilter}
              onChange={(e) => { setMonthFilter(e.target.value); setCurrentPage(1); }}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:ring-1 focus:ring-sky-500 font-medium"
            >
              <option value="ALL">Todos los periodos</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Adjunto */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Archivo:</span>
            <select
              value={attachmentFilter}
              onChange={(e) => { setAttachmentFilter(e.target.value as any); setCurrentPage(1); }}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:ring-1 focus:ring-sky-500 font-medium"
            >
              <option value="ALL">Todos</option>
              <option value="WITH_ATTACHMENT">Solo con archivo adjunto</option>
              <option value="WITHOUT_ATTACHMENT">Sin archivo adjunto</option>
            </select>
          </div>

          {/* Ordenar */}
          <div className="flex items-center gap-1.5 ml-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:ring-1 focus:ring-sky-500 font-medium"
            >
              <option value="date-desc">Fecha: Más reciente</option>
              <option value="date-asc">Fecha: Más antigua</option>
              <option value="amount-desc">Monto: Mayor a menor</option>
              <option value="amount-asc">Monto: Menor a mayor</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Comprobantes: Vista Móvil (Tarjetas Touch < md) y Cuadro Oficial (Desktop >= md) */}
      {/* 4A. Mobile Touch Cards (< md) */}
      <div className="md:hidden divide-y divide-[#1C2335] border-t border-[#202738]">
        {paginatedRecords.length === 0 ? (
          <div className="py-10 text-center text-slate-400 px-4">
            <Receipt className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-300 text-xs">No se encontraron comprobantes con los filtros seleccionados.</p>
            <p className="text-[10px] text-slate-500 mt-1">Ajusta los términos de búsqueda o el periodo.</p>
          </div>
        ) : (
          paginatedRecords.map((item) => {
            const isVenta = item.flowType === 'VENTA';
            return (
              <div key={item.id} className="p-3.5 hover:bg-[#151A28] transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isVenta ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        VENTA
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-950/80 text-rose-400 border border-rose-500/40">
                        <TrendingDown className="w-3 h-3 text-rose-400" />
                        GASTO
                      </span>
                    )}
                    <span className="text-[11px] font-bold text-slate-200">
                      {item.categoryLabel}
                    </span>
                  </div>
                  <div className={`font-mono font-black text-sm ${isVenta ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isVenta ? '+' : '-'} {formatCurrency(item.amount)}
                  </div>
                </div>

                <div className="bg-[#090C13] p-2.5 rounded-lg border border-[#1C2335] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-amber-400 flex items-center gap-1">
                      <span>N° {item.voucherNumber}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.voucherNumber, item.id)}
                        className="text-slate-400 hover:text-white p-0.5"
                        title="Copiar"
                      >
                        {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{formatDate(item.date)}</span>
                  </div>

                  <div className="text-[11px] text-slate-300">
                    <strong className="text-slate-400">Obra:</strong> {item.contractNumber}
                  </div>

                  <div className="text-[11px] text-slate-300 truncate">
                    <strong className="text-slate-400">{isVenta ? 'Cliente:' : 'Proveedor:'}</strong> {item.entityName}
                  </div>

                  {item.paymentMethod && (
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-[#1C2335]">
                      <span className="font-medium text-slate-300">{item.paymentMethod}</span>
                      <span className="truncate max-w-[160px] text-slate-400">{item.description}</span>
                    </div>
                  )}
                </div>

                {item.attachment && (
                  <div className="mt-2.5 flex items-center justify-between gap-2 pt-1 text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1 truncate text-[10px]">
                      <Paperclip className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate">{item.attachment.name}</span>
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {onOpenViewer && (
                        <button
                          type="button"
                          onClick={() => onOpenViewer(item.attachment!, `${item.categoryLabel} - ${item.voucherNumber} (${item.contractNumber})`)}
                          className="px-2 py-1 text-[11px] font-bold text-sky-300 bg-sky-950/60 border border-sky-600/40 rounded-md inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Ver</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDownloadAttachment(item.attachment!, `${item.contractNumber}_${item.voucherNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)}
                        className="p-1 text-slate-400 hover:text-white bg-[#1A2234] border border-[#273248] rounded-md cursor-pointer"
                        title="Descargar"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 4B. Tabla Oficial Desktop (>= md) */}
      <div className="hidden md:block overflow-x-auto border-t border-[#202738]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#090C13] text-slate-300 font-bold border-b border-[#202738] text-[10px] font-mono uppercase tracking-wider">
              <th className="py-3 px-3.5 whitespace-nowrap text-amber-400">Flujo / Tipo</th>
              <th className="py-3 px-3 whitespace-nowrap text-slate-200">Fecha</th>
              <th className="py-3 px-3.5 whitespace-nowrap text-slate-200">N° Comprobante / Ref</th>
              <th className="py-3 px-3.5 whitespace-nowrap text-slate-200">Cliente o Proveedor</th>
              <th className="py-3 px-3 whitespace-nowrap text-slate-200">Obra / Contrato</th>
              <th className="py-3 px-3.5 whitespace-nowrap text-slate-200">Concepto & Pago</th>
              <th className="py-3 px-3.5 text-right whitespace-nowrap text-amber-300">Monto (S/)</th>
              <th className="py-3 px-3.5 text-center whitespace-nowrap text-slate-200">Respaldo Digital</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1C2335]">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Receipt className="w-8 h-8 text-slate-300" />
                    <p className="font-semibold text-slate-600">No se encontraron comprobantes con los filtros seleccionados.</p>
                    <p className="text-[11px] text-slate-400">Prueba ajustando los términos de búsqueda o el periodo.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRecords.map((item) => {
                const isVenta = item.flowType === 'VENTA';
                return (
                  <tr 
                    key={item.id} 
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Flujo / Tipo */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {isVenta ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <TrendingUp className="w-3 h-3 text-emerald-600" />
                            VENTA
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                            <TrendingDown className="w-3 h-3 text-rose-600" />
                            GASTO
                          </span>
                        )}
                        <span className="text-[11px] font-medium text-slate-600">
                          {item.categoryLabel}
                        </span>
                      </div>
                    </td>

                    {/* Fecha */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-600 text-[11px]">
                      {formatDate(item.date)}
                    </td>

                    {/* N° Comprobante / Ref */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 text-[11px]">
                        <span>{item.voucherNumber}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.voucherNumber, item.id)}
                          className="text-slate-300 hover:text-slate-600 transition-colors p-0.5 rounded opacity-0 group-hover:opacity-100"
                          title="Copiar número"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Cliente o Proveedor */}
                    <td className="py-2.5 px-3.5 max-w-[200px] truncate" title={item.entityName}>
                      <div className="font-semibold text-slate-900 text-xs truncate">
                        {item.entityName}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {item.entityRole}
                      </span>
                    </td>

                    {/* Obra / Contrato */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          const c = contracts.find(x => x.id === item.contractId);
                          if (c) onSelectContract(c);
                        }}
                        className="font-mono text-[11px] font-bold text-sky-700 hover:text-sky-900 hover:underline flex items-center gap-1 cursor-pointer"
                        title="Ver detalle del contrato"
                      >
                        <Building2 className="w-3 h-3 text-sky-500 shrink-0" />
                        <span>{item.contractNumber}</span>
                      </button>
                    </td>

                    {/* Concepto & Metodo */}
                    <td className="py-2.5 px-3.5 max-w-[220px]">
                      <div className="text-[11px] text-slate-700 truncate" title={item.description}>
                        {item.description}
                      </div>
                      {item.paymentMethod && (
                        <span className="inline-block mt-0.5 text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                          {item.paymentMethod}
                        </span>
                      )}
                    </td>

                    {/* Monto (S/) */}
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                      <div className={`font-mono font-bold text-xs ${
                        isVenta ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {isVenta ? '+' : '-'} {formatCurrency(item.amount)}
                      </div>
                    </td>

                    {/* Respaldo Digital */}
                    <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                      {item.attachment ? (
                        <div className="inline-flex items-center gap-1 justify-center">
                          {/* Botón Ver en Modal */}
                          {onOpenViewer && (
                            <button
                              type="button"
                              onClick={() => onOpenViewer(item.attachment!, `${item.categoryLabel} - ${item.voucherNumber} (${item.contractNumber})`)}
                              className="p-1 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-md transition-colors cursor-pointer"
                              title="Visualizar documento en pantalla completa"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Enlace directo a Google Drive si ya está sincronizado */}
                          {item.attachment.driveUrl ? (
                            <a
                              href={item.attachment.driveUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition-colors"
                              title="Abrir directamente en Google Drive"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : null}

                          {/* Descargar archivo */}
                          <button
                            type="button"
                            onClick={() => handleDownloadAttachment(item.attachment!, `${item.contractNumber}_${item.voucherNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            title="Descargar comprobante"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">
                          Sin adjunto
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 5. Footer con Paginación */}
      <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          Mostrando{' '}
          <strong className="text-slate-900 font-mono">
            {filteredRecords.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
          </strong>{' '}
          a{' '}
          <strong className="text-slate-900 font-mono">
            {Math.min(currentPage * itemsPerPage, filteredRecords.length)}
          </strong>{' '}
          de <strong className="text-slate-900 font-mono">{filteredRecords.length}</strong> comprobantes
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="px-2.5 py-1 text-xs font-mono font-bold text-slate-700 bg-slate-50 rounded-lg border border-slate-200">
            {currentPage} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
