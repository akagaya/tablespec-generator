import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../store/useProjectStore';
import { INDEX_TYPES, IndexType } from '../../types/tablespec';
import { Modal } from '../ui/Modal';
import { ColumnChecklist } from '../ui/ColumnChecklist';

interface Props {
  tableId: string;
  onClose: () => void;
}

const INDEX_TYPE_LABELS: Record<IndexType, string> = {
  btree: 'B-Tree',
  hash: 'Hash',
  gin: 'GIN',
  gist: 'GiST',
  brin: 'BRIN',
};

export function IndexEditor({ tableId, onClose }: Props) {
  const { t } = useTranslation();
  const currentTable = useProjectStore((state) => state.spec.tables.find((tb) => tb.id === tableId));
  const addIndex = useProjectStore((state) => state.addIndex);
  const removeIndex = useProjectStore((state) => state.removeIndex);
  const updateIndex = useProjectStore((state) => state.updateIndex);

  if (!currentTable) return null;

  return (
    <Modal
      title={`${t('indexEditor.title')} - ${currentTable.name || t('relationEditor.unnamed')}`}
      onClose={onClose}
      bodyClassName="p-4 flex flex-col gap-6"
      footer={
        <div className="flex justify-between">
          <button
            onClick={() => addIndex(tableId)}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded hover:bg-gray-50 font-medium"
          >
            <Plus className="w-4 h-4" /> {t('indexEditor.addIndex')}
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
            {t('indexEditor.done')}
          </button>
        </div>
      }
    >
      {currentTable.indexes.length === 0 ? (
        <p className="text-gray-500 text-center py-8">{t('indexEditor.noIndexes')}</p>
      ) : (
        currentTable.indexes.map((idx) => (
          <div key={idx.id} className="border rounded-lg p-4 bg-gray-50 relative">
            <button
              onClick={() => removeIndex(tableId, idx.id)}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
              aria-label={t('indexEditor.deleteIndex')}
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('indexEditor.indexName')}</label>
                <input
                  type="text"
                  value={idx.name}
                  onChange={(e) => updateIndex(tableId, idx.id, { name: e.target.value })}
                  className="w-full border rounded px-2 py-1 bg-white"
                  placeholder="idx_name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('indexEditor.indexType')}</label>
                <select
                  value={idx.type ?? 'btree'}
                  onChange={(e) => updateIndex(tableId, idx.id, { type: e.target.value as IndexType })}
                  className="w-full border rounded px-2 py-1 bg-white"
                >
                  {INDEX_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {INDEX_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="block text-sm font-medium mb-1">{t('indexEditor.columns')}</label>
            <ColumnChecklist
              columns={currentTable.columns}
              selected={idx.columns}
              onChange={(columns) => updateIndex(tableId, idx.id, { columns })}
            />

            <label className="mt-4 flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={idx.unique}
                onChange={(e) => updateIndex(tableId, idx.id, { unique: e.target.checked })}
              />
              {t('indexEditor.isUnique')}
            </label>
          </div>
        ))
      )}
    </Modal>
  );
}
