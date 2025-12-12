import { useState } from 'react';
import Header from '@components/layout/Header';
import Sidebar from '@components/layout/Sidebar';
import MainContent from '@components/layout/MainContent';
import { DiagramProvider } from '@hooks/useDiagramState';
import { ProProvider } from '@hooks/usePro';
import { useDiagramState } from '@hooks/useDiagramState';
import './App.css';

function AppContent() {
  const { currentDiagram } = useDiagramState();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Start with sidebar closed

  // Hide sidebar for diagram types that don't need it (sequence, class, state, er, gantt, pie)
  const shouldShowSidebar = ['flowchart'].includes(currentDiagram.type);

  return (
    <div className="flex h-screen bg-dark-bg text-white">
      {sidebarOpen && shouldShowSidebar && <Sidebar onToggle={() => setSidebarOpen(false)} />}
      <div className="flex flex-col flex-1">
        <Header 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          shouldShowSidebar={shouldShowSidebar}
        />
        <MainContent />
      </div>
    </div>
  );
}

function App() {
  return (
    <ProProvider>
      <DiagramProvider>
        <AppContent />
      </DiagramProvider>
    </ProProvider>
  );
}

export default App;
