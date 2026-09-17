import { useEffect, useRef, useMemo } from 'react';
import { X, GitBranch } from 'lucide-react';
import mermaid from 'mermaid';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../store/useProjectStore';
import { exporterRegistry } from '../../exporters';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  er: {
    useMaxWidth: true,
  },
});

export function MermaidPreview({ isOpen, onClose }: Props) {
  const { t } = useTranslation();
  const spec = useProjectStore(state => state.spec);
  const containerRef = useRef<HTMLDivElement>(null);

  const mermaidCode = useMemo(() => {
    const exporter = exporterRegistry.get('mermaid');
    if (!exporter) return '';
    try {
      const result = exporter.generate(spec);
      const res = Array.isArray(result) ? result[0] : result;
      return res?.content || '';
    } catch {
      return '';
    }
  }, [spec]);

  useEffect(() => {
    if (!isOpen || !containerRef.current || !mermaidCode) return;

    const render = async () => {
      try {
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, mermaidCode);
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        if (containerRef.current) {
          containerRef.current.innerHTML = `<p class="text-red-500 text-center p-4">${t('mermaid.renderError')}</p>`;
        }
      }
    };

    render();
  }, [isOpen, mermaidCode, t]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold">{t('mermaid.title')}</h2>
          </div>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-gray-50 flex items-start justify-center">
          {mermaidCode ? (
            <div ref={containerRef} className="min-h-[200px]" />
          ) : (
            <p className="text-gray-400 text-center mt-20">{t('mermaid.noTables')}</p>
          )}
        </div>

        <div className="p-3 border-t bg-gray-100 flex items-center justify-between">
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer hover:text-gray-700 font-medium">{t('mermaid.showCode')}</summary>
            <pre className="mt-2 p-3 bg-gray-800 text-gray-200 rounded text-xs max-h-40 overflow-auto font-mono">{mermaidCode}</pre>
          </details>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm font-medium"
          >
            {t('mermaid.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
