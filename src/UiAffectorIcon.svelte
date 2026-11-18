<script lang="ts">
    import { Item, type Affector } from "$lib/types.svelte";
    import UiStatsTooltip from "./UiStatsTooltip.svelte";

    let {
        children,
        affector,
        size,
        showNameOnHover,
        showStatsOnHover,
        ...buttonAttributes
    } : {
        children: any,
        affector: Affector,
        size: 0|1|2|3|4|5|6|7|8|9,
        showNameOnHover: boolean,
        showStatsOnHover: boolean,
        buttonAttributes?: any
    } = $props();

    let statsTooltip = $state<UiStatsTooltip>();
</script>



<div class="UiAffectorIcon">
    <button class="iconButton" interestfor={statsTooltip?.uid} {...buttonAttributes}>
        <img src={affector.icon} alt={affector.name} class={`icon size-${size}`}>
    </button>

    {@render children?.()}

    {#if showNameOnHover || showStatsOnHover}
    <UiStatsTooltip
    bind:this={statsTooltip}
    header={showNameOnHover ? affector.name : undefined} 
    leaders={affector instanceof Item ? [["Gold", affector.price.toFixed(0)]] : []}
    stats={showStatsOnHover ? affector.stats : []}
    positionPriorities={["bottom", "top", "left", "right"]}
    />
    {/if}
</div>



<style lang="scss">
    .UiAffectorIcon {
        display: grid;
        height: max-content;
        width: max-content;
    }

    .iconButton {
        border: none;
        border-radius: 0;
        display: grid;
        height: max-content;
        width: max-content;
        --zoom: 1.125;

        > .icon {
            background: linear-gradient(in oklab to bottom, 
                colors.hcl("aqua", 0, 5), 
                colors.hcl("blue", 0, 4)
            );
        }
    }
</style>