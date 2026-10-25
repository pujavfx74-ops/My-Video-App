import React from 'react';
import { VideoItem } from '../types.ts';
import { formatTime, formatFileSize } from '../utils/format.ts';
import { Play, Trash2, Video, Plus, Link, Sparkles } from 'lucide-react';

interface PlaylistSidebarProps {
  videos: VideoItem[];
  activeVideoId: string | null;
  onSelectVideo: (video: VideoItem) => void;
  onRemoveVideo: (id: string, e: React.MouseEvent) => void;
  onClearList: () => void;
  onChooseVideo: () => void;
  onOpenUrlModal: () => void;
}

export const PlaylistSidebar: React.FC<PlaylistSidebarProps> = ({
  videos,
  activeVideoId,
  onSelectVideo,
  onRemoveVideo,
  onClearList,
  onChooseVideo,
  onOpenUrlModal,
}) => {
  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 flex flex-col h-full shadow-lg">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Video Library</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {videos.length} {videos.length === 1 ? 'item' : 'items'} loaded
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onChooseVideo}
            className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 transition-colors"
            title="Choose Video File"
            aria-label="Add local file"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenUrlModal}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Load Video via URL"
            aria-label="Load video URL"
          >
            <Link className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-2 max-h-[520px]">
        {videos.length === 0 ? (
          <div className="text-center py-10 px-4">
            <Video className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No videos in your library.</p>
            <button
              onClick={onChooseVideo}
              className="mt-3 text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              Choose a video file
            </button>
          </div>
        ) : (
          videos.map((item) => {
            const isActive = item.id === activeVideoId;
            return (
              <div
                key={item.id}
                onClick={() => onSelectVideo(item)}
                className={`group flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  isActive
                    ? 'bg-blue-950/40 border-blue-600/50 shadow-sm'
                    : 'bg-slate-800/40 border-slate-800/60 hover:bg-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div
                  className={`w-12 h-10 rounded shrink-0 flex items-center justify-center transition-colors ${
                    isActive ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {isActive ? <Play className="w-4 h-4 fill-current" /> : <Video className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-xs font-semibold truncate ${
                        isActive ? 'text-blue-200' : 'text-slate-200 group-hover:text-white'
                      }`}
                    >
                      {item.name}
                    </span>
                    <button
                      onClick={(e) => onRemoveVideo(item.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 transition-opacity"
                      title="Remove from library"
                      aria-label="Remove video"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Clean unboxed metadata with bullet separators per zero-pill discipline */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                    {item.duration ? <span>{formatTime(item.duration)}</span> : null}
                    {item.duration && item.size ? <span aria-hidden="true">·</span> : null}
                    {item.size ? <span>{formatFileSize(item.size)}</span> : null}
                    {item.isSample && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-400 flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" /> Demo
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {videos.length > 0 && (
        <div className="pt-3 mt-auto border-t border-slate-800/80 flex items-center justify-between text-xs">
          <button
            onClick={onClearList}
            className="text-slate-500 hover:text-rose-400 transition-colors"
          >
            Clear library
          </button>
          <span className="text-slate-500 font-mono text-[11px]">
            {videos.filter((v) => !v.isSample).length} local
          </span>
        </div>
      )}
    </div>
  );
};
