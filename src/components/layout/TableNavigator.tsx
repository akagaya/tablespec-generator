import { Plus, Table2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../store/useProjectStore';
import { useUiStore } from '../../store/useUiStore';
import { useAddTable } from '../../hooks/useAddTable';

/** lg 以上で表示するテーブル一覧（クリックで該当テーブルへ移動） */
export function TableNavigator() {
  const { t } = useTranslation();
  const tables = useProjectStore((state) => state.spec.tables);
  const focusTable = useUiStore((state) => state.focusTable);
  const addTable = useAddTable();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-white lg:flex">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {t('workspace.tables')} <span className="text-gray-400">({tables.length})</span>
        </h2>
        <button
          onClick={addTable}
          className="rounded-md p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
          title={t('table.addTable')}
          aria-label={t('table.addTable')}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {tables.map((table) => (
          <button
            key={table.id}
            onClick={() => focusTable(table.id)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100"
          >
            <Table2 className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="flex-1 truncate font-mono">{table.name || t('relationEditor.unnamed')}</span>
            <span className="text-xs text-gray-400">{table.columns.length}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
