import React, { useState, useMemo } from 'react';
import { Contract } from '../types';
import { 
  generateFinancialReportPdf, 
  generateSingleContractDossierPdf, 
  downloadPdfDocument 
} from '../services/pdfService';
import { formatCurrency, calculateFinancials } from '../utils/formatters';
import { 
  X, 
  FileDown, 
  FileText, 
  CheckSquare, 
  Square, 
  Search, 
  Layers, 
  PieChart, 
  Receipt, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Building2,
  Sliders,
  Sparkles
} from 'lucide-react';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contracts: Contract[];
  initialContractId?: string;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  contracts,
  initialContractId,
}) => {
  if (!isOpen) return null;

  // Scope: 'all' = all contracts | 'selected' = checkboxes | 'single' = 1 specific contract dossier
  const [scope, setScope] = useState<'all' | 'selected' | 'single'>(
    initialContractId ? 'single' : 'all'
  );

  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (initialContractId) return [initialContractId];
    return contracts.map((c) => c.id);
  });

  const [singleId, setSingleId] = useState<string>(
    initialContractId || (contracts[0]?.id ?? '')
  );

  const [search, setSearch] = useState('');
  const [reportTitle, setReportTitle] = useState('ESTADO FINANCIERO Y RESUMEN DE CONTRATOS');

  // Options
  const [includeExecutiveSummary, setIncludeExecutiveSummary] = useState(true);
  const [includeContractsTable, setIncludeContractsTable] = useState(true);
  const [includeDetailedBreakdown, setIncludeDetailedBreakdown] = useState(
    scope === 'single'
  );
  const [includePaymentSchedule, setIncludePaymentSchedule] = useState(true);
  const [includePaymentHistory, setIncludePaymentHistory] = useState(true);
  const [includeExpenses, setIncludeExpenses] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Contracts to include based on scope
  const targetContracts = useMemo(() => {
    if (scope === 'all') {
      return contracts;
    }
    if (scope === 'single') {
      const found = contracts.find((c) => c.id === singleId);
      return found ? [found] : [];
    }
    // 'selected'
    return contracts.filter((c) => selectedIds.includes(c.id));
  }, [contracts, scope, singleId, selectedIds]);

  // Financial preview of selected contracts
  const previewFinancials = useMemo(() => {
    let contracted = 0;
    let paid = 0;
    let expenses = 0;

    targetContracts.forEach((c) => {
      const fin = calculateFinancials(c);
      contracted += fin.totalAmount;
      paid += fin.totalPaid;
      expenses += fin.totalExpenses;
    });

    const netProfit = paid - expenses;
    const margin = paid > 0 ? (netProfit / paid) * 100 : 0;

    return { contracted, paid, balance: contracted - paid, expenses, netProfit, margin };
  }, [targetContracts]);

  // Filter for multi-select list
  const filteredList = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return contracts;
    return contracts.filter(
      (c) =>
        c.contractNumber.toLowerCase().includes(q) ||
        c.clientName.toLowerCase().includes(q) ||
        (c.docNumber && c.docNumber.toLowerCase().includes(q))
    );
  }, [contracts, search]);

  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(contracts.map((c) => c.id));
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  // Generation Handler
  const handleGeneratePdf = async () => {
    if (targetContracts.length === 0) {
      alert('Por favor selecciona al menos un contrato para generar el reporte.');
      return;
    }

    setIsGenerating(true);
    setSuccessMessage(null);

    try {
      if (scope === 'single' && targetContracts.length === 1) {
        const doc = await generateSingleContractDossierPdf(targetContracts[0]);
        const filename = `Dossier_Contrato_${targetContracts[0].contractNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
        downloadPdfDocument(doc, filename);
        setSuccessMessage(`Dossier de ${targetContracts[0].contractNumber} descargado con éxito.`);
      } else {
        const doc = await generateFinancialReportPdf({
          contracts: targetContracts,
          title: reportTitle.trim() || 'ESTADO FINANCIERO Y RESUMEN DE CONTRATOS',
          subtitle: `Reporte de ${targetContracts.length} contratos • Generado el ${new Date().toLocaleDateString('es-PE')}`,
          includeExecutiveSummary,
          includeContractsTable,
          includeDetailedBreakdown,
          includePaymentSchedule,
          includePaymentHistory,
          includeExpenses,
        });

        const safeTitle = reportTitle.trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
        const filename = `Reporte_Financiero_${safeTitle}_${new Date().toISOString().split('T')[0]}.pdf`;
        downloadPdfDocument(doc, filename);
        setSuccessMessage(`Reporte financiero generado con éxito (${targetContracts.length} contratos).`);
      }

      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Ocurrió un error al generar el documento PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                Generador de Reportes PDF
              </h2>
              <p className="text-xs text-slate-300">
                Resumen ejecutivo financiero, estado de contratos, cronogramas y egresos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Scope Selector Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              1. Alcance del Reporte
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setScope('all');
                  setReportTitle('ESTADO FINANCIERO Y RESUMEN DE CONTRATOS');
                  setIncludeContractsTable(true);
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  scope === 'all'
                    ? 'border-sky-600 bg-sky-50/80 ring-2 ring-sky-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Todos los Contratos</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">
                    {contracts.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  Consolidado financiero global de la empresa con métricas de rentabilidad.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setScope('selected');
                  setReportTitle('REPORTE FINANCIERO DE CONTRATOS SELECCIONADOS');
                  setIncludeContractsTable(true);
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  scope === 'selected'
                    ? 'border-sky-600 bg-sky-50/80 ring-2 ring-sky-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Seleccionar Específicos</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                    {selectedIds.length} / {contracts.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  Elige qué contratos o clientes incluir en la tabla y resumen.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setScope('single');
                  setIncludeDetailedBreakdown(true);
                  const curr = contracts.find((c) => c.id === singleId) || contracts[0];
                  if (curr) {
                    setReportTitle(`DOSSIER FINANCIERO: CONTRATO ${curr.contractNumber}`);
                  }
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  scope === 'single'
                    ? 'border-sky-600 bg-sky-50/80 ring-2 ring-sky-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Dossier de un Contrato</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                    Individual
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  Ficha exhaustiva de 1 obra con cronograma, váuchers y facturas.
                </p>
              </button>
            </div>
          </div>

          {/* Single Contract Dropdown if scope === 'single' */}
          {scope === 'single' && (
            <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-purple-900">
                Selecciona el contrato a exportar:
              </label>
              <select
                value={singleId}
                onChange={(e) => {
                  setSingleId(e.target.value);
                  const found = contracts.find((c) => c.id === e.target.value);
                  if (found) {
                    setReportTitle(`DOSSIER FINANCIERO: CONTRATO ${found.contractNumber}`);
                  }
                }}
                className="w-full text-xs font-semibold bg-white border border-purple-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.contractNumber} — {c.clientName} ({formatCurrency(c.totalAmount)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Multiple Contract Checkbox List if scope === 'selected' */}
          {scope === 'selected' && (
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filtrar por cliente, contrato o RUC..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-[11px] font-bold text-sky-700 hover:underline"
                  >
                    Seleccionar todos
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="text-[11px] font-bold text-slate-600 hover:underline"
                  >
                    Deseleccionar
                  </button>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
                {filteredList.map((c) => {
                  const isChecked = selectedIds.includes(c.id);
                  const fin = calculateFinancials(c);
                  return (
                    <div
                      key={c.id}
                      onClick={() => toggleSelectId(c.id)}
                      className={`pt-1.5 pb-1 flex items-center justify-between gap-2 cursor-pointer rounded-lg px-2 text-xs transition-colors ${
                        isChecked ? 'bg-sky-50/80 font-medium' : 'hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-sky-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <div className="truncate">
                          <span className="font-bold font-mono text-slate-900 mr-2">
                            {c.contractNumber}
                          </span>
                          <span className="text-slate-700 truncate">{c.clientName}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-slate-900">
                          {formatCurrency(c.totalAmount)}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Cobrado: {formatCurrency(fin.totalPaid)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Financial Summary of Target Contracts */}
          <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Vista Previa de Cifras a Incluir ({targetContracts.length} contratos)
              </span>
              <span className="text-xs font-mono font-bold text-sky-400">
                Margen: {previewFinancials.margin.toFixed(1)}%
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <span className="text-[10px] text-slate-400 block">Total Contratado</span>
                <span className="font-mono font-bold text-white text-sm">
                  {formatCurrency(previewFinancials.contracted)}
                </span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <span className="text-[10px] text-slate-400 block">Ingresos Cobrados</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {formatCurrency(previewFinancials.paid)}
                </span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <span className="text-[10px] text-slate-400 block">Gastos Ejecutados</span>
                <span className="font-mono font-bold text-orange-400 text-sm">
                  {formatCurrency(previewFinancials.expenses)}
                </span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <span className="text-[10px] text-slate-400 block">Ganancia Neta Real</span>
                <span className={`font-mono font-bold text-sm ${previewFinancials.netProfit >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                  {formatCurrency(previewFinancials.netProfit)}
                </span>
              </div>
            </div>
          </div>

          {/* Report Customization Options */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              2. Secciones a Incluir en el PDF
            </label>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Título del Encabezado
              </label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <label className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={includeExecutiveSummary}
                  onChange={(e) => setIncludeExecutiveSummary(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Resumen Ejecutivo y Métricas</span>
                  <span className="text-[11px] text-slate-500">Tarjetas de ingresos, cobranzas y márgenes</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={includeContractsTable}
                  onChange={(e) => setIncludeContractsTable(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Tabla Comparativa de Contratos</span>
                  <span className="text-[11px] text-slate-500">Filas con montos, saldos, gastos y utilidad</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs sm:col-span-2">
                <input
                  type="checkbox"
                  checked={includeDetailedBreakdown}
                  onChange={(e) => setIncludeDetailedBreakdown(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                />
                <div>
                  <span className="font-bold text-slate-800 block">
                    Desglose Completo por Contrato (Hitos, Cobros y Facturas)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Incluye tablas individuales de cronogramas, váuchers de abonos y comprobantes de compras
                  </span>
                </div>
              </label>
            </div>

            {includeDetailedBreakdown && (
              <div className="pl-6 border-l-2 border-indigo-200 space-y-2 pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includePaymentSchedule}
                    onChange={(e) => setIncludePaymentSchedule(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-700">Incluir Cronograma / Calendario de Pagos</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includePaymentHistory}
                    onChange={(e) => setIncludePaymentHistory(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-700">Incluir Historial de Abonos (Yape, Bancos, Váuchers)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeExpenses}
                    onChange={(e) => setIncludeExpenses(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-700">Incluir Gastos de Obra y Facturas de Proveedores</span>
                </label>
              </div>
            )}
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 sm:px-6 py-3.5 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            <span>Formato: A4 Profesional • Listo para Contabilidad y Clientes</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={isGenerating || targetContracts.length === 0}
              onClick={handleGeneratePdf}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 rounded-xl shadow-md transition-all inline-flex items-center gap-2 disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Generando PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Descargar Reporte PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
