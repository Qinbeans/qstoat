<script module lang="ts">
  // Shared across all Draggable instances — tracks which instance owns the
  // current drag so nested Draggables don't interfere with each other.
  let activeDraggable = $state<symbol | null>(null);
</script>

<script lang="ts" generics="T extends { id: string }">
  import { untrack } from "svelte";
  import type { Snippet } from "svelte";

  interface Props {
    items: T[];
    onreorder?: (items: T[]) => void;
    children: Snippet<[T]>;
    class?: string;
  }

  let { items, onreorder, children, class: cls = "" }: Props = $props();

  // Unique identity for this Draggable instance.
  const myId = Symbol();

  // ── Local display order ────────────────────────────────────────────────────
  // Maintained as an array of IDs so we can reorder without mutating props.
  // Synced from props when the set of IDs changes (new server, channel added/
  // removed), but user reordering only updates this local state.
  let order = $derived<string[]>(items.map((i) => i.id));

  $effect(() => {
    const incoming = items.map((i) => i.id);
    const current = untrack(() => order);

    const incomingSet = new Set(incoming);
    const currentSet = new Set(current);

    // Merge: keep user's ordering for items that still exist, append new items.
    const merged = [
      ...current.filter((id) => incomingSet.has(id)),
      ...incoming.filter((id) => !currentSet.has(id)),
    ];

    if (merged.join("\0") !== current.join("\0")) {
      order = merged;
    }
  });

  const orderedItems = $derived(
    order
      .map((id) => items.find((i) => i.id === id))
      .filter((i): i is T => i !== undefined),
  );

  // ── Drag state ────────────────────────────────────────────────────────────
  let draggingId = $state<string | null>(null);
  let dragOverId = $state<string | null>(null);

  function onDragStart(e: DragEvent, id: string) {
    activeDraggable = myId;
    draggingId = id;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", id);
    }
  }

  function onDragOver(e: DragEvent, id: string) {
    // Ignore events that belong to a nested (or different) Draggable.
    if (activeDraggable !== myId) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    if (dragOverId !== id) dragOverId = id;
  }

  function onDrop(e: DragEvent, targetId: string) {
    if (activeDraggable !== myId) return;
    e.preventDefault();
    e.stopPropagation();

    if (!draggingId || draggingId === targetId) {
      draggingId = null;
      dragOverId = null;
      return;
    }

    const from = order.indexOf(draggingId);
    const to = order.indexOf(targetId);
    if (from === -1 || to === -1) return;

    const next = [...order];
    next.splice(from, 1);
    next.splice(to, 0, draggingId);
    order = next;

    const reordered = next
      .map((id) => items.find((i) => i.id === id))
      .filter((i): i is T => i !== undefined);
    onreorder?.(reordered);

    draggingId = null;
    dragOverId = null;
    activeDraggable = null;
  }

  function onDragEnd() {
    if (activeDraggable === myId) activeDraggable = null;
    draggingId = null;
    dragOverId = null;
  }

  function onDragLeave(e: DragEvent, id: string) {
    if (activeDraggable !== myId) return;
    // Only clear when leaving the item entirely (not entering a child).
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      if (dragOverId === id) dragOverId = null;
    }
  }
</script>

<div class={cls}>
  {#each orderedItems as item (item.id)}
    {@const isDragging = item.id === draggingId}
    {@const isDragOver = item.id === dragOverId && !isDragging}
    <div
      draggable="true"
      role="listitem"
      ondragstart={(e) => onDragStart(e, item.id)}
      ondragover={(e) => onDragOver(e, item.id)}
      ondrop={(e) => onDrop(e, item.id)}
      ondragend={onDragEnd}
      ondragleave={(e) => onDragLeave(e, item.id)}
      class={[
        "transition-opacity",
        isDragging ? "opacity-30" : "",
        isDragOver ? "outline outline-blue-500/60 rounded-md" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {@render children(item)}
    </div>
  {/each}
</div>
