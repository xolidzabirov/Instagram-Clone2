/**
 * Geometry shared by the live preview (CSS) and the final render (canvas), so what you see while
 * cropping is exactly what gets published. Units: 1 = the frame's width.
 */

export interface Crop {
  /** 1 = the photo just covers the frame; up to 3 */
  zoom: number;
  /** -1..1: how far the photo is moved inside its free range (0 = centered) */
  panX: number;
  panY: number;
}

export interface Placement {
  /** Photo size in frame widths */
  width: number;
  height: number;
  /** Top-left corner in frame widths, relative to the frame's top-left */
  left: number;
  top: number;
  /** Frame height in frame widths (1 / aspect) */
  frameHeight: number;
  /** How far the photo can move each way from the center, in frame widths */
  rangeX: number;
  rangeY: number;
}

export function place(imageWidth: number, imageHeight: number, aspect: number, crop: Crop): Placement {
  const frameHeight = 1 / aspect;
  // "Cover": the smallest scale at which the photo fills the frame both ways
  const cover = Math.max(1 / imageWidth, frameHeight / imageHeight);
  const width = imageWidth * cover * crop.zoom;
  const height = imageHeight * cover * crop.zoom;
  const rangeX = Math.max(0, (width - 1) / 2);
  const rangeY = Math.max(0, (height - frameHeight) / 2);
  return {
    width,
    height,
    left: 0.5 - width / 2 + crop.panX * rangeX,
    top: frameHeight / 2 - height / 2 + crop.panY * rangeY,
    frameHeight,
    rangeX,
    rangeY,
  };
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Moves the photo by a drag of (dx, dy) frame widths; the photo never uncovers the frame */
export function pan(crop: Crop, placement: Placement, dx: number, dy: number): Crop {
  return {
    ...crop,
    panX: placement.rangeX > 0 ? clamp(crop.panX + dx / placement.rangeX, -1, 1) : 0,
    panY: placement.rangeY > 0 ? clamp(crop.panY + dy / placement.rangeY, -1, 1) : 0,
  };
}
