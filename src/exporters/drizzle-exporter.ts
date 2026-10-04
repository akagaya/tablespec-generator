import type { Exporter, ExportResult } from '../types/exporter';
import type { Column, DatabaseEngine, ReferentialAction, Table, TableSpec } from '../types/tablespec';
import { isDefaultExpression } from '../lib/column-default';
import { foreignKeyNameOf, indexNameOf } from '../lib/naming';
import { isMysqlFamily, joinLines, resolveForeignKeys } from './utils';

/** ビルダが受け付けるデフォルト値の TS 型 */
type ValueKind = 'string' | 'number' | 'numericString' | 'boolean' | 'other';

interface BuilderCall {
  /** ビルダ関数名（import 対象） */
  fn: string;
  /** カラム名の後ろに続く引数（`{ length: 255 }` など） */
  extraArgs?: string[];
  kind: ValueKind;
  /** ENUM のように受け付ける文字列が限定される場合の選択肢 */
  allowed?: string[];
}

interface Dialect {
  pkg: string;
  tableFn: string;
  /** 型を対応するビルダへ変換する。対応がなければ null（customType で出力） */
  map(col: Column, type: string): BuilderCall | null;
  /** カラムチェーンに付ける自動採番の表現（型側で表現した場合は空） */
  autoIncrement(col: Column, call: BuilderCall): string;
}

function options(entries: Record<string, string | number | boolean | undefined>): string[] {
  const parts = Object.entries(entries)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : String(v)}`);
  return parts.length > 0 ? [`{ ${parts.join(', ')} }`] : [];
}

const tsString = (value: string) => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const sqlLiteral = (value: string) => `'${value.replace(/'/g, "''")}'`;
const sqlTemplate = (body: string) => `sql\`${body.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\``;

const mysqlDialect: Dialect = {
  pkg: 'drizzle-orm/mysql-core',
  tableFn: 'mysqlTable',
  map(col, type) {
    const unsigned = col.unsigned || undefined;
    switch (type) {
      case 'TINYINT':
      case 'SMALLINT':
      case 'MEDIUMINT':
        return { fn: type.toLowerCase(), extraArgs: options({ unsigned }), kind: 'number' };
      case 'INT':
      case 'INTEGER':
        return { fn: 'int', extraArgs: options({ unsigned }), kind: 'number' };
      case 'BIGINT':
        return { fn: 'bigint', extraArgs: options({ mode: "'number'", unsigned }), kind: 'number' };
      case 'FLOAT':
      case 'REAL':
        return { fn: 'float', extraArgs: options({ precision: col.precision, scale: col.scale, unsigned }), kind: 'number' };
      case 'DOUBLE':
      case 'DOUBLE PRECISION':
        return { fn: 'double', extraArgs: options({ precision: col.precision, scale: col.scale, unsigned }), kind: 'number' };
      case 'DECIMAL':
      case 'NUMERIC':
        return {
          fn: 'decimal',
          extraArgs: options({ precision: col.precision, scale: col.scale, unsigned }),
          kind: 'numericString',
        };
      case 'CHAR':
        return { fn: 'char', extraArgs: options({ length: col.length }), kind: 'string' };
      case 'VARCHAR':
        // mysql-core の varchar は length が必須
        return { fn: 'varchar', extraArgs: options({ length: col.length ?? 255 }), kind: 'string' };
      case 'TINYTEXT':
      case 'TEXT':
      case 'MEDIUMTEXT':
      case 'LONGTEXT':
        return { fn: type.toLowerCase(), kind: 'string' };
      case 'BINARY':
        return { fn: 'binary', extraArgs: options({ length: col.length }), kind: 'string' };
      case 'VARBINARY':
        return { fn: 'varbinary', extraArgs: options({ length: col.length ?? 255 }), kind: 'string' };
      case 'DATE':
        return { fn: 'date', kind: 'other' };
      case 'DATETIME':
        return { fn: 'datetime', kind: 'other' };
      case 'TIMESTAMP':
      case 'TIMESTAMPTZ':
        return { fn: 'timestamp', kind: 'other' };
      case 'TIME':
        return { fn: 'time', kind: 'string' };
      case 'YEAR':
        return { fn: 'year', kind: 'number' };
      case 'BOOLEAN':
      case 'BOOL':
        return { fn: 'boolean', kind: 'boolean' };
      case 'JSON':
      case 'JSONB':
        return { fn: 'json', kind: 'other' };
      case 'ENUM':
        if (!col.enumValues?.length) return null;
        return {
          fn: 'mysqlEnum',
          extraArgs: [`[${col.enumValues.map(tsString).join(', ')}]`],
          kind: 'string',
          allowed: col.enumValues,
        };
      default:
        return null;
    }
  },
  autoIncrement: () => '.autoincrement()',
};

