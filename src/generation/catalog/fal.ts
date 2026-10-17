import type { ModelEntry } from "./types";

/* Models served by fal.ai. Their ids carry a `fal-` prefix so they never
   collide with the Higgsfield entry for the same family; the submit paths live
   in to-platform.ts next to the other custom maps. */

const fluxAspect = ["1:1", "4:3", "3:4", "16:9", "9:16"] as const;
const ultraAspect = ["21:9", "16:9", "4:3", "3:2", "1:1", "2:3", "3:4", "9:16", "9:21"] as const;

export const falFlux2Pro: ModelEntry = {
  id: "fal-flux-2-pro",
  surface: "image",
  label: "Flux 2 Pro · fal",
  provider: "fal",
  roles: { reference: 8 },
  settings: {
    aspectRatio: { type: "enum", values: fluxAspect, default: "1:1" },
    outputFormat: { type: "enum", values: ["jpeg", "png"], default: "jpeg" },
  },
};

export const falFluxUltra: ModelEntry = {
  id: "fal-flux-1.1-ultra",
  surface: "image",
  label: "Flux 1.1 Pro Ultra · fal",
  provider: "fal",
  roles: { reference: 1 },
  settings: {
    aspectRatio: { type: "enum", values: ultraAspect, default: "16:9" },
    numImages: { type: "range", min: 1, max: 4, default: 1 },
    raw: { type: "boolean", default: false },
    outputFormat: { type: "enum", values: ["jpeg", "png"], default: "jpeg" },
  },
};

const kling3Settings = {
  aspectRatio: { type: "enum", values: ["16:9", "9:16", "1:1"], default: "16:9" },
  duration: { type: "range", min: 3, max: 15, default: 5 },
  generateAudio: { type: "boolean", default: true },
  cfgScale: { type: "range", min: 0, max: 1, default: 0.5, step: 0.01 },
} as const satisfies ModelEntry["settings"];

export const falKling3Pro: ModelEntry = {
  id: "fal-kling-3-pro",
  surface: "video",
  label: "Kling 3.0 Pro · fal",
  provider: "fal",
  roles: { start: 1, end: 1 },
  settings: kling3Settings,
};

export const falKling3Std: ModelEntry = {
  id: "fal-kling-3-std",
  surface: "video",
  label: "Kling 3.0 Standard · fal",
  provider: "fal",
  roles: { start: 1, end: 1 },
  settings: kling3Settings,
};

export const falKling25Turbo: ModelEntry = {
  id: "fal-kling-2.5-turbo",
  surface: "video",
  label: "Kling 2.5 Turbo Pro · fal",
  provider: "fal",
  roles: { start: 1, end: 1 },
  settings: {
    aspectRatio: { type: "enum", values: ["16:9", "9:16", "1:1"], default: "16:9" },
    duration: { type: "range", min: 5, max: 10, default: 5, step: 5 },
    cfgScale: { type: "range", min: 0, max: 1, default: 0.5, step: 0.01 },
  },
};

/* ---------- more fal.ai image models ---------- */

const numImages = { type: "range", min: 1, max: 4, default: 1 } as const;

export const falIdeogram3: ModelEntry = {
  id: "fal-ideogram-3",
  surface: "image",
  label: "Ideogram 3 · fal",
  provider: "fal",
  roles: { reference: 3 },
  settings: {
    aspectRatio: { type: "enum", values: fluxAspect, default: "1:1" },
    renderingSpeed: { type: "enum", values: ["turbo", "balanced", "quality"], default: "balanced" },
    style: { type: "enum", values: ["auto", "general", "realistic", "design"], default: "auto" },
    enhancePrompt: { type: "boolean", default: true },
    numImages,
  },
};

export const falNanoBananaPro: ModelEntry = {
  id: "fal-nano-banana-pro",
  surface: "image",
  label: "Nano Banana Pro · fal",
  provider: "fal",
  roles: { reference: 8 },
  settings: {
    aspectRatio: {
      type: "enum",
      values: ["auto", "1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3", "21:9"],
      default: "1:1",
    },
    resolution: { type: "enum", values: ["1k", "2k", "4k"], default: "1k" },
    outputFormat: { type: "enum", values: ["png", "jpeg", "webp"], default: "png" },
    numImages,
  },
};

