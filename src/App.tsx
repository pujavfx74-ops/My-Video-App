import React, { useState, useRef, useEffect } from 'react';
import {
  FolderOpen,
  Film,
  Keyboard,
  Info,
  Link as LinkIcon,
  UploadCloud,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { VideoItem, VideoFilters, DEFAULT_FILTERS, isFiltersModified } from './types.ts';
import { SAMPLE_VIDEOS } from './data/sampleVideos.ts';
import { VideoPlayer } from './components/VideoPlayer.tsx';
import { VideoFilterPanel } from './components/VideoFilterPanel.tsx';
import { PlaylistSidebar } from './components/PlaylistSidebar.tsx';
import { VideoDetailsModal } from './components/VideoDetailsModal.tsx';
import { ShortcutsModal } from './components/ShortcutsModal.tsx';
import { UrlInputModal } from './components/UrlInputModal.tsx';
import { calculateAspectRatio } from './utils/format.ts';

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [playlist, setPlaylist] = useState<VideoItem[]>(() => {
    return [...SAMPLE_VIDEOS];
  });
  const [activeVideoId, setActiveVideoId] = useState<string | null>(SAMPLE_VIDEOS[0]?.id || null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [filters, setFilters] = useState<VideoFilters>(() => {
    const saved = localStorage.getItem('my_video_app_filters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback to default
      }
    }
    return { ...DEFAULT_FILTERS };
  });

  const activeVideo = playlist.find((v) => v.id === activeVideoId) || null;

  useEffect(() => {
    localStorage.setItem('my_video_app_filters', JSON.stringify(filters));
  }, [filters]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleChooseVideo = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const processVideoFiles = (files: FileList | File[]) => {
    const newItems: VideoItem[] = [];

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('video/') || /\.(mp4|webm|ogg|mov|mkv|m4v|avi)$/i.test(file.name)) {
        const objectUrl = URL.createObjectURL(file);
        const item: VideoItem = {
          id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          url: objectUrl,
          type: file.type || 'video/mp4',
          size: file.size,
          duration: undefined,
          isSample: false,
          addedAt: Date.now(),
        };
        newItems.push(item);
      }
    });

    if (newItems.length > 0) {
      setPlaylist((prev) => [...newItems, ...prev]);
      setActiveVideoId(newItems[0].id);
      showToast(`Loaded ${newItems.length} video${newItems.length > 1 ? 's' : ''}`);
    } else {
      showToast('Please select valid video files.');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processVideoFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processVideoFiles(e.dataTransfer.files);
    }
  };

  const handleLoadedMetadata = ({ duration, width, height }: { duration: number; width: number; height: number }) => {
    if (!activeVideoId) return;
    setPlaylist((prev) =>
      prev.map((v) =>
        v.id === activeVideoId
          ? {
              ...v,
              duration,
              resolution: { width, height },
              aspectRatio: calculateAspectRatio(width, height),
            }
          : v
      )
    );
  };

  const handleRemoveVideo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPlaylist((prev) => {
      const updated = prev.filter((v) => v.id !== id);
      if (activeVideoId === id) {
        setActiveVideoId(updated[0]?.id || null);
      }
      return updated;
    });
  };

  const handleClearList = () => {
    setPlaylist([]);
    setActiveVideoId(null);
  };

  const handleAddUrlVideo = (url: string, name: string) => {
    const item: VideoItem = {
      id: `stream-${Date.now()}`,
      name,
      url,
      type: 'video/mp4',
      addedAt: Date.now(),
      isSample: false,
    };
    setPlaylist((prev) => [item, ...prev]);
    setActiveVideoId(item.id);
    showToast(`Loaded stream: ${name}`);
  };

  const currentIndex = playlist.findIndex((v) => v.id === activeVideoId);
  const hasNext = currentIndex >= 0 && currentIndex < playlist.length - 1;
  const hasPrev = currentIndex > 0;

  const handleNext = () => {
    if (hasNext) {
      setActiveVideoId(playlist[currentIndex + 1].id);
    }
  };

  const handlePrev = () => {
    if (hasPrev) {
      setActiveVideoId(playlist[currentIndex - 1].id);
    }
  };

  // Global key to open file chooser on 'O', filters on 'E', or shortcuts on '?'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        handleChooseVideo();
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        setIsFilterPanelOpen((prev) => !prev);
      } else if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const hasFilterActive = isFiltersModified(filters);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative selection:bg-blue-600 selection:text-white"
    >
      {/* Hidden file input supporting Android Intent.ACTION_OPEN_DOCUMENT equivalence */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-blue-900/40 backdrop-blur-xs border-4 border-dashed border-blue-500 rounded-2xl m-4 flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-100">
          <UploadCloud className="w-16 h-16 text-blue-400 mb-3 animate-bounce" />
          <p className="text-xl font-bold text-white">Drop video files here</p>
          <p className="text-sm text-blue-200 mt-1">Ready to play instantly in My Video App</p>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-800 text-white px-4 py-2.5 rounded-lg border border-slate-700 shadow-2xl flex items-center gap-2 text-xs font-medium animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar adhering to the Top Bar Contract (3 zones separated by gap-8) */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        {/* Zone 1: Brand wordmark in single-element */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
            <Film className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            My Video App
          </span>
        </div>

        {/* Zone 2: Concise navigation links with hover states */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => setIsFilterPanelOpen((prev) => !prev)}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              isFilterPanelOpen || hasFilterActive ? 'text-blue-400 font-semibold' : 'hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters {hasFilterActive ? '•' : ''}</span>
          </button>
          <button
            onClick={() => setIsShortcutsOpen(true)}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Keyboard className="w-4 h-4 text-slate-400" />
            <span>Shortcuts</span>
          </button>
          <button
            onClick={() => setIsUrlModalOpen(true)}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <LinkIcon className="w-4 h-4 text-slate-400" />
            <span>Stream URL</span>
          </button>
          {activeVideo && (
            <button
              onClick={() => setIsDetailsOpen(true)}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <Info className="w-4 h-4 text-slate-400" />
              <span>Video Details</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Primary Action "Choose Video" (faithful to Android MainActivity) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleChooseVideo}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg shadow-md hover:shadow-blue-600/20 transition-all flex items-center gap-2 whitespace-nowrap shrink-0"
            title="Open video from computer or phone (Key: O)"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Choose Video</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Upper Hero Split: Video Player + Playlist / Info Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Video Viewport (8 cols on desktop) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <VideoPlayer
              video={activeVideo}
              filters={filters}
              onToggleFilters={() => setIsFilterPanelOpen((prev) => !prev)}
              isFiltersOpen={isFilterPanelOpen}
              onChooseVideo={handleChooseVideo}
              onOpenDetails={() => setIsDetailsOpen(true)}
              onSelectSample={(sample) => {
                if (!playlist.some((p) => p.id === sample.id)) {
                  setPlaylist((prev) => [sample, ...prev]);
                }
                setActiveVideoId(sample.id);
              }}
              sampleVideos={SAMPLE_VIDEOS}
              onVideoLoadedMetadata={handleLoadedMetadata}
              onNext={handleNext}
              onPrev={handlePrev}
              hasNext={hasNext}
              hasPrev={hasPrev}
            />

            {/* Post-Processing Filter Panel (collapsible) */}
            {isFilterPanelOpen && (
              <VideoFilterPanel
                filters={filters}
                onChange={(f) => setFilters(f)}
                onReset={() => {
                  setFilters({ ...DEFAULT_FILTERS });
                  showToast('Filters reset to default');
                }}
                onClose={() => setIsFilterPanelOpen(false)}
              />
            )}

            {/* Video Meta Info Bar below player */}
            {activeVideo && (
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-base font-semibold text-slate-100 truncate">
                    {activeVideo.name}
                  </h1>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span>{activeVideo.isSample ? 'Demo clip' : 'Local file'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeVideo.type || 'video/mp4'}</span>
                    {activeVideo.resolution && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {activeVideo.resolution.width}×{activeVideo.resolution.height}
                        </span>
                      </>
                    )}
                    {activeVideo.aspectRatio && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{activeVideo.aspectRatio}</span>
                      </>
                    )}
                    {hasFilterActive && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-blue-400 font-medium">Filtered</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsFilterPanelOpen((prev) => !prev)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                      isFilterPanelOpen || hasFilterActive
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                    title="Toggle Filter Panel (Key: E)"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                    <span>Filter Panel</span>
                  </button>
                  <button
                    onClick={() => setIsDetailsOpen(true)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                    <span>Properties</span>
                  </button>
                  <button
                    onClick={handleChooseVideo}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span>Choose Another</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Library & Queue Sidebar (4 cols on desktop) */}
          <div className="lg:col-span-4 h-full">
            <PlaylistSidebar
              videos={playlist}
              activeVideoId={activeVideoId}
              onSelectVideo={(v) => setActiveVideoId(v.id)}
              onRemoveVideo={handleRemoveVideo}
              onClearList={handleClearList}
              onChooseVideo={handleChooseVideo}
              onOpenUrlModal={() => setIsUrlModalOpen(true)}
            />
          </div>
        </div>

        {/* Feature Highlights / Tips Footer Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-900">
          <div className="p-4 bg-slate-900/40 border border-slate-800/60 rounded-xl">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1">
              GPU Post-Processing
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time hardware-accelerated brightness, contrast, grayscale (B&W), saturation, and warmth adjustments applied live during playback and snapshots.
            </p>
          </div>

          <div className="p-4 bg-slate-900/40 border border-slate-800/60 rounded-xl">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1">
              Instant Local Playback
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Open MP4, WebM, MKV, or MOV files straight from your disk. Files remain 100% private in your browser without uploading to external servers.
            </p>
          </div>

          <div className="p-4 bg-slate-900/40 border border-slate-800/60 rounded-xl">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1">
              Keyboard Navigation
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Use Space for play/pause, E for filters, J/L for 10-second jumps, arrow keys for 5s seeking or volume, and F for full-screen theater viewing.
            </p>
          </div>
        </div>
      </main>

      {/* Modals */}
      <VideoDetailsModal
        video={activeVideo}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <UrlInputModal
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
        onSubmit={handleAddUrlVideo}
      />
    </div>
  );
}
