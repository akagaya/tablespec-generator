import { useProjectStore } from '../../store/useProjectStore';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function AddTableButton() {
  const { t } = useTranslation();
  const addTable = useProjectStore(state => state.addTable);

  return (
    <button
      onClick={addTable}
      className="flex flex-col items-center justify-center gap-2 border-dashed border-2 border-blue-300 rounded-lg p-8 text-blue-500 bg-blue-50/50 hover:bg-blue-100 hover:text-blue-700 hover:border-blue-500 transition-colors font-medium"
    >
      <Plus className="w-8 h-8" />
      <span className="font-semibold text-base">{t('table.addTable')}</span>
    </button>
  );
}
