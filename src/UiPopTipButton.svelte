<script lang="ts">
    import type { HTMLButtonAttributes } from "svelte/elements";
    import UiTooltip from "./UiTooltip.svelte";

    interface UiPopoverTipButtonProps extends HTMLButtonAttributes {
        plain: boolean;
        round?: boolean;
        popoverContent?: any;
        tooltipContent?: any;
        tooltipHeader: string;
        children?: any;
    }

    let {
        plain = false,
        round = undefined,
        popoverContent,
        tooltipContent,
        tooltipHeader = "",
        children,
        ...rest
    }: UiPopoverTipButtonProps = $props();

    export const uid = $props.id();
    let popoverId = $derived(`UiIcon-${uid}-popover`);
    let tooltip = $state<UiTooltip>();
    let roundness = $derived(round == undefined ? "semiround" : round ? "round" : "unround");
</script>



<div class="UiPopoverTipButton round">
    <button interestfor={tooltip?.uid} popovertarget={popoverId} class={`${roundness}`} class:plain {...rest}>
        {@render children?.()}
    </button>

    {#if popoverContent}
    <div popover id={popoverId}>
        {@render popoverContent()}
    </div>
    {/if}

    {#if (tooltipHeader != "") || tooltipContent}
    <UiTooltip bind:this={tooltip} header={tooltipHeader} positionPriorities={["bottom", "top", "left", "right"]}>
        {@render tooltipContent?.()}
    </UiTooltip>
    {/if}
</div>



<style lang="scss">
    .UiPopoverTipButton {
        display: flex;
    }

    button {
        display: flex;
        --zoom: 1.125;
    }
    
    [popover] {
		box-shadow:	shadows.$box-shadow-sup;
        background: colors.gray(2);
        border: 2px solid colors.gray(12);
        border-radius: 3px;
        grid-auto-rows: max-content;
        grid-template-columns: repeat(11, max-content);
        gap: 2px;
        overflow: visible;
        position-area: bottom span-right;
        position-try-fallbacks: top span-right, right, left;

        &:popover-open {
            display: grid;
        }
    }
</style>