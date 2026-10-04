import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Link, ListOrdered, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../store/useProjectStore';
import { useUiStore } from '../../store/useUiStore';
import { getColumnTypes } from '../../data/column-types';
import type { Table } from '../../types/tablespec';
import { useIsDesktop } from '../../hooks/useMediaQuery';
import { CommitInput } from '../ui/CommitInput';
import { darkIconButtonClass } from '../ui/styles';
import { ColumnGrid } from './ColumnGrid';
import { ColumnList } from './ColumnList';

const HEADER_INPUT =
  'min-w-0 rounded-md border border-transparent bg-transparent px-2 py-1 placeholder-gray-400 transition-colors hover:border-gray-600 focus:border-blue-400 focus:bg-gray-700 focus:outline-none';

function CountButton({
  icon: Icon,
  label,
  count,
  onClick,
}: {
  icon: typeof Link;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`${darkIconButtonClass} gap-1.5 hover:bg-gray-700 hover:text-white`}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden text-xs font-medium lg:inline">{label}</span>
      {count > 0 && (
        <span className="rounded-full bg-blue-600 px-1.5 text-[10px] font-bold leading-4 text-white">{count}</span>
      )}
    </button>
  );
}

export function TableCard({ table }: { table: Table }) {
  const { t } = useTranslation();
  const engine = useProjectStore((state) => state.spec.database.engine);
  const version = useProjectStore((state) => state.spec.database.version);
  const updateTableName = useProjectStore((state) => state.updateTableName);
  const updateTableComment = useProjectStore((state) => state.updateTableComment);
  const removeTable = useProjectStore((state) => state.removeTable);
  const openDialog = useUiStore((state) => state.openDialog);
  const isFocused = useUiStore((state) => state.focusedTableId === table.id);
  const focusTable = useUiStore((state) => state.focusTable);
  const isDesktop = useIsDesktop();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isFocused) return;
    setIsCollapsed(false);
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const timer = setTimeout(() => focusTable(null), 1500);
    return () => clearTimeout(timer);
  }, [isFocused, focusTable]);

  const columnTypes = getColumnTypes(engine, version);
  const openRelationEditor = () => openDialog({ type: 'relation', tableId: table.id });
  const Body = isDesktop ? ColumnGrid : ColumnList;

  return (
    <section
      ref={cardRef}
      id={`table-${table.id}`}
      className={`scroll-mt-4 overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow ${
        isFocused ? 'border-blue-400 ring-4 ring-blue-200' : 'border-gray-200'
      }`}
    >
      <header className="flex flex-wrap items-center gap-x-2 gap-y-1 bg-gray-800 px-2 py-2 sm:px-3">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? t('table.expand') : t('table.collapse')}
          className={`${darkIconButtonClass} p-1 hover:bg-gray-700 hover:text-white`}
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
        </button>
        <CommitInput
          value={table.name}
          onCommit={(name) => updateTableName(table.id, name)}
          placeholder={t('table.tableName')}
          aria-label={t('table.tableName')}
          className={`${HEADER_INPUT} w-0 flex-1 font-mono font-bold text-white sm:max-w-64`}
        />
        <span className="hidden shrink-0 text-xs text-gray-300 sm:inline">
          {t('table.columnCount', { count: table.columns.length })}
        </span>
        <input
          type="text"
          value={table.comment}
          onChange={(e) => updateTableComment(table.id, e.target.value)}
          placeholder={t('table.tableComment')}
          aria-label={t('table.tableComment')}
          className={`${HEADER_INPUT} order-last w-full text-sm text-gray-300 sm:order-none sm:w-auto sm:flex-1`}
        />
        <div className="ml-auto flex shrink-0 items-center">
          <CountButton
            icon={Link}
            label={t('table.foreignKeysTitle')}
            count={table.foreignKeys.length}
            onClick={openRelationEditor}
          />
          <CountButton
            icon={ListOrdered}
            label={t('table.indexesTitle')}
            count={table.indexes.length}
            onClick={() => openDialog({ type: 'index', tableId: table.id })}
          />
          <button
            onClick={() => {
              if (confirm(t('table.confirmDeleteTable', { name: table.name }))) removeTable(table.id);
            }}
            className={`${darkIconButtonClass} hover:bg-gray-700 hover:text-red-400`}
            title={t('table.deleteTableTitle')}
            aria-label={t('table.deleteTableTitle')}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      {!isCollapsed && <Body table={table} columnTypes={columnTypes} onEditRelation={openRelationEditor} />}
    </section>
  );
}
