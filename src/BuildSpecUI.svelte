<script lang="ts">
    import { popupState } from "$lib/popupState.svelte";
    import { Item, ItemSlotConfig, type ItemSlotConfigSet } from "$lib/types.svelte";
    import AffectorIcon from "./AffectorIcon.svelte";

    let {
        itemConfigSet = $bindable()
    } : {
        itemConfigSet: ItemSlotConfigSet
    } = $props();

    let popups
    : [Node|null,Node|null,Node|null,Node|null,Node|null,Node|null] 
    = $state([null,null,null,null,null,null]);

    function handlemousedownOnPopupAnchor(event: MouseEvent, popup: Node) {
        event.preventDefault();
        popupState.currentPopup = (popupState.currentPopup == popup ? null : popup);
    }

    function handleMouseDownOnItemOption(event: MouseEvent, popup: Node, itemConfig: ItemSlotConfig, item: Item) {
        event.preventDefault();
        itemConfig.item = item;
        if (popupState.currentPopup = popup) {
            popupState.currentPopup = null;
        }
    }
</script>



<div class="sheer BuildSpec">
    {#each itemConfigSet as itemConfig, i}
    <div>
        <button class="sheer entityBtn slotBtn" onmousedown={
            (event) => handlemousedownOnPopupAnchor(event, popups[i]!)
        }
        >
            <AffectorIcon affector={itemConfig.item} size="min" hasTooltip={true}/>
        </button>
        
        <div 
        class="popup" 
        class:REMOVED={popupState.currentPopup != popups[i]}
        bind:this={popups[i]} style:display={popupState.currentPopup == popups[i] ? "grid" : "none"}
        >
            {#each Item.all as item, j (item.name)}
            <button class="sheer entityBtn" onmousedown={(event) => handleMouseDownOnItemOption(event, popups[i]!, itemConfig, item)}>
                <AffectorIcon affector={item} size="min" hasTooltip={true}/>
            </button>
            {/each}
        </div>
    </div>
    {/each}
</div>



<style>
    .BuildSpec {
        display: flex;
        flex-flow: row nowrap;
        align-items: center;

        .popup {
            background: #111;
            border: 2px solid #555;
            grid-auto-rows: max-content;
            grid-template-columns: repeat(11, max-content);
            
            left: unset;
            transform: unset;
        }
    }

    .entityBtn {
        display: flex;
    }
</style>