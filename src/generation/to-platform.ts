import { getModel } from "./catalog";
import type { GenerationPlane, PlatformPaths } from "./catalog/types";

type Mapped = { path: string; body: Record<string, unknown> };
type Mapper = (plane: GenerationPlane) => Mapped;

const MAP: Record<string, Mapper> = {
  "soul-cinema": (plane) => mapSoul(plane, "higgsfield-ai/soul/cinema"),
  "soul-2": (plane) => mapSoul(plane, "higgsfield-ai/soul/v2/standard"),
  "kling-3-turbo": mapKlingTurbo,
  "kling-3-std": (plane) => mapKling3(plane, "kling-video/v3.0/std"),
  "kling-3-pro": (plane) => mapKling3(plane, "kling-video/v3.0/pro"),
  "kling-3-4k": (plane) => mapKling3(plane, "kling-video/v3.0/4k"),
  "kling-3-motion-std": (plane) => mapKlingMotion(plane, "kling-video/v3/motion-control/std"),
  "kling-3-motion-pro": (plane) => mapKlingMotion(plane, "kling-video/v3/motion-control/pro"),
  "seedance-2": (plane) => mapSeedance(plane, "bytedance/seedance-2.0"),
  "seedance-2-fast": (plane) => mapSeedance(plane, "bytedance/seedance-2.0/fast"),
  "seedance-2-mini": (plane) => mapSeedance(plane, "bytedance/seedance-2.0/mini"),
  "seedance-2.5": (plane) => mapSeedance(plane, "bytedance/seedance-2.5"),
  "seedance-2.5-edit": (plane) => mapSeedanceSource(plane, "bytedance/seedance-2.5/video-edit", false),
  "seedance-2.5-extend": (plane) => mapSeedanceSource(plane, "bytedance/seedance-2.5/video-extend", true),
  "fal-flux-2-pro": mapFalFlux2Pro,
  "fal-flux-1.1-ultra": mapFalFluxUltra,
  "fal-kling-3-pro": (plane) => mapFalKling3(plane, "fal-ai/kling-video/v3/pro"),
  "fal-kling-3-std": (plane) => mapFalKling3(plane, "fal-ai/kling-video/v3/standard"),
  "fal-kling-2.5-turbo": mapFalKling25Turbo,
  "fal-ideogram-3": mapFalIdeogram3,
  "fal-nano-banana-pro": mapFalNanoBananaPro,
  "fal-seedream-4.5": mapFalSeedream45,
  "fal-imagen-4-ultra": mapFalImagen4Ultra,
  "fal-gpt-image-1.5": mapFalGptImage15,
  "fal-recraft-4": (plane) => ({
    path: "fal-ai/recraft/v4/text-to-image",
    body: { prompt: plane.prompt.text, image_size: falImageSize(plane) },
  }),
  "fal-veo-3.1": (plane) => mapFalVeo(plane, "fal-ai/veo3.1"),
  "fal-veo-3.1-fast": (plane) => mapFalVeo(plane, "fal-ai/veo3.1/fast"),
  "fal-hailuo-2.3-pro": mapFalHailuo23Pro,
  "fal-seedance-1.5-pro": mapFalSeedance15Pro,
  "fal-sora-2": mapFalSora2,
  "fal-wan-2.7": mapFalWan27,
};

export function toPlatform(plane: GenerationPlane): Mapped {
  const model = getModel(plane.model);
  const map = MAP[model.id] ?? (model.paths ? (next) => mapByPaths(next, model.paths!) : undefined);
  if (!map) throw new Error(`No platform map for ${plane.model}`);
  return map(plane);
}

function urls(plane: GenerationPlane, role: "start" | "end" | "reference" | "video" | "audio") {
  return (plane.media[role] ?? []).map((item) => item.url);
}

function mapSoul(plane: GenerationPlane, path: string): Mapped {
  return {
    path,
    body: {
      prompt: plane.prompt.text,
      batch_size: Number(plane.settings.batchSize),
      resolution: plane.settings.resolution,
      aspect_ratio: plane.settings.aspectRatio,
      enhance_prompt: plane.settings.enhancePrompt,
    },
  };
}

function mapKlingTurbo(plane: GenerationPlane): Mapped {
  const start = urls(plane, "start")[0];
  return {
    path: start
      ? "kling-video/v3.0-turbo/image-to-video"
      : "kling-video/v3.0-turbo/text-to-video",
    body: {
      prompt: plane.prompt.text,
      duration: plane.settings.duration,
      resolution: plane.settings.resolution,
      ...(start ? { image_url: start } : { aspect_ratio: plane.settings.aspectRatio }),
    },
  };
}

