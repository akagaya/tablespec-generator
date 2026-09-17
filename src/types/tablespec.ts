// ─── Database Engine ───

export type DatabaseEngine = 'mariadb' | 'postgresql' | 'sqlite' | 'mysql';

// ─── Referential Actions ───

export type ReferentialAction =
  | 'CASCADE'
  | 'SET NULL'
  | 'SET DEFAULT'
  | 'RESTRICT'
  | 'NO ACTION';

// ─── Index Type ───

export type IndexType = 'btree' | 'hash' | 'gin' | 'gist' | 'brin';

// ─── Default Value ───

export interface DefaultExpression {
  expression: string;
}

export type ColumnDefault = string | number | boolean | null | DefaultExpression;

// ─── Column ───

export interface Column {
  id: string;
  name: string;
  type: string;
  length?: number;
  precision?: number;
  scale?: number;
  nullable: boolean;
  primaryKey: boolean;
  unique: boolean;
  autoIncrement: boolean;
  unsigned: boolean;
  default?: ColumnDefault;
  comment: string;
  enumValues?: string[];
}

// ─── Index ───

export interface Index {
  id: string;
  name: string;
  columns: string[];
  unique: boolean;
  type?: IndexType;
}

// ─── Foreign Key ───

export interface ForeignKey {
  id: string;
  name: string;
  columns: string[];
  referenceTable: string;
  referenceColumns: string[];
  onDelete?: ReferentialAction;
  onUpdate?: ReferentialAction;
}

// ─── Table ───

export interface Table {
  id: string;
  name: string;
  comment: string;
  columns: Column[];
  indexes: Index[];
  foreignKeys: ForeignKey[];
}

// ─── Database Config ───

export interface DatabaseConfig {
  engine: DatabaseEngine;
  version: string;
  charset?: string;
  collation?: string;
}

// ─── TableSpec (Root) ───

export interface TableSpec {
  version: string;
  projectName?: string;
  database: DatabaseConfig;
  tables: Table[];
}

// ─── Factory Helpers ───

export function createColumn(partial?: Partial<Column>): Column {
  return {
    id: crypto.randomUUID(),
    name: '',
    type: '',
    nullable: false,
    primaryKey: false,
    unique: false,
    autoIncrement: false,
    unsigned: false,
    comment: '',
    ...partial,
  };
}

export function createTable(partial?: Partial<Table>): Table {
  return {
    id: crypto.randomUUID(),
    name: '',
    comment: '',
    columns: [],
    indexes: [],
    foreignKeys: [],
    ...partial,
  };
}

export function createIndex(partial?: Partial<Index>): Index {
  return {
    id: crypto.randomUUID(),
    name: '',
    columns: [],
    unique: false,
    ...partial,
  };
}

export function createForeignKey(partial?: Partial<ForeignKey>): ForeignKey {
  return {
    id: crypto.randomUUID(),
    name: '',
    columns: [],
    referenceTable: '',
    referenceColumns: [],
    ...partial,
  };
}

export function createDefaultSpec(): TableSpec {
  return {
    version: '1.0.0',
    projectName: 'Untitled Project',
    database: {
      engine: 'mariadb',
      version: '11.4',
    },
    tables: [],
  };
}

