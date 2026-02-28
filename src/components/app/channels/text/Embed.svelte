<script lang="ts">
    const { embed } = $props<{ embed: any }>();

    function getEmbedStyle(embed: any) {
        const maxDim = 1200;
        const w = embed?.width;
        const h = embed?.height;
        if (w) {
            const useW = Math.min(w, maxDim);
            return `width:${useW}px; height:auto; max-width:100%; max-height:60vh;`;
        }
        if (h) {
            const useH = Math.min(h, maxDim);
            return `height:${useH}px; width:auto; max-width:100%; max-height:60vh;`;
        }
        return `max-width:100%; max-height:60vh; height:auto;`;
    }

    function isGIFEmbed(embed: any) {
        if (!embed) return false;
        if (embed.type === "Image")
            return !!embed.url?.startsWith("https://static.klipy.com");
        if (embed.type === "Website") {
            const orig = embed.originalUrl ?? "";
            return (
                embed.specialContent?.type === "GIF" ||
                orig.startsWith("https://tenor.com") ||
                orig.startsWith("https://klipy.com") ||
                orig.startsWith("https://static.klipy.com")
            );
        }
        return false;
    }

    let src: string | null = $state(null);

    $effect(() => {
        src =
            embed?.url ??
            embed?.proxiedURL ??
            embed?.originalUrl ??
            embed?.previewUrl ??
            embed?.image?.url ??
            embed?.image?.proxiedURL ??
            embed?.image?.originalUrl ??
            embed?.video?.url ??
            embed?.video?.proxiedURL ??
            embed?.video?.originalUrl ??
            null;

        if (embed && !src) {
            console.warn("Embed missing src fields", embed);
        }
    });
</script>

{#if embed.type === "Image"}
    <img
        loading="lazy"
        {src}
        alt={embed.title ?? "embed-image"}
        class="object-contain block"
        width={embed.width}
        height={embed.height}
        style={getEmbedStyle(embed)}
    />
{:else if embed.type === "Video"}
    <video
        aria-hidden="true"
        controls
        preload="metadata"
        {src}
        class="w-full h-auto"
    ></video>
{:else if embed.type === "Website"}
    {@const gif = isGIFEmbed(embed)}
    {@const image = embed.image}
    {@const video = embed.video}
    {#if image}
        <img
            loading="lazy"
            {src}
            alt={embed.title ?? "embed-image"}
            class="object-contain block"
            width={image.width}
            height={image.height}
            style={getEmbedStyle(image)}
        />
    {:else if video}
        <video
            loop={gif}
            muted={gif}
            autoplay={gif}
            controls={!gif}
            preload="metadata"
            {src}
            class="w-full h-auto"
        ></video>
    {/if}
{/if}