function mapKling3(plane: GenerationPlane, prefix: string): Mapped {
  const start = urls(plane, "start")[0];
  const end = urls(plane, "end")[0];
  const body: Record<string, unknown> = {
    prompt: plane.prompt.text,
    sound: plane.settings.sound ? "on" : "off",
    duration: plane.settings.duration,
    cfg_scale: plane.settings.cfgScale,
    multi_shots: plane.settings.multiShots,
  };
  if (start) {
    body.image_url = start;
    if (end) body.last_image_url = end;
    return { path: `${prefix}/image-to-video`, body };
  }
  body.aspect_ratio = plane.settings.aspectRatio;
  return { path: `${prefix}/text-to-video`, body };
}

function mapKlingMotion(plane: GenerationPlane, path: string): Mapped {
  const start = urls(plane, "start")[0];
  const video = urls(plane, "video")[0];
  return {
    path,
    body: {
      prompt: plane.prompt.text,
      ...(start ? { image_url: start } : {}),
      ...(video ? { video_url: video } : {}),
      keep_original_sound: plane.settings.keepOriginalSound ? "yes" : "no",
      character_orientation: plane.settings.characterOrientation,
    },
  };
}

function mapByPaths(plane: GenerationPlane, spec: PlatformPaths): Mapped {
  const start = urls(plane, "start")[0];
  const end = urls(plane, "end")[0];
  const refs = urls(plane, "reference");
  const videos = urls(plane, "video");
  const body: Record<string, unknown> = {
    prompt: plane.prompt.text,
    ...(plane.settings.aspectRatio ? { aspect_ratio: plane.settings.aspectRatio } : {}),
    ...(plane.settings.resolution ? { resolution: plane.settings.resolution } : {}),
    ...(typeof plane.settings.duration === "number" ? { duration: plane.settings.duration } : {}),
  };
  if (spec.firstLast && (start || end)) {
    return {
      path: spec.firstLast,
      body: {
        ...body,
        ...(start ? { first_frame_url: start } : {}),
        ...(end ? { last_frame_url: end } : {}),
      },
    };
  }
  if (spec.image && start) {
    return {
      path: spec.image,
      body: { ...body, image_url: start, ...(end ? { last_image_url: end } : {}) },
    };
  }
  if (spec.reference && (refs.length || videos.length)) {
    return {
      path: spec.reference,
      body: {
        ...body,
        ...(refs.length ? { image_urls: refs } : {}),
        ...(videos.length ? { video_urls: videos } : {}),
      },
    };
  }
  if (spec.text) {
    return {
      path: spec.text,
      body: refs.length ? { ...body, image_urls: refs } : body,
    };
  }
  if (spec.image) return { path: spec.image, body };
  if (spec.reference) return { path: spec.reference, body };
  if (spec.firstLast) return { path: spec.firstLast, body };
  throw new Error("Model has no platform path");
}

function seedanceBody(plane: GenerationPlane, withDuration: boolean) {
  return {
    prompt: plane.prompt.text,
    resolution: plane.settings.resolution,
    generate_audio: plane.settings.generateAudio,
    ...(withDuration ? { duration: plane.settings.duration } : {}),
    ...(plane.settings.outputFormat ? { output_format: plane.settings.outputFormat } : {}),
  };
}

function mapSeedance(plane: GenerationPlane, prefix: string): Mapped {
  const start = urls(plane, "start")[0];
  const end = urls(plane, "end")[0];
  const refs = urls(plane, "reference");
  const videos = urls(plane, "video");
  const audios = urls(plane, "audio");
  const shared = seedanceBody(plane, true);
  if (start) {
    return {
      path: `${prefix}/image-to-video`,
      body: { ...shared, image_url: start, ...(end ? { end_image_url: end } : {}) },
    };
  }
  if (refs.length || videos.length || audios.length) {
    return {
      path: `${prefix}/reference-to-video`,
      body: {
        ...shared,
        aspect_ratio: plane.settings.aspectRatio,
        ...(refs.length ? { image_urls: refs } : {}),
        ...(videos.length ? { video_urls: videos } : {}),
        ...(audios.length ? { audio_urls: audios } : {}),
      },
    };
  }
  return {
    path: `${prefix}/text-to-video`,
    body: { ...shared, aspect_ratio: plane.settings.aspectRatio },
  };
}

function mapSeedanceSource(plane: GenerationPlane, path: string, withDuration: boolean): Mapped {
  const [video, ...extraVideos] = urls(plane, "video");
  const refs = urls(plane, "reference");
  const audios = urls(plane, "audio");
  return {
    path,
    body: {
      ...seedanceBody(plane, withDuration),
      ...(video ? { video_url: video } : {}),
      ...(refs.length ? { image_urls: refs } : {}),
      ...(extraVideos.length ? { video_urls: extraVideos } : {}),
      ...(audios.length ? { audio_urls: audios } : {}),
    },
  };
}

/* fal.ai — field names follow fal's own schemas, not Higgsfield's. */

