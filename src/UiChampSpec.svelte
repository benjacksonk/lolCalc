<script lang="ts">
    import { Ability, Champion, DefiniteNumberMap } from "$lib/types.svelte";

    let {
        champ = $bindable(),
        abilityRanks = $bindable()
    } : {
        champ: Champion,
        abilityRanks: DefiniteNumberMap<Ability>
    } = $props();

    let level: number 
    = $derived(abilityRanks.values().reduce((a, b) => a + b, 0));
</script>



<div class="UiChampSpec">
    <div class="champHerald">
        <div class="champOverview">
            <b class="champName">{champ.name}</b>
            <div class="champLevel">
                <span>Level {level}</span>
            </div>
        </div>
        <img src={champ.icon} alt="" class="icon size-9 semiround lightSheerBorder">
    </div>
    <div class="abilityControls">
        {#each champ.abilities as ability, i}
        <div class="abilityControl">
            <img src={ability.icon ?? ""} alt="" class="icon size-5 semiround lightSheerBorder">
            
            <input class="levelControl abilityLevelControl semiround" 
            type="number" min="0" max="5" step="1" defaultValue="0"
            bind:value={
            () => abilityRanks.get(ability),
            (v) => abilityRanks.set(ability, v)
            }>
        </div>
        {/each}
    </div>
</div>



<style lang="scss">
    .UiChampSpec {
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
        gap: 6px;

        .abilityControl {
            display: flex;

            flex-flow: column nowrap;
        }
    }
</style>