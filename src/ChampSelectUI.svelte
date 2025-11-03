<script lang="ts">
    let {
    } : {
    } = $props();

    let showPopup: boolean = $state(false);

    function handleOnClickSlot(event: MouseEvent) {
        event.preventDefault();
        showPopup = !showPopup;
    }

    function handleOnClickMutagen(event: MouseEvent, mutagen: Mutagen) {
        event.preventDefault();
        mutagenSlot.mutagen = mutagen;
    }
</script>



<div class="ChampSelectUI">
    <button class="slotBtn plain" onmousedown={handleOnClickSlot}>
        <span class="slotBtnContents">
            <img alt="" src={champion?.iconPath ?? ""} height="64px" width="64px">
        </span>
    </button>
    <div class={showPopup ? "popup" : "removed popup"}>
        {#each mutagenSlot.inventory as champ, i}
        <button onmousedown={(event) => handleOnClickMutagen(event, champ)}>
            <img alt="" src={champ.iconPath} height="64px" width="64px">
            <span class="champName shadowText">{champ.name}</span>
        </button>
        {/each}
    </div>
</div>



<style>
    .ChampSelectUI {
        width: max-content;
        height: max-content;
        position: relative;
    }

    button.slotBtn {
        aspect-ratio: 1;
        width: max-content;
        height: max-content;
        /*border-radius: 50%;*/

        justify-content: center;
        align-items: center;
        background-color: var(--color-key-7);
        border: 2px solid var(--color-key-5);
        overflow: hidden;
    }
    
    button.slotBtn > .slotBtnContents {
        width: max-content;
        height: max-content;
    }

    .popup {
        z-index: 1;
        width: max-content;
        height: max-content;
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
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

    .champName {
        width: min-content;
        color: var(--color-key-1);
    }
</style>