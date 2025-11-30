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
</script>



<div class="AffectorIcon">
    <div class="iconWrapper">
        <img src={affector.iconURL} alt={affector.name} class={`icon ${size}`}>
    </div>

    {#if hasTooltip}
    <StatsTooltip 
    header={affector.name} 
    position="center"
    leaders={affector instanceof Item ? [["Gold", affector.price.toFixed(0)]] : []}
    stats={affector.stats}
    />
    {/if}
</div>



<style>
    .AffectorIcon {
    }

    .iconWrapper {
        background-color: #222;
    }
</style>