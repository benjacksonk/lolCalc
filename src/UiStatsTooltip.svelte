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

    export const uid = $props.id();
</script>



<div popover="hint" id={uid} class="UiStatsTooltip"
class:alignLeftEdge={edgeAlignment == "left"}
class:alignRightEdge={edgeAlignment == "right"}
>
    {#if header}
    <span class="affectorName">{header}</span>
    {/if}

    {#if leaders}
    {#each leaders as leader}
    <span class="affectorStat itemStat">
        <span class="affectorStatValue math">{leader[1]}</span>
        <span class="affectorStatName">{leader[0]}</span>
    </span>
    {/each}
    {/if}

    {#each stats as stat}
    <span class="affectorStat">
        <span class="affectorStatValue math">
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



<style lang="scss">
    .UiStatsTooltip {
        border-width: 2px;
        border-style: solid;
        border-color: colors.hcl("honey", 5, 40);
        font-family: var(--font-family-sans);
        font-weight: 500;
        grid-template-columns: auto auto;
        gap: 5px;

		box-shadow:	var(--box-shadow);
        color: colors.hcl("coral", 5, 3);
        border-radius: 5px;
        padding: calc(2px + var(--space-3)) calc(2px + var(--space-4));
		overflow: visible;
		background:	linear-gradient(in oklab to bottom, colors.hcl("honey", 5, 49), colors.hcl("honey", 5, 46));

        &:popover-open {
            display: grid;
        }

        &X::before, 
        &X::after {
            content: "";
            position: absolute;
            position-anchor: inherit;
            position-area: top;
            // left: 50%;
            // translate: -50%;
            rotate: 45deg;
            width: 12px;
            height: 12px;
        }
        &X::before {
            top: calc((-12px * (1 / 2)) - 2px);
            background: colors.hcl("honey", 5, 40);
        }
        &X::after {
            top: calc((-12px * (1 / 2)) + (2px * (sqrt(2) - 1)));
            background: colors.hcl("honey", 5, 49);
        }
    }

    .affectorName {
        grid-column: span 2;
        text-align: center;
        font-family: fonts.$serif;
        font-weight: bold;
        font-size: larger;
        display: grid;
    }
    .affectorName,
    .itemStat {
        color: colors.hcl("honey", 5, 14);
    }
    .itemStat {
        font-weight: 600;
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