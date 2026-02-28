<script lang="ts">
  import type { Channel } from "stoat.js";
  import Icon from "../ui/Icon.svelte";

  interface Props {
    channel: Channel;
    isActive: boolean;
    onclick: () => void;
  }

  let { channel, isActive, onclick }: Props = $props();
</script>

<button
  {onclick}
  class={[
    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition",
    isActive
      ? "bg-q-surface-3 text-q-text"
      : "text-q-muted hover:bg-q-surface-2 hover:text-q-text-2",
  ].join(" ")}
>
  <Icon
    name={channel.isVoice ? "volume_up" : "tag"}
    size={16}
    class="shrink-0"
  />
  <span class="truncate">{channel.name}</span>
</button>
