<script lang="ts">
    import { Affector } from "$lib/types.svelte";
    import { popupState } from "$lib/popupState.svelte";
    import AffectorIcon from "./AffectorIcon.svelte";

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
    <button class="entityButton" onmousedown={(event) => removeAffector(event, i)}>
        <AffectorIcon {affector} size="min" showNameOnHover={true} showStatsOnHover={false}/>
    </button>
    {/each}
    
    <div class="addAffectorButtonWrapper">
        <button class="plainTextButton" onmousedown={handlemousedownOnPopupAnchor}>＋</button>
        
        <div 
        class="onPopup alignRightEdge" 
        class:REMOVED={popupState.currentPopup != popup}
        bind:this={popup} style:display={popupState.currentPopup == popup ? "grid" : "none"}
        >
            <div class="affectorOptions">
                {#each affectorOptions as affector, j (affector.name)}
                <button class="entityBtn plain" onmousedown={(event) => handleMouseDownOnItemOption(event, affector)}>
                    <AffectorIcon {affector} size={"sml"} showNameOnHover={true} showStatsOnHover={false}/>
                </button>
                {/each}
            </div>
        </div>
    </div>
</div>



<style>
    .AffectorSequenceUI {
        display: grid;
        grid-template-rows: repeat(2, minmax(0,1fr));
        grid-template-columns: repeat(auto-fill, var(--iconSizeMin));
        grid-auto-rows: minmax(0,1fr);
        gap: 1px;

        .addAffectorButtonWrapper {
            display: grid;
        }

        .affectorOptions {
            display: grid;
            background: #111;
            border: 2px solid #2e2e2e;
            grid-auto-rows: max-content;
            grid-template-columns: repeat(6, max-content);
        }
    }

    .entityButton {
        display: grid;
        background: none;
        border: none;
    }
</style>