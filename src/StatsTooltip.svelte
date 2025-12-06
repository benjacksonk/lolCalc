<script lang="ts">
    import type { StatType } from "$lib/types.svelte";
    import Tooltip from "./Tooltip.svelte";

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



<Tooltip edgeAlignment={edgeAlignment}>
    <div class="StatsTooltip">
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
</Tooltip>



<style>
    .StatsTooltip {
        color: #e2e2e2;
        font-family: var(--font-family-sans);
        background: var(--blue-aqua-vivid);
        padding: calc(2px + var(--space-3)) calc(2px + var(--space-4));
        border: 2px solid var(--brass);
        border-image: var(--gradient-0) 1;
        display: grid;
        
        &::before {
            mix-blend-mode: soft-light;
            opacity: 0.5;
            top: 2px;
            right: 2px;
        }

        grid-template-columns: auto auto;
        gap: 5px;
    }

    .itemStat {
        color: var(--goldPale);
    }

    .affectorName {
        grid-column: span 2;
        text-align: center;
        font-weight: bold;
        color: var(--goldPale);
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