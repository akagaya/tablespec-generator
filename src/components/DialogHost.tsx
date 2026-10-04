import { useUiStore } from '../store/useUiStore';
import { ExportDialog } from './export/ExportDialog';
import { MermaidPreview } from './export/MermaidPreview';
import { RelationEditor } from './relation/RelationEditor';
import { IndexEditor } from './index/IndexEditor';

/** 開いているダイアログを1つだけ描画する */
export function DialogHost() {
  const dialog = useUiStore((state) => state.dialog);
  const closeDialog = useUiStore((state) => state.closeDialog);

  switch (dialog?.type) {
    case 'export':
      return <ExportDialog onClose={closeDialog} />;
    case 'mermaid':
      return <MermaidPreview onClose={closeDialog} />;
    case 'relation':
      return <RelationEditor tableId={dialog.tableId} onClose={closeDialog} />;
    case 'index':
      return <IndexEditor tableId={dialog.tableId} onClose={closeDialog} />;
    default:
      return null;
  }
}
