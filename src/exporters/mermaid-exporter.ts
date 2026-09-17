import type { Exporter, ExportResult } from '../types/exporter';
import type { TableSpec } from '../types/tablespec';

export const mermaidExporter: Exporter = {
  id: 'mermaid',
  name: 'Mermaid ER Diagram',
  description: 'Generate Mermaid ER diagram',
  fileExtension: '.mmd',
  generate(spec: TableSpec): ExportResult {
    const lines: string[] = [];
    lines.push(`erDiagram`);

    spec.tables.forEach(table => {
      lines.push(`  ${table.name} {`);
      table.columns.forEach(col => {
        let pkFk = '';
        if (col.primaryKey) pkFk = ' PK';
        else if (table.foreignKeys.some(fk => fk.columns.includes(col.name))) pkFk = ' FK';
        
        let typeStr = col.type.replace(/\s+/g, '_');
        lines.push(`    ${typeStr} ${col.name}${pkFk}`);
      });
      lines.push(`  }`);
    });

    lines.push('');

    spec.tables.forEach(table => {
      table.foreignKeys.forEach(fk => {
        const isUniqueFk = table.columns.some(c => fk.columns.includes(c.name) && c.unique);
        const rel = isUniqueFk ? '||--||' : '}o--||';
        lines.push(`  ${table.name} ${rel} ${fk.referenceTable} : ""`);
      });
    });

    return {
      filename: 'diagram.mmd',
      content: lines.join('\n').trim() + '\n',
      language: 'mermaid',
    };
  }
};
