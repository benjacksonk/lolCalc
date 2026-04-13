<script lang="ts">
    import { Item, type Affector } from "$lib/types.svelte";
    import UiStatsTooltip from "./UiStatsTooltip.svelte";

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

    let statsTooltip = $state<UiStatsTooltip>();
</script>



<button class="UiAffectorIcon" interestfor={statsTooltip?.uid}>
    <img src={affector.iconURL} alt={affector.name} class={`icon ${size}`}>
</button>

{#if showNameOnHover || showStatsOnHover}
<UiStatsTooltip
bind:this={statsTooltip}
header={showNameOnHover ? affector.name : undefined} 
leaders={affector instanceof Item ? [["Gold", affector.price.toFixed(0)]] : []}
stats={showStatsOnHover ? affector.stats : []}
/>
{/if}



<style lang="scss">
    .UiAffectorIcon {
        border: none;
        border-radius: 0;
        display: grid;
        height: max-content;
        width: max-content;

        > .icon {
            background-color: map.get($colors, aqua-3-1);
        }
    }
</style>