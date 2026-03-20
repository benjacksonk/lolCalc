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

    let statsTooltip = $state<StatsTooltip>();
</script>



<button class="AffectorIcon" interestfor={statsTooltip?.uid}>
    <img src={affector.iconURL} alt={affector.name} class={`icon ${size}`}>
</button>

{#if showNameOnHover || showStatsOnHover}
<StatsTooltip
bind:this={statsTooltip}
header={showNameOnHover ? affector.name : undefined} 
leaders={affector instanceof Item ? [["Gold", affector.price.toFixed(0)]] : []}
stats={showStatsOnHover ? affector.stats : []}
/>
{/if}



<style>
    .AffectorIcon {
        > .icon {
            background-color: #1f1f1f;
        }
    }
</style>