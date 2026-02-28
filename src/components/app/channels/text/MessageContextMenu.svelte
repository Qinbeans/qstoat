<script lang="ts">
    const {
        visible,
        x,
        y,
        onCopy,
        onReply,
        onMarkUnread,
        onPinToggle,
        onDelete,
        onReport,
        onCopyLink,
        onReact,
        pinned,
    } = $props<{
        visible: boolean;
        x: number;
        y: number;
        onCopy?: () => void;
        onReply?: () => void;
        onMarkUnread?: () => void;
        onPinToggle?: () => void;
        onDelete?: (ev?: MouseEvent) => void;
        onReport?: () => void;
        onCopyLink?: () => void;
        onReact?: (emojiId: string) => void;
        pinned?: boolean;
    }>();

    function stop(e: Event) {
        e.stopPropagation();
    }
</script>

{#if visible}
    <div
        role="menu"
        tabindex="-1"
        class="fixed z-50 rounded bg-q-surface shadow-md border text-q-text"
        style="left: {x}px; top: {y}px;"
        onclick={stop}
        onkeydown={stop}
    >
        {#if onReact}
            <div class="px-4 py-2 text-sm text-q-subtle">React</div>
            <div class="flex flex-wrap gap-1 px-2 py-1">
                {#each ["👍", "👎", "❤️", "😂", "😮", "😢", "👏"] as emoji}
                    <button
                        type="button"
                        class="px-2 py-1 rounded hover:bg-q-surface-2"
                        onclick={() => onReact(emoji)}
                    >
                        {emoji}
                    </button>
                {/each}
            </div>
        {/if}
        {#if onCopy}
            <button
                type="button"
                class="block px-4 py-2 text-left text-sm w-full hover:bg-q-surface-2 hover:text-q-text"
                onclick={onCopy}
            >
                Copy text
            </button>
        {/if}

        {#if onReply}
            <button
                type="button"
                class="block px-4 py-2 text-left text-sm w-full hover:bg-q-surface-2 hover:text-q-text"
                onclick={onReply}
            >
                Reply
            </button>
        {/if}

        {#if onMarkUnread}
            <button
                type="button"
                class="block px-4 py-2 text-left text-sm w-full hover:bg-q-surface-2 hover:text-q-text"
                onclick={onMarkUnread}
            >
                Mark as unread
            </button>
        {/if}

        {#if onPinToggle}
            <button
                type="button"
                class="block px-4 py-2 text-left text-sm w-full hover:bg-q-surface-2 hover:text-q-text"
                onclick={onPinToggle}
            >
                {pinned ? "Unpin message" : "Pin message"}
            </button>
        {/if}

        {#if onDelete}
            <button
                type="button"
                class="block px-4 py-2 text-left text-sm w-full text-red-500 hover:bg-q-surface-2"
                onclick={(e) => onDelete(e as MouseEvent)}
            >
                Delete message
            </button>
        {/if}

        {#if onReport}
            <button
                type="button"
                class="block px-4 py-2 text-left text-sm w-full text-red-500 hover:bg-q-surface-2"
                onclick={onReport}
            >
                Report message
            </button>
        {/if}

        {#if onCopyLink}
            <button
                type="button"
                class="block px-4 py-2 text-left text-sm w-full hover:bg-q-surface-2 hover:text-q-text"
                onclick={onCopyLink}
            >
                Copy link
            </button>
        {/if}
    </div>
{/if}
