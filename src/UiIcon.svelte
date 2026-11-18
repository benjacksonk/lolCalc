<script lang="ts">
    import UiTooltip from "./UiTooltip.svelte";

    let {
        children,
        src,
        alt = "",
        size,
        header = "",
        caption = "",
        background = undefined,
        round = undefined,
        ...buttonAttributes
    } : {
        children: any,
        src: string,
        alt: string,
        size: 0|1|2|3|4|5|6|7|8|9,
        header: string,
        caption: string,
        background?: string,
        round?: boolean,
        buttonAttributes?: any
    } = $props();

    let statsTooltip = $state<UiTooltip>();
</script>



<div class="UiIcon">
    <button class="iconButton" 
    class:round={round == true} 
    class:semiround={round == undefined} 
    interestfor={statsTooltip?.uid} {...buttonAttributes}
    >
        {#if background}
        <img {src} {alt} class={`icon size-${size}`} style:background={background}>
        {:else}
        <img {src} {alt} class={`icon size-${size} defaultBG`}>
        {/if}
    </button>

    {@render children?.()}

    {#if header != "" || caption != ""}
    <UiTooltip
    bind:this={statsTooltip}
    header={header} 
    caption={caption}
    positionPriorities={["bottom", "top", "left", "right"]}
    />
    {/if}
</div>



<style lang="scss">
    .UiIcon {
        display: grid;
        height: max-content;
        width: max-content;
    }

    .iconButton {
        border: none;
        display: grid;
        height: max-content;
        width: max-content;
        background: transparent;
        --zoom: 1.125;

        &:not(.round):not(.semiround) {
            border-radius: 0;
        }

        > .icon {
            &.defaultBG {
                background: linear-gradient(in oklab to bottom, colors.hcl("aqua", 0, 5), colors.hcl("blue", 0, 4));
            }
        }
    }
</style>