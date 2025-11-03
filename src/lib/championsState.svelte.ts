// import { Mutation, MutationSlot } from "$lib/types.svelte";
import championDataArray from "$lib/championData.json"
// import { toIdString } from "$lib/common.svelte";

export const championState = $state(generateChampions());

function generateChampions() {
    let champions = [
        new Champion("Ahri"),
    ];
    
    return { champions: champions };
}