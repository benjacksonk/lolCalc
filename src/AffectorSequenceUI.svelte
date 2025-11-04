<script lang="ts">
    import { Affector } from "$lib/types.svelte";
    import EntitySlotUI from "./EntitySlotUI.svelte";
    import PopupUI from "./PopupUI.svelte";
    import { popupState } from "$lib/popupState.svelte";

    let {
        affectorSequence = $bindable(),
        affectorOptions
    } : {
        affectorSequence: Affector[],
        affectorOptions: Affector[]
    } = $props();

    let popupAnchor = $state<Node>();

    function handlemousedownOnPopupAnchor(event: MouseEvent) {
        event.preventDefault();
        if (popupAnchor) {
            popupState.popupAnchors.add(popupAnchor);
        }
    }
</script>



<div class="sheer AffectorSequenceUI">
    {#each affectorSequence as affector, i}
    <img src={affector.iconURL} alt={affector.name} style:width={"50px"} style:height={"50px"}>
    <!-- <div class="sheer" style:width={"80px"} style:height={"80px"}>
    <EntitySlotUI bind:chosenEntity={affectorSequence[i]} entities={affectorOptions}/>
    </div> -->
    {/each}
    
    <button bind:this={popupAnchor} onmousedown={handlemousedownOnPopupAnchor}>＋</button>
    
    {#if popupState.popupAnchors.has(popupAnchor)}
    <PopupUI anchorNode={popupAnchor} affectors={affectorOptions} 
    selectionDelegate={
        (affector: Affector|null): void => {
            if (affector) { affectorSequence.push(affector); }
        }
    }
    />
    {/if}
</div>



<style>
    .AffectorSequenceUI {
        display: flex;
        flex-flow: row nowrap;
    }
</style>