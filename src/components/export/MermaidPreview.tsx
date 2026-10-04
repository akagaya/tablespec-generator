import { useEffect, useMemo, useState } from 'react';
import { GitBranch } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../store/useProjectStore';
import { exporterRegistry } from '../../exporters';
import { runExporter } from '../../exporters/run';
import { Modal } from '../ui/Modal';

type RenderState = { status: 'loading' } | { status: 'done'; svg: string } | { status: 'error' };

let renderCount = 0;

// mermaid は巨大なため、ER図を開いたときに初めて読み込む
async function renderMermaid(code: string): Promise<string> {
  const { default: mermaid } = await import('mermaid');
  mermaid.initialize({ startOnLoad: false, theme: 'default', er: { useMaxWidth: true } });
  const { svg } = await mermaid.render(`mermaid-${++renderCount}`, code);
  return svg;
}

export function MermaidPreview({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const spec = useProjectStore((state) => state.spec);
  const [state, setState] = useState<RenderState>({ status: 'loading' });

  const mermaidCode = useMemo(
    () => (spec.tables.length > 0 ? (runExporter(exporterRegistry.get('mermaid'), spec)[0]?.content ?? '') : ''),
    [spec],
  );

  useEffect(() => {
    if (!mermaidCode) return;
    let cancelled = false;
    setState({ status: 'loading' });
    renderMermaid(mermaidCode)
      .then((svg) => !cancelled && setState({ status: 'done', svg }))
      .catch((err) => {
        console.error('Mermaid render error', err);
        if (!cancelled) setState({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [mermaidCode]);

  return (
    <Modal
      title={
        <span className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-blue-600" />
          {t('mermaid.title')}
        </span>
      }
      onClose={onClose}
      size="xl"
      bodyClassName="p-6 bg-gray-50 flex items-start justify-center h-[70vh] overflow-auto"
      footer={
        <div className="flex items-center justify-between">
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer hover:text-gray-700 font-medium">{t('mermaid.showCode')}</summary>
            <pre className="mt-2 p-3 bg-gray-800 text-gray-200 rounded text-xs max-h-40 overflow-auto font-mono">
              {mermaidCode}
            </pre>
          </details>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm font-medium"
          >
            {t('mermaid.close')}
          </button>
        </div>
      }
    >
      {!mermaidCode ? (
        <p className="text-gray-400 text-center mt-20">{t('mermaid.noTables')}</p>
      ) : state.status === 'loading' ? (
        <p className="text-gray-400 text-center mt-20">{t('mermaid.loading')}</p>
      ) : state.status === 'error' ? (
        <p className="text-red-500 text-center p-4">{t('mermaid.renderError')}</p>
      ) : (
        <div className="min-h-[200px]" dangerouslySetInnerHTML={{ __html: state.svg }} />
      )}
    </Modal>
  );
}
