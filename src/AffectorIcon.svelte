<script lang="ts">
    import { Item, type Affector } from "$lib/types.svelte";

    let {
        affector,
        size,
        hasTooltip
    } : {
        affector: Affector,
        size: "max"|"med"|"min",
        hasTooltip: boolean
    } = $props();
</script>



<div class="AffectorIcon">
    <img src={affector.iconURL} alt={affector.name} class={`icon ${size}`}>

    {#if hasTooltip}
    <div class="popup tooltip affectorDetails">
        <span class="affectorName">{affector.name}</span>

        {#if affector instanceof Item}
        <span class="affectorStat itemStat">
            <span class="affectorStatValue">{affector.price}</span>
            <span class="affectorStatName">Gold</span>
        </span>
        {/if}

        {#each affector.stats as stat}
            <span class="affectorStat"><span class="affectorStatValue">
                {#if stat[0].includes("Ratio")}
                {stat[1] * 100} %
                {:else}
                {stat[1]}
                {/if}
            </span><span class="affectorStatName">{stat[0]}</span></span>
        {/each}
    </div>
    {/if}
</div>



<style>
    .AffectorIcon {
        > .popup {
            background-color: #234;
            color: #e2e2e2;
            border: 3px solid #ca8;
            padding: 10px;
            display: grid;

            grid-template-columns: auto auto;
            gap: 5px;
        }

        &:not(:hover) > .tooltip {
            visibility: hidden;
        }
    }

    .itemStat {
        color: #edb;
    }

    .affectorName {
        grid-column: span 2;
        text-align: center;
        font-weight: bold;
        color: #edb;
        display: grid;
    }

    .affectorStat {
        grid-column: span 2;
        display: grid;
        gap: 20px;
        
        grid-template-columns: subgrid;
        grid-template-rows: subgrid;
    }

    .affectorStatValue {
        text-align: right;
        display: grid;
    }

    .affectorStatName {
        text-align: left;
        display: grid;
    }
</style>