<script lang="ts">
    import type { Ability } from "$lib/types.svelte";


    let {
        mutagenSlot = $bindable()
    } : {
        mutagenSlot: MutagenSlot
    } = $props();

    let removePopup: boolean = $state(true);

    function handleOnClickSlot(event: MouseEvent) {
        event.preventDefault();
        removePopup = !removePopup;
    }

    function handleOnClickMutagen(event: MouseEvent, ability: Ability) {
        event.preventDefault();
        mutagenSlot.mutagen = ability;
    }
</script>



<div class="AbilitySelectorUI">
    <button class="slotBtn plain" onmousedown={handleOnClickSlot}>
        <span class="slotBtnContents">
            <img alt="" src={mutagenSlot.mutagen === undefined ? "" : mutagenSlot.mutagen.iconPath} height="64px" width="64px">
        </span>
    </button>
    <div class="popup" class:removed={removePopup}>
    <!-- flowVertically=false tracks=3 trackSize="64px" gap="1px" -->
        {#each mutagenSlot.inventory as ability, i}
        <button class="mutagenBtn plain" onmousedown={(event) => handleOnClickMutagen(event, ability)}>
            <img alt="" src={ability.iconURL} height="64px" width="64px">
            <span class="mutagenName shadowText">{ability.name}</span>
        </button>
        {/each}
    </div>
</div>



<style>
    .AbilitySelectorUI {
        width: max-content;
        height: max-content;
        position: relative;
    }

    button.slotBtn {
        aspect-ratio: 1;
        width: max-content;
        height: max-content;
        /*border-radius: 50%;*/
        transform: rotate(45deg);

        justify-content: center;
        align-items: center;
        background-color: var(--color-key-7);
        border: 2px solid var(--color-key-5);
        overflow: hidden;
    }
    
    button.slotBtn > .slotBtnContents {
        width: max-content;
        height: max-content;
        transform: rotate(-45deg);
    }

    .popup {
        z-index: 1;
        width: max-content;
        height: max-content;
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        display: grid;

        justify-content: center;
    }

    .popup .frameGrid {
        background-color: var(--color-grey-6);
        outline: 1px solid white;
        display: flex;
        width: max-content;
    }

    button.mutagenBtn {
        width: 100%;
        height: 100%;
        display: grid;
        grid-auto-flow: row;
        justify-items: center;

        background-color: var(--color-key-8);
        padding: 0.5em;
    }

    .mutagenName {
        width: min-content;
        color: var(--color-key-1);
    }
</style>