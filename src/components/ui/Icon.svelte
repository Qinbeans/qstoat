<!--
  Icon wrapper for Material Symbols (Outlined variant).
  Usage: <Icon name="settings" size={20} />
  Icon names: https://fonts.google.com/icons
-->
<script lang="ts">
  interface Props {
    name: string;
    size?: number;
    class?: string;
  }
  let { name, size = 20, class: cls = "" }: Props = $props();
</script>

<span
  class={["material-symbols-outlined select-none leading-none", cls].join(" ")}
  style="font-size: {size}px; width: {size}px; height: {size}px;"
  aria-hidden="true"
>{name}</span>
