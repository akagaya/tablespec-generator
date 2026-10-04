import { useTranslation } from 'react-i18next';
import type { Column } from '../../types/tablespec';

interface Props {
  columns: Column[];
  /** 選択済みカラム名（選択順を保持する） */
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
}

export function ColumnChecklist({ columns, selected, onChange, className = '' }: Props) {
  const { t } = useTranslation();

  const toggle = (name: string) =>
    onChange(selected.includes(name) ? selected.filter((c) => c !== name) : [...selected, name]);

  return (
    <div className={`border rounded bg-white p-2 max-h-32 overflow-y-auto flex flex-col gap-1 ${className}`}>
      {columns.map((col) => (
        <label key={col.id} className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={selected.includes(col.name)} onChange={() => toggle(col.name)} />
          {col.name || t('relationEditor.unnamed')}
        </label>
      ))}
    </div>
  );
}
