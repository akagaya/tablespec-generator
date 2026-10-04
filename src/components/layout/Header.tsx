import { useEffect, useRef, useState } from 'react';
import { Database, Upload, Download, Trash2, GitBranch, MoreVertical, LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../store/useProjectStore';
import { useUiStore } from '../../store/useUiStore';
import type { DatabaseEngine } from '../../types/tablespec';
import { groupProfilesByEngine } from '../../data/column-types';
import { useSpecImport } from '../../hooks/useSpecImport';
import { LANGUAGES } from '../../i18n';

interface Action {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

const PROFILE_GROUPS = groupProfilesByEngine();

const DARK_FIELD =
  'rounded-md border border-gray-600 bg-gray-800 px-2 py-1.5 text-sm text-gray-100 outline-none transition-colors hover:border-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30';

function DatabaseSelect({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  const database = useProjectStore((state) => state.spec.database);
  const setDatabase = useProjectStore((state) => state.setDatabase);

  return (
    <select
      value={`${database.engine}:${database.version}`}
      onChange={(e) => {
        const [engine, version] = e.target.value.split(':');
        setDatabase(engine as DatabaseEngine, version);
      }}
      aria-label={t('header.database')}
      className={`${DARK_FIELD} font-medium ${className}`}
    >
      {PROFILE_GROUPS.map(([engine, profiles]) => (
        <optgroup key={engine} label={engine.toUpperCase()}>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

/**
 * レイアウト:
 * - lg 以上: すべての操作をボタンで表示
 * - md〜lg: ER図・エクスポートはアイコンのみ、その他はメニュー
 * - md 未満: DB 選択もメニューへ移し、エクスポートのみアイコン表示
 */
export function Header() {
  const { t, i18n } = useTranslation();
  const projectName = useProjectStore((state) => state.spec.projectName);
  const setProjectName = useProjectStore((state) => state.setProjectName);
  const resetSpec = useProjectStore((state) => state.resetSpec);
  const openDialog = useUiStore((state) => state.openDialog);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeMenu = () => setIsMenuOpen(false);
  const specImport = useSpecImport(closeMenu);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handlePointer = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setIsMenuOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsMenuOpen(false);
    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isMenuOpen]);

  const withClose = (fn: () => void) => () => {
    fn();
    closeMenu();
  };

  const importAction: Action = { id: 'import', label: t('header.import'), icon: Download, onClick: specImport.open };
  const erAction: Action = {
    id: 'er',
    label: t('header.erDiagram'),
    icon: GitBranch,
    onClick: withClose(() => openDialog({ type: 'mermaid' })),
  };
  const exportAction: Action = {
    id: 'export',
    label: t('header.export'),
    icon: Upload,
    onClick: withClose(() => openDialog({ type: 'export' })),
  };
  const handleReset = () => {
    if (confirm(t('header.confirmReset'))) {
      resetSpec();
      closeMenu();
    }
  };

  const menuItem = ({ id, label, icon: Icon, onClick }: Action, className = '') => (
    <button
      key={id}
      onClick={onClick}
      role="menuitem"
      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-gray-800 ${className}`}
    >
      <Icon className="h-4 w-4 text-gray-400" />
      {label}
    </button>
  );

  return (
    <header className="relative z-40 flex h-14 shrink-0 items-center gap-2 bg-gray-900 px-3 sm:gap-3 sm:px-4">
      <input {...specImport.inputProps} />

      <div className="flex shrink-0 items-center gap-2">
        <Database className="h-5 w-5 text-blue-400" />
        <h1 className="hidden font-bold tracking-tight text-white md:block">TableSpec</h1>
      </div>
      <div className="hidden h-6 w-px bg-gray-700 md:block" />

      <input
        type="text"
        value={projectName ?? ''}
        onChange={(e) => setProjectName(e.target.value)}
        placeholder={t('header.projectNamePlaceholder')}
        aria-label={t('header.project')}
        className={`${DARK_FIELD} w-0 min-w-0 flex-1 font-medium sm:max-w-64`}
      />
      <DatabaseSelect className="hidden max-w-48 sm:block" />

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <button
          onClick={importAction.onClick}
          className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white lg:flex"
        >
          <Download className="h-4 w-4" />
          {importAction.label}
        </button>
        <button
          onClick={erAction.onClick}
          title={erAction.label}
          aria-label={erAction.label}
          className="hidden items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white md:flex lg:px-3"
        >
          <GitBranch className="h-4 w-4" />
          <span className="hidden lg:inline">{erAction.label}</span>
        </button>
        <button
          onClick={exportAction.onClick}
          title={exportAction.label}
          aria-label={exportAction.label}
          className="flex items-center gap-1.5 rounded-md bg-teal-700 px-2.5 py-1.5 text-sm font-semibold text-white hover:bg-teal-600 sm:px-3"
        >
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">{exportAction.label}</span>
        </button>

        <div ref={menuRef} className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="rounded-md p-1.5 text-gray-300 hover:bg-gray-800 hover:text-white"
            aria-label={t('header.menu')}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {isMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-lg border border-gray-700 bg-gray-900 py-1 shadow-2xl"
            >
              <div className="space-y-2 border-b border-gray-800 px-4 py-3 sm:hidden">
                <span className="block text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {t('header.database')}
                </span>
                <DatabaseSelect className="w-full" />
              </div>
              <div className="lg:hidden">{menuItem(importAction)}</div>
              <div className="md:hidden">{menuItem(erAction)}</div>
              <div className="flex items-center justify-between gap-2 px-4 py-2.5">
                <span className="text-sm text-gray-400">{t('header.language')}</span>
                <select
                  value={i18n.language}
                  onChange={(e) => i18n.changeLanguage(e.target.value)}
                  className={`${DARK_FIELD} py-1`}
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="my-1 border-t border-gray-800" />
              <button
                onClick={handleReset}
                role="menuitem"
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-900/30"
              >
                <Trash2 className="h-4 w-4" />
                {t('header.reset')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
