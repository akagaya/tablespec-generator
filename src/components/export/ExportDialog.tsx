import { useMemo, useState } from 'react';
import { AlertTriangle, Check, Copy, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../store/useProjectStore';
import { exporterRegistry } from '../../exporters';
import { runExporter } from '../../exporters/run';
import { downloadResults } from '../../lib/download';
import { useCopy } from '../../hooks/useCopy';
import type { ExportResult } from '../../types/exporter';
import { Modal } from '../ui/Modal';
import { buttonClass } from '../ui/styles';

function ResultBlock({ result }: { result: ExportResult }) {
  const { t } = useTranslation();
  const { copied, copy } = useCopy();

  return (
    <div className="overflow-hidden rounded-lg border border-gray-700">
      <div className="flex items-center justify-between gap-2 border-b border-gray-700 bg-gray-800 px-3 py-1.5">
        <span className="truncate font-mono text-xs text-gray-300">{result.filename}</span>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={() => copy(result.content)}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? t('export.copied') : t('export.copy')}
          </button>
          <button
            onClick={() => downloadResults([result])}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-300 hover:bg-gray-700 hover:text-white"
            aria-label={`${t('export.download')}: ${result.filename}`}
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-gray-100 sm:text-sm">
        <code>{result.content}</code>
      </pre>
    </div>
  );
}

export function ExportDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const spec = useProjectStore((state) => state.spec);
  const exporters = exporterRegistry.getAll();
  const [selectedId, setSelectedId] = useState(exporters[0]?.id ?? '');

  const results = useMemo(() => runExporter(exporterRegistry.get(selectedId), spec), [selectedId, spec]);

  return (
    <Modal
      title={t('export.title')}
      subtitle={t('export.description')}
      onClose={onClose}
      size="xl"
      bodyClassName="flex flex-col md:flex-row md:h-[70vh] overflow-hidden"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-xs text-amber-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {t('export.compatibilityWarning')}
          </p>
          <button
            onClick={() => {
              downloadResults(results);
              onClose();
            }}
            disabled={results.length === 0}
            className={`${buttonClass.accent} shrink-0`}
          >
            <Download className="h-4 w-4" /> {t('export.download')}
          </button>
        </div>
      }
    >
      {/* モバイル: 横スクロールのチップ / md 以上: 縦リスト */}
      <nav
        aria-label={t('export.format')}
        className="flex shrink-0 gap-2 overflow-x-auto border-b bg-gray-50 p-3 md:w-64 md:flex-col md:overflow-y-auto md:border-b-0 md:border-r"
      >
        {exporters.map((exporter) => {
          const isSelected = selectedId === exporter.id;
          return (
            <button
              key={exporter.id}
              onClick={() => setSelectedId(exporter.id)}
              aria-pressed={isSelected}
              className={`shrink-0 rounded-lg border px-3 py-2 text-left transition-colors ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="whitespace-nowrap text-sm font-medium text-gray-900">{exporter.name}</div>
              <div className="mt-0.5 hidden text-xs text-gray-600 md:block">{exporter.description}</div>
            </button>
          );
        })}
      </nav>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-gray-900 p-3 sm:p-4">
        {results.length > 0 ? (
          results.map((result) => <ResultBlock key={result.filename} result={result} />)
        ) : (
          <div className="mt-10 text-center text-gray-400">{t('export.noPreview')}</div>
        )}
      </div>
    </Modal>
  );
}
