<script lang="ts">
    import type { HTMLImgAttributes } from "svelte/elements";

    interface UiIconProps extends HTMLImgAttributes {
        size: number;
        round?: boolean;
        background?: string;
    }

    let {
        size,
        round = undefined,
        background = undefined,
        ...rest
    }: UiIconProps = $props();

    let roundness = $derived(round == undefined ? "semiround" : round ? "round" : "unround");
</script>



<div class={`UiIcon ${roundness}`}>
    {#if background}
    <img class={`icon size-${size}`} style:background={background} {...rest}>
    {:else}
    <img class={`icon size-${size} ${roundness} defaultBG`} {...rest}>
    {/if}
</div>



<style lang="scss">
    .UiIcon {
        display: grid;
        height: max-content;
        width: max-content;
    }

    .icon {
        &.defaultBG {
            background: linear-gradient(in oklab to bottom, colors.hcl("aqua", 0, 5), colors.hcl("blue", 0, 4));
        }
    }
</style>