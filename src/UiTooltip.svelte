<script lang="ts">
    let {
        header = "",
        positionPriorities,
        children,
    } : {
        header: string,
        positionPriorities: string[],
        children: any,
    } = $props();

    export const uid = $props.id();

    let positionArea = $derived(positionPriorities[0]);
    let positionTryFallbacks = $derived(positionPriorities.slice(1).join(",") ?? "none");
</script>



<div popover="hint" id={uid} class="UiTooltip"
style:position-area={positionArea}
style:position-try-fallbacks={positionTryFallbacks}
>
    {#if header != ""}
    <strong class="tooltipHeader">{header}</strong>
    {/if}

    {#if children}
    <div class="caption">
        {@render children?.()}
    </div>
    {/if}
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
    }
    .UiTooltip:has(.tooltipHeader + .caption:empty) {
        padding: #{sizes.$cap-3} #{sizes.$cap-4};
    }

    .tooltipHeader {
        grid-column: span 2;
        display: grid;
        padding-top: 0.25em;
        text-align: center;
        color: colors.hcl("honey", 5, 50);
    }
    .tooltipHeader:has(+ .caption:not(:empty)) {
        padding-bottom: 0.5em;
        border-bottom: 1px solid colors.hcl("aqua", 5, 34);
    }

    .caption {
        display: flex;
    }
</style>