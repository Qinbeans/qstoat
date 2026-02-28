<script lang="ts">
  import type { StoatStore } from "../../lib/adapter/stoat.svelte.js";
  import type { Server } from "stoat.js";
  import Icon from "../ui/Icon.svelte";

  interface Props {
    store: StoatStore;
    activeServerId: string | null;
  }
  let { store, activeServerId }: Props = $props();

  function serverInitial(server: Server): string {
    return (server.name ?? "?").charAt(0).toUpperCase();
  }

  function navigate(serverId: string) {
    window.location.hash = `#/servers/${serverId}`;
  }
</script>

<nav
  class="flex w-17 shrink-0 flex-col items-center gap-2 overflow-y-auto bg-q-deep py-3 scrollbar-none"
  aria-label="Servers"
>
  <!-- Home button -->
  <a
    href="#/app"
    class="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-q-surface-2
           text-q-muted transition hover:rounded-xl hover:bg-blue-600 hover:text-white"
    title="Home"
  >
    <Icon name="home" size={24} />
  </a>

  <hr class="w-8 border-q-border" />

  <!-- Server icons -->
  {#each store.servers.values() as server}
    {@const isActive = server.id === activeServerId}

    <button
      onclick={() => navigate(server.id)}
      title={server.name}
      class={[
        "relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl text-sm font-semibold transition-all",
        isActive
          ? "text-white"
          : "text-q-text-2 hover:bg-blue-500 hover:text-white",
      ].join(" ")}
    >
      {#if server.animatedIconURL ?? server.iconURL}
        <img
          src={server.animatedIconURL ?? server.iconURL}
          alt={server.name}
          class="h-full w-full object-cover"
        />
      {:else}
        {serverInitial(server)}
      {/if}

      <!-- Active indicator pip -->
      {#if isActive}
        <span
          class="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-white"
        ></span>
      {/if}
    </button>
  {/each}
</nav>
