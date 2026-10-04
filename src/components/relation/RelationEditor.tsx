import { ArrowRight, Link, Plus, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../store/useProjectStore';
import { ForeignKey, REFERENTIAL_ACTIONS, ReferentialAction } from '../../types/tablespec';
import { Modal } from '../ui/Modal';
import { findReferencedTable } from '../../lib/references';
import { defaultForeignKeyName } from '../../lib/naming';
import { buttonClass, iconButtonClass, inputClass, labelClass } from '../ui/styles';

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

  const update = (fkId: string, updates: Partial<ForeignKey>) => updateForeignKey(tableId, fkId, updates);

  /** columns[i] ↔ referenceColumns[i] をペアとして編集する */
  const setPair = (fk: ForeignKey, index: number, side: 'columns' | 'referenceColumns', value: string) => {
    const next = [...fk[side]];
    next[index] = value;
    update(fk.id, { [side]: next });
  };
  const addPair = (fk: ForeignKey) =>
    update(fk.id, { columns: [...fk.columns, ''], referenceColumns: [...fk.referenceColumns, ''] });
  const removePair = (fk: ForeignKey, index: number) =>
    update(fk.id, {
      columns: fk.columns.filter((_, i) => i !== index),
      referenceColumns: fk.referenceColumns.filter((_, i) => i !== index),
    });

  const changeReferenceTable = (fk: ForeignKey, referenceTable: string) => {
    // 参照先の主キーを初期ペアとして提案する
    const pk = findReferencedTable(tables, { referenceTable })?.columns.filter((c) => c.primaryKey) ?? [];
    const referenceColumns = pk.map((c) => c.name);
    const columns = referenceColumns.map((_, i) => fk.columns[i] ?? '');
    update(fk.id, { referenceTable, referenceColumns, columns });
  };

  return (
    <Modal
      title={t('relationEditor.title')}
      subtitle={<span className="font-mono">{currentTable.name || t('relationEditor.unnamed')}</span>}
      onClose={onClose}
      size="lg"
      bodyClassName="p-4 sm:p-5 flex flex-col gap-4 bg-gray-50"
      footer={
        <div className="flex justify-between gap-2">
          <button onClick={() => addForeignKey(tableId)} className={buttonClass.secondary}>
            <Plus className="h-4 w-4" /> {t('relationEditor.addForeignKey')}
          </button>
          <button onClick={onClose} className={buttonClass.primary}>
            {t('relationEditor.done')}
          </button>
        </div>
      }
    >
      {currentTable.foreignKeys.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center text-gray-500">
          <Link className="h-8 w-8 text-gray-300" />
          <p>{t('relationEditor.noForeignKeys')}</p>
          <button onClick={() => addForeignKey(tableId)} className={buttonClass.primary}>
            <Plus className="h-4 w-4" /> {t('relationEditor.addForeignKey')}
          </button>
        </div>
      ) : (
        currentTable.foreignKeys.map((fk) => {
          // 自己参照（parent_id など）も許可する
          const refTable = findReferencedTable(tables, fk);
          const pairCount = Math.max(fk.columns.length, fk.referenceColumns.length);
          const suggestedName = defaultForeignKeyName(currentTable, fk, refTable?.name);

          return (
            <div key={fk.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-end gap-2">
                <div className="flex-1">
                  <label className={labelClass}>{t('relationEditor.fkName')}</label>
                  <input
                    type="text"
                    value={fk.name}
                    onChange={(e) => update(fk.id, { name: e.target.value })}
                    className={`${inputClass} font-mono`}
                    placeholder={suggestedName}
                  />
                </div>
                <button
                  onClick={() => removeForeignKey(tableId, fk.id)}
                  className={`${iconButtonClass} hover:bg-red-50 hover:text-red-600`}
                  title={t('relationEditor.deleteForeignKey')}
                  aria-label={t('relationEditor.deleteForeignKey')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-4">
                <label className={labelClass}>{t('relationEditor.refTable')}</label>
                <select
                  value={fk.referenceTable}
                  onChange={(e) => changeReferenceTable(fk, e.target.value)}
                  className={`${inputClass} font-mono`}
                >
                  <option value="">{t('relationEditor.selectContext')}</option>
                  {tables.map((tb) => (
                    <option key={tb.id} value={tb.id}>
                      {tb.name || t('relationEditor.unnamed')}
                      {tb.id === tableId ? ` (${t('relationEditor.self')})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <div className="mb-1 grid grid-cols-[1fr_auto_1fr_auto] gap-2">
                  <span className={labelClass}>{t('relationEditor.sourceColumn')}</span>
                  <span className="w-4" />
                  <span className={labelClass}>{t('relationEditor.refColumn')}</span>
                  <span className="w-8" />
                </div>
                <div className="space-y-2">
                  {Array.from({ length: pairCount }, (_, i) => (
                    <div key={i} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
                      <select
                        value={fk.columns[i] ?? ''}
                        onChange={(e) => setPair(fk, i, 'columns', e.target.value)}
                        className={`${inputClass} font-mono`}
                      >
                        <option value="">{t('relationEditor.selectContext')}</option>
                        {currentTable.columns.map((col) => (
                          <option key={col.id} value={col.name}>
                            {col.name}
                          </option>
                        ))}
                      </select>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <select
                        value={fk.referenceColumns[i] ?? ''}
                        onChange={(e) => setPair(fk, i, 'referenceColumns', e.target.value)}
                        disabled={!refTable}
                        className={`${inputClass} font-mono`}
                      >
                        <option value="">{t('relationEditor.selectContext')}</option>
                        {refTable?.columns.map((col) => (
                          <option key={col.id} value={col.name}>
                            {col.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => removePair(fk, i)}
                        className={`${iconButtonClass} p-1.5 hover:bg-gray-100 hover:text-gray-700`}
                        aria-label={t('relationEditor.removePair')}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => addPair(fk)}
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-4 w-4" /> {t('relationEditor.addPair')}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(['onDelete', 'onUpdate'] as const).map((field) => (
                  <div key={field}>
                    <label className={labelClass}>{t(`relationEditor.${field}`)}</label>
                    <select
                      value={fk[field] ?? 'NO ACTION'}
                      onChange={(e) => update(fk.id, { [field]: e.target.value as ReferentialAction })}
                      className={`${inputClass} font-mono`}
                    >
                      {REFERENTIAL_ACTIONS.map((action) => (
                        <option key={action} value={action}>
                          {action}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </Modal>
  );
}
