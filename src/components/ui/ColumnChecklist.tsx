import { useTranslation } from 'react-i18next';
import type { Column } from '../../types/tablespec';
import { checkboxClass } from './styles';

interface Props {
  columns: Column[];
  /** 選択済みカラム名（選択順を保持する） */
  selected: string[];
  onChange: (selected: string[]) => void;
}

/** 選択順に番号を表示するカラム選択リスト（複合インデックスの列順を明示する） */
export function ColumnChecklist({ columns, selected, onChange }: Props) {
  const { t } = useTranslation();

  const toggle = (name: string) =>
    onChange(selected.includes(name) ? selected.filter((c) => c !== name) : [...selected, name]);

  if (columns.length === 0) {
    return <p className="rounded-md border border-dashed p-3 text-sm text-gray-500">{t('common.noColumns')}</p>;
  }

  return (
    <div className="flex max-h-44 flex-col overflow-y-auto rounded-md border bg-white">
      {columns.map((col) => {
        const order = selected.indexOf(col.name);
        return (
          <label
            key={col.id}
            className="flex cursor-pointer items-center gap-2 border-b px-3 py-2 text-sm last:border-b-0 hover:bg-gray-50"
          >
            <input
              type="checkbox"
              className={checkboxClass}
              checked={order >= 0}
              onChange={() => toggle(col.name)}
            />
            <span className="flex-1 truncate font-mono">{col.name || t('relationEditor.unnamed')}</span>
            <span className="text-xs text-gray-500">{col.type}</span>
            {order >= 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                {order + 1}
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
}
