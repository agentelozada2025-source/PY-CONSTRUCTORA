import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Contract, PaymentScheduleItem, Payment, Expense } from '../types';
import { 
  formatCurrency, 
  formatDate, 
  calculateFinancials, 
  formatExpenseCategory 
} from '../utils/formatters';

export interface PdfExportOptions {
  contracts: Contract[];
  title?: string;
  subtitle?: string;
  includeExecutiveSummary?: boolean;
  includeContractsTable?: boolean;
  includeDetailedBreakdown?: boolean;
  includePaymentSchedule?: boolean;
  includePaymentHistory?: boolean;
  includeExpenses?: boolean;
}

// Helper: Status label & clean text for PDF
const getStatusText = (status: string): string => {
  switch (status) {
    case 'PAGADO_CONCLUIDO':
      return 'PAGADO Y CONCLUIDO';
    case 'OBRA_TERMINADA':
      return 'OBRA CONCLUIDA (PENDIENTE)';
    case 'EN_EJECUCION':
      return 'EN EJECUCIÓN (CON SALDO)';
    default:
      return status;
  }
};

// Safe number formatting for PDF text
const formatMoneyPlain = (amount: number): string => {
  return 'S/ ' + (amount || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/**
 * Adds standard company header & footer on all pages
 */
const addHeaderAndFooter = (doc: jsPDF, title: string, subtitle?: string) => {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const nowStr = new Date().toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Top Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 18, 'F');

    // Accent line
    doc.setFillColor(2, 132, 199); // sky-600
    doc.rect(0, 18, pageWidth, 1.5, 'F');

    // Logo & App Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('OBRACONTROL', 14, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(186, 230, 253); // sky-200
    doc.text('•  Gestión Financiera, Cobranzas y Gastos de Obras', 50, 11);

    // Title / Subtitle on page 1
    if (i === 1) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(15, 23, 42);
      doc.text(title.toUpperCase(), 14, 28);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      const sub = subtitle || `Generado el ${nowStr} • Reporte Oficial del Sistema`;
      doc.text(sub, 14, 33.5);

      // Light separator line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(14, 36, pageWidth - 14, 36);
    }

    // Bottom Footer
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `ObraControl • Documento Confidencial de Control Interno • Emisión: ${nowStr}`,
      14,
      pageHeight - 7
    );

    const pageStr = `Página ${i} de ${pageCount}`;
    const pageStrWidth = doc.getTextWidth(pageStr);
    doc.text(pageStr, pageWidth - 14 - pageStrWidth, pageHeight - 7);
  }
};

/**
 * Exports Consolidated Financial Report PDF for all or selected contracts
 */
