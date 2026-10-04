import { Link, ListOrdered, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../store/useProjectStore';
import { useUiStore } from '../../store/useUiStore';
import { getColumnTypes } from '../../data/column-types';
import type { Table } from '../../types/tablespec';
import { CommitInput } from '../ui/CommitInput';
import { ColumnGrid } from './ColumnGrid';

const HEADER_INPUT =
  'px-2 py-1 sm:py-0.5 bg-gray-700 placeholder-gray-400 border border-transparent hover:border-gray-500 focus:bg-gray-600 focus:border-gray-500 focus:outline-none w-full transition-colors';
const HEADER_BUTTON = 'p-2 text-gray-400 hover:bg-gray-700 transition-colors';

export function TableCard({ table }: { table: Table }) {
  const { t } = useTranslation();
  const engine = useProjectStore((state) => state.spec.database.engine);
  const version = useProjectStore((state) => state.spec.database.version);
  const updateTableName = useProjectStore((state) => state.updateTableName);
  const updateTableComment = useProjectStore((state) => state.updateTableComment);
  const removeTable = useProjectStore((state) => state.removeTable);
  const openDialog = useUiStore((state) => state.openDialog);

  const columnTypes = getColumnTypes(engine, version);
  const openRelationEditor = () => openDialog({ type: 'relation', tableId: table.id });

  return (
    <div className="bg-white border border-gray-300 shadow-sm">
      <div className="px-3 sm:px-4 py-2 border-b border-gray-300 flex flex-col sm:flex-row sm:items-center justify-between bg-gray-800 gap-2 sm:gap-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1">
          <CommitInput
            value={table.name}
            onCommit={(name) => updateTableName(table.id, name)}
            placeholder={t('table.tableName')}
            className={`${HEADER_INPUT} font-bold text-white sm:w-64`}
          />
          <input
            type="text"
            value={table.comment}
            onChange={(e) => updateTableComment(table.id, e.target.value)}
            placeholder={t('table.tableComment')}
            className={`${HEADER_INPUT} text-sm text-gray-200 sm:flex-1 sm:max-w-xs`}
          />
        </div>
        <div className="flex items-center justify-end gap-1 sm:gap-2">
          <button onClick={openRelationEditor} className={`${HEADER_BUTTON} hover:text-white`} title={t('table.foreignKeysTitle')}>
            <Link className="w-5 h-5" />
          </button>
          <button
            onClick={() => openDialog({ type: 'index', tableId: table.id })}
            className={`${HEADER_BUTTON} hover:text-white`}
            title={t('table.indexesTitle')}
          >
            <ListOrdered className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              if (confirm(t('table.confirmDeleteTable'))) removeTable(table.id);
            }}
            className={`${HEADER_BUTTON} hover:text-red-400`}
            title={t('table.deleteTableTitle')}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <ColumnGrid table={table} columnTypes={columnTypes} onEditRelation={openRelationEditor} />
    </div>
  );
}
