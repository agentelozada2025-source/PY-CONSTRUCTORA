import { Contract } from '../types';
export { calculateFinancials, calculateContractFinancials } from './formatters';

const DB_NAME = 'ObraControlDB';
const DB_VERSION = 1;
const STORE_NAME = 'contracts';
const LOCAL_STORAGE_KEY = 'obra_control_contracts_v1';

// Open IndexedDB connection
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Fallback to localStorage
function getLocalFallback(): Contract[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalFallback(contracts: Contract[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(contracts));
  } catch (e) {
    console.warn('localStorage save failed', e);
  }
}

export async function getAllContracts(): Promise<Contract[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const result = (req.result as Contract[]) || [];
        // If IndexedDB is empty, check fallback
        if (result.length === 0) {
          const fallback = getLocalFallback();
          resolve(fallback);
        } else {
          resolve(result);
        }
      };

      req.onerror = () => {
        resolve(getLocalFallback());
      };
    });
  } catch {
    return getLocalFallback();
  }
}

export async function saveContract(contract: Contract): Promise<void> {
  // Sync fallback
  const current = getLocalFallback();
  const index = current.findIndex(c => c.id === contract.id);
  if (index >= 0) {
    current[index] = contract;
  } else {
    current.unshift(contract);
  }
  setLocalFallback(current);

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(contract);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Already saved in fallback
  }
}

export async function deleteContract(id: string): Promise<void> {
  // Sync fallback
  const current = getLocalFallback().filter(c => c.id !== id);
  setLocalFallback(current);

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Already deleted from fallback
  }
}

export async function replaceAllContracts(contracts: Contract[]): Promise<void> {
  setLocalFallback(contracts);

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const clearReq = store.clear();

      clearReq.onsuccess = () => {
        let count = 0;
        if (contracts.length === 0) {
          resolve();
          return;
        }
        contracts.forEach(contract => {
          store.put(contract).onsuccess = () => {
            count++;
            if (count === contracts.length) {
              resolve();
            }
          };
        });
      };

      clearReq.onerror = () => reject(clearReq.error);
    });
  } catch {
    // Fallback handled
  }
}

