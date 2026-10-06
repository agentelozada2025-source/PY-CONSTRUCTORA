import React, { useState } from 'react';
import { Contract } from '../types';
import { 
  formatCurrency, 
  formatDate, 
  getGlobalPaymentAlerts 
} from '../utils/formatters';
import { 
  FileCheck2, 
  Wallet, 
  CircleDollarSign, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  Calendar,
  Send,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ExternalLink,
  CreditCard,
  ShieldAlert
} from 'lucide-react';

interface KPICardsProps {
  contracts: Contract[];
  onSelectContract?: (contract: Contract) => void;
  onFilterOverdue?: () => void;
  onFilterUpcoming?: () => void;
  onViewProfitSummary?: () => void;
}

export const KPICards: React.FC<KPICardsProps> = ({ 
  contracts, 
  onSelectContract,
  onFilterOverdue,
  onFilterUpcoming,
  onViewProfitSummary
}) => {
  const [showScheduleDrawer, setShowScheduleDrawer] = useState(false);

  const totalContracts = contracts.length;
  const activeContracts = contracts.filter(c => c.status !== 'PAGADO_CONCLUIDO').length;
  const completedContracts = contracts.filter(c => c.status === 'PAGADO_CONCLUIDO').length;

  const totalContractedAmount = contracts.reduce((acc, c) => acc + (Number(c.totalAmount) || 0), 0);

  let totalCollectedGlobal = 0;
  let totalExpensesGlobal = 0;
  contracts.forEach(c => {
    (c.payments || []).forEach(p => {
      totalCollectedGlobal += (Number(p.amount) || 0);
    });
    (c.expenses || []).forEach(e => {
      totalExpensesGlobal += (Number(e.amount) || 0);
    });
  });

  const pendingReceivableGlobal = Math.max(0, totalContractedAmount - totalCollectedGlobal);
  const collectionRate = totalContractedAmount > 0 
    ? Math.round((totalCollectedGlobal / totalContractedAmount) * 100) 
    : 0;
  
  const globalNetProfit = totalCollectedGlobal - totalExpensesGlobal;
  const globalProfitMargin = totalCollectedGlobal > 0
    ? Math.round((globalNetProfit / totalCollectedGlobal) * 100)
    : 0;

  // Global payment alerts (overdue & upcoming in 14 days)
  const alerts = getGlobalPaymentAlerts(contracts, 14);

  return (
    <div className="space-y-4">
      {/* 5 Primary Financial & Profitability KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Contratos Activos y Concluidos */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Contratos en Gestión
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <FileCheck2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
              {activeContracts}
            </span>
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              Activos
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>{totalContracts} totales</span>
            <span className="text-emerald-700 font-semibold">{completedContracts} cerrados</span>
          </div>
        </div>

        {/* 2. Total Contratado (Monto de Cartera) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Monto Contratado
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
            {formatCurrency(totalContractedAmount)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Saldo x cobrar:</span>
            <span className="text-amber-700 font-bold font-mono">{formatCurrency(pendingReceivableGlobal)}</span>
          </div>
        </div>

        {/* 3. Total Cobrado Global (Ingresos) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Ingresos Cobrados
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CircleDollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 tracking-tight font-mono">
            {formatCurrency(totalCollectedGlobal)}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
              <span className="text-slate-500">Recaudación</span>
              <span className="text-emerald-700">{collectionRate}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${collectionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* 4. Total Gastos de Obra (Egresos) */}
        <div 
          onClick={onViewProfitSummary}
          className={`bg-white rounded-xl border border-slate-200 p-4 shadow-xs transition-colors ${
            onViewProfitSummary ? 'cursor-pointer hover:border-rose-300 hover:shadow-sm' : ''
          }`}
          title={onViewProfitSummary ? "Clic para ver resumen de gastos y rentabilidad de todos los contratos" : undefined}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
              Gastos de Obra
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-700 tracking-tight font-mono">
            {formatCurrency(totalExpensesGlobal)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Materiales y planillas</span>
            <span className="text-rose-700 font-semibold inline-flex items-center gap-0.5">
              <span>Costos reales</span>
              {onViewProfitSummary && <ExternalLink className="w-2.5 h-2.5" />}
            </span>
          </div>
        </div>

        {/* 5. Ganancia Neta Realizada (Cobrado - Gastos) */}
        <div 
          onClick={onViewProfitSummary}
          className={`rounded-xl border p-4 shadow-xs transition-all ${
            onViewProfitSummary ? 'cursor-pointer hover:shadow-md hover:scale-[1.01]' : ''
          } ${
            globalNetProfit >= 0
              ? 'bg-gradient-to-br from-teal-50/80 to-emerald-50/80 border-teal-300'
              : 'bg-gradient-to-br from-rose-50/80 to-red-50/80 border-rose-300'
          }`}
          title={onViewProfitSummary ? "Clic para ver resumen de ganancias de todos los contratos" : undefined}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
              {globalNetProfit >= 0 ? 'Ganancia Neta Real' : 'Déficit Operativo'}
            </span>
            <span 
              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                globalNetProfit >= 0 ? 'bg-teal-600 text-white' : 'bg-rose-600 text-white'
              }`}
            >
              {globalProfitMargin}%
            </span>
          </div>
          <div 
            className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
              globalNetProfit >= 0 ? 'text-teal-900' : 'text-rose-900'
            }`}
          >
            {formatCurrency(globalNetProfit)}
          </div>
          <div className="mt-2 text-[11px] text-slate-600 flex items-center justify-between border-t border-slate-200/60 pt-2 font-medium">
            <span>Cobrado - Gastos</span>
            <span className="text-teal-800 font-bold inline-flex items-center gap-0.5">
              <span>Ver resumen</span>
              {onViewProfitSummary && <ExternalLink className="w-2.5 h-2.5" />}
            </span>
          </div>
        </div>
      </div>

      {/* DASHBOARD FEATURE: IDENTIFY & FLAG UPCOMING & OVERDUE PAYMENTS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Monitoreo de Cobranzas y Vencimientos</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Calendario de Hitos
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Control preventivo de cuotas pactadas: pagos vencidos que requieren cobro y próximos vencimientos a 14 días.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            {(alerts.totalOverdueCount > 0 || alerts.totalUpcomingCount > 0) && (
              <button
                type="button"
                onClick={() => setShowScheduleDrawer(!showScheduleDrawer)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg inline-flex items-center gap-1.5 transition-colors"
              >
                <span>{showScheduleDrawer ? 'Ocultar Detalle' : 'Ver Calendario Detallado'}</span>
                {showScheduleDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Visual Indicator Cards for Overdue & Upcoming */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Card: Pagos Vencidos (Overdue) */}
          <div 
            className={`p-4 rounded-xl border transition-all ${
              alerts.totalOverdueCount > 0
                ? 'bg-gradient-to-br from-red-50/90 to-rose-50/80 border-red-300 shadow-2xs'
                : 'bg-slate-50/80 border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div 
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    alerts.totalOverdueCount > 0
                      ? 'bg-red-600 text-white shadow-xs animate-pulse'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-red-950">
                      Pagos Vencidos
                    </span>
                    {alerts.totalOverdueCount > 0 ? (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-600 text-white shadow-2xs">
                        {alerts.totalOverdueCount} {alerts.totalOverdueCount === 1 ? 'vencido' : 'vencidos'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                        0 vencidos
                      </span>
                    )}
                  </div>
                  <span className="text-lg sm:text-xl font-black font-mono text-red-900 block mt-0.5">
                    {formatCurrency(alerts.totalOverdueAmount)}
                  </span>
                </div>
              </div>

              {alerts.totalOverdueCount > 0 && onFilterOverdue && (
                <button
                  type="button"
                  onClick={onFilterOverdue}
                  className="px-2.5 py-1 text-xs font-bold text-red-800 bg-white hover:bg-red-100 border border-red-300 rounded-lg shadow-2xs transition-colors shrink-0"
                >
                  Filtrar Lista
                </button>
              )}
            </div>

            <p className="text-xs text-red-800/90 mt-2.5 leading-relaxed">
              {alerts.totalOverdueCount > 0 ? (
                <>
                  ⚠️ Hay cuotas que sobrepasaron la fecha pactada en <strong>{alerts.contractsWithOverdue.length}</strong> contrato(s). El más crítico venció hace <strong>{Math.abs(alerts.allOverdueEntries[0].daysDiff)} días</strong> ({alerts.allOverdueEntries[0].contract.clientName}).
                </>
              ) : (
                <span className="text-slate-500">
                  Excelente: No tienes hitos de pago vencidos en cartera.
                </span>
              )}
            </p>
          </div>

          {/* Card: Próximos Cobros (Upcoming) */}
          <div 
            className={`p-4 rounded-xl border transition-all ${
              alerts.totalUpcomingCount > 0
                ? 'bg-gradient-to-br from-indigo-50/90 to-sky-50/80 border-indigo-300 shadow-2xs'
                : 'bg-slate-50/80 border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div 
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    alerts.totalUpcomingCount > 0
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                      Próximos Cobros (14 Días)
                    </span>
                    {alerts.totalUpcomingCount > 0 ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-2xs">
                        {alerts.totalUpcomingCount} programado(s)
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                        0 próximos
                      </span>
                    )}
                  </div>
                  <span className="text-lg sm:text-xl font-black font-mono text-indigo-900 block mt-0.5">
                    {formatCurrency(alerts.totalUpcomingAmount)}
                  </span>
                </div>
              </div>

              {alerts.totalUpcomingCount > 0 && onFilterUpcoming && (
                <button
                  type="button"
                  onClick={onFilterUpcoming}
                  className="px-2.5 py-1 text-xs font-bold text-indigo-800 bg-white hover:bg-indigo-100 border border-indigo-300 rounded-lg shadow-2xs transition-colors shrink-0"
                >
                  Filtrar Lista
                </button>
              )}
            </div>

            <p className="text-xs text-indigo-900/90 mt-2.5 leading-relaxed">
              {alerts.totalUpcomingCount > 0 ? (
                <>
                  📅 Flujo proyectado a cobrar en <strong>{alerts.contractsWithUpcoming.length}</strong> contrato(s). El próximo vence {alerts.allUpcomingEntries[0].daysDiff === 0 ? '¡Hoy mismo!' : `en ${alerts.allUpcomingEntries[0].daysDiff} días (${formatDate(alerts.allUpcomingEntries[0].item.dueDate)})`} por {formatCurrency(alerts.allUpcomingEntries[0].item.amount)}.
                </>
              ) : (
                <span className="text-slate-500">
                  No hay cuotas programadas para vencer en los próximos 14 días.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Expandable Schedule Drawer */}
        {showScheduleDrawer && (
          <div className="mt-4 pt-4 border-t border-slate-200 animate-in fade-in space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>Listado de Vencimientos Programados en el Calendario</span>
            </h4>

            <div className="space-y-2">
              {/* Overdue Items List */}
              {alerts.allOverdueEntries.map(({ contract, item, daysDiff }) => {
                return (
                  <div
                    key={`ov-${contract.id}-${item.id}`}
                    className="p-3 bg-red-50/70 border border-red-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start sm:items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-600 text-white shrink-0">
                        Vencido ({Math.abs(daysDiff)} d)
                      </span>
                      <div>
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="font-bold text-slate-900">{contract.clientName}</span>
                          <span className="font-mono text-[11px] text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                            {contract.contractNumber}
                          </span>
                        </div>
                        <p className="text-[11px] text-red-900 mt-0.5">
                          {item.title} • Fecha pactada: <strong>{formatDate(item.dueDate)}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                      <span className="font-mono font-black text-sm text-red-700">
                        {formatCurrency(item.amount)}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {onSelectContract && (
                          <button
                            type="button"
                            onClick={() => onSelectContract(contract)}
                            className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <span>Gestionar</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Upcoming Items List */}
              {alerts.allUpcomingEntries.map(({ contract, item, daysDiff }) => {
                return (
                  <div
                    key={`up-${contract.id}-${item.id}`}
                    className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start sm:items-center gap-2.5">
                      <span 
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          daysDiff === 0 
                            ? 'bg-amber-500 text-white' 
                            : 'bg-sky-600 text-white'
                        }`}
                      >
                        {daysDiff === 0 ? '¡Vence Hoy!' : `Vence en ${daysDiff} d`}
                      </span>
                      <div>
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="font-bold text-slate-900">{contract.clientName}</span>
                          <span className="font-mono text-[11px] text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                            {contract.contractNumber}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          {item.title} • Fecha límite: <strong>{formatDate(item.dueDate)}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {formatCurrency(item.amount)}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {onSelectContract && (
                          <button
                            type="button"
                            onClick={() => onSelectContract(contract)}
                            className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <span>Gestionar</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
