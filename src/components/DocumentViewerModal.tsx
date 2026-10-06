import React, { useState } from 'react';
import { FileAttachment } from '../types';
import { 
  X, 
  Download, 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  FileText,
  Maximize2,
  ExternalLink
} from 'lucide-react';

interface DocumentViewerModalProps {
  isOpen: boolean;
  attachment: FileAttachment | null;
  title: string;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  attachment,
  title,
  onClose,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!isOpen || !attachment) return null;

  const isPdf =
    attachment.type === 'application/pdf' &&
    !attachment.dataUrl.startsWith('data:image/svg');

  const handleZoomIn = () => setZoom((prev) => Math.min(2.5, prev + 0.25));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.5, prev - 0.25));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      if (isPdf) {
        printWindow.document.write(
          `<iframe src="${attachment.dataUrl}" style="width:100%;height:100%;border:none;"></iframe>`
        );
      } else {
        printWindow.document.write(
          `<img src="${attachment.dataUrl}" style="max-width:100%;display:block;margin:auto;" onload="window.print();window.close();">`
        );
      }
      printWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-700 flex flex-col max-h-[92vh]">
        {/* Top Control Bar */}
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center gap-2 truncate pr-4">
            <FileText className="w-5 h-5 text-sky-400 shrink-0" />
            <span className="text-sm font-bold truncate">{title}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isPdf && (
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-slate-300">
                <button
                  onClick={handleZoomOut}
                  className="p-1 hover:text-white rounded hover:bg-slate-700"
                  title="Reducir zoom"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono px-1 font-semibold">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-1 hover:text-white rounded hover:bg-slate-700"
                  title="Aumentar zoom"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-1 hover:text-white rounded hover:bg-slate-700 ml-1 border-l border-slate-700 pl-1.5"
                  title="Rotar 90°"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            )}

            {attachment.driveUrl && (
              <a
                href={attachment.driveUrl}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 text-xs font-bold text-sky-300 hover:text-white bg-slate-800 hover:bg-sky-900 border border-slate-700 hover:border-sky-500 rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Abrir en Google Drive"
              >
                <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Ver en Drive</span>
              </a>
            )}

            <button
              onClick={handlePrint}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Imprimir"
            >
              <Printer className="w-4 h-4" />
            </button>

            <a
              href={attachment.dataUrl}
              download={attachment.name || 'documento'}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-sm"
              title="Descargar archivo original"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer Content Canvas */}
        <div className="flex-1 bg-slate-950 p-4 sm:p-6 overflow-auto flex items-center justify-center min-h-[380px]">
          {isPdf ? (
            <iframe
              src={attachment.dataUrl}
              className="w-full h-[70vh] rounded-xl border border-slate-800 bg-white"
              title="Documento PDF"
            />
          ) : (
            <div className="relative max-w-full max-h-full flex items-center justify-center overflow-auto p-2">
              <img
                src={attachment.dataUrl}
                alt={attachment.name}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.15s ease-out',
                }}
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-2xl bg-white p-2"
              />
            </div>
          )}
        </div>

        {/* Bottom Filename Info */}
        <div className="px-5 py-2.5 bg-slate-900 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span className="truncate">{attachment.name}</span>
          <span className="font-mono text-[11px] text-slate-500">
            {attachment.type || 'Documento'}
          </span>
        </div>
      </div>
    </div>
  );
};
