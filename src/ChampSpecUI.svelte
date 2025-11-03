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



<div class="sheer ChampSpecUI" style:flex-flow={"row wrap"}>
    <div class="champHerald" style:flex-flow={"row-reverse nowrap"}>
        <div class="champOverview" style:grid-column={"2"}>
            <span class="champName">{champConfig.champ?.name}</span>
            <div class="champLevel">
                <span>Level {level}</span>
            </div>
        </div>
        <img src={champConfig.champ?.iconURL} alt="" class="champIcon">
    </div>
    <div class="abilityControls">
        {#each champConfig.champ?.abilities as ability, i}
        <div class="abilityControl">
            <img src={ability.iconURL ?? ""} alt="" class="abilityIcon">
            {#if champConfig.champ != null}
            <input class="levelControl abilityLevelControl" 
            type="number" min="0" max="5" step="1" defaultValue="0"
            bind:value={champConfig.abilityRanks[i]} 
            >
            {/if}
        </div>
        {/each}
    </div>
</div>



<style>
    .ChampSpecUI {
        display: flex;
        
        gap: 16px;
        justify-content: center;
        align-content: center;
        justify-items: center;
        align-items: center;
    }

    .champHerald {
        display: flex;
        gap: 16px;
    }

    .levelControl {
    }

    .champIcon {
        width: 100px;
        height: 100px;
    }

    .champOverview {
        grid-row: 1;
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

        .abilityIcon {
            width: 60px;
            height: 60px;
        }
    }
</style>