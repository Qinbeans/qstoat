<!--
- Modal card
- Banner top full width
- Message if not current user
- Channel edit modal
  -->

<script lang="ts">
  import Avatar from "../../../ui/Avatar.svelte";

  const {
    store,
    userId: propUserId,
    user: propUser,
  } = $props<{
    store?: any;
    userId?: string;
    user?: any;
  }>();

  // Resolve the user: prefer explicit `user` prop, then lookup by `userId`.
  const user = $derived(
    propUser ?? (propUserId ? store?.users.get(propUserId) : undefined),
  );

  const isSelf = $derived(store?.self?.id === user?.id);
</script>

{#if user}
  <div class="rounded-md bg-q-surface p-3">
    <div class="flex items-center gap-3">
      <Avatar
        src={user.animatedAvatarURL ?? user.avatarURL}
        name={user.displayName ?? user.username ?? "?"}
        size={48}
      />

      <div class="min-w-0">
        <div class="font-semibold truncate">
          {user.displayName ?? user.username ?? "Unknown"}
        </div>
        <div class="text-sm text-q-text-2 truncate">@{user.username}</div>
        {#if user.bio}
          <div class="mt-2 text-sm text-q-text-2">{user.bio}</div>
        {/if}
      </div>

      {#if isSelf}
        <div class="ml-auto text-sm text-q-muted">You</div>
      {/if}
    </div>
  </div>
{:else}
  <div class="rounded-md bg-q-surface p-3 text-q-muted">Unknown user</div>
{/if}
