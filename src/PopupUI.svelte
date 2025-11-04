<script lang="ts">
    import { popupState } from "$lib/popupState.svelte";
    import type { Affector } from "$lib/types.svelte";

    let {
        anchorNode,
        selectionDelegate,
        affectors
    } : {
        anchorNode: Node,
        selectionDelegate: (entity: Affector|null) => void,
        affectors: Affector[]
    } = $props();

    function handleMouseDown(event: MouseEvent, newEntity: Affector|null) {
        event.preventDefault();
        selectionDelegate(newEntity);
        popupState.popupAnchors.delete(anchorNode);
    }
</script>



<div class="PopupUI">
    {#each affectors as affector, i (affector.name)}
    <button class="sheer entityBtn" onmousedown={(event) => handleMouseDown(event, affector)}>
        <img class="entityIcon" alt={affector?.name ?? ""} src={affector?.iconURL ?? ""}>
    </button>
    {/each}
</div>



<style>
    .PopupUI {
        z-index: 1;
        width: max-content;
        height: max-content;
        position: absolute;
        /* top: 100%; */
        /* left: 50%; */
        /* transform: translateX(-50%); */
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
    
    img.entityIcon {
        width: 60px;
        height: 60px;
    }
</style>