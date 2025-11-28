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
    <div class="iconWrapper">
        <img src={affector.iconURL} alt={affector.name} class={`icon ${size}`}>
    </div>

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
        > .tooltip {
            background-color: #1a2a3a;
            color: #e2e2e2;
            border: 2px solid #2a3a4a;
            padding: 10px;
            outline: 1px solid #cba;
            box-shadow: 0 0 7px 5px #111a;
            display: grid;

            grid-template-columns: auto auto;
            gap: 5px;
        }

        &:not(:hover) > .tooltip {
            visibility: hidden;
        }

        &:hover {
            z-index: 1;

            > .iconWrapper {
                transition: 0.035s ease-out;
                transform: scale(133%);
                outline: 1px solid #cba;
                box-shadow: 0 0 17px 12px #111e;

                > .icon {
                    border: 1px solid #777;
                }
            }
        }
    }

    .iconWrapper {
        background-color: #222;
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