<script lang="ts">
    import type { StatType } from "$lib/types.svelte";

    let {
        stats,
        position,
        header,
        leaders,
    } : {
        stats: Iterable<[StatType, number]>,
        position: "center"|"right",
        header?: string,
        leaders?: Iterable<[string, string]>,
    } = $props();
</script>



<div class={`StatsTooltip popup tooltip shifted${position}`}>
    {#if header}
    <span class="affectorName">{header}</span>
    {/if}

    {#if leaders}
    {#each leaders as leader}
    <span class="affectorStat itemStat">
        <span class="affectorStatValue">{leader[1]}</span>
        <span class="affectorStatName">{leader[0]}</span>
    </span>
    {/each}
    {/if}

    {#each stats as stat}
    <span class="affectorStat">
        <span class="affectorStatValue">
            {#if stat[0].includes("Ratio")}
            {stat[1] * 100} %
            {:else}
            {stat[1]}
            {/if}
        </span>
        
        <span class="affectorStatName">{stat[0]}</span>
    </span>
    {/each}
</div>



<style>
    .StatsTooltip {
        &.shiftedright {
            left: unset;
            transform: unset;
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