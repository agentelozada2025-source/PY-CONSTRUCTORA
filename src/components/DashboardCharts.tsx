import React, { useState, useMemo } from 'react';
import { Contract } from '../types';
import { formatCurrency } from '../utils/formatters';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart as PieIcon, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  Wallet,
  CheckCircle2,
  CalendarDays,
  Scale
} from 'lucide-react';

interface DashboardChartsProps {
  contracts: Contract[];
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ contracts }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeView, setActiveView] = useState<'evolution' | 'efficiency' | 'profitability' | 'methods'>('evolution');
  const [timeRange, setTimeRange] = useState<'6m' | '12m' | 'all'>('6m');

  // Month names in Spanish
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];

  // Process timeline data
  const { monthlyData, methodData, stats } = useMemo(() => {
    const monthlyMap: Record<string, { 
      monthKey: string; 
      label: string; 
      contratado: number; 
      cobrado: number; 
      programado: number;
      gastos: number;
      ganancia: number;
      abonosCount: number;
      contratosCount: number;
      expensesCount: number;
    }> = {};

    // Determine min and max months or use last 6 months ending in current simulated date (2026-10)
    const baseDate = new Date();
    // Use last 6 or 12 months up to current month
    const monthsCount = timeRange === '6m' ? 6 : timeRange === '12m' ? 12 : 12;
    
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${y}-${m}`;
      monthlyMap[key] = {
        monthKey: key,
        label: `${monthNames[d.getMonth()]} ${String(y).slice(-2)}`,
        contratado: 0,
        cobrado: 0,
        programado: 0,
        gastos: 0,
        ganancia: 0,
        abonosCount: 0,
        contratosCount: 0,
        expensesCount: 0,
      };
    }

    // Populate contracts contracted amount
    contracts.forEach((c) => {
      const dateStr = c.startDate || c.createdAt;
      if (dateStr) {
        const key = dateStr.slice(0, 7); // YYYY-MM
        if (monthlyMap[key]) {
          monthlyMap[key].contratado += Number(c.totalAmount) || 0;
          monthlyMap[key].contratosCount += 1;
        }
      }

      // Populate payments
      (c.payments || []).forEach((p) => {
        if (p.date) {
          const key = p.date.slice(0, 7);
          if (monthlyMap[key]) {
            monthlyMap[key].cobrado += Number(p.amount) || 0;
            monthlyMap[key].abonosCount += 1;
          }
        }
      });

      // Populate expenses
      (c.expenses || []).forEach((e) => {
        if (e.date) {
          const key = e.date.slice(0, 7);
          if (monthlyMap[key]) {
            monthlyMap[key].gastos += Number(e.amount) || 0;
            monthlyMap[key].expensesCount += 1;
          }
        }
      });

      // Populate scheduled milestones
      (c.paymentSchedule || []).forEach((s) => {
        if (s.dueDate) {
          const key = s.dueDate.slice(0, 7);
          if (monthlyMap[key]) {
            monthlyMap[key].programado += Number(s.amount) || 0;
          }
        }
      });
    });

    // Convert map to sorted array
    const sortedKeys = Object.keys(monthlyMap).sort();
    const rawMonthly = sortedKeys.map((k) => monthlyMap[k]);

    // Calculate efficiency & growth trends
    let prevCobrado = 0;
    let accumulatedContratado = 0;
    let accumulatedCobrado = 0;

    const monthlyDataCalculated = rawMonthly.map((item, idx) => {
      accumulatedContratado += item.contratado;
      accumulatedCobrado += item.cobrado;

      const efficiencyPercent = item.contratado > 0 
        ? Math.min(100, Math.round((item.cobrado / item.contratado) * 100))
        : item.cobrado > 0 ? 100 : 0;

      const cumulativeEfficiency = accumulatedContratado > 0
        ? Math.min(100, Math.round((accumulatedCobrado / accumulatedContratado) * 100))
        : 0;

      const growthPercent = idx > 0 && prevCobrado > 0
        ? Math.round(((item.cobrado - prevCobrado) / prevCobrado) * 100)
        : 0;

      prevCobrado = item.cobrado;

      return {
        ...item,
        ganancia: item.cobrado - item.gastos,
        eficiencia: efficiencyPercent,
        eficienciaAcumulada: cumulativeEfficiency,
        crecimientoMoM: growthPercent,
      };
    });

    // Payment methods aggregation
    const methodsMap: Record<string, { name: string; value: number; count: number }> = {
      'Yape': { name: 'Yape', value: 0, count: 0 },
      'Plin': { name: 'Plin', value: 0, count: 0 },
      'Transferencia Bancaria': { name: 'Transferencia', value: 0, count: 0 },
      'Efectivo': { name: 'Efectivo', value: 0, count: 0 },
      'Otro': { name: 'Otros / Cheque', value: 0, count: 0 },
    };

    let totalPaymentsAmount = 0;
    contracts.forEach((c) => {
      (c.payments || []).forEach((p) => {
        const amt = Number(p.amount) || 0;
        totalPaymentsAmount += amt;
        const method = p.method || 'Otro';
        if (methodsMap[method]) {
          methodsMap[method].value += amt;
          methodsMap[method].count += 1;
        } else {
          methodsMap['Otro'].value += amt;
          methodsMap['Otro'].count += 1;
        }
      });
    });

    const methodDataCalculated = Object.values(methodsMap)
      .filter((m) => m.value > 0)
      .map((m) => ({
        ...m,
        percentage: totalPaymentsAmount > 0 ? Math.round((m.value / totalPaymentsAmount) * 100) : 0,
      }));

    // Stats calculations
    const bestMonth = [...monthlyDataCalculated].sort((a, b) => b.cobrado - a.cobrado)[0];
    const totalCollectedInPeriod = monthlyDataCalculated.reduce((acc, m) => acc + m.cobrado, 0);
    const totalContractedInPeriod = monthlyDataCalculated.reduce((acc, m) => acc + m.contratado, 0);
    const totalExpensesInPeriod = monthlyDataCalculated.reduce((acc, m) => acc + m.gastos, 0);
    const totalProfitInPeriod = totalCollectedInPeriod - totalExpensesInPeriod;
    const periodProfitMargin = totalCollectedInPeriod > 0
      ? Math.round((totalProfitInPeriod / totalCollectedInPeriod) * 100)
      : 0;
    const periodEfficiency = totalContractedInPeriod > 0
      ? Math.round((totalCollectedInPeriod / totalContractedInPeriod) * 100)
      : 0;

    // Top method
    const topMethod = [...methodDataCalculated].sort((a, b) => b.value - a.value)[0];

    return {
      monthlyData: monthlyDataCalculated,
      methodData: methodDataCalculated,
      stats: {
        bestMonth,
        totalCollectedInPeriod,
        totalContractedInPeriod,
        totalExpensesInPeriod,
        totalProfitInPeriod,
        periodProfitMargin,
        periodEfficiency,
        topMethod,
      },
    };
  }, [contracts, timeRange]);

  // Color constants
  const COLORS = {
    cobrado: '#10b981', // emerald-500
    contratado: '#0284c7', // sky-600
    programado: '#6366f1', // indigo-500
    gastos: '#f43f5e', // rose-500
    ganancia: '#0d9488', // teal-600
    eficiencia: '#f59e0b', // amber-500
    pieColors: ['#8b5cf6', '#06b6d4', '#0284c7', '#10b981', '#f59e0b'],
  };

  // Custom Tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs backdrop-blur-xs min-w-[200px]">
          <p className="font-bold text-slate-200 border-b border-slate-700/80 pb-1.5 mb-2 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-slate-400 font-mono">Mes</span>
          </p>
          <div className="space-y-1.5 font-mono">
            {payload.map((entry: any, index: number) => {
              const isPercentage = entry.dataKey === 'eficiencia' || entry.dataKey === 'eficienciaAcumulada';
              return (
                <div key={`item-${index}`} className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span 
                      className="w-2 h-2 rounded-full shrink-0" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span>{entry.name}:</span>
                  </span>
                  <span className="font-bold text-white">
                    {isPercentage ? `${entry.value}%` : formatCurrency(entry.value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Crecimiento de Ingresos y Tendencia de Cobranzas
            </h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Analítica Recharts
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visualización de facturación mensual contratada, abonos reales recaudados y eficiencia de cobro
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
          {/* Time range selector */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
            <button
              onClick={() => setTimeRange('6m')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                timeRange === '6m' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              6 meses
            </button>
            <button
              onClick={() => setTimeRange('12m')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                timeRange === '12m' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              12 meses
            </button>
          </div>

          {/* Toggle Expand */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title={isExpanded ? 'Minimizar gráficos' : 'Expandir gráficos'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Recaudado en Período
              </span>
              <span className="font-mono font-extrabold text-emerald-700 text-base">
                {formatCurrency(stats.totalCollectedInPeriod)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Ingresos por abonos confirmados
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Gastos del Período
              </span>
              <span className="font-mono font-extrabold text-rose-700 text-base">
                {formatCurrency(stats.totalExpensesInPeriod)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Costos de materiales y mano de obra
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Utilidad Neta Real
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`font-mono font-extrabold text-base ${stats.totalProfitInPeriod >= 0 ? 'text-teal-800' : 'text-rose-800'}`}>
                  {formatCurrency(stats.totalProfitInPeriod)}
                </span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  stats.totalProfitInPeriod >= 0 ? 'bg-teal-100 text-teal-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {stats.periodProfitMargin}% margen
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Cobrado - Gastos registrados
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Eficiencia de Cobro
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono font-extrabold text-sky-700 text-base">
                  {stats.periodEfficiency}%
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-sky-100 text-sky-800">
                  {stats.topMethod ? stats.topMethod.name : 'Bancos'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {stats.bestMonth ? `Mejor mes: ${stats.bestMonth.label}` : 'Efectividad global'}
              </span>
            </div>
          </div>

          {/* Chart View Switcher */}
          <div className="flex items-center flex-wrap gap-2 pt-1">
            <button
              onClick={() => setActiveView('evolution')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
                activeView === 'evolution'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Evolución Mensual (Contratado vs Cobrado)</span>
            </button>

            <button
              onClick={() => setActiveView('profitability')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
                activeView === 'profitability'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Rentabilidad (Ingresos vs Gastos vs Utilidad)</span>
            </button>

            <button
              onClick={() => setActiveView('efficiency')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
                activeView === 'efficiency'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Eficiencia de Cobranza & Crecimiento</span>
            </button>

            <button
              onClick={() => setActiveView('methods')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
                activeView === 'methods'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>Medios de Pago (Yape / Plin / Bancos)</span>
            </button>
          </div>

          {/* Chart Rendering Canvas */}
          <div className="h-72 w-full pt-2">
            {activeView === 'evolution' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCobrado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.cobrado} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={COLORS.cobrado} stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorContratado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.contratado} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={COLORS.contratado} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `S/${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconType="circle"
                    formatter={(val) => <span className="text-xs font-semibold text-slate-700">{val}</span>}
                  />
                  <Area
                    type="monotone"
                    name="Monto Contratado"
                    dataKey="contratado"
                    stroke={COLORS.contratado}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorContratado)"
                  />
                  <Area
                    type="monotone"
                    name="Total Cobrado Real"
                    dataKey="cobrado"
                    stroke={COLORS.cobrado}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorCobrado)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {activeView === 'profitability' && (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={monthlyData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `S/${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconType="circle"
                    formatter={(val) => <span className="text-xs font-semibold text-slate-700">{val}</span>}
                  />
                  <Bar
                    name="Ingresos Cobrados"
                    dataKey="cobrado"
                    fill={COLORS.cobrado}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    name="Gastos de Obra"
                    dataKey="gastos"
                    fill={COLORS.gastos}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  />
                  <Line
                    type="monotone"
                    name="Ganancia Neta Real"
                    dataKey="ganancia"
                    stroke={COLORS.ganancia}
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}

            {activeView === 'efficiency' && (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={monthlyData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `S/${(val / 1000).toFixed(0)}k`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconType="circle"
                    formatter={(val) => <span className="text-xs font-semibold text-slate-700">{val}</span>}
                  />
                  <Bar
                    yAxisId="left"
                    name="Abonos Cobrados (S/)"
                    dataKey="cobrado"
                    fill={COLORS.cobrado}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    name="Tasa de Eficiencia (%)"
                    dataKey="eficiencia"
                    stroke={COLORS.eficiencia}
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    name="Eficiencia Acumulada (%)"
                    dataKey="eficienciaAcumulada"
                    stroke={COLORS.contratado}
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}

            {activeView === 'methods' && (
              <div className="h-full flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="h-full w-full md:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={methodData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={4}
                      >
                        {methodData.map((_, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS.pieColors[index % COLORS.pieColors.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [formatCurrency(Number(value)), 'Monto']}
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          border: 'none', 
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px' 
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full md:w-1/2 space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Distribución de Cobros por Canal
                  </h4>
                  {methodData.map((item, idx) => (
                    <div 
                      key={item.name}
                      className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-3 h-3 rounded-full shrink-0" 
                          style={{ backgroundColor: COLORS.pieColors[idx % COLORS.pieColors.length] }} 
                        />
                        <span className="font-bold text-slate-800">{item.name}</span>
                        <span className="text-[10px] text-slate-400">({item.count} abonos)</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900 block">
                          {formatCurrency(item.value)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {item.percentage}% del total
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
