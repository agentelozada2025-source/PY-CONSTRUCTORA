import React, { useState, useEffect, useMemo } from 'react';
import { Contract, FileAttachment, PaymentScheduleItem } from './types';
import { 
  getAllContracts, 
  saveContract, 
  deleteContract, 
  replaceAllContracts, 
  generateDemoContracts, 
  exportBackupJson 
} from './utils/storage';
import { getGlobalPaymentAlerts } from './utils/formatters';
import { Navbar, AppModule } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ContractsModule } from './components/modules/ContractsModule';
import { FinancesModule } from './components/modules/FinancesModule';
import { CollectionsModule } from './components/modules/CollectionsModule';
import { ToolsModal } from './components/ToolsModal';
import { ExtendedFilter } from './components/ContractList';
import { ContractModal } from './components/ContractModal';
import { ContractDetailModal } from './components/ContractDetailModal';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { SingleFileExporterModal } from './components/SingleFileExporterModal';
import { PdfExportModal } from './components/PdfExportModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { GitHubPublishModal } from './components/GitHubPublishModal';
import { autoConnectDrive } from './services/googleAuthService';

export default function App() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Main Module: Exactly 3 modules (Contratos, Finanzas & Resumen, Cobranzas)
  const [activeModule, setActiveModule] = useState<AppModule>('contracts');
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);

  // Urban Theme state ('dark' is Asfalto Urbano default, 'light' is Concreto Urbano)
  const [urbanTheme, setUrbanTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('obracontrol_urban_theme');
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('obracontrol_urban_theme', urbanTheme);
    } catch {}
    if (urbanTheme === 'dark') {
      document.documentElement.classList.add('theme-dark');
      document.documentElement.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
      document.body.classList.remove('theme-light');
    } else {
      document.documentElement.classList.add('theme-light');
      document.documentElement.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
      document.body.classList.remove('theme-dark');
    }
  }, [urbanTheme]);

  const toggleUrbanTheme = () => {
    setUrbanTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Delete confirmation state
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeletingContract, setIsDeletingContract] = useState(false);

  // Modals state
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [contractToEdit, setContractToEdit] = useState<Contract | null>(null);

  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [viewerAttachment, setViewerAttachment] = useState<FileAttachment | null>(null);
  const [viewerTitle, setViewerTitle] = useState('');
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const [isSingleFileModalOpen, setIsSingleFileModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfModalInitialContractId, setPdfModalInitialContractId] = useState<string | undefined>(undefined);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [contractListFilter, setContractListFilter] = useState<ExtendedFilter>('ALL');

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Payment alerts calculation
  const alerts = useMemo(() => getGlobalPaymentAlerts(contracts, 14), [contracts]);

  // Load contracts from storage on mount
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      try {
        const loaded = await getAllContracts();
        if (loaded && loaded.length > 0) {
          setContracts(loaded);
        } else {
          // Auto load demo contracts if fresh start
          const demos = generateDemoContracts();
          await replaceAllContracts(demos);
          setContracts(demos);
          showNotification('¡Bienvenido a ObraControl! Se cargaron contratos de ejemplo.', 'info');
        }
      } catch (err) {
        console.error('Error loading contracts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, []);

  // Seamlessly auto-connect Google Drive upon first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      autoConnectDrive().catch(() => {});
    };

    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  // Open PDF Export Modal
  const handleOpenPdfModal = (contractId?: string) => {
    setPdfModalInitialContractId(contractId);
    setIsPdfModalOpen(true);
  };

  // Save / Update Contract
  const handleSaveContract = async (contract: Contract) => {
    await saveContract(contract);
    const updatedList = await getAllContracts();
    setContracts(updatedList);

    if (selectedContract && selectedContract.id === contract.id) {
      setSelectedContract(contract);
    }

    showNotification(`Contrato ${contract.contractNumber} guardado correctamente.`);
  };

  // Request Delete Contract with Confirmation Modal
  const handleRequestDeleteContract = (contractOrId: Contract | string) => {
    const target = typeof contractOrId === 'string'
      ? contracts.find(c => c.id === contractOrId) || null
      : contractOrId;
    if (!target) return;
    setContractToDelete(target);
    setIsConfirmDeleteOpen(true);
  };

  // Perform Confirmed Deletion
  const handleConfirmDelete = async () => {
    if (!contractToDelete) return;
    setIsDeletingContract(true);
    try {
      await deleteContract(contractToDelete.id);
      const updatedList = await getAllContracts();
      setContracts(updatedList);
      if (selectedContract && selectedContract.id === contractToDelete.id) {
        setSelectedContract(null);
        setIsDetailModalOpen(false);
      }
      if (contractToEdit && contractToEdit.id === contractToDelete.id) {
        setContractToEdit(null);
        setIsContractModalOpen(false);
      }
      setIsConfirmDeleteOpen(false);
      showNotification(`Contrato ${contractToDelete.contractNumber} eliminado correctamente.`, 'info');
      setContractToDelete(null);
    } catch (err) {
      console.error('Error deleting contract:', err);
      showNotification('Error al eliminar el contrato.', 'error');
    } finally {
      setIsDeletingContract(false);
    }
  };

  // Open Detail
  const handleOpenDetail = (contract: Contract) => {
    const fresh = contracts.find(c => c.id === contract.id) || contract;
    setSelectedContract(fresh);
    setIsDetailModalOpen(true);
    autoConnectDrive().catch(() => {});
  };

  // Open Edit Modal
  const handleOpenEditContract = (contract: Contract) => {
    setContractToEdit(contract);
    setIsContractModalOpen(true);
    autoConnectDrive().catch(() => {});
  };

  // Open New Contract Modal
  const handleOpenNewContract = () => {
    setContractToEdit(null);
    setIsContractModalOpen(true);
    autoConnectDrive().catch(() => {});
  };

  // Open Document Viewer
  const handleOpenViewer = (attachment: FileAttachment, title: string) => {
    setViewerAttachment(attachment);
    setViewerTitle(title);
    setIsViewerOpen(true);
  };

  // Load Demo Data
  const handleLoadDemo = async () => {
    if (window.confirm('¿Cargar datos de demostración? Se agregarán contratos con váuchers reales de transferencias, Yape y facturas.')) {
      const demos = generateDemoContracts();
      await replaceAllContracts(demos);
      setContracts(demos);
      showNotification('Datos de demostración cargados exitosamente.');
    }
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    exportBackupJson(contracts);
    showNotification('Respaldo JSON descargado.');
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (Array.isArray(parsed)) {
          await replaceAllContracts(parsed);
          setContracts(parsed);
          showNotification('¡Respaldo restaurado con éxito!');
        } else {
          alert('El archivo no tiene el formato de lista de contratos esperado.');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      urbanTheme === 'dark' ? 'bg-[#090C13] text-slate-100 urban-grid-bg' : 'bg-[#EBF0F5] text-slate-900 urban-grid-bg'
    }`}>
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-70 bg-[#121624] text-white px-4 py-3 rounded-xl shadow-2xl border border-amber-400/40 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Navbar with Module Navigation (3-Zone Contract) */}
      <Navbar
        activeModule={activeModule}
        onChangeModule={setActiveModule}
        onNewContract={handleOpenNewContract}
        onOpenPdfModal={() => handleOpenPdfModal()}
        onOpenToolsModal={() => setIsToolsModalOpen(true)}
        overdueCount={alerts.totalOverdueCount}
        totalContracts={contracts.length}
        urbanTheme={urbanTheme}
        onToggleTheme={toggleUrbanTheme}
      />

      {/* Main Module Content Viewport: Strictly 3 Modules (1. Contratos, 2. Cobranzas, 3. Finanzas & Resumen) */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-8 flex-1 w-full">
        {activeModule === 'contracts' && (
          <ContractsModule
            contracts={contracts}
            onSelectContract={handleOpenDetail}
            onNewContract={handleOpenNewContract}
            onDeleteContract={handleRequestDeleteContract}
            onLoadDemo={handleLoadDemo}
            onOpenPdfModal={() => handleOpenPdfModal()}
            currentFilter={contractListFilter}
            onFilterChange={setContractListFilter}
          />
        )}

        {activeModule === 'collections' && (
          <CollectionsModule
            contracts={contracts}
            onSelectContract={handleOpenDetail}
            onOpenNewContract={handleOpenNewContract}
            onUpdateContract={handleSaveContract}
            onOpenViewer={handleOpenViewer}
          />
        )}

        {activeModule === 'finances' && (
          <FinancesModule
            contracts={contracts}
            onSelectContract={handleOpenDetail}
            onOpenPdfModal={() => handleOpenPdfModal()}
            onOpenViewer={handleOpenViewer}
          />
        )}
      </main>

      {/* Footer with Urban Caution Hazard Strip */}
      <footer className="bg-[#07090F] border-t border-[#1C2335] mt-auto text-slate-400 relative pb-16 md:pb-0">
        <div className="h-[2px] w-full urban-hazard-strip opacity-60"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-black text-white tracking-wider uppercase font-mono">
              Obra<span className="text-amber-400">Control</span>
            </span>
            <span className="text-slate-700">·</span>
            <span className="text-slate-300 font-medium">Urban Construction & Financial Engineering</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Local IndexedDB + 24/7 Drive</span>
            </span>
            <span className="text-slate-700">·</span>
            <button
              type="button"
              onClick={() => setIsToolsModalOpen(true)}
              className="text-amber-400 hover:text-amber-300 hover:underline font-bold cursor-pointer text-xs transition-colors"
            >
              Herramientas & Respaldo
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Fixed Bottom Navigation Bar (< md) */}
      <MobileBottomNav
        activeModule={activeModule}
        onChangeModule={setActiveModule}
        onNewContract={handleOpenNewContract}
        onOpenToolsModal={() => setIsToolsModalOpen(true)}
        totalContracts={contracts.length}
        overdueCount={alerts.totalOverdueCount}
      />

      {/* MODALS */}
      {/* 1. New / Edit Contract Modal */}
      <ContractModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        onSave={handleSaveContract}
        onDelete={handleRequestDeleteContract}
        contractToEdit={contractToEdit}
        existingContracts={contracts}
      />

      {/* 2. Contract Detail / Payments / Invoice Workspace */}
      <ContractDetailModal
        isOpen={isDetailModalOpen}
        contract={selectedContract}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedContract(null);
        }}
        onUpdateContract={handleSaveContract}
        onDeleteContract={handleRequestDeleteContract}
        onOpenViewer={handleOpenViewer}
        onEditContract={handleOpenEditContract}
      />

      {/* 3. Document / Receipt Lightbox Viewer */}
      <DocumentViewerModal
        isOpen={isViewerOpen}
        attachment={viewerAttachment}
        title={viewerTitle}
        onClose={() => {
          setIsViewerOpen(false);
          setViewerAttachment(null);
        }}
      />

      {/* 4. Single-File HTML Exporter Modal */}
      <SingleFileExporterModal
        isOpen={isSingleFileModalOpen}
        onClose={() => setIsSingleFileModalOpen(false)}
      />

      {/* 5. PDF Report Exporter Modal (jsPDF) */}
      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => {
          setIsPdfModalOpen(false);
          setPdfModalInitialContractId(undefined);
        }}
        contracts={contracts}
        initialContractId={pdfModalInitialContractId}
      />

      {/* 6. Tools & Respaldo Modal */}
      <ToolsModal
        isOpen={isToolsModalOpen}
        onClose={() => setIsToolsModalOpen(false)}
        onOpenPdfModal={() => {
          setIsToolsModalOpen(false);
          handleOpenPdfModal();
        }}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onOpenSingleFileModal={() => {
          setIsToolsModalOpen(false);
          setIsSingleFileModalOpen(true);
        }}
        onOpenGitHubModal={() => {
          setIsToolsModalOpen(false);
          setIsGitHubModalOpen(true);
        }}
        onLoadDemo={() => {
          setIsToolsModalOpen(false);
          handleLoadDemo();
        }}
        totalContracts={contracts.length}
      />

      {/* 7. Confirm Delete Contract Modal */}
      <ConfirmDeleteModal
        isOpen={isConfirmDeleteOpen}
        contract={contractToDelete}
        onClose={() => {
          if (!isDeletingContract) {
            setIsConfirmDeleteOpen(false);
            setContractToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeletingContract}
      />

      {/* 8. GitHub Publish & Guide Modal */}
      <GitHubPublishModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
      />
    </div>
  );
}
