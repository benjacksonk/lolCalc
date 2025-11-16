<script lang="ts">
    import { Ability, BuildConfig, DefiniteNumberMap, StatType, type GameDiff, Champion, DiffAtlas } from "$lib/types.svelte";
    import BuildSpecUI from "../BuildSpecUI.svelte";
    import ChampSpecUI from "../ChampSpecUI.svelte";
    import TargetSpecUI from "../TargetSpecUI.svelte";
    import AffectorSequenceUI from "../AffectorSequenceUI.svelte";

    let champ: Champion 
    = $state(Champion.all[0]);

    let abilityRanks: DefiniteNumberMap<Ability>
    = $state(new DefiniteNumberMap());

    let targetBaseStats: DefiniteNumberMap<StatType>
    = $state(new DefiniteNumberMap());

    let buildConfigs: BuildConfig[] 
    = $state([new BuildConfig()]);

    let diffAtlas: DiffAtlas 
    = $derived(new DiffAtlas(champ, abilityRanks, targetBaseStats, buildConfigs));

    function handleOnClickAddBuild(
        event: MouseEvent, 
        lastBuild: BuildConfig
    ) {
        event.preventDefault();
        buildConfigs.push(new BuildConfig(lastBuild));
    }
</script>



<main>
    <div class="sheer champSpecs">
        <ChampSpecUI bind:champ bind:abilityRanks/>
        <TargetSpecUI bind:targetBaseStats/>
    </div>

    <div class="sheer buildsAndSequences">
        {#snippet damageDiff(diff: GameDiff, diffMins: GameDiff)}
        <div class="sheer effectOutcome">
            <span>＋{Math.round(diff.addedDamagePerGold * 1000)} /kG
            {#if diffMins.addedDamagePerGold != 0
              && diffMins.addedDamagePerGold != diff.addedDamagePerGold
            }
            ∶{(diff.addedDamagePerGold / diffMins.addedDamagePerGold).toFixed(2)}
            {/if}
            </span>

            <span>＝{Math.round(diff.totalDamagePerGold * 1000)} /kG
            {#if diffMins.totalDamagePerGold != 0
              && diffMins.totalDamagePerGold != diff.totalDamagePerGold
            }
            ∶{(diff.totalDamagePerGold / diffMins.totalDamagePerGold).toFixed(2)}
            {/if}
            </span>
        </div>
        {/snippet}

        <div class="sheer effectSequencer"
        style:grid-column-end={`span ${champ.abilities.length}`}
        >
            {#each champ.abilities as ability, i (ability.name)}
            <img src={ability.iconURL} alt={ability.name} class="icon med">
            {/each}
        </div>

        <div class="sheer buildSpecs"
        style:grid-row-end={`span ${buildConfigs.length + 1}`}
        >
            {#each buildConfigs as buildConfig, i}
            <BuildSpecUI bind:itemConfigSet={buildConfigs[i].itemSlots}/>
            {/each}

            <button style:display="grid"
            onmousedown={(event) => handleOnClickAddBuild(event, buildConfigs[buildConfigs.length - 1] ?? null)}
            >
            ＋
            </button>
        </div>
        
        <div class="sheer abilityOutcomesPerBuild" 
        style:grid-row-end={`span ${buildConfigs.length}`}
        style:grid-column-end={`span ${champ.abilities.length}`}
        >
            {#each buildConfigs as buildConfig, i}
            <div class="sheer abilityOutcomesForBuild"
            style:grid-column={`span ${champ.abilities.length}`}
            >
                {#each champ.abilities as ability, j (ability.name)}
                {@render damageDiff(diffAtlas.get(ability).get(buildConfig), diffAtlas.get(ability).minsOrZeros)}
                {/each}
            </div>
            {/each}
        </div>
        
        <div class="sheer sequenceOutcomesPerBuild" 
        style:grid-row-end={`span ${buildConfigs.length}`}
        style:grid-column-start={2 + champ.abilities.length}
        >
            {#each buildConfigs as buildConfig, i}
            {@render damageDiff(diffAtlas.get(null).get(buildConfig), diffAtlas.get(null).minsOrZeros)}

            <AffectorSequenceUI bind:affectorQueue={buildConfig.affectorQueue}
            affectorOptions={[...champ.abilities, ...buildConfig.items.filter(item => item.effectsPerRank.length > 0)]}
            />
            {/each}
        </div>
    </div>
</main>



<style>
    main {
        width: 100%;
        height: 100%;
        color: #ccc;
        background-color: #111;
        /* overflow: hidden; */
        display: grid;

        gap: 10px;
        grid-template-rows: max-content;
    }

    .champSpecs {
        display: grid;

        grid-auto-flow: column;
        grid-template-columns: repeat(auto-fit, minmax(0,1fr));
        justify-content: center;
        gap: 40px;
    }
    
    .buildsAndSequences {
        display: grid;

        gap: 10px;
        grid-auto-rows: max-content;
        grid-auto-columns: max-content;
    }

    .effectSequencer {
        grid-row: 1;
        grid-column-start: 2;
        display: grid;

        grid-auto-flow: column;
        grid-template-rows: subgrid;
        grid-template-columns: subgrid;
    }

    .buildSpecs {
        grid-row-start: 2;
        grid-column: 1;
        display: grid;
        
        gap: 10px;
        grid-template-rows: subgrid;
        grid-template-columns: subgrid;
    }

    .abilityOutcomesPerBuild {
        display: grid;

        grid-row-start: 2;
        grid-column-start: 2;
        grid-template-rows: subgrid;
        grid-template-columns: subgrid;

        .abilityOutcomesForBuild {
            display: grid;

            grid-template-rows: subgrid;
            grid-template-columns: subgrid;
        }
    }

    .sequenceOutcomesPerBuild {
        display: grid;

        grid-row-start: 2;
        grid-column-end: span 2;
        grid-template-rows: subgrid;
        grid-template-columns: subgrid;
    }

    .effectOutcome {
        display: flex;

        flex-flow: column nowrap;
    }
</style>