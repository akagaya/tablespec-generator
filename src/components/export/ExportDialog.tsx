import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../store/useProjectStore';
import { exporterRegistry } from '../../exporters';
import { runExporter } from '../../exporters/run';
import { downloadResults } from '../../lib/download';
import { Modal } from '../ui/Modal';

export function ExportDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const spec = useProjectStore((state) => state.spec);
  const exporters = exporterRegistry.getAll();
  const [selectedId, setSelectedId] = useState(exporters[0]?.id ?? '');

  const results = useMemo(() => runExporter(exporterRegistry.get(selectedId), spec), [selectedId, spec]);

  return (
    <Modal
      title={
        <>
          {t('export.title')}
          <span className="block text-sm font-normal text-gray-500 mt-1">{t('export.description')}</span>
        </>
      }
      onClose={onClose}
      size="xl"
      bodyClassName="flex h-[70vh] overflow-hidden"
    >
      <div className="w-1/3 border-r overflow-y-auto bg-gray-50 p-4 flex flex-col gap-2">
        <h3 className="font-semibold text-gray-700 mb-2">{t('export.format')}</h3>
        {exporters.map((exporter) => (
          <button
            key={exporter.id}
            onClick={() => setSelectedId(exporter.id)}
            className={`text-left p-3 border transition-colors ${
              selectedId === exporter.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-gray-900">{exporter.name}</div>
            <div className="text-xs text-gray-500 mt-1">{exporter.description}</div>
          </button>
        ))}
      </div>

      <div className="w-2/3 flex flex-col overflow-hidden bg-gray-900 text-gray-100">
        <div className="flex-1 p-4 overflow-y-auto">
          {results.length > 0 ? (
            results.map((result) => (
              <div key={result.filename} className="mb-6 last:mb-0">
                <div className="text-xs font-mono text-gray-400 mb-2 border-b border-gray-700 pb-1">{result.filename}</div>
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  <code>{result.content}</code>
                </pre>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 mt-10">{t('export.noPreview')}</div>
          )}
        </div>

        <div className="p-4 border-t border-gray-700 bg-gray-800">
          <p className="text-xs text-amber-500 mb-4">{t('export.compatibilityWarning')}</p>
          <div className="flex justify-end">
            <button
              onClick={() => {
                downloadResults(results);
                onClose();
              }}
              disabled={results.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-teal-700 text-white hover:bg-teal-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" /> {t('export.download')}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
