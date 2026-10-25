import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize2,
  Minimize2,
  RotateCcw,
  RotateCw,
  Repeat,
  Camera,
  PictureInPicture,
  SkipBack,
  SkipForward,
  FolderOpen,
  Info,
  Sliders,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { VideoItem, ABLoop, VideoFilters, getCssFilterString, isFiltersModified } from '../types.ts';
import { formatTime } from '../utils/format.ts';

interface VideoPlayerProps {
  video: VideoItem | null;
  filters: VideoFilters;
  onToggleFilters: () => void;
  isFiltersOpen: boolean;
  onChooseVideo: () => void;
  onOpenDetails: () => void;
  onSelectSample: (video: VideoItem) => void;
  sampleVideos: VideoItem[];
  onVideoLoadedMetadata: (meta: { duration: number; width: number; height: number }) => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  filters,
  onToggleFilters,
  isFiltersOpen,
  onChooseVideo,
  onOpenDetails,
  onSelectSample,
  sampleVideos,
  onVideoLoadedMetadata,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('my_video_app_volume');
    return saved !== null ? parseFloat(saved) : 1;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [abLoop, setAbLoop] = useState<ABLoop>({ enabled: false, start: null, end: null });
  const [showAbControls, setShowAbControls] = useState(false);
  const [flashFeedback, setFlashFeedback] = useState<{ icon: string; text: string } | null>(null);

  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  const triggerFlash = (icon: string, text: string) => {
    setFlashFeedback({ icon, text });
    setTimeout(() => {
      setFlashFeedback(null);
    }, 600);
  };

