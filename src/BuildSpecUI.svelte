<script lang="ts">
    import { type ItemConfigSet } from "$lib/types.svelte";
    import ItemSlotUI from "./ItemSlotUI.svelte";

    let {
        itemConfigSet = $bindable()
    } : {
        itemConfigSet: ItemConfigSet
    } = $props();
</script>



<div class="sheer BuildSpec">
    {#each itemConfigSet as itemConfig, i}
    <ItemSlotUI bind:itemConfig={itemConfigSet[i]}/>
    {/each}
</div>



<style>
    .BuildSpec {
        display: flex;
        flex-flow: row nowrap;
    }
</style>