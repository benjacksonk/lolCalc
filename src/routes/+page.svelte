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
            <div class="absoluteDamagePerGold">
                <span class="diffPart deltaDiff"><span class="operator">＋</span><span class="amount">{Math.round(diff.addedDamagePerGold * 1000)}</span><span class="unit">D/kG</span></span>
                <span class="diffPart totalDiff"><span class="operator">＝</span><span class="amount">{Math.round(diff.totalDamagePerGold * 1000)}</span><span class="unit">D/kG</span></span>
            </div>

            <div class="relativeDamagePerGold">
                <!-- {#if diffMins.addedDamagePerGold != 0 && diffMins.addedDamagePerGold != diff.addedDamagePerGold} -->
                <span class="diffPart deltaDiff"><span class="operator">＋</span><span class="amount">{(100 * (diff.addedDamagePerGold / diffMins.addedDamagePerGold - 1)).toFixed(1)}%</span><span class="unit">Δ D/kG</span></span>
                <!-- {/if} -->
                
                <!-- {#if diffMins.totalDamagePerGold != 0 && diffMins.totalDamagePerGold != diff.totalDamagePerGold} -->
                <span class="diffPart totalDiff"><span class="operator">＋</span><span class="amount">{(100 * (diff.totalDamagePerGold / diffMins.totalDamagePerGold - 1)).toFixed(1)}%</span><span class="unit">Σ D/kG</span></span>
                <!-- {/if} -->
            </div>
        </div>
        {/snippet}

        <div class="effectSequencer"
        style:grid-column-end={`span ${champ.abilities.length}`}
        >
            {#each champ.abilities as ability, i (ability.name)}
            <img src={ability.iconURL} alt={ability.name} class="sheer icon med">
            {/each}
        </div>

        <div class="buildSpecs"
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
        
        <div class="abilityOutcomesPerBuild" 
        style:grid-row-end={`span ${buildConfigs.length}`}
        style:grid-column-end={`span ${champ.abilities.length}`}
        >
            {#each champ.abilities as ability}
            <div class="sheer diffColumn abilityDiffsPerBuild"
            style:grid-row={`span ${buildConfigs.length}`}
            >
                {#each buildConfigs as buildConfig}
                {@render damageDiff(diffAtlas.get(ability).get(buildConfig), diffAtlas.get(ability).minsOrZeros)}
                {/each}
            </div>
            {/each}
        </div>
        
        <div class="sequenceOutcomesPerBuild" 
        style:grid-row-end={`span ${buildConfigs.length}`}
        style:grid-column-start={2 + champ.abilities.length}
        >
            <div class="sheer diffColumn affectorQueueDiffs" style:grid-row={`span ${buildConfigs.length}`}>
                {#each buildConfigs as buildConfig}
                {@render damageDiff(diffAtlas.get(null).get(buildConfig), diffAtlas.get(null).minsOrZeros)}
                {/each}
            </div>

            <div class="affectorQueues" style:grid-row={`span ${buildConfigs.length}`}>
                {#each buildConfigs as buildConfig}
                <AffectorSequenceUI bind:affectorQueue={buildConfig.affectorQueue}
                affectorOptions={[...champ.abilities, ...buildConfig.items.filter(item => item.effectsPerRank.length > 0)]}
                />
                {/each}
            </div>
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
        justify-items: center;
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

        .abilityDiffsPerBuild {
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
    
    .diffColumn {
        .absoluteDamagePerGold,
        .relativeDamagePerGold {
            display: flex;
            flex-flow: column nowrap;
        }
        &:not(:hover) .absoluteDamagePerGold,
        &:hover .relativeDamagePerGold {
            visibility: hidden;
        }

        .effectOutcome {
            display: grid;
            align-content: center;
        }

        .absoluteDamagePerGold,
        .relativeDamagePerGold {
            grid-row: 1;
            grid-column: 1;
            display: grid;
        }
    }

    .affectorQueueDiffs,
    .affectorQueues {
        display: grid;
        grid-template: subgrid / subgrid;
    }

    .diffPart {
        width: 100%;
        text-align: end;
        display: grid;
        grid-auto-flow: column;
        grid-template-columns: max-content 1fr max-content;
        gap: 0 1ch;
        align-items: baseline;
        justify-content: stretch;
    }

    .operator {
        width: max-content;
        margin-right: -0.4ch;
    }

    .amount {
        width: 100%;
    }

    .unit {
        width: max-content;
        display: flex;
        flex-flow: row nowrap;
        align-content: baseline;
    }
    
    .deltaDiff {
        color: #e2e2e2;

        .operator, 
        .unit {
            color: #868686;
        }
    }

    .totalDiff {
        color: #595959;
    }
</style>