export const generateFinancialReportPdf = async (options: PdfExportOptions): Promise<jsPDF> => {
  const {
    contracts,
    title = 'ESTADO FINANCIERO Y RESUMEN DE CONTRATOS',
    subtitle,
    includeExecutiveSummary = true,
    includeContractsTable = true,
    includeDetailedBreakdown = false,
    includePaymentSchedule = true,
    includePaymentHistory = true,
    includeExpenses = true,
  } = options;

  // Initialize PDF in Portrait A4
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 40;

  // 1. Calculate Consolidated Global Financials
  let globalTotalContracted = 0;
  let globalTotalPaid = 0;
  let globalPendingBalance = 0;
  let globalTotalExpenses = 0;
  let globalNetProfit = 0;

  contracts.forEach((c) => {
    const fin = calculateFinancials(c);
    globalTotalContracted += fin.totalAmount;
    globalTotalPaid += fin.totalPaid;
    globalPendingBalance += fin.pendingBalance;
    globalTotalExpenses += fin.totalExpenses;
    globalNetProfit += fin.netProfit;
  });

  const globalProfitMargin =
    globalTotalPaid > 0 ? (globalNetProfit / globalTotalPaid) * 100 : 0;
  const globalCollectionRate =
    globalTotalContracted > 0 ? (globalTotalPaid / globalTotalContracted) * 100 : 0;

  // 2. Executive Summary Box / Cards (if requested)
  if (includeExecutiveSummary) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59);
    doc.text('RESUMEN EJECUTIVO CONSOLIDADO', 14, currentY);
    currentY += 4;

    const boxWidth = (pageWidth - 28 - 8) / 3;
    const boxHeight = 16;

    // Row 1: Total Contratado, Total Cobrado, Cuentas por Cobrar
    const cardsRow1 = [
      {
        label: 'MONTO TOTAL CONTRATADO',
        value: formatMoneyPlain(globalTotalContracted),
        color: [248, 250, 252], // slate-50
        borderColor: [203, 213, 225],
        textColor: [15, 23, 42],
        sub: `${contracts.length} contrato(s) analizados`,
      },
      {
        label: 'INGRESOS COBRADOS (REAL)',
        value: formatMoneyPlain(globalTotalPaid),
        color: [240, 253, 244], // emerald-50
        borderColor: [187, 247, 208],
        textColor: [21, 128, 61], // emerald-700
        sub: `Tasa cobranza: ${globalCollectionRate.toFixed(1)}%`,
      },
      {
        label: 'CUENTAS POR COBRAR',
        value: formatMoneyPlain(globalPendingBalance),
        color: [254, 242, 242], // rose-50
        borderColor: [254, 202, 202],
        textColor: [185, 28, 28], // rose-700
        sub: 'Saldo por recaudar',
      },
    ];

    cardsRow1.forEach((card, idx) => {
      const x = 14 + idx * (boxWidth + 4);
      doc.setFillColor(card.color[0], card.color[1], card.color[2]);
      doc.setDrawColor(card.borderColor[0], card.borderColor[1], card.borderColor[2]);
      doc.roundedRect(x, currentY, boxWidth, boxHeight, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(card.label, x + 3.5, currentY + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(card.textColor[0], card.textColor[1], card.textColor[2]);
      doc.text(card.value, x + 3.5, currentY + 10.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(card.sub, x + 3.5, currentY + 14);
    });

    currentY += boxHeight + 3.5;

    // Row 2: Gastos de Obra, Ganancia Neta Real, Rentabilidad
    const cardsRow2 = [
      {
        label: 'GASTOS TOTALES DE OBRA',
        value: formatMoneyPlain(globalTotalExpenses),
        color: [255, 247, 237], // orange-50
        borderColor: [254, 215, 170],
        textColor: [194, 65, 12], // orange-700
        sub: 'Materiales, mano de obra, equipos',
      },
      {
        label: 'GANANCIA NETA REALIZADA',
        value: formatMoneyPlain(globalNetProfit),
        color: globalNetProfit >= 0 ? [236, 253, 245] : [254, 242, 242],
        borderColor: globalNetProfit >= 0 ? [167, 243, 208] : [254, 202, 202],
        textColor: globalNetProfit >= 0 ? [4, 120, 87] : [185, 28, 28],
        sub: 'Cobros menos Gastos ejecutados',
      },
      {
        label: 'MARGEN DE RENTABILIDAD',
        value: `${globalProfitMargin.toFixed(1)}%`,
        color: [238, 242, 255], // indigo-50
        borderColor: [199, 210, 254],
        textColor: [67, 56, 202], // indigo-700
        sub: 'Margen real sobre cobrado',
      },
    ];

    cardsRow2.forEach((card, idx) => {
      const x = 14 + idx * (boxWidth + 4);
      doc.setFillColor(card.color[0], card.color[1], card.color[2]);
      doc.setDrawColor(card.borderColor[0], card.borderColor[1], card.borderColor[2]);
      doc.roundedRect(x, currentY, boxWidth, boxHeight, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(card.label, x + 3.5, currentY + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(card.textColor[0], card.textColor[1], card.textColor[2]);
      doc.text(card.value, x + 3.5, currentY + 10.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(card.sub, x + 3.5, currentY + 14);
    });

    currentY += boxHeight + 7;
  }

  // 3. Consolidated Contracts Comparison Table
  if (includeContractsTable) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('DETALLE COMPARATIVO DE CONTRATOS Y ESTADO DE CUENTAS', 14, currentY);
    currentY += 2;

    const tableHeaders = [
      ['N° Contrato', 'Cliente / Doc', 'Estado', 'Monto (S/)', 'Cobrado (S/)', 'Saldo (S/)', 'Gastos (S/)', 'Ganancia (S/)', 'Margen'],
    ];

    const tableBody = contracts.map((c) => {
      const fin = calculateFinancials(c);
      return [
        c.contractNumber,
        `${c.clientName}\n${c.docType}: ${c.docNumber}`,
        getStatusText(c.status),
        (fin.totalAmount || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 }),
        (fin.totalPaid || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 }),
        (fin.pendingBalance || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 }),
        (fin.totalExpenses || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 }),
        (fin.netProfit || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 }),
        `${fin.profitMarginPercent.toFixed(1)}%`,
      ];
    });

    // Totals row at the bottom
    const tableFoot = [
      [
        'TOTALES',
        `${contracts.length} Contratos`,
        '-',
        globalTotalContracted.toLocaleString('es-PE', { minimumFractionDigits: 2 }),
        globalTotalPaid.toLocaleString('es-PE', { minimumFractionDigits: 2 }),
        globalPendingBalance.toLocaleString('es-PE', { minimumFractionDigits: 2 }),
        globalTotalExpenses.toLocaleString('es-PE', { minimumFractionDigits: 2 }),
        globalNetProfit.toLocaleString('es-PE', { minimumFractionDigits: 2 }),
        `${globalProfitMargin.toFixed(1)}%`,
      ],
    ];

    autoTable(doc, {
      startY: currentY,
      head: tableHeaders,
      body: tableBody,
      foot: tableFoot,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 2,
        textColor: [30, 41, 59],
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [15, 23, 42], // slate-900
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
      footStyles: {
        fillColor: [241, 245, 249], // slate-100
        textColor: [15, 23, 42],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold', cellWidth: 20 },
        1: { halign: 'left', cellWidth: 38 },
        2: { halign: 'center', cellWidth: 26, fontSize: 6.5 },
        3: { halign: 'right', cellWidth: 17 },
        4: { halign: 'right', cellWidth: 17, textColor: [21, 128, 61] },
        5: { halign: 'right', cellWidth: 17, textColor: [185, 28, 28] },
        6: { halign: 'right', cellWidth: 17, textColor: [194, 65, 12] },
        7: { halign: 'right', cellWidth: 17, fontStyle: 'bold' },
        8: { halign: 'center', cellWidth: 12 },
      },
      margin: { left: 14, right: 14, bottom: 16 },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || currentY + 40;
    currentY = finalY + 8;
  }

  // 4. Detailed Breakdown Per Contract (if requested)
  if (includeDetailedBreakdown && contracts.length > 0) {
    for (let cIdx = 0; cIdx < contracts.length; cIdx++) {
      const c = contracts[cIdx];
      const fin = calculateFinancials(c);

      // Start each contract on a new page if we already wrote tables or if currentY > 200
      if (currentY > 180 || includeContractsTable) {
        doc.addPage();
        currentY = 28;
      }

      // Contract Sub-header Box
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, currentY, pageWidth - 28, 22, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`CONTRATO N° ${c.contractNumber} — ${c.clientName}`, 18, currentY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(
        `Documento: ${c.docType} ${c.docNumber}   •   Tel: ${c.phone}${c.location ? `   •   Ubicación: ${c.location}` : ''}`,
        18,
        currentY + 11
      );
      doc.text(
        `Obra / Detalle: ${c.description || 'Sin descripción'}   •   Inicio: ${formatDate(c.startDate)}   •   Estado: ${getStatusText(c.status)}`,
        18,
        currentY + 16
      );

      // Quick numbers badge on right
      const rightX = pageWidth - 60;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(2, 132, 199);
      doc.text(`Contratado: ${formatMoneyPlain(fin.totalAmount)}`, rightX, currentY + 6);
      doc.setTextColor(21, 128, 61);
      doc.text(`Cobrado: ${formatMoneyPlain(fin.totalPaid)}`, rightX, currentY + 11);
      doc.setTextColor(fin.pendingBalance > 0 ? 185 : 71, fin.pendingBalance > 0 ? 28 : 85, fin.pendingBalance > 0 ? 28 : 105);
      doc.text(`Saldo Pendiente: ${formatMoneyPlain(fin.pendingBalance)}`, rightX, currentY + 16);

      currentY += 26;

      // 4a. Cronograma de Pagos (Payment Schedule)
      if (includePaymentSchedule && c.paymentSchedule && c.paymentSchedule.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text('1. CRONOGRAMA DE PAGOS / HITOS PACTADOS', 14, currentY);
        currentY += 2;

        const schedHead = [['Hito / Concepto', 'Fecha Vencimiento', 'Monto Pactado', 'Estado', 'Último Recordatorio']];
        const schedBody = c.paymentSchedule.map((item) => [
          item.title,
          formatDate(item.dueDate),
          formatMoneyPlain(item.amount),
          item.isPaid ? 'PAGADO' : 'PENDIENTE',
          item.lastReminderSentAt ? `Enviado: ${formatDate(item.lastReminderSentAt)}` : 'Sin recordatorio',
        ]);

        autoTable(doc, {
          startY: currentY,
          head: schedHead,
          body: schedBody,
          theme: 'striped',
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
          columnStyles: {
            0: { cellWidth: 60, fontStyle: 'bold' },
            1: { cellWidth: 32, halign: 'center' },
            2: { cellWidth: 30, halign: 'right' },
            3: { cellWidth: 26, halign: 'center' },
            4: { cellWidth: 34, halign: 'center', fontSize: 6.5 },
          },
          margin: { left: 14, right: 14, bottom: 16 },
        });

        currentY = (doc as any).lastAutoTable?.finalY + 6;
      }

      // 4b. Historial de Abonos / Cobros Realizados
      if (includePaymentHistory && c.payments && c.payments.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text('2. HISTORIAL DE ABONOS RECIBIDOS', 14, currentY);
        currentY += 2;

        const payHead = [['Fecha', 'Monto Cobrado', 'Medio de Pago', 'N° Operación / Referencia', 'Comprobante / Váucher', 'Notas']];
        const payBody = c.payments.map((p) => [
          formatDate(p.date),
          formatMoneyPlain(p.amount),
          p.method,
          p.reference || '-',
          p.receiptFile ? `Adjunto (${p.receiptFile.name})` : 'Sin comprobante',
          p.notes || '-',
        ]);

        autoTable(doc, {
          startY: currentY,
          head: payHead,
          body: payBody,
          theme: 'striped',
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [4, 120, 87], textColor: [255, 255, 255], fontStyle: 'bold' },
          columnStyles: {
            0: { cellWidth: 24, halign: 'center' },
            1: { cellWidth: 28, halign: 'right', fontStyle: 'bold', textColor: [21, 128, 61] },
            2: { cellWidth: 26, halign: 'center' },
            3: { cellWidth: 36, halign: 'left' },
            4: { cellWidth: 38, halign: 'left', fontSize: 6.5 },
            5: { cellWidth: 30, halign: 'left' },
          },
          margin: { left: 14, right: 14, bottom: 16 },
        });

        currentY = (doc as any).lastAutoTable?.finalY + 6;
      }

      // 4c. Registro de Gastos y Facturas de Obra
      if (includeExpenses && c.expenses && c.expenses.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text('3. GASTOS DE OBRA Y FACTURAS ASOCIADAS', 14, currentY);
        currentY += 2;

        const expHead = [['Fecha', 'Rubro / Categoría', 'Descripción / Proveedor', 'Monto Gasto', 'N° Factura / Boleta', 'Doc. Adjunto']];
        const expBody = c.expenses.map((e) => {
          const cat = formatExpenseCategory(e.category);
          return [
            formatDate(e.date),
            cat.label,
            e.supplier ? `${e.description}\nProv: ${e.supplier}` : e.description,
            formatMoneyPlain(e.amount),
            e.invoiceNumber || '-',
            e.invoiceFile ? `Adjunto (${e.invoiceFile.name})` : 'Sin factura física',
          ];
        });

        autoTable(doc, {
          startY: currentY,
          head: expHead,
          body: expBody,
          theme: 'striped',
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [194, 65, 12], textColor: [255, 255, 255], fontStyle: 'bold' },
          columnStyles: {
            0: { cellWidth: 22, halign: 'center' },
            1: { cellWidth: 36, halign: 'left' },
            2: { cellWidth: 46, halign: 'left' },
            3: { cellWidth: 28, halign: 'right', fontStyle: 'bold', textColor: [194, 65, 12] },
            4: { cellWidth: 26, halign: 'center' },
            5: { cellWidth: 24, halign: 'left', fontSize: 6.5 },
          },
          margin: { left: 14, right: 14, bottom: 16 },
        });

        currentY = (doc as any).lastAutoTable?.finalY + 8;
      }
    }
  }

  // Finalize: Add standard headers and footers with accurate total page count
  addHeaderAndFooter(doc, title, subtitle);

  return doc;
};

/**
 * Exports a Single Detailed Contract Dossier PDF
 */
export const generateSingleContractDossierPdf = async (contract: Contract): Promise<jsPDF> => {
  return generateFinancialReportPdf({
    contracts: [contract],
    title: `DOSSIER FINANCIERO: CONTRATO ${contract.contractNumber}`,
    subtitle: `Cliente: ${contract.clientName} (${contract.docType} ${contract.docNumber}) • Emisión: ${new Date().toLocaleDateString('es-PE')}`,
    includeExecutiveSummary: true,
    includeContractsTable: true,
    includeDetailedBreakdown: true,
    includePaymentSchedule: true,
    includePaymentHistory: true,
    includeExpenses: true,
  });
};

/**
 * Downloads the generated PDF with a sanitized, friendly file name
 */
export const downloadPdfDocument = (doc: jsPDF, filename: string): void => {
  const safeName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  doc.save(safeName);
};
