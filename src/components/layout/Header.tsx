import { ChangeEvent, useRef, useState } from 'react';
import { Database, Upload, Download, Trash2, GitBranch, Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../store/useProjectStore';
import { DatabaseEngine } from '../../types/tablespec';
import { PROFILES } from '../../data/column-types';

export function Header() {
  const { t, i18n } = useTranslation();
  const spec = useProjectStore(state => state.spec);
  const setDatabase = useProjectStore(state => state.setDatabase);
  const importSpec = useProjectStore(state => state.importSpec);
  const resetSpec = useProjectStore(state => state.resetSpec);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const groupedProfiles = PROFILES.reduce((acc, profile) => {
    if (!acc[profile.engine]) {
      acc[profile.engine] = [];
    }
    acc[profile.engine].push(profile);
    return acc;
  }, {} as Record<string, typeof PROFILES>);

  const handleEngineChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const [engine, version] = e.target.value.split(':');
    setDatabase(engine as DatabaseEngine, version);
  };

  const handleLangChange = (e: ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const content = ev.target?.result as string;
        const parsed = JSON.parse(content);
        importSpec(parsed);
      } catch (err) {
        console.error('Failed to import spec', err);
        alert(t('header.invalidJson'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
    setIsMenuOpen(false);
  };

  const handleReset = () => {
    if (confirm(t('header.confirmReset'))) {
      resetSpec();
      setIsMenuOpen(false);
    }
  };

  const openExportDialog = () => {
    window.dispatchEvent(new CustomEvent('open-export-dialog'));
    setIsMenuOpen(false);
  };

  const openMermaidPreview = () => {
    window.dispatchEvent(new CustomEvent('open-mermaid-preview'));
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-gray-900 h-14 flex items-center justify-between px-4 md:px-6 relative z-50">
      <div className="flex items-center gap-3 md:gap-5 flex-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex items-center gap-2 mr-1 flex-shrink-0">
          <Database className="w-5 h-5 text-blue-400" />
          <h1 className="font-bold text-white tracking-tight hidden sm:block">TableSpec</h1>
        </div>
        
        <div className="h-6 w-px bg-gray-700 hidden sm:block flex-shrink-0" />
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <input
            id="projectName"
            type="text"
            value={spec.projectName || ''}
            onChange={(e) => useProjectStore.getState().setProjectName(e.target.value)}
            placeholder={t('header.projectNamePlaceholder')}
            className="bg-gray-800 text-gray-100 placeholder-gray-500 border border-transparent hover:border-gray-600 focus:border-blue-500 focus:bg-gray-900 rounded-none px-2 py-1 text-sm font-medium transition-colors w-32 sm:w-48 md:w-64 outline-none"
          />
          <select
            id="rdbms"
            value={`${spec.database.engine}:${spec.database.version}`}
            onChange={handleEngineChange}
            className="border border-gray-600 rounded-none px-2 py-1 text-sm bg-gray-800 text-white font-medium focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            {Object.entries(groupedProfiles).map(([engine, profiles]) => (
              <optgroup key={engine} label={engine.toUpperCase()}>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
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
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div className="hidden xl:flex items-center gap-2 flex-shrink-0 pl-4">
        <div className="flex items-center mr-1">
          <select
            value={i18n.language}
            onChange={handleLangChange}
            className="bg-gray-800 border-gray-600 text-gray-400 text-xs rounded-none border px-1 py-1 focus:outline-none focus:border-gray-400 cursor-pointer"
          >
            <option value="ja">JA</option>
            <option value="en">EN</option>
          </select>
        </div>
        
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={handleImportClick}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-200 bg-gray-800 border border-gray-600 rounded-none hover:bg-gray-700 transition-colors"
          title={t('header.import')}
        >
          <Download className="w-4 h-4" />
          <span>{t('header.import')}</span>
        </button>
        <button
          onClick={openMermaidPreview}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-200 bg-gray-800 border border-gray-600 rounded-none hover:bg-gray-700 transition-colors"
          title={t('header.erDiagram')}
        >
          <GitBranch className="w-4 h-4" />
          <span>{t('header.erDiagram')}</span>
        </button>
        <button
          onClick={openExportDialog}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-teal-700 border border-teal-600 rounded-none hover:bg-teal-600 transition-colors"
          title={t('header.export')}
        >
          <Upload className="w-4 h-4" />
          <span>{t('header.export')}</span>
        </button>
        
        <div className="h-4 w-px bg-gray-700 mx-1" />
        
        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-400 bg-gray-800 border border-gray-600 rounded-none hover:bg-red-900/50 hover:border-red-700 transition-colors"
          title={t('header.reset')}
        >
          <Trash2 className="w-4 h-4" />
          <span>{t('header.reset')}</span>
        </button>
      </div>

      {isMenuOpen && (
        <div className="absolute top-14 left-0 w-full bg-gray-900 border-b border-gray-700 shadow-xl flex flex-col xl:hidden py-2">
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-800">
            <span className="text-sm font-medium text-gray-400">Language</span>
            <select
              value={i18n.language}
              onChange={handleLangChange}
              className="bg-gray-800 border-gray-600 text-gray-200 text-sm rounded-none border px-2 py-1 focus:outline-none focus:border-gray-400"
            >
              <option value="ja">日本語</option>
              <option value="en">English</option>
            </select>
          </div>
          
          <button
            onClick={handleImportClick}
            className="flex items-center gap-3 px-6 py-4 text-sm font-medium text-gray-200 hover:bg-gray-800 transition-colors text-left"
          >
            <Download className="w-5 h-5" />
            {t('header.import')}
          </button>
          <button
            onClick={openMermaidPreview}
            className="flex items-center gap-3 px-6 py-4 text-sm font-medium text-gray-200 hover:bg-gray-800 transition-colors text-left"
          >
            <GitBranch className="w-5 h-5" />
            {t('header.erDiagram')}
          </button>
          <button
            onClick={openExportDialog}
            className="flex items-center gap-3 px-6 py-4 text-sm font-medium text-teal-400 hover:bg-gray-800 transition-colors text-left"
          >
            <Upload className="w-5 h-5" />
            {t('header.export')}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-3 px-6 py-4 text-sm font-medium text-red-400 hover:bg-red-900/20 transition-colors text-left border-t border-gray-800 mt-2"
          >
            <Trash2 className="w-5 h-5" />
            {t('header.reset')}
          </button>
        </div>
      )}
    </header>
  );
}
