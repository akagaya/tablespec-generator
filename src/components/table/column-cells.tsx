import { Link } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ColumnTypeInfo } from '../../data/column-types';
import type { Column, ForeignKey } from '../../types/tablespec';
import { formatDefault, isDefaultExpression, parseDefault } from '../../lib/column-default';
import { describeRelation, typeChangeUpdates } from '../../lib/column-type';

export type ColumnPatch = (updates: Partial<Column>) => void;

const parseIntOrUndefined = (v: string) => (v === '' ? undefined : parseInt(v, 10));

export function TypeSelect({
  column,
  columnTypes,
  onChange,
  className,
}: {
  column: Column;
  columnTypes: ColumnTypeInfo[];
  onChange: ColumnPatch;
  className?: string;
}) {
  const { t } = useTranslation();
  const categories = Array.from(new Set(columnTypes.map((tc) => tc.category)));
  const isKnown = columnTypes.some((tc) => tc.name === column.type);

  return (
    <select
      value={column.type}
      onChange={(e) =>
        onChange(typeChangeUpdates(column, e.target.value, columnTypes.find((tc) => tc.name === e.target.value)))
      }
      className={className}
    >
      <option value="">{t('table.select')}</option>
      {/* DB切替などで型マスタに存在しない型も値として保持・表示する */}
      {!isKnown && column.type && <option value={column.type}>{column.type}</option>}
      {categories.map((cat) => (
        <optgroup key={cat} label={cat}>
          {columnTypes
            .filter((tc) => tc.category === cat)
            .map((tc) => (
              <option key={tc.name} value={tc.name}>
                {tc.name}
              </option>
            ))}
        </optgroup>
      ))}
    </select>
  );
}

export function SizeInputs({
  column,
  typeInfo,
  onChange,
}: {
  column: Column;
  typeInfo: ColumnTypeInfo | undefined;
  onChange: ColumnPatch;
}) {
  return (
    <>
      {typeInfo?.hasLength && (
        <input
          type="number"
          min={1}
          value={column.length ?? ''}
          onChange={(e) => onChange({ length: parseIntOrUndefined(e.target.value) })}
          className="w-full px-2 py-1 border rounded"
        />
      )}
      {typeInfo?.hasPrecision && (
        <div className="flex gap-1 mt-1">
          <input
            type="number"
            min={0}
            placeholder="P"
            title="Precision"
            value={column.precision ?? ''}
            onChange={(e) => onChange({ precision: parseIntOrUndefined(e.target.value) })}
            className="w-1/2 px-1 py-1 text-xs border rounded"
          />
          {typeInfo.hasScale && (
            <input
              type="number"
              min={0}
              placeholder="S"
              title="Scale"
              value={column.scale ?? ''}
              onChange={(e) => onChange({ scale: parseIntOrUndefined(e.target.value) })}
              className="w-1/2 px-1 py-1 text-xs border rounded"
            />
          )}
        </div>
      )}
    </>
  );
}

export function DefaultInput({ column, onChange }: { column: Column; onChange: ColumnPatch }) {
  return (
    <input
      type="text"
      value={formatDefault(column.default)}
      onChange={(e) => onChange({ default: parseDefault(e.target.value, isDefaultExpression(column.default)) })}
      className="w-full px-2 py-1 border rounded"
    />
  );
}

export function RelationCell({
  column,
  foreignKeys,
  onEdit,
}: {
  column: Column;
  foreignKeys: ForeignKey[];
  onEdit: () => void;
}) {
  const { t } = useTranslation();
  const relation = describeRelation(column, foreignKeys);

  return relation ? (
    <button
      onClick={onEdit}
      className="text-xs text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded hover:bg-blue-200 flex items-center justify-center gap-1 w-full truncate"
      title={t('table.editRelationTitle')}
    >
      <Link className="w-3 h-3 flex-shrink-0" />
      <span className="truncate">{relation.label}</span>
    </button>
  ) : (
    <button
      onClick={onEdit}
      className="text-gray-300 hover:text-blue-500 mx-auto block p-1 rounded hover:bg-gray-200"
      title={t('table.addRelationTitle')}
    >
      <Link className="w-3.5 h-3.5" />
    </button>
  );
}
