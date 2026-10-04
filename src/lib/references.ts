import type { ForeignKey, Table, TableSpec } from '../types/tablespec';

/** 外部キーの参照先テーブル（`referenceTable` はテーブル ID） */
export function findReferencedTable(tables: Table[], fk: Pick<ForeignKey, 'referenceTable'>): Table | undefined {
  return fk.referenceTable ? tables.find((t) => t.id === fk.referenceTable) : undefined;
}

/** エクスポート用の参照先テーブル名。解決できない場合は空文字 */
export function referenceTableName(spec: Pick<TableSpec, 'tables'>, fk: Pick<ForeignKey, 'referenceTable'>): string {
  return findReferencedTable(spec.tables, fk)?.name ?? '';
}

/**
 * 旧形式（`referenceTable` にテーブル名を格納）を ID 参照へ変換する。
 * 既に ID で参照している外部キーはそのまま残す。
 */
export function migrateReferenceTables<T extends Pick<TableSpec, 'tables'>>(spec: T): T {
  const ids = new Set(spec.tables.map((t) => t.id));
  const idByName = new Map<string, string>();
  for (const t of spec.tables) if (!idByName.has(t.name)) idByName.set(t.name, t.id);

  let changed = false;
  const tables = spec.tables.map((t) => ({
    ...t,
    foreignKeys: t.foreignKeys.map((fk) => {
      if (!fk.referenceTable || ids.has(fk.referenceTable)) return fk;
      const id = idByName.get(fk.referenceTable);
      if (!id) return fk;
      changed = true;
      return { ...fk, referenceTable: id };
    }),
  }));
  return changed ? { ...spec, tables } : spec;
}