const FAL_IMAGE_SIZE: Record<string, string> = {
  "1:1": "square_hd",
  "4:3": "landscape_4_3",
  "3:4": "portrait_4_3",
  "16:9": "landscape_16_9",
  "9:16": "portrait_16_9",
};

function falImageSize(plane: GenerationPlane): string {
  return FAL_IMAGE_SIZE[String(plane.settings.aspectRatio)] ?? "square_hd";
}

function mapFalFlux2Pro(plane: GenerationPlane): Mapped {
  const refs = urls(plane, "reference");
  const body: Record<string, unknown> = {
    prompt: plane.prompt.text,
    image_size: falImageSize(plane),
    output_format: plane.settings.outputFormat,
  };
  if (refs.length) return { path: "fal-ai/flux-2-pro/edit", body: { ...body, image_urls: refs } };
  return { path: "fal-ai/flux-2-pro", body };
}

function mapFalFluxUltra(plane: GenerationPlane): Mapped {
  const ref = urls(plane, "reference")[0];
  return {
    path: "fal-ai/flux-pro/v1.1-ultra",
    body: {
      prompt: plane.prompt.text,
      aspect_ratio: plane.settings.aspectRatio,
      num_images: Number(plane.settings.numImages),
      raw: plane.settings.raw,
      output_format: plane.settings.outputFormat,
      ...(ref ? { image_url: ref } : {}),
    },
  };
}

/* fal's Kling takes the duration as a string. */
function mapFalKling3(plane: GenerationPlane, prefix: string): Mapped {
  const start = urls(plane, "start")[0];
  const end = urls(plane, "end")[0];
  const body: Record<string, unknown> = {
    prompt: plane.prompt.text,
    duration: String(plane.settings.duration),
    generate_audio: plane.settings.generateAudio,
    cfg_scale: plane.settings.cfgScale,
  };
  if (start) {
    return {
      path: `${prefix}/image-to-video`,
      body: { ...body, start_image_url: start, ...(end ? { end_image_url: end } : {}) },
    };
  }
  return { path: `${prefix}/text-to-video`, body: { ...body, aspect_ratio: plane.settings.aspectRatio } };
}

/* Kling 2.5 Turbo only renders 5 or 10 seconds; anything between snaps. */
function mapFalKling25Turbo(plane: GenerationPlane): Mapped {
  const start = urls(plane, "start")[0];
  const end = urls(plane, "end")[0];
  const body: Record<string, unknown> = {
    prompt: plane.prompt.text,
    duration: Number(plane.settings.duration) >= 8 ? "10" : "5",
    cfg_scale: plane.settings.cfgScale,
  };
  if (start) {
    return {
      path: "fal-ai/kling-video/v2.5-turbo/pro/image-to-video",
      body: { ...body, image_url: start, ...(end ? { tail_image_url: end } : {}) },
    };
  }
  return {
    path: "fal-ai/kling-video/v2.5-turbo/pro/text-to-video",
    body: { ...body, aspect_ratio: plane.settings.aspectRatio },
  };
}

/* With references, the image models below switch to their edit endpoint. */

function mapFalIdeogram3(plane: GenerationPlane): Mapped {
  const refs = urls(plane, "reference");
  return {
    path: "fal-ai/ideogram/v3",
    body: {
      prompt: plane.prompt.text,
      image_size: falImageSize(plane),
      rendering_speed: String(plane.settings.renderingSpeed).toUpperCase(),
      style: String(plane.settings.style).toUpperCase(),
      expand_prompt: plane.settings.enhancePrompt,
      num_images: Number(plane.settings.numImages),
      /* Ideogram reads these as style references, not as images to edit. */
      ...(refs.length ? { image_urls: refs } : {}),
    },
  };
}

function mapFalNanoBananaPro(plane: GenerationPlane): Mapped {
  const refs = urls(plane, "reference");
  const body: Record<string, unknown> = {
    prompt: plane.prompt.text,
    aspect_ratio: plane.settings.aspectRatio,
    resolution: String(plane.settings.resolution).toUpperCase(),
    output_format: plane.settings.outputFormat,
    num_images: Number(plane.settings.numImages),
  };
  if (refs.length) return { path: "fal-ai/nano-banana-pro/edit", body: { ...body, image_urls: refs } };
  return { path: "fal-ai/nano-banana-pro", body };
}

function mapFalSeedream45(plane: GenerationPlane): Mapped {
  const refs = urls(plane, "reference");
  const body: Record<string, unknown> = {
    prompt: plane.prompt.text,
    image_size: falImageSize(plane),
    num_images: Number(plane.settings.numImages),
  };
  if (refs.length) return { path: "fal-ai/bytedance/seedream/v4.5/edit", body: { ...body, image_urls: refs } };
  return { path: "fal-ai/bytedance/seedream/v4.5/text-to-image", body };
}

