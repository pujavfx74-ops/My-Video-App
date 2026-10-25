export interface VideoItem {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: number;
  duration?: number;
  resolution?: {
    width: number;
    height: number;
  };
  aspectRatio?: string;
  isSample?: boolean;
  addedAt: number;
  thumbnailUrl?: string;
}

export interface ABLoop {
  enabled: boolean;
  start: number | null;
  end: number | null;
}

export interface VideoFilters {
  brightness: number; // in percent (e.g. 100)
  contrast: number;   // in percent (e.g. 100)
  grayscale: number;  // in percent (e.g. 0)
  saturate: number;   // in percent (e.g. 100)
  sepia: number;      // in percent (e.g. 0)
  invert: number;     // in percent (e.g. 0)
}

export const DEFAULT_FILTERS: VideoFilters = {
  brightness: 100,
  contrast: 100,
  grayscale: 0,
  saturate: 100,
  sepia: 0,
  invert: 0,
};

export function getCssFilterString(filters: VideoFilters): string {
  return `brightness(${filters.brightness}%) contrast(${filters.contrast}%) grayscale(${filters.grayscale}%) saturate(${filters.saturate}%) sepia(${filters.sepia}%) invert(${filters.invert}%)`;
}

export function isFiltersModified(filters: VideoFilters): boolean {
  return (
    filters.brightness !== DEFAULT_FILTERS.brightness ||
    filters.contrast !== DEFAULT_FILTERS.contrast ||
    filters.grayscale !== DEFAULT_FILTERS.grayscale ||
    filters.saturate !== DEFAULT_FILTERS.saturate ||
    filters.sepia !== DEFAULT_FILTERS.sepia ||
    filters.invert !== DEFAULT_FILTERS.invert
  );
}
