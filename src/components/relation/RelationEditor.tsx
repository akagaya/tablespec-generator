import { X, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../store/useProjectStore';
import { ReferentialAction } from '../../types/tablespec';

interface Props {
  tableId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RelationEditor({ tableId, isOpen, onClose }: Props) {
  const { t } = useTranslation();
  const spec = useProjectStore(state => state.spec);
  const addForeignKey = useProjectStore(state => state.addForeignKey);
  const removeForeignKey = useProjectStore(state => state.removeForeignKey);
  const updateForeignKey = useProjectStore(state => state.updateForeignKey);

  if (!isOpen) return null;

  const currentTable = spec.tables.find(t => t.id === tableId);
  if (!currentTable) return null;

  const otherTables = spec.tables.filter(t => t.id !== tableId);

  const handleUpdate = (fkId: string, field: string, value: any) => {
    updateForeignKey(tableId, fkId, { [field]: value });
  };

  const handleColumnToggle = (fkId: string, column: string, field: 'columns' | 'referenceColumns', currentArr: string[]) => {
    const newArr = currentArr.includes(column) 
      ? currentArr.filter(c => c !== column)
      : [...currentArr, column];
    handleUpdate(fkId, field, newArr);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">{t('relationEditor.title')} - {currentTable.name || t('relationEditor.unnamed')}</h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-6">
          {currentTable.foreignKeys.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t('relationEditor.noForeignKeys')}</p>
          ) : (
            currentTable.foreignKeys.map((fk) => (
              <div key={fk.id} className="border rounded-md p-4 bg-gray-50 relative">
                <button
                  onClick={() => removeForeignKey(tableId, fk.id)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('relationEditor.sourceColumn')}</label>
                    <div className="border rounded bg-white p-2 max-h-32 overflow-y-auto flex flex-col gap-1 mb-4">
                      {currentTable.columns.map(col => (
                        <label key={col.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={fk.columns.includes(col.name)}
                            onChange={() => handleColumnToggle(fk.id, col.name, 'columns', fk.columns)}
                          />
                          {col.name || t('relationEditor.unnamed')}
                        </label>
                      ))}
                    </div>

                    <label className="block text-sm font-medium mb-1">{t('relationEditor.fkName')}</label>
                    <input
                      type="text"
                      value={fk.name || ''}
                      onChange={(e) => handleUpdate(fk.id, 'name', e.target.value)}
                      className="w-full border rounded px-2 py-1 bg-white"
                      placeholder="fk_name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">{t('relationEditor.refTable')}</label>
                    <select
                      value={fk.referenceTable || ''}
                      onChange={(e) => handleUpdate(fk.id, 'referenceTable', e.target.value)}
                      className="w-full border rounded px-2 py-1 mb-2 bg-white"
                    >
                      <option value="">{t('relationEditor.selectContext')}</option>
                      {otherTables.map(t => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                      ))}
                    </select>

                    <label className="block text-sm font-medium mb-1">{t('relationEditor.refColumn')}</label>
                    <div className="border rounded bg-white p-2 max-h-32 overflow-y-auto flex flex-col gap-1">
                      {otherTables.find(tb => tb.name === fk.referenceTable)?.columns.map(col => (
                        <label key={col.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={fk.referenceColumns.includes(col.name)}
                            onChange={() => handleColumnToggle(fk.id, col.name, 'referenceColumns', fk.referenceColumns)}
                          />
                          {col.name || t('relationEditor.unnamed')}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">{t('relationEditor.onDelete')}</label>
                    <select
                      value={fk.onDelete || 'NO ACTION'}
                      onChange={(e) => handleUpdate(fk.id, 'onDelete', e.target.value as ReferentialAction)}
                      className="w-full border rounded px-2 py-1 bg-white"
                    >
                      <option value="CASCADE">CASCADE</option>
                      <option value="SET NULL">SET NULL</option>
                      <option value="SET DEFAULT">SET DEFAULT</option>
                      <option value="RESTRICT">RESTRICT</option>
                      <option value="NO ACTION">NO ACTION</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">{t('relationEditor.onUpdate')}</label>
                    <select
                      value={fk.onUpdate || 'NO ACTION'}
                      onChange={(e) => handleUpdate(fk.id, 'onUpdate', e.target.value as ReferentialAction)}
                      className="w-full border rounded px-2 py-1 bg-white"
                    >
                      <option value="CASCADE">CASCADE</option>
                      <option value="SET NULL">SET NULL</option>
                      <option value="SET DEFAULT">SET DEFAULT</option>
                      <option value="RESTRICT">RESTRICT</option>
                      <option value="NO ACTION">NO ACTION</option>
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-between rounded-b-lg">
          <button
            onClick={() => addForeignKey(tableId)}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded hover:bg-gray-50 font-medium"
          >
            <Plus className="w-4 h-4" /> {t('relationEditor.addForeignKey')}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
          >
            {t('relationEditor.done')}
          </button>
        </div>
      </div>
    </div>
  );
}
