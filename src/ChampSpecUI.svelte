<script lang="ts">
    import { ChampConfig } from "$lib/types.svelte";

    let {
        champConfig = $bindable()
    } : {
        champConfig: ChampConfig
    } = $props();

    let level: number 
    = $derived(champConfig.abilityRanks.values().reduce((a, b) => a + b, 0));
</script>



<div class="ChampSpecUI">
    <div class="champHerald">
        <div class="champOverview">
            <span class="champName">{champConfig.champ?.name}</span>
            <div class="champLevel">
                <span>Level {level}</span>
            </div>
        </div>
        <img src={champConfig.champ?.iconURL} alt="" class="icon max">
    </div>
    <div class="abilityControls">
        {#each champConfig.champ?.abilities as ability, i}
        <div class="abilityControl">
            <img src={ability.iconURL ?? ""} alt="" class="icon med">
            {#if champConfig.champ != null}
            <input class="levelControl abilityLevelControl" 
            type="number" min="0" max="5" step="1" defaultValue="0"
            bind:value={
            () => champConfig.abilityRanks.get(ability),
            (v) => champConfig.abilityRanks.set(ability, v)
            }>
            {/if}
        </div>
        {/each}
    </div>
</div>



<style>
    .ChampSpecUI {
        display: flex;

        flex-flow: row-reverse wrap;
        gap: 16px;
        justify-content: end;
        justify-items: end;
        align-content: center;
        align-items: center;
    }

    .champHerald {
        display: flex;
        
        flex-flow: "row nowrap";
        gap: 16px;
    }

    .levelControl {
    }

    .champOverview {
        grid-row: 1;
        grid-column: 2;
        display: flex;
        
        flex-flow: column nowrap;
        justify-content: center;
        align-items: center;
    }

    .abilityControls {
        grid-column: 1 / -1;
        display: flex;

        flex-flow: row nowrap;
        gap: 10px;

        .abilityControl {
            display: flex;

            flex-flow: column nowrap;
        }
    }
</style>