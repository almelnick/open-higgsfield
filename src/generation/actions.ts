"use server";

import { cookies } from "next/headers";

import { getModel, parseSettings, providerOf } from "./catalog";
import type { GenerationPlane, Provider } from "./catalog/types";
import {
  MissingCredentialsError,
  PLATFORM_KEY_COOKIE_OPTIONS,
  PROVIDERS,
  PROVIDER_KEY_COOKIES,
  decodeCredentials,
  encodeCredentials,
  parseCredentialInput,
  parseProvider,
} from "./credentials";
import { createFalClient, isFalRequestId } from "./fal";
import { createPlatformClient } from "./platform";
import type { StatusResult } from "./platform";
import { toPlatform } from "./to-platform";

type Client = ReturnType<typeof createPlatformClient>;

export async function savePlatformCredentials(data: unknown) {
  const { apiKey, provider } = parseCredentialInput(data);
  const jar = await cookies();
  jar.set(PROVIDER_KEY_COOKIES[provider], encodeCredentials(apiKey), PLATFORM_KEY_COOKIE_OPTIONS);
}

export async function clearPlatformCredentials(data?: unknown) {
  const provider = parseProvider(data === undefined ? undefined : asObject(data, "Invalid provider").provider);
  const jar = await cookies();
  jar.set(PROVIDER_KEY_COOKIES[provider], "", { ...PLATFORM_KEY_COOKIE_OPTIONS, maxAge: 0 });
}

/** Which providers hold a key in this browser. */
export async function hasPlatformCredentials(): Promise<Record<Provider, boolean>> {
  const entries = await Promise.all(
    PROVIDERS.map(async (provider) => [provider, (await readStoredCredentials(provider)) !== null] as const),
  );
  return Object.fromEntries(entries) as Record<Provider, boolean>;
}

export async function submitGeneration(plane: GenerationPlane) {
  const model = getModel(plane.model);
  const parsed: GenerationPlane = {
    ...plane,
    settings: parseSettings(model, plane.settings),
  };
  const { path, body } = toPlatform(parsed);
  return (await clientFor(providerOf(model))).submit(path, body);
}

/** Every request in flight, answered in one round trip. Next dispatches server
    actions one at a time per client, so a poll per run would queue ahead of the
    next submit — the fan-out belongs on this side of the call, where it is
    genuinely parallel. */
export async function getGenerationStatuses(data: unknown): Promise<StatusResult[]> {
  const requestIds = parseRequestIds(data);
  /* One client per provider in the round, built on first use: a missing key
     fails only the runs that need it. */
  const clients = new Map<Provider, Promise<Client>>();
  const clientOf = (provider: Provider) => {
    let client = clients.get(provider);
    if (!client) {
      client = clientFor(provider);
      clients.set(provider, client);
    }
    return client;
  };
  return Promise.all(
    requestIds.map(async (requestId): Promise<StatusResult> => {
      try {
        const client = await clientOf(isFalRequestId(requestId) ? "fal" : "higgsfield");
        return { requestId, status: await client.status(requestId) };
      } catch (caught) {
        return { requestId, error: caught instanceof Error ? caught.message : String(caught) };
      }
    }),
  );
}

async function readStoredCredentials(provider: Provider) {
  const jar = await cookies();
  return decodeCredentials(jar.get(PROVIDER_KEY_COOKIES[provider])?.value);
}

async function clientFor(provider: Provider): Promise<Client> {
  const stored = await readStoredCredentials(provider);
  if (!stored) throw new MissingCredentialsError(provider);
  if (provider === "fal") return createFalClient(stored);
  const baseUrl = process.env.HF_API_BASE_URL;
  if (!baseUrl) throw new Error("Missing HF_API_BASE_URL");
  return createPlatformClient({ ...stored, baseUrl });
}

function parseRequestIds(data: unknown): string[] {
  const payload = asObject(data, "Invalid status payload");
  const requestIds = payload.requestIds;
  if (!Array.isArray(requestIds) || requestIds.length === 0) {
    throw new Error("Invalid request ids");
  }
  return requestIds.map((requestId) => {
    if (typeof requestId !== "string" || !requestId) throw new Error("Invalid request id");
    return requestId;
  });
}

function asObject(data: unknown, message: string): Record<string, unknown> {
  if (data === null || typeof data !== "object" || Array.isArray(data)) throw new Error(message);
  return data as Record<string, unknown>;
}
