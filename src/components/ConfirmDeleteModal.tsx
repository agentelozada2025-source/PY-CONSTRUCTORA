import React from 'react';
import { Contract } from '../types';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  contract: Contract | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  contract,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  if (!isOpen || !contract) return null;

  return (
    <div className="fixed inset-0 z-80 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-red-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top visual warning bar */}
        <div className="bg-red-600 h-2 w-full"></div>

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-2xl shrink-0">
              <AlertTriangle className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                ¿Estás seguro de eliminar este registro?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Esta acción no se puede deshacer y borrará permanentemente toda la información vinculada.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Details card of the contract to be deleted */}
          <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Contrato:</span>
              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                {contract.contractNumber}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Cliente:</span>
              <span className="font-bold text-slate-800 truncate max-w-[200px] text-right">
                {contract.clientName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Monto Contratado:</span>
              <span className="font-mono font-bold text-emerald-800">
                {formatCurrency(contract.totalAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200">
              <span>Registros asociados:</span>
              <span>
                {(contract.payments || []).length} pagos · {(contract.expenses || []).length} gastos
              </span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-200 text-[11px] text-red-700 font-medium">
            ⚠️ Se eliminarán los comprobantes de pago (Yape/transferencias), facturas y el archivo de contrato adjunto.
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md hover:shadow-lg transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4 stroke-[2.5]" />
              <span>{isDeleting ? 'Eliminando...' : 'Sí, eliminar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
