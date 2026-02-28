<script lang="ts">
    import Avatar from "../../../ui/Avatar.svelte";
    import Attachment from "./Attachment.svelte";
    import Embed from "./Embed.svelte";
    import MessageContextMenu from "./MessageContextMenu.svelte";
    import Reactions from "./Reactions.svelte";
    import MessageHeader from "./MessageHeader.svelte";
    import { Message, UserSystemMessage } from "stoat.js";
    import SystemMessageItem from "./SystemMessageItem.svelte";
    let {
        store,
        message,
        ctxId = $bindable(),
        onReply,
        onDelete,
        onReport,
        onMarkUnread,
        onPinToggle,
        onCopyLink,
        onCopy,
    } = $props<{
        store: any;
        message: Message;
        ctxId: { value: string | null };
        onReply?: (message: Message) => void;
        onDelete?: (message: Message, shift: boolean) => void;
        onReport?: (message: Message) => void;
        onMarkUnread?: (message: Message) => void;
        onPinToggle?: (message: Message) => void;
        onCopyLink?: (message: Message) => void;
        onCopy?: (message: Message) => void;
    }>();

    // dispatcher removed; parent wiring should use prop callbacks if needed

    // Context menu state local to each message
    let ctxVisible = $state(false);
    let ctxX = $state(0);
    let ctxY = $state(0);
    let ctxMessage = $state<Message | null>(null);

    $effect(() => {
        if (ctxId.value === message.id) {
            ctxVisible = true;
            ctxMessage = message;
        } else if (ctxVisible && ctxId.value !== message.id) {
            ctxVisible = false;
            ctxMessage = null;
        }
    });

    function onContext(e: MouseEvent, m: Message) {
        e.preventDefault();
        ctxVisible = true;
        ctxX = e.clientX;
        ctxY = e.clientY;
        ctxMessage = m;
        ctxId.value = m.id;
    }

    function hideContext() {
        ctxVisible = false;
        ctxMessage = null;
        ctxId.value = null;
    }

    function copyMessage() {
        if (!ctxMessage) return;
        if (typeof onCopy === "function") {
            try {
                onCopy(ctxMessage);
            } catch {}
        } else {
            try {
                navigator.clipboard.writeText(ctxMessage.content ?? "");
            } catch {}
        }
        hideContext();
    }

    // Reply: emit an event so parent/composition handles drafts
    function handleReply() {
        if (!ctxMessage) return;
        if (typeof onReply === "function") {
            try {
                onReply(ctxMessage);
            } catch (e) {
                console.error("onReply handler failed", e);
            }
        } else {
            console.debug("reply requested", ctxMessage.id);
        }
        hideContext();
    }

    function handleMarkUnread() {
        if (!ctxMessage) return;
        if (typeof onMarkUnread === "function") {
            try {
                onMarkUnread(ctxMessage);
            } catch (e) {
                console.error("onMarkUnread handler failed", e);
            }
        } else {
            try {
                ctxMessage.ack(true, false, true);
            } catch (e) {}
        }
        hideContext();
    }

    async function handlePinToggle() {
        if (!ctxMessage) return;
        if (typeof onPinToggle === "function") {
            try {
                onPinToggle(ctxMessage);
            } catch (e) {
                console.error("onPinToggle handler failed", e);
            }
        } else {
            try {
                if (ctxMessage.pinned) await ctxMessage.unpin();
                else await ctxMessage.pin();
            } catch (e) {}
        }
        hideContext();
    }

    // Deletions / reports: emit events so host UI can show modals
    function handleDelete(ev?: MouseEvent) {
        if (!ctxMessage) return;
        if (typeof onDelete === "function") {
            try {
                onDelete(ctxMessage, !!ev?.shiftKey);
            } catch (e) {
                console.error("onDelete handler failed", e);
            }
        } else {
            console.debug("delete requested", ctxMessage.id, {
                shift: !!ev?.shiftKey,
            });
        }
        hideContext();
    }

    function handleReport() {
        if (!ctxMessage) return;
        if (typeof onReport === "function") {
            try {
                onReport(ctxMessage);
            } catch (e) {
                console.error("onReport handler failed", e);
            }
        } else {
            console.debug("report requested", ctxMessage.id);
        }
        hideContext();
    }

    function handleCopyLink() {
        if (!ctxMessage) return;
        if (typeof onCopyLink === "function") {
            try {
                onCopyLink(ctxMessage);
            } catch (e) {
                console.error("onCopyLink handler failed", e);
            }
        } else {
            try {
                const href = `${location.origin}${
                    ctxMessage.server ? `/server/${ctxMessage.server?.id}` : ""
                }/channel/${ctxMessage.channelId}/${ctxMessage.id}`;
                navigator.clipboard.writeText(href);
            } catch (e) {}
        }
        hideContext();
    }

    function getNodes(content: string) {
        const nodes: Array<any> = [];
        if (!content) return nodes;
        const re = /<@([^>]+?)>/g;
        let lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = re.exec(content))) {
            if (m.index > lastIndex)
                nodes.push({
                    type: "text",
                    text: content.slice(lastIndex, m.index),
                });
            nodes.push({ type: "mention", id: m[1] });
            lastIndex = re.lastIndex;
        }
        if (lastIndex < content.length)
            nodes.push({ type: "text", text: content.slice(lastIndex) });
        return nodes;
    }

    function handleReact(emojiId: string) {
        if (!ctxMessage) return;
        try {
            ctxMessage.react(emojiId);
        } catch (e) {
            console.error("react failed", e);
        }
        hideContext();
    }
