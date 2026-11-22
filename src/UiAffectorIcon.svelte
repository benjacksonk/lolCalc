<script lang="ts">
    import { Item, type Affector } from "$lib/types.svelte";
    import UiNamedValueList from "./UiNamedValueList.svelte";
    import UiTooltip from "./UiTooltip.svelte";

    let {
        children,
        affector,
        size,
        showNameOnHover,
        showStatsOnHover,
        ...buttonAttributes
    } : {
        children: any,
        affector: Affector,
        size: 0|1|2|3|4|5|6|7|8|9,
        showNameOnHover: boolean,
        showStatsOnHover: boolean,
        buttonAttributes?: any,
    } = $props();

    let tooltip = $state<UiTooltip>();

    let statEntries = $derived([
        (affector instanceof Item ? [["Gold", affector.price]] : []),
        (showStatsOnHover ? affector.stats.entries() : [])
    ] as [Iterable<[string, number]>, Iterable<[string, number]>]);

    let hasStats = $derived(statEntries.flat().length > 0);
</script>



<div class="UiAffectorIcon">
    <button class="iconButton unround" interestfor={tooltip?.uid} {...buttonAttributes}>
        <img src={affector.icon} alt={affector.name} class={`icon size-${size}`}>
    </button>

    {@render children?.()}

    {#if showNameOnHover || (showStatsOnHover && hasStats)}
    <UiTooltip
    bind:this={tooltip}
    header={showNameOnHover ? affector.name : ""} 
    positionPriorities={["bottom", "top", "left", "right"]}
    >
        {#if hasStats}
        <UiNamedValueList entries={statEntries}/>
        {/if}
    </UiTooltip>
    {/if}
</div>



<style lang="scss">
    .UiAffectorIcon {
        display: grid;
        height: max-content;
        width: max-content;
    }

    .iconButton {
        border: none;
        display: grid;
        height: max-content;
        width: max-content;
        --zoom: 1.125;

        > .icon {
            background: linear-gradient(in oklab to bottom, 
                colors.hcl("aqua", 0, 5), 
                colors.hcl("blue", 0, 4)
            );
        }
    }
</style>