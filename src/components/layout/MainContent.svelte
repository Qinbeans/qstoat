<script lang="ts">
  import type { StoatStore } from "../../lib/adapter/stoat.svelte.js";
  import type { User } from "stoat.js";
  import Avatar from "../ui/Avatar.svelte";

  type Route =
    | { type: "home"; serverId: null; channelId: null }
    | { type: "server"; serverId: string; channelId: string | null }
    | { type: "dm"; channelId: string; serverId: null };

  interface Props {
    store: StoatStore;
    route: Route;
  }
  let { store, route }: Props = $props();

  const channel = $derived(
    route.channelId ? (store.channels.get(route.channelId) ?? null) : null,
  );
  const channelMessages = $derived(
    route.channelId ? (store.messages.get(route.channelId) ?? []) : [],
  );

  function getAuthor(authorId: string | undefined): User | undefined {
    if (!authorId) return undefined;
    return store.users.get(authorId);
  }

  function formatTime(date: Date | string | undefined): string {
    if (!date) return "";
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
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

    <!-- Message list -->
    <div class="flex-1 overflow-y-auto px-4 py-2 space-y-1" id="message-list">
      {#each channelMessages as message}
        {@const author = getAuthor(message.authorId)}
        <div
          class="group flex items-start gap-3 rounded-lg px-2 py-1 hover:bg-q-surface/50"
        >
          <!-- Avatar -->
          <Avatar
            src={author?.animatedAvatarURL ?? author?.avatarURL}
            name={author?.displayName ?? author?.username ?? "?"}
            size={36}
            class="mt-0.5"
          />

          <div class="min-w-0 flex-1">
            <div class="flex items-baseline gap-2">
              <span class="font-semibold text-sm">
                {author?.displayName ?? author?.username ?? "Unknown"}
              </span>
              <span class="text-xs text-q-subtle"
                >{formatTime(message.editedAt)}</span
              >
            </div>
            <p
              class="text-sm text-q-text-2 whitespace-pre-wrap wrap-break-word"
            >
              {message.content ?? ""}
            </p>
          </div>
        </div>
      {/each}

      {#if channelMessages.length === 0}
        <div
          class="flex flex-col items-center justify-center py-16 text-center"
        >
          <p class="text-4xl">#</p>
          <p class="mt-3 font-semibold">Welcome to #{channel.name}!</p>
          <p class="mt-1 text-sm text-q-subtle">
            This is the beginning of this channel.
          </p>
        </div>
      {/if}
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
