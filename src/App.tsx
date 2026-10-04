import { Header } from './components/layout/Header';
import { Workspace } from './components/layout/Workspace';
import { DialogHost } from './components/DialogHost';

export default function App() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white text-gray-900 font-sans">
      <Header />
      <Workspace />
      <DialogHost />
    </div>
  );
}
