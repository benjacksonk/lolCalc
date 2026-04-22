<script lang="ts">
    import type { StatType } from "$lib/types.svelte";

    let {
        stats,
        edgeAlignment,
        header,
        leaders,
        positionPriorities
    } : {
        stats: Iterable<[StatType, number]>,
        edgeAlignment?: "left"|"right",
        header?: string,
        leaders?: Iterable<[string, string]>,
        positionPriorities: string[]
    } = $props();

    export const uid = $props.id();

    let positionArea = $derived(positionPriorities[0]);
    let positionTryFallbacks = $derived(positionPriorities.slice(1).join(",") ?? "none");
</script>



<div popover="hint" id={uid} class="UiStatsTooltip"
class:alignLeftEdge={edgeAlignment == "left"}
class:alignRightEdge={edgeAlignment == "right"}
style:position-area={positionArea}
style:position-try-fallbacks={positionTryFallbacks}
>
    {#if header}
    <strong class="affectorName">{header}</strong>
    {/if}

    {#if leaders}
    {#each leaders as leader}
    <span class="affectorStat itemStat">
        <span class="affectorStatValue text-math">{leader[1]}</span>
        <b class="affectorStatName">{leader[0]}</b>
    </span>
    {/each}
    {/if}

    {#each stats as stat}
    <span class="affectorStat">
        <span class="affectorStatValue text-math">
            {#if stat[0].includes("Ratio")}
            {stat[1] * 100} %
            {:else}
            {stat[1]}
            {/if}
        </span>
        
        <span class="affectorStatName text-passage">{stat[0]}</span>
    </span>
    {/each}
</div>



<style lang="scss">
    .UiStatsTooltip {
        border-width: 2px;
        border-style: solid;
        border-color: colors.hcl("aqua", 5, 34);
        grid-template-columns: auto auto;
        gap: 5px;

		box-shadow:	inset 0 0 4px 0px colors.hcl("aqua", 5, 34), var(--box-shadow);
        color: colors.hcl("aqua", 5, 47);
        border-radius: 8px;
        padding: #{sizes.$space-4} #{sizes.$space-5};
		overflow: visible;
		background: linear-gradient(in oklab to bottom,
        colors.hcl("blue", 5, 5),
        colors.hcl("aqua", 5, 8)
        );

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
        color: colors.hcl("honey", 5, 50);
        padding-bottom: 0.5em;
        border-bottom: 1px solid colors.hcl("aqua", 5, 34);
        text-align: center;
        display: grid;
    }
    .affectorName,
    .itemStat {
    }
    .itemStat {
        font-weight: 600;
        color: colors.hcl("honey", 5, 44);
    }

    .affectorStat {
        grid-column: span 2;
        display: grid;
        gap: 20px;
        
        grid-template-columns: subgrid;
        grid-template-rows: subgrid;
        align-items: baseline;
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