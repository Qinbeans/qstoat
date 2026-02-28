<script lang="ts">
    import { SystemMessage } from "stoat.js";

    const { store, system_message } = $props<{
        store: any;
        system_message: SystemMessage;
    }>();

    function isSelf(user: any) {
        return store.self?.id === user?.id;
    }
</script>

<div class="flex items-center gap-2">
    <svg
        class="h-10 w-10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
    >
        <!-- head/body -->
        <rect x="4" y="6" width="16" height="11" rx="2" />

        <!-- antennas -->
        <line x1="9" y1="3" x2="9" y2="6" />
        <circle cx="9" cy="3" r="1" fill="currentColor" stroke="none" />
        <line x1="15" y1="3" x2="15" y2="6" />
        <circle cx="15" cy="3" r="1" fill="currentColor" stroke="none" />

        <!-- eyes -->
        <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
        <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" />

        <!-- mouth -->
        <rect x="9" y="13" width="6" height="2" rx="0.5" />
        <line x1="10.5" y1="13" x2="10.5" y2="15" />
        <line x1="12" y1="13" x2="12" y2="15" />
        <line x1="13.5" y1="13" x2="13.5" y2="15" />
    </svg>
    <div>
        <span class="font-semibold text-sm"> System </span>
        <div class="text-sm text-q-text-2 whitespace-pre-wrap wrap-break-word">
            {#if system_message.user || system_message.by}
                {@const user = system_message.user ?? system_message.by}
                <span
                    class={isSelf(user)
                        ? "bg-pink-400/40 px-1 rounded-sm"
                        : "bg-sky-700/40 px-1 rounded-sm"}
                    aria-hidden="true"
                >
                    <img
                        src={user?.animatedAvatarURL ?? user?.avatarURL}
                        alt={user?.displayName}
                        class="inline-block w-4 h-4 rounded-full mr-1 mb-1"
                    />{user?.displayName}
                </span>
            {/if}
            {#if system_message.type === "user_joined"}
                joined the server
            {:else if system_message.type === "user_left"}
                left the server
            {:else if system_message.type === "user_banned"}
                was banned from the server
            {:else if system_message.type === "user_unbanned"}
                was unbanned from the server
            {:else if system_message.type === "user_kicked"}
                was kicked from the server
            {:else if system_message.type === "message_pinned"}
                pinned a message
            {:else if system_message.type === "message_unpinned"}
                unpinned a message
            {/if}
        </div>
    </div>
</div>
