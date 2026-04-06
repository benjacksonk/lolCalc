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



<div popover="hint" id={uid} class="StatsTooltip"
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
		box-shadow:	var(--box-shadow);
        pointer-events: none;
        position: absolute;
        top: anchor(100%);
        left: anchor(50%);
        right: unset;
        translate: -50%;
        color: var(--color-grey-29);
        font-family: var(--font-family-sans);
        background: linear-gradient(in oklab to bottom, 
            oklch(from var(--color-blue-9) l calc(c * 0.71) h), 
            oklch(from var(--color-aqua-9) l calc(c * 0.79) h / 79%)
        );
        backdrop-filter: blur(23px);
        padding: calc(2px + var(--space-3)) calc(2px + var(--space-4));
        border-width: 2px 1px 2px;
        border-style: solid;
        border-color: var(--color-honey-27);
        border-image: linear-gradient(in oklab to bottom, 
            var(--color-honey-27), 
            oklch(from var(--color-aqua-12) l calc(c * 0.5) h)
        ) 1;
        grid-template-columns: auto auto;
        gap: 5px;
        overflow: visible;

        &:popover-open {
            display: grid;
        }

        &.alignLeftEdge {            
            left: anchor(0%);
            translate: 0%;

            &::before, &::after {
                left: 4px;
                right: unset;
                translate: 0%;
            }
            &::after {
                background: oklch(from var(--color-blue-9) l calc(c * 0.71) h);
            }
        }

        &.alignRightEdge {
            left: anchor(100%);
            translate: -100%;

            &::before, &::after {
                left: unset;
                right: 4px;
                translate: 0%;
            }
            &::after {
                background: oklch(from var(--color-blue-9) l calc(c * 0.71) h);
            }
        }

        &::before, &::after {
            content: "";
            position: absolute;
            left: 50%;
            translate: -50%;
            rotate: 45deg;
            width: 12px;
            height: 12px;
        }
        &::before {
            top: calc((-12px * (1 / 2)) - 2px);
            background: var(--color-honey-27);
        }
        &::after {
            top: calc((-12px * (1 / 2)) + (2px * (sqrt(2) - 1)));
            background: oklch(from var(--color-blue-9) l calc(c * 0.71) h);
        }
    }

    .affectorName {
        grid-column: span 2;
        text-align: center;
        font-weight: bold;
        color: var(--color-honey-28);
        display: grid;
    }

    .itemStat {
        color: var(--color-honey-28);
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