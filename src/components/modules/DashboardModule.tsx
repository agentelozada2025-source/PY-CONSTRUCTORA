import React, { useMemo } from 'react';
import { Contract } from '../../types';
import { 
  formatCurrency, 
  formatDate, 
  calculateFinancials, 
  getGlobalPaymentAlerts,
  createScheduleItemWhatsAppReminderUrl
} from '../../utils/formatters';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  TrendingUp,
  CircleDollarSign,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Building2,
  Plus,
  FileDown,
  ChevronRight,
  Send,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { AppModule } from '../Navbar';

interface DashboardModuleProps {
  contracts: Contract[];
  onNavigateModule: (module: AppModule) => void;
  onSelectContract: (contract: Contract) => void;
  onNewContract: () => void;
  onOpenPdfModal: () => void;
  onLoadDemo: () => void;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  contracts,
  onNavigateModule,
  onSelectContract,
  onNewContract,
  onOpenPdfModal,
}) => {
  // Current month and calculations
  const now = new Date();
  const currentMonthNum = now.getMonth();
  const currentYear = now.getFullYear();
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
  const currentMonthName = monthNames[currentMonthNum];
  const currentMonthKey = `${currentYear}-${String(currentMonthNum + 1).padStart(2, '0')}`;
  
  const prevMonthDate = new Date(currentYear, currentMonthNum - 1, 1);
  const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

  // Key Financial Metrics
  const metrics = useMemo(() => {
    let totalContracted = 0;
    let totalCollected = 0;
    let totalExpenses = 0;
    let currentMonthIncome = 0;
    let currentMonthPaymentsCount = 0;
    let prevMonthIncome = 0;

    let inProgressCount = 0;
    let completedPendingCollectionCount = 0;
    let concludedPaidCount = 0;

    contracts.forEach((c) => {
      const fin = calculateFinancials(c);
      totalContracted += fin.totalAmount;
      totalCollected += fin.totalPaid;
      totalExpenses += fin.totalExpenses;

      if (c.status === 'EN_EJECUCION') inProgressCount++;
      else if (c.status === 'OBRA_TERMINADA') completedPendingCollectionCount++;
      else if (c.status === 'PAGADO_CONCLUIDO') concludedPaidCount++;

      (c.payments || []).forEach((p) => {
        if (p.date) {
          const key = p.date.slice(0, 7);
          const amt = Number(p.amount) || 0;
          if (key === currentMonthKey) {
            currentMonthIncome += amt;
            currentMonthPaymentsCount++;
          } else if (key === prevMonthKey) {
            prevMonthIncome += amt;
          }
        }
      });
    });

    const pendingReceivable = Math.max(0, totalContracted - totalCollected);
    const netProfit = totalCollected - totalExpenses;
    const profitMargin = totalCollected > 0 ? Math.round((netProfit / totalCollected) * 100) : 0;
    const activeWorksCount = inProgressCount + completedPendingCollectionCount;
    const collectionRate = totalContracted > 0 ? Math.round((totalCollected / totalContracted) * 100) : 0;

    return {
      totalContracted,
      totalCollected,
      totalExpenses,
      currentMonthIncome,
      currentMonthPaymentsCount,
      pendingReceivable,
      netProfit,
      profitMargin,
      activeWorksCount,
      inProgressCount,
      completedPendingCollectionCount,
      concludedPaidCount,
      collectionRate,
    };
  }, [contracts, currentMonthKey, prevMonthKey]);

  // Payment alerts (overdue & upcoming)
  const alerts = useMemo(() => getGlobalPaymentAlerts(contracts, 14), [contracts]);

  // Single clean monthly trend chart (Last 6 Months)
  const monthlyTrend = useMemo(() => {
    const monthlyMap: Record<string, { label: string; cobrado: number; gastos: number }> = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${y}-${m}`;
      monthlyMap[key] = {
        label: `${monthNames[d.getMonth()]} ${String(y).slice(-2)}`,
        cobrado: 0,
        gastos: 0,
      };
    }

    contracts.forEach((c) => {
      (c.payments || []).forEach((p) => {
        if (p.date) {
          const key = p.date.slice(0, 7);
          if (monthlyMap[key]) {
            monthlyMap[key].cobrado += Number(p.amount) || 0;
          }
        }
      });
      (c.expenses || []).forEach((e) => {
        if (e.date) {
          const key = e.date.slice(0, 7);
          if (monthlyMap[key]) {
            monthlyMap[key].gastos += Number(e.amount) || 0;
          }
        }
      });
    });

    return Object.keys(monthlyMap).sort().map((k) => monthlyMap[k]);
  }, [contracts]);

  // Active works for quick table display (Max 4 most relevant)
  const activeContracts = useMemo(() => {
    return contracts
      .filter((c) => c.status !== 'PAGADO_CONCLUIDO')
      .slice(0, 5);
  }, [contracts]);

  // Upcoming collections in the next 14 days
  const upcomingPayments = useMemo(() => {
    return alerts.allUpcomingEntries.slice(0, 3);
  }, [alerts]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-6xl mx-auto">
      {/* 1. Header with simple context and primary actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Resumen General de Operaciones
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Estado financiero y operativo de obras al día de hoy ({formatDate(now.toISOString().slice(0, 10))}).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenPdfModal}
            className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5 text-rose-600" />
            <span>Reporte PDF</span>
          </button>

          <button
            type="button"
            onClick={onNewContract}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo Contrato</span>
          </button>
        </div>
      </div>

      {/* 2. Critical Alert Banner (Only shown if overdue cuotas exist) */}
      {alerts.totalOverdueCount > 0 && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-red-950">
                {alerts.totalOverdueCount} {alerts.totalOverdueCount === 1 ? 'cuota vencida' : 'cuotas vencidas'} pendientes por cobrar ({formatCurrency(alerts.totalOverdueAmount)})
              </p>
              <p className="text-[11px] text-red-800 mt-0.5">
                La más urgente corresponde a {alerts.allOverdueEntries[0]?.contract.clientName} (vencida hace {Math.abs(alerts.allOverdueEntries[0]?.daysDiff || 0)} días).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {alerts.allOverdueEntries[0] && (
              <a
                href={createScheduleItemWhatsAppReminderUrl(alerts.allOverdueEntries[0].contract, alerts.allOverdueEntries[0].item)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg inline-flex items-center gap-1 transition-colors"
              >
                <Send className="w-3 h-3" />
                <span>Cobrar por WhatsApp</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => onNavigateModule('collections')}
              className="px-2.5 py-1 text-xs font-bold text-red-800 bg-white hover:bg-red-100 border border-red-300 rounded-lg transition-colors"
            >
              Ver Cobranzas
            </button>
          </div>
        </div>
      )}

      {/* 3. Four Core Metric Cards (Simple, Scannable, No Clutter) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Ingresos del Mes */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Ingresos de {currentMonthName}
            </span>
            <CircleDollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono tracking-tight">
            {formatCurrency(metrics.currentMonthIncome)}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span>{metrics.currentMonthPaymentsCount} abonos registrados</span>
            <span className="text-slate-700 font-mono font-medium">Total: {formatCurrency(metrics.totalCollected)}</span>
          </p>
        </div>

        {/* 2. Cobranzas Pendientes */}
        <div 
          onClick={() => onNavigateModule('collections')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Pendiente por Cobrar
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-700 font-mono tracking-tight">
            {formatCurrency(metrics.pendingReceivable)}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span>Avance de cobro: {metrics.collectionRate}%</span>
            <span className="text-amber-800 font-semibold inline-flex items-center gap-0.5">
              <span>Gestionar</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </p>
        </div>

        {/* 3. Ganancia Neta Real */}
        <div 
          onClick={() => onNavigateModule('finances')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Ganancia Neta Real
            </span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div className={`text-2xl font-extrabold font-mono tracking-tight ${
            metrics.netProfit >= 0 ? 'text-teal-900' : 'text-red-700'
          }`}>
            {formatCurrency(metrics.netProfit)}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span>Margen sobre cobrado</span>
            <span className="text-teal-800 font-bold font-mono">{metrics.profitMargin}%</span>
          </p>
        </div>

        {/* 4. Obras Activas */}
        <div 
          onClick={() => onNavigateModule('contracts')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700">
              Obras Activas
            </span>
            <Building2 className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
            {metrics.activeWorksCount} <span className="text-xs font-normal text-slate-500 font-sans">de {contracts.length} obras</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span>{metrics.inProgressCount} en curso · {metrics.completedPendingCollectionCount} concluidas</span>
            <span className="text-sky-800 font-semibold inline-flex items-center gap-0.5">
              <span>Ver lista</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </p>
        </div>
      </div>

      {/* 4. One Single, Clean Monthly Cash-Flow Trend */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Flujo Mensual: Recaudación vs Gastos de Obra
            </h3>
            <p className="text-xs text-slate-500">
              Ingresos reales cobrados frente a compras y costos operativos en los últimos 6 meses.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Cobrado</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-rose-700 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>Gastos</span>
            </span>
          </div>
        </div>

        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="cobradoSimple" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="gastosSimple" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `S/ ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip 
                formatter={(value: any, name: any) => [formatCurrency(value), name === 'cobrado' ? 'Ingresos Cobrados' : 'Gastos de Obra']}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px', color: '#fff' }}
              />
              <Area 
                type="monotone" 
                dataKey="cobrado" 
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#cobradoSimple)" 
              />
              <Area 
                type="monotone" 
                dataKey="gastos" 
                stroke="#f43f5e" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#gastosSimple)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Clean, Scannable Lists of Active Works & Upcoming Payments (No chart clutter) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Obras Activas Principales (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Obras Activas en Ejecución
              </h3>
              <p className="text-xs text-slate-500">
                Avance financiero y saldos de los contratos en curso
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateModule('contracts')}
              className="text-xs text-sky-700 hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Ver todos ({contracts.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {activeContracts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No hay contratos activos en este momento.
              </div>
            ) : (
              activeContracts.map((c) => {
                const fin = calculateFinancials(c);
                const percentPaid = fin.totalAmount > 0 
                  ? Math.min(100, Math.round((fin.totalPaid / fin.totalAmount) * 100)) 
                  : 0;

                return (
                  <div 
                    key={c.id} 
                    onClick={() => onSelectContract(c)}
                    className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          {c.contractNumber}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {c.clientName}
                        </h4>
                        {c.location && (
                          <span className="text-[11px] text-slate-400 hidden sm:inline truncate max-w-[150px]">
                            · {c.location}
                          </span>
                        )}
                      </div>

                      {/* Collection progress bar */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="w-28 sm:w-40 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${percentPaid}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          {percentPaid}% cobrado
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold font-mono text-slate-900 block">
                        {formatCurrency(fin.totalAmount)}
                      </span>
                      <span className="text-[11px] font-mono text-amber-700 font-medium">
                        Saldo: {formatCurrency(fin.pendingBalance)}
                      </span>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Próximos Vencimientos Inmediatos (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>Próximos Cobros (14 Días)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Cuotas pactadas a recaudar próximamente
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {upcomingPayments.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No hay cuotas programadas a vencer en los próximos 14 días.
                </div>
              ) : (
                upcomingPayments.map(({ contract, item, daysDiff }) => (
                  <div key={`${contract.id}-${item.id}`} className="p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 truncate max-w-[160px]">
                        {contract.clientName}
                      </span>
                      <span className="font-mono font-bold text-indigo-700">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{item.title}</span>
                      <span className="font-medium text-indigo-800 bg-indigo-50 px-1.5 py-0.2 rounded">
                        {daysDiff === 0 ? 'Vence hoy' : `En ${daysDiff} días (${formatDate(item.dueDate)})`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50/50">
            <button
              type="button"
              onClick={() => onNavigateModule('collections')}
              className="w-full py-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 text-center inline-flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Ir al Cronograma de Cobranzas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
