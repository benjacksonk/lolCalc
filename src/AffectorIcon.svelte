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
    <img src={affector.iconURL} alt={affector.name}
    class={`icon ${size}`}
    >

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
        X&:hover > .iconWrapper {
            transition: 0.035s ease-out;
            transform: scale(133%);
            outline: 1px solid var(--gold-pale);
            box-shadow: 0 0 17px 12px #111e;

            > .icon {
                border: 1px solid #777;
            }
        }

        > .icon {
            background-color: #1f1f1f;
        }
    }
</style>