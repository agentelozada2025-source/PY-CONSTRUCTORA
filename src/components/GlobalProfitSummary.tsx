import React, { useState } from 'react';
import { Contract } from '../types';
import { formatCurrency, calculateFinancials } from '../utils/formatters';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet, 
  Receipt, 
  Scale, 
  ChevronRight, 
  FileSpreadsheet, 
  ArrowUpDown,
  CheckCircle2,
  PieChart,
  Percent,
  FileDown
} from 'lucide-react';

interface GlobalProfitSummaryProps {
  contracts: Contract[];
  onSelectContract: (contract: Contract) => void;
  onOpenPdfModal?: () => void;
  hideKpis?: boolean;
}

export const GlobalProfitSummary: React.FC<GlobalProfitSummaryProps> = ({
  contracts,
  onSelectContract,
  onOpenPdfModal,
  hideKpis = false,
}) => {
  const [sortBy, setSortBy] = useState<'profit-desc' | 'margin-desc' | 'expenses-desc' | 'revenue-desc'>('profit-desc');

  // Compute global figures
  let totalContracted = 0;
  let totalCollected = 0;
  let totalExpenses = 0;

  const contractsWithFinancials = contracts.map((c) => {
    const fin = calculateFinancials(c);
    totalContracted += fin.totalAmount;
    totalCollected += fin.totalPaid;
    totalExpenses += fin.totalExpenses;

    return {
      contract: c,
      fin,
    };
  });

  const globalNetProfit = totalCollected - totalExpenses;
  const globalProfitMargin = totalCollected > 0 
    ? Math.round((globalNetProfit / totalCollected) * 100) 
    : 0;
  const globalProjectedProfit = totalContracted - totalExpenses;
  const globalProjectedMargin = totalContracted > 0
    ? Math.round((globalProjectedProfit / totalContracted) * 100)
    : 0;

  // Sorting
  const sorted = [...contractsWithFinancials].sort((a, b) => {
    if (sortBy === 'profit-desc') {
      return b.fin.netProfit - a.fin.netProfit;
    }
    if (sortBy === 'margin-desc') {
      return b.fin.profitMarginPercent - a.fin.profitMarginPercent;
    }
    if (sortBy === 'expenses-desc') {
      return b.fin.totalExpenses - a.fin.totalExpenses;
    }
    return b.fin.totalPaid - a.fin.totalPaid;
  });

  return (
    <div className="bg-[#101420] rounded-2xl border border-[#202738] p-4 sm:p-6 shadow-lg space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#202738]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-mono">
              <Scale className="w-4 h-4" />
            </div>
            <h3 className="text-base font-black text-white font-mono">
              Estado de Resultados y Rentabilidad Global
            </h3>
            <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-full bg-[#1A2131] text-amber-400 border border-amber-400/30">
              Todos los Contratos ({contracts.length})
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Consolidado general de ingresos cobrados, gastos operativos de obra y utilidad neta real de la empresa
          </p>
        </div>

        {/* Actions & Sort */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {onOpenPdfModal && (
            <button
              type="button"
              onClick={onOpenPdfModal}
              className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-2xs"
              title="Descargar Reporte Financiero Completo en PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-rose-600" />
              <span>Reporte PDF</span>
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="profit-desc">Mayor ganancia neta</option>
              <option value="margin-desc">Mayor margen (%)</option>
              <option value="revenue-desc">Mayor recaudación</option>
              <option value="expenses-desc">Mayor volumen de gastos</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4 Global KPI Cards (hidden if parent module already displays them) */}
      {!hideKpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Ingresos Cobrados Global */}
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                Ingresos Cobrados
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-800 font-mono tracking-tight">
              {formatCurrency(totalCollected)}
            </div>
            <p className="text-[11px] text-emerald-700 mt-1">
              Monto total ingresado a cuentas y Yape
            </p>
          </div>

          {/* 2. Gastos Totales de Obra */}
          <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                Gastos Totales de Obra
              </span>
              <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                <Receipt className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-800 font-mono tracking-tight">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-[11px] text-rose-700 mt-1">
              Materiales, mano de obra y logística
            </p>
          </div>

          {/* 3. Ganancia Neta Realizada */}
          <div 
            className={`p-4 rounded-xl border shadow-2xs ${
              globalNetProfit >= 0
                ? 'bg-teal-50/80 border-teal-300'
                : 'bg-red-50/80 border-red-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                {globalNetProfit >= 0 ? 'Ganancia Neta Real' : 'Déficit Operativo'}
              </span>
              <div 
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-white ${
                  globalNetProfit >= 0 ? 'bg-teal-600' : 'bg-red-600'
                }`}
              >
                {globalNetProfit >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              </div>
            </div>
            <div 
              className={`text-2xl font-black font-mono tracking-tight ${
                globalNetProfit >= 0 ? 'text-teal-900' : 'text-red-900'
              }`}
            >
              {formatCurrency(globalNetProfit)}
            </div>
            <p className="text-[11px] text-slate-600 mt-1 font-semibold">
              Margen de ganancia: {globalProfitMargin}%
            </p>
          </div>

          {/* 4. Ganancia Proyectada al 100% */}
          <div className="bg-sky-50/70 p-4 rounded-xl border border-sky-200 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-sky-900 uppercase tracking-wider">
                Utilidad Proyectada
              </span>
              <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center">
                <Percent className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-sky-900 font-mono tracking-tight">
              {formatCurrency(globalProjectedProfit)}
            </div>
            <p className="text-[11px] text-sky-700 mt-1">
              Al cobrar el 100% ({globalProjectedMargin}% margen)
            </p>
          </div>
        </div>
      )}

      {/* Resumen Comparativo de Rentabilidad por Contrato */}
      <div>
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
          Detalle Financiero Individual por Contrato
        </h4>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Contrato / Cliente</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-3 text-right">Contratado</th>
                <th className="py-3 px-3 text-right">Ingresos (Cobrado)</th>
                <th className="py-3 px-3 text-right">Gastos (Costos)</th>
                <th className="py-3 px-3 text-right">Ganancia Neta</th>
                <th className="py-3 px-3 text-center">Margen (%)</th>
                <th className="py-3 px-3 text-center">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {sorted.map(({ contract, fin }) => {
                const isProfitable = fin.netProfit >= 0;

                return (
                  <tr key={contract.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Contrato / Cliente */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {contract.contractNumber}
                        </span>
                        <span className="font-bold text-slate-900 truncate max-w-[200px]">
                          {contract.clientName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate max-w-[320px] mt-0.5">
                        {contract.description}
                      </p>
                    </td>

                    {/* Estado */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {contract.status === 'PAGADO_CONCLUIDO' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Concluido
                        </span>
                      ) : contract.status === 'OBRA_TERMINADA' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                          Terminada
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          En Ejecución
                        </span>
                      )}
                    </td>

                    {/* Contratado */}
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800 whitespace-nowrap">
                      {formatCurrency(fin.totalAmount)}
                    </td>

                    {/* Cobrado */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                      {formatCurrency(fin.totalPaid)}
                    </td>

                    {/* Gastos */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-700 whitespace-nowrap">
                      {formatCurrency(fin.totalExpenses)}
                    </td>

                    {/* Ganancia Neta */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <span 
                        className={`font-mono font-black text-sm px-2 py-0.5 rounded-md ${
                          isProfitable
                            ? 'text-emerald-800 bg-emerald-50 border border-emerald-200'
                            : 'text-rose-800 bg-rose-50 border border-rose-200'
                        }`}
                      >
                        {formatCurrency(fin.netProfit)}
                      </span>
                    </td>

                    {/* Margen */}
                    <td className="py-3 px-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span 
                          className={`font-bold text-xs ${
                            isProfitable ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {fin.profitMarginPercent}%
                        </span>
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              isProfitable ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, fin.profitMarginPercent))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Ficha Button */}
                    <td className="py-3 px-3 whitespace-nowrap text-center">
                      <button
                        type="button"
                        onClick={() => onSelectContract(contract)}
                        className="px-2.5 py-1 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg inline-flex items-center gap-1 shadow-2xs transition-colors"
                      >
                        <span>Ficha</span>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900 text-xs">
              <tr>
                <td colSpan={2} className="py-3 px-3 uppercase text-[11px]">
                  Totales Consolidados:
                </td>
                <td className="py-3 px-3 text-right font-mono">
                  {formatCurrency(totalContracted)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-700">
                  {formatCurrency(totalCollected)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-rose-700">
                  {formatCurrency(totalExpenses)}
                </td>
                <td className="py-3 px-3 text-right font-mono font-black text-sm text-emerald-800">
                  {formatCurrency(globalNetProfit)}
                </td>
                <td className="py-3 px-3 text-center font-bold text-emerald-700">
                  {globalProfitMargin}% margen global
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