// Convert SVG sample to DataURL for demo vouchers
function createSampleSvgDataUrl(title: string, subtitle: string, amount: string, code: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="850" viewBox="0 0 600 850">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
        <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="600" height="850" fill="#f8fafc" rx="16"/>
    <rect width="600" height="150" fill="url(#grad)" rx="16"/>
    <circle cx="300" cy="150" r="45" fill="#ffffff" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))"/>
    <path d="M285 150 L295 160 L315 140" stroke="#10b981" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <text x="300" y="70" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="#ffffff" text-anchor="middle">${title}</text>
    <text x="300" y="105" font-family="Arial, sans-serif" font-size="16" fill="#e2e8f0" text-anchor="middle">${subtitle}</text>
    
    <text x="300" y="240" font-family="Arial, sans-serif" font-size="18" fill="#64748b" text-anchor="middle">Monto Transferido / Abonado</text>
    <text x="300" y="295" font-family="Arial, sans-serif" font-size="44" font-weight="bold" fill="#0f172a" text-anchor="middle">${amount}</text>
    
    <rect x="50" y="340" width="500" height="2" fill="#e2e8f0"/>
    
    <g transform="translate(60, 380)">
      <text x="0" y="0" font-family="Arial, sans-serif" font-size="14" fill="#64748b">N° de Operación</text>
      <text x="480" y="0" font-family="Courier, monospace" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="end">${code}</text>
      
      <text x="0" y="45" font-family="Arial, sans-serif" font-size="14" fill="#64748b">Destino / Beneficiario</text>
      <text x="480" y="45" font-family="Arial, sans-serif" font-size="15" font-weight="600" fill="#0f172a" text-anchor="end">CONTRATISTA GENERAL S.A.C.</text>

      <text x="0" y="90" font-family="Arial, sans-serif" font-size="14" fill="#64748b">Cuenta Origen</text>
      <text x="480" y="90" font-family="Courier, monospace" font-size="15" fill="#334155" text-anchor="end">**** **** 4819</text>

      <text x="0" y="135" font-family="Arial, sans-serif" font-size="14" fill="#64748b">Canal</text>
      <text x="480" y="135" font-family="Arial, sans-serif" font-size="15" font-weight="600" fill="#7c3aed" text-anchor="end">Banca Móvil / Pago Digital</text>

      <text x="0" y="180" font-family="Arial, sans-serif" font-size="14" fill="#64748b">Estado Transacción</text>
      <text x="480" y="180" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#059669" text-anchor="end">CONFORME / EXITOSO</text>
    </g>

    <rect x="60" y="600" width="480" height="80" rx="8" fill="#f1f5f9" stroke="#cbd5e1" stroke-dasharray="4"/>
    <text x="300" y="645" font-family="Arial, sans-serif" font-size="14" fill="#475569" text-anchor="middle">Comprobante emitido como constancia de abono</text>

    <text x="300" y="790" font-family="Arial, sans-serif" font-size="12" fill="#94a3b8" text-anchor="middle">ObraControl - Verificación de Constancia Digital</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function generateDemoContracts(): Contract[] {
  const voucherYape1 = createSampleSvgDataUrl('Yape Móvil', 'Constancia de Pago Digital', 'S/ 5,000.00', 'OP-782914', '#742284');
  const voucherBanco1 = createSampleSvgDataUrl('BCP Transferencia', 'Comprobante Inmediato', 'S/ 12,500.00', 'OP-98124501', '#002a8f');
  const voucherYape2 = createSampleSvgDataUrl('Yape Empresas', 'Pago de Adelanto 50%', 'S/ 9,000.00', 'OP-642199', '#742284');
  const voucherFinal2 = createSampleSvgDataUrl('Interbank Transferencia', 'Cancelación Saldo 50%', 'S/ 9,000.00', 'OP-331092', '#0039a6');

  const contractDocSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="850" viewBox="0 0 600 850">
    <rect width="600" height="850" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
    <rect x="50" y="40" width="500" height="60" fill="#0f172a" rx="4"/>
    <text x="300" y="78" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">CONTRATO DE LOCACIÓN DE OBRA Y SERVICIOS</text>
    <text x="70" y="140" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#334155">CLÁUSULA PRIMERA: DE LAS PARTES</text>
    <text x="70" y="165" font-family="Arial, sans-serif" font-size="12" fill="#475569">Conste por el presente documento el contrato de ejecución de obra celebrado entre el Cliente</text>
    <text x="70" y="185" font-family="Arial, sans-serif" font-size="12" fill="#475569">y el Contratista General para la prestación de servicios especializados según especificaciones técnicas.</text>
    <text x="70" y="230" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#334155">CLÁUSULA SEGUNDA: DEL MONTO Y FORMA DE PAGO</text>
    <text x="70" y="255" font-family="Arial, sans-serif" font-size="12" fill="#475569">El monto total pactado se liquidará mediante pagos parciales o valorizaciones contra entrega de comprobante.</text>
    <rect x="70" y="320" width="460" height="150" fill="#f8fafc" stroke="#e2e8f0"/>
    <text x="300" y="380" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="middle">DOCUMENTO FIRMADO Y NOTARIADO DIGITALMENTE</text>
    <circle cx="300" cy="425" r="20" fill="#10b981"/>
    <path d="M292 425 L298 431 L310 417" stroke="#ffffff" stroke-width="3" fill="none"/>
    <g transform="translate(100, 680)">
      <line x1="0" y1="0" x2="160" y2="0" stroke="#0f172a" stroke-width="1.5"/>
      <text x="80" y="20" font-family="Arial, sans-serif" font-size="11" fill="#475569" text-anchor="middle">FIRMA DEL CLIENTE</text>
    </g>
    <g transform="translate(340, 680)">
      <line x1="0" y1="0" x2="160" y2="0" stroke="#0f172a" stroke-width="1.5"/>
      <text x="80" y="20" font-family="Arial, sans-serif" font-size="11" fill="#475569" text-anchor="middle">FIRMA DEL CONTRATISTA</text>
    </g>
  </svg>`;
  const contractDocUrl = `data:image/svg+xml;utf8,${encodeURIComponent(contractDocSvg)}`;

  const invoiceDocSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="850" viewBox="0 0 600 850">
    <rect width="600" height="850" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
    <rect x="360" y="40" width="200" height="110" fill="#f8fafc" stroke="#0284c7" stroke-width="2" rx="6"/>
    <text x="460" y="70" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="middle">R.U.C. 20608976541</text>
    <text x="460" y="95" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#0284c7" text-anchor="middle">FACTURA ELECTRÓNICA</text>
    <text x="460" y="125" font-family="Courier, monospace" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="middle">F001-000452</text>
    
    <text x="50" y="65" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#0f172a">CONTRATISTAS Y SERVICIOS INTEGRALES</text>
    <text x="50" y="90" font-family="Arial, sans-serif" font-size="12" fill="#64748b">Av. Canaval y Moreyra 480, San Isidro - Lima</text>
    <text x="50" y="110" font-family="Arial, sans-serif" font-size="12" fill="#64748b">consultas@contratistaservicios.pe | Telf: (01) 480-9900</text>

    <rect x="50" y="170" width="510" height="75" fill="#f1f5f9" rx="4"/>
    <text x="65" y="195" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#334155">SEÑOR(ES): ALFARO & ASOCIADOS INVERSIONES S.A.C.</text>
    <text x="65" y="215" font-family="Arial, sans-serif" font-size="12" fill="#475569">RUC: 20556789123 | FECHA EMISIÓN: 28/09/2026</text>
    <text x="65" y="235" font-family="Arial, sans-serif" font-size="12" fill="#475569">DIRECCIÓN: Av. Benavides 1230, Miraflores</text>

    <rect x="50" y="260" width="510" height="30" fill="#0f172a"/>
    <text x="70" y="280" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#ffffff">DESCRIPCIÓN DEL SERVICIO</text>
    <text x="480" y="280" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#ffffff">IMPORTE</text>

    <text x="70" y="320" font-family="Arial, sans-serif" font-size="12" fill="#0f172a">Servicio de remodelación e instalación de tabiquería drywall</text>
    <text x="480" y="320" font-family="Courier, monospace" font-size="13" font-weight="bold" fill="#0f172a">S/ 18,000.00</text>

    <line x1="50" y1="520" x2="560" y2="520" stroke="#e2e8f0"/>
    <g transform="translate(340, 540)">
      <text x="0" y="20" font-family="Arial, sans-serif" font-size="13" fill="#64748b">SUBTOTAL:</text>
      <text x="180" y="20" font-family="Courier, monospace" font-size="13" fill="#0f172a" text-anchor="end">S/ 15,254.24</text>
      <text x="0" y="45" font-family="Arial, sans-serif" font-size="13" fill="#64748b">I.G.V. (18%):</text>
      <text x="180" y="45" font-family="Courier, monospace" font-size="13" fill="#0f172a" text-anchor="end">S/ 2,745.76</text>
      <line x1="0" y1="55" x2="180" y2="55" stroke="#cbd5e1"/>
      <text x="0" y="80" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">TOTAL NETO:</text>
      <text x="180" y="80" font-family="Courier, monospace" font-size="16" font-weight="bold" fill="#059669" text-anchor="end">S/ 18,000.00</text>
    </g>

    <rect x="50" y="650" width="510" height="60" fill="#ecfdf5" stroke="#a7f3d0" rx="4"/>
    <text x="300" y="685" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#047857" text-anchor="middle">CANCELADA EN SU TOTALIDAD - RETENCIÓN APLICADA</text>
  </svg>`;
  const invoiceDocUrl = `data:image/svg+xml;utf8,${encodeURIComponent(invoiceDocSvg)}`;

  const contract1: Contract = {
    id: 'demo-cont-001',
    contractNumber: 'CONT-2026-001',
    clientName: 'Constructora & Inmobiliaria Los Robles S.A.C.',
    docType: 'RUC',
    docNumber: '20601894231',
    phone: '+51 984 512 870',
    clientEmail: 'administracion@losroblesinmobiliaria.pe',
    location: 'San Isidro, Lima (Torre Residencial)',
    description: 'Instalación de sistema hidroneumático, tuberías de PPR y bombas centrífugas en Torre Residencial San Isidro (Etapa 2)',
    startDate: '2026-08-10',
    estimatedEndDate: '2026-10-25',
    totalAmount: 35000,
    status: 'EN_EJECUCION',
    statusNotes: 'Obra en ejecución al 60% de avance físico. Montaje de tuberías troncales completado. En proceso de instalación de bombas y tableros alternadores.',
    contractFile: {
      name: 'Contrato_Firmado_CONT-2026-001.pdf',
      type: 'image/svg+xml',
      size: 42800,
      dataUrl: contractDocUrl,
      uploadedAt: '2026-08-10T09:30:00.000Z',
    },
    payments: [
      {
        id: 'pay-001',
        date: '2026-08-12',
        amount: 5000,
        method: 'Yape',
        reference: 'OP-782914',
        receiptFile: {
          name: 'Voucher_Yape_Adelanto_S5000.jpg',
          type: 'image/svg+xml',
          size: 18500,
          dataUrl: voucherYape1,
          uploadedAt: '2026-08-12T10:15:00.000Z',
        },
        voucherFile: {
          name: 'Voucher_Yape_Adelanto_S5000.jpg',
          type: 'image/svg+xml',
          size: 18500,
          dataUrl: voucherYape1,
          uploadedAt: '2026-08-12T10:15:00.000Z',
        },
        invoiceFile: {
          name: 'Boleta_Venta_B001-000124.pdf',
          type: 'image/svg+xml',
          size: 24500,
          dataUrl: invoiceDocUrl,
          uploadedAt: '2026-08-12T10:20:00.000Z',
        },
        invoiceNumber: 'B001-000124',
        notes: 'Adelanto para compra de tuberías y accesorios iniciales',
        createdAt: '2026-08-12T10:15:00.000Z',
      },
      {
        id: 'pay-002',
        date: '2026-09-04',
        amount: 12500,
        method: 'Transferencia Bancaria',
        reference: 'OP-98124501',
        receiptFile: {
          name: 'Comprobante_BCP_Valorizacion1.pdf',
          type: 'image/svg+xml',
          size: 21400,
          dataUrl: voucherBanco1,
          uploadedAt: '2026-09-04T16:20:00.000Z',
        },
        voucherFile: {
          name: 'Comprobante_BCP_Valorizacion1.pdf',
          type: 'image/svg+xml',
          size: 21400,
          dataUrl: voucherBanco1,
          uploadedAt: '2026-09-04T16:20:00.000Z',
        },
        invoiceFile: {
          name: 'Factura_Emitida_F001-000452.pdf',
          type: 'image/svg+xml',
          size: 36500,
          dataUrl: invoiceDocUrl,
          uploadedAt: '2026-09-04T16:25:00.000Z',
        },
        invoiceNumber: 'F001-000452',
        notes: 'Primera valorización de avance de obra (40% de avance físico)',
        createdAt: '2026-09-04T16:20:00.000Z',
      }
    ],
    expenses: [
      {
        id: 'exp-001',
        date: '2026-08-14',
        category: 'MATERIALES',
        supplier: 'Distribuidora Hidráulica del Perú S.A.C.',
        invoiceNumber: 'F001-004512',
        description: 'Tuberías de PPR termo-fusión 2", codos 90° y válvulas esferas pesadas',
        amount: 3850,
        paymentMethod: 'Transferencia Bancaria',
        invoiceFile: {
          name: 'Factura_Materiales_PPR_F001-004512.pdf',
          type: 'image/svg+xml',
          size: 36500,
          dataUrl: invoiceDocUrl,
          uploadedAt: '2026-08-14T11:00:00.000Z',
        },
        voucherFile: {
          name: 'Voucher_Pago_Transferencia_F001-004512.pdf',
          type: 'image/svg+xml',
          size: 21400,
          dataUrl: voucherBanco1,
          uploadedAt: '2026-08-14T11:05:00.000Z',
        },
        notes: 'Materiales puestos en obra con guía de remisión N° 001-4412',
        createdAt: '2026-08-14T11:00:00.000Z',
      },
      {
        id: 'exp-002',
        date: '2026-08-30',
        category: 'MANO_DE_OBRA',
        supplier: 'Cuadrilla Maestro Juan Ramos',
        invoiceNumber: 'RH-002-140',
        description: 'Planilla quincenal de gasfiteros y montajistas hidroneumáticos',
        amount: 4200,
        paymentMethod: 'Yape',
        invoiceFile: {
          name: 'Recibo_Honorarios_ManoObra.pdf',
          type: 'image/svg+xml',
          size: 21000,
          dataUrl: voucherYape2,
          uploadedAt: '2026-08-30T17:00:00.000Z',
        },
        voucherFile: {
          name: 'Voucher_Yape_Pago_Cuadrilla.jpg',
          type: 'image/svg+xml',
          size: 18500,
          dataUrl: voucherYape1,
          uploadedAt: '2026-08-30T17:05:00.000Z',
        },
        notes: 'Pago quincena agosto con firma de cuaderno de asistencia',
        createdAt: '2026-08-30T17:00:00.000Z',
      },
      {
        id: 'exp-003',
        date: '2026-09-02',
        category: 'EQUIPOS_HERRAMIENTAS',
        supplier: 'Alquileres MaqPerú S.A.C.',
        invoiceNumber: 'F002-1205',
        description: 'Alquiler de termofusora digital y bomba manual para prueba hidrostática',
        amount: 950,
        paymentMethod: 'Transferencia Bancaria',
        notes: 'Alquiler por 10 días de calibración',
        createdAt: '2026-09-02T09:30:00.000Z',
      }
    ],
    paymentSchedule: [
      {
        id: 'sch-001',
        title: 'Adelanto inicial de replanteo (15%)',
        dueDate: '2026-08-12',
        amount: 5000,
        isPaid: true,
        notes: 'Cancelado mediante Yape'
      },
      {
        id: 'sch-002',
        title: 'Primera valorización por avance (35%)',
        dueDate: '2026-09-04',
        amount: 12500,
        isPaid: true,
        notes: 'Transferencia BCP recibida'
      },
      {
        id: 'sch-003',
        title: 'Segunda valorización y montaje electromecánico (30%)',
        dueDate: '2026-09-28',
        amount: 10000,
        isPaid: false,
        notes: 'Pendiente de cobro a la instalación de bombas'
      },
      {
        id: 'sch-004',
        title: 'Saldo final contra entrega y actas (20%)',
        dueDate: '2026-10-25',
        amount: 7500,
        isPaid: false,
        notes: 'Liquidación con entrega de conformidad'
      }
    ],
    invoice: null,
    createdAt: '2026-08-10T09:00:00.000Z',
    updatedAt: '2026-09-04T16:20:00.000Z',
  };

  const contract2: Contract = {
    id: 'demo-cont-002',
    contractNumber: 'CONT-2026-002',
    clientName: 'Alfaro & Asociados Inversiones S.A.C.',
    docType: 'RUC',
    docNumber: '20556789123',
    phone: '+51 991 234 567',
    clientEmail: 'finanzas@alfaroinversiones.com',
    location: 'Santiago de Surco, Lima (Centro Empresarial)',
    description: 'Remodelación integral de oficinas administrativas, tabiquería acústica Drywall, iluminación LED y pintura general',
    startDate: '2026-08-01',
    estimatedEndDate: '2026-09-20',
    totalAmount: 18000,
    status: 'PAGADO_CONCLUIDO',
    contractFile: {
      name: 'Contrato_Alfaro_Oficinas_Firmado.pdf',
      type: 'image/svg+xml',
      size: 45100,
      dataUrl: contractDocUrl,
      uploadedAt: '2026-08-01T08:00:00.000Z',
    },
    payments: [
      {
        id: 'pay-101',
        date: '2026-08-02',
        amount: 9000,
        method: 'Yape',
        reference: 'OP-642199',
        receiptFile: {
          name: 'Voucher_Yape_Adelanto_50.jpg',
          type: 'image/svg+xml',
          size: 19200,
          dataUrl: voucherYape2,
          uploadedAt: '2026-08-02T11:00:00.000Z',
        },
        notes: '50% inicial al replanteo y firma de contrato',
        createdAt: '2026-08-02T11:00:00.000Z',
      },
      {
        id: 'pay-102',
        date: '2026-09-25',
        amount: 9000,
        method: 'Transferencia Bancaria',
        reference: 'OP-331092',
        receiptFile: {
          name: 'Voucher_Interbank_Cancelacion.pdf',
          type: 'image/svg+xml',
          size: 20100,
          dataUrl: voucherFinal2,
          uploadedAt: '2026-09-25T17:45:00.000Z',
        },
        notes: 'Cancelación del 50% restante tras acta de entrega y conformidad de obra',
        createdAt: '2026-09-25T17:45:00.000Z',
      }
    ],
    expenses: [
      {
        id: 'exp-101',
        date: '2026-08-04',
        category: 'MATERIALES',
        supplier: 'Promart Homecenter S.A.',
        invoiceNumber: 'F001-007890',
        description: 'Placas de yeso Drywall ST 1/2", parantes, rieles galvanizados y tornillos punta fina',
        amount: 5800,
        paymentMethod: 'Transferencia Bancaria',
        invoiceFile: {
          name: 'Factura_Promart_Drywall.pdf',
          type: 'image/svg+xml',
          size: 38200,
          dataUrl: invoiceDocUrl,
          uploadedAt: '2026-08-04T14:30:00.000Z',
        },
        notes: 'Materiales entregados en oficinas del cliente',
        createdAt: '2026-08-04T14:30:00.000Z',
      },
      {
        id: 'exp-102',
        date: '2026-08-25',
        category: 'MANO_DE_OBRA',
        supplier: 'Cuadrilla Especialistas Drywall y Pintura',
        invoiceNumber: 'RH-014-99',
        description: 'Armado de tabiquería acústica, masillado y encintado',
        amount: 3600,
        paymentMethod: 'Transferencia Bancaria',
        notes: 'Conformidad de acabados arquitectónicos',
        createdAt: '2026-08-25T18:00:00.000Z',
      },
      {
        id: 'exp-103',
        date: '2026-09-12',
        category: 'MATERIALES',
        supplier: 'Iluminación & Electricidad Gamma S.A.C.',
        invoiceNumber: 'F003-00998',
        description: 'Paneles LED 60x60 40W para cielo raso y pintura látex premium lavable',
        amount: 2100,
        paymentMethod: 'Transferencia Bancaria',
        invoiceFile: {
          name: 'Factura_PanelesLED_Pintura.pdf',
          type: 'image/svg+xml',
          size: 34100,
          dataUrl: invoiceDocUrl,
          uploadedAt: '2026-09-12T10:00:00.000Z',
        },
        notes: 'Garantía de luminarias por 2 años',
        createdAt: '2026-09-12T10:00:00.000Z',
      }
    ],
    paymentSchedule: [
      {
        id: 'sch-101',
        title: '50% inicial a la firma del contrato',
        dueDate: '2026-08-02',
        amount: 9000,
        isPaid: true,
        notes: 'Cancelado vía Yape'
      },
      {
        id: 'sch-102',
        title: '50% liquidación contra entrega de obra',
        dueDate: '2026-09-20',
        amount: 9000,
        isPaid: true,
        notes: 'Cancelado vía Interbank'
      }
    ],
    invoice: {
      invoiceNumber: 'F001-000452',
      issueDate: '2026-09-28',
      file: {
        name: 'Factura_Electronica_F001-000452.pdf',
        type: 'image/svg+xml',
        size: 38900,
        dataUrl: invoiceDocUrl,
        uploadedAt: '2026-09-28T10:00:00.000Z',
      },
      notes: 'Factura electrónica emitida a través de portal SUNAT. Retención del 3% acreditada.',
      updatedAt: '2026-09-28T10:00:00.000Z',
    },
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-09-28T10:00:00.000Z',
  };

  const contract3: Contract = {
    id: 'demo-cont-003',
    contractNumber: 'CONT-2026-003',
    clientName: 'Ing. Carlos Mendoza Paredes',
    docType: 'DNI',
    docNumber: '45892147',
    phone: '+51 976 543 210',
    clientEmail: 'carlos.mendoza.ing@gmail.com',
    location: 'Miraflores, Lima (Malecón Cisneros)',
    description: 'Enchape de porcelanato en terraza y barandillas de acero inoxidable en casa de playa',
    startDate: '2026-09-15',
    estimatedEndDate: '2026-10-05',
    totalAmount: 9500,
    status: 'OBRA_TERMINADA',
    contractFile: {
      name: 'Contrato_Mendoza_CasaPlaya.pdf',
      type: 'image/svg+xml',
      size: 38200,
      dataUrl: contractDocUrl,
      uploadedAt: '2026-09-15T12:00:00.000Z',
    },
    payments: [
      {
        id: 'pay-201',
        date: '2026-09-16',
        amount: 4500,
        method: 'Plin',
        reference: 'OP-PLN-55410',
        receiptFile: {
          name: 'Voucher_Plin_4500.jpg',
          type: 'image/svg+xml',
          size: 17800,
          dataUrl: voucherYape1,
          uploadedAt: '2026-09-16T14:10:00.000Z',
        },
        notes: 'Anticipo para compra de porcelanato y pegamento gris flexible',
        createdAt: '2026-09-16T14:10:00.000Z',
      }
    ],
    expenses: [
      {
        id: 'exp-201',
        date: '2026-09-17',
        category: 'MATERIALES',
        supplier: 'Cerámicas & Acabados San Lorenzo',
        invoiceNumber: 'F002-008192',
        description: 'Porcelanato rústico antideslizante 60x120 y fragua impermeable',
        amount: 1850,
        paymentMethod: 'Transferencia Bancaria',
        invoiceFile: {
          name: 'Factura_SanLorenzo_Porcelanato.pdf',
          type: 'image/svg+xml',
          size: 32400,
          dataUrl: invoiceDocUrl,
          uploadedAt: '2026-09-17T11:00:00.000Z',
        },
        notes: 'Materiales con 10% de merma para cortes diagonales',
        createdAt: '2026-09-17T11:00:00.000Z',
      },
      {
        id: 'exp-202',
        date: '2026-09-22',
        category: 'MANO_DE_OBRA',
        supplier: 'Oficial Enchapador Pedro Flores',
        invoiceNumber: 'RH-008-55',
        description: 'Mano de obra especializada en colocación y nivelación con cuñas autonivelantes',
        amount: 1200,
        paymentMethod: 'Yape',
        notes: 'Pago por m2 de terraza exterior',
        createdAt: '2026-09-22T16:30:00.000Z',
      }
    ],
    paymentSchedule: [
      {
        id: 'sch-201',
        title: 'Anticipo compra de materiales (porcelanato)',
        dueDate: '2026-09-16',
        amount: 4500,
        isPaid: true,
        notes: 'Cancelado mediante Plin'
      },
      {
        id: 'sch-202',
        title: 'Cancelación contra conformidad y acabados',
        dueDate: '2026-10-05',
        amount: 5000,
        isPaid: false,
        notes: 'Vence en fecha estimada de entrega'
      }
    ],
    invoice: {
      invoiceNumber: 'E001-89',
      issueDate: '2026-10-01',
      file: undefined,
      notes: 'Factura proforma enviada por WhatsApp al cliente a la espera de transferencia del saldo final.',
      updatedAt: '2026-10-01T15:00:00.000Z'
    },
    createdAt: '2026-09-15T12:00:00.000Z',
    updatedAt: '2026-10-01T15:00:00.000Z',
  };

  return [contract1, contract2, contract3];
}

export function exportBackupJson(contracts: Contract[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(contracts, null, 2));
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `ObraControl_Respaldo_Contratos_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
