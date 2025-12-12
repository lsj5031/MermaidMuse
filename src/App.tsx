import { useState } from 'react';
import Header from '@components/layout/Header';
import Sidebar from '@components/layout/Sidebar';
import MainContent from '@components/layout/MainContent';
import { DiagramProvider } from '@hooks/useDiagramState';
import { ProProvider } from '@hooks/usePro';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <ProProvider>
      <DiagramProvider>
        <div className="flex h-screen bg-dark-bg text-white">
          {sidebarOpen && <Sidebar onToggle={() => setSidebarOpen(false)} />}
          <div className="flex flex-col flex-1">
            <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <MainContent />
          </div>
        </div>
      </DiagramProvider>
    </ProProvider>
  );
}

export default App;
