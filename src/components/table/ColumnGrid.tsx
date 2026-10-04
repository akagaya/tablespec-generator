import { ReactNode } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ColumnTypeInfo } from '../../data/column-types';
import type { Column, Table } from '../../types/tablespec';
import { useProjectStore } from '../../store/useProjectStore';
import { CommitInput } from '../ui/CommitInput';
import { checkboxClass, inputClass } from '../ui/styles';
import { ColumnPatch, ConstraintBadges, DefaultInput, RelationCell, SizeInputs, TypeSelect } from './column-cells';
import { findTypeInfo, getBooleanFields } from './column-fields';

interface CellContext {
  column: Column;
  index: number;
  typeInfo: ColumnTypeInfo | undefined;
  patch: ColumnPatch;
}

interface RowDef {
  key: string;
  label: ReactNode;
  align?: 'center';
  render: (ctx: CellContext) => ReactNode;
}

interface Props {
  table: Table;
  columnTypes: ColumnTypeInfo[];
  onEditRelation: () => void;
}

const LABEL_CELL =
  'sticky left-0 z-10 w-32 min-w-32 border-r border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]';

/** デスクトップ用：行＝属性、列＝カラムの横展開グリッド */
export function ColumnGrid({ table, columnTypes, onEditRelation }: Props) {
  const { t } = useTranslation();
  const addColumn = useProjectStore((state) => state.addColumn);
  const removeColumn = useProjectStore((state) => state.removeColumn);
  const updateColumn = useProjectStore((state) => state.updateColumn);

  const rows: RowDef[] = [
    {
      key: 'name',
      label: t('table.colName'),
      render: ({ column, patch }) => (
        <CommitInput
          value={column.name}
          onCommit={(name) => patch({ name })}
          placeholder={t('table.colName')}
          className={`${inputClass} font-mono font-semibold`}
        />
      ),
    },
    {
      key: 'type',
      label: t('table.colType'),
      render: ({ column, patch }) => <TypeSelect column={column} columnTypes={columnTypes} onChange={patch} />,
    },
    {
      key: 'length',
      label: t('table.colSize'),
      render: ({ column, typeInfo, patch }) => <SizeInputs column={column} typeInfo={typeInfo} onChange={patch} />,
    },
    ...getBooleanFields(columnTypes).map(
      (field): RowDef => ({
        key: field.key,
        label: t(field.labelKey),
        align: 'center',
        render: ({ column, typeInfo, patch }) => (
          <input
            type="checkbox"
            className={checkboxClass}
            aria-label={`${column.name} ${t(field.labelKey)}`}
            checked={column[field.key]}
            disabled={field.isEnabled ? !field.isEnabled(typeInfo) : false}
            onChange={(e) => patch({ [field.key]: e.target.checked })}
          />
        ),
      }),
    ),
    {
      key: 'default',
      label: t('table.colDefault'),
      render: ({ column, patch }) => <DefaultInput column={column} onChange={patch} />,
    },
    {
      key: 'comment',
      label: t('table.colComment'),
      render: ({ column, patch }) => (
        <input
          type="text"
          value={column.comment}
          onChange={(e) => patch({ comment: e.target.value })}
          className={inputClass}
        />
      ),
    },
    {
      key: 'relation',
      label: t('table.colRelation'),
      align: 'center',
      render: ({ column }) => <RelationCell column={column} foreignKeys={table.foreignKeys} onEdit={onEditRelation} />,
    },
  ];

  const contexts: CellContext[] = table.columns.map((column, index) => ({
    column,
    index,
    typeInfo: findTypeInfo(columnTypes, column),
    patch: (updates) => updateColumn(table.id, column.id, updates),
  }));

  return (
    <div className="flex overflow-x-auto">
      <table className="shrink-0 border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th className={`${LABEL_CELL} border-b`}>#</th>
            {contexts.map(({ column, index }) => (
              <th key={column.id} className="w-44 min-w-44 border-b border-r border-gray-200 bg-gray-50 px-2 py-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-xs font-medium text-gray-400">
                    {index + 1}
                    <ConstraintBadges column={column} />
                  </span>
                  <button
                    onClick={() => removeColumn(table.id, column.id)}
                    className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-600"
                    title={t('table.deleteColumnTitle')}
                    aria-label={`${t('table.deleteColumnTitle')}: ${column.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="group/row">
              <th scope="row" className={`${LABEL_CELL} border-b`}>
                {row.label}
              </th>
              {contexts.map((ctx) => (
                <td
                  key={ctx.column.id}
                  className={`border-b border-r border-gray-100 px-2 py-1.5 group-hover/row:bg-blue-50/40 ${
                    row.align === 'center' ? 'text-center' : ''
                  }`}
                >
                  {row.render(ctx)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="w-32 shrink-0 p-2">
        <button
          onClick={() => addColumn(table.id)}
          className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-200 text-xs font-medium text-gray-400 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
        >
          <Plus className="h-5 w-5" />
          {t('table.addColumnTitle')}
        </button>
      </div>
    </div>
  );
}