const SERIAL_OF: Record<string, string> = { SMALLINT: 'smallserial', INT: 'serial', INTEGER: 'serial', BIGINT: 'bigserial' };

const pgDialect: Dialect = {
  pkg: 'drizzle-orm/pg-core',
  tableFn: 'pgTable',
  map(col, type) {
    // 自動採番の整数は serial 系で表現する（SQL エクスポータと同じ方針）
    if (col.autoIncrement && SERIAL_OF[type]) {
      const fn = SERIAL_OF[type];
      return { fn, extraArgs: fn === 'bigserial' ? options({ mode: "'number'" }) : [], kind: 'number' };
    }
    switch (type) {
      case 'SMALLINT':
        return { fn: 'smallint', kind: 'number' };
      case 'INT':
      case 'INTEGER':
        return { fn: 'integer', kind: 'number' };
      case 'BIGINT':
        return { fn: 'bigint', extraArgs: options({ mode: "'number'" }), kind: 'number' };
      case 'SMALLSERIAL':
      case 'SERIAL':
        return { fn: type.toLowerCase(), kind: 'number' };
      case 'BIGSERIAL':
        return { fn: 'bigserial', extraArgs: options({ mode: "'number'" }), kind: 'number' };
      case 'REAL':
      case 'FLOAT':
        return { fn: 'real', kind: 'number' };
      case 'DOUBLE':
      case 'DOUBLE PRECISION':
        return { fn: 'doublePrecision', kind: 'number' };
      case 'DECIMAL':
      case 'NUMERIC':
        return { fn: 'numeric', extraArgs: options({ precision: col.precision, scale: col.scale }), kind: 'numericString' };
      case 'CHAR':
        return { fn: 'char', extraArgs: options({ length: col.length }), kind: 'string' };
      case 'VARCHAR':
        return { fn: 'varchar', extraArgs: options({ length: col.length }), kind: 'string' };
      case 'TEXT':
        return { fn: 'text', kind: 'string' };
      case 'DATE':
        return { fn: 'date', kind: 'string' };
      case 'TIMESTAMP':
      case 'DATETIME':
        return { fn: 'timestamp', kind: 'other' };
      case 'TIMESTAMPTZ':
        return { fn: 'timestamp', extraArgs: options({ withTimezone: true }), kind: 'other' };
      case 'TIME':
        return { fn: 'time', kind: 'string' };
      case 'TIMETZ':
        return { fn: 'time', extraArgs: options({ withTimezone: true }), kind: 'string' };
      case 'INTERVAL':
        return { fn: 'interval', kind: 'string' };
      case 'BOOLEAN':
      case 'BOOL':
        return { fn: 'boolean', kind: 'boolean' };
      case 'UUID':
        return { fn: 'uuid', kind: 'string' };
      case 'JSON':
        return { fn: 'json', kind: 'other' };
      case 'JSONB':
        return { fn: 'jsonb', kind: 'other' };
      case 'INET':
      case 'CIDR':
      case 'MACADDR':
        return { fn: type.toLowerCase(), kind: 'string' };
      default:
        return null;
    }
  },
  autoIncrement: () => '',
};

const sqliteDialect: Dialect = {
  pkg: 'drizzle-orm/sqlite-core',
  tableFn: 'sqliteTable',
  map(col, type) {
    switch (type) {
      case 'INTEGER':
      case 'INT':
      case 'TINYINT':
      case 'SMALLINT':
      case 'MEDIUMINT':
      case 'BIGINT':
        return { fn: 'integer', kind: 'number' };
      case 'BOOLEAN':
      case 'BOOL':
        return { fn: 'integer', extraArgs: options({ mode: "'boolean'" }), kind: 'boolean' };
      case 'REAL':
      case 'FLOAT':
      case 'DOUBLE':
      case 'DOUBLE PRECISION':
        return { fn: 'real', kind: 'number' };
      case 'NUMERIC':
      case 'DECIMAL':
        return { fn: 'numeric', kind: 'numericString' };
      case 'TEXT':
      case 'CHAR':
      case 'VARCHAR':
      case 'TINYTEXT':
      case 'MEDIUMTEXT':
      case 'LONGTEXT':
      case 'UUID':
      case 'DATE':
      case 'DATETIME':
      case 'TIMESTAMP':
      case 'TIME':
        return { fn: 'text', extraArgs: options({ length: col.length }), kind: 'string' };
      case 'JSON':
      case 'JSONB':
        return { fn: 'text', extraArgs: options({ mode: "'json'" }), kind: 'other' };
      case 'BLOB':
        return { fn: 'blob', kind: 'other' };
      default:
        return null;
    }
  },
  // SQLite の AUTOINCREMENT は主キー指定と一体で表現する（primaryKeyChain 参照）
  autoIncrement: () => '',
};