  // Sync volume with video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
      videoRef.current.muted = isMuted;
    }
    localStorage.setItem('my_video_app_volume', volume.toString());
  }, [volume, isMuted]);

  // Handle Fullscreen state change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Reset state when video changes
  useEffect(() => {
    setCurrentTime(0);
    setBufferedEnd(0);
    setIsPlaying(false);
    setAbLoop({ enabled: false, start: null, end: null });

    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [video?.url]);

  // Auto-hide controls logic
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    if (isPlaying) {
      hideControlsTimer.current = setTimeout(() => {
        if (!showSpeedMenu && !showAbControls) {
          setShowControls(false);
        }
      }, 2500);
    }
  }, [isPlaying, showSpeedMenu, showAbControls]);

  const handleMouseMove = () => {
    resetControlsTimer();
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        triggerFlash('play', 'Play');
      }).catch((e) => console.log('Autoplay deferred:', e));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      triggerFlash('pause', 'Pause');
    }
  };

  const handleSeek = (time: number) => {
    if (!videoRef.current) return;
    const clamped = Math.max(0, Math.min(time, duration));
    videoRef.current.currentTime = clamped;
    setCurrentTime(clamped);
  };

  const skipTime = (offset: number) => {
    if (!videoRef.current) return;
    const newTime = videoRef.current.currentTime + offset;
    handleSeek(newTime);
    triggerFlash(offset > 0 ? 'forward' : 'backward', `${offset > 0 ? '+' : ''}${offset}s`);
  };

  const stepFrame = (frames: number) => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    setIsPlaying(false);
    // approx 1 frame at 30fps = 0.0333s
    const frameTime = 1 / 30;
    handleSeek(videoRef.current.currentTime + frames * frameTime);
    triggerFlash('step', `${frames > 0 ? '+1' : '-1'} Frame`);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    setCurrentTime(cur);

    // Buffer range
    if (videoRef.current.buffered.length > 0) {
      setBufferedEnd(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
    }

    // A-B loop check
    if (abLoop.enabled && abLoop.end !== null && cur >= abLoop.end) {
      if (abLoop.start !== null) {
        videoRef.current.currentTime = abLoop.start;
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    const w = videoRef.current.videoWidth;
    const h = videoRef.current.videoHeight;
    setDuration(dur);
    onVideoLoadedMetadata({ duration: dur, width: w, height: h });

    // Emulate Android VideoView: start on prepared
    videoRef.current.play().then(() => {
      setIsPlaying(true);
    }).catch(() => {
      // User interaction needed in some browsers
      setIsPlaying(false);
    });
  };

  const handleProgressBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration === 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPosition(pos * 100);
    setHoverTime(pos * duration);

    if (isScrubbing) {
      handleSeek(pos * duration);
    }
  };

  const handleProgressBarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration === 0) return;
    setIsScrubbing(true);
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    handleSeek(pos * duration);

    const onMouseUp = () => {
      setIsScrubbing(false);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mouseup', onMouseUp);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error('Exit fullscreen failed:', err);
      });
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('PiP error:', err);
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth || 1280;
    canvas.height = v.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.filter = getCssFilterString(filters);
      ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      const cleanName = (video?.name || 'video').replace(/\.[^/.]+$/, '');
      const timeStr = formatTime(currentTime).replace(/:/g, '-');
      a.download = `${cleanName}_snapshot_${timeStr}.png`;
      a.click();
      triggerFlash('snapshot', 'Frame captured & downloaded');
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setShowSpeedMenu(false);
      triggerFlash('speed', `${rate}x Speed`);
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.code) {
        case 'Space':
        case 'KeyK':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipTime(-5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipTime(5);
          break;
        case 'KeyJ':
          e.preventDefault();
          skipTime(-10);
          break;
        case 'KeyL':
          e.preventDefault();
          skipTime(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume((v) => Math.min(1, Math.round((v + 0.1) * 10) / 10));
          setIsMuted(false);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume((v) => Math.max(0, Math.round((v - 0.1) * 10) / 10));
          break;
        case 'KeyM':
          e.preventDefault();
          setIsMuted((m) => !m);
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyP':
          e.preventDefault();
          togglePiP();
          break;
        case 'KeyE':
          e.preventDefault();
          onToggleFilters();
          break;
        case 'KeyC':
          e.preventDefault();
          takeSnapshot();
          break;
        case 'Comma':
          e.preventDefault();
          stepFrame(-1);
          break;
        case 'Period':
          e.preventDefault();
          stepFrame(1);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, volume, isMuted, currentTime, duration, video, filters, onToggleFilters]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (bufferedEnd / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative w-full aspect-video max-h-[75vh] bg-slate-950 rounded-xl overflow-hidden shadow-2xl border border-slate-800/80 flex items-center justify-center select-none group"
    >
      {video ? (
        <>
          <video
            ref={videoRef}
            src={video.url}
            style={{
              filter: getCssFilterString(filters),
            }}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => {
              if (isLooping) {
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                  videoRef.current.play();
                }
              } else if (hasNext && onNext) {
                onNext();
              } else {
                setIsPlaying(false);
              }
            }}
            onClick={togglePlay}
            className="w-full h-full object-contain cursor-pointer transition-[filter] duration-75"
            playsInline
          />

          {/* Center Click Flash Feedback */}
          {flashFeedback && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
              <div className="bg-slate-900/80 backdrop-blur-md text-white px-5 py-3 rounded-lg border border-slate-700/60 shadow-xl flex items-center gap-3 animate-in fade-in zoom-in-95 duration-150">
                <span className="text-sm font-medium">{flashFeedback.text}</span>
              </div>
            </div>
          )}

          {/* Big Center Play Icon overlay when paused and controls visible */}
          {!isPlaying && showControls && (
            <button
              onClick={togglePlay}
              className="absolute z-20 w-16 h-16 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
              title="Play Video"
              aria-label="Play Video"
            >
              <Play className="w-8 h-8 fill-current ml-1" />
            </button>
          )}

          {/* Top Bar inside Player (Video title + actions) */}
          <div
            className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between z-20 transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 pr-4">
              <span className="font-semibold text-sm text-slate-100 truncate max-w-md">
                {video.name}
              </span>
              {video.resolution && (
                <span className="text-xs text-slate-400 font-mono shrink-0 hidden sm:inline">
                  {video.resolution.width}×{video.resolution.height}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onToggleFilters}
                className={`p-1.5 rounded-md transition-colors ${
                  isFiltersOpen || isFiltersModified(filters)
                    ? 'text-blue-400 bg-blue-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="Post-Processing Filters (Brightness, Contrast, Grayscale - Key: E)"
                aria-label="Post-Processing Filters"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenDetails}
                className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Video Info & Inspector"
                aria-label="Video Info"
              >
                <Info className="w-4 h-4" />
              </button>
              <button
                onClick={takeSnapshot}
                className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Capture Frame (C)"
                aria-label="Capture Frame"
              >
                <Camera className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowAbControls((s) => !s)}
                className={`p-1.5 rounded-md transition-colors ${
                  abLoop.enabled || showAbControls
                    ? 'text-blue-400 bg-blue-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="A-B Repeat Loop"
                aria-label="A-B Repeat Loop"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* A-B Loop Sub-bar */}
          {showAbControls && showControls && (
            <div className="absolute top-14 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/70 p-2.5 rounded-lg z-20 flex items-center gap-3 text-xs shadow-xl animate-in fade-in duration-150">
              <span className="font-medium text-slate-300">A-B Repeat:</span>
              <button
                onClick={() => {
                  setAbLoop((prev) => ({ ...prev, start: currentTime, enabled: prev.end !== null }));
                  triggerFlash('a', `Point A set to ${formatTime(currentTime)}`);
                }}
                className={`px-2 py-1 rounded transition-colors ${
                  abLoop.start !== null ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Set A ({abLoop.start !== null ? formatTime(abLoop.start) : 'Start'})
              </button>
              <button
                onClick={() => {
                  setAbLoop((prev) => ({
                    ...prev,
                    end: currentTime,
                    enabled: prev.start !== null && currentTime > prev.start,
                  }));
                  triggerFlash('b', `Point B set to ${formatTime(currentTime)}`);
                }}
                className={`px-2 py-1 rounded transition-colors ${
                  abLoop.end !== null ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Set B ({abLoop.end !== null ? formatTime(abLoop.end) : 'End'})
              </button>
              {(abLoop.start !== null || abLoop.end !== null) && (
                <button
                  onClick={() => setAbLoop({ enabled: false, start: null, end: null })}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Bottom Player Controls */}
          <div
            className={`absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20 transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Timeline Progress Bar */}
            <div
              ref={progressBarRef}
              onMouseMove={handleProgressBarMouseMove}
              onMouseDown={handleProgressBarMouseDown}
              onMouseLeave={() => setHoverTime(null)}
              className="relative w-full h-2 group/scrubber cursor-pointer flex items-center py-2"
            >
              {/* Background Track */}
              <div className="w-full h-1.5 bg-slate-700/60 rounded-full overflow-hidden relative group-hover/scrubber:h-2.5 transition-all">
                {/* Buffered Track */}
                <div
                  className="absolute top-0 bottom-0 left-0 bg-slate-500/40 rounded-full"
                  style={{ width: `${bufferedPercent}%` }}
                />
                {/* Played Track */}
                <div
                  className="absolute top-0 bottom-0 left-0 bg-blue-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* A-B range indicator on scrubber */}
              {duration > 0 && abLoop.start !== null && abLoop.end !== null && (
                <div
                  className="absolute top-0 bottom-0 bg-amber-400/30 border-l border-r border-amber-400 pointer-events-none"
                  style={{
                    left: `${(abLoop.start / duration) * 100}%`,
                    width: `${((abLoop.end - abLoop.start) / duration) * 100}%`,
                  }}
                />
              )}

              {/* Thumb Scrubber Knob */}
              <div
                className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-md -translate-x-1/2 opacity-0 group-hover/scrubber:opacity-100 transition-opacity pointer-events-none"
                style={{ left: `${progressPercent}%` }}
              />

              {/* Hover Tooltip */}
              {hoverTime !== null && (
                <div
                  className="absolute bottom-5 -translate-x-1/2 bg-slate-900 border border-slate-700 text-white text-[11px] font-mono px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap"
                  style={{ left: `${hoverPosition}%` }}
                >
                  {formatTime(hoverTime)}
                </div>
              )}
            </div>

            {/* Bottom Row Control Buttons */}
            <div className="flex items-center justify-between gap-2 mt-1">
              {/* Left Group: Play/Pause, Skip, Time, Volume */}
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={togglePlay}
                  className="p-2 text-white hover:text-blue-400 transition-colors focus:outline-none"
                  title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                </button>

                {hasPrev && (
                  <button
                    onClick={onPrev}
                    className="p-1.5 text-slate-300 hover:text-white transition-colors"
                    title="Previous Video"
                    aria-label="Previous Video"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => skipTime(-10)}
                  className="p-1.5 text-slate-300 hover:text-white transition-colors"
                  title="Rewind 10s (J)"
                  aria-label="Rewind 10 seconds"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => skipTime(10)}
                  className="p-1.5 text-slate-300 hover:text-white transition-colors"
                  title="Forward 10s (L)"
                  aria-label="Forward 10 seconds"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                {hasNext && (
                  <button
                    onClick={onNext}
                    className="p-1.5 text-slate-300 hover:text-white transition-colors"
                    title="Next Video"
                    aria-label="Next Video"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                )}

                {/* Volume Slider & Mute */}
                <div className="flex items-center group/vol gap-1 ml-1">
                  <button
                    onClick={() => setIsMuted((m) => !m)}
                    className="p-1.5 text-slate-300 hover:text-white transition-colors"
                    title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    ) : volume < 0.5 ? (
                      <Volume1 className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setVolume(val);
                      if (val > 0) setIsMuted(false);
                    }}
                    className="w-16 sm:w-20 h-1 bg-slate-700 accent-blue-500 rounded-lg cursor-pointer"
                    aria-label="Volume Slider"
                  />
                </div>

                {/* Time Display */}
                <div className="text-xs font-mono text-slate-300 ml-2 whitespace-nowrap">
                  <span>{formatTime(currentTime)}</span>
                  <span className="text-slate-500 mx-1">/</span>
                  <span className="text-slate-400">{formatTime(duration)}</span>
                </div>
              </div>

              {/* Right Group: Speed, Loop, PiP, Fullscreen */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Playback Rate Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowSpeedMenu((s) => !s)}
                    className="px-2 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors whitespace-nowrap"
                    title="Playback Speed"
                  >
                    {playbackRate}x
                  </button>
                  {showSpeedMenu && (
                    <div className="absolute bottom-9 right-0 bg-slate-900 border border-slate-700 py-1 rounded-lg shadow-2xl z-30 min-w-24 flex flex-col">
                      {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => changePlaybackRate(rate)}
                          className={`px-3 py-1 text-xs text-left hover:bg-slate-800 transition-colors ${
                            playbackRate === rate ? 'text-blue-400 font-bold bg-blue-500/10' : 'text-slate-300'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Loop Toggle */}
                <button
                  onClick={() => {
                    setIsLooping((l) => !l);
                    triggerFlash('loop', !isLooping ? 'Loop Enabled' : 'Loop Disabled');
                  }}
                  className={`p-1.5 rounded transition-colors ${
                    isLooping ? 'text-blue-400 bg-blue-500/20' : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                  title={isLooping ? 'Disable Loop' : 'Enable Loop'}
                  aria-label="Toggle Loop"
                >
                  <Repeat className="w-4 h-4" />
                </button>

                {/* PiP */}
                {document.pictureInPictureEnabled && (
                  <button
                    onClick={togglePiP}
                    className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-white/10 transition-colors hidden sm:block"
                    title="Picture-in-Picture (P)"
                    aria-label="Picture-in-Picture"
                  >
                    <PictureInPicture className="w-4 h-4" />
                  </button>
                )}

                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
                  aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Empty State: Matching Android App intent "Choose Video" */
        <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mb-4 text-blue-400">
            <FolderOpen className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">No Video Selected</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Select a video from your local device or choose a demo clip to start instant playback with high-resolution controls.
          </p>

          <button
            onClick={onChooseVideo}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-lg hover:shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Choose Video</span>
          </button>

          <div className="mt-6 pt-6 border-t border-slate-800/80 w-full">
            <p className="text-xs text-slate-400 mb-3 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Or try a quick demo video:</span>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {sampleVideos.slice(0, 3).map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => onSelectSample(sample)}
                  className="px-2.5 py-1.5 text-xs bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-md transition-colors"
                >
                  {sample.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
