import type { Provider } from "./catalog/types";

export const PLATFORM_KEY_COOKIE = "api_key";

export const PROVIDERS: readonly Provider[] = ["higgsfield", "fal"];

export const PROVIDER_LABELS: Record<Provider, string> = {
  higgsfield: "Higgsfield",
  fal: "fal.ai",
};

/** One httpOnly cookie per provider. Higgsfield keeps the original name so a
    key saved before fal.ai existed is still read. */
export const PROVIDER_KEY_COOKIES: Record<Provider, string> = {
  higgsfield: PLATFORM_KEY_COOKIE,
  fal: "fal_key",
};

export const PLATFORM_KEY_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

export class MissingCredentialsError extends Error {
  readonly provider: Provider;

  /* The message is what crosses the server action boundary, so it names the
     provider: the studio reads it to open the key modal on the right tab. */
  constructor(provider: Provider = "higgsfield") {
    super(provider === "higgsfield" ? "Missing platform key" : `Missing platform key for ${PROVIDER_LABELS[provider]}`);
    this.name = "MissingCredentialsError";
    this.provider = provider;
  }
}

export function isProvider(value: unknown): value is Provider {
  return typeof value === "string" && (PROVIDERS as readonly string[]).includes(value);
}

export function parseProvider(value: unknown): Provider {
  if (value === undefined) return "higgsfield";
  if (!isProvider(value)) throw new Error("Unknown provider");
  return value;
}

export function encodeCredentials(apiKey: string): string {
  return JSON.stringify({ apiKey });
}

export function decodeCredentials(raw: string | undefined): { apiKey: string } | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const apiKey = (parsed as { apiKey?: unknown }).apiKey;
    if (typeof apiKey !== "string" || !apiKey.trim()) return null;
    return { apiKey: requireIdAndSecret(apiKey.trim()) };
  } catch {
    return null;
  }
}

export function parseCredentialInput(data: unknown): { apiKey: string; provider: Provider } {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Enter an API key");
  }
  const record = data as { apiKey?: unknown; api_key?: unknown; provider?: unknown };
  const provider = parseProvider(record.provider);
  const apiKey = record.apiKey ?? record.api_key;
  if (typeof apiKey !== "string" || !apiKey.trim()) throw new Error("Enter an API key");
  return { apiKey: requireIdAndSecret(apiKey.trim()), provider };
}

/** Both platforms take the same header: `Key id:secret`. */
export function toAuthorizationHeader(apiKey: string): string {
  return `Key ${requireIdAndSecret(apiKey)}`;
}

function requireIdAndSecret(apiKey: string): string {
  const colon = apiKey.indexOf(":");
  if (colon <= 0 || colon === apiKey.length - 1) {
    throw new Error("API key must be id:secret");
  }
  return apiKey;
}
