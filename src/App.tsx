import { Header } from './components/layout/Header';
import { Workspace } from './components/layout/Workspace';
import { DialogHost } from './components/DialogHost';

export default function App() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-gray-50 font-sans text-gray-900">
      <Header />
      <Workspace />
      <DialogHost />
    </div>
  );
}
