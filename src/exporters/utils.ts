import type { ForeignKey, Table, TableSpec } from '../types/tablespec';
import { referenceTableName } from '../lib/references';

export { isMysqlFamily } from '../lib/engine';

/** 行配列を末尾改行付きのファイル内容にする */
export function joinLines(lines: string[]): string {
  return lines.join('\n').trim() + '\n';
}

/** `user_profiles` → `User_profiles`（先頭のみ大文字化。既存出力との互換を維持） */
export function capitalize(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export interface ResolvedForeignKey {
  fk: ForeignKey;
  /** 参照先テーブル名（`fk.referenceTable` の ID を解決したもの） */
  referenceTableName: string;
}

/**
 * 出力対象の外部キー。参照先テーブルを解決でき、カラムが指定されているものに限る
 * （編集途中の不完全な定義から不正なコードを生成しないため）。
 */
export function resolveForeignKeys(spec: Pick<TableSpec, 'tables'>, table: Table): ResolvedForeignKey[] {
  return table.foreignKeys.flatMap((fk) => {
    const name = referenceTableName(spec, fk);
    return name && fk.columns.length > 0 ? [{ fk, referenceTableName: name }] : [];
  });
}
