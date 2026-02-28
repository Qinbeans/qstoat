<script lang="ts">
    import { onMount } from "svelte";
    import type { StoatStore } from "../../../../lib/adapter/stoat.svelte.js";
    import MessageItem from "./MessageItem.svelte";
    import { SvelteMap } from "svelte/reactivity";
    import type { Message } from "stoat.js";

    let {
        store,
        channel,
        ctxId = $bindable(),
    } = $props<{
        store: StoatStore;
        channel: any;
        ctxId: { value: string | null };
    }>();

    let prevChannelId = $state<string | null>(null);
    const messages = $derived<Message[]>(
        channel?.id ? (store.messages.get(channel.id) ?? []) : [],
    );

    async function ensureInitialMessages() {
        if (!channel) return;
        const list = store.messages.get(channel.id) ?? [];
        if (list.length === 0) {
            try {
                const result = await channel.fetchMessagesWithUsers({
                    limit: 50,
                });
                if (result?.messages) {
                    // normalize to newest-first ordering for the UI which uses
                    // `flex-col-reverse` (DOM is visually inverted).
                    const sorted = (result.messages ?? [])
                        .slice()
                        .sort((a: any, b: any) => b.id.localeCompare(a.id));
                    store.messages.set(channel.id, sorted);
                }
                if (result?.users?.length)
                    for (const u of result.users) store.users.set(u.id, u);
                if (result?.members?.length) {
                    for (const m of result.members) {
                        if (!store.members.has(m.id.server))
                            store.members.set(m.id.server, new SvelteMap());
                        store.members.get(m.id.server)?.set(m.id.user, m);
                    }
                }
            } catch (e) {
                console.error("fetchMessagesWithUsers failed:", e);
            }
        }
    }

    // top-level context menu removed; MessageItem handles per-message context

    let listEl = $state<HTMLDivElement | null>(null);
    const FETCH_LIMIT = 50;
    let fetching = $state(false);
    let atEnd = $state(true);
    let prevCount = $state(0);

    $effect(() => {
        if (!channel) return;
        if (channel.id !== prevChannelId) {
            prevChannelId = channel.id;
            prevCount = 0;
            ensureInitialMessages();
        }
    });

    onMount(() => {
        function onScroll() {
            if (!listEl) return;
            const fromBottom =
                listEl.scrollHeight - (listEl.scrollTop + listEl.clientHeight);
            atEnd = fromBottom < 200;
            if (listEl.scrollTop < 200) fetchOlder();
        }
        listEl?.addEventListener("scroll", onScroll);

        return () => {
            listEl?.removeEventListener("scroll", onScroll);
        };
    });

    $effect(() => {
        const msgs = messages;
        if (msgs.length !== prevCount) {
            if (atEnd && listEl) {
                const behavior = prevCount === 0 ? "instant" : "smooth";
                listEl.scrollTo({
                    top: listEl.scrollHeight,
                    behavior: behavior as ScrollBehavior,
                });
            }
            prevCount = msgs.length;
        }
    });

    const lastRequestedBefore = $state<Record<string, string | null>>({});

    async function fetchOlder() {
        if (fetching || !channel) return;
        const msgs = messages;
        if (!msgs.length) return;
        // `msgs` is newest-first; the oldest message is at the end of the array.
        const oldest = msgs[msgs.length - 1].id;
        if (lastRequestedBefore[channel.id] === oldest) return;
        lastRequestedBefore[channel.id] = oldest;
        fetching = true;
        const prevScrollHeight = listEl?.scrollHeight ?? 0;
        const prevScrollTop = listEl?.scrollTop ?? 0;
        try {
            const res = await channel.fetchMessagesWithUsers({
                limit: FETCH_LIMIT,
                before: oldest,
            });
            if (res?.messages?.length) {
                // Dedupe by id then sort newest-first so index 0 is newest.
                const map = new Map<string, any>();
                // combine older fetched messages with existing messages
                // res.messages may be oldest-first or newest-first depending on API,
                // so rely on sorting afterwards.
                res.messages.concat(msgs).forEach((m: any) => map.set(m.id, m));
                const combined = Array.from(map.values()).sort(
                    (a: any, b: any) => b.id.localeCompare(a.id),
                );
                store.messages.set(channel.id, combined);
                setTimeout(() => {
                    if (!listEl) return;
                    listEl.scrollTop =
                        listEl.scrollHeight - prevScrollHeight + prevScrollTop;
                });
                if ((res.messages?.length ?? 0) < FETCH_LIMIT) {
                    // record the oldest id we now have (end of newest-first array)
                    lastRequestedBefore[channel.id] =
                        combined[combined.length - 1]?.id ?? null;
                }
            }
        } catch (e) {
            console.error("fetchOlder failed", e);
            lastRequestedBefore[channel.id] = null;
        } finally {
            fetching = false;
        }
    }
</script>

<div
    bind:this={listEl}
    class="flex flex-col-reverse px-4 py-2 space-y-1 overflow-auto h-full min-h-0"
    id="message-list"
>
    {#if channel}
        {#each messages as message (message.id)}
            <MessageItem {store} {message} bind:ctxId />
        {/each}
        <div
            class="flex flex-col {messages.length === 0
                ? 'items-center justify-center py-16 text-center'
                : 'pt-16 pb-4'}"
        >
            <p class="mt-3 font-semibold">Welcome to #{channel.name}!</p>
            <p class="mt-1 text-sm text-q-subtle">
                This is the beginning of this channel.
            </p>
        </div>
    {/if}

    <!-- per-message context handled in MessageItem -->

    {#if !atEnd}
        <button
            class="fixed right-5 bottom-24 z-40 bg-linear-to-b from-black/4 to-black/2 px-3 py-1 rounded-full shadow-md backdrop-blur-sm cursor-pointer"
            onclick={() =>
                listEl?.scrollTo({
                    top: listEl.scrollHeight,
                    behavior: "smooth",
                })}
            aria-label="Jump to bottom"
        >
            <svg
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg
            >
        </button>
    {/if}
</div>
