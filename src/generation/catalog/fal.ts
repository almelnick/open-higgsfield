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
