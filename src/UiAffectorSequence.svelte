<script lang="ts">
    import { Affector } from "$lib/types.svelte";
    import UiAffectorPopTipButton from "./UiAffectorPopTipButton.svelte";
    import UiPopTipButton from "./UiPopTipButton.svelte";

    interface Props {
        affectorQueue: Affector[];
        affectorOptions: Affector[];
    }

    let {
        affectorQueue = $bindable(),
        affectorOptions
    }: Props = $props();

    function appendAffectorApplication(affector: Affector) {
        affectorQueue.push(affector);
    }

    function removeAffectorApplication(affectorIndex: number) {
        affectorQueue.splice(affectorIndex, 1);
    }
</script>



<div class="UiAffectorSequence">
    {#each affectorQueue as affector, i}
    <UiAffectorPopTipButton {affector} size={4} classes={"background-none border-none unround"} onmousedown={(e) => { 
        e.preventDefault(); 
        removeAffectorApplication(i); 
    }}/>
    {/each}

    <UiPopTipButton tooltipHeader="Add Action">
        {#snippet trigger({ props })}
        <button { ...props } class={"size-stretch"}>
            <span>＋</span>
        </button>
        {/snippet}
        
        {#snippet popoverContent()}
        <div class="affectorOptions">
            {#each affectorOptions as affector, j (affector.name)}
            <UiAffectorPopTipButton {affector} 
            size={5} 
            classes={"background-none border-none unround"} 
            onmousedown={(e) => { 
                e.preventDefault(); 
                appendAffectorApplication(affector); 
            }}/>
            {/each}
        </div>
        {/snippet}
    </UiPopTipButton>
</div>



<style lang="scss">
    .UiAffectorSequence {
        border-radius: 5px;
        display: grid;
        grid-template-rows: repeat(2, minmax(0,1fr));
        grid-template-columns: repeat(auto-fill, #{sizes.$icon-4});
        grid-auto-rows: minmax(0,1fr);
        gap: 2px;
    }

    .affectorOptions {
        overflow: visible;
        background: colors.gray(2);
        padding: 1px;
        grid-auto-rows: max-content;
        grid-template-columns: repeat(6, max-content);
        display: grid;
        gap: 1px;
    }
</style>