import { toAuthorizationHeader } from "./credentials";
import { PlatformError, isModelId } from "./platform";
import type { GenerationStatus, QueuedGeneration } from "./platform";

export const FAL_QUEUE_URL = "https://queue.fal.run";

const PREFIX = "fal:";
const APP = /^[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9._-]*$/i;
const REQUEST = /^[a-z0-9][a-z0-9-]*$/i;

export type FalClientOptions = {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof fetch;
};

/** fal answers status and results under the app (`owner/alias`), not under the
    full endpoint path, while the studio keeps nothing but a request id. The app
    rides inside that id, so a poll — even one resumed from history — finds its
    way back without a second store. */
export function isFalRequestId(requestId: string): boolean {
  return requestId.startsWith(PREFIX);
}

function packRequestId(endpoint: string, requestId: string): string {
  const [owner, alias] = endpoint.split("/");
  return `${PREFIX}${owner}/${alias}:${requestId}`;
}

function unpackRequestId(packed: string): { app: string; id: string } {
  const rest = packed.slice(PREFIX.length);
  const colon = rest.lastIndexOf(":");
  const app = rest.slice(0, colon);
  const id = rest.slice(colon + 1);
  if (colon <= 0 || !APP.test(app) || !REQUEST.test(id)) {
    throw new PlatformError(400, { detail: "Invalid fal.ai request id" });
  }
  return { app, id };
}

export function createFalClient(options: FalClientOptions) {
  const baseUrl = (options.baseUrl ?? FAL_QUEUE_URL).replace(/\/$/, "");
  const fetchImpl = options.fetch ?? fetch;
  const auth = toAuthorizationHeader(options.apiKey);

  async function send(method: "GET" | "POST", path: string, body?: Record<string, unknown>) {
    const url = `${baseUrl}${path}`;
    console.info("[fal] request", { method, url, body: body ?? null });
    const response = await fetchImpl(url, {
      method,
      headers: {
        Authorization: auth,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const payload = await readJson(response);
    console.info("[fal] response", { method, url, status: response.status, body: payload });
    return { ok: response.ok, status: response.status, payload };
  }

  return {
    async submit(endpoint: string, input: Record<string, unknown>): Promise<QueuedGeneration> {
      if (!isModelId(endpoint) || endpoint.split("/").length < 2) {
        throw new PlatformError(400, { detail: "Invalid model" });
      }
      const sent = await send("POST", `/${endpoint}`, input);
      if (!sent.ok) throw new PlatformError(sent.status, { detail: falMessage(sent.status, sent.payload) });
      const data = asRecord(sent.payload);
      const requestId = stringField(data, "request_id");
      if (!requestId || !REQUEST.test(requestId)) {
        throw new PlatformError(502, { detail: "fal.ai response missing request_id" });
      }
      return {
        status: "queued",
        requestId: packRequestId(endpoint, requestId),
        statusUrl: stringField(data, "status_url") ?? "",
        cancelUrl: stringField(data, "cancel_url") ?? "",
      };
    },

    /* fal's status never carries the output: once it reads COMPLETED the result
       is a second read, and a run that failed answers that read with an error. */
    async status(packed: string): Promise<GenerationStatus> {
      const { app, id } = unpackRequestId(packed);
      const base = `/${app}/requests/${encodeURIComponent(id)}`;
      const polled = await send("GET", `${base}/status`);
      if (!polled.ok) throw new PlatformError(polled.status, { detail: falMessage(polled.status, polled.payload) });
      const state = stringField(asRecord(polled.payload), "status") ?? "unknown";
      if (state !== "COMPLETED") return { status: state.toLowerCase(), requestId: packed };

      const result = await send("GET", base);
      if (!result.ok) {
        return { status: "failed", requestId: packed, error: falMessage(result.status, result.payload) };
      }
      return mapResult(packed, result.payload);
    },
  };
}

function mapResult(requestId: string, payload: unknown): GenerationStatus {
  const data = asRecord(payload);
  const images = Array.isArray(data.images)
    ? data.images.flatMap((item) => {
        const url = asRecord(item).url;
        return typeof url === "string" ? [{ url }] : [];
      })
    : [];
  const videoUrl = asRecord(data.video).url;
  /* Flux answers a flagged image with a blank one rather than an error. */
  const flags = Array.isArray(data.has_nsfw_concepts) ? data.has_nsfw_concepts : [];
  if (images.length > 0 && flags.length === images.length && flags.every((flag) => flag === true)) {
    return { status: "nsfw", requestId };
  }
  return {
    status: "completed",
    requestId,
    ...(images.length ? { images } : {}),
    ...(typeof videoUrl === "string" ? { video: { url: videoUrl } } : {}),
  };
}

/* fal reports errors as `detail`: a string, or a validation list of `{ msg }`. */
function falMessage(status: number, payload: unknown): string {
  const detail = asRecord(payload).detail;
  if (typeof detail === "string" && detail) return detail;
  if (Array.isArray(detail)) {
    const messages = detail.flatMap((item) => {
      const msg = asRecord(item).msg;
      return typeof msg === "string" && msg ? [msg] : [];
    });
    if (messages.length) return messages.join("; ");
  }
  if (typeof payload === "string" && payload) return payload;
  return `fal.ai request failed (${status})`;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringField(value: Record<string, unknown>, key: string): string | undefined {
  const field = value[key];
  return typeof field === "string" ? field : undefined;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}
