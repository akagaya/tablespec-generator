import { useProjectStore } from '../../store/useProjectStore';
import { TableCard } from '../table/TableCard';
import { AddTableButton } from '../table/AddTableButton';
import { useTranslation } from 'react-i18next';

export function Workspace() {
  const { t } = useTranslation();
  const tables = useProjectStore(state => state.spec.tables);

  return (
    <main className="flex flex-col gap-6 p-6 overflow-y-auto flex-1 bg-gray-50">
      {tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-gray-500">
          <h2 className="mb-2 text-xl font-medium text-gray-400">{t('workspace.noTables')}</h2>
          <p className="mb-6 text-sm text-gray-400">{t('workspace.startDesign')}</p>
          <AddTableButton />
        </div>
      ) : (
        <>
          {tables.map(table => (
            <TableCard key={table.id} table={table} />
          ))}
          <AddTableButton />
        </>
      )}
    </main>
  );
}
