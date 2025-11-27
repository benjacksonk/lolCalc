<script lang="ts">
    import { Affector } from "$lib/types.svelte";
    import { popupState } from "$lib/popupState.svelte";

    let {
        affectorQueue = $bindable(),
        affectorOptions
    } : {
        affectorQueue: Affector[],
        affectorOptions: Affector[]
    } = $props();

    let popup = $state<Node>();

    function handlemousedownOnPopupAnchor(event: MouseEvent) {
        event.preventDefault();
        popupState.currentPopup = (popupState.currentPopup == popup ? null : popup!);
    }

    function handleMouseDownOnItemOption(event: MouseEvent, affector: Affector) {
        event.preventDefault();
        affectorQueue.push(affector);
        if (popupState.currentPopup = popup!) {
            popupState.currentPopup = null;
        }
    }

    function removeAffector(event: MouseEvent, affectorIndex: number) {
        event.preventDefault();
        affectorQueue.splice(affectorIndex, 1);
    }
</script>



<div class="sheer AffectorSequenceUI">
    {#each affectorQueue as affector, i}
    <button class="sheer entityButton" onmousedown={(event) => removeAffector(event, i)}>
        <img src={affector.iconURL} alt={affector.name} class="icon min">
    </button>
    {/each}
    
    <div class="addAffectorButtonWrapper">
        <button onmousedown={handlemousedownOnPopupAnchor}>＋</button>
        
        <div 
        class="popup" 
        class:REMOVED={popupState.currentPopup != popup}
        bind:this={popup} style:display={popupState.currentPopup == popup ? "grid" : "none"}
        >
            {#each affectorOptions as affector, j (affector.name)}
            <button class="sheer entityBtn" onmousedown={(event) => handleMouseDownOnItemOption(event, affector)}>
                <img class="icon min" alt={affector.name} src={affector.iconURL}>
            </button>
            {/each}
        </div>
    </div>
</div>



<style>
    .AffectorSequenceUI {
        display: flex;
        flex-flow: row nowrap;
        gap: 1px;

        .addAffectorButtonWrapper {
            display: grid;
        }

        .popup {
            background: #111;
            border: 2px solid #555;
            grid-auto-rows: max-content;
            grid-template-columns: repeat(6, max-content);
            
            left: 100%;
            transform: translateX(-100%);
        }
    }

    .entityButton {
        display: grid;
        background: none;
        border: none;
    }
</style>