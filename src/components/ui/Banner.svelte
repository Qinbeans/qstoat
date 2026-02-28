<script lang="ts">
  import Avatar from "./Avatar.svelte";

  interface Props {
    /** Banner image URL — shows a gradient fallback when not provided */
    bannerSrc?: string;
    /** Avatar image URL */
    avatarSrc?: string;
    /** Avatar display name (used for the letter fallback) */
    name: string;
    /** Avatar diameter in px (default 80) */
    avatarSize?: number;
    class: string;
    bannerClass?: string;
    avatarClass?: string;
  }

  let {
    bannerSrc,
    avatarSrc,
    name,
    avatarSize = 80,
    bannerClass = "",
    avatarClass = "bottom-0 left-5 translate-y-1/2",
    class: cls = "h-24",
  }: Props = $props();
</script>

<div class="relative {cls}">
  {#if bannerSrc}
    <img
      src={bannerSrc}
      alt="Profile banner"
      class="h-full w-full object-cover {bannerClass}"
    />
  {:else}
    <div
      class="h-full w-full bg-linear-to-br from-blue-700 to-violet-700"
    ></div>
  {/if}
  {#if avatarSrc}
    <div class="absolute {avatarClass}">
      <Avatar src={avatarSrc} {name} size={avatarSize} />
    </div>
  {:else}
    <div class="absolute {avatarClass}" style="font-size: {avatarSize / 2}px;">
      {name}
    </div>
  {/if}
</div>
