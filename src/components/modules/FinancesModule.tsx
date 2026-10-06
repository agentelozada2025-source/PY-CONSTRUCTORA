import React, { useMemo, useState } from 'react';
import { Contract, FileAttachment } from '../../types';
import { formatCurrency, calculateFinancials } from '../../utils/formatters';
import { GlobalProfitSummary } from '../GlobalProfitSummary';
import { FinancialVouchersLedger } from '../FinancialVouchersLedger';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { 
  TrendingUp, 
  CircleDollarSign, 
  Clock, 
  Wallet, 
  FileDown, 
  Percent,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Receipt,
  BarChart3,
  Layers,
  Scale
} from 'lucide-react';

interface FinancesModuleProps {
  contracts: Contract[];
  onSelectContract: (contract: Contract) => void;
  onOpenPdfModal: () => void;
  onOpenViewer?: (attachment: FileAttachment, title: string) => void;
}

export const FinancesModule: React.FC<FinancesModuleProps> = ({
  contracts,
  onSelectContract,
  onOpenPdfModal,
  onOpenViewer,
}) => {
  const [activeSection, setActiveSection] = useState<'vouchers' | 'profitability' | 'cashflow' | 'all'>('vouchers');
  // Current month
  const now = new Date();
  const currentMonthNum = now.getMonth();
  const currentYear = now.getFullYear();
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
  const currentMonthName = monthNames[currentMonthNum];
  const currentMonthKey = `${currentYear}-${String(currentMonthNum + 1).padStart(2, '0')}`;

  // Compute global consolidated figures
  const { 
    totalContracted, 
    totalCollected, 
    totalExpenses, 
    currentMonthCollected,
    globalNetProfit, 
    globalProfitMargin, 
    pendingReceivable, 
    collectionRate,
    activeContractsCount,
    completedContractsCount
  } = useMemo(() => {
    let contracted = 0;
    let collected = 0;
    let expenses = 0;
    let monthCol = 0;
    let active = 0;
    let completed = 0;

    contracts.forEach((c) => {
      const fin = calculateFinancials(c);
      contracted += fin.totalAmount;
      collected += fin.totalPaid;
      expenses += fin.totalExpenses;

      if (c.status === 'PAGADO_CONCLUIDO') {
        completed++;
      } else {
        active++;
      }

      (c.payments || []).forEach((p) => {
        if (p.date && p.date.slice(0, 7) === currentMonthKey) {
          monthCol += Number(p.amount) || 0;
        }
      });
    });

    const netProfit = collected - expenses;
    const profitMargin = collected > 0 ? Math.round((netProfit / collected) * 100) : 0;
    const pending = Math.max(0, contracted - collected);
    const colRate = contracted > 0 ? Math.round((collected / contracted) * 100) : 0;

    return {
      totalContracted: contracted,
      totalCollected: collected,
      totalExpenses: expenses,
      currentMonthCollected: monthCol,
      globalNetProfit: netProfit,
      globalProfitMargin: profitMargin,
      pendingReceivable: pending,
      collectionRate: colRate,
      activeContractsCount: active,
      completedContractsCount: completed
    };
  }, [contracts, currentMonthKey]);

  // Monthly trend for cash flow (6 months)
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

  // Total count of voucher items across contracts
  const totalVouchersCount = useMemo(() => {
    let count = 0;
    contracts.forEach((c) => {
      if (c.invoice) count++;
      (c.payments || []).forEach((p) => {
        if (p.invoiceNumber || p.invoiceFile) count++;
        if (p.voucherFile || p.receiptFile || (!p.invoiceNumber && !p.invoiceFile)) count++;
      });
      (c.expenses || []).forEach((e) => {
        count++;
        if (e.voucherFile) count++;
      });
    });
    return count;
  }, [contracts]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#202738]">
        <div>
          <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2 font-mono">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span>Finanzas & Resumen General de Operaciones</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Resumen consolidado de ingresos, costos de obra, registro de comprobantes de ventas y compras, y rentabilidad por contrato.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenPdfModal}
            className="px-3 py-1.5 text-xs font-bold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5 text-rose-400" />
            <span>Exportar Balance PDF</span>
          </button>
        </div>
      </div>

      {/* 4 Clean Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Ingresos Cobrados */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Ingresos Cobrados
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CircleDollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 tracking-tight font-mono">
            {formatCurrency(totalCollected)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2 font-medium">
            <span>En {currentMonthName}: <strong className="text-emerald-800 font-mono">{formatCurrency(currentMonthCollected)}</strong></span>
            <span className="text-slate-500 font-mono">Cartera: {formatCurrency(totalContracted)}</span>
          </div>
        </div>

        {/* 2. Gastos Totales de Obra */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
              Costos & Gastos de Obra
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-700 tracking-tight font-mono">
            {formatCurrency(totalExpenses)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2 font-medium">
            <span>Materiales, mano de obra y equipos</span>
            <span className="text-rose-600 font-mono font-semibold">
              {totalCollected > 0 ? `${Math.round((totalExpenses / totalCollected) * 100)}% de cobrado` : '0%'}
            </span>
          </div>
        </div>

        {/* 3. Ganancia Neta Real */}
        <div className={`p-4 rounded-xl border shadow-xs ${
          globalNetProfit >= 0
            ? 'bg-emerald-50/50 border-emerald-200'
            : 'bg-red-50/50 border-red-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${
              globalNetProfit >= 0 ? 'text-emerald-900' : 'text-red-900'
            }`}>
              Ganancia Neta Real
            </span>
            <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
              globalNetProfit >= 0 ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}>
              {globalProfitMargin}% margen
            </span>
          </div>
          <div className={`text-2xl font-black tracking-tight font-mono ${
            globalNetProfit >= 0 ? 'text-emerald-900' : 'text-red-900'
          }`}>
            {formatCurrency(globalNetProfit)}
          </div>
          <div className="mt-2 text-[11px] text-slate-600 flex items-center justify-between border-t border-slate-200/60 pt-2 font-medium">
            <span>Cobrado menos costos reales</span>
            <span className="text-emerald-800 font-bold">{globalNetProfit >= 0 ? 'Operación Rentable' : 'Déficit'}</span>
          </div>
        </div>

        {/* 4. Saldo Pendiente por Cobrar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Saldo por Cobrar
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
            {formatCurrency(pendingReceivable)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2 font-medium">
            <span>{activeContractsCount} obras activas · {completedContractsCount} cerradas</span>
            <span className="text-emerald-700 font-bold font-mono">{collectionRate}% cobrado</span>
          </div>
        </div>
      </div>

      {/* Selector de Vistas / Pestañas de Finanzas */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveSection('vouchers')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSection === 'vouchers'
                ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4 text-sky-600" />
            <span>Registro de Comprobantes</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-sky-100 text-sky-800 font-black">
              {totalVouchersCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('profitability')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSection === 'profitability'
                ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-4 h-4 text-emerald-600" />
            <span>Rentabilidad por Obra</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('cashflow')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSection === 'cashflow'
                ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>Flujo de Caja Mensual</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('all')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSection === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-slate-600" />
            <span>Vista Completa</span>
          </button>
        </div>

        <span className="text-xs text-slate-500 hidden sm:inline">
          {activeSection === 'vouchers' && 'Visualizando cuadro auditable de ventas y compras'}
          {activeSection === 'profitability' && 'Visualizando estado de resultados y margen por contrato'}
          {activeSection === 'cashflow' && 'Visualizando comparativa de cobranzas vs gastos'}
          {activeSection === 'all' && 'Visualizando cuadro de comprobantes y balance general'}
        </span>
      </div>

      {/* 1. SECCIÓN: CUADRO DE REGISTRO DE COMPROBANTES DE VENTAS Y GASTOS */}
      {(activeSection === 'vouchers' || activeSection === 'all') && (
        <div className="space-y-2">
          <FinancialVouchersLedger
            contracts={contracts}
            onSelectContract={onSelectContract}
            onOpenViewer={onOpenViewer}
          />
        </div>
      )}

      {/* 2. SECCIÓN: FLUJO MENSUAL DE CAJA */}
      {(activeSection === 'cashflow' || activeSection === 'all') && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Flujo Mensual de Caja: Recaudación vs Gastos de Obra
              </h3>
              <p className="text-xs text-slate-500">
                Comparativa de abonos recibidos frente a compras y pagos a cuadrillas en los últimos 6 meses.
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

          <div className="h-52 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barGap={6}>
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
                <Bar 
                  dataKey="cobrado" 
                  name="cobrado"
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={30}
                />
                <Bar 
                  dataKey="gastos" 
                  name="gastos"
                  fill="#f43f5e" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 3. SECCIÓN: RENTABILIDAD POR CONTRATO */}
      {(activeSection === 'profitability' || activeSection === 'all') && (
        <div className="space-y-2">
          <GlobalProfitSummary
            contracts={contracts}
            onSelectContract={onSelectContract}
            onOpenPdfModal={onOpenPdfModal}
            hideKpis={true}
          />
        </div>
      )}
    </div>
  );
};
