import { ReactNode } from 'react';
import { Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ColumnTypeInfo } from '../../data/column-types';
import type { Column, Table } from '../../types/tablespec';
import { useProjectStore } from '../../store/useProjectStore';
import { CommitInput } from '../ui/CommitInput';
import { ColumnPatch, DefaultInput, RelationCell, SizeInputs, TypeSelect } from './column-cells';

type BooleanKey = 'primaryKey' | 'nullable' | 'unique' | 'autoIncrement' | 'unsigned';

interface CellContext {
  column: Column;
  typeInfo: ColumnTypeInfo | undefined;
  patch: ColumnPatch;
}

interface RowDef {
  key: string;
  labelKey: string;
  align?: 'center';
  render: (ctx: CellContext) => ReactNode;
}

interface Props {
  table: Table;
  columnTypes: ColumnTypeInfo[];
  onEditRelation: () => void;
}

const checkboxRow = (key: BooleanKey, labelKey: string, isEnabled?: (ctx: CellContext) => boolean): RowDef => ({
  key,
  labelKey,
  align: 'center',
  render: (ctx) => (
    <input
      type="checkbox"
      checked={ctx.column[key]}
      disabled={isEnabled ? !isEnabled(ctx) : false}
      onChange={(e) => ctx.patch({ [key]: e.target.checked })}
    />
  ),
});

const LABEL_CELL =
  'sticky left-0 bg-gray-700 text-white z-10 p-2 border-r border-gray-600 font-medium shadow-[2px_0_4px_rgba(0,0,0,0.1)]';

export function ColumnGrid({ table, columnTypes, onEditRelation }: Props) {
  const { t } = useTranslation();
  const addColumn = useProjectStore((state) => state.addColumn);
  const removeColumn = useProjectStore((state) => state.removeColumn);
  const updateColumn = useProjectStore((state) => state.updateColumn);

  // 型マスタに UNSIGNED 対応型があるエンジン（MariaDB / MySQL）でのみ行を表示する
  const supportsUnsigned = columnTypes.some((tc) => tc.hasUnsigned);

  const rows: RowDef[] = [
    {
      key: 'name',
      labelKey: 'table.colName',
      render: ({ column, patch }) => (
        <div className="relative group">
          <CommitInput
            value={column.name}
            onCommit={(name) => patch({ name })}
            className="w-full px-2 py-1 border rounded pr-7"
          />
          <button
            onClick={() => removeColumn(table.id, column.id)}
            className="absolute top-1/2 right-1 -translate-y-1/2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={t('table.deleteColumnTitle')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
    {
      key: 'type',
      labelKey: 'table.colType',
      render: ({ column, patch }) => (
        <TypeSelect column={column} columnTypes={columnTypes} onChange={patch} className="w-full px-2 py-1 border rounded" />
      ),
    },
    {
      key: 'length',
      labelKey: 'table.colLength',
      render: ({ column, typeInfo, patch }) => <SizeInputs column={column} typeInfo={typeInfo} onChange={patch} />,
    },
    checkboxRow('primaryKey', 'table.colPk'),
    checkboxRow('nullable', 'table.colNullable'),
    checkboxRow('unique', 'table.colUnique'),
    checkboxRow('autoIncrement', 'table.colAutoIncrement'),
    ...(supportsUnsigned ? [checkboxRow('unsigned', 'table.colUnsigned', ({ typeInfo }) => !!typeInfo?.hasUnsigned)] : []),
    {
      key: 'default',
      labelKey: 'table.colDefault',
      render: ({ column, patch }) => <DefaultInput column={column} onChange={patch} />,
    },
    {
      key: 'comment',
      labelKey: 'table.colComment',
      render: ({ column, patch }) => (
        <input
          type="text"
          value={column.comment}
          onChange={(e) => patch({ comment: e.target.value })}
          className="w-full px-2 py-1 border rounded"
        />
      ),
    },
    {
      key: 'relation',
      labelKey: 'table.colRelation',
      align: 'center',
      render: ({ column }) => <RelationCell column={column} foreignKeys={table.foreignKeys} onEdit={onEditRelation} />,
    },
  ];

  const contexts: CellContext[] = table.columns.map((column) => ({
    column,
    typeInfo: columnTypes.find((tc) => tc.name === column.type),
    patch: (updates) => updateColumn(table.id, column.id, updates),
  }));

  return (
    <div className="overflow-x-auto relative flex">
      <table className="text-left text-sm whitespace-nowrap border-collapse" style={{ minWidth: 'max-content' }}>
        <tbody className="[&>tr:nth-child(even)]:bg-blue-50/50">
          {rows.map((row, i) => (
            <tr key={row.key} className={i > 0 ? 'border-t' : undefined}>
              <th className={`${LABEL_CELL} ${i === 0 ? 'w-28' : ''}`}>{t(row.labelKey)}</th>
              {contexts.map((ctx) => (
                <td key={ctx.column.id} className={`p-2 border-r w-40 ${row.align === 'center' ? 'text-center' : ''}`}>
                  {row.render(ctx)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={() => addColumn(table.id)}
        className="flex-shrink-0 w-40 bg-gray-100 hover:bg-blue-100 border-l-2 border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors"
        title={t('table.addColumnTitle')}
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}
