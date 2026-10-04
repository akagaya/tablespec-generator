import type { ForeignKey, Index, Table, TableSpec } from '../types/tablespec';
import { referenceTableName } from './references';

/** 名前未指定のインデックス・外部キーに使う既定名（仕様: 省略時は自動生成） */

export function defaultIndexName(table: Pick<Table, 'name'>, index: Pick<Index, 'columns' | 'unique'>): string {
  return [index.unique ? 'uq' : 'idx', table.name, ...index.columns.filter(Boolean)].join('_');
}

export function defaultForeignKeyName(
  table: Pick<Table, 'name'>,
  fk: Pick<ForeignKey, 'columns'>,
  referenceTableName = '',
): string {
  const cols = fk.columns.filter(Boolean);
  return ['fk', table.name, ...(cols.length > 0 ? cols : [referenceTableName].filter(Boolean))].join('_');
}

export const indexNameOf = (table: Table, index: Index) => index.name || defaultIndexName(table, index);
export const foreignKeyNameOf = (spec: Pick<TableSpec, 'tables'>, table: Table, fk: ForeignKey) =>
  fk.name || defaultForeignKeyName(table, fk, referenceTableName(spec, fk));
