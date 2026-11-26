<script lang="ts">
    import type { HTMLButtonAttributes } from "svelte/elements";
    import UiTooltip from "./UiTooltip.svelte";
    import type { Snippet } from "svelte";

    interface Props {
        trigger: Snippet<[{ props: HTMLButtonAttributes }]>;
        tooltipHeader?: string;
        tooltipContent?: Snippet;
        popoverContent?: Snippet;
    }

    let {
        trigger,
        tooltipHeader = "",
        tooltipContent,
        popoverContent,
    }: Props = $props();

    export const uid = $props.id();
    const popoverId = $derived(`UiPopTipButton-${uid}-popover`);
    let tooltip = $state<UiTooltip>();
    let triggerProps = $derived({
        // type: "button",
        popovertarget: popoverId,
        interestfor: tooltip?.uid,
        ...trigger
    });
</script>



{#if trigger}
    {@render trigger({ props: triggerProps })}

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
{/if}



<style lang="scss">
    [popover] {
        background: colors.gray(12);
        padding: 2px;
        border: none;
        border-radius: 3px;
		box-shadow:	shadows.$box-shadow-sup;
        overflow: visible;
        position-area: bottom span-right;
        position-try-fallbacks: top span-right, right, left;

        &:popover-open {
            display: flex;
        }
    }
</style>