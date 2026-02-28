<script lang="ts">
  import { Client } from "stoat.js";
  import { getContext } from "svelte";
  import localforage from "localforage";
  import { STOAT_CTX } from "../lib/contexts/index.js";
  import type { StoatStore } from "../lib/adapter/stoat.svelte.js";
  import { serverConfig } from "../lib/config.js";

  const store = getContext<StoatStore>(STOAT_CTX);

  // ── Field state ───────────────────────────────────────────────────────────
  let email = $state("");
  let password = $state("");
  let mfaToken = $state("");

  // Track whether a field has been touched (blurred) so we only show
  // validation errors after the user has interacted with it.
  let emailTouched = $state(false);
  let passwordTouched = $state(false);
  let mfaTokenTouched = $state(false);

  let needsMfa = $state(false);
  let serverError = $state<string | null>(null);
  let loading = $state(false);
  // Set to true after a failed submit so all fields show validation state.
  let submitted = $state(false);

  // ── Validation ────────────────────────────────────────────────────────────
  const emailError = $derived.by(() => {
    const v = email.trim();
    if (v.length === 0) return "Required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
      return "Enter a valid email address";
    return null;
  });

  const passwordError = $derived.by(() => {
    if (password.length === 0) return "Required";
    if (password.length < 8) return "Must be at least 8 characters";
    return null;
  });

  const mfaError = $derived.by(() => {
    if (!needsMfa) return null;
    if (mfaToken.length === 0) return "Required";
    if (!/^\d{6}$/.test(mfaToken)) return "Must be a 6-digit code";
    return null;
  });

  const isValid = $derived(
    emailError === null && passwordError === null && mfaError === null,
  );

  // Show a field's error when it has been touched OR after a submit attempt.
  function showError(touched: boolean, err: string | null) {
    return touched || submitted ? err : null;
  }

  // ── Input ring class helper ───────────────────────────────────────────────
  function inputCls(touched: boolean, err: string | null) {
    const visible = showError(touched, err);
    return [
      "w-full rounded-lg bg-q-surface-2 px-4 py-2.5 text-q-text placeholder-q-subtle",
      "outline-none ring-1 transition",
      visible
        ? "ring-red-500 focus:ring-red-400"
        : "ring-transparent focus:ring-blue-500",
    ].join(" ");
  }

  // ── Connect helper ────────────────────────────────────────────────────────
  async function connectWithClient(
    setup: (client: Client) => Promise<void> | void,
  ) {
    const client = new Client({ baseURL: import.meta.env.VITE_API_URL }, serverConfig);
    await setup(client);

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Connection timed out.")),
        30_000,
      );

      const onError = (err: unknown) => {
        clearTimeout(timeout);
        // Kill the autoReconnect loop before rejecting so it can't spin
        // indefinitely with a bad token.
        client.events.disconnect();
        client.off("error", onError);
        const msg =
          typeof err === "object" && err !== null && "data" in err
            ? JSON.stringify((err as { data: unknown }).data)
            : err instanceof Error
              ? err.message
              : String(err);
        reject(new Error(msg));
      };

      client.once("ready", async () => {
        clearTimeout(timeout);
        client.off("error", onError);

        // Persist the full session object so future restores use X-Session-Token.
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
        window.location.hash = "#/app";
        resolve();
      });

      client.once("error", onError);
      client.connect();
    });
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleLogin(e: SubmitEvent) {
    e.preventDefault();
    submitted = true;
    if (!isValid) return;

    loading = true;
    serverError = null;

    try {
      await connectWithClient(async (client) => {
        await client.login({
          email: email.trim().toLowerCase(),
          password,
          ...(mfaToken ? { mfa_response: { totp_code: mfaToken } } : {}),
        });
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.toLowerCase().includes("mfa")) {
        needsMfa = true;
        serverError =
          "MFA token required — enter your 6-digit code and try again.";
      } else {
        serverError =
          message || "Login failed. Check your credentials and try again.";
      }
    } finally {
      loading = false;
    }
  }
</script>

<div class="flex h-full items-center justify-center">
  <div class="w-full max-w-md rounded-2xl bg-q-surface p-8 shadow-2xl">
    <!-- Header -->
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold tracking-tight">Sign in</h1>
      <p class="mt-2 text-sm text-q-muted">Welcome back to Stoat</p>
    </div>

    <form onsubmit={handleLogin} class="space-y-5" novalidate>
      <!-- Email -->
      <div>
        <label
          for="email"
          class="mb-1.5 block text-sm font-medium text-q-text-2"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          bind:value={email}
          onblur={() => (emailTouched = true)}
          class={inputCls(emailTouched, emailError)}
          placeholder="you@example.com"
          autocomplete="email"
          disabled={loading}
        />
        {#if showError(emailTouched, emailError)}
          <p class="mt-1 text-xs text-red-400">
            {showError(emailTouched, emailError)}
          </p>
        {/if}
      </div>

      <!-- Password -->
      <div>
        <label
          for="password"
          class="mb-1.5 block text-sm font-medium text-q-text-2"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          bind:value={password}
          onblur={() => (passwordTouched = true)}
          class={inputCls(passwordTouched, passwordError)}
          placeholder="••••••••"
          autocomplete="current-password"
          disabled={loading}
        />
        {#if showError(passwordTouched, passwordError)}
          <p class="mt-1 text-xs text-red-400">
            {showError(passwordTouched, passwordError)}
          </p>
        {:else if !passwordTouched}
          <p class="mt-1 text-xs text-q-subtle">At least 8 characters</p>
        {/if}
      </div>

      <!-- MFA token (shown after server says MFA is needed) -->
      {#if needsMfa}
        <div>
          <label
            for="mfa"
            class="mb-1.5 block text-sm font-medium text-q-text-2"
          >
            Authenticator code
          </label>
          <input
            id="mfa"
            type="text"
            bind:value={mfaToken}
            onblur={() => (mfaTokenTouched = true)}
            class={inputCls(mfaTokenTouched, mfaError)}
            placeholder="000000"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            disabled={loading}
          />
          {#if showError(mfaTokenTouched, mfaError)}
            <p class="mt-1 text-xs text-red-400">
              {showError(mfaTokenTouched, mfaError)}
            </p>
          {/if}
        </div>
      {/if}

      <!-- Server-side error -->
      {#if serverError}
        <div class="flex items-start gap-2 rounded-lg bg-red-900/40 px-4 py-3">
          <span class="mt-0.5 shrink-0 text-red-400">⚠</span>
          <p class="text-sm text-red-300">{serverError}</p>
        </div>
      {/if}

      <!-- Client-side summary shown only after submit attempt with invalid fields -->
      {#if submitted && !isValid && !serverError}
        <p class="text-xs text-red-400">
          Please fix the errors above before continuing.
        </p>
      {/if}

      <button
        type="submit"
        disabled={loading}
        class="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white
               hover:bg-blue-500 active:bg-blue-700
               disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {#if loading}
          <span class="inline-flex items-center gap-2">
            <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
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
            Signing in…
          </span>
        {:else}
          Sign in
        {/if}
      </button>
    </form>
  </div>
</div>
