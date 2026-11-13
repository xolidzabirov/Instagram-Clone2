/** Instagram's filter names with CSS approximations (the same string feeds CSS and canvas `filter`) */
export const FILTERS = [
  { id: "original", name: "Original", css: "" },
  { id: "aden", name: "Aden", css: "hue-rotate(-20deg) contrast(0.9) saturate(0.85) brightness(1.2)" },
  { id: "clarendon", name: "Clarendon", css: "contrast(1.2) saturate(1.35)" },
  { id: "crema", name: "Crema", css: "sepia(0.25) contrast(0.95) brightness(1.05) saturate(0.9)" },
  { id: "gingham", name: "Gingham", css: "brightness(1.05) hue-rotate(-10deg) contrast(0.92)" },
  { id: "juno", name: "Juno", css: "sepia(0.15) contrast(1.15) brightness(1.1) saturate(1.6)" },
  { id: "lark", name: "Lark", css: "contrast(0.9) brightness(1.15) saturate(1.1)" },
  { id: "ludwig", name: "Ludwig", css: "contrast(1.05) brightness(1.05) saturate(1.2)" },
  { id: "moon", name: "Moon", css: "grayscale(1) contrast(1.1) brightness(1.1)" },
  { id: "perpetua", name: "Perpetua", css: "contrast(1.1) brightness(1.2) saturate(1.1)" },
  { id: "reyes", name: "Reyes", css: "sepia(0.22) brightness(1.1) contrast(0.85) saturate(0.75)" },
  { id: "slumber", name: "Slumber", css: "saturate(0.66) brightness(1.05) sepia(0.1)" },
] as const;

export type FilterId = (typeof FILTERS)[number]["id"];

/** Manual corrections, each -1..1 (vignette 0..1); 0 = untouched */
export interface Adjustments {
  brightness: number;
  contrast: number;
  fade: number;
  saturation: number;
  temperature: number;
  vignette: number;
}

export const NO_ADJUSTMENTS: Adjustments = {
  brightness: 0,
  contrast: 0,
  fade: 0,
  saturation: 0,
  temperature: 0,
  vignette: 0,
};

export const ADJUSTMENT_KEYS = ["brightness", "contrast", "fade", "saturation", "temperature", "vignette"] as const;

/** The full CSS filter for a photo: preset first, then the corrections */
export function filterCss(filter: FilterId, adjust: Adjustments) {
  const preset = FILTERS.find((item) => item.id === filter)?.css ?? "";
  const parts: string[] = [preset];
  if (adjust.brightness) parts.push(`brightness(${1 + adjust.brightness * 0.4})`);
  if (adjust.contrast) parts.push(`contrast(${1 + adjust.contrast * 0.5})`);
  // Fade lifts the blacks: less contrast, a little more light
  if (adjust.fade > 0) parts.push(`contrast(${1 - adjust.fade * 0.35}) brightness(${1 + adjust.fade * 0.08})`);
  if (adjust.saturation) parts.push(`saturate(${1 + adjust.saturation})`);
  if (adjust.temperature > 0) parts.push(`sepia(${adjust.temperature * 0.35}) saturate(${1 + adjust.temperature * 0.2})`);
  if (adjust.temperature < 0) parts.push(`hue-rotate(${adjust.temperature * 25}deg) saturate(${1 - adjust.temperature * 0.1})`);
  return parts.filter(Boolean).join(" ") || "none";
}

/** Dark edges as a CSS background for the preview (the canvas draws the same gradient) */
export function vignetteCss(strength: number) {
  return strength > 0
    ? `radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,${strength * 0.75}) 100%)`
    : undefined;
}