function dialectOf(engine: DatabaseEngine): Dialect {
  if (isMysqlFamily(engine)) return mysqlDialect;
  if (engine === 'postgresql') return pgDialect;
  return sqliteDialect;
}

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/** プロパティアクセス（`t.id` / `t['my-col']`） */
const member = (obj: string, key: string) => (IDENTIFIER.test(key) ? `${obj}.${key}` : `${obj}[${tsString(key)}]`);
const propertyKey = (key: string) => (IDENTIFIER.test(key) ? key : tsString(key));

function toIdentifier(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9_$]/g, '_');
  return /^[0-9]/.test(cleaned) || cleaned === '' ? `_${cleaned}` : cleaned;
}

/** ON DELETE / ON UPDATE は drizzle では小文字 */
const action = (value: ReferentialAction) => tsString(value.toLowerCase());

function sqlTypeOf(col: Column, type: string): string {
  if (col.enumValues?.length) return `${type}(${col.enumValues.map(sqlLiteral).join(', ')})`;
  if (col.length) return `${type}(${col.length})`;
  if (col.precision) return `${type}(${col.precision}${col.scale !== undefined ? `, ${col.scale}` : ''})`;
  return type;
}

function defaultChain(col: Column, { kind, allowed }: BuilderCall, useSql: () => void): string {
  const def = col.default;
  if (def === undefined || def === null) return '';
  const viaSql = (body: string) => {
    useSql();
    return `.default(${sqlTemplate(body)})`;
  };
  if (isDefaultExpression(def)) return viaSql(def.expression);
  if (typeof def === 'string') {
    const accepted = kind === 'string' && (!allowed || allowed.includes(def));
    return accepted ? `.default(${tsString(def)})` : viaSql(sqlLiteral(def));
  }
  if (typeof def === 'number') {
    if (kind === 'number') return `.default(${def})`;
    if (kind === 'numericString') return `.default(${tsString(String(def))})`;
    return viaSql(String(def));
  }
  return kind === 'boolean' ? `.default(${def})` : viaSql(def ? 'TRUE' : 'FALSE');
}

/** import する可能性のある名前と、制約コールバックの引数名 `t` */
const RESERVED = new Set([
  'sql', 't', 'customType', 'primaryKey', 'index', 'uniqueIndex', 'foreignKey',
  'mysqlTable', 'pgTable', 'sqliteTable', 'mysqlEnum',
  'tinyint', 'smallint', 'mediumint', 'int', 'integer', 'bigint', 'float', 'real', 'double', 'doublePrecision',
  'decimal', 'numeric', 'char', 'varchar', 'tinytext', 'text', 'mediumtext', 'longtext', 'binary', 'varbinary',
  'date', 'datetime', 'timestamp', 'time', 'year', 'interval', 'boolean', 'json', 'jsonb', 'uuid', 'inet', 'cidr',
  'macaddr', 'serial', 'smallserial', 'bigserial', 'blob',
]);

/** テーブル ID → 一意な変数名（予約名・重複は末尾を調整） */
function assignTableVars(tables: Table[]): Map<string, string> {
  const used = new Set<string>();
  const vars = new Map<string, string>();
  for (const table of tables) {
    const base = toIdentifier(table.name);
    let name = RESERVED.has(base) || base.startsWith('custom_') ? `${base}Table` : base;
    for (let i = 2; used.has(name); i++) name = `${base}_${i}`;
    used.add(name);
    vars.set(table.id, name);
  }
  return vars;
}

