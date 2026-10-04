import type { ColumnTypeInfo } from '../data/column-types';
import type { Column, ForeignKey, Table } from '../types/tablespec';
import { findReferencedTable } from './references';

/**
 * データ型変更時の更新内容。
 * 新しい型が持たない属性（長さ・精度・符号なし等）は破棄し、
 * `INT(255)` のような不正な定義が出力されないようにする。
 */
export function typeChangeUpdates(column: Column, typeName: string, info: ColumnTypeInfo | undefined): Partial<Column> {
  return {
    type: typeName,
    length: info?.hasLength ? column.length : undefined,
    precision: info?.hasPrecision ? column.precision : undefined,
    scale: info?.hasScale ? column.scale : undefined,
    unsigned: info?.hasUnsigned ? column.unsigned : false,
    enumValues: info?.hasEnumValues ? column.enumValues : undefined,
  };
}

/** 外部キーで参照している先（`table.column` 形式）。未設定なら null */
export function describeRelation(
  column: Column,
  foreignKeys: ForeignKey[],
  tables: Table[],
): { fk: ForeignKey; label: string } | null {
  const fk = foreignKeys.find((f) => f.columns.includes(column.name));
  if (!fk) return null;
  const refName = findReferencedTable(tables, fk)?.name ?? '';
  const refColumn = fk.referenceColumns[fk.columns.indexOf(column.name)];
  return { fk, label: refName ? (refColumn ? `${refName}.${refColumn}` : refName) : '' };
}
