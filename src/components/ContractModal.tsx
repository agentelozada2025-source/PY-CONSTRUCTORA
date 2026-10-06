import React, { useState, useEffect } from 'react';
import { Contract, FileAttachment, PaymentScheduleItem } from '../types';
import { generateNextContractCode, formatCurrency } from '../utils/formatters';
import { readFileAsBase64 } from '../utils/storage';
import { 
  uploadFileToTargetDrive, 
  uploadDocumentToContractDrive, 
  TARGET_DRIVE_FOLDER_ID,
  TARGET_DRIVE_FOLDER_URL,
  testDriveFolderAccess,
  getAppsScriptUrl
} from '../services/googleDriveService';
import { getAccessToken, googleSignIn, initAuth, autoConnectDrive } from '../services/googleAuthService';
import { 
  X, 
  FileText, 
  Upload, 
  Calendar, 
  Phone, 
  Building2, 
  Check, 
  FileCheck,
  Mail,
  MapPin,
  DollarSign,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  HelpCircle,
  ExternalLink,
  CloudUpload,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contract: Contract) => void;
  onDelete?: (id: string) => void;
  contractToEdit?: Contract | null;
  existingContracts: Contract[];
}

export const ContractModal: React.FC<ContractModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  contractToEdit,
  existingContracts,
}) => {
  const [contractNumber, setContractNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [docType, setDocType] = useState<'DNI' | 'RUC'>('RUC');
  const [docNumber, setDocNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [estimatedEndDate, setEstimatedEndDate] = useState('');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [contractFile, setContractFile] = useState<FileAttachment | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);

  // Initial payment schedule state
  const [scheduleItems, setScheduleItems] = useState<PaymentScheduleItem[]>([]);
  const [showScheduleBuilder, setShowScheduleBuilder] = useState(false);
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);

  // Google Drive connection and auto-sync state
  const [isDriveConnectedState, setIsDriveConnectedState] = useState(false);
  const [syncToDrive, setSyncToDrive] = useState(true);
  const [isConnectingDrive, setIsConnectingDrive] = useState(false);
  const [driveSaveStatus, setDriveSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    const checkState = async () => {
      if (getAppsScriptUrl()) {
        setIsDriveConnectedState(true);
        return;
      }
      const tok = await getAccessToken();
      setIsDriveConnectedState(!!tok);
    };

    const unsub = initAuth(
      (_user, token) => setIsDriveConnectedState(!!token || !!getAppsScriptUrl()),
      () => setIsDriveConnectedState(!!getAppsScriptUrl())
    );
    checkState();
    return () => unsub();
  }, []);

  // Ensure Google Drive is automatically connected when the modal is opened
  useEffect(() => {
    if (isOpen && !isDriveConnectedState) {
      if (getAppsScriptUrl()) {
        setIsDriveConnectedState(true);
        return;
      }
      getAccessToken().then(tok => {
        if (tok) {
          setIsDriveConnectedState(true);
        } else {
          autoConnectDrive()
            .then(newTok => {
              if (newTok) setIsDriveConnectedState(true);
            })
            .catch(() => {});
        }
      });
    }
  }, [isOpen, isDriveConnectedState]);

  useEffect(() => {
    if (contractToEdit) {
      setContractNumber(contractToEdit.contractNumber);
      setClientName(contractToEdit.clientName);
      setDocType(contractToEdit.docType);
      setDocNumber(contractToEdit.docNumber);
      setPhone(contractToEdit.phone);
      setClientEmail(contractToEdit.clientEmail || '');
      setLocation(contractToEdit.location || '');
      setDescription(contractToEdit.description);
      setStartDate(contractToEdit.startDate);
      setEstimatedEndDate(contractToEdit.estimatedEndDate);
      setTotalAmount(contractToEdit.totalAmount.toString());
      setContractFile(contractToEdit.contractFile);
      setScheduleItems(contractToEdit.paymentSchedule || []);
      if (contractToEdit.paymentSchedule && contractToEdit.paymentSchedule.length > 0) {
        setShowScheduleBuilder(true);
      } else {
        setShowScheduleBuilder(false);
      }
    } else {
      // Auto generate code and default dates
      const nextCode = generateNextContractCode(existingContracts);
      setContractNumber(nextCode);
      setClientName('');
      setDocType('RUC');
      setDocNumber('');
      setPhone('');
      setClientEmail('');
      setLocation('');
      setDescription('');
      
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      
      // Default 30 days ahead
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      setEstimatedEndDate(nextMonth.toISOString().split('T')[0]);

      setTotalAmount('');
      setContractFile(undefined);
      setScheduleItems([]);
      setShowScheduleBuilder(false);
    }
  }, [contractToEdit, existingContracts, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      try {
        const base64 = await readFileAsBase64(file);
        
        let driveFileId: string | undefined = undefined;
        let driveUrl: string | undefined = undefined;

        // Try uploading to Google Drive folder automatically if token is available
        try {
          const token = await getAccessToken();
          if (token) {
            setIsDriveSyncing(true);
            const driveRes = await uploadDocumentToContractDrive({
              contractNumber: contractNumber || 'Obra',
              clientName: clientName || 'Cliente',
              category: 'CONTRATOS',
              fileOrDataUrl: file,
              customDescription: `Contrato firmado: ${contractNumber || 'Obra'}`
            });
            if (driveRes) {
              driveFileId = driveRes.fileId;
              driveUrl = driveRes.driveUrl;
            }
          }
        } catch (driveErr) {
          console.warn('Auto Drive upload notice (file saved locally):', driveErr);
        } finally {
          setIsDriveSyncing(false);
        }

        setContractFile({
          name: file.name,
          type: file.type || 'application/pdf',
          size: file.size,
          dataUrl: base64,
          uploadedAt: new Date().toISOString(),
          driveFileId,
          driveUrl,
        });
      } catch (err) {
        console.error('Error reading contract file', err);
        alert('Error al leer el archivo. Intenta con otro PDF o imagen.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSyncContractFileToDrive = async () => {
    if (!contractFile) return;
    setIsDriveSyncing(true);
    try {
      let token = await getAccessToken();
      const appsScriptUrl = getAppsScriptUrl();
      if (!token && !appsScriptUrl) {
        const authRes = await googleSignIn();
        if (!authRes?.accessToken) {
          alert('Se requiere iniciar sesión con Google o configurar Google Apps Script para sincronizar.');
          return;
        }
        token = authRes.accessToken;
      }
      const driveRes = await uploadDocumentToContractDrive({
        contractNumber: contractNumber || 'Obra',
        clientName: clientName || 'Cliente',
        category: 'CONTRATOS',
        fileOrDataUrl: { name: contractFile.name, dataUrl: contractFile.dataUrl, mimeType: contractFile.type },
        customDescription: `Contrato firmado: ${contractNumber || 'Obra'}`
      });
      if (driveRes) {
        setContractFile({
          ...contractFile,
          driveFileId: driveRes.fileId,
          driveUrl: driveRes.driveUrl,
        });
        alert('¡Documento guardado con éxito en la carpeta de Google Drive!');
      } else {
        alert('No se pudo completar la sincronización con Google Drive.');
      }
    } catch (err: any) {
      console.error('Error uploading to Drive:', err);
      alert(err.message || 'Error al subir a Google Drive');
    } finally {
      setIsDriveSyncing(false);
    }
  };

  const handleConnectDriveInModal = async () => {
    setIsConnectingDrive(true);
    try {
      const res = await googleSignIn();
      if (res?.accessToken) {
        setIsDriveConnectedState(true);
        if (contractFile && !contractFile.driveUrl) {
          setIsDriveSyncing(true);
          const driveRes = await uploadDocumentToContractDrive({
            contractNumber: contractNumber || 'Obra',
            clientName: clientName || 'Cliente',
            category: 'CONTRATOS',
            fileOrDataUrl: { name: contractFile.name, dataUrl: contractFile.dataUrl, mimeType: contractFile.type },
            customDescription: `Contrato firmado: ${contractNumber || 'Obra'}`
          });
          if (driveRes) {
            setContractFile({
              ...contractFile,
              driveFileId: driveRes.fileId,
              driveUrl: driveRes.driveUrl,
            });
          }
        }
      }
    } catch (err: any) {
      console.warn('Google sign-in dismissed in modal:', err);
    } finally {
      setIsConnectingDrive(false);
      setIsDriveSyncing(false);
    }
  };

  // Quick schedule templates generator
  const applyScheduleTemplate = (type: '100' | '50-50' | '40-30-30') => {
    const total = parseFloat(totalAmount) || 0;
    if (total <= 0) {
      alert('Ingresa primero el Monto Total Contratado (S/) para calcular las cuotas.');
      return;
    }

    const start = startDate || new Date().toISOString().split('T')[0];
    const end = estimatedEndDate || new Date().toISOString().split('T')[0];

    // Mid date calculation
    const sDate = new Date(start);
    const eDate = new Date(end);
    const midTime = sDate.getTime() + (eDate.getTime() - sDate.getTime()) / 2;
    const midDateStr = new Date(midTime).toISOString().split('T')[0];

    if (type === '100') {
      setScheduleItems([
        {
          id: `sch-${Date.now()}-1`,
          title: 'Pago Único Contra Entrega (100%)',
          dueDate: end,
          amount: total,
          isPaid: false,
        }
      ]);
    } else if (type === '50-50') {
      const p1 = Math.round((total * 0.5) * 100) / 100;
      const p2 = Math.round((total - p1) * 100) / 100;
      setScheduleItems([
        {
          id: `sch-${Date.now()}-1`,
          title: 'Anticipo Inicial de Firma (50%)',
          dueDate: start,
          amount: p1,
          isPaid: false,
        },
        {
          id: `sch-${Date.now()}-2`,
          title: 'Saldo Final Contra Entrega (50%)',
          dueDate: end,
          amount: p2,
          isPaid: false,
        }
      ]);
    } else if (type === '40-30-30') {
      const p1 = Math.round((total * 0.4) * 100) / 100;
      const p2 = Math.round((total * 0.3) * 100) / 100;
      const p3 = Math.round((total - p1 - p2) * 100) / 100;
      setScheduleItems([
        {
          id: `sch-${Date.now()}-1`,
          title: 'Anticipo Inicial de Replanteo (40%)',
          dueDate: start,
          amount: p1,
          isPaid: false,
        },
        {
          id: `sch-${Date.now()}-2`,
          title: 'Valorización por Avance de Obra (30%)',
          dueDate: midDateStr,
          amount: p2,
          isPaid: false,
        },
        {
          id: `sch-${Date.now()}-3`,
          title: 'Saldo Final y Conformidad de Obra (30%)',
          dueDate: end,
          amount: p3,
          isPaid: false,
        }
      ]);
    }
    setShowScheduleBuilder(true);
  };

  const handleAddCustomScheduleItem = () => {
    const total = parseFloat(totalAmount) || 0;
    const currentScheduled = scheduleItems.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
    const remaining = Math.max(0, total - currentScheduled);

    const newItem: PaymentScheduleItem = {
      id: `sch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `Cuota ${scheduleItems.length + 1}`,
      dueDate: estimatedEndDate || new Date().toISOString().split('T')[0],
      amount: remaining > 0 ? remaining : 0,
      isPaid: false,
    };
    setScheduleItems([...scheduleItems, newItem]);
    setShowScheduleBuilder(true);
  };

  const handleUpdateScheduleItem = (index: number, field: keyof PaymentScheduleItem, value: any) => {
    const updated = [...scheduleItems];
    updated[index] = { ...updated[index], [field]: value };
    setScheduleItems(updated);
  };

  const handleRemoveScheduleItem = (index: number) => {
    setScheduleItems(scheduleItems.filter((_, i) => i !== index));
  };

  const totalScheduled = scheduleItems.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  const totalNum = parseFloat(totalAmount) || 0;
  const scheduleDifference = totalNum - totalScheduled;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(totalAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0');
      return;
    }

    if (!clientName.trim()) {
      alert('Ingresa el nombre o razón social del cliente');
      return;
    }

    if (!docNumber.trim()) {
      alert('Ingresa el número de RUC o DNI');
      return;
    }

    let finalContractFile = contractFile;

    // Si hay un archivo adjunto que aún no se ha subido a Drive y syncToDrive está habilitado
    if (contractFile && syncToDrive && !contractFile.driveFileId) {
      try {
        let token = await getAccessToken();
        const appsScriptUrl = getAppsScriptUrl();
        if (!token && !appsScriptUrl) {
          setDriveSaveStatus('Conectando con Google Drive para respaldar archivo...');
          const authRes = await googleSignIn();
          if (authRes?.accessToken) {
            token = authRes.accessToken;
            setIsDriveConnectedState(true);
          }
        }

        if (token || appsScriptUrl) {
          setDriveSaveStatus('Subiendo contrato a la carpeta de Google Drive...');
          setIsDriveSyncing(true);
          const driveRes = await uploadDocumentToContractDrive({
            contractNumber: contractNumber.trim(),
            clientName: clientName.trim(),
            category: 'CONTRATOS',
            fileOrDataUrl: { name: contractFile.name, dataUrl: contractFile.dataUrl, mimeType: contractFile.type },
            customDescription: `Contrato firmado: ${contractNumber.trim()} • ${clientName.trim()}`
          });
          if (driveRes) {
            finalContractFile = {
              ...contractFile,
              driveFileId: driveRes.fileId,
              driveUrl: driveRes.driveUrl,
            };
            setContractFile(finalContractFile);
          }
        }
      } catch (driveErr) {
        console.warn('Aviso al subir contrato a Drive al guardar:', driveErr);
      } finally {
        setIsDriveSyncing(false);
        setDriveSaveStatus(null);
      }
    }

    const newOrUpdatedContract: Contract = {
      id: contractToEdit ? contractToEdit.id : `cont-${Date.now()}`,
      contractNumber: contractNumber.trim(),
      clientName: clientName.trim(),
      docType,
      docNumber: docNumber.trim(),
      phone: phone.trim(),
      clientEmail: clientEmail.trim() || undefined,
      location: location.trim() || undefined,
      description: description.trim(),
      startDate,
      estimatedEndDate,
      totalAmount: amount,
      status: contractToEdit ? contractToEdit.status : 'EN_EJECUCION',
      statusNotes: contractToEdit ? contractToEdit.statusNotes : 'Contrato registrado. Listo para inicio de ejecución.',
      contractFile: finalContractFile,
      payments: contractToEdit ? contractToEdit.payments : [],
      expenses: contractToEdit ? contractToEdit.expenses : [],
      paymentSchedule: scheduleItems.length > 0 ? scheduleItems : (contractToEdit?.paymentSchedule || []),
      invoice: contractToEdit ? contractToEdit.invoice : null,
      createdAt: contractToEdit ? contractToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newOrUpdatedContract);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-6 overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {contractToEdit ? 'Editar Contrato de Obra' : 'Registro Simple de Contrato'}
              </h3>
              <p className="text-xs text-slate-400">
                Datos del cliente, montos, fechas de pago y contrato firmado en PDF
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Section 1: Datos Básicos del Contrato y Cliente */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-600" />
                1. Datos del Contrato y Cliente
              </span>
              <span className="text-[11px] text-slate-400">* Campos requeridos</span>
            </div>

            {/* Código / N° Contrato y Razón Social */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  N° de Contrato *
                </label>
                <input
                  type="text"
                  required
                  value={contractNumber}
                  onChange={(e) => setContractNumber(e.target.value)}
                  placeholder="ej. CONT-2026-001"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono font-bold bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cliente o Razón Social *
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="ej. Constructora Los Andes S.A.C."
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-medium bg-white"
                />
              </div>
            </div>

            {/* Documento y Contacto */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tipo Doc.
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as 'DNI' | 'RUC')}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white font-medium"
                >
                  <option value="RUC">RUC (Empresas)</option>
                  <option value="DNI">DNI (Persona Natural)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  N° Documento *
                </label>
                <input
                  type="text"
                  required
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder={docType === 'RUC' ? '20601234567' : '45891234'}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Teléfono de Contacto *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+51 987 654 321"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                />
              </div>
            </div>

            {/* Email y Ubicación */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-sky-600" />
                  <span>Correo Electrónico (Notificaciones)</span>
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="ej. cobranzas@cliente.com"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>Ubicación o Dirección de Obra</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="ej. San Isidro, Lima • Av. Rivera Navarrete"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                />
              </div>
            </div>

            {/* Descripción / Objeto de Obra */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Descripción / Objeto de la Obra o Servicio *
              </label>
              <textarea
                required
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ej. Instalación de drywall acústico, cableado estructurado y luminarias en oficinas..."
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 leading-relaxed bg-white"
              />
            </div>
          </div>

          {/* Section 2: Valores y Fechas Contractuales */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3.5">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              2. Monto Contratado y Fechas
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Monto Total Pactado (S/) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-xs font-bold">
                    S/
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="25000.00"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-emerald-950 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fecha Estimada de Entrega *
                </label>
                <input
                  type="date"
                  required
                  value={estimatedEndDate}
                  onChange={(e) => setEstimatedEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Poner Fechas de Pago (Cronograma de Cuotas) */}
          <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-sky-950 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-600" />
                  3. Poner Fechas de Pago (Cronograma de Cuotas)
                </span>
                <p className="text-[11px] text-slate-500">
                  Define las fechas y montos en que el cliente debe pagar (opcional para control de vencimientos)
                </p>
              </div>

              {/* Botones de plantillas rápidas */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => applyScheduleTemplate('50-50')}
                  className="px-2 py-1 text-[11px] font-bold text-sky-700 bg-white hover:bg-sky-100 border border-sky-200 rounded-md transition-colors cursor-pointer"
                  title="Generar 2 cuotas: 50% de anticipo y 50% al entregar"
                >
                  50% / 50%
                </button>
                <button
                  type="button"
                  onClick={() => applyScheduleTemplate('40-30-30')}
                  className="px-2 py-1 text-[11px] font-bold text-sky-700 bg-white hover:bg-sky-100 border border-sky-200 rounded-md transition-colors cursor-pointer"
                  title="Generar 3 cuotas: 40% anticipo, 30% avance, 30% saldo"
                >
                  40% / 30% / 30%
                </button>
                <button
                  type="button"
                  onClick={() => applyScheduleTemplate('100')}
                  className="px-2 py-1 text-[11px] font-bold text-sky-700 bg-white hover:bg-sky-100 border border-sky-200 rounded-md transition-colors cursor-pointer"
                  title="Generar cuota única del 100%"
                >
                  100% Final
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomScheduleItem}
                  className="px-2.5 py-1 text-[11px] font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-md inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Cuota</span>
                </button>
              </div>
            </div>

            {/* Schedule Items List */}
            {scheduleItems.length > 0 ? (
              <div className="space-y-2 pt-1">
                {scheduleItems.map((item, idx) => (
                  <div key={item.id} className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-extrabold text-slate-500 w-5">
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handleUpdateScheduleItem(idx, 'title', e.target.value)}
                      placeholder="Concepto (ej. Adelanto 40%)"
                      className="flex-1 min-w-[140px] px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-sky-500 font-medium"
                    />
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-slate-400 text-[11px]">Vence:</span>
                      <input
                        type="date"
                        value={item.dueDate}
                        onChange={(e) => handleUpdateScheduleItem(idx, 'dueDate', e.target.value)}
                        className="px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                    <div className="relative w-28">
                      <span className="absolute inset-y-0 left-0 pl-1.5 flex items-center text-slate-400 text-[10px] font-bold">
                        S/
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={item.amount || ''}
                        onChange={(e) => handleUpdateScheduleItem(idx, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="Monto"
                        className="w-full pl-6 pr-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-sky-500 font-mono font-bold"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveScheduleItem(idx)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                      title="Quitar cuota"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Balance bar */}
                <div className="flex items-center justify-between text-[11px] px-1 pt-1">
                  <span className="text-slate-600">
                    Suma programada: <strong className="font-mono text-slate-900">{formatCurrency(totalScheduled)}</strong> de {formatCurrency(totalNum)}
                  </span>
                  {totalNum > 0 && (
                    <span className={`font-bold ${Math.abs(scheduleDifference) < 0.1 ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {Math.abs(scheduleDifference) < 0.1 
                        ? '✓ Cuadre 100% exacto' 
                        : scheduleDifference > 0 
                          ? `Falta programar: ${formatCurrency(scheduleDifference)}` 
                          : `Excede por: ${formatCurrency(Math.abs(scheduleDifference))}`}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white/80 p-3 rounded-lg border border-dashed border-sky-200 text-center">
                <p className="text-xs text-slate-600">
                  ¿Quieres programar las fechas de pago ahora? Haz clic en las plantillas rápidas (<span className="font-bold text-sky-700">50%/50%</span> o <span className="font-bold text-sky-700">40%/30%/30%</span>) o agrégalas después dentro del contrato.
                </p>
              </div>
            )}
          </div>

          {/* Section 4: Subir Contrato PDF */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-sky-600" />
                4. Subir Contrato PDF Firmado
              </span>
              <a 
                href={TARGET_DRIVE_FOLDER_URL} 
                target="_blank" 
                rel="noreferrer"
                className="text-[11px] text-sky-700 hover:underline font-bold inline-flex items-center gap-1"
                title="Abrir carpeta oficial en Google Drive"
              >
                <span>Carpeta Drive Oficial ↗</span>
              </a>
            </div>

            {/* Google Drive Status Banner */}
            {isDriveConnectedState ? (
              <div className="flex items-center justify-between text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-lg flex-wrap gap-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Google Drive Conectado — Se guardará automáticamente en la carpeta oficial al guardar</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => testDriveFolderAccess(TARGET_DRIVE_FOLDER_ID, true)}
                    className="text-emerald-800 hover:text-emerald-950 underline text-[11px] font-bold cursor-pointer"
                    title="Verificar permisos y existencia de la carpeta de Drive mediante files.get"
                  >
                    Probar Acceso
                  </button>
                  <span className="text-emerald-400">•</span>
                  <a 
                    href={TARGET_DRIVE_FOLDER_URL} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-emerald-900 underline text-[11px] font-semibold hover:text-emerald-950 shrink-0"
                  >
                    Abrir Carpeta ↗
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-amber-50 border border-amber-200 text-amber-900 p-2.5 rounded-lg">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Google Drive no está conectado. Para subir archivos a la carpeta oficial, conecta tu cuenta.</span>
                </div>
                <button
                  type="button"
                  onClick={handleConnectDriveInModal}
                  disabled={isConnectingDrive}
                  className="px-3 py-1 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-md transition-colors cursor-pointer disabled:opacity-50 shrink-0 shadow-2xs"
                >
                  {isConnectingDrive ? 'Conectando...' : 'Conectar Drive'}
                </button>
              </div>
            )}

            {driveSaveStatus && (
              <div className="p-2.5 bg-sky-50 border border-sky-200 text-sky-800 text-xs rounded-lg flex items-center gap-2 animate-pulse font-medium">
                <div className="w-3.5 h-3.5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
                <span>{driveSaveStatus}</span>
              </div>
            )}

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors bg-white">
              {contractFile ? (
                <div className="flex flex-wrap items-center justify-between bg-sky-50 p-3 rounded-lg border border-sky-200 gap-2">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="p-2 bg-sky-100 text-sky-700 rounded-md">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div className="text-left truncate">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {contractFile.name}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{formatCurrency(contractFile.size / 1024)} KB</span>
                        {contractFile.driveUrl ? (
                          <a 
                            href={contractFile.driveUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="font-bold text-emerald-700 hover:underline inline-flex items-center gap-0.5"
                          >
                            <span>✓ En Google Drive</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSyncContractFileToDrive}
                            disabled={isDriveSyncing}
                            className="text-sky-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <CloudUpload className="w-3 h-3" />
                            <span>{isDriveSyncing ? 'Subiendo...' : 'Subir a Drive ahora'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    {contractFile.driveUrl && (
                      <a
                        href={contractFile.driveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-sky-700 bg-white hover:bg-sky-100 border border-sky-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Ver en Drive</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setContractFile(undefined)}
                      className="text-xs text-red-600 hover:text-red-700 font-bold px-2 py-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="w-7 h-7 text-sky-500 mx-auto mb-1.5" />
                  <label className="cursor-pointer text-xs font-bold text-sky-600 hover:text-sky-700 block">
                    <span>Seleccionar archivo PDF o imagen del contrato</span>
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {isDriveConnectedState 
                      ? '✓ Se respaldará en la carpeta oficial de Google Drive al guardar el contrato'
                      : 'Se respaldará en Google Drive una vez conectada tu cuenta'}
                  </p>
                </div>
              )}
            </div>

            {/* Checkbox de sincronización con Google Drive */}
            <div className="pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={syncToDrive}
                  onChange={(e) => setSyncToDrive(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                />
                <span>Respaldar contrato en Google Drive (Carpeta oficial: <code className="font-mono text-[11px] text-slate-600">1qmD_GbS5OUbiXC_vHB3h4c1qrB5ZpCA2</code>)</span>
              </label>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            {contractToEdit && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(contractToEdit.id);
                }}
                className="px-3 py-2 text-xs font-bold text-red-600 hover:text-white hover:bg-red-600 rounded-lg border border-red-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Registro</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="px-6 py-2.5 text-xs font-extrabold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{contractToEdit ? 'Guardar Cambios' : 'Registrar Contrato'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
