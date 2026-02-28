<script lang="ts">
  import type { StoatStore } from "../../lib/adapter/stoat.svelte.js";
  import Messages from "../app/channels/text/Messages.svelte";

  type Route =
    | { type: "home"; serverId: null; channelId: null }
    | { type: "server"; serverId: string; channelId: string | null }
    | { type: "dm"; channelId: string; serverId: null };

  interface Props {
    store: StoatStore;
    route: Route;
    ctxId: { value: string | null };
  }
  let { store, route, ctxId = $bindable() }: Props = $props();

  const channel = $derived(
    route.channelId ? (store.channels.get(route.channelId) ?? null) : null,
  );
</script>

<main class="flex flex-1 flex-col overflow-hidden">
  {#if route.type === "home"}
    <div class="flex flex-1 items-center justify-center">
      <div class="text-center">
        <p class="text-4xl">💬</p>
        <h1 class="mt-4 text-xl font-semibold">Welcome to Stoat</h1>
        <p class="mt-2 text-sm text-q-subtle">
          Pick a server or channel to get started.
        </p>
      </div>
    </div>
  {:else if route.type === "server" && !route.channelId}
    <div class="flex flex-1 items-center justify-center">
      <p class="text-sm text-q-subtle">Select a channel</p>
    </div>
  {:else if channel}
    <!-- Channel header -->
    <header
      class="flex h-12 items-center gap-2 border-b border-q-border px-4 shadow-sm shrink-0"
    >
      <span class="text-q-muted">#</span>
      <h2 class="font-semibold">{channel.name}</h2>
      {#if channel.description}
        <span class="ml-2 hidden text-sm text-q-subtle sm:block truncate">
          — {channel.description}
        </span>
      {/if}
    </header>

    <!-- Message list (delegated to Messages component) -->
    <div class="flex-1 overflow-hidden">
      <Messages {store} {channel} bind:ctxId />
    </div>

    <!-- Message composer placeholder -->
    <div class="shrink-0 px-4 pb-4 pt-2">
      <div
        class="flex items-center gap-2 rounded-lg bg-q-surface-2 px-4 py-2.5"
      >
        <input
          type="text"
          placeholder="Message #{channel.name}"
          class="flex-1 bg-transparent text-sm outline-none placeholder-q-subtle"
          disabled
        />
      </div>
    </div>
  {/if}
</main>
