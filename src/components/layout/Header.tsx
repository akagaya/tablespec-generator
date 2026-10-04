import { useState } from 'react';
import { Database, Upload, Download, Trash2, GitBranch, Menu, X, LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../store/useProjectStore';
import { useUiStore } from '../../store/useUiStore';
import type { DatabaseEngine } from '../../types/tablespec';
import { groupProfilesByEngine } from '../../data/column-types';
import { useSpecImport } from '../../hooks/useSpecImport';
import { LANGUAGES } from '../../i18n';

type Tone = 'default' | 'primary' | 'danger';

interface Action {
  id: string;
  label: string;
  icon: LucideIcon;
  tone: Tone;
  onClick: () => void;
}

const DESKTOP_TONE: Record<Tone, string> = {
  default: 'text-gray-200 bg-gray-800 border-gray-600 hover:bg-gray-700',
  primary: 'text-white bg-teal-700 border-teal-600 hover:bg-teal-600',
  danger: 'text-red-400 bg-gray-800 border-gray-600 hover:bg-red-900/50 hover:border-red-700',
};

const MOBILE_TONE: Record<Tone, string> = {
  default: 'text-gray-200 hover:bg-gray-800',
  primary: 'text-teal-400 hover:bg-gray-800',
  danger: 'text-red-400 hover:bg-red-900/20 border-t border-gray-800 mt-2',
};

const PROFILE_GROUPS = groupProfilesByEngine();

export function Header() {
  const { t, i18n } = useTranslation();
  const projectName = useProjectStore((state) => state.spec.projectName);
  const database = useProjectStore((state) => state.spec.database);
  const setProjectName = useProjectStore((state) => state.setProjectName);
  const setDatabase = useProjectStore((state) => state.setDatabase);
  const resetSpec = useProjectStore((state) => state.resetSpec);
  const openDialog = useUiStore((state) => state.openDialog);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);
  const specImport = useSpecImport(closeMenu);

  const actions: Action[] = [
    { id: 'import', label: t('header.import'), icon: Download, tone: 'default', onClick: specImport.open },
    {
      id: 'er',
      label: t('header.erDiagram'),
      icon: GitBranch,
      tone: 'default',
      onClick: () => {
        openDialog({ type: 'mermaid' });
        closeMenu();
      },
    },
    {
      id: 'export',
      label: t('header.export'),
      icon: Upload,
      tone: 'primary',
      onClick: () => {
        openDialog({ type: 'export' });
        closeMenu();
      },
    },
    {
      id: 'reset',
      label: t('header.reset'),
      icon: Trash2,
      tone: 'danger',
      onClick: () => {
        if (confirm(t('header.confirmReset'))) {
          resetSpec();
          closeMenu();
        }
      },
    },
  ];

  const languageSelect = (className: string, long: boolean) => (
    <select value={i18n.language} onChange={(e) => i18n.changeLanguage(e.target.value)} className={className}>
      {LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {long ? lang.label : lang.code.toUpperCase()}
        </option>
      ))}
    </select>
  );

  return (
    <header className="bg-gray-900 h-14 flex items-center justify-between px-4 md:px-6 relative z-40">
      <input {...specImport.inputProps} />

      <div className="flex items-center gap-3 md:gap-5 flex-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex items-center gap-2 mr-1 flex-shrink-0">
          <Database className="w-5 h-5 text-blue-400" />
          <h1 className="font-bold text-white tracking-tight hidden sm:block">TableSpec</h1>
        </div>

        <div className="h-6 w-px bg-gray-700 hidden sm:block flex-shrink-0" />

        <div className="flex items-center gap-2 flex-shrink-0">
          <input
            type="text"
            value={projectName ?? ''}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder={t('header.projectNamePlaceholder')}
            aria-label={t('header.project')}
            className="bg-gray-800 text-gray-100 placeholder-gray-500 border border-transparent hover:border-gray-600 focus:border-blue-500 focus:bg-gray-900 rounded-none px-2 py-1 text-sm font-medium transition-colors w-32 sm:w-48 md:w-64 outline-none"
          />
          <select
            value={`${database.engine}:${database.version}`}
            onChange={(e) => {
              const [engine, version] = e.target.value.split(':');
              setDatabase(engine as DatabaseEngine, version);
            }}
            aria-label={t('header.database')}
            className="border border-gray-600 rounded-none px-2 py-1 text-sm bg-gray-800 text-white font-medium focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
        </div>
      </div>

      <div className="flex-shrink-0 ml-2 xl:hidden">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
          aria-label={t('header.menu')}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div className="hidden xl:flex items-center gap-2 flex-shrink-0 pl-4">
        {languageSelect(
          'mr-1 bg-gray-800 border-gray-600 text-gray-400 text-xs rounded-none border px-1 py-1 focus:outline-none focus:border-gray-400 cursor-pointer',
          false,
        )}
        {actions.map(({ id, label, icon: Icon, tone, onClick }) => (
          <div key={id} className="contents">
            {tone === 'danger' && <div className="h-4 w-px bg-gray-700 mx-1" />}
            <button
              onClick={onClick}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium border rounded-none transition-colors ${DESKTOP_TONE[tone]}`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          </div>
        ))}
      </div>

      {isMenuOpen && (
        <div className="absolute top-14 left-0 w-full bg-gray-900 border-b border-gray-700 shadow-xl flex flex-col xl:hidden py-2">
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-800">
            <span className="text-sm font-medium text-gray-400">{t('header.language')}</span>
            {languageSelect(
              'bg-gray-800 border-gray-600 text-gray-200 text-sm rounded-none border px-2 py-1 focus:outline-none focus:border-gray-400',
              true,
            )}
          </div>
          {actions.map(({ id, label, icon: Icon, tone, onClick }) => (
            <button
              key={id}
              onClick={onClick}
              className={`flex items-center gap-3 px-6 py-4 text-sm font-medium transition-colors text-left ${MOBILE_TONE[tone]}`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
