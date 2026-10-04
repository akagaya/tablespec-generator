import { ReactNode, useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg' | 'xl';
  bodyClassName?: string;
}

const SIZE_CLASS = {
  md: 'sm:max-w-2xl',
  lg: 'sm:max-w-4xl',
  xl: 'sm:max-w-6xl',
} as const;

/**
 * モバイルでは全画面シート、sm 以上では中央ダイアログ。
 * Esc・背景クリックで閉じ、開いている間は背面のスクロールを止める。
 */
export function Modal({ title, subtitle, onClose, children, footer, size = 'md', bodyClassName = 'p-4' }: Props) {
  const { t } = useTranslation();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-gray-900/60 backdrop-blur-[1px] sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`flex w-full flex-col bg-white shadow-2xl outline-none sm:max-h-[90vh] sm:rounded-xl ${SIZE_CLASS[size]}`}
      >
        <div className="flex items-start justify-between gap-4 border-b px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-base font-bold text-gray-900 sm:text-lg">
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="-mr-1 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className={`min-h-0 flex-1 overflow-y-auto ${bodyClassName}`}>{children}</div>
        {footer && (
          <div className="border-t bg-gray-50 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:rounded-b-xl sm:px-5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
