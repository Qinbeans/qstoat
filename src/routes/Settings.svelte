<script lang="ts">
  import { getContext } from "svelte";
  import localforage from "localforage";
  import { STOAT_CTX } from "../lib/contexts/index.js";
  import type { StoatStore } from "../lib/adapter/stoat.svelte.js";
  import { themeStore } from "../lib/theme.svelte.js";
  import Icon from "../components/ui/Icon.svelte";
  import Banner from "../components/ui/Banner.svelte";

  const store = getContext<StoatStore>(STOAT_CTX);

  // ── Section navigation ────────────────────────────────────────────────────
  type Section = "profile" | "account" | "appearance" | "notifications";
  let activeSection = $state<Section>("profile");

  const sections: { id: Section; label: string; icon: string }[] = [
    { id: "profile", label: "My Profile", icon: "person" },
    { id: "account", label: "Account", icon: "lock" },
    { id: "appearance", label: "Appearance", icon: "palette" },
    { id: "notifications", label: "Notifications", icon: "notifications" },
  ];

  // ── User data ─────────────────────────────────────────────────────────────
  const self = $derived(store.self);

  // ── Profile (banner + bio) — fetched once on ready, stored in context ─────
  const userProfile = $derived(store.selfProfile);

  const bannerSrc = $derived(
    userProfile?.animatedBannerURL ??
      userProfile?.bannerURL ??
      userProfile?.banner?.originalUrl ??
      userProfile?.banner?.previewUrl,
  );

  // ── Logout ────────────────────────────────────────────────────────────────
  async function logout() {
    await localforage.removeItem("stoat_token");
    store.disconnect();
    window.location.hash = "#/";
  }

  // ── Appearance ────────────────────────────────────────────────────────────
  const themes = [
    { id: "dark", label: "Dark" },
    { id: "light", label: "Light" },
    { id: "system", label: "System" },
  ] as const;
</script>

