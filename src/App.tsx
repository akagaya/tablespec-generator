import { useEffect, useState } from 'react';
import { Header } from './components/layout/Header';
import { Workspace } from './components/layout/Workspace';
import { ExportDialog } from './components/export/ExportDialog';
import { MermaidPreview } from './components/export/MermaidPreview';

export default function App() {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isMermaidPreviewOpen, setIsMermaidPreviewOpen] = useState(false);

  useEffect(() => {
    const handleOpenExport = () => setIsExportDialogOpen(true);
    window.addEventListener('open-export-dialog', handleOpenExport);
    return () => window.removeEventListener('open-export-dialog', handleOpenExport);
  }, []);

  useEffect(() => {
    const handleOpenMermaid = () => setIsMermaidPreviewOpen(true);
    window.addEventListener('open-mermaid-preview', handleOpenMermaid);
    return () => window.removeEventListener('open-mermaid-preview', handleOpenMermaid);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white text-gray-900 font-sans">
      <Header />
      <Workspace />
      
      <ExportDialog 
        isOpen={isExportDialogOpen} 
        onClose={() => setIsExportDialogOpen(false)} 
      />
      <MermaidPreview
        isOpen={isMermaidPreviewOpen}
        onClose={() => setIsMermaidPreviewOpen(false)}
      />
    </div>
  );
}
