import type { Exporter, ExportResult } from '../types/exporter';
import type { TableSpec } from '../types/tablespec';

export const laravelExporter: Exporter = {
  id: 'laravel',
  name: 'Laravel Migration',
  description: 'Generate Laravel PHP migrations',
  fileExtension: '.php',
  generate(spec: TableSpec): ExportResult {
    const lines: string[] = [];
    lines.push(`<?php`);
    lines.push(``);
    lines.push(`use Illuminate\\Database\\Migrations\\Migration;`);
    lines.push(`use Illuminate\\Database\\Schema\\Blueprint;`);
    lines.push(`use Illuminate\\Support\\Facades\\Schema;`);
    lines.push(``);
    lines.push(`return new class extends Migration`);
    lines.push(`{`);
    lines.push(`    public function up(): void`);
    lines.push(`    {`);

    spec.tables.forEach(table => {
      lines.push(`        Schema::create('${table.name}', function (Blueprint $table) {`);
      
      table.columns.forEach(col => {
        let typeMethod = 'string';
        const type = col.type.toUpperCase();
        if (type === 'INT' || type === 'INTEGER') typeMethod = 'integer';
        else if (type === 'BIGINT') typeMethod = 'bigInteger';
        else if (type === 'TEXT') typeMethod = 'text';
        else if (type === 'BOOLEAN') typeMethod = 'boolean';
        else if (type === 'DATE') typeMethod = 'date';
        else if (type === 'DATETIME' || type === 'TIMESTAMP') typeMethod = 'dateTime';
        
        if (col.autoIncrement && col.primaryKey && (type === 'INT' || type === 'INTEGER')) typeMethod = 'increments';
        if (col.autoIncrement && col.primaryKey && type === 'BIGINT') typeMethod = 'id';

        let call = `$table->${typeMethod}('${col.name}')`;
        
        if (col.unsigned && !col.autoIncrement) call += '->unsigned()';
        if (col.nullable) call += '->nullable()';
        if (col.unique && !col.primaryKey) call += '->unique()';
        if (col.primaryKey && !col.autoIncrement) call += '->primary()';
        if (col.comment) call += `->comment('${col.comment}')`;
        if (col.default !== undefined && col.default !== null) {
          if (typeof col.default === 'string') call += `->default('${col.default}')`;
          else if (typeof col.default !== 'object') call += `->default(${col.default})`;
        }

        lines.push(`            ${call};`);
      });

      table.foreignKeys.forEach(fk => {
        let fkLine = `$table->foreign(['${fk.columns.join("','")}'])->references(['${fk.referenceColumns.join("','")}'])->on('${fk.referenceTable}')`;
        if (fk.onDelete) fkLine += `->onDelete('${fk.onDelete.toLowerCase()}')`;
        if (fk.onUpdate) fkLine += `->onUpdate('${fk.onUpdate.toLowerCase()}')`;
        lines.push(`            ${fkLine};`);
      });

      lines.push(`        });`);
      lines.push(``);
    });

    lines.push(`    }`);
    lines.push(``);
    lines.push(`    public function down(): void`);
    lines.push(`    {`);
    [...spec.tables].reverse().forEach(table => {
      lines.push(`        Schema::dropIfExists('${table.name}');`);
    });
    lines.push(`    }`);
    lines.push(`};`);

    return {
      filename: 'migration.php',
      content: lines.join('\n').trim() + '\n',
      language: 'php',
    };
  }
};