</script>

<div
    id={`message-${message.id}`}
    role="row"
    tabindex="-1"
    class="group flex items-start gap-3 rounded-lg px-2 py-1 hover:bg-q-surface/50"
    oncontextmenu={(e) => onContext(e, message)}
>
    {#if message.systemMessage && message.authorId === "00000000000000000000000000"}
        {@const sys_msg: UserSystemMessage = message.systemMessage}
        <div class="min-w-0 flex-1">
            <SystemMessageItem {store} system_message={sys_msg} />
            <div class="relative left-12">
                <Reactions {store} {message} />
            </div>
        </div>
    {:else}
        <button onclick={() => {}}>
            <Avatar
                src={store.users.get(message.authorId)?.animatedAvatarURL ??
                    store.users.get(message.authorId)?.avatarURL}
                name={store.users.get(message.authorId)?.displayName ??
                    store.users.get(message.authorId)?.username ??
                    "?"}
                size={36}
                class="mt-0.5"
            />
        </button>
        <div class="min-w-0 flex-1">
            <MessageHeader {store} {message} />

            <div
                class="text-sm text-q-text-2 whitespace-pre-wrap wrap-break-word"
            >
                {#if message.content && !message.content.startsWith("https://static.klipy.com")}
                    {#each getNodes(message.content) as node}
                        {#if node.type === "text"}
                            <span>{node.text}</span>
                        {:else}
                            {@const id = node.id}
                            {@const user = store.users.get(id)}
                            {@const display =
                                user?.displayName ?? user?.username ?? id}
                            {@const isSelf = store.self?.id === id}

                            <span
                                class={isSelf
                                    ? "bg-orange-700/40 px-1 rounded-sm"
                                    : "bg-sky-700/40 px-1 rounded-sm"}
                                aria-hidden="true"
                                ><img
                                    src={user?.animatedAvatarURL ??
                                        user?.avatarURL}
                                    alt={display}
                                    class="inline-block w-4 h-4 rounded-full mr-1 mb-1"
                                />{display}</span
                            >
                        {/if}
                    {/each}
                {/if}
            </div>

            {#if message.attachments?.length}
                <div class="mt-3 flex flex-col gap-2">
                    {#each message.attachments as file}
                        <div
                            class="rounded-md overflow-hidden bg-q-surface-2 self-start"
                        >
                            <div class="max-h-[60vh] overflow-auto">
                                <Attachment {file} />
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}

            {#if message.embeds?.length || (message.content && (message.content.startsWith("https://static.klipy.com") || message.content.startsWith("https://tenor.com")))}
                <div class="mt-3 flex flex-col gap-2">
                    {#each message.embeds as embed}
                        <div
                            class="rounded-md overflow-hidden bg-q-surface-2 self-start"
                        >
                            <div class="max-h-[60vh] overflow-auto">
                                <Embed {embed} />
                            </div>
                        </div>
                    {:else}
                        <div
                            class="rounded-md overflow-hidden bg-q-surface-2 self-start"
                        >
                            <div class="max-h-[60vh] overflow-auto">
                                <Embed
                                    embed={{
                                        url: message.content,
                                        type: "Image",
                                    }}
                                />
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
            <Reactions {store} {message} />
        </div>
    {/if}
    <MessageContextMenu
        visible={ctxVisible}
        x={ctxX}
        y={ctxY}
        onCopy={copyMessage}
        onReply={handleReply}
        onMarkUnread={handleMarkUnread}
        onPinToggle={handlePinToggle}
        onDelete={handleDelete}
        onReport={handleReport}
        onCopyLink={handleCopyLink}
        onReact={handleReact}
        pinned={message.pinned}
    />
</div>
