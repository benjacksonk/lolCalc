<script lang="ts">
    import { popupState } from "$lib/popupState.svelte";
    import { Affector, Item, type ItemConfigSet } from "$lib/types.svelte";
    import PopupUI from "./PopupUI.svelte";

    let {
        itemConfigSet = $bindable()
    } : {
        itemConfigSet: ItemConfigSet
    } = $props();

    const popupAnchors 
    = $state<[(Node|null),(Node|null),(Node|null),(Node|null),(Node|null),(Node|null)]>(
        [null,null,null,null,null,null]
    );

    function handlemousedownOnPopupAnchor(event: MouseEvent, popupAnchor: Node|null) {
        event.preventDefault();
        if (popupAnchor) {
            popupState.popupAnchors.add(popupAnchor);
        }
    }
</script>



<div class="sheer BuildSpec">
    {#each itemConfigSet as itemConfig, i}
    <button class="sheer slotBtn" bind:this={popupAnchors[i]} 
    onmousedown={(event) => handlemousedownOnPopupAnchor(event, popupAnchors[i])}
    >
        <img class="slotIcon" alt={itemConfig.item?.iconURL ?? "empty item slot"} src={itemConfig.item?.iconURL ?? "https://wiki.leagueoflegends.com/en-us/images/Enemy_Missing_ping.png"}>
    </button>
    
    {#if popupState.popupAnchors.has(popupAnchors[i])}
    <PopupUI anchorNode={popupAnchors[i]} 
    selectionDelegate={(item: Affector|null): void => { itemConfig.item = item as Item; }} 
    affectors={Item.all}
    />
    {/if}
    {/each}
</div>



<style>
    .BuildSpec {
        display: flex;
        flex-flow: row nowrap;
    }

    .slotIcon {
        width: 60px;
        height: 60px;
    }
</style>