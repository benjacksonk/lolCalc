<script lang="ts">
    import { Item, type Affector } from "$lib/types.svelte";
    import StatsTooltip from "./StatsTooltip.svelte";

    let {
        affector,
        size,
        hasTooltip
    } : {
        affector: Affector,
        size: "max"|"med"|"sml"|"min",
        hasTooltip: boolean
    } = $props();
    
    let tooltipParentWidth = $state();
    let tooltipParentHeight = $state();
    let tooltipParentOffsetX = $state();
    let tooltipParentOffsetY = $state();
</script>



<div class="AffectorIcon" 
bind:clientWidth={tooltipParentWidth} 
bind:clientHeight={tooltipParentHeight} 
bind:offsetWidth={tooltipParentOffsetX} 
bind:offsetHeight={tooltipParentOffsetY}
>
    <img src={affector.iconURL} alt={affector.name} class={`icon ${size}`}>

    {#if hasTooltip}
    <StatsTooltip 
    header={affector.name} 
    leaders={affector instanceof Item ? [["Gold", affector.price.toFixed(0)]] : []}
    stats={affector.stats}
    />
    {/if}
</div>



<style>
    .AffectorIcon {
        > .icon {
            background-color: #1f1f1f;
        }
    }
</style>