<script lang="ts">
    import { Item, type Affector } from "$lib/types.svelte";
    import type { HTMLButtonAttributes } from "svelte/elements";
    import UiNamedValueList from "./UiNamedValueList.svelte";
    import UiPopTipButton from "./UiPopTipButton.svelte";
    import UiIcon from "./UiIcon.svelte";
    
    interface UiAffectorIconProps extends HTMLButtonAttributes {
        affector: Affector;
        size: 0|1|2|3|4|5|6|7|8|9;
        children?: any;
    }

    let {
        affector,
        size,
        children,
        ...rest
    }: UiAffectorIconProps = $props();

    let statEntries = $derived([
        (affector instanceof Item ? [["Gold", affector.price]] : []),
        affector.stats.entries()
    ] as [Iterable<[string, number]>, Iterable<[string, number]>]);
</script>



<UiPopTipButton plain={true} round={false} tooltipHeader={affector.name} {...rest}>
    <UiIcon {size} round={false} src={affector.icon} alt={affector.name}/>

    {#snippet popoverContent()}
    {@render children?.()}
    {/snippet}

    {#if statEntries.flat().length > 0}
    {#snippet tooltipContent()}
    <UiNamedValueList entries={statEntries}/>
    {/snippet}
    {/if}
</UiPopTipButton>