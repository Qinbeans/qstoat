<script lang="ts">
    const { store, message } = $props<{ store: any; message: any }>();

    const displayName = () =>
        store.users.get(message.authorId)?.displayName ??
        store.users.get(message.authorId)?.username ??
        "Unknown";

    const timeString = () =>
        new Date(
            message.editedAt ?? message.createdAt ?? Date.now(),
        ).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
</script>

<div class="flex items-baseline gap-2">
    <span class="font-semibold text-sm">{displayName()}</span>
    <span class="text-xs text-q-subtle">{timeString()}</span>
</div>
