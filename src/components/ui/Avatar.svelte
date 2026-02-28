<script lang="ts">
  interface Props {
    /** Resolved image URL — pass `file?.createFileURL()` from the caller. */
    src?: string;
    /** Display name used for the fallback initial and the img alt text. */
    name: string;
    /** Size in pixels (applied to both width and height). */
    size?: number;
    class?: string;
  }

  let { src, name, size = 36, class: cls = "" }: Props = $props();

  const initial = $derived(name.trim().charAt(0).toUpperCase() || "?");
</script>

{#if src}
  <img
    {src}
    alt={name}
    style="width:{size}px;height:{size}px"
    class={["shrink-0 rounded-full object-cover", cls].join(" ")}
  />
{:else}
  <div
    style="width:{size}px;height:{size}px;font-size:{Math.round(size * 0.4)}px"
    class={[
      "shrink-0 flex items-center justify-center rounded-full",
      "bg-blue-600 font-bold text-white select-none",
      cls,
    ].join(" ")}
  >
    {initial}
  </div>
{/if}