<div class="flex h-full bg-q-bg text-q-text">
  <!-- ── Left nav ─────────────────────────────────────────────────── -->
  <aside class="flex w-56 shrink-0 flex-col bg-q-surface">
    <!-- Back button -->
    <div class="p-3">
      <a
        href="#/app"
        class="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-q-muted
               hover:bg-q-surface-2 hover:text-q-text transition"
      >
        <Icon name="arrow_back" size={16} />
        Back
      </a>
    </div>

    <div class="px-3 pb-1">
      <p
        class="px-3 text-xs font-semibold uppercase tracking-wider text-q-subtle"
      >
        Settings
      </p>
    </div>

    <nav class="flex-1 space-y-0.5 px-3" aria-label="Settings sections">
      {#each sections as section}
        <button
          onclick={() => (activeSection = section.id)}
          class={[
            "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition",
            activeSection === section.id
              ? "bg-q-surface-3 text-q-text"
              : "text-q-muted hover:bg-q-surface-2 hover:text-q-text",
          ].join(" ")}
        >
          <Icon name={section.icon} size={18} />
          <span>{section.label}</span>
        </button>
      {/each}
    </nav>

    <!-- Logout at the bottom -->
    <div class="p-3 border-t border-q-border">
      <button
        onclick={logout}
        class="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm
               text-red-400 hover:bg-red-900/30 hover:text-red-300 transition"
      >
        <Icon name="logout" size={18} />
        <span>Log Out</span>
      </button>
    </div>
  </aside>

  <!-- ── Content area ──────────────────────────────────────────────── -->
  <main class="flex-1 overflow-y-auto px-8 py-10 max-w-2xl">
    {#if activeSection === "profile"}
      <h1 class="mb-6 text-xl font-bold">My Profile</h1>

      <!-- Profile card: banner + overlapping avatar + info -->
      <div class="mb-6 rounded-xl bg-q-surface overflow-hidden">
        <Banner
          {bannerSrc}
          avatarSrc={self?.animatedAvatarURL ?? self?.avatarURL}
          name={self?.displayName ?? self?.username ?? "?"}
          bannerClass="h-full bg-cover bg-center"
          avatarClass="absolute bottom-2 left-2 w-20 rounded-full bg-[#ffffff]/20"
          class="relative h-32"
        />

        <!-- Info — top padding makes room for the avatar overhang -->
        <div class="px-5 pb-5 pt-8">
          {#if self}
            <p class="text-lg font-bold leading-tight">
              {self.displayName ?? self.username}
            </p>
            <p class="text-sm text-q-muted">
              @{self.username}{#if self.discriminator}#{self.discriminator}{/if}
            </p>
            <p class="mt-1 text-xs text-q-subtle">
              Member since {self.createdAt.toLocaleDateString()}
            </p>
            {#if userProfile?.content}
              <p class="mt-3 text-sm text-q-text-2 whitespace-pre-wrap">
                {userProfile.content}
              </p>
            {/if}
          {:else}
            <div class="space-y-2">
              <div class="h-4 w-32 rounded bg-q-surface-2 animate-pulse"></div>
              <div class="h-3 w-24 rounded bg-q-surface-2 animate-pulse"></div>
            </div>
          {/if}
        </div>
      </div>

      <div class="space-y-4">
        <div>
          <span class="mb-1.5 block text-sm font-medium text-q-text-2"
            >Display Name</span
          >
          <input
            type="text"
            value={self?.displayName ?? ""}
            placeholder={self?.username ?? ""}
            disabled
            class="w-full rounded-lg bg-q-surface-2 px-4 py-2.5 text-q-text placeholder-q-subtle
                   outline-none ring-1 ring-transparent opacity-60 cursor-not-allowed"
          />
          <p class="mt-1 text-xs text-q-subtle">Profile editing coming soon.</p>
        </div>

        <div>
          <span class="mb-1.5 block text-sm font-medium text-q-text-2"
            >Username</span
          >
          <input
            type="text"
            value={self
              ? `${self.username}${self.discriminator ? "#" + self.discriminator : ""}`
              : ""}
            disabled
            class="w-full rounded-lg bg-q-surface-2 px-4 py-2.5 text-q-text placeholder-q-subtle
                   outline-none ring-1 ring-transparent opacity-60 cursor-not-allowed"
          />
        </div>
      </div>
    {:else if activeSection === "account"}
      <h1 class="mb-6 text-xl font-bold">Account</h1>

      <div class="space-y-4">
        <div class="rounded-xl bg-q-surface p-5">
          <h2
            class="mb-3 text-sm font-semibold uppercase tracking-wider text-q-text-2"
          >
            Security
          </h2>
          <div class="space-y-3">
            {#each [["Change Password", "password"], ["Two-Factor Authentication", "two_factor_auth"]] as [label, icon]}
              <button
                disabled
                class="flex w-full items-center gap-3 rounded-lg bg-q-surface-2 px-4 py-3 text-sm
                       text-q-muted opacity-60 cursor-not-allowed"
              >
                <Icon name={icon} size={18} class="shrink-0" />
                <span class="flex-1 text-left">{label}</span>
                <span class="text-xs text-q-subtle">Coming soon</span>
              </button>
            {/each}
          </div>
        </div>

        <div class="rounded-xl bg-q-surface p-5">
          <h2
            class="mb-3 text-sm font-semibold uppercase tracking-wider text-q-text-2"
          >
            Sessions
          </h2>
          <button
            disabled
            class="flex w-full items-center gap-3 rounded-lg bg-q-surface-2 px-4 py-3 text-sm
                   text-q-muted opacity-60 cursor-not-allowed"
          >
            <Icon name="devices" size={18} class="shrink-0" />
            <span class="flex-1 text-left">Manage Active Sessions</span>
            <span class="text-xs text-q-subtle">Coming soon</span>
          </button>
        </div>

        <div class="rounded-xl border border-red-900/60 bg-red-950/20 p-5">
          <h2
            class="mb-3 text-sm font-semibold uppercase tracking-wider text-red-400"
          >
            Danger Zone
          </h2>
          <button
            onclick={logout}
            class="flex w-full items-center justify-center gap-2 rounded-lg bg-red-700
                   px-4 py-2.5 text-sm font-semibold text-white
                   hover:bg-red-600 active:bg-red-800 transition"
          >
            <Icon name="logout" size={18} />
            Log Out of All Devices
          </button>
        </div>
      </div>
    {:else if activeSection === "appearance"}
      <h1 class="mb-6 text-xl font-bold">Appearance</h1>

      <div class="rounded-xl bg-q-surface p-5">
        <h2
          class="mb-4 text-sm font-semibold uppercase tracking-wider text-q-text-2"
        >
          Theme
        </h2>
        <div class="grid grid-cols-3 gap-3">
          {#each themes as theme}
            <button
              onclick={() => themeStore.set(theme.id)}
              class={[
                "rounded-lg border-2 px-4 py-3 text-sm font-medium transition",
                themeStore.current === theme.id
                  ? "border-blue-500 bg-blue-600/20 text-blue-300"
                  : "border-q-border bg-q-surface-2 text-q-text-2 hover:border-q-surface-3",
              ].join(" ")}
            >
              {theme.label}
            </button>
          {/each}
        </div>
      </div>
    {:else if activeSection === "notifications"}
      <h1 class="mb-6 text-xl font-bold">Notifications</h1>

      <div class="rounded-xl bg-q-surface p-5">
        <p class="text-sm text-q-subtle">
          Notification preferences coming in a future update.
        </p>
      </div>
    {/if}
  </main>
</div>
