import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../store/useProjectStore';
import { REFERENTIAL_ACTIONS, ReferentialAction } from '../../types/tablespec';
import { Modal } from '../ui/Modal';
import { ColumnChecklist } from '../ui/ColumnChecklist';

interface Props {
  tableId: string;
  onClose: () => void;
}

export function RelationEditor({ tableId, onClose }: Props) {
  const { t } = useTranslation();
  const tables = useProjectStore((state) => state.spec.tables);
  const addForeignKey = useProjectStore((state) => state.addForeignKey);
  const removeForeignKey = useProjectStore((state) => state.removeForeignKey);
  const updateForeignKey = useProjectStore((state) => state.updateForeignKey);

  const currentTable = tables.find((tb) => tb.id === tableId);
  if (!currentTable) return null;

  const actionSelect = (fkId: string, field: 'onDelete' | 'onUpdate', value: ReferentialAction | undefined) => (
    <select
      value={value ?? 'NO ACTION'}
      onChange={(e) => updateForeignKey(tableId, fkId, { [field]: e.target.value as ReferentialAction })}
      className="w-full border rounded px-2 py-1 bg-white"
    >
      {REFERENTIAL_ACTIONS.map((action) => (
        <option key={action} value={action}>
          {action}
        </option>
      ))}
    </select>
  );

  return (
    <Modal
      title={`${t('relationEditor.title')} - ${currentTable.name || t('relationEditor.unnamed')}`}
      onClose={onClose}
      bodyClassName="p-4 flex flex-col gap-6"
      footer={
        <div className="flex justify-between">
          <button
            onClick={() => addForeignKey(tableId)}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded hover:bg-gray-50 font-medium"
          >
            <Plus className="w-4 h-4" /> {t('relationEditor.addForeignKey')}
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
            {t('relationEditor.done')}
          </button>
        </div>
      }
    >
      {currentTable.foreignKeys.length === 0 ? (
        <p className="text-gray-500 text-center py-8">{t('relationEditor.noForeignKeys')}</p>
      ) : (
        currentTable.foreignKeys.map((fk) => {
          // 自己参照（parent_id など）も許可する
          const refTable = tables.find((tb) => tb.name === fk.referenceTable);
          return (
            <div key={fk.id} className="border rounded-md p-4 bg-gray-50 relative">
              <button
                onClick={() => removeForeignKey(tableId, fk.id)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-600"
                aria-label={t('relationEditor.deleteForeignKey')}
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('relationEditor.sourceColumn')}</label>
                  <ColumnChecklist
                    columns={currentTable.columns}
                    selected={fk.columns}
                    onChange={(columns) => updateForeignKey(tableId, fk.id, { columns })}
                    className="mb-4"
                  />

                  <label className="block text-sm font-medium mb-1">{t('relationEditor.fkName')}</label>
                  <input
                    type="text"
                    value={fk.name}
                    onChange={(e) => updateForeignKey(tableId, fk.id, { name: e.target.value })}
                    className="w-full border rounded px-2 py-1 bg-white"
                    placeholder="fk_name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('relationEditor.refTable')}</label>
                  <select
                    value={fk.referenceTable}
                    onChange={(e) =>
                      updateForeignKey(tableId, fk.id, { referenceTable: e.target.value, referenceColumns: [] })
                    }
                    className="w-full border rounded px-2 py-1 mb-2 bg-white"
                  >
                    <option value="">{t('relationEditor.selectContext')}</option>
                    {tables.map((tb) => (
                      <option key={tb.id} value={tb.name}>
                        {tb.name}
                      </option>
                    ))}
                  </select>

                  <label className="block text-sm font-medium mb-1">{t('relationEditor.refColumn')}</label>
                  <ColumnChecklist
                    columns={refTable?.columns ?? []}
                    selected={fk.referenceColumns}
                    onChange={(referenceColumns) => updateForeignKey(tableId, fk.id, { referenceColumns })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('relationEditor.onDelete')}</label>
                  {actionSelect(fk.id, 'onDelete', fk.onDelete)}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('relationEditor.onUpdate')}</label>
                  {actionSelect(fk.id, 'onUpdate', fk.onUpdate)}
                </div>
              </div>
            </div>
          );
        })
      )}
    </Modal>
  );
}
