import { X } from 'lucide-react';
import { DIAGRAM_TYPES } from '@theme/constants';
import { useDiagramState } from '@hooks/useDiagramState';
import ProGate from '@components/ProUpsell/ProGate';

interface SidebarProps {
  onToggle: () => void;
}

export default function Sidebar({ onToggle }: SidebarProps) {
  const { currentDiagram, updateDiagramType, resetDiagram } = useDiagramState();

  return (
    <aside className="w-64 bg-dark-surface border-r border-dark-border h-screen flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-dark-border">
        <h2 className="font-bold text-neon-cyan">Diagram Types</h2>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-dark-surface2 rounded transition-colors"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {Object.entries(DIAGRAM_TYPES).map(([key, value]) => (
          <button
            key={key}
            onClick={() => updateDiagramType(value)}
            className={`w-full text-left px-4 py-2 rounded transition-all ${
              currentDiagram.type === value
                ? 'bg-neon-cyan bg-opacity-20 border-l-2 border-neon-cyan text-neon-cyan'
                : 'hover:bg-dark-surface2 text-gray-300'
            }`}
          >
            {key.charAt(0) + key.slice(1).toLowerCase().replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div className="border-t border-dark-border p-4 space-y-3">
        <button
          onClick={resetDiagram}
          className="w-full px-4 py-2 bg-neon-purple hover:bg-opacity-80 text-white rounded font-semibold transition-all"
        >
          Reset
        </button>

        <div className="space-y-2">
          <div className="text-xs text-gray-400">Pro</div>
          <ProGate>
            <div className="rounded border border-dark-border bg-dark-surface2 p-3">
              <div className="text-xs font-semibold text-neon-cyan">Pro unlocked</div>
              <div className="mt-1 text-[11px] text-gray-400">
                Pro is enabled (mock). Future pro-only features can be gated behind this.
              </div>
            </div>
          </ProGate>
        </div>
      </div>
    </aside>
  );
}
