import type { Exporter, ExportResult } from '../types/exporter';
import type { TableSpec } from '../types/tablespec';

export const drizzleExporter: Exporter = {
  id: 'drizzle',
  name: 'Drizzle ORM',
  description: 'Generate Drizzle ORM schema',
  fileExtension: '.ts',
  generate(spec: TableSpec): ExportResult {
    const lines: string[] = [];
    const engine = spec.database.engine;
    let pkg = '';
    
    if (engine === 'mariadb' || engine === 'mysql') pkg = 'drizzle-orm/mysql-core';
    else if (engine === 'postgresql') pkg = 'drizzle-orm/pg-core';
    else if (engine === 'sqlite') pkg = 'drizzle-orm/sqlite-core';

    lines.push(`import { sql } from 'drizzle-orm';`);
    if (engine === 'postgresql') {
      lines.push(`import { pgTable as table, integer, varchar, text, boolean, timestamp, serial, uuid } from '${pkg}';`);
    } else if (engine === 'mariadb' || engine === 'mysql') {
      lines.push(`import { mysqlTable as table, int, varchar, text, boolean, timestamp, serial } from '${pkg}';`);
    } else {
      lines.push(`import { sqliteTable as table, integer, text, blob } from '${pkg}';`);
    }
    lines.push('');

    spec.tables.forEach(t => {
      lines.push(`export const ${t.name} = table('${t.name}', {`);
      
      t.columns.forEach(c => {
        let tType = 'text';
        const uType = c.type.toUpperCase();
        if (['INT', 'INTEGER', 'BIGINT'].includes(uType)) tType = 'integer';
        else if (uType === 'BOOLEAN') tType = 'boolean';
        else if (['DATE', 'TIMESTAMP'].includes(uType)) tType = 'timestamp';
        else if (uType === 'VARCHAR') tType = 'varchar';
        else if (uType === 'UUID') tType = 'uuid';

        let field = `  ${c.name}: ${tType}('${c.name}')`;
        
        if (c.primaryKey) field += '.primaryKey()';
        if (!c.nullable && !c.primaryKey) field += '.notNull()';
        if (c.unique && !c.primaryKey) field += '.unique()';
        if (c.default !== undefined && c.default !== null) {
          if (typeof c.default === 'object' && 'expression' in c.default) {
            field += `.default(sql\`${c.default.expression}\`)`;
          } else if (typeof c.default === 'string') {
            field += `.default('${c.default}')`;
          } else {
            field += `.default(${c.default})`;
          }
        }
        lines.push(field + ',');
      });
      lines.push(`});`);
      lines.push('');
    });

    return {
      filename: 'schema.ts',
      content: lines.join('\n').trim() + '\n',
      language: 'typescript',
    };
  }
};
