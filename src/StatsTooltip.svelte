<script lang="ts">
    import type { StatType } from "$lib/types.svelte";

    let {
        stats,
        edgeAlignment,
        header,
        leaders,
    } : {
        stats: Iterable<[StatType, number]>,
        edgeAlignment?: "left"|"right",
        header?: string,
        leaders?: Iterable<[string, string]>
    } = $props();
</script>



<div class="StatsTooltip onHover"
class:alignLeftEdge={edgeAlignment == "left"}
class:alignRightEdge={edgeAlignment == "right"}
>
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
        color: #e2e2e2;
        font-family: var(--font-family-sans);
        background: var(--aqua);
        padding: calc(2px + var(--space-3)) calc(2px + var(--space-4));
        border-width: 1px 2px 2px;
        border-style: solid;
        border-color: var(--brass);
        border-image: linear-gradient(in oklab to bottom, var(--gold-pale), var(--brass), var(--aqua-pale)) 1;
        display: grid;

        grid-template-columns: auto auto;
        gap: 5px;
    }

    .affectorName {
        grid-column: span 2;
        text-align: center;
        font-weight: bold;
        color: var(--gold-pale);
        display: grid;
    }

    .itemStat {
        color: var(--gold-pale);
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