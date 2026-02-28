<script lang="ts">
  import type { StoatStore } from "../../lib/adapter/stoat.svelte.js";
  import type { Channel } from "stoat.js";
  import Icon from "../ui/Icon.svelte";
  import Avatar from "../ui/Avatar.svelte";
  import Banner from "../ui/Banner.svelte";
  import Category from "./Category.svelte";
  import ChannelRow from "./ChannelRow.svelte";
  import Draggable from "./Draggable.svelte";

  interface Props {
    store: StoatStore;
    serverId: string | null;
    activeChannelId: string | null;
  }
  let { store, serverId, activeChannelId }: Props = $props();

  // ── Server mode ───────────────────────────────────────────────────────────
  const server = $derived(
    serverId ? (store.servers.get(serverId) ?? null) : null,
  );

  const serverBuckets = $derived(server?.orderedChannels ?? []);

  function navigateToChannel(channelId: string) {
    window.location.hash = `#/servers/${serverId}/channels/${channelId}`;
  }

  // ── Home / DM mode ────────────────────────────────────────────────────────
  const dmChannels = $derived(
    [...store.channels.values()].filter(
      (c) => c.type === "DirectMessage" || c.type === "Group",
    ),
  );

  function dmRecipient(channel: Channel) {
    if (channel.type === "Group") return null;
    const selfId = store.self?.id;
    const otherId = [...channel.recipientIds].find((id) => id !== selfId);
    return otherId ? store.users.get(otherId) : undefined;
  }

  function dmName(channel: Channel): string {
    if (channel.type === "Group") return channel.name ?? "Group";
    const user = dmRecipient(channel);
    return user?.displayName ?? user?.username ?? "Unknown";
  }

  function navigateToDm(channelId: string) {
    window.location.hash = `#/dms/${channelId}`;
  }

  // ── User bar ──────────────────────────────────────────────────────────────
  const self = $derived(store.self);
</script>

<aside class="flex w-60 shrink-0 flex-col bg-q-surface">
  {#if server}
    <!-- ── Server mode ─────────────────────────────────────────── -->
    <div
      class="flex h-fit items-center border-b border-q-border px-4 shadow-sm"
    >
      <Banner
        bannerSrc={server.bannerURL ?? undefined}
        avatarSrc={undefined}
        name={server.name}
        avatarSize={40}
        bannerClass="rounded-xl w-full"
        avatarClass="translate-y-[-2rem] w-full text-center"
        class="h-23 my-2 w-full"
      />
    </div>

    <nav class="flex-1 overflow-y-auto p-2" aria-label="Channels">
      <Draggable items={serverBuckets}>
        {#snippet children(bucket)}
          {@const isDefault = bucket.id === "default"}

          {#if isDefault}
            <!-- Uncategorised channels sit at the top with no header -->
            <Draggable items={bucket.channels}>
              {#snippet children(channel)}
                <ChannelRow
                  {channel}
                  isActive={channel.id === activeChannelId}
                  onclick={() => navigateToChannel(channel.id)}
                />
              {/snippet}
            </Draggable>
          {:else}
            <Category title={bucket.title}>
              <Draggable items={bucket.channels}>
                {#snippet children(channel)}
                  <ChannelRow
                    {channel}
                    isActive={channel.id === activeChannelId}
                    onclick={() => navigateToChannel(channel.id)}
                  />
                {/snippet}
              </Draggable>
            </Category>
          {/if}
        {/snippet}
      </Draggable>

      {#if serverBuckets.length === 0}
        <p class="px-2 py-3 text-xs text-q-subtle">No channels</p>
      {/if}
    </nav>
  {:else}
    <!-- ── Home / DM mode ──────────────────────────────────────── -->
    <div class="flex h-12 items-center border-b border-q-border px-4">
      <h2 class="text-sm font-semibold uppercase tracking-wider text-q-muted">
        Direct Messages
      </h2>
    </div>

    <nav
      class="flex-1 overflow-y-auto p-2 space-y-0.5"
      aria-label="Direct messages"
    >
      {#each dmChannels as channel}
        {@const isActive = channel.id === activeChannelId}
        {@const recipient = dmRecipient(channel)}
        <button
          onclick={() => navigateToDm(channel.id)}
          class={[
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition",
            isActive
              ? "bg-q-surface-3 text-q-text"
              : "text-q-muted hover:bg-q-surface-2 hover:text-q-text-2",
          ].join(" ")}
        >
          <Avatar
            src={recipient?.animatedAvatarURL ?? recipient?.avatarURL}
            name={dmName(channel)}
            size={28}
            class="shrink-0"
          />
          <span class="truncate">{dmName(channel)}</span>
          {#if channel.type === "Group"}
            <span class="ml-auto shrink-0 text-xs text-q-subtle">
              {[...channel.recipientIds].length}
            </span>
          {/if}
        </button>
      {/each}

      {#if dmChannels.length === 0}
        <p class="px-3 py-4 text-xs text-q-subtle">No direct messages yet</p>
      {/if}
    </nav>
  {/if}

  <!-- ── User bar (always at the bottom) ───────────────────────── -->
  <div
    class="flex h-14 shrink-0 items-center gap-2 border-t border-q-border bg-q-bg px-3"
  >
    {#if self}
      <Avatar
        src={self.animatedAvatarURL ?? self.avatarURL}
        name={self.displayName ?? self.username ?? "?"}
        size={32}
        class="shrink-0"
      />
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium leading-tight">
          {self.displayName ?? self.username}
        </p>
        {#if self.discriminator}
          <p class="text-xs text-q-subtle">#{self.discriminator}</p>
        {/if}
      </div>
    {:else}
      <div
        class="h-8 w-8 shrink-0 rounded-full bg-q-surface-2 animate-pulse"
      ></div>
      <div class="h-3 w-24 rounded bg-q-surface-2 animate-pulse flex-1"></div>
    {/if}

    <a
      href="#/settings"
      title="User Settings"
      aria-label="Open settings"
      class="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-md
             text-q-muted hover:bg-q-surface-2 hover:text-q-text transition"
    >
      <Icon name="settings" size={20} />
    </a>
  </div>
</aside>
