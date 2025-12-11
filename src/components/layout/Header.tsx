import { useDiagramState } from '@hooks/useDiagramState';
import { Menu } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { currentDiagram } = useDiagramState();

  return (
    <header className="bg-dark-surface border-b border-dark-border h-16 flex items-center px-6 shadow-lg">
      <button
        onClick={onToggleSidebar}
        className="mr-4 p-2 hover:bg-dark-surface2 rounded transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu size={24} className="text-neon-cyan" />
      </button>
      <div className="flex-1">
        <h1 className="text-xl font-bold">
          <span className="text-neon-cyan">{'<'}</span>
          {currentDiagram.title}
          <span className="text-neon-cyan">{' />'}</span>
        </h1>
        <p className="text-xs text-gray-400">
          Last modified: {currentDiagram.lastModified.toLocaleTimeString()}
        </p>
      </div>
    </header>
  );
}
