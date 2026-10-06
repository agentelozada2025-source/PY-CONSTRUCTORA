import React, { useState } from 'react';
import { Contract, PaymentScheduleItem } from '../types';
import { 
  formatCurrency, 
  formatDate 
} from '../utils/formatters';
import { 
  Calendar, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Trash2, 
  Send, 
  Sparkles, 
  Check, 
  AlertCircle,
  Flag,
  DollarSign,
  Layers,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Mail
} from 'lucide-react';

interface PaymentScheduleSectionProps {
  contract: Contract;
  onUpdateSchedule: (updatedSchedule: PaymentScheduleItem[]) => void;
  onSelectMilestoneForPayment?: (item: PaymentScheduleItem) => void;
  onSendEmailReminder?: (item: PaymentScheduleItem) => void;
}

export const PaymentScheduleSection: React.FC<PaymentScheduleSectionProps> = ({
  contract,
  onUpdateSchedule,
  onSelectMilestoneForPayment,
  onSendEmailReminder,
}) => {
  const schedule = contract.paymentSchedule || [];

  // Form state
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Calculations
  const totalScheduled = schedule.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const totalContract = Number(contract.totalAmount) || 0;
  const unscheduledBalance = Math.max(0, totalContract - totalScheduled);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Timing helper
  const getItemTiming = (item: PaymentScheduleItem) => {
    if (item.isPaid) {
      return { 
        status: 'PAGADO', 
        label: 'Pagado', 
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' 
      };
    }
    const due = new Date(item.dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: 'VENCIDO',
        label: `Vencido hace ${Math.abs(diffDays)} d`,
        badgeClass: 'bg-red-100 text-red-800 border-red-300 font-extrabold',
      };
    } else if (diffDays === 0) {
      return {
        status: 'HOY',
        label: '¡Vence hoy!',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold',
      };
    } else if (diffDays <= 7) {
      return {
        status: 'PROXIMO',
        label: `Vence en ${diffDays} días`,
        badgeClass: 'bg-sky-100 text-sky-800 border-sky-300 font-bold',
      };
    } else {
      return {
        status: 'FUTURO',
        label: `En ${diffDays} días`,
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 font-semibold',
      };
    }
  };

  // Pre-fill suggested amount when opening form
  const handleOpenForm = () => {
    if (!isFormOpen) {
      if (unscheduledBalance > 0 && !amount) {
        setAmount(unscheduledBalance.toFixed(2));
      }
      if (!dueDate) {
        // Default to estimated end date or 15 days ahead
        setDueDate(contract.estimatedEndDate || new Date().toISOString().split('T')[0]);
      }
      if (!title) {
        setTitle(`Hito ${schedule.length + 1}: `);
      }
    }
    setIsFormOpen(!isFormOpen);
  };

  // Add Item
  const handleAddScheduleItem = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Ingresa un monto esperado válido mayor a 0');
      return;
    }
    if (!dueDate) {
      alert('Selecciona la fecha del hito de pago');
      return;
    }

    const newItem: PaymentScheduleItem = {
      id: `sch-${Date.now()}`,
      title: title.trim() || `Hito de Pago ${schedule.length + 1}`,
      dueDate,
      amount: numAmount,
      isPaid: false,
      notes: notes.trim(),
    };

    const updated = [...schedule, newItem].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

    onUpdateSchedule(updated);

    // Reset form
    setTitle('');
    setDueDate('');
    setAmount('');
    setNotes('');
    setIsFormOpen(false);
  };

  // Toggle paid status
  const handleTogglePaid = (itemId: string) => {
    const updated = schedule.map((item) => {
      if (item.id === itemId) {
        return { ...item, isPaid: !item.isPaid };
      }
      return item;
    });
    onUpdateSchedule(updated);
  };

  // Delete item
  const handleDeleteItem = (itemId: string) => {
    if (window.confirm('¿Eliminar este hito de pago del calendario?')) {
      const updated = schedule.filter((item) => item.id !== itemId);
      onUpdateSchedule(updated);
    }
  };

  // Quick Split Templates
  const handleAutoGenerate = (parts: number, percentages: number[]) => {
    if (schedule.length > 0 && !window.confirm('¿Reemplazar los hitos actuales por la plantilla seleccionada?')) {
      return;
    }

    const start = new Date(contract.startDate || new Date());
    const end = new Date(contract.estimatedEndDate || new Date());
    const duration = Math.max(1, end.getTime() - start.getTime());
    const stepTime = duration / (parts > 1 ? parts - 1 : 1);

    const generated: PaymentScheduleItem[] = [];

    percentages.forEach((pct, idx) => {
      const itemDate = new Date(start.getTime() + stepTime * idx);
      const isFirst = idx === 0;
      const isLast = idx === parts - 1;

      let defaultTitle = `Hito ${idx + 1}: Avance de obra (${pct}%)`;
      if (isFirst) defaultTitle = `Hito 1: Anticipo inicial a la firma (${pct}%)`;
      else if (isLast) defaultTitle = `Hito ${parts}: Cancelación y entrega final (${pct}%)`;

      const itemAmount = Math.round(((totalContract * pct) / 100) * 100) / 100;

      generated.push({
        id: `sch-gen-${Date.now()}-${idx}`,
        title: defaultTitle,
        dueDate: itemDate.toISOString().split('T')[0],
        amount: itemAmount,
        isPaid: false,
      });
    });

    onUpdateSchedule(generated);
    setShowTemplates(false);
  };

  const scheduleProgressPercent = totalContract > 0 
    ? Math.min(100, Math.round((totalScheduled / totalContract) * 100))
    : 0;

  return (
    <div id="calendario-pagos-section" className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Calendario de Pagos
            </h4>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Hitos & Fechas Futuras
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Define las fechas de hitos y montos esperados para futuros pagos del cliente
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg inline-flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Plantillas Rápidas</span>
            {showTemplates ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            type="button"
            onClick={handleOpenForm}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg inline-flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Definir Hito de Pago</span>
          </button>
        </div>
      </div>

      {/* Quick Templates Drawer */}
      {showTemplates && (
        <div className="bg-gradient-to-r from-indigo-50/80 to-sky-50/80 border border-indigo-200 rounded-xl p-3.5 text-xs space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold text-indigo-950 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              Generador Automático de Hitos de Pago:
            </span>
            <span className="text-[11px] text-indigo-700">Calcula fechas entre inicio y entrega</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <button
              onClick={() => handleAutoGenerate(2, [50, 50])}
              className="p-2 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg text-left transition-colors shadow-2xs group"
            >
              <span className="font-bold text-slate-800 group-hover:text-indigo-700 block">
                2 Hitos (50% / 50%)
              </span>
              <span className="text-[10px] text-slate-500">Anticipo al inicio y 50% al entregar</span>
            </button>

            <button
              onClick={() => handleAutoGenerate(3, [30, 40, 30])}
              className="p-2 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg text-left transition-colors shadow-2xs group"
            >
              <span className="font-bold text-slate-800 group-hover:text-indigo-700 block">
                3 Hitos (30% / 40% / 30%)
              </span>
              <span className="text-[10px] text-slate-500">30% anticipo, 40% avance, 30% liquidación</span>
            </button>

            <button
              onClick={() => handleAutoGenerate(4, [25, 25, 25, 25])}
              className="p-2 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg text-left transition-colors shadow-2xs group"
            >
              <span className="font-bold text-slate-800 group-hover:text-indigo-700 block">
                4 Hitos (25% cada uno)
              </span>
              <span className="text-[10px] text-slate-500">Cuotas periódicas de avance uniforme</span>
            </button>
          </div>
        </div>
      )}

      {/* Summary KPI Bar for Schedule */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Monto Total Esperado
          </span>
          <span className="font-mono font-extrabold text-slate-900 text-base">
            {formatCurrency(totalScheduled)}
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 rounded-full" 
                style={{ width: `${scheduleProgressPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-indigo-700 font-mono">
              {scheduleProgressPercent}%
            </span>
          </div>
        </div>

        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Asignación del Contrato
          </span>
          {Math.abs(unscheduledBalance) < 0.05 ? (
            <span className="text-emerald-700 font-bold inline-flex items-center gap-1.5 mt-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              100% Asignado en hitos
            </span>
          ) : unscheduledBalance > 0 ? (
            <span className="text-amber-700 font-bold inline-flex items-center gap-1.5 mt-1">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              Resta asignar {formatCurrency(unscheduledBalance)}
            </span>
          ) : (
            <span className="text-purple-700 font-bold inline-flex items-center gap-1.5 mt-1">
              Excede contrato por {formatCurrency(Math.abs(unscheduledBalance))}
            </span>
          )}
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Monto de contrato: {formatCurrency(totalContract)}
          </span>
        </div>

        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Hitos Programados
          </span>
          <div className="flex items-center gap-2 mt-1 font-bold text-xs">
            <span className="text-slate-900 font-mono text-sm">{schedule.length}</span>
            <span className="text-slate-400">hitos</span>
            <span>•</span>
            <span className="text-emerald-700">{schedule.filter((s) => s.isPaid).length} pagados</span>
            <span>•</span>
            <span className="text-amber-700">{schedule.filter((s) => !s.isPaid).length} pendientes</span>
          </div>
        </div>
      </div>

      {/* Form: Definir Nuevo Hito de Pago */}
      {isFormOpen && (
        <form
          onSubmit={handleAddScheduleItem}
          className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-200 space-y-3 animate-in fade-in"
        >
          <div className="flex items-center justify-between pb-2 border-b border-indigo-200/70">
            <h5 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
              <Flag className="w-4 h-4 text-indigo-600" />
              Definir Nuevo Hito de Pago Futuro
            </h5>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Milestone Title */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nombre / Concepto del Hito *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ej. Hito 2: Instalación de redes hidroneumáticas"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Fecha del Hito / Pago Pactado *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            {/* Expected Amount */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Monto Esperado (S/) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs font-bold">
                  S/
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.50"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Condición de Cobro / Entregables del Hito (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ej. Aprobación del supervisor de obra y reporte de pruebas de presión"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
            >
              Guardar Hito de Pago
            </button>
          </div>
        </form>
      )}

      {/* Visual Timeline & Milestone List */}
      <div className="space-y-2.5">
        {schedule.length > 0 ? (
          schedule.map((item, index) => {
            const timing = getItemTiming(item);

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  item.isPaid
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : timing.status === 'VENCIDO'
                    ? 'bg-red-50/50 border-red-300 shadow-2xs'
                    : timing.status === 'HOY'
                    ? 'bg-amber-50/60 border-amber-300 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Left side: Milestone Indicator, Checkbox & Info */}
                <div className="flex items-start sm:items-center gap-3">
                  <button
                    onClick={() => handleTogglePaid(item.id)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors border ${
                      item.isPaid
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'border-slate-300 hover:border-indigo-500 bg-white'
                    }`}
                    title={item.isPaid ? 'Hito pagado (clic para desmarcar)' : 'Marcar hito como pagado'}
                  >
                    {item.isPaid ? <Check className="w-4 h-4 stroke-[3]" /> : <span className="text-[10px] font-bold text-slate-400">{index + 1}</span>}
                  </button>

                  <div>
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-bold text-xs text-slate-900">
                        {item.title}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${timing.badgeClass}`}>
                        {timing.label}
                      </span>
                    </div>

                    <div className="flex items-center flex-wrap gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Fecha de pago: {formatDate(item.dueDate)}
                      </span>
                      {item.notes && (
                        <>
                          <span>•</span>
                          <span className="italic truncate max-w-xs text-slate-600">
                            {item.notes}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Expected Amount & Action Buttons */}
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Monto Esperado
                    </span>
                    <span
                      className={`text-sm font-extrabold font-mono ${
                        item.isPaid ? 'text-emerald-700 line-through opacity-75' : 'text-slate-900'
                      }`}
                    >
                      {formatCurrency(item.amount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Quick Register Payment for this milestone */}
                    {!item.isPaid && onSelectMilestoneForPayment && (
                      <button
                        type="button"
                        onClick={() => onSelectMilestoneForPayment(item)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors shadow-2xs"
                        title="Registrar abono para este hito pactado"
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>Cobrar</span>
                      </button>
                    )}

                    {/* Email Reminder Button */}
                    {!item.isPaid && onSendEmailReminder && (
                      <button
                        type="button"
                        onClick={() => onSendEmailReminder(item)}
                        className={`px-2 py-1 border rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors ${
                          item.lastReminderSentAt
                            ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200'
                            : 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-200'
                        }`}
                        title={
                          item.lastReminderSentAt
                            ? `Último email enviado: ${new Date(item.lastReminderSentAt).toLocaleDateString('es-PE')}. Clic para enviar otro recordatorio.`
                            : 'Enviar recordatorio por correo electrónico (EmailJS)'
                        }
                      >
                        <Mail className="w-3 h-3 text-indigo-600" />
                        <span className="hidden md:inline">
                          {item.lastReminderSentAt ? 'Email Enviado' : 'Email'}
                        </span>
                      </button>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                      title="Eliminar hito del cronograma"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 p-4">
            <Calendar className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800">
              No hay hitos de pago definidos en el calendario
            </p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5">
              Define las fechas en las que el cliente debe realizar pagos futuros o utiliza una plantilla rápida para generar los porcentajes automáticamente.
            </p>
            <div className="mt-3.5 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowTemplates(true)}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg inline-flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Usar Plantilla</span>
              </button>
              <button
                type="button"
                onClick={handleOpenForm}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Definir Primer Hito</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
