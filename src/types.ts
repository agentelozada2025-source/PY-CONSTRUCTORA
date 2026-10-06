export type ContractStatus = 
  | 'EN_EJECUCION'        // En Ejecución (Con Saldo Pendiente)
  | 'OBRA_TERMINADA'      // Obra Concluida (Pendiente Cobro)
  | 'PAGADO_CONCLUIDO';   // Contrato Pagado y Concluido

export type PaymentMethod = 
  | 'Yape'
  | 'Plin'
  | 'Transferencia Bancaria'
  | 'Efectivo'
  | 'Cheque'
  | 'Otro';

export type ExpenseCategory = 
  | 'MATERIALES'           // Cemento, fierro, agregados, tuberías, pintura
  | 'MANO_DE_OBRA'         // Jornales, cuadrillas, maestros albañiles, técnicos
  | 'EQUIPOS_HERRAMIENTAS' // Alquiler trompos, andamios, rotomartillos, herramientas
  | 'TRANSPORTE_LOGISTICA' // Fletes, acarreos, combustible, mudanzas
  | 'SUBCONTRATOS'         // Drywallistas, vidrieros, gasfiteros externos
  | 'OTROS';               // EPPs, permisos, viáticos, varios

export interface PaymentScheduleItem {
  id: string;
  title: string; // ej. "Anticipo de inicio (40%)" o "Valorización 1"
  dueDate: string; // YYYY-MM-DD
  amount: number; // S/
  isPaid?: boolean;
  notes?: string;
  lastReminderSentAt?: string;
  reminderCount?: number;
}

export interface FileAttachment {
  name: string;
  type: string; // 'application/pdf' | 'image/jpeg' | 'image/png' | etc.
  size: number;
  dataUrl: string; // Base64 data URL
  uploadedAt: string;
  driveFileId?: string; // ID del archivo guardado en Google Drive
  driveUrl?: string; // Enlace para ver en Google Drive
}

export interface Payment {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  method: PaymentMethod;
  reference: string; // N° de Operación o voucher
  receiptFile?: FileAttachment; // Voucher de dinero (legacy/general)
  voucherFile?: FileAttachment; // Voucher del dinero ingresado (transferencia bancaria, Yape, Plin)
  invoiceFile?: FileAttachment; // Comprobante emitido (factura/boleta electrónica emitida al cliente)
  invoiceNumber?: string; // N° de factura o boleta emitida (ej. F001-000452)
  notes?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  description: string; // ej. "Compra de 50 bolsas de cemento Sol y arena gruesa"
  supplier: string; // Proveedor o Razón Social (ej. Ferretería El Maestro S.A.C.)
  invoiceNumber: string; // ej. F001-004523, B002-120 o Recibo 981
  amount: number; // S/
  paymentMethod: PaymentMethod;
  invoiceFile?: FileAttachment; // Comprobante de gasto (factura o boleta de compra del proveedor)
  voucherFile?: FileAttachment; // Voucher de pago al proveedor (constancia de transferencia o Yape)
  receiptFile?: FileAttachment; // legacy/general
  notes?: string;
  createdAt: string;
}

export interface FinalInvoice {
  invoiceNumber: string; // ej. E001-45 o F001-000123
  issueDate: string; // YYYY-MM-DD
  file?: FileAttachment;
  notes?: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  contractNumber: string; // ej. CONT-2026-001
  clientName: string;
  docType: 'DNI' | 'RUC';
  docNumber: string;
  phone: string;
  clientEmail?: string;
  location?: string; // Ubicación o dirección de la obra (ej. "San Isidro, Lima", "Surco")
  description: string;
  startDate: string;
  estimatedEndDate: string;
  totalAmount: number; // S/ Soles
  status: ContractStatus;
  statusNotes?: string; // Observaciones de estado situacional y avance de obra
  contractFile?: FileAttachment;
  payments: Payment[];
  expenses?: Expense[]; // Gastos operativos directos de la obra
  paymentSchedule?: PaymentScheduleItem[];
  invoice?: FinalInvoice | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContractFinancials {
  totalAmount: number;
  totalPaid: number;
  pendingBalance: number;
  progressPercent: number;
  paymentCount: number;
  isFullyPaid: boolean;
  totalExpenses: number; // Suma de todos los gastos del contrato
  expenseCount: number;
  netProfit: number; // Total Cobrado a la fecha - Total Gastos
  profitMarginPercent: number; // (netProfit / totalPaid) * 100
  projectedProfit: number; // Total Contratado - Total Gastos
  projectedMarginPercent: number; // (projectedProfit / totalAmount) * 100
}

export interface FilterState {
  search: string;
  status: 'ALL' | ContractStatus;
  sortBy: 'date-desc' | 'date-asc' | 'amount-desc' | 'balance-desc';
}

export interface EmailNotificationConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
  senderName: string;
  senderEmail: string;
  bankDetails: string;
  autoRemindDaysBefore: number; // Días de anticipación (ej. 3 días)
  autoRemindEnabled: boolean; // Envío o recordatorio automático activado
}

export interface EmailNotificationLog {
  id: string;
  contractId: string;
  contractNumber: string;
  clientName: string;
  clientEmail: string;
  milestoneTitle: string;
  dueDate: string;
  amount: number;
  sentAt: string;
  status: 'SENT' | 'FAILED' | 'SIMULATED';
  provider: 'EMAILJS' | 'MOCK';
  errorMessage?: string;
}
