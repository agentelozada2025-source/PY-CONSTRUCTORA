import { Contract, ContractFinancials } from '../types';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('PEN', 'S/');
};

export const formatDate = (dateInput: string | Date): string => {
  if (!dateInput) return '-';
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? '-' : dateInput.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
  try {
    const parts = dateInput.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? dateInput : d.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return String(dateInput);
  }
};

export const calculateFinancials = (contract: Contract): ContractFinancials => {
  const totalAmount = contract.totalAmount || 0;
  const totalPaid = (contract.payments || []).reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const totalExpenses = (contract.expenses || []).reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const pendingBalance = Math.max(0, totalAmount - totalPaid);
  const progressPercent = totalAmount > 0 
    ? Math.min(100, Math.round((totalPaid / totalAmount) * 100)) 
    : 0;

  // Realized Net Profit = total collected so far - total expenses
  const netProfit = totalPaid - totalExpenses;
  const profitMarginPercent = totalPaid > 0 
    ? Math.round((netProfit / totalPaid) * 100) 
    : 0;

  // Projected Net Profit = total contract value - total expenses
  const projectedProfit = totalAmount - totalExpenses;
  const projectedMarginPercent = totalAmount > 0
    ? Math.round((projectedProfit / totalAmount) * 100)
    : 0;

  return {
    totalAmount,
    totalPaid,
    pendingBalance,
    progressPercent,
    paymentCount: contract.payments ? contract.payments.length : 0,
    isFullyPaid: pendingBalance <= 0.01 && totalAmount > 0,
    totalExpenses,
    expenseCount: contract.expenses ? contract.expenses.length : 0,
    netProfit,
    profitMarginPercent,
    projectedProfit,
    projectedMarginPercent,
  };
};

export const calculateContractFinancials = calculateFinancials;

export const formatExpenseCategory = (category: import('../types').ExpenseCategory): { label: string; color: string } => {
  switch (category) {
    case 'MATERIALES':
      return { label: 'Materiales & Insumos', color: 'bg-amber-100 text-amber-900 border-amber-300' };
    case 'MANO_DE_OBRA':
      return { label: 'Mano de Obra & Planillas', color: 'bg-blue-100 text-blue-900 border-blue-300' };
    case 'EQUIPOS_HERRAMIENTAS':
      return { label: 'Equipos & Maquinaria', color: 'bg-purple-100 text-purple-900 border-purple-300' };
    case 'TRANSPORTE_LOGISTICA':
      return { label: 'Transporte & Fletes', color: 'bg-teal-100 text-teal-900 border-teal-300' };
    case 'SUBCONTRATOS':
      return { label: 'Subcontratos Externos', color: 'bg-indigo-100 text-indigo-900 border-indigo-300' };
    case 'OTROS':
    default:
      return { label: 'Otros Gastos de Obra', color: 'bg-slate-100 text-slate-800 border-slate-300' };
  }
};

