import React, { useState } from 'react';
import { Contract, Expense, ExpenseCategory, PaymentMethod, FileAttachment } from '../types';
import { formatCurrency, formatDate, formatFileSize, formatExpenseCategory, calculateFinancials } from '../utils/formatters';
import { readFileAsBase64 } from '../utils/storage';
import { 
  Receipt, 
  Plus, 
  Trash2, 
  Eye, 
  Download, 
  FileText, 
  Upload, 
  Camera, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet,
  Building2,
  Calendar,
  CreditCard,
  Tag,
  AlertCircle
} from 'lucide-react';

interface ContractExpensesSectionProps {
  contract: Contract;
  onUpdateExpenses: (updatedExpenses: Expense[]) => void;
  onOpenViewer: (attachment: FileAttachment, title: string) => void;
}

export const ContractExpensesSection: React.FC<ContractExpensesSectionProps> = ({
  contract,
  onUpdateExpenses,
  onOpenViewer,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ExpenseCategory>('MATERIALES');
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transferencia Bancaria');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const financials = calculateFinancials(contract);
  const expenses = contract.expenses || [];

  // Category breakdown
  const categoryTotals: Record<ExpenseCategory, number> = {
    'MATERIALES': 0,
    'MANO_DE_OBRA': 0,
    'EQUIPOS_HERRAMIENTAS': 0,
    'TRANSPORTE_LOGISTICA': 0,
    'SUBCONTRATOS': 0,
    'OTROS': 0,
  };

  expenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + (Number(e.amount) || 0);
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      alert('Ingresa un monto de gasto válido mayor a 0');
      return;
    }

    if (!description.trim()) {
      alert('Ingresa la descripción del gasto realizado');
      return;
    }

    setIsSubmitting(true);
    try {
      let invoiceFileAttachment: FileAttachment | undefined = undefined;

      if (selectedFile) {
        const base64 = await readFileAsBase64(selectedFile);
        invoiceFileAttachment = {
          name: selectedFile.name,
          type: selectedFile.type,
          size: selectedFile.size,
          dataUrl: base64,
          uploadedAt: new Date().toISOString(),
        };
      }

      const newExpense: Expense = {
        id: 'exp-' + Date.now(),
        date,
        category,
        supplier: supplier.trim() || 'Varios / Directo',
        invoiceNumber: invoiceNumber.trim() || 'Sin Comprobante',
        description: description.trim(),
        amount: numAmount,
        paymentMethod,
        invoiceFile: invoiceFileAttachment,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      const updated = [newExpense, ...expenses];
      onUpdateExpenses(updated);

      // Reset form
      setDescription('');
      setAmount('');
      setSupplier('');
      setInvoiceNumber('');
      setNotes('');
      setSelectedFile(null);
      setShowForm(false);
    } catch (err) {
      console.error('Error al guardar gasto:', err);
      alert('Error al procesar el archivo o registrar el gasto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este registro de gasto? Se recalculará la utilidad del contrato.')) {
      const updated = expenses.filter(e => e.id !== id);
      onUpdateExpenses(updated);
    }
  };

  return (
    <div id="registro-gastos-section" className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Registro de Gastos y Facturas de Obra
            </h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
              {expenses.length} {expenses.length === 1 ? 'gasto' : 'gastos'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registra compras de materiales, planillas, alquileres y adjunta comprobantes o facturas electrónicas para calcular la ganancia real.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 shrink-0 shadow-xs ${
            showForm
              ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
              : 'bg-rose-600 hover:bg-rose-700 text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{showForm ? 'Cerrar Formulario' : 'Nuevo Gasto'}</span>
        </button>
      </div>

      {/* RENTABILIDAD & GANANCIA CARD (INGRESOS VS GASTOS) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Total Ingresos Cobrados */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
            Ingresos Reales Cobrados
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
            {formatCurrency(financials.totalPaid)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            {financials.paymentCount} abono(s) en banco o Yape
          </span>
        </div>

        {/* Total Gastos Ejecutados */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block mb-0.5">
            Gastos Totales de Obra
          </span>
          <span className="text-xl sm:text-2xl font-black text-rose-700 font-mono">
            {formatCurrency(financials.totalExpenses)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            {financials.expenseCount} gasto(s) y compras registradas
          </span>
        </div>

        {/* Utilidad / Ganancia Neta Realizada */}
        <div 
          className={`p-3.5 rounded-xl border shadow-2xs ${
            financials.netProfit >= 0
              ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300'
              : 'bg-gradient-to-br from-rose-50 to-red-50 border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
              {financials.netProfit >= 0 ? 'Utilidad Neta Realizada' : 'Déficit Temporal'}
            </span>
            <span 
              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                financials.netProfit >= 0
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}
            >
              {financials.profitMarginPercent}% margen
            </span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span 
              className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
                financials.netProfit >= 0 ? 'text-emerald-800' : 'text-rose-800'
              }`}
            >
              {formatCurrency(financials.netProfit)}
            </span>
          </div>

          <div className="text-[11px] text-slate-600 mt-1 flex items-center justify-between">
            <span>Ganancia proyectada final:</span>
            <strong className="font-mono text-slate-800 font-bold">
              {formatCurrency(financials.projectedProfit)}
            </strong>
          </div>
        </div>
      </div>

      {/* CATEGORY PILLS BAR */}
      {expenses.length > 0 && (
        <div className="flex items-center flex-wrap gap-2 pt-1 text-xs">
          <span className="text-slate-500 font-semibold text-[11px] mr-1">Desglose por rubro:</span>
          {(['MATERIALES', 'MANO_DE_OBRA', 'EQUIPOS_HERRAMIENTAS', 'TRANSPORTE_LOGISTICA', 'SUBCONTRATOS', 'OTROS'] as ExpenseCategory[]).map(cat => {
            const total = categoryTotals[cat];
            if (total === 0) return null;
            const meta = formatExpenseCategory(cat);
            return (
              <span 
                key={cat}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${meta.color}`}
              >
                <span>{meta.label}:</span>
                <strong className="font-mono">{formatCurrency(total)}</strong>
              </span>
            );
          })}
        </div>
      )}

      {/* FORMULARIO AGREGAR GASTO */}
      {showForm && (
        <form onSubmit={handleAddExpense} className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-rose-600" />
              <span>Registrar Nuevo Comprobante de Gasto</span>
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">* Campos obligatorios</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Fecha */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Fecha del Gasto *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Rubro / Categoría *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                <option value="MATERIALES">Materiales & Insumos</option>
                <option value="MANO_DE_OBRA">Mano de Obra & Planillas</option>
                <option value="EQUIPOS_HERRAMIENTAS">Equipos & Maquinaria</option>
                <option value="TRANSPORTE_LOGISTICA">Transporte, Fletes & Combustible</option>
                <option value="SUBCONTRATOS">Subcontratos Externos</option>
                <option value="OTROS">Otros Gastos de Obra</option>
              </select>
            </div>

            {/* Monto */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Monto Gastado (S/) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.10"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-mono font-bold text-rose-700 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            {/* Medio de Pago */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Medio de Pago *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                <option value="Yape">Yape</option>
                <option value="Plin">Plin</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Cheque">Cheque</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            {/* Proveedor */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Proveedor / Empresa
              </label>
              <input
                type="text"
                placeholder="ej. Ferretería El Maestro S.A.C."
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            {/* N° Comprobante */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                N° Factura / Boleta / Recibo
              </label>
              <input
                type="text"
                placeholder="ej. F001-008920 o B002-140"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            {/* Descripción */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Concepto / Descripción del Gasto *
              </label>
              <input
                type="text"
                required
                placeholder="ej. Compra de 40 bolsas de cemento Sol y aditivo impermeabilizante"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            {/* Adjuntar Factura / Boleta */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Adjuntar Factura de Gasto (PDF o Foto del comprobante)
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 cursor-pointer"
              />
              {selectedFile && (
                <p className="text-[11px] text-emerald-700 mt-1 font-medium">
                  ✓ Archivo seleccionado: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>

            {/* Notas opcionales */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Notas / Referencia interna
              </label>
              <input
                type="text"
                placeholder="ej. Entregado al maestro Juan"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Guardando...' : 'Guardar Gasto & Comprobante'}</span>
            </button>
          </div>
        </form>
      )}

      {/* LISTA / TABLA DE GASTOS REGISTRADOS */}
      {expenses.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Rubro</th>
                <th className="py-2.5 px-3">Concepto & Proveedor</th>
                <th className="py-2.5 px-3">N° Factura / Doc</th>
                <th className="py-2.5 px-3">Medio Pago</th>
                <th className="py-2.5 px-3 text-right">Monto (S/)</th>
                <th className="py-2.5 px-3 text-center">Factura Adjunta</th>
                <th className="py-2.5 px-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {expenses.map((expense) => {
                const catMeta = formatExpenseCategory(expense.category);

                return (
                  <tr key={expense.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-medium">
                      {formatDate(expense.date)}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border ${catMeta.color}`}>
                        {catMeta.label}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900 leading-tight">
                        {expense.description}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{expense.supplier}</span>
                        {expense.notes && (
                          <span className="text-slate-400 italic">• {expense.notes}</span>
                        )}
                      </p>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-slate-700">
                      {expense.invoiceNumber || '-'}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-medium border border-slate-200">
                        {expense.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap text-right font-mono font-bold text-rose-700 text-sm">
                      {formatCurrency(expense.amount)}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap text-center">
                      {expense.invoiceFile ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenViewer(expense.invoiceFile!, `Factura/Comprobante: ${expense.invoiceNumber} - ${expense.supplier}`)}
                            className="px-2 py-1 text-[11px] font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg inline-flex items-center gap-1 shadow-2xs transition-colors"
                            title="Ver comprobante adjunto"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Ver Doc</span>
                          </button>

                          <a
                            href={expense.invoiceFile.dataUrl}
                            download={expense.invoiceFile.name}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                            title="Descargar archivo"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Sin adjunto
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                        title="Eliminar gasto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900 text-xs">
              <tr>
                <td colSpan={5} className="py-3 px-3 text-right uppercase text-[11px]">
                  Total Gastos de Obra:
                </td>
                <td className="py-3 px-3 text-right font-mono text-rose-700 text-sm">
                  {formatCurrency(financials.totalExpenses)}
                </td>
                <td colSpan={2} className="py-3 px-3 text-right text-[11px] text-slate-500">
                  Rentabilidad: {financials.profitMarginPercent}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 p-6">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center mb-2.5">
            <Receipt className="w-6 h-6" />
          </div>
          <h4 className="text-xs font-bold text-slate-800">
            Aún no se han registrado gastos para este contrato
          </h4>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Registra los costos de materiales, planillas de mano de obra y facturas de proveedores para calcular la ganancia neta exacta de esta obra.
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs inline-flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Primer Gasto</span>
          </button>
        </div>
      )}
    </div>
  );
};
