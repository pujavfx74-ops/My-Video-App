import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Space / K', desc: 'Play / Pause video' },
  { key: 'Left / Right', desc: 'Seek backward / forward 5s' },
  { key: 'J / L', desc: 'Seek backward / forward 10s' },
  { key: ', / . (Comma / Dot)', desc: 'Step -1 frame / +1 frame' },
  { key: 'Up / Down', desc: 'Volume up / down 10%' },
  { key: 'M', desc: 'Toggle Mute' },
  { key: 'E', desc: 'Toggle Post-processing Filters' },
  { key: 'F', desc: 'Toggle Fullscreen' },
  { key: 'P', desc: 'Picture-in-Picture mode' },
  { key: 'C', desc: 'Capture frame snapshot (PNG)' },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Keyboard className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-slate-100">Keyboard Shortcuts</h2>
        </div>

        <div className="divide-y divide-slate-800 text-sm">
          {SHORTCUTS.map((item) => (
            <div key={item.key} className="py-2.5 flex items-center justify-between">
              <span className="text-slate-300 text-xs">{item.desc}</span>
              <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-xs shadow-xs">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
