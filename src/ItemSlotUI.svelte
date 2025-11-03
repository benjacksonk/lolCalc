<script lang="ts">
    import { Item, type ItemConfig } from "$lib/types.svelte";

    let {
        itemConfig = $bindable()
    } : {
        itemConfig: ItemConfig
    } = $props();

    let removePopup: boolean = $state(true);

    function handleOnClickSlot(event: MouseEvent) {
        event.preventDefault();
        removePopup = !removePopup;
    }

    function handleOnClickItem(event: MouseEvent, newItem: Item|null) {
        event.preventDefault();
        itemConfig.item = newItem;
    }
</script>



<div class="ItemSlotUI">
    <button class="sheer slotBtn" onmousedown={handleOnClickSlot}>
        <img class="itemIcon" alt="" src={itemConfig.item?.iconURL ?? ""}>
    </button>

    <div class="sheer popup" class:removed={removePopup}>
        {#each [null, ...Item.all] as otherItem, i}
        <button class="sheer itemBtn"
        onmousedown={(event) => handleOnClickItem(event, otherItem)}
        >
            <img class="itemIcon" alt={otherItem?.name ?? ""} src={otherItem?.iconURL ?? ""}>
            <!-- <span class="itemName shadowText">{otherItem?.name ?? ""}</span> -->
        </button>
        {/each}
    </div>
</div>



<style>
    .ItemSlotUI {
        height: max-content;
        position: relative;
        display: block;
    }
    
    img.itemIcon {
        width: 60px;
        height: 60px;
    }

    button.slotBtn {
        display: block;
        /* border: 2px solid white; */
    }

    .popup {
        z-index: 1;
        width: max-content;
        height: max-content;
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        background-color: #111;
        outline: 1px solid white;
        display: grid;
        
        gap: 1px;
	    grid-template-columns: repeat(4, minmax(0,1fr));
    }

    button.itemBtn {
        /* padding: 0.5em; */
        display: grid;

        justify-items: center;
    }
    
    .itemName {
        width: min-content;
    }
</style>