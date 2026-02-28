<script lang="ts">
  import { getContext } from "svelte";
  import { STOAT_CTX } from "../lib/contexts/index.js";
  import type { StoatStore } from "../lib/adapter/stoat.svelte.js";
  import ServerList from "../components/navigation/ServerList.svelte";
  import ChannelSidebar from "../components/navigation/ChannelSidebar.svelte";
  import MainContent from "../components/layout/MainContent.svelte";
  import Settings from "./Settings.svelte";

  const store = getContext<StoatStore>(STOAT_CTX);

  interface Props {
    hash: string;
  }
  let { hash }: Props = $props();

  // Parse hash into a typed route descriptor.
  // Supported patterns:
  //   #/settings
  //   #/servers/:serverId
  //   #/servers/:serverId/channels/:channelId
  //   #/dms/:channelId
  //   #/app  (home)
  const route = $derived(parseHash(hash));

  function parseHash(h: string) {
    const path = h.replace(/^#/, "") || "/";
    const parts = path.split("/").filter(Boolean);

    if (parts[0] === "settings") {
      return { type: "settings" as const, serverId: null, channelId: null };
    }
    if (parts[0] === "servers" && parts[1]) {
      return {
        type: "server" as const,
        serverId: parts[1],
        channelId: parts[3] ?? null,
      };
    }
    if (parts[0] === "dms" && parts[1]) {
      return {
        type: "dm" as const,
        channelId: parts[1],
        serverId: null,
      };
    }
    return { type: "home" as const, serverId: null, channelId: null };
  }
</script>

{#if route.type === "settings"}
  <!-- Settings takes over the whole shell -->
  <Settings />
{:else}
  <div class="flex h-full">
    <!-- Server/DM icon rail -->
    <ServerList {store} activeServerId={route.serverId} />

    <!-- Channel / DM sidebar -->
    <ChannelSidebar
      {store}
      serverId={route.serverId}
      activeChannelId={route.channelId}
    />

    <!-- Main content -->
    <MainContent {store} {route} />
  </div>
{/if}