export const falSeedream45: ModelEntry = {
  id: "fal-seedream-4.5",
  surface: "image",
  label: "Seedream 4.5 · fal",
  provider: "fal",
  roles: { reference: 8 },
  settings: {
    aspectRatio: { type: "enum", values: fluxAspect, default: "1:1" },
    numImages,
  },
};

export const falImagen4Ultra: ModelEntry = {
  id: "fal-imagen-4-ultra",
  surface: "image",
  label: "Imagen 4 Ultra · fal",
  provider: "fal",
  roles: {},
  settings: {
    aspectRatio: { type: "enum", values: fluxAspect, default: "1:1" },
    resolution: { type: "enum", values: ["1k", "2k"], default: "1k" },
    outputFormat: { type: "enum", values: ["png", "jpeg", "webp"], default: "png" },
    numImages,
  },
};

export const falGptImage15: ModelEntry = {
  id: "fal-gpt-image-1.5",
  surface: "image",
  label: "GPT Image 1.5 · fal",
  provider: "fal",
  roles: { reference: 8 },
  settings: {
    aspectRatio: { type: "enum", values: ["1:1", "3:2", "2:3"], default: "1:1" },
    quality: { type: "enum", values: ["low", "medium", "high"], default: "medium" },
    background: { type: "enum", values: ["auto", "transparent", "opaque"], default: "auto" },
    outputFormat: { type: "enum", values: ["png", "jpeg", "webp"], default: "png" },
    numImages,
  },
};

export const falRecraftV4: ModelEntry = {
  id: "fal-recraft-4",
  surface: "image",
  label: "Recraft V4 · fal",
  provider: "fal",
  roles: {},
  settings: {
    aspectRatio: { type: "enum", values: fluxAspect, default: "1:1" },
  },
};

/* ---------- more fal.ai video models ---------- */

const veoSettings = {
  aspectRatio: { type: "enum", values: ["16:9", "9:16"], default: "16:9" },
  duration: { type: "range", min: 4, max: 8, default: 8, step: 2 },
  resolution: { type: "enum", values: ["720p", "1080p"], default: "720p" },
  generateAudio: { type: "boolean", default: true },
} as const satisfies ModelEntry["settings"];

export const falVeo31: ModelEntry = {
  id: "fal-veo-3.1",
  surface: "video",
  label: "Veo 3.1 · fal",
  provider: "fal",
  roles: { start: 1, end: 1 },
  settings: veoSettings,
};

export const falVeo31Fast: ModelEntry = {
  id: "fal-veo-3.1-fast",
  surface: "video",
  label: "Veo 3.1 Fast · fal",
  provider: "fal",
  roles: { start: 1, end: 1 },
  settings: veoSettings,
};

export const falHailuo23Pro: ModelEntry = {
  id: "fal-hailuo-2.3-pro",
  surface: "video",
  label: "Hailuo 2.3 Pro · fal",
  provider: "fal",
  roles: { start: 1 },
  settings: {
    enhancePrompt: { type: "boolean", default: true },
  },
};

export const falSeedance15Pro: ModelEntry = {
  id: "fal-seedance-1.5-pro",
  surface: "video",
  label: "Seedance 1.5 Pro · fal",
  provider: "fal",
  roles: { start: 1, end: 1 },
  settings: {
    aspectRatio: { type: "enum", values: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"], default: "16:9" },
    duration: { type: "range", min: 4, max: 12, default: 5 },
    resolution: { type: "enum", values: ["480p", "720p", "1080p"], default: "720p" },
    generateAudio: { type: "boolean", default: true },
    cameraFixed: { type: "boolean", default: false },
  },
};

export const falSora2: ModelEntry = {
  id: "fal-sora-2",
  surface: "video",
  label: "Sora 2 · fal",
  provider: "fal",
  roles: { start: 1 },
  settings: {
    aspectRatio: { type: "enum", values: ["16:9", "9:16"], default: "16:9" },
    duration: { type: "range", min: 4, max: 20, default: 8, step: 4 },
  },
};

export const falWan27: ModelEntry = {
  id: "fal-wan-2.7",
  surface: "video",
  label: "Wan 2.7 · fal",
  provider: "fal",
  roles: { start: 1, end: 1 },
  settings: {
    aspectRatio: { type: "enum", values: ["16:9", "9:16", "1:1", "4:3", "3:4"], default: "16:9" },
    duration: { type: "range", min: 2, max: 15, default: 5 },
    resolution: { type: "enum", values: ["720p", "1080p"], default: "720p" },
    enhancePrompt: { type: "boolean", default: true },
  },
};
