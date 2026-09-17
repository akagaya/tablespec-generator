import type { Exporter, ExportResult } from '../types/exporter';
import type { TableSpec } from '../types/tablespec';

export const djangoExporter: Exporter = {
  id: 'django',
  name: 'Django Models',
  description: 'Generate Django models.py',
  fileExtension: '.py',
  generate(spec: TableSpec): ExportResult {
    const lines: string[] = [];
    lines.push(`from django.db import models`);
    lines.push(``);

    spec.tables.forEach(table => {
      const modelName = table.name.charAt(0).toUpperCase() + table.name.slice(1);
      lines.push(`class ${modelName}(models.Model):`);
      
      table.columns.forEach(col => {
        let fieldType = 'CharField';
        let args: string[] = [];

        const uType = col.type.toUpperCase();
        if (['INT', 'INTEGER'].includes(uType)) fieldType = 'IntegerField';
        else if (uType === 'BIGINT') fieldType = 'BigIntegerField';
        else if (uType === 'TEXT') fieldType = 'TextField';
        else if (uType === 'BOOLEAN') fieldType = 'BooleanField';
        else if (['DATETIME', 'TIMESTAMP'].includes(uType)) fieldType = 'DateTimeField';
        else if (uType === 'DATE') fieldType = 'DateField';
        else if (uType === 'VARCHAR') {
          fieldType = 'CharField';
          args.push(`max_length=${col.length || 255}`);
        }

        if (col.primaryKey) args.push('primary_key=True');
        if (col.nullable) {
          args.push('null=True');
          if (fieldType === 'CharField' || fieldType === 'TextField') args.push('blank=True');
        }
        if (col.unique && !col.primaryKey) args.push('unique=True');
        if (col.default !== undefined && col.default !== null) {
          if (typeof col.default === 'string') args.push(`default='${col.default}'`);
          else if (typeof col.default !== 'object') args.push(`default=${col.default}`);
        }

        lines.push(`    ${col.name} = models.${fieldType}(${args.join(', ')})`);
      });

      // Simple implementation of foreign keys handling
      table.foreignKeys.forEach(fk => {
          let refModelName = fk.referenceTable.charAt(0).toUpperCase() + fk.referenceTable.slice(1);
          let args: string[] = [`'${refModelName}'`];
          let on_delete = 'models.CASCADE';
          if (fk.onDelete === 'SET NULL') on_delete = 'models.SET_NULL';
          else if (fk.onDelete === 'RESTRICT') on_delete = 'models.RESTRICT';
          args.push(`on_delete=${on_delete}`);
          // Note: In django, fk.columns[0] usually drops the "_id" suffix for the field name
          let fieldName = fk.columns[0];
          if (fieldName.endsWith('_id')) fieldName = fieldName.slice(0, -3);
          
          lines.push(`    ${fieldName} = models.ForeignKey(${args.join(', ')})`);
      });

      lines.push(``);
      lines.push(`    class Meta:`);
      lines.push(`        db_table = '${table.name}'`);
      if (table.indexes.length > 0) {
        lines.push(`        indexes = [`);
        table.indexes.forEach(idx => {
          const cols = idx.columns.map(c => `'${c}'`).join(', ');
          lines.push(`            models.Index(fields=[${cols}], name='${idx.name}'),`);
        });
        lines.push(`        ]`);
      }
      lines.push(``);
    });

    return {
      filename: 'models.py',
      content: lines.join('\n').trim() + '\n',
      language: 'python',
    };
  }
};
