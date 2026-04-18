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
            {stat[1] * 100} %
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
        border-width: 2px 2px;
        border-style: solid;
        border-color: colors.hcl("blue", 0, 5) colors.hcl("honey", 0, 24);
        grid-template-columns: auto auto;
        gap: 5px;

		box-shadow:	var(--box-shadow);
        color: colors.hcl("honey", 0, 41);
        border-radius: 8px;
        padding: #{sizes.$space-4} #{sizes.$space-5};
		overflow: visible;
		background: #{colors.$lol-darkness};

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