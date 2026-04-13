<script lang="ts">
    import { Affector } from "$lib/types.svelte";
    import UiAffectorIcon from "./UiAffectorIcon.svelte";

    let {
        affectorQueue = $bindable(),
        affectorOptions
    } : {
        affectorQueue: Affector[],
        affectorOptions: Affector[]
    } = $props();

    const uid = $props.id();

    function handleMouseDownOnItemOption(event: MouseEvent, affector: Affector) {
        event.preventDefault();
        affectorQueue.push(affector);
    }

    function removeAffector(event: MouseEvent, affectorIndex: number) {
        event.preventDefault();
        affectorQueue.splice(affectorIndex, 1);
    }
</script>



<div class="sheerBackground UiAffectorSequence">
    {#each affectorQueue as affector, i}
    <button class="entityButton" onmousedown={(event) => removeAffector(event, i)}>
        <UiAffectorIcon {affector} size="min" showNameOnHover={true} showStatsOnHover={false}/>
    </button>
    {/each}
    
    <div class="addAffectorButtonWrapper">
        <button class="plainTextButton" popovertarget={`addAffectorOptions-${uid}`}>＋</button>
        
        <div popover id={`addAffectorOptions-${uid}`} class="affectorOptions alignRightEdge">
            {#each affectorOptions as affector, j (affector.name)}
            <button class="entityButton plain" onmousedown={(event) => handleMouseDownOnItemOption(event, affector)}>
                <UiAffectorIcon {affector} size={"sml"} showNameOnHover={true} showStatsOnHover={false}/>
            </button>
            {/each}
        </div>
    </div>
</div>



<style lang="scss">
    .UiAffectorSequence {
        display: grid;
        grid-template-rows: repeat(2, minmax(0,1fr));
        grid-template-columns: repeat(auto-fill, var(--iconSizeMin));
        grid-auto-rows: minmax(0,1fr);
        gap: 1px;
    }

    .addAffectorButtonWrapper {
        display: grid;
    }

    .affectorOptions {
        overflow: visible;
        background: #111;
        border: 2px solid #2e2e2e;
        grid-auto-rows: max-content;
        grid-template-columns: repeat(6, max-content);

        &:popover-open {
            display: grid;
        }
    }

    .entityButton {
		transform-origin: bottom center;
        display: grid;
        grid-template: subgrid / subgrid;
        background: none;
        border: none;
        margin: 0;
        padding: 0;
    }
</style>