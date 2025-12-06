<script lang="ts">
    import { Item, type Affector } from "$lib/types.svelte";
    import StatsTooltip from "./StatsTooltip.svelte";

    let {
        affector,
        size,
        showNameOnHover,
        showStatsOnHover
    } : {
        affector: Affector,
        size: "max"|"med"|"sml"|"min",
        showNameOnHover: boolean,
        showStatsOnHover: boolean
    } = $props();
    
    let hasTooltip = $derived(showNameOnHover || showStatsOnHover);
</script>



<div class="AffectorIcon">
    <img src={affector.iconURL} alt={affector.name} class={`icon ${size}`}>

    {#if hasTooltip}
    <StatsTooltip 
    header={showNameOnHover ? affector.name : undefined} 
    leaders={affector instanceof Item ? [["Gold", affector.price.toFixed(0)]] : []}
    stats={showStatsOnHover ? affector.stats : []}
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