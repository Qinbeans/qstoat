<script lang="ts">
    const { file } = $props<{ file: any }>();

    // Compute inline style for images using metadata when available.
    function getImageStyle(file: any) {
        const maxWidthPx = 450;
        if (!file) return `max-width:100%; max-height:60vh; height:auto;`;
        const w = file.metadata?.width;
        const h = file.metadata?.height;
        if (w) {
            const useW = Math.min(w, maxWidthPx);
            return `width:${useW}px; height:auto; max-width:100%; max-height:60vh;`;
        }
        if (h) {
            const useH = Math.min(h, maxWidthPx);
            return `height:${useH}px; width:auto; max-width:100%; max-height:60vh;`;
        }
        return `max-width:100%; max-height:60vh; height:auto;`;
    }
</script>

{#if file.metadata?.type === "Image"}
    {#if file.isSpoiler}
        <div class="p-2 text-sm text-q-subtle">Spoiler image</div>
    {/if}
    {#if file.contentType === "image/gif"}
        <img
            loading="lazy"
            src={file.createFileURL?.(true) ?? file.previewUrl}
            alt={file.filename}
            class="object-contain block"
            width={file.metadata?.width}
            height={file.metadata?.height}
            style={getImageStyle(file)}
        />
    {:else}
        <img
            loading="lazy"
            src={file.previewUrl}
            alt={file.filename}
            class="object-contain block"
            width={file.metadata?.width}
            height={file.metadata?.height}
            style={getImageStyle(file)}
        />
    {/if}
{:else if file.metadata?.type === "Video"}
    {#if file.isSpoiler}
        <div class="p-2 text-sm text-q-subtle">Spoiler video</div>
    {/if}
    <div class="max-h-[60vh] overflow-auto">
        <video
            aria-hidden="true"
            controls
            preload="metadata"
            src={file.originalUrl}
            class="w-full h-auto"
        ></video>
    </div>
{:else if file.metadata?.type === "Audio"}
    <div class="p-2">
        <audio controls src={file.originalUrl} class="w-full"></audio>
    </div>
{:else}
    <div class="p-2 flex items-center justify-between">
        <div class="text-sm">{file.filename ?? "Attachment"}</div>
        <a
            class="text-sm text-q-accent"
            href={file.previewUrl}
            target="_blank"
            rel="noreferrer">Open</a
        >
    </div>
{/if}
