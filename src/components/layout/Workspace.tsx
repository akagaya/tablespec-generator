import { Database } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../store/useProjectStore';
import { TableCard } from '../table/TableCard';
import { AddTableButton } from '../table/AddTableButton';
import { TableNavigator } from './TableNavigator';

export function Workspace() {
  const { t } = useTranslation();
  const tables = useProjectStore((state) => state.spec.tables);

  if (tables.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="mb-4 rounded-full bg-blue-100 p-4">
          <Database className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-gray-800">{t('workspace.noTables')}</h2>
        <p className="mb-6 max-w-sm text-sm text-gray-500">{t('workspace.startDesign')}</p>
        <AddTableButton variant="hero" />
      </main>
    );
  }

  return (
    <div className="flex min-h-0 flex-1">
      <TableNavigator />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="flex flex-col gap-4 p-3 sm:gap-6 sm:p-6">
          {tables.map((table) => (
            <TableCard key={table.id} table={table} />
          ))}
          <AddTableButton />
        </div>
      </main>
    </div>
  );
}
