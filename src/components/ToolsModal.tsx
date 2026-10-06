import React from 'react';
import { X, Wrench } from 'lucide-react';
import { ToolsModule } from './modules/ToolsModule';

interface ToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPdfModal: () => void;
  onExportBackup: () => void;
  onImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenSingleFileModal: () => void;
  onOpenGitHubModal?: () => void;
  onLoadDemo: () => void;
  totalContracts: number;
}

export const ToolsModal: React.FC<ToolsModalProps> = ({
  isOpen,
  onClose,
  onOpenPdfModal,
  onExportBackup,
  onImportBackup,
  onOpenSingleFileModal,
  onOpenGitHubModal,
  onLoadDemo,
  totalContracts,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        <div className="sticky top-0 bg-white/95 backdrop-blur-xs px-6 py-4 border-b border-slate-200 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Herramientas & Respaldo
              </h3>
              <p className="text-xs text-slate-500">
                Copias de seguridad, aplicativo portable, reportes y publicación en GitHub
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <ToolsModule
            onOpenPdfModal={() => {
              onClose();
              onOpenPdfModal();
            }}
            onExportBackup={onExportBackup}
            onImportBackup={onImportBackup}
            onOpenSingleFileModal={() => {
              onClose();
              onOpenSingleFileModal();
            }}
            onOpenGitHubModal={() => {
              onClose();
              onOpenGitHubModal?.();
            }}
            onLoadDemo={onLoadDemo}
            totalContracts={totalContracts}
          />
        </div>
      </div>
    </div>
  );
};
