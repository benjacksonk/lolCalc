<script lang="ts">
    let {
        caption = "",
        edgeAlignment,
        header = "",
        positionPriorities
    } : {
        caption: string,
        edgeAlignment?: "left"|"right",
        header: string,
        positionPriorities: string[]
    } = $props();

    export const uid = $props.id();

    let positionArea = $derived(positionPriorities[0]);
    let positionTryFallbacks = $derived(positionPriorities.slice(1).join(",") ?? "none");
</script>



<div popover="hint" id={uid} class="UiTooltip"
class:alignLeftEdge={edgeAlignment == "left"}
class:alignRightEdge={edgeAlignment == "right"}
style:position-area={positionArea}
style:position-try-fallbacks={positionTryFallbacks}
>
    {#if header}
    <strong class="tooltipHeader">{header}</strong>
    {/if}

    <span class="caption">{caption}</span>
</div>



<style lang="scss">
    .UiTooltip {
        border-width: 2px;
        border-style: solid;
        border-color: colors.hcl("aqua", 5, 34);
        grid-template-columns: auto auto;
        gap: 5px;

		box-shadow:	inset 0 0 4px 0px colors.hcl("aqua", 5, 34), shadows.$box-shadow-max;
        color: colors.hcl("aqua", 5, 47);
        border-radius: 8px;
        padding: #{sizes.$cap-4} #{sizes.$cap-5};
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

    .tooltipHeader {
        grid-column: span 2;
        color: colors.hcl("honey", 5, 50);
        padding-bottom: 0.5em;
        border-bottom: 1px solid colors.hcl("aqua", 5, 34);
        text-align: center;
        display: grid;
    }
    .tooltipHeader,
    .itemStat {
    }
    .itemStat {
        font-weight: 600;
        color: colors.hcl("honey", 5, 44);
    }

    .caption {
        grid-column: span 2;
        display: grid;
        gap: 20px;
        
        grid-template-columns: subgrid;
        grid-template-rows: subgrid;
        align-items: baseline;
        text-align: left;
    }
</style>