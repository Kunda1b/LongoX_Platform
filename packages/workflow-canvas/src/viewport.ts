export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

export interface GridConfig {
  enabled: boolean;
  size: number;
  type: "dots" | "lines" | "cross";
  snapToGrid: boolean;
  snapThreshold: number;
}

export const DEFAULT_GRID: GridConfig = {
  enabled: true,
  size: 20,
  type: "dots",
  snapToGrid: true,
  snapThreshold: 10,
};

export function snapToGrid(
  position: { x: number; y: number },
  gridSize: number,
): { x: number; y: number } {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  };
}

export function getFitViewTransform(
  boundingBox: { width: number; height: number },
  contentBounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  },
  padding: number = 0.2,
): ViewportState {
  const contentWidth = contentBounds.maxX - contentBounds.minX;
  const contentHeight = contentBounds.maxY - contentBounds.minY;

  if (contentWidth === 0 && contentHeight === 0) {
    return { x: 0, y: 0, zoom: 1 };
  }

  const effectiveWidth = boundingBox.width * (1 - padding);
  const effectiveHeight = boundingBox.height * (1 - padding);

  const zoomX = effectiveWidth / (contentWidth || 1);
  const zoomY = effectiveHeight / (contentHeight || 1);
  const zoom = Math.min(zoomX, zoomY, 2);

  const centerX = (contentBounds.minX + contentBounds.maxX) / 2;
  const centerY = (contentBounds.minY + contentBounds.maxY) / 2;

  return {
    x: boundingBox.width / 2 - centerX * zoom,
    y: boundingBox.height / 2 - centerY * zoom,
    zoom,
  };
}

export function getContentBounds(
  positions: { x: number; y: number }[],
): { minX: number; minY: number; maxX: number; maxY: number } {
  if (positions.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const pos of positions) {
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x);
    maxY = Math.max(maxY, pos.y);
  }

  return { minX, minY, maxX, maxY };
}

export function isInViewport(
  position: { x: number; y: number },
  viewport: ViewportState,
  containerSize: { width: number; height: number },
  margin: number = 200,
): boolean {
  const screenX = position.x * viewport.zoom + viewport.x;
  const screenY = position.y * viewport.zoom + viewport.y;

  return (
    screenX >= -margin &&
    screenX <= containerSize.width + margin &&
    screenY >= -margin &&
    screenY <= containerSize.height + margin
  );
}

export function clampZoom(zoom: number, min: number = 0.1, max: number = 4): number {
  return Math.min(Math.max(zoom, min), max);
}
