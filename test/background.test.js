import { afterEach, describe, expect, it, vi } from "vitest";

const BYPASS_KEY = "markdownReaderBypassTabs";

function createStorageArea(initialValue = {}) {
  const state = {
    [BYPASS_KEY]: { ...initialValue }
  };

  return {
    get: (key) => Promise.resolve({ [key]: state[key] || {} }),
    set: (payload) => {
      state[BYPASS_KEY] = payload[BYPASS_KEY] || {};
      return Promise.resolve();
    },
    readState: () => ({ ...state[BYPASS_KEY] })
  };
}

async function loadBackground(overrides = {}) {
  let capturedListener;
  const storageArea = overrides.storageArea || createStorageArea();

  globalThis.chrome = {
    storage: {
      session: storageArea
    },
    runtime: {
      onMessage: {
        addListener(listener) {
          capturedListener = listener;
        }
      }
    }
  };

  vi.resetModules();
  await import("../background.js");

  return { listener: capturedListener, storageArea };
}

function invokeListener(listener, message, sender) {
  return new Promise((resolve) => {
    const result = listener(message, sender, (response) => {
      resolve({ response, result });
    });

    if (!result) {
      resolve({ response: undefined, result });
    }
  });
}

afterEach(() => {
  delete globalThis.chrome;
});

describe("background bypass map", () => {
  it("ignores messages without valid type and tab id", async () => {
    const { listener, storageArea } = await loadBackground();
    const output = await invokeListener(listener, { type: "unknown" }, { tab: { id: 1 } });

    expect(output.result).toBeUndefined();
    expect(storageArea.readState()).toEqual({});
  });

  it("stores bypass flag for tab when requested", async () => {
    const { listener, storageArea } = await loadBackground();
    const output = await invokeListener(
      listener,
      { type: "markdown-reader-set-bypass" },
      { tab: { id: 7 } }
    );

    expect(output.result).toBe(true);
    expect(output.response).toEqual({ ok: true });
    expect(storageArea.readState()).toEqual({ "7": true });
  });

  it("consumes bypass once and clears state", async () => {
    const storageArea = createStorageArea({ "9": true });
    const { listener } = await loadBackground({ storageArea });

    const first = await invokeListener(
      listener,
      { type: "markdown-reader-consume-bypass" },
      { tab: { id: 9 } }
    );
    const second = await invokeListener(
      listener,
      { type: "markdown-reader-consume-bypass" },
      { tab: { id: 9 } }
    );

    expect(first.result).toBe(true);
    expect(first.response).toEqual({ bypass: true });
    expect(second.response).toEqual({ bypass: false });
    expect(storageArea.readState()).toEqual({});
  });

  it("returns safe fallback response when storage fails", async () => {
    const failingStorage = {
      get: () => Promise.reject(new Error("boom")),
      set: () => Promise.resolve()
    };
    const { listener } = await loadBackground({ storageArea: failingStorage });

    const output = await invokeListener(
      listener,
      { type: "markdown-reader-consume-bypass" },
      { tab: { id: 3 } }
    );

    expect(output.result).toBe(true);
    expect(output.response).toEqual({ bypass: false });
  });

  it("returns failure when set-bypass write rejects", async () => {
    const failingStorage = {
      get: () => Promise.resolve({ [BYPASS_KEY]: {} }),
      set: () => Promise.reject(new Error("write failed"))
    };
    const { listener } = await loadBackground({ storageArea: failingStorage });

    const output = await invokeListener(
      listener,
      { type: "markdown-reader-set-bypass" },
      { tab: { id: 5 } }
    );

    expect(output.result).toBe(true);
    expect(output.response).toEqual({ ok: false });
  });
});
