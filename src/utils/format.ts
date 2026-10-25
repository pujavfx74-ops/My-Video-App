export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const totalSeconds = Math.floor(seconds);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const paddedMins = mins.toString().padStart(2, '0');
  const paddedSecs = secs.toString().padStart(2, '0');

  if (hrs > 0) {
    const paddedHrs = hrs.toString().padStart(2, '0');
    return `${paddedHrs}:${paddedMins}:${paddedSecs}`;
  }
  return `${paddedMins}:${paddedSecs}`;
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return 'Unknown size';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function calculateAspectRatio(width: number, height: number): string {
  if (!width || !height) return 'Unknown';
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const ratioW = width / divisor;
  const ratioH = height / divisor;

  // Approximate standard ratios
  const decimal = width / height;
  if (Math.abs(decimal - 16 / 9) < 0.05) return '16:9 (Widescreen)';
  if (Math.abs(decimal - 4 / 3) < 0.05) return '4:3 (Standard)';
  if (Math.abs(decimal - 21 / 9) < 0.05) return '21:9 (Ultrawide)';
  if (Math.abs(decimal - 1) < 0.02) return '1:1 (Square)';
  if (Math.abs(decimal - 9 / 16) < 0.05) return '9:16 (Vertical)';

  return `${ratioW}:${ratioH}`;
}