function mapFalImagen4Ultra(plane: GenerationPlane): Mapped {
  return {
    path: "fal-ai/imagen4/preview/ultra",
    body: {
      prompt: plane.prompt.text,
      aspect_ratio: plane.settings.aspectRatio,
      resolution: String(plane.settings.resolution).toUpperCase(),
      output_format: plane.settings.outputFormat,
      num_images: Number(plane.settings.numImages),
    },
  };
}

const GPT_IMAGE_SIZE: Record<string, string> = {
  "1:1": "1024x1024",
  "3:2": "1536x1024",
  "2:3": "1024x1536",
};

function mapFalGptImage15(plane: GenerationPlane): Mapped {
  const refs = urls(plane, "reference");
  const body: Record<string, unknown> = {
    prompt: plane.prompt.text,
    image_size: GPT_IMAGE_SIZE[String(plane.settings.aspectRatio)] ?? "1024x1024",
    quality: plane.settings.quality,
    background: plane.settings.background,
    output_format: plane.settings.outputFormat,
    num_images: Number(plane.settings.numImages),
  };
  if (refs.length) return { path: "fal-ai/gpt-image-1.5/edit", body: { ...body, image_urls: refs } };
  return { path: "fal-ai/gpt-image-1.5", body };
}

/* Veo takes "8s"; a start and an end frame use the first-last endpoint. */
function mapFalVeo(plane: GenerationPlane, prefix: string): Mapped {
  const start = urls(plane, "start")[0];
  const end = urls(plane, "end")[0];
  const body: Record<string, unknown> = {
    prompt: plane.prompt.text,
    duration: `${plane.settings.duration}s`,
    resolution: plane.settings.resolution,
    generate_audio: plane.settings.generateAudio,
    aspect_ratio: plane.settings.aspectRatio,
  };
  if (start && end) {
    return {
      path: `${prefix}/first-last-frame-to-video`,
      body: { ...body, first_frame_url: start, last_frame_url: end },
    };
  }
  if (start) return { path: `${prefix}/image-to-video`, body: { ...body, image_url: start } };
  return { path: prefix, body };
}

function mapFalHailuo23Pro(plane: GenerationPlane): Mapped {
  const start = urls(plane, "start")[0];
  const body = { prompt: plane.prompt.text, prompt_optimizer: plane.settings.enhancePrompt };
  if (start) return { path: "fal-ai/minimax/hailuo-2.3/pro/image-to-video", body: { ...body, image_url: start } };
  return { path: "fal-ai/minimax/hailuo-2.3/pro/text-to-video", body };
}

function mapFalSeedance15Pro(plane: GenerationPlane): Mapped {
  const start = urls(plane, "start")[0];
  const end = urls(plane, "end")[0];
  const body: Record<string, unknown> = {
    prompt: plane.prompt.text,
    aspect_ratio: plane.settings.aspectRatio,
    duration: String(plane.settings.duration),
    resolution: plane.settings.resolution,
    generate_audio: plane.settings.generateAudio,
    camera_fixed: plane.settings.cameraFixed,
  };
  if (start) {
    return {
      path: "fal-ai/bytedance/seedance/v1.5/pro/image-to-video",
      body: { ...body, image_url: start, ...(end ? { end_image_url: end } : {}) },
    };
  }
  return { path: "fal-ai/bytedance/seedance/v1.5/pro/text-to-video", body };
}

/* Sora renders 4, 8, 12, 16 or 20 seconds; anything between snaps down. */
function mapFalSora2(plane: GenerationPlane): Mapped {
  const start = urls(plane, "start")[0];
  const seconds = Math.max(4, Math.floor(Number(plane.settings.duration) / 4) * 4);
  const body: Record<string, unknown> = {
    prompt: plane.prompt.text,
    duration: String(seconds),
    aspect_ratio: plane.settings.aspectRatio,
  };
  if (start) return { path: "fal-ai/sora-2/image-to-video", body: { ...body, image_url: start } };
  return { path: "fal-ai/sora-2/text-to-video", body };
}

function mapFalWan27(plane: GenerationPlane): Mapped {
  const start = urls(plane, "start")[0];
  const end = urls(plane, "end")[0];
  const body: Record<string, unknown> = {
    prompt: plane.prompt.text,
    duration: String(plane.settings.duration),
    resolution: plane.settings.resolution,
    enable_prompt_expansion: plane.settings.enhancePrompt,
  };
  if (start) {
    return {
      path: "fal-ai/wan/v2.7/image-to-video",
      body: { ...body, image_url: start, ...(end ? { end_image_url: end } : {}) },
    };
  }
  return { path: "fal-ai/wan/v2.7/text-to-video", body: { ...body, aspect_ratio: plane.settings.aspectRatio } };
}
