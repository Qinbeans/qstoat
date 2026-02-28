<script lang="ts">
    const { store, message } = $props<{ store: any; message: any }>();

    let reactionEntries = $state<Array<any>>([]);

    $effect(() => {
        const out: Array<any> = [];
        const reactions =
            store.messageReactions?.get?.(message.id) ?? message?.reactions;
        if (!reactions) {
            reactionEntries = out;
            return;
        }
        try {
            const entries = Array.from(
                (reactions as any).entries?.() ??
                    Object.entries(reactions as any),
            );
            for (const [emojiId, userSet] of entries as [any, any][]) {
                const count =
                    typeof userSet?.size === "number"
                        ? userSet.size
                        : Array.isArray(userSet)
                          ? userSet.length
                          : 0;
                let emojiObj = store.emojis.get?.(emojiId);
                if (!emojiObj) {
                    for (const e of store.emojis.values()) {
                        if (
                            e?.name === emojiId ||
                            `:${e?.name}:` === emojiId ||
                            e?.id === emojiId
                        ) {
                            emojiObj = e;
                            break;
                        }
                    }
                }
                const reactedBySelf = !!(
                    userSet?.has?.(store.self?.id) ??
                    (Array.isArray(userSet)
                        ? userSet.includes(store.self?.id)
                        : false)
                );
                out.push({
                    emojiId,
                    count,
                    isCustom: !!emojiObj,
                    emojiObj,
                    reactedBySelf,
                });
            }
        } catch (e) {
            for (const k of Object.keys(reactions)) {
                const userSet = reactions[k];
                const count = Array.isArray(userSet)
                    ? userSet.length
                    : (userSet?.size ?? 0);
                let emojiObj = store.emojis.get?.(k);
                if (!emojiObj) {
                    for (const e of store.emojis.values()) {
                        if (
                            e?.name === k ||
                            `:${e?.name}:` === k ||
                            e?.id === k
                        ) {
                            emojiObj = e;
                            break;
                        }
                    }
                }
                const reactedBySelf = Array.isArray(userSet)
                    ? userSet.includes(store.self?.id)
                    : !!userSet?.has?.(store.self?.id);
                out.push({
                    emojiId: k,
                    count,
                    isCustom: !!emojiObj,
                    emojiObj,
                    reactedBySelf,
                });
            }
        }
        reactionEntries = out;
    });
</script>

{#if reactionEntries.length}
    <div class="mt-2 flex gap-2 items-center">
        {#each reactionEntries as r}
            <button
                type="button"
                class={[
                    "flex items-center gap-1 px-2 py-0.5 rounded-md text-sm",
                    r.reactedBySelf
                        ? "bg-q-surface-3 text-q-text"
                        : "bg-q-surface-2 text-q-text-2",
                ].join(" ")}
                aria-label={`React ${r.emojiId}`}
            >
                {#if r.isCustom}
                    <img
                        src={r.emojiObj?.url}
                        alt={r.emojiObj?.name}
                        class="h-4 w-4"
                    />
                {:else}
                    <span>{r.emojiId}</span>
                {/if}
                <span class="text-xs">{r.count}</span>
            </button>
        {/each}
    </div>
{/if}
