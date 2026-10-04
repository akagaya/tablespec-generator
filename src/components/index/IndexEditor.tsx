import { ListOrdered, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../store/useProjectStore';
import { INDEX_TYPES, IndexType } from '../../types/tablespec';
import { Modal } from '../ui/Modal';
import { defaultIndexName } from '../../lib/naming';
import { ColumnChecklist } from '../ui/ColumnChecklist';
import { buttonClass, checkboxClass, iconButtonClass, inputClass, labelClass } from '../ui/styles';

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
      title={t('indexEditor.title')}
      subtitle={<span className="font-mono">{currentTable.name || t('relationEditor.unnamed')}</span>}
      onClose={onClose}
      bodyClassName="p-4 sm:p-5 flex flex-col gap-4 bg-gray-50"
      footer={
        <div className="flex justify-between gap-2">
          <button onClick={() => addIndex(tableId)} className={buttonClass.secondary}>
            <Plus className="h-4 w-4" /> {t('indexEditor.addIndex')}
          </button>
          <button onClick={onClose} className={buttonClass.primary}>
            {t('indexEditor.done')}
          </button>
        </div>
      }
    >
      {currentTable.indexes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center text-gray-600">
          <ListOrdered className="h-8 w-8 text-gray-400" />
          <p>{t('indexEditor.noIndexes')}</p>
          <button onClick={() => addIndex(tableId)} className={buttonClass.primary}>
            <Plus className="h-4 w-4" /> {t('indexEditor.addIndex')}
          </button>
        </div>
      ) : (
        currentTable.indexes.map((idx) => {
          const suggestedName = defaultIndexName(currentTable, idx);
          return (
            <div key={idx.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-end gap-2">
                <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr]">
                  <div>
                    <label className={labelClass}>{t('indexEditor.indexName')}</label>
                    <input
                      type="text"
                      value={idx.name}
                      onChange={(e) => updateIndex(tableId, idx.id, { name: e.target.value })}
                      className={`${inputClass} font-mono`}
                      placeholder={suggestedName}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t('indexEditor.indexType')}</label>
                    <select
                      value={idx.type ?? 'btree'}
                      onChange={(e) => updateIndex(tableId, idx.id, { type: e.target.value as IndexType })}
                      className={inputClass}
                    >
                      {INDEX_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {INDEX_TYPE_LABELS[type]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => removeIndex(tableId, idx.id)}
                  className={`${iconButtonClass} hover:bg-red-50 hover:text-red-600`}
                  title={t('indexEditor.deleteIndex')}
                  aria-label={t('indexEditor.deleteIndex')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <label className={labelClass}>
                {t('indexEditor.columns')}
                <span className="ml-2 font-normal normal-case tracking-normal text-gray-500">
                  {t('indexEditor.columnsHint')}
                </span>
              </label>
              <ColumnChecklist
                columns={currentTable.columns}
                selected={idx.columns}
                onChange={(columns) => updateIndex(tableId, idx.id, { columns })}
              />

              <label className="mt-4 inline-flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  className={checkboxClass}
                  checked={idx.unique}
                  onChange={(e) => updateIndex(tableId, idx.id, { unique: e.target.checked })}
                />
                {t('indexEditor.isUnique')}
              </label>
            </div>
          );
        })
      )}
    </Modal>
  );
}
