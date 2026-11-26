<script lang="ts">
    import { Item, type Affector } from "$lib/types.svelte";
    import type { HTMLButtonAttributes } from "svelte/elements";
    import UiNamedValueList from "./UiNamedValueList.svelte";
    import UiPopTipButton from "./UiPopTipButton.svelte";
    import UiIcon from "./UiIcon.svelte";
    import type { Snippet } from "svelte";
    
    interface Props extends HTMLButtonAttributes {
        zoom?: number;
        affector: Affector;
        size: 0|1|2|3|4|5|6|7|8|9;
        classes?: string;
        children?: Snippet;
    }

    let {
        zoom = 1.125,
        affector,
        size,
        classes = "",
        children,
        ...rest
    }: Props = $props();

    let statEntries = $derived<[ArrayLike<[string, number]>, ArrayLike<[string, number]>]>([
        (affector instanceof Item ? [["Gold", affector.price]] : []),
        affector.stats.entries().toArray()
    ]);
</script>



<UiPopTipButton tooltipHeader={affector.name}>
    {#snippet trigger({ props })}
    <button style:--zoom={zoom} { ...props } class={classes} {...rest}>
        <UiIcon {size} src={affector.icon} alt={affector.name} classes={"unround"}/>
    </button>
    {/snippet}

    {#snippet popoverContent()}
    {@render children?.()}
    {/snippet}

    {#snippet tooltipContent()}
    {#if statEntries.flat().length > 0}
    <UiNamedValueList entries={statEntries}/>
    {/if}
    {/snippet}
</UiPopTipButton>