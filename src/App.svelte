<script lang="ts">
  import { setContext } from "svelte";
  import { Client } from "stoat.js";
  import localforage from "localforage";
  import { STOAT_CTX } from "./lib/contexts/index.js";
  import { createStoatStore } from "./lib/adapter/stoat.svelte.js";
  import { themeStore } from "./lib/theme.svelte.js";
  import { serverConfig } from "./lib/config.js";
  import Login from "./routes/Login.svelte";
  import AppShell from "./routes/AppShell.svelte";

  // Initialise the stoat.js Svelte adapter and expose it via context
  // so every child component can access it via getContext(STOAT_CTX).
  const store = createStoatStore();
  let ctxId = $state<{ value: string | null }>({ value: null });
  setContext(STOAT_CTX, store);

  // Simple hash-based SPA routing — ideal for Tauri (no server-side routing needed).
  let hash = $state(window.location.hash || "#/");

  $effect(() => {
    const onHashChange = () => {
      hash = window.location.hash || "#/";
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  });

  // Apply the active theme to the document root so CSS variables take effect.
  $effect(() => {
    document.documentElement.dataset.theme = themeStore.current;
  });

  // ── Session restore ─────────────────────────────────────────────────────
  // `restoring` stays true while we attempt to reconnect from a stored
  // session. During this window neither the login form nor the app shell
  // is rendered, so there is no flash-of-login-screen on refresh.
  let restoring = $state(true);

  // Called once at module init — not in $effect, which would re-run on
  // reactive state changes and race with an already-connected client.
  restoreSession();

  async function restoreSession() {
    try {
      const stored = await localforage.getItem<string>("stoat_token");
      if (!stored) return;

      let session: { _id: string; token: string; user_id: string } | string =
        stored;
      try {
        const obj = JSON.parse(stored);
        if (obj && typeof obj === "object" && obj._id && obj.token)
          session = obj;
      } catch {
        /* not JSON — use as plain token string */
      }

      const client = new Client(
        { baseURL: import.meta.env.VITE_API_URL },
        serverConfig,
      );
      client.useExistingSession(session);

      await new Promise<void>((resolve, reject) => {
        let settled = false;

        const timeout = setTimeout(() => {
          if (settled) return;
          settled = true;
          client.off("error", onError);
          (client.options as { autoReconnect: boolean }).autoReconnect = false;
          client.events.disconnect();
          reject(new Error("Connection timed out."));
        }, 15_000);

        const onError = (err: unknown) => {
          if (settled) return;
          // Native WebSocket errors (Event objects with isTrusted) are transient
          // socket failures — autoReconnect will retry, so let it.
          if (err != null && typeof err === "object" && "isTrusted" in err)
            return;
          // Application-level errors (InvalidSession, etc.) are unrecoverable.
          // Disable autoReconnect BEFORE disconnecting so the disconnect event
          // does not schedule another retry.
          settled = true;
          clearTimeout(timeout);
          client.off("error", onError);
          (client.options as { autoReconnect: boolean }).autoReconnect = false;
          client.events.disconnect();
          const msg =
            typeof err === "object" && err !== null && "data" in err
              ? JSON.stringify((err as { data: unknown }).data)
              : err instanceof Error
                ? err.message
                : String(err);
          reject(new Error(msg));
        };

        client.once("ready", async () => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          // Stop listening for startup errors — post-connect errors are handled
          // by the app shell (reconnect logic, etc.) not the restore flow.
          client.off("error", onError);

          // Refresh the persisted token in case it rotated.
          const token = client.authenticationHeader[1];
          if (token && client.sessionId && client.user) {
            await localforage.setItem(
              "stoat_token",
              JSON.stringify({
                _id: client.sessionId,
                token,
                user_id: client.user.id,
              }),
            );
          }
          store.connect(client);
          resolve();
        });

        // Persistent listener (not once) so transient socket errors don't
        // consume the listener before the real error or ready event arrives.
        client.on("error", onError);
        client.connect();
      });
    } catch {
      // Stale or invalid session — clear it and fall through to the login form.
      await localforage.removeItem("stoat_token");
    } finally {
      restoring = false;
    }
  }

  // The app shell is shown whenever the client is authenticated.
  const isAuthenticated = $derived(store.client !== null);
</script>

<svelte:window
  onclick={() => {
    if (ctxId.value) {
      ctxId.value = null;
    }
  }}
/>
<div class="h-screen w-screen overflow-hidden bg-q-bg text-q-text">
  {#if restoring}
    <!-- Spinner shown while a stored session is being verified -->
    <div class="flex h-full items-center justify-center">
      <svg
        class="h-8 w-8 animate-spin text-q-muted"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v8H4z"
        />
      </svg>
    </div>
  {:else if !isAuthenticated}
    <Login />
  {:else}
    <AppShell {hash} bind:ctxId />
  {/if}
</div>
