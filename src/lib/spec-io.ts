import type {
  Column,
  DatabaseEngine,
  ForeignKey,
  Index,
  IndexType,
  ReferentialAction,
  Table,
  TableSpec,
} from '../types/tablespec';
import {
  DATABASE_ENGINES,
  INDEX_TYPES,
  REFERENTIAL_ACTIONS,
  createColumn,
  createDefaultSpec,
  createForeignKey,
  createIndex,
  createTable,
} from '../types/tablespec';

import { migrateReferenceTables } from './references';

export class SpecParseError extends Error {}

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const bool = (v: unknown): boolean => v === true;
const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const strArray = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const id = (v: unknown): string => (typeof v === 'string' && v ? v : crypto.randomUUID());
const oneOf = <T extends string>(v: unknown, options: readonly T[]): T | undefined =>
  options.includes(v as T) ? (v as T) : undefined;

function parseColumn(raw: unknown): Column {
  if (!isObj(raw)) throw new SpecParseError('column must be an object');
  const def = raw.default;
  const column = createColumn({
    id: id(raw.id),
    name: str(raw.name),
    type: str(raw.type),
    nullable: bool(raw.nullable),
    primaryKey: bool(raw.primaryKey),
    unique: bool(raw.unique),
    autoIncrement: bool(raw.autoIncrement),
    unsigned: bool(raw.unsigned),
    comment: str(raw.comment),
  });
  const length = num(raw.length);
  const precision = num(raw.precision);
  const scale = num(raw.scale);
  if (length !== undefined) column.length = length;
  if (precision !== undefined) column.precision = precision;
  if (scale !== undefined) column.scale = scale;
  if (def === null || ['string', 'number', 'boolean'].includes(typeof def)) {
    column.default = def as Column['default'];
  } else if (isObj(def) && typeof def.expression === 'string') {
    column.default = { expression: def.expression };
  }
  if (Array.isArray(raw.enumValues)) column.enumValues = strArray(raw.enumValues);
  return column;
}

function parseIndex(raw: unknown): Index {
  if (!isObj(raw)) throw new SpecParseError('index must be an object');
  const index = createIndex({
    id: id(raw.id),
    name: str(raw.name),
    columns: strArray(raw.columns),
    unique: bool(raw.unique),
  });
  const type = oneOf<IndexType>(raw.type, INDEX_TYPES);
  if (type) index.type = type;
  return index;
}

function parseForeignKey(raw: unknown): ForeignKey {
  if (!isObj(raw)) throw new SpecParseError('foreign key must be an object');
  const fk = createForeignKey({
    id: id(raw.id),
    name: str(raw.name),
    columns: strArray(raw.columns),
    referenceTable: str(raw.referenceTable),
    referenceColumns: strArray(raw.referenceColumns),
  });
  const onDelete = oneOf<ReferentialAction>(raw.onDelete, REFERENTIAL_ACTIONS);
  const onUpdate = oneOf<ReferentialAction>(raw.onUpdate, REFERENTIAL_ACTIONS);
  if (onDelete) fk.onDelete = onDelete;
  if (onUpdate) fk.onUpdate = onUpdate;
  return fk;
}

function parseTable(raw: unknown): Table {
  if (!isObj(raw)) throw new SpecParseError('table must be an object');
  if (!Array.isArray(raw.columns)) throw new SpecParseError('table.columns must be an array');
  return createTable({
    id: id(raw.id),
    name: str(raw.name),
    comment: str(raw.comment),
    columns: raw.columns.map(parseColumn),
    indexes: Array.isArray(raw.indexes) ? raw.indexes.map(parseIndex) : [],
    foreignKeys: Array.isArray(raw.foreignKeys) ? raw.foreignKeys.map(parseForeignKey) : [],
  });
}

/**
 * 外部から読み込んだ値を TableSpec に正規化する。
 * 構造が致命的に不正な場合は SpecParseError を投げ、欠損した任意項目は既定値で補う。
 */
export function parseSpec(raw: unknown): TableSpec {
  if (!isObj(raw)) throw new SpecParseError('root must be an object');
  if (!isObj(raw.database)) throw new SpecParseError('database is required');
  if (!Array.isArray(raw.tables)) throw new SpecParseError('tables must be an array');

  const engine = oneOf<DatabaseEngine>(raw.database.engine, DATABASE_ENGINES);
  if (!engine) throw new SpecParseError(`unsupported engine: ${String(raw.database.engine)}`);

  const defaults = createDefaultSpec();
  const spec: TableSpec = {
    version: str(raw.version, defaults.version),
    projectName: str(raw.projectName, defaults.projectName),
    database: { engine, version: str(raw.database.version) },
    tables: raw.tables.map(parseTable),
  };
  if (typeof raw.database.charset === 'string') spec.database.charset = raw.database.charset;
  if (typeof raw.database.collation === 'string') spec.database.collation = raw.database.collation;
  // 旧形式（テーブル名参照）のファイルも読み込めるよう ID 参照へ変換する
  return migrateReferenceTables(spec);
}
