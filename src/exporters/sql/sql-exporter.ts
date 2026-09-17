import type { Exporter, ExportResult } from '../../types/exporter';
import type { TableSpec, Column, DatabaseEngine } from '../../types/tablespec';

function quote(identifier: string, engine: DatabaseEngine): string {
  if (engine === 'mariadb' || engine === 'mysql') return `\`${identifier}\``;
  return `"${identifier}"`;
}

function getDefaultValue(def: Column['default']): string {
  if (def === null || def === undefined) return 'NULL';
  if (typeof def === 'object' && 'expression' in def) return def.expression;
  if (typeof def === 'string') return `'${def.replace(/'/g, "''")}'`;
  if (typeof def === 'boolean') return def ? 'TRUE' : 'FALSE';
  return String(def);
}

function getColumnDefinition(col: Column, engine: DatabaseEngine): string {
  let type = col.type.toUpperCase();
  
  if (engine === 'postgresql' && col.autoIncrement) {
    if (type === 'INT' || type === 'INTEGER') type = 'SERIAL';
    if (type === 'BIGINT') type = 'BIGSERIAL';
    if (type === 'SMALLINT') type = 'SMALLSERIAL';
  }

  let def = `${quote(col.name, engine)} ${type}`;
  
  if (col.length) def += `(${col.length})`;
  else if (col.precision && col.scale) def += `(${col.precision}, ${col.scale})`;
  
  if (col.unsigned && (engine === 'mariadb' || engine === 'mysql')) def += ' UNSIGNED';
  if (!col.nullable) def += ' NOT NULL';
  
  if (col.autoIncrement && engine !== 'postgresql') {
    if (engine === 'mariadb' || engine === 'mysql') def += ' AUTO_INCREMENT';
    if (engine === 'sqlite' && col.primaryKey) def += ' AUTOINCREMENT';
  }

  if (col.unique && !col.primaryKey) def += ' UNIQUE';
  
  if (col.default !== undefined && col.default !== null) {
    def += ` DEFAULT ${getDefaultValue(col.default)}`;
  }
  
  if (col.comment && (engine === 'mariadb' || engine === 'mysql')) {
    def += ` COMMENT '${col.comment.replace(/'/g, "''")}'`;
  }
  
  return def;
}

export const sqlExporter: Exporter = {
  id: 'sql',
  name: 'SQL',
  description: 'Generate SQL CREATE TABLE statements',
  fileExtension: '.sql',
  generate(spec: TableSpec): ExportResult {
    const { engine } = spec.database;
    const lines: string[] = [];

    spec.tables.forEach((table) => {
      lines.push(`CREATE TABLE ${quote(table.name, engine)} (`);
      const tableElements: string[] = [];
      
      table.columns.forEach((col) => {
        tableElements.push(`  ${getColumnDefinition(col, engine)}`);
      });

      const pkCols = table.columns.filter((c) => c.primaryKey).map((c) => quote(c.name, engine));
      if (pkCols.length > 0 && !(engine === 'sqlite' && pkCols.length === 1 && table.columns.find(c => c.primaryKey)?.autoIncrement)) {
        tableElements.push(`  PRIMARY KEY (${pkCols.join(', ')})`);
      }

      lines.push(tableElements.join(',\n'));
      
      let tableSuffix = ')';
      if (engine === 'mariadb' || engine === 'mysql') {
        tableSuffix += ' ENGINE=InnoDB';
        if (spec.database.charset) tableSuffix += ` DEFAULT CHARSET=${spec.database.charset}`;
        if (table.comment) tableSuffix += ` COMMENT='${table.comment.replace(/'/g, "''")}'`;
      }
      tableSuffix += ';';
      lines.push(tableSuffix);
      lines.push('');

      table.indexes.forEach((idx) => {
        const unique = idx.unique ? 'UNIQUE ' : '';
        const cols = idx.columns.map((c) => quote(c, engine)).join(', ');
        lines.push(`CREATE ${unique}INDEX ${quote(idx.name, engine)} ON ${quote(table.name, engine)} (${cols});`);
      });
      if (table.indexes.length > 0) lines.push('');
    });
    
    if (engine !== 'sqlite') {
      spec.tables.forEach((table) => {
        table.foreignKeys.forEach((fk) => {
          const cols = fk.columns.map((c) => quote(c, engine)).join(', ');
          const refCols = fk.referenceColumns.map((c) => quote(c, engine)).join(', ');
          let constraint = `ALTER TABLE ${quote(table.name, engine)} ADD CONSTRAINT ${quote(fk.name, engine)} FOREIGN KEY (${cols}) REFERENCES ${quote(fk.referenceTable, engine)} (${refCols})`;
          if (fk.onDelete) constraint += ` ON DELETE ${fk.onDelete}`;
          if (fk.onUpdate) constraint += ` ON UPDATE ${fk.onUpdate}`;
          constraint += ';';
          lines.push(constraint);
        });
      });
    }

    return {
      filename: 'schema.sql',
      content: lines.join('\n').trim() + '\n',
      language: 'sql',
    };
  },
};
