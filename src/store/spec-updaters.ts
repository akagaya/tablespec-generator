import type { Table, TableSpec } from '../types/tablespec';

/** 純粋関数群。ストアから利用し、参照整合性を保ったまま TableSpec を更新する。 */

type WithId = { id: string };

export function replaceById<T extends WithId>(items: T[], id: string, updater: (item: T) => T): T[] {
  return items.map((item) => (item.id === id ? updater(item) : item));
}

export function mapTable(spec: TableSpec, tableId: string, updater: (table: Table) => Table): TableSpec {
  return { ...spec, tables: replaceById(spec.tables, tableId, updater) };
}

const renameIn = (names: string[], from: string, to: string) => names.map((n) => (n === from ? to : n));
const removeFrom = (names: string[], target: string) => names.filter((n) => n !== target);

/**
 * テーブル内のカラム名変更／削除を、同テーブルのインデックス・外部キーと
 * 他テーブルからの外部キー参照へ伝播させる（カラムは名前で参照される）。
 * テーブルは ID で参照されるため、テーブル名の変更は伝播不要。
 * 同名カラムが他にも残っている場合は参照を保持する。
 */
export function propagateColumnChange(
  spec: TableSpec,
  tableId: string,
  oldName: string,
  newName: string | null,
): TableSpec {
  const table = spec.tables.find((t) => t.id === tableId);
  if (!table || !oldName || oldName === newName) return spec;
  if (table.columns.some((c) => c.name === oldName)) return spec;

  const apply = (names: string[]) => (newName === null ? removeFrom(names, oldName) : renameIn(names, oldName, newName));

  return {
    ...spec,
    tables: spec.tables.map((t) => {
      const isSelf = t.id === tableId;
      const foreignKeys = t.foreignKeys.map((fk) => {
        const sideOf = (side: 'columns' | 'referenceColumns') =>
          (side === 'columns' ? isSelf : fk.referenceTable === table.id);
        if (!sideOf('columns') && !sideOf('referenceColumns')) return fk;
        if (newName !== null) {
          return {
            ...fk,
            columns: sideOf('columns') ? apply(fk.columns) : fk.columns,
            referenceColumns: sideOf('referenceColumns') ? apply(fk.referenceColumns) : fk.referenceColumns,
          };
        }
        // columns[i] と referenceColumns[i] は対応するペアなので、ペアごと削除する
        const keep = fk.columns.map(
          (_, i) =>
            !(sideOf('columns') && fk.columns[i] === oldName) &&
            !(sideOf('referenceColumns') && fk.referenceColumns[i] === oldName),
        );
        return {
          ...fk,
          columns: fk.columns.filter((_, i) => keep[i]),
          referenceColumns: fk.referenceColumns.filter((_, i) => keep[i] ?? true),
        };
      });
      const indexes = isSelf ? t.indexes.map((idx) => ({ ...idx, columns: apply(idx.columns) })) : t.indexes;
      return { ...t, foreignKeys, indexes };
    }),
  };
}

/**
 * テーブル削除時に、他テーブルの外部キーから参照を外す。
 * 外部キー自体は残し、ユーザーが参照先を再設定できる状態にする。
 */
export function clearTableReferences(spec: TableSpec, tableId: string): TableSpec {
  return {
    ...spec,
    tables: spec.tables.map((t) => ({
      ...t,
      foreignKeys: t.foreignKeys.map((fk) =>
        fk.referenceTable === tableId ? { ...fk, referenceTable: '', referenceColumns: [] } : fk,
      ),
    })),
  };
}
