import type { ColumnTypeInfo } from '../../data/column-types';
import type { Column } from '../../types/tablespec';

export type BooleanKey = 'primaryKey' | 'nullable' | 'unique' | 'autoIncrement' | 'unsigned';

export interface BooleanField {
  key: BooleanKey;
  labelKey: string;
  /** 型がこの属性を持たない場合は無効化する */
  isEnabled?: (typeInfo: ColumnTypeInfo | undefined) => boolean;
}

/**
 * 表示する真偽値属性。UNSIGNED は型マスタに対応型があるエンジン（MariaDB / MySQL）のみ。
 * デスクトップのグリッドとモバイルのリストで共有する。
 */
export function getBooleanFields(columnTypes: ColumnTypeInfo[]): BooleanField[] {
  const fields: BooleanField[] = [
    { key: 'primaryKey', labelKey: 'table.colPk' },
    { key: 'nullable', labelKey: 'table.colNullable' },
    { key: 'unique', labelKey: 'table.colUnique' },
    { key: 'autoIncrement', labelKey: 'table.colAutoIncrement' },
  ];
  if (columnTypes.some((tc) => tc.hasUnsigned)) {
    fields.push({ key: 'unsigned', labelKey: 'table.colUnsigned', isEnabled: (info) => !!info?.hasUnsigned });
  }
  return fields;
}

export function findTypeInfo(columnTypes: ColumnTypeInfo[], column: Column): ColumnTypeInfo | undefined {
  return columnTypes.find((tc) => tc.name === column.type);
}
