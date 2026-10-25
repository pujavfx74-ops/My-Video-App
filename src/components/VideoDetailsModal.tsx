import React from 'react';
import { X, Film } from 'lucide-react';
import { VideoItem } from '../types.ts';
import { formatTime, formatFileSize } from '../utils/format.ts';

interface VideoDetailsModalProps {
  video: VideoItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const VideoDetailsModal: React.FC<VideoDetailsModalProps> = ({ video, isOpen, onClose }) => {
  if (!isOpen || !video) return null;

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
          <Film className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-slate-100">Video Properties</h2>
        </div>

        <div className="space-y-3 text-sm">
          <div className="border-b border-slate-800 pb-2">
            <span className="text-xs text-slate-400 block mb-0.5">Title / File</span>
            <span className="text-slate-200 font-medium break-all">{video.name}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-2">
            <div>
              <span className="text-xs text-slate-400 block mb-0.5">Duration</span>
              <span className="text-slate-200 font-mono tabular-nums">
                {video.duration ? formatTime(video.duration) : 'Calculating...'}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block mb-0.5">File Size</span>
              <span className="text-slate-200 font-mono tabular-nums">
                {formatFileSize(video.size)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-2">
            <div>
              <span className="text-xs text-slate-400 block mb-0.5">Resolution</span>
              <span className="text-slate-200 font-mono tabular-nums">
                {video.resolution ? `${video.resolution.width} × ${video.resolution.height}` : 'Detecting...'}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block mb-0.5">Aspect Ratio</span>
              <span className="text-slate-200">
                {video.aspectRatio || 'Standard'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-2">
            <div>
              <span className="text-xs text-slate-400 block mb-0.5">Format / MIME</span>
              <span className="text-slate-200 font-mono text-xs">{video.type || 'video/mp4'}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block mb-0.5">Origin</span>
              <span className="text-slate-200">
                {video.isSample ? 'Demo Sample' : 'Local File'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
