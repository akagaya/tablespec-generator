import { useProjectStore } from '../store/useProjectStore';
import { useUiStore } from '../store/useUiStore';

/** テーブルを追加し、追加したテーブルへスクロールする */
export function useAddTable() {
  const addTable = useProjectStore((state) => state.addTable);
  const focusTable = useUiStore((state) => state.focusTable);
  return () => focusTable(addTable());
}
