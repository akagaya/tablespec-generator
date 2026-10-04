import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Download, Loader2, Minus, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../store/useProjectStore';
import { exporterRegistry } from '../../exporters';
import { runExporter } from '../../exporters/run';
import { downloadResults } from '../../lib/download';
import { useCopy } from '../../hooks/useCopy';
import { Modal } from '../ui/Modal';
import { buttonClass } from '../ui/styles';

type RenderState = { status: 'loading' } | { status: 'done'; svg: string } | { status: 'error' };

let renderCount = 0;

// mermaid は巨大なため、ER図を開いたときに初めて読み込む
async function renderMermaid(code: string): Promise<string> {
  const { default: mermaid } = await import('mermaid');
  mermaid.initialize({ startOnLoad: false, theme: 'default', er: { useMaxWidth: false } });
  const { svg } = await mermaid.render(`mermaid-${++renderCount}`, code);
  return svg;
}

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function MermaidPreview({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const spec = useProjectStore((state) => state.spec);
  const [state, setState] = useState<RenderState>({ status: 'loading' });
  const [zoomIndex, setZoomIndex] = useState(2);
  const { copied, copy } = useCopy();

  const result = useMemo(
    () => (spec.tables.length > 0 ? runExporter(exporterRegistry.get('mermaid'), spec)[0] : undefined),
    [spec],
  );
  const mermaidCode = result?.content ?? '';

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

  const zoom = ZOOM_STEPS[zoomIndex];

  return (
    <Modal
      title={t('mermaid.title')}
      onClose={onClose}
      size="xl"
      bodyClassName="relative bg-[radial-gradient(circle,#e5e7eb_1px,transparent_1px)] bg-[length:16px_16px] md:h-[70vh]"
      footer={
        <div className="flex flex-col gap-3">
          <details className="text-xs text-gray-600">
            <summary className="cursor-pointer font-medium hover:text-gray-700">{t('mermaid.showCode')}</summary>
            <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-gray-900 p-3 font-mono text-xs text-gray-200">
              {mermaidCode}
            </pre>
          </details>
          <div className="flex flex-wrap justify-end gap-2">
            <button onClick={() => copy(mermaidCode)} disabled={!mermaidCode} className={buttonClass.secondary}>
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              {copied ? t('export.copied') : t('mermaid.copyCode')}
            </button>
            <button
              onClick={() => result && downloadResults([result])}
              disabled={!result}
              className={buttonClass.secondary}
            >
              <Download className="h-4 w-4" /> .mmd
            </button>
            <button onClick={onClose} className={buttonClass.primary}>
              {t('mermaid.close')}
            </button>
          </div>
        </div>
      }
    >
      {state.status === 'done' && mermaidCode && (
        <div className="sticky left-0 top-0 z-10 flex justify-end p-2">
          <div className="flex items-center rounded-md border bg-white shadow-sm">
            <button
              onClick={() => setZoomIndex(Math.max(0, zoomIndex - 1))}
              disabled={zoomIndex === 0}
              className="p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
              aria-label={t('mermaid.zoomOut')}
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoomIndex(2)}
              className="min-w-14 border-x px-2 text-xs font-medium tabular-nums text-gray-600 hover:bg-gray-100"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => setZoomIndex(Math.min(ZOOM_STEPS.length - 1, zoomIndex + 1))}
              disabled={zoomIndex === ZOOM_STEPS.length - 1}
              className="p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
              aria-label={t('mermaid.zoomIn')}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {!mermaidCode ? (
        <p className="mt-20 text-center text-gray-500">{t('mermaid.noTables')}</p>
      ) : state.status === 'loading' ? (
        <p className="mt-20 flex items-center justify-center gap-2 text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('mermaid.loading')}
        </p>
      ) : state.status === 'error' ? (
        <p className="p-4 text-center text-red-600">{t('mermaid.renderError')}</p>
      ) : (
        <div className="p-4 sm:p-6">
          <div
            className="mx-auto w-fit origin-top [&_svg]:max-w-none"
            style={{ zoom }}
            dangerouslySetInnerHTML={{ __html: state.svg }}
          />
        </div>
      )}
    </Modal>
  );
}