export const drizzleExporter: Exporter = {
  id: 'drizzle',
  name: 'Drizzle ORM',
  description: 'Generate Drizzle ORM schema',
  fileExtension: '.ts',
  generate(spec: TableSpec): ExportResult {
    const dialect = dialectOf(spec.database.engine);
    const imports = new Set<string>([dialect.tableFn]);
    const customTypes = new Map<string, string>();
    let usesSql = false;
    const useSql = () => {
      usesSql = true;
    };

    const tableVars = assignTableVars(spec.tables);

    const body: string[] = [];

    for (const table of spec.tables) {
      const pkColumns = table.columns.filter((c) => c.primaryKey);
      const singlePk = pkColumns.length === 1 ? pkColumns[0] : undefined;
      const columnLines: string[] = [];

      for (const col of table.columns) {
        const type = col.type.toUpperCase().trim();
        let call = dialect.map(col, type);
        if (!call) {
          // 対応するビルダがない型は customType で SQL 型をそのまま出力する
          const sqlType = sqlTypeOf(col, type || 'TEXT');
          let fn = customTypes.get(sqlType);
          if (!fn) {
            const base = `custom_${toIdentifier(sqlType.toLowerCase()).replace(/_+/g, '_').replace(/_$/, '')}`;
            const taken = new Set(customTypes.values());
            fn = base;
            for (let i = 2; taken.has(fn); i++) fn = `${base}_${i}`;
            customTypes.set(sqlType, fn);
          }
          call = { fn, kind: 'other' };
        } else {
          imports.add(call.fn);
        }

        const args = [tsString(col.name), ...(call.extraArgs ?? [])].join(', ');
        let chain = `${call.fn}(${args})`;
        if (col === singlePk) {
          chain +=
            dialect === sqliteDialect && col.autoIncrement ? '.primaryKey({ autoIncrement: true })' : '.primaryKey()';
        }
        if (col.autoIncrement && dialect !== sqliteDialect) chain += dialect.autoIncrement(col, call);
        // 単一主キーは .primaryKey() が NOT NULL を含む。複合主キーの列は明示する
        if ((!col.nullable || col.primaryKey) && col !== singlePk) chain += '.notNull()';
        if (col.unique && !col.primaryKey) chain += '.unique()';
        chain += defaultChain(col, call, useSql);

        columnLines.push(`  ${propertyKey(col.name)}: ${chain},`);
      }

      // テーブル単位の制約（複合主キー・インデックス・外部キー）
      const constraints: string[] = [];
      if (pkColumns.length > 1) {
        imports.add('primaryKey');
        constraints.push(`primaryKey({ columns: [${pkColumns.map((c) => member('t', c.name)).join(', ')}] })`);
      }
      for (const idx of table.indexes) {
        const cols = idx.columns.filter(Boolean);
        if (cols.length === 0) continue;
        const fn = idx.unique ? 'uniqueIndex' : 'index';
        imports.add(fn);
        constraints.push(`${fn}(${tsString(indexNameOf(table, idx))}).on(${cols.map((c) => member('t', c)).join(', ')})`);
      }
      for (const { fk } of resolveForeignKeys(spec, table)) {
        const pairs = fk.columns.map((c, i) => [c, fk.referenceColumns[i]] as const).filter(([c, r]) => c && r);
        if (pairs.length === 0) continue;
        imports.add('foreignKey');
        const refVar = fk.referenceTable === table.id ? 't' : tableVars.get(fk.referenceTable)!;
        let line =
          `foreignKey({ name: ${tsString(foreignKeyNameOf(spec, table, fk))}, ` +
          `columns: [${pairs.map(([c]) => member('t', c)).join(', ')}], ` +
          `foreignColumns: [${pairs.map(([, r]) => member(refVar, r)).join(', ')}] })`;
        if (fk.onDelete) line += `.onDelete(${action(fk.onDelete)})`;
        if (fk.onUpdate) line += `.onUpdate(${action(fk.onUpdate)})`;
        constraints.push(line);
      }

      const varName = tableVars.get(table.id)!;
      body.push(`export const ${varName} = ${dialect.tableFn}(${tsString(table.name)}, {`);
      body.push(...columnLines);
      if (constraints.length > 0) {
        body.push(`}, (t) => [`);
        body.push(...constraints.map((c) => `  ${c},`));
        body.push(`]);`);
      } else {
        body.push(`});`);
      }
      body.push('');
    }

    if (customTypes.size > 0) imports.add('customType');

    const header: string[] = [];
    if (usesSql) header.push(`import { sql } from 'drizzle-orm';`);
    header.push(`import { ${[...imports].sort().join(', ')} } from '${dialect.pkg}';`);
    header.push('');
    for (const [sqlType, fn] of customTypes) {
      header.push(`const ${fn} = customType<{ data: unknown }>({ dataType: () => ${tsString(sqlType)} });`);
    }
    if (customTypes.size > 0) header.push('');

    return {
      filename: 'schema.ts',
      content: joinLines([...header, ...body]),
      language: 'typescript',
    };
  },
};
