import { useState } from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ColumnTypeInfo } from '../../data/column-types';
import type { Table } from '../../types/tablespec';
import { useProjectStore } from '../../store/useProjectStore';
import { CommitInput } from '../ui/CommitInput';
import { checkboxClass, inputClass, labelClass } from '../ui/styles';
import { ConstraintBadges, DefaultInput, RelationCell, SizeInputs, TypeSelect } from './column-cells';
import { findTypeInfo, getBooleanFields } from './column-fields';

interface Props {
  table: Table;
  columnTypes: ColumnTypeInfo[];
  onEditRelation: () => void;
}

/** モバイル用：カラムを縦に並べ、タップで展開して編集する */
export function ColumnList({ table, columnTypes, onEditRelation }: Props) {
  const { t } = useTranslation();
  const addColumn = useProjectStore((state) => state.addColumn);
  const removeColumn = useProjectStore((state) => state.removeColumn);
  const updateColumn = useProjectStore((state) => state.updateColumn);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const booleanFields = getBooleanFields(columnTypes);

  return (
    <div className="divide-y">
      {table.columns.map((column) => {
        const typeInfo = findTypeInfo(columnTypes, column);
        const patch = (updates: Parameters<typeof updateColumn>[2]) => updateColumn(table.id, column.id, updates);
        const isExpanded = expandedId === column.id;
        const size = column.enumValues?.length
          ? `(${column.enumValues.length})`
          : column.precision
            ? `(${column.precision}${column.scale !== undefined ? `,${column.scale}` : ''})`
            : column.length
              ? `(${column.length})`
              : '';

        return (
          <div key={column.id} className={isExpanded ? 'bg-blue-50/40' : undefined}>
            <button
              onClick={() => setExpandedId(isExpanded ? null : column.id)}
              aria-expanded={isExpanded}
              className="flex w-full items-center gap-2 px-3 py-3 text-left"
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate font-mono text-sm font-semibold text-gray-900">
                    {column.name || t('relationEditor.unnamed')}
                  </span>
                  <ConstraintBadges column={column} />
                </span>
                <span className="block truncate font-mono text-xs text-gray-600">
                  {column.type || '—'}
                  {size}
                  {column.comment && <span className="ml-2 font-sans text-gray-500">{column.comment}</span>}
                </span>
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>

            {isExpanded && (
              <div className="space-y-3 px-3 pb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={labelClass}>{t('table.colName')}</label>
                    <CommitInput
                      value={column.name}
                      onCommit={(name) => patch({ name })}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t('table.colType')}</label>
                    <TypeSelect column={column} columnTypes={columnTypes} onChange={patch} />
                  </div>
                  <div>
                    <label className={labelClass}>{t('table.colSize')}</label>
                    <SizeInputs column={column} typeInfo={typeInfo} onChange={patch} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {booleanFields.map((field) => {
                    const disabled = field.isEnabled ? !field.isEnabled(typeInfo) : false;
                    return (
                      <label
                        key={field.key}
                        className={`flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm ${
                          disabled ? 'opacity-40' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          className={checkboxClass}
                          checked={column[field.key]}
                          disabled={disabled}
                          onChange={(e) => patch({ [field.key]: e.target.checked })}
                        />
                        {t(field.labelKey)}
                      </label>
                    );
                  })}
                </div>

                <div>
                  <label className={labelClass}>{t('table.colDefault')}</label>
                  <DefaultInput column={column} onChange={patch} />
                </div>
                <div>
                  <label className={labelClass}>{t('table.colComment')}</label>
                  <input
                    type="text"
                    value={column.comment}
                    onChange={(e) => patch({ comment: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <RelationCell column={column} foreignKeys={table.foreignKeys} onEdit={onEditRelation} />
                  </div>
                  <button
                    onClick={() => removeColumn(table.id, column.id)}
                    className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('table.deleteColumnTitle')}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button
        onClick={() => {
          addColumn(table.id);
          const columns = useProjectStore.getState().spec.tables.find((tb) => tb.id === table.id)?.columns;
          setExpandedId(columns?.[columns.length - 1]?.id ?? null);
        }}
        className="flex w-full items-center justify-center gap-2 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50"
      >
        <Plus className="h-4 w-4" />
        {t('table.addColumnTitle')}
      </button>
    </div>
  );
}
