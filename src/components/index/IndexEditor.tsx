import { X, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../store/useProjectStore';
import { IndexType } from '../../types/tablespec';

interface Props {
  tableId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function IndexEditor({ tableId, isOpen, onClose }: Props) {
  const { t } = useTranslation();
  const spec = useProjectStore(state => state.spec);
  const addIndex = useProjectStore(state => state.addIndex);
  const removeIndex = useProjectStore(state => state.removeIndex);
  const updateIndex = useProjectStore(state => state.updateIndex);

  if (!isOpen) return null;

  const currentTable = spec.tables.find(t => t.id === tableId);
  if (!currentTable) return null;

  const handleUpdate = (idxId: string, field: string, value: any) => {
    updateIndex(tableId, idxId, { [field]: value });
  };

  const handleColumnToggle = (idxId: string, column: string, currentArr: string[]) => {
    const newArr = currentArr.includes(column) 
      ? currentArr.filter(c => c !== column)
      : [...currentArr, column];
    handleUpdate(idxId, 'columns', newArr);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">{t('indexEditor.title')} - {currentTable.name || t('relationEditor.unnamed')}</h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-6">
          {currentTable.indexes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t('indexEditor.noIndexes')}</p>
          ) : (
            currentTable.indexes.map(idx => (
              <div key={idx.id} className="border rounded-lg p-4 bg-gray-50 relative">
                <button
                  onClick={() => removeIndex(tableId, idx.id)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('indexEditor.indexName')}</label>
                    <input
                      type="text"
                      value={idx.name}
                      onChange={(e) => handleUpdate(idx.id, 'name', e.target.value)}
                      className="w-full border rounded px-2 py-1 bg-white"
                      placeholder="idx_name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('indexEditor.indexType')}</label>
                    <select
                      value={idx.type || 'btree'}
                      onChange={(e) => handleUpdate(idx.id, 'type', e.target.value as IndexType)}
                      className="w-full border rounded px-2 py-1 bg-white"
                    >
                      <option value="btree">B-Tree</option>
                      <option value="hash">Hash</option>
                      <option value="gin">GIN</option>
                      <option value="gist">GiST</option>
                      <option value="brin">BRIN</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('indexEditor.columns')}</label>
                  <div className="border rounded bg-white p-2 max-h-32 overflow-y-auto flex flex-col gap-1">
                    {currentTable.columns.map(col => (
                      <label key={col.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={idx.columns.includes(col.name)}
                          onChange={() => handleColumnToggle(idx.id, col.name, idx.columns)}
                        />
                        {col.name || t('relationEditor.unnamed')}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={idx.unique}
                      onChange={(e) => handleUpdate(idx.id, 'unique', e.target.checked)}
                    />
                    {t('indexEditor.isUnique')}
                  </label>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-between rounded-b-lg">
          <button
            onClick={() => addIndex(tableId)}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded hover:bg-gray-50 font-medium"
          >
            <Plus className="w-4 h-4" /> {t('indexEditor.addIndex')}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
          >
            {t('indexEditor.done')}
          </button>
        </div>
      </div>
    </div>
  );
}
