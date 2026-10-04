import { useEffect, useState } from 'react';
import { Link, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ColumnTypeInfo } from '../../data/column-types';
import type { Column, ForeignKey } from '../../types/tablespec';
import { formatDefault, isDefaultExpression, parseDefault } from '../../lib/column-default';
import { describeRelation, typeChangeUpdates } from '../../lib/column-type';
import { inputClass } from '../ui/styles';

export type ColumnPatch = (updates: Partial<Column>) => void;

const parseIntOrUndefined = (v: string) => (v === '' ? undefined : parseInt(v, 10));

export function TypeSelect({
  column,
  columnTypes,
  onChange,
}: {
  column: Column;
  columnTypes: ColumnTypeInfo[];
  onChange: ColumnPatch;
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
      className={`${inputClass} font-mono ${!isKnown && column.type ? 'border-amber-400 bg-amber-50' : ''}`}
      title={!isKnown && column.type ? t('table.unsupportedType') : undefined}
    >
      <option value="">{t('table.select')}</option>
      {/* DB切替などで型マスタに存在しない型も値として保持・表示する */}
      {!isKnown && column.type && <option value={column.type}>{column.type} ⚠</option>}
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

/** 長さ / 精度・スケール / ENUM 値。型が対応しない場合は「—」 */
export function SizeInputs({
  column,
  typeInfo,
  onChange,
}: {
  column: Column;
  typeInfo: ColumnTypeInfo | undefined;
  onChange: ColumnPatch;
}) {
  const { t } = useTranslation();

  if (typeInfo?.hasEnumValues) return <EnumValuesInput column={column} onChange={onChange} />;

  if (typeInfo?.hasPrecision) {
    return (
      <div className="flex gap-1">
        <input
          type="number"
          min={0}
          placeholder={t('table.precision')}
          title={t('table.precision')}
          value={column.precision ?? ''}
          onChange={(e) => onChange({ precision: parseIntOrUndefined(e.target.value) })}
          className={inputClass}
        />
        {typeInfo.hasScale && (
          <input
            type="number"
            min={0}
            placeholder={t('table.scale')}
            title={t('table.scale')}
            value={column.scale ?? ''}
            onChange={(e) => onChange({ scale: parseIntOrUndefined(e.target.value) })}
            className={inputClass}
          />
        )}
      </div>
    );
  }

  if (typeInfo?.hasLength) {
    return (
      <input
        type="number"
        min={1}
        placeholder={t('table.colLength')}
        value={column.length ?? ''}
        onChange={(e) => onChange({ length: parseIntOrUndefined(e.target.value) })}
        className={inputClass}
      />
    );
  }

  return <span className="block py-1.5 text-center text-sm text-gray-300">—</span>;
}

/** ENUM / SET の選択肢をカンマ区切りで編集する */
function EnumValuesInput({ column, onChange }: { column: Column; onChange: ColumnPatch }) {
  const { t } = useTranslation();
  const joined = (column.enumValues ?? []).join(', ');
  const [draft, setDraft] = useState(joined);

  useEffect(() => setDraft(joined), [joined]);

  return (
    <input
      type="text"
      value={draft}
      placeholder={t('table.enumValuesPlaceholder')}
      title={t('table.enumValues')}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const values = draft
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean);
        onChange({ enumValues: values.length > 0 ? values : undefined });
      }}
      className={`${inputClass} font-mono`}
    />
  );
}

/** デフォルト値。fx ボタンで SQL 式（NOW() など）とリテラルを切り替える */
export function DefaultInput({ column, onChange }: { column: Column; onChange: ColumnPatch }) {
  const { t } = useTranslation();
  const isExpression = isDefaultExpression(column.default);
  const [asExpression, setAsExpression] = useState(isExpression);
  const text = formatDefault(column.default);

  useEffect(() => {
    if (column.default !== undefined) setAsExpression(isExpression);
  }, [column.default, isExpression]);

  const toggle = () => {
    const next = !asExpression;
    setAsExpression(next);
    if (text !== '') onChange({ default: parseDefault(text, next) });
  };

  return (
    <div className="flex">
      <input
        type="text"
        value={text}
        placeholder={asExpression ? 'NOW()' : 'NULL'}
        onChange={(e) => onChange({ default: parseDefault(e.target.value, asExpression) })}
        className={`${inputClass} rounded-r-none ${asExpression ? 'font-mono text-purple-700' : ''}`}
      />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={asExpression}
        title={t('table.defaultExpressionToggle')}
        className={`-ml-px shrink-0 rounded-r-md border px-2 text-xs font-semibold italic transition-colors ${
          asExpression
            ? 'border-purple-400 bg-purple-100 text-purple-700'
            : 'border-gray-300 bg-gray-50 text-gray-400 hover:text-gray-600'
        }`}
      >
        fx
      </button>
    </div>
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
      className="flex w-full items-center justify-center gap-1 truncate rounded-md border border-blue-200 bg-blue-50 px-2 py-1 font-mono text-xs text-blue-700 hover:bg-blue-100"
      title={t('table.editRelationTitle')}
    >
      <Link className="h-3 w-3 flex-shrink-0" />
      <span className="truncate">{relation.label || '?'}</span>
    </button>
  ) : (
    <button
      onClick={onEdit}
      className="mx-auto flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-300 hover:bg-gray-100 hover:text-blue-600"
      title={t('table.addRelationTitle')}
    >
      <Plus className="h-3 w-3" />
      <Link className="h-3 w-3" />
    </button>
  );
}

/** カラムの制約を短いバッジで表示する（モバイルの折りたたみ表示・グリッド見出し用） */
export function ConstraintBadges({ column }: { column: Column }) {
  const badges = [
    column.primaryKey && { label: 'PK', className: 'bg-amber-100 text-amber-800' },
    !column.nullable && !column.primaryKey && { label: 'NN', className: 'bg-gray-100 text-gray-600' },
    column.unique && !column.primaryKey && { label: 'UQ', className: 'bg-indigo-100 text-indigo-700' },
    column.autoIncrement && { label: 'AI', className: 'bg-green-100 text-green-700' },
  ].filter((b): b is { label: string; className: string } => !!b);

  return (
    <span className="flex gap-1">
      {badges.map((b) => (
        <span key={b.label} className={`rounded px-1 py-px text-[10px] font-bold leading-4 ${b.className}`}>
          {b.label}
        </span>
      ))}
    </span>
  );
}
