import { create } from 'zustand';

export type Dialog =
  | { type: 'export' }
  | { type: 'mermaid' }
  | { type: 'relation'; tableId: string }
  | { type: 'index'; tableId: string };

interface UiState {
  dialog: Dialog | null;
  /** 追加直後などにスクロール・強調表示するテーブル */
  focusedTableId: string | null;
  openDialog: (dialog: Dialog) => void;
  closeDialog: () => void;
  focusTable: (id: string | null) => void;
}

/** 永続化しない画面状態 */
export const useUiStore = create<UiState>()((set) => ({
  dialog: null,
  focusedTableId: null,
  openDialog: (dialog) => set({ dialog }),
  closeDialog: () => set({ dialog: null }),
  focusTable: (focusedTableId) => set({ focusedTableId }),
}));
