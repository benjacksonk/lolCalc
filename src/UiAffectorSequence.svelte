<script lang="ts">
    import { Affector } from "$lib/types.svelte";
    import { preventDefault } from "svelte/legacy";
    import UiAffectorIcon from "./UiAffectorIcon.svelte";

    let {
        affectorQueue = $bindable(),
        affectorOptions
    } : {
        affectorQueue: Affector[],
        affectorOptions: Affector[]
    } = $props();

    const uid = $props.id();

    function appendAffectorApplication(affector: Affector) {
        affectorQueue.push(affector);
    }

    function removeAffectorApplication(affectorIndex: number) {
        affectorQueue.splice(affectorIndex, 1);
    }
</script>



<div class="UiAffectorSequence">
    {#each affectorQueue as affector, i}
    <UiAffectorIcon {affector} size="min" showNameOnHover={true} showStatsOnHover={false} 
    onmousedown={(e) => { e.preventDefault(); removeAffectorApplication(i); }}
    />
    {/each}
    
    <div class="addAffectorButtonWrapper">
        <button class="plainTextButton" popovertarget={`addAffectorOptions-${uid}`}>＋</button>
        
        <div popover id={`addAffectorOptions-${uid}`} class="affectorOptions">
            {#each affectorOptions as affector, j (affector.name)}
            <UiAffectorIcon {affector} size={"sub"} showNameOnHover={true} showStatsOnHover={false}
            onmousedown={(e) => { e.preventDefault(); appendAffectorApplication(affector); }}
            />
            {/each}
        </div>
    </div>
</div>



<style lang="scss">
    .UiAffectorSequence {
        // background: linear-gradient(in oklab to bottom, colors.hcl("blue", 2, 4), colors.hcl("blue", 2, 3));
        border-radius: 5px;
        display: grid;
        grid-template-rows: repeat(2, minmax(0,1fr));
        grid-template-columns: repeat(auto-fill, #{sizes.$icon-min});
        grid-auto-rows: minmax(0,1fr);
        gap: 2px;
        // padding: 2px;
    }

    .addAffectorButtonWrapper {
        display: grid;
    }

    .affectorOptions {
        overflow: visible;
        background: colors.gray(2);
        border: 2px solid colors.gray(12);
        border-radius: 3px;
        grid-auto-rows: max-content;
        grid-template-columns: repeat(6, max-content);
        position-area: bottom span-left;
        position-try-fallbacks: top span-left, left, right;

        &:popover-open {
            display: grid;
        }
    }
</style>