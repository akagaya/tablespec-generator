import type { Exporter, ExportResult } from '../types/exporter';
import type { TableSpec } from '../types/tablespec';

export const railsExporter: Exporter = {
  id: 'rails',
  name: 'Rails Migration',
  description: 'Generate Rails ActiveRecord migration',
  fileExtension: '.rb',
  generate(spec: TableSpec): ExportResult {
    const lines: string[] = [];
    lines.push(`class CreateTables < ActiveRecord::Migration[7.0]`);
    lines.push(`  def change`);

    spec.tables.forEach(table => {
      const pk = table.columns.find(c => c.primaryKey);
      let createTableOpts = '';
      if (pk && pk.name !== 'id') {
        createTableOpts = `, primary_key: '${pk.name}'`;
      }

      lines.push(`    create_table :${table.name}${createTableOpts} do |t|`);
      
      table.columns.forEach(col => {
        if (col.primaryKey && col.name === 'id') return;

        let type = 'string';
        const uType = col.type.toUpperCase();
        if (['INT', 'INTEGER'].includes(uType)) type = 'integer';
        else if (uType === 'BIGINT') type = 'bigint';
        else if (uType === 'TEXT') type = 'text';
        else if (uType === 'BOOLEAN') type = 'boolean';
        else if (['DATETIME', 'TIMESTAMP'].includes(uType)) type = 'datetime';
        else if (uType === 'DATE') type = 'date';

        let opts = [];
        if (!col.nullable) opts.push('null: false');
        if (col.default !== undefined && col.default !== null) {
          if (typeof col.default === 'string') opts.push(`default: '${col.default}'`);
          else if (typeof col.default !== 'object') opts.push(`default: ${col.default}`);
        }

        const optsStr = opts.length > 0 ? `, ${opts.join(', ')}` : '';
        lines.push(`      t.${type} :${col.name}${optsStr}`);
      });
      lines.push(`    end`);
      
      table.indexes.forEach(idx => {
         const unique = idx.unique ? ', unique: true' : '';
         const cols = idx.columns.map(c => `:${c}`).join(', ');
         lines.push(`    add_index :${table.name}, [${cols}]${unique}`);
      });
      lines.push(``);
    });

    spec.tables.forEach(table => {
      table.foreignKeys.forEach(fk => {
        lines.push(`    add_foreign_key :${table.name}, :${fk.referenceTable}, column: :${fk.columns[0]}, primary_key: :${fk.referenceColumns[0]}`);
      });
    });

    lines.push(`  end`);
    lines.push(`end`);

    return {
      filename: 'migration.rb',
      content: lines.join('\n').trim() + '\n',
      language: 'ruby',
    };
  }
};
