"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { clearPlatformCredentials, savePlatformCredentials } from "@/generation/actions";
import type { Provider } from "@/generation/catalog";
import { PROVIDERS, PROVIDER_LABELS } from "@/generation/credentials";

import { CloseIcon } from "./icons";

const PROVIDER_COPY: Record<Provider, string> = {
  higgsfield:
    "Paste your Higgsfield platform key as id:secret. It stays in an httpOnly cookie and is sent as Authorization: Key id:secret.",
  fal: "Paste your fal.ai key (fal.ai → Dashboard → Keys) as id:secret. It powers every model marked · fal and stays in its own httpOnly cookie.",
};

export function KeyModal({
  configured,
  initialProvider,
  onClose,
  onSaved,
  onCleared,
}: {
  configured: Record<Provider, boolean>;
  initialProvider: Provider;
  onClose: () => void;
  onSaved: (provider: Provider) => void;
  onCleared: (provider: Provider) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [provider, setProvider] = useState<Provider>(initialProvider);
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const held = configured[provider];
  const label = PROVIDER_LABELS[provider];

  useEffect(() => {
    ref.current?.showModal();
    panelRef.current?.focus();
  }, []);

  function pick(next: Provider) {
    setProvider(next);
    setApiKey("");
    setError(null);
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : -1;
    const to = (PROVIDERS.indexOf(provider) + step + PROVIDERS.length) % PROVIDERS.length;
    pick(PROVIDERS[to]!);
    tabsRef.current?.querySelectorAll<HTMLElement>('[role="tab"]')[to]?.focus();
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await savePlatformCredentials({ api_key: apiKey, provider });
      setApiKey("");
      onSaved(provider);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the key");
    } finally {
      setBusy(false);
    }
  }

  async function onClear() {
    setBusy(true);
    setError(null);
    try {
      await clearPlatformCredentials({ provider });
      setApiKey("");
      onCleared(provider);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not remove the key");
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="ohf-keys-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div ref={panelRef} tabIndex={-1} className="ohf-dialog-panel ohf-keys-panel">
        <div className="ohf-keys-head">
          <div>
            <div id="ohf-keys-title" className="ohf-keys-title">
              API keys
            </div>
            <p className="ohf-keys-copy">
              {held
                ? `A ${label} key is saved in this browser. Enter a new id:secret pair to replace it.`
                : PROVIDER_COPY[provider]}
            </p>
          </div>
          <button type="button" className="ohf-icon-btn" aria-label="Close" onClick={onClose}>
            <CloseIcon size={13} />
          </button>
        </div>

        <div
          className="ohf-assets-tabs ohf-keys-tabs"
          role="tablist"
          aria-label="Provider"
          ref={tabsRef}
          onKeyDown={onTabKeyDown}
        >
          {PROVIDERS.map((id) => {
            const active = id === provider;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                className="ohf-assets-tab"
                onClick={() => pick(id)}
              >
                {PROVIDER_LABELS[id]}
                <span className="ohf-assets-tab-count">{configured[id] ? "Saved" : "—"}</span>
              </button>
            );
          })}
        </div>

        <form className="ohf-keys-form" onSubmit={(event) => void onSubmit(event)}>
          <label className="ohf-field">
            <div className="ohf-field-label">{label} key</div>
            <input
              className="ohf-input ohf-input--mono"
              name="api_key"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
            />
          </label>

          {error && (
            <div className="ohf-alert" role="alert">
              <span className="ohf-alert-text">{error}</span>
            </div>
          )}

          <div className="ohf-keys-actions">
            {held && (
              <button type="button" className="ohf-btn-quiet" disabled={busy} onClick={() => void onClear()}>
                Remove key
              </button>
            )}
            <button type="submit" className="ohf-keys-save" disabled={busy || !apiKey.trim()}>
              {busy ? "Saving…" : held ? "Replace key" : "Save key"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
