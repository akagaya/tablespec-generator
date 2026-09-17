import type { Exporter, ExportResult } from '../types/exporter';
import type { TableSpec, Column, DatabaseEngine } from '../types/tablespec';

function getProvider(engine: DatabaseEngine): string {
  if (engine === 'mariadb' || engine === 'mysql') return 'mysql';
  if (engine === 'postgresql') return 'postgresql';
  if (engine === 'sqlite') return 'sqlite';
  return 'postgresql';
}

function mapType(col: Column): string {
  const t = col.type.toUpperCase();
  if (['INT', 'INTEGER', 'SMALLINT', 'TINYINT'].includes(t)) return 'Int';
  if (['BIGINT'].includes(t)) return 'BigInt';
  if (['VARCHAR', 'TEXT', 'CHAR', 'UUID'].includes(t)) return 'String';
  if (['BOOLEAN', 'BOOL'].includes(t)) return 'Boolean';
  if (['DATE', 'DATETIME', 'TIMESTAMP', 'TIMESTAMPTZ'].includes(t)) return 'DateTime';
  if (['FLOAT', 'DOUBLE', 'REAL', 'DOUBLE PRECISION'].includes(t)) return 'Float';
  if (['DECIMAL', 'NUMERIC'].includes(t)) return 'Decimal';
  if (['JSON', 'JSONB'].includes(t)) return 'Json';
  if (['BLOB', 'BYTEA', 'BINARY', 'VARBINARY'].includes(t)) return 'Bytes';
  return 'String';
}

export const prismaExporter: Exporter = {
  id: 'prisma',
  name: 'Prisma Schema',
  description: 'Generate Prisma schema',
  fileExtension: '.prisma',
  generate(spec: TableSpec): ExportResult {
    const lines: string[] = [];
    lines.push(`generator client {`);
    lines.push(`  provider = "prisma-client-js"`);
    lines.push(`}`);
    lines.push(``);
    lines.push(`datasource db {`);
    lines.push(`  provider = "${getProvider(spec.database.engine)}"`);
    lines.push(`  url      = env("DATABASE_URL")`);
    lines.push(`}`);
    lines.push(``);

    spec.tables.forEach((table) => {
      lines.push(`model ${table.name} {`);
      
      table.columns.forEach(col => {
        let fieldDef = `  ${col.name} ${mapType(col)}${col.nullable ? '?' : ''}`;
        
        if (col.primaryKey) fieldDef += ' @id';
        if (col.unique && !col.primaryKey) fieldDef += ' @unique';
        
        if (col.autoIncrement) {
           fieldDef += ' @default(autoincrement())';
        }
        
        if (col.type.toUpperCase() === 'UUID' && spec.database.engine === 'postgresql') {
           fieldDef += ' @db.Uuid';
        }

        lines.push(fieldDef);
      });

      // Simple implementation: map basic fields
      // NOTE: Prisma relationships require model-level mapping, left out here for brevity 
      // but index handling is included.
      table.indexes.forEach(idx => {
         const cols = idx.columns.join(', ');
         if (idx.unique) {
             lines.push(`  @@unique([${cols}])`);
         } else {
             lines.push(`  @@index([${cols}])`);
         }
      });
      
      lines.push(`}`);
      lines.push(``);
    });

    return {
      filename: 'schema.prisma',
      content: lines.join('\n').trim() + '\n',
      language: 'prisma',
    };
  }
};
