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
 * 他テーブルからの外部キー参照へ伝播させる。
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
        let next = fk;
        if (isSelf) next = { ...next, columns: apply(next.columns) };
        if (fk.referenceTable === table.name) next = { ...next, referenceColumns: apply(next.referenceColumns) };
        return next;
      });
      const indexes = isSelf ? t.indexes.map((idx) => ({ ...idx, columns: apply(idx.columns) })) : t.indexes;
      return { ...t, foreignKeys, indexes };
    }),
  };
}

/**
 * テーブル名変更／削除を他テーブルの外部キー参照へ伝播させる。
 * 削除時は参照先を空にし、ユーザーが再設定できる状態にする。
 */
export function propagateTableChange(spec: TableSpec, oldName: string, newName: string | null): TableSpec {
  if (!oldName || oldName === newName) return spec;
  if (spec.tables.some((t) => t.name === oldName)) return spec;

  return {
    ...spec,
    tables: spec.tables.map((t) => ({
      ...t,
      foreignKeys: t.foreignKeys.map((fk) => {
        if (fk.referenceTable !== oldName) return fk;
        return newName === null
          ? { ...fk, referenceTable: '', referenceColumns: [] }
          : { ...fk, referenceTable: newName };
      }),
    })),
  };
}
