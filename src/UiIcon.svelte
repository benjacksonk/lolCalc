<script lang="ts">
    interface Props {
        size?: number;
        boxSizing?: "content-box"|"border-box"|"inherit"|"initial"|"revert"|"revert-layer"|"unset";
        src: string;
        alt?: string;
        classes?: string;
        background?: string;
    }

    let {
        size,
        boxSizing = "content-box",
        src,
        alt = "",
        classes = "",
        background = undefined,
    }: Props = $props();
</script>



<div class={`${size != undefined ? `UiIcon UiIcon-size-${size}` : "UiIcon"} ${classes}`} style:box-sizing={boxSizing}>
    {#if background}
    <img {src} {alt} style:background={background}>
    {:else}
    <img {src} {alt} class={`UiIcon-defaultBG`}>
    {/if}
</div>



<style lang="scss">
    .UiIcon {
        display: flex;
        aspect-ratio: 1;
        overflow: hidden;

        &.UiIcon-size-0 { --size: #{sizes.$icon-0}; width: var(--size); }
        &.UiIcon-size-1 { --size: #{sizes.$icon-1}; width: var(--size); }
        &.UiIcon-size-2 { --size: #{sizes.$icon-2}; width: var(--size); }
        &.UiIcon-size-3 { --size: #{sizes.$icon-3}; width: var(--size); }
        &.UiIcon-size-4 { --size: #{sizes.$icon-4}; width: var(--size); }
        &.UiIcon-size-5 { --size: #{sizes.$icon-5}; width: var(--size); }
        &.UiIcon-size-6 { --size: #{sizes.$icon-6}; width: var(--size); }
        &.UiIcon-size-7 { --size: #{sizes.$icon-7}; width: var(--size); }
        &.UiIcon-size-8 { --size: #{sizes.$icon-8}; width: var(--size); }
        &.UiIcon-size-9 { --size: #{sizes.$icon-9}; width: var(--size); }
    }
    
    .UiIcon-defaultBG {
        background: linear-gradient(in oklab to bottom, colors.hcl("aqua", 0, 5), colors.hcl("blue", 0, 4));
    }
</style>