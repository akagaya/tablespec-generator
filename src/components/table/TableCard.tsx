import { useState } from 'react';
import { Link, ListOrdered, Trash2, Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../store/useProjectStore';
import { getColumnTypes } from '../../data/column-types';
import { Table, Column } from '../../types/tablespec';
import { RelationEditor } from '../relation/RelationEditor';
import { IndexEditor } from '../index/IndexEditor';

export function TableCard({ table }: { table: Table }) {
  const { t } = useTranslation();
  const engine = useProjectStore(state => state.spec.database.engine);
  const version = useProjectStore(state => state.spec.database.version);
  const updateTableName = useProjectStore(state => state.updateTableName);
  const updateTableComment = useProjectStore(state => state.updateTableComment);
  const removeTable = useProjectStore(state => state.removeTable);
  const addColumn = useProjectStore(state => state.addColumn);
  const removeColumn = useProjectStore(state => state.removeColumn);
  const updateColumn = useProjectStore(state => state.updateColumn);

  const [isRelationEditorOpen, setIsRelationEditorOpen] = useState(false);
  const [isIndexEditorOpen, setIsIndexEditorOpen] = useState(false);

  const columnTypes = getColumnTypes(engine, version);
  const categories = Array.from(new Set(columnTypes.map(tc => tc.category)));

  const showUnsigned = engine === 'mariadb';

  const handleColumnUpdate = (colId: string, field: keyof Column, value: any) => {
    updateColumn(table.id, colId, { [field]: value });
  };

  return (
    <div className="bg-white border border-gray-300 shadow-sm">
      <div className="px-3 sm:px-4 py-2 border-b border-gray-300 flex flex-col sm:flex-row sm:items-center justify-between bg-gray-800 gap-2 sm:gap-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1">
          <input
            type="text"
            value={table.name}
            onChange={(e) => updateTableName(table.id, e.target.value)}
            placeholder={t('table.tableName')}
            className="font-bold px-2 py-1 sm:py-0.5 bg-gray-700 text-white placeholder-gray-400 border border-transparent hover:border-gray-500 focus:bg-gray-600 focus:border-gray-500 focus:outline-none w-full sm:w-64 transition-colors"
          />
          <input
            type="text"
            value={table.comment}
            onChange={(e) => updateTableComment(table.id, e.target.value)}
            placeholder={t('table.tableComment')}
            className="text-sm px-2 py-1 sm:py-0.5 bg-gray-700 text-gray-200 placeholder-gray-400 border border-transparent hover:border-gray-500 focus:bg-gray-600 focus:border-gray-500 focus:outline-none w-full sm:flex-1 sm:max-w-xs transition-colors"
          />
        </div>
        <div className="flex items-center justify-end gap-1 sm:gap-2">
          <button
            onClick={() => setIsRelationEditorOpen(true)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            title={t('table.foreignKeysTitle')}
          >
            <Link className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsIndexEditorOpen(true)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            title={t('table.indexesTitle')}
          >
            <ListOrdered className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              if (confirm(t('table.confirmDeleteTable'))) {
                removeTable(table.id);
              }
            }}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 transition-colors"
            title={t('table.deleteTableTitle')}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto relative flex">
        <table className="text-left text-sm whitespace-nowrap border-collapse" style={{ minWidth: 'max-content' }}>
          <tbody className="[&>tr:nth-child(even)]:bg-blue-50/50">
            <tr>
              <th className="sticky left-0 bg-gray-700 text-white z-10 p-2 w-28 border-r border-gray-600 font-medium shadow-[2px_0_4px_rgba(0,0,0,0.1)]">{t('table.colName')}</th>
              {table.columns.map((col) => (
                <td key={col.id} className="p-2 border-r w-40 relative group">
                  <input
                    type="text"
                    value={col.name}
                    onChange={(e) => handleColumnUpdate(col.id, 'name', e.target.value)}
                    className="w-full px-2 py-1 border rounded pr-7"
                  />
                  <button
                    onClick={() => removeColumn(table.id, col.id)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </td>
              ))}
            </tr>
            <tr className="border-t">
              <th className="sticky left-0 bg-gray-700 text-white z-10 p-2 border-r border-gray-600 font-medium shadow-[2px_0_4px_rgba(0,0,0,0.1)]">{t('table.colType')}</th>
              {table.columns.map((col) => (
                <td key={col.id} className="p-2 border-r">
                  <select
                    value={col.type}
                    onChange={(e) => handleColumnUpdate(col.id, 'type', e.target.value)}
                    className="w-full px-2 py-1 border rounded"
                  >
                    <option value="">{t('table.select')}</option>
                    {categories.map((cat) => (
                      <optgroup key={cat} label={cat}>
                        {columnTypes.filter(tc => tc.category === cat).map(tc => (
                          <option key={tc.name} value={tc.name}>{tc.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </td>
              ))}

            </tr>
            <tr className="border-t">
              <th className="sticky left-0 bg-gray-700 text-white z-10 p-2 border-r border-gray-600 font-medium shadow-[2px_0_4px_rgba(0,0,0,0.1)]">{t('table.colLength')}</th>
              {table.columns.map((col) => {
                const typeInfo = columnTypes.find(tc => tc.name === col.type);
                return (
                  <td key={col.id} className="p-2 border-r">
                    {typeInfo?.hasLength && (
                      <input
                        type="number"
                        value={col.length || ''}
                        onChange={(e) => handleColumnUpdate(col.id, 'length', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-2 py-1 border rounded"
                      />
                    )}
                    {typeInfo?.hasPrecision && (
                      <div className="flex gap-1 mt-1">
                        <input
                          type="number"
                          placeholder="P"
                          title="Precision"
                          value={col.precision || ''}
                          onChange={(e) => handleColumnUpdate(col.id, 'precision', e.target.value ? parseInt(e.target.value) : undefined)}
                          className="w-1/2 px-1 py-1 text-xs border rounded"
                        />
                        {typeInfo?.hasScale && (
                          <input
                            type="number"
                            placeholder="S"
                            title="Scale"
                            value={col.scale || ''}
                            onChange={(e) => handleColumnUpdate(col.id, 'scale', e.target.value ? parseInt(e.target.value) : undefined)}
                            className="w-1/2 px-1 py-1 text-xs border rounded"
                          />
                        )}
                      </div>
                    )}
                  </td>
                );
              })}

            </tr>
            <tr className="border-t">
              <th className="sticky left-0 bg-gray-700 text-white z-10 p-2 border-r border-gray-600 font-medium shadow-[2px_0_4px_rgba(0,0,0,0.1)]">{t('table.colPk')}</th>
              {table.columns.map((col) => (
                <td key={col.id} className="p-2 border-r text-center">
                  <input
                    type="checkbox"
                    checked={col.primaryKey}
                    onChange={(e) => handleColumnUpdate(col.id, 'primaryKey', e.target.checked)}
                  />
                </td>
              ))}

            </tr>
            <tr className="border-t">
              <th className="sticky left-0 bg-gray-700 text-white z-10 p-2 border-r border-gray-600 font-medium shadow-[2px_0_4px_rgba(0,0,0,0.1)]">{t('table.colNullable')}</th>
              {table.columns.map((col) => (
                <td key={col.id} className="p-2 border-r text-center">
                  <input
                    type="checkbox"
                    checked={col.nullable}
                    onChange={(e) => handleColumnUpdate(col.id, 'nullable', e.target.checked)}
                  />
                </td>
              ))}

            </tr>
            <tr className="border-t">
              <th className="sticky left-0 bg-gray-700 text-white z-10 p-2 border-r border-gray-600 font-medium shadow-[2px_0_4px_rgba(0,0,0,0.1)]">{t('table.colUnique')}</th>
              {table.columns.map((col) => (
                <td key={col.id} className="p-2 border-r text-center">
                  <input
                    type="checkbox"
                    checked={col.unique}
                    onChange={(e) => handleColumnUpdate(col.id, 'unique', e.target.checked)}
                  />
                </td>
              ))}

            </tr>
            <tr className="border-t">
              <th className="sticky left-0 bg-gray-700 text-white z-10 p-2 border-r border-gray-600 font-medium shadow-[2px_0_4px_rgba(0,0,0,0.1)]">{t('table.colAutoIncrement')}</th>
              {table.columns.map((col) => (
                <td key={col.id} className="p-2 border-r text-center">
                  <input
                    type="checkbox"
                    checked={col.autoIncrement}
                    onChange={(e) => handleColumnUpdate(col.id, 'autoIncrement', e.target.checked)}
                  />
                </td>
              ))}

            </tr>
            {showUnsigned && (
              <tr className="border-t">
                <th className="sticky left-0 bg-gray-700 text-white z-10 p-2 border-r border-gray-600 font-medium shadow-[2px_0_4px_rgba(0,0,0,0.1)]">{t('table.colUnsigned')}</th>
                {table.columns.map((col) => (
                  <td key={col.id} className="p-2 border-r text-center">
                    <input
                      type="checkbox"
                      checked={col.unsigned}
                      onChange={(e) => handleColumnUpdate(col.id, 'unsigned', e.target.checked)}
                    />
                  </td>
                ))}
              </tr>
            )}
            <tr className="border-t">
              <th className="sticky left-0 bg-gray-700 text-white z-10 p-2 border-r border-gray-600 font-medium shadow-[2px_0_4px_rgba(0,0,0,0.1)]">{t('table.colDefault')}</th>
              {table.columns.map((col) => (
                <td key={col.id} className="p-2 border-r">
                  <input
                    type="text"
                    value={typeof col.default === 'object' && col.default !== null ? (col.default as any).expression : col.default || ''}
                    onChange={(e) => handleColumnUpdate(col.id, 'default', e.target.value)}
                    className="w-full px-2 py-1 border rounded"
                  />
                </td>
              ))}

            </tr>
            <tr className="border-t">
              <th className="sticky left-0 bg-gray-700 text-white z-10 p-2 border-r border-gray-600 font-medium shadow-[2px_0_4px_rgba(0,0,0,0.1)]">{t('table.colComment')}</th>
              {table.columns.map((col) => (
                <td key={col.id} className="p-2 border-r">
                  <input
                    type="text"
                    value={col.comment}
                    onChange={(e) => handleColumnUpdate(col.id, 'comment', e.target.value)}
                    className="w-full px-2 py-1 border rounded"
                  />
                </td>
              ))}

            </tr>
            <tr className="border-t">
              <th className="sticky left-0 bg-gray-700 text-white z-10 p-2 border-r border-gray-600 font-medium shadow-[2px_0_4px_rgba(0,0,0,0.1)]">{t('table.colRelation')}</th>
              {table.columns.map((col) => {
                const fk = table.foreignKeys.find(f => f.columns.includes(col.name));
                let relationText = '';
                if (fk && fk.referenceTable) {
                  const idx = fk.columns.indexOf(col.name);
                  const refColName = fk.referenceColumns[idx];
                  if (refColName) {
                    relationText = `${fk.referenceTable}.${refColName}`;
                  } else {
                    relationText = fk.referenceTable;
                  }
                }
                return (
                  <td key={col.id} className="p-2 border-r text-center bg-gray-50/50">
                    {fk ? (
                      <button
                        onClick={() => setIsRelationEditorOpen(true)}
                        className="text-xs text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded hover:bg-blue-200 flex items-center justify-center gap-1 w-full truncate"
                        title={t('table.editRelationTitle')}
                      >
                        <Link className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{relationText}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsRelationEditorOpen(true)}
                        className="text-gray-300 hover:text-blue-500 mx-auto block p-1 rounded hover:bg-gray-200"
                        title={t('table.addRelationTitle')}
                      >
                        <Link className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
        <button
          onClick={() => addColumn(table.id)}
          className="flex-shrink-0 w-40 bg-gray-100 hover:bg-blue-100 border-l-2 border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors group"
          title={t('table.addColumnTitle')}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {isRelationEditorOpen && (
        <RelationEditor
          tableId={table.id}
          isOpen={isRelationEditorOpen}
          onClose={() => setIsRelationEditorOpen(false)}
        />
      )}
      {isIndexEditorOpen && (
        <IndexEditor
          tableId={table.id}
          isOpen={isIndexEditorOpen}
          onClose={() => setIsIndexEditorOpen(false)}
        />
      )}
    </div>
  );
}
