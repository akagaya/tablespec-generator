import { useState } from 'react';
import { X, Download } from 'lucide-react';
import { saveAs } from 'file-saver';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../store/useProjectStore';
import { exporterRegistry } from '../../exporters';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportDialog({ isOpen, onClose }: Props) {
  const { t } = useTranslation();
  const spec = useProjectStore(state => state.spec);
  const exporters = exporterRegistry.getAll();
  const [selectedExporterId, setSelectedExporterId] = useState<string>(exporters[0]?.id || '');

  if (!isOpen) return null;

  const selectedExporter = exporters.find(e => e.id === selectedExporterId);
  
  let exportResults = null;
  try {
    if (selectedExporter) {
      exportResults = selectedExporter.generate(spec);
    }
  } catch (error) {
    console.error('Export error:', error);
  }

  const resultsArr = Array.isArray(exportResults) 
    ? exportResults 
    : exportResults 
      ? [exportResults] 
      : [];

  const handleDownload = () => {
    resultsArr.forEach(result => {
      const blob = new Blob([result.content], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, result.filename);
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white shadow-xl w-full max-w-5xl h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-bold">{t('export.title')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('export.description')}</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left panel */}
          <div className="w-1/3 border-r overflow-y-auto bg-gray-50 p-4 flex flex-col gap-2">
            <h3 className="font-semibold text-gray-700 mb-2">{t('export.format')}</h3>
            {exporters.map(exporter => (
              <button
                key={exporter.id}
                onClick={() => setSelectedExporterId(exporter.id)}
                className={`text-left p-3 border transition-colors ${
                  selectedExporterId === exporter.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{exporter.name}</div>
                <div className="text-xs text-gray-500 mt-1">{exporter.description}</div>
              </button>
            ))}
          </div>

          {/* Right panel */}
          <div className="w-2/3 flex flex-col overflow-hidden bg-gray-900 text-gray-100">
            <div className="flex-1 p-4 overflow-y-auto">
              {resultsArr.length > 0 ? (
                resultsArr.map((result, idx) => (
                  <div key={idx} className="mb-6 last:mb-0">
                    <div className="text-xs font-mono text-gray-400 mb-2 border-b border-gray-700 pb-1">
                      {result.filename}
                    </div>
                    <pre className="text-sm font-mono whitespace-pre-wrap">
                      <code>{result.content}</code>
                    </pre>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 mt-10">
                  {t('export.noPreview')}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-700 bg-gray-800">
              <p className="text-xs text-amber-500 mb-4">{t('export.compatibilityWarning')}</p>
              <div className="flex justify-end">
                <button
                  onClick={handleDownload}
                  disabled={resultsArr.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-700 text-white hover:bg-teal-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" /> {t('export.download')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
