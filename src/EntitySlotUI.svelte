<script lang="ts">
    import type { Entity } from "$lib/types.svelte";

    let {
        chosenEntity = $bindable(),
        entities = []
    } : {
        chosenEntity: any,
        entities: Entity[]
    } = $props();

    let removePopup: boolean = $state(true);

    function handleOnClickSlot(event: MouseEvent) {
        event.preventDefault();
        removePopup = !removePopup;
    }

    function handleOnClickItem(event: MouseEvent, newChoice: any) {
        event.preventDefault();
        chosenEntity = newChoice;
    }
</script>



<div class="EntitySlotUI">
    <button class="sheer slotBtn" onmousedown={handleOnClickSlot}>
        <img class="entityIcon" alt="" src={chosenEntity?.iconURL ?? ""}>
    </button>

    <div class="sheer popup" class:removed={removePopup}>
        {#each entities as entity, i}
        <button class="sheer entityBtn"
        onmousedown={(event) => handleOnClickItem(event, entity)}
        >
            <img class="entityIcon" alt={entity.name} src={entity.iconURL}>
        </button>
        {/each}
    </div>
</div>



<style>
    .EntitySlotUI {
        height: max-content;
        position: relative;
        display: block;
    }
    
    img.entityIcon {
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

    button.entityBtn {
        /* padding: 0.5em; */
        display: grid;

        justify-items: center;
    }
</style>