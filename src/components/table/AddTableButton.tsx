import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAddTable } from '../../hooks/useAddTable';

export function AddTableButton({ variant = 'block' }: { variant?: 'block' | 'hero' }) {
  const { t } = useTranslation();
  const addTable = useAddTable();

  if (variant === 'hero') {
    return (
      <button
        onClick={addTable}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
      >
        <Plus className="h-5 w-5" />
        {t('table.addTable')}
      </button>
    );
  }

  return (
    <button
      onClick={addTable}
      className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 p-5 font-medium text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
    >
      <Plus className="h-5 w-5" />
      {t('table.addTable')}
    </button>
  );
}