export const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const generateNextContractCode = (existingContracts: Contract[]): string => {
  const currentYear = new Date().getFullYear();
  let maxSeq = 0;
  
  existingContracts.forEach(c => {
    const match = c.contractNumber.match(/CONT-(\d{4})-(\d+)/i);
    if (match) {
      const year = parseInt(match[1], 10);
      const seq = parseInt(match[2], 10);
      if (year === currentYear && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  });

  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `CONT-${currentYear}-${nextSeq}`;
};

export const createWhatsAppPaymentReminderUrl = (contract: Contract, financials: ContractFinancials): string => {
  const cleanPhone = contract.phone.replace(/[^\d+]/g, '');
  if (!cleanPhone) return '';

  const message = `Estimado(a) ${contract.clientName},\n\nLe saludamos cordialmente de la empresa contratista respecto al contrato *${contract.contractNumber}* (*${contract.description}*).\n\nLe informamos el estado financiero actual:\n• Monto Total: ${formatCurrency(financials.totalAmount)}\n• Total Abonado: ${formatCurrency(financials.totalPaid)}\n• *Saldo Pendiente:* ${formatCurrency(financials.pendingBalance)}\n\nAgradeceremos coordinar la amortización o cancelación para la emisión y cierre de su comprobante final.\n\n¡Muchas gracias!`;

  return `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(message)}`;
};

export interface UpcomingPaymentInfo {
  item: import('../types').PaymentScheduleItem;
  daysDiff: number; // negative = overdue, 0 = today, positive = days left
  isOverdue: boolean;
  isToday: boolean;
}

export interface ContractPaymentAlerts {
  hasOverdue: boolean;
  overdueCount: number;
  overdueTotal: number;
  overdueItems: Array<{ item: import('../types').PaymentScheduleItem; daysDiff: number }>;
  hasUpcoming: boolean;
  upcomingCount: number;
  upcomingTotal: number;
  upcomingItems: Array<{ item: import('../types').PaymentScheduleItem; daysDiff: number }>;
  mostUrgentItem: { item: import('../types').PaymentScheduleItem; daysDiff: number; isOverdue: boolean; isToday: boolean } | null;
}

export const getContractPaymentAlerts = (contract: Contract, upcomingDaysThreshold = 14): ContractPaymentAlerts => {
  const schedule = contract.paymentSchedule || [];
  const unpaid = schedule.filter(item => !item.isPaid);

  if (unpaid.length === 0) {
    return {
      hasOverdue: false,
      overdueCount: 0,
      overdueTotal: 0,
      overdueItems: [],
      hasUpcoming: false,
      upcomingCount: 0,
      upcomingTotal: 0,
      upcomingItems: [],
      mostUrgentItem: null,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mapped = unpaid.map(item => {
    const due = new Date(item.dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      item,
      daysDiff,
      isOverdue: daysDiff < 0,
      isToday: daysDiff === 0,
    };
  });

  // Overdue: daysDiff < 0
  const overdueList = mapped.filter(m => m.daysDiff < 0).sort((a, b) => a.daysDiff - b.daysDiff); // most overdue first
  const overdueCount = overdueList.length;
  const overdueTotal = overdueList.reduce((acc, curr) => acc + (Number(curr.item.amount) || 0), 0);

  // Upcoming: daysDiff >= 0 and <= upcomingDaysThreshold
  const upcomingList = mapped.filter(m => m.daysDiff >= 0 && m.daysDiff <= upcomingDaysThreshold).sort((a, b) => a.daysDiff - b.daysDiff);
  const upcomingCount = upcomingList.length;
  const upcomingTotal = upcomingList.reduce((acc, curr) => acc + (Number(curr.item.amount) || 0), 0);

  // Most urgent item: first overdue if any, otherwise closest future
  const sortedAll = [...mapped].sort((a, b) => a.daysDiff - b.daysDiff);
  const mostUrgentItem = sortedAll[0] || null;

  return {
    hasOverdue: overdueCount > 0,
    overdueCount,
    overdueTotal,
    overdueItems: overdueList.map(o => ({ item: o.item, daysDiff: o.daysDiff })),
    hasUpcoming: upcomingCount > 0,
    upcomingCount,
    upcomingTotal,
    upcomingItems: upcomingList.map(u => ({ item: u.item, daysDiff: u.daysDiff })),
    mostUrgentItem,
  };
};

export interface GlobalPaymentAlerts {
  totalOverdueCount: number;
  totalOverdueAmount: number;
  totalUpcomingCount: number;
  totalUpcomingAmount: number;
  contractsWithOverdue: Contract[];
  contractsWithUpcoming: Contract[];
  allOverdueEntries: Array<{ contract: Contract; item: import('../types').PaymentScheduleItem; daysDiff: number }>;
  allUpcomingEntries: Array<{ contract: Contract; item: import('../types').PaymentScheduleItem; daysDiff: number }>;
}

export const getGlobalPaymentAlerts = (contracts: Contract[], upcomingDaysThreshold = 14): GlobalPaymentAlerts => {
  const activeContracts = contracts.filter(c => c.status !== 'PAGADO_CONCLUIDO');
  
  const allOverdueEntries: Array<{ contract: Contract; item: import('../types').PaymentScheduleItem; daysDiff: number }> = [];
  const allUpcomingEntries: Array<{ contract: Contract; item: import('../types').PaymentScheduleItem; daysDiff: number }> = [];
  const contractsWithOverdueSet = new Set<string>();
  const contractsWithUpcomingSet = new Set<string>();

  let totalOverdueAmount = 0;
  let totalUpcomingAmount = 0;

  activeContracts.forEach(contract => {
    const alerts = getContractPaymentAlerts(contract, upcomingDaysThreshold);

    if (alerts.hasOverdue) {
      contractsWithOverdueSet.add(contract.id);
      alerts.overdueItems.forEach(ov => {
        allOverdueEntries.push({
          contract,
          item: ov.item,
          daysDiff: ov.daysDiff,
        });
        totalOverdueAmount += (Number(ov.item.amount) || 0);
      });
    }

    if (alerts.hasUpcoming) {
      contractsWithUpcomingSet.add(contract.id);
      alerts.upcomingItems.forEach(up => {
        allUpcomingEntries.push({
          contract,
          item: up.item,
          daysDiff: up.daysDiff,
        });
        totalUpcomingAmount += (Number(up.item.amount) || 0);
      });
    }
  });

  // Sort: most overdue first, upcoming soonest first
  allOverdueEntries.sort((a, b) => a.daysDiff - b.daysDiff);
  allUpcomingEntries.sort((a, b) => a.daysDiff - b.daysDiff);

  const contractsWithOverdue = activeContracts.filter(c => contractsWithOverdueSet.has(c.id));
  const contractsWithUpcoming = activeContracts.filter(c => contractsWithUpcomingSet.has(c.id));

  return {
    totalOverdueCount: allOverdueEntries.length,
    totalOverdueAmount,
    totalUpcomingCount: allUpcomingEntries.length,
    totalUpcomingAmount,
    contractsWithOverdue,
    contractsWithUpcoming,
    allOverdueEntries,
    allUpcomingEntries,
  };
};

export const getNextUpcomingPayment = (contract: Contract): UpcomingPaymentInfo | null => {
  if (!contract.paymentSchedule || contract.paymentSchedule.length === 0) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter unpaid schedule items
  const unpaidItems = contract.paymentSchedule.filter(item => !item.isPaid);
  if (unpaidItems.length === 0) return null;

  // Sort by dueDate ascending
  const sorted = [...unpaidItems].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const nextItem = sorted[0];

  const due = new Date(nextItem.dueDate);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    item: nextItem,
    daysDiff,
    isOverdue: daysDiff < 0,
    isToday: daysDiff === 0,
  };
};

export const createScheduleItemWhatsAppReminderUrl = (
  contract: Contract, 
  item: import('../types').PaymentScheduleItem
): string => {
  const cleanPhone = contract.phone.replace(/[^\d+]/g, '');
  if (!cleanPhone) return '';

  const formattedDue = formatDate(item.dueDate);
  const message = `Estimado(a) ${contract.clientName},\n\nLe saludamos cordialmente de la empresa contratista respecto al contrato *${contract.contractNumber}* (*${contract.description}*).\n\nLe recordamos la fecha programada en su cronograma de pagos:\n• Concepto / Hito: *${item.title}*\n• Monto a Pagar: *${formatCurrency(item.amount)}*\n• Fecha de Vencimiento: *${formattedDue}*\n\nAgradecemos tomar las previsiones para la emisión oportuna de su comprobante.\n\n¡Muchas gracias!`;

  return `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(message)}`;
};

