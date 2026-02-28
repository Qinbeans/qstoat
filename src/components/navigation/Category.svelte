<script lang="ts">
  import type { Snippet } from "svelte";
  import Icon from "../ui/Icon.svelte";

  interface Props {
    title: string;
    children?: Snippet;
  }

  let { title, children }: Props = $props();

  let open = $state(true);
</script>

<div>
  <button
    onclick={() => (open = !open)}
    class="mt-2 flex w-full items-center gap-1 px-2 py-0.5 text-left
           text-xs font-semibold uppercase tracking-wider text-q-subtle
           hover:text-q-text-2 transition"
    aria-expanded={open}
  >
    <Icon
      name={open ? "expand_more" : "chevron_right"}
      size={14}
      class="shrink-0"
    />
    <span class="truncate">{title}</span>
  </button>

  {#if open && children}
    {@render children()}
  {/if}
</div>
