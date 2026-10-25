import React from 'react';
import { SlidersHorizontal, RotateCcw, X, Sun, Contrast, Eye, Sparkles } from 'lucide-react';
import { VideoFilters, DEFAULT_FILTERS, isFiltersModified } from '../types.ts';

interface VideoFilterPanelProps {
  filters: VideoFilters;
  onChange: (filters: VideoFilters) => void;
  onReset: () => void;
  onClose: () => void;
}

interface Preset {
  name: string;
  filters: VideoFilters;
}

const PRESETS: Preset[] = [
  {
    name: 'Normal',
    filters: { ...DEFAULT_FILTERS },
  },
  {
    name: 'Cinema Noir',
    filters: {
      brightness: 105,
      contrast: 135,
      grayscale: 100,
      saturate: 0,
      sepia: 0,
      invert: 0,
    },
  },
  {
    name: 'High Contrast',
    filters: {
      brightness: 100,
      contrast: 150,
      grayscale: 0,
      saturate: 110,
      sepia: 0,
      invert: 0,
    },
  },
  {
    name: 'Night Boost',
    filters: {
      brightness: 145,
      contrast: 115,
      grayscale: 0,
      saturate: 95,
      sepia: 0,
      invert: 0,
    },
  },
  {
    name: 'Vivid Film',
    filters: {
      brightness: 105,
      contrast: 120,
      grayscale: 0,
      saturate: 140,
      sepia: 0,
      invert: 0,
    },
  },
  {
    name: 'Vintage Sepia',
    filters: {
      brightness: 95,
      contrast: 115,
      grayscale: 20,
      saturate: 90,
      sepia: 75,
      invert: 0,
    },
  },
  {
    name: 'Inverted (X-Ray)',
    filters: {
      brightness: 100,
      contrast: 100,
      grayscale: 100,
      saturate: 100,
      sepia: 0,
      invert: 100,
    },
  },
];

export const VideoFilterPanel: React.FC<VideoFilterPanelProps> = ({
  filters,
  onChange,
  onReset,
  onClose,
}) => {
  const isModified = isFiltersModified(filters);

  const handleSliderChange = (key: keyof VideoFilters, value: number) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  const handleResetSingle = (key: keyof VideoFilters) => {
    onChange({
      ...filters,
      [key]: DEFAULT_FILTERS[key],
    });
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-4 sm:p-5 shadow-2xl text-slate-100 flex flex-col gap-4 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>Post-Processing Filters</span>
              {isModified && (
                <span className="text-[10px] text-blue-400 font-mono">Active</span>
              )}
            </h3>
            <p className="text-xs text-slate-400">Real-time GPU shader video adjustments</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onReset}
            disabled={!isModified}
            className={`px-2.5 py-1 text-xs rounded-md flex items-center gap-1 transition-colors ${
              isModified
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Reset all filters to default"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
            title="Close filter panel"
            aria-label="Close filters"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preset Buttons */}
      <div>
        <span className="text-xs font-medium text-slate-400 mb-2 block flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Quick Filter Presets</span>
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => {
            const isMatch =
              filters.brightness === p.filters.brightness &&
              filters.contrast === p.filters.contrast &&
              filters.grayscale === p.filters.grayscale &&
              filters.saturate === p.filters.saturate &&
              filters.sepia === p.filters.sepia &&
              filters.invert === p.filters.invert;

            return (
              <button
                key={p.name}
                onClick={() => onChange({ ...p.filters })}
                className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                  isMatch
                    ? 'bg-blue-600 border-blue-500 text-white font-medium shadow-xs'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/60 text-slate-300 hover:text-white'
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Individual Sliders: Brightness, Contrast, Grayscale, etc. */}
      <div className="space-y-3 pt-1">
        {/* Brightness */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Brightness</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono tabular-nums text-slate-400">{filters.brightness}%</span>
              {filters.brightness !== DEFAULT_FILTERS.brightness && (
                <button
                  onClick={() => handleResetSingle('brightness')}
                  className="text-slate-500 hover:text-slate-300"
                  title="Reset Brightness"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>
          <input
            type="range"
            min="50"
            max="200"
            step="1"
            value={filters.brightness}
            onChange={(e) => handleSliderChange('brightness', parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-800 accent-blue-500 rounded-lg cursor-pointer"
          />
        </div>

        {/* Contrast */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Contrast className="w-3.5 h-3.5 text-indigo-400" />
              <span>Contrast</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono tabular-nums text-slate-400">{filters.contrast}%</span>
              {filters.contrast !== DEFAULT_FILTERS.contrast && (
                <button
                  onClick={() => handleResetSingle('contrast')}
                  className="text-slate-500 hover:text-slate-300"
                  title="Reset Contrast"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>
          <input
            type="range"
            min="50"
            max="200"
            step="1"
            value={filters.contrast}
            onChange={(e) => handleSliderChange('contrast', parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-800 accent-blue-500 rounded-lg cursor-pointer"
          />
        </div>

        {/* Grayscale */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>Grayscale (B&W)</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono tabular-nums text-slate-400">{filters.grayscale}%</span>
              {filters.grayscale !== DEFAULT_FILTERS.grayscale && (
                <button
                  onClick={() => handleResetSingle('grayscale')}
                  className="text-slate-500 hover:text-slate-300"
                  title="Reset Grayscale"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={filters.grayscale}
            onChange={(e) => handleSliderChange('grayscale', parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-800 accent-blue-500 rounded-lg cursor-pointer"
          />
        </div>

        {/* Saturation */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Saturation</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono tabular-nums text-slate-400">{filters.saturate}%</span>
              {filters.saturate !== DEFAULT_FILTERS.saturate && (
                <button
                  onClick={() => handleResetSingle('saturate')}
                  className="text-slate-500 hover:text-slate-300"
                  title="Reset Saturation"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            step="1"
            value={filters.saturate}
            onChange={(e) => handleSliderChange('saturate', parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-800 accent-blue-500 rounded-lg cursor-pointer"
          />
        </div>

        {/* Sepia */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Sepia Warmth</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono tabular-nums text-slate-400">{filters.sepia}%</span>
              {filters.sepia !== DEFAULT_FILTERS.sepia && (
                <button
                  onClick={() => handleResetSingle('sepia')}
                  className="text-slate-500 hover:text-slate-300"
                  title="Reset Sepia"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={filters.sepia}
            onChange={(e) => handleSliderChange('sepia', parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-800 accent-blue-500 rounded-lg cursor-pointer"
          />
        </div>

        {/* Invert */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Negative / Invert</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono tabular-nums text-slate-400">{filters.invert}%</span>
              {filters.invert !== DEFAULT_FILTERS.invert && (
                <button
                  onClick={() => handleResetSingle('invert')}
                  className="text-slate-500 hover:text-slate-300"
                  title="Reset Invert"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={filters.invert}
            onChange={(e) => handleSliderChange('invert', parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-800 accent-blue-500 rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
