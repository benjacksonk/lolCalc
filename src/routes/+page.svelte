<script lang="ts">
    import { Ability, ChampConfig, Champion, BuildConfig, Effect, GameConfig, Stats, DefiniteNumberSvelteMap, Item } from "$lib/types.svelte";
    import { SvelteMap } from "svelte/reactivity";
    import BuildSpecUI from "../BuildSpecUI.svelte";
    import ChampSpecUI from "../ChampSpecUI.svelte";
    import TargetSpecUI from "../TargetSpecUI.svelte";
    import AffectorSequenceUI from "../AffectorSequenceUI.svelte";

    let champConfig: ChampConfig 
    = $state(new ChampConfig(Champion.champs.Ahri));

    let buildConfigs: BuildConfig[] 
    = $state([new BuildConfig()]);

    let targetBaseStats: Stats
    = $state(new Stats());

    let damageBuildless_perAbility: DefiniteNumberSvelteMap<Ability>
    = $derived.by(() => {
        let buildlessGameConfig = new GameConfig(null, champConfig, new BuildConfig(), targetBaseStats);
        
        return new DefiniteNumberSvelteMap<Ability>(
            buildlessGameConfig.champConfig.champ.abilities.map((ability, i): [Ability, number] => {
                let effects = ability.effectsPerRank[Math.max(0, buildlessGameConfig.champConfig.abilityRanks.get(ability) - 1)];
                let endGameConfig = Effect.processEffects(buildlessGameConfig, effects);
                return [ability, endGameConfig.netDamageDealtSum];
            })
        );
    });

    let damageAddedPerGold_perBuild_perAbility: SvelteMap<Ability, DefiniteNumberSvelteMap<BuildConfig>>
    = $derived.by(() => {
        let initialGameConfig_PerBuildConfig_map 
        = new SvelteMap(
            buildConfigs.map(buildConfig => [
                buildConfig, 
                new GameConfig(null, champConfig, buildConfig, targetBaseStats)
            ])
        );
        
        return new SvelteMap(champConfig.champ.abilities.map(
            (ability, aIndex): [Ability, DefiniteNumberSvelteMap<BuildConfig>] => {

                let build_gameConfigChange_map
                = new DefiniteNumberSvelteMap(buildConfigs.map(
                    (buildConfig, bIndex): [BuildConfig, number] => {

                        let effects: Effect[]
                        = ability.effectsPerRank[Math.max(0, champConfig.abilityRanks.get(ability) - 1)];

                        let endGameConfig: GameConfig 
                        = Effect.processEffects(initialGameConfig_PerBuildConfig_map.get(buildConfig)!, effects);

                        let damageAdded: number
                        = endGameConfig.netDamageDealtSum - damageBuildless_perAbility.get(ability);

                        let damageAddedPerGold: number 
                        = damageAdded / Math.max(1, endGameConfig.buildConfig.totalCost);

                        return [buildConfig, damageAddedPerGold];
                    }
                ));

                return [ability, build_gameConfigChange_map];
            }
        ));
    });

    let zeroORminNonZeroDamageAddedPerGoldPerBuild_perAbility: DefiniteNumberSvelteMap<Ability>
    = $derived(new DefiniteNumberSvelteMap<Ability>(
        damageAddedPerGold_perBuild_perAbility.entries()
        .map((entry): [Ability,number] => {
            let nonZeroValues = entry[1].values().filter(value => value > 0).toArray();
            let min = nonZeroValues.length > 0 ? Math.min(...nonZeroValues) : 0;
            return [entry[0], min];
        }).toArray()
    ));



    /**
    let damageBuildless_perBuildSequence: DefiniteNumberSvelteMap<BuildConfig>
    = $derived.by(() => {
        let buildlessGameConfig = new GameConfig(null, champConfig, new BuildConfig(), targetBaseStats);
        
        return new DefiniteNumberSvelteMap<BuildConfig>(
            buildConfigs.map((buildConfig, i): [BuildConfig, number] => {
                let damageFromAbilities: number 
                = buildConfig.affectorSequence
                .filter(affector => affector instanceof Ability)
                .map((ability): number => {
                    let effects = ability.effectsPerRank[Math.max(0, buildlessGameConfig.champConfig.abilityRanks.get(ability) - 1)];
                    let endGameConfig = Effect.processEffects(buildlessGameConfig, effects);
                    return endGameConfig.netDamageDealtSum;
                }).reduce((a,b) => a + b, 0);

                return [buildConfig, damageFromAbilities];
            })
        );
    });
    /**/

    let damageAddedPerGold_perBuildSequence: DefiniteNumberSvelteMap<BuildConfig>
    = $derived(new DefiniteNumberSvelteMap<BuildConfig>(buildConfigs.map(
        (buildConfig, bIndex): [BuildConfig, number] => {
            let buildlessEndGameConfig: GameConfig
            = Effect.processEffects(
                new GameConfig(null, champConfig, new BuildConfig(), targetBaseStats),
                buildConfig.affectorSequence
                .filter(affector => affector instanceof Ability)
                .flatMap(ability => ability.effectsPerRank[Math.max(0, champConfig.abilityRanks.get(ability) - 1)])
            );

            let builtEndGameConfig: GameConfig
            = Effect.processEffects(
                new GameConfig(null, champConfig, buildConfig, targetBaseStats),
                buildConfig.affectorSequence
                .flatMap(affector => {
                    if (affector instanceof Ability) {
                        return affector.effectsPerRank[Math.max(0, champConfig.abilityRanks.get(affector) - 1)];
                    }
                    else if (affector instanceof Item) {
                        return affector.effectsPerRank[buildConfig.itemConfigs.find(itemConfig => itemConfig.item == affector)!.rank]
                    }
                    else return [];
                })
            );

            let damageAddedPerGold: number
            = (builtEndGameConfig.netDamageDealtSum - buildlessEndGameConfig.netDamageDealtSum) 
            / Math.max(1, builtEndGameConfig.buildConfig.totalCost);

            return [buildConfig, damageAddedPerGold];
        }
    )));

    let zeroORminNonZeroDamageAddedPerGold_perBuildSequence: number
    = $derived.by(() => {
        let nonZeroValues: number[] 
        = buildConfigs
        .map(buildConfig => damageAddedPerGold_perBuildSequence.get(buildConfig))
        .filter(value => value > 0);

        return nonZeroValues.length > 0 ? Math.min(...nonZeroValues) : 0;
    });

    function handleOnClickAddBuild(
        event: MouseEvent, 
        lastBuild: BuildConfig|null
    ) {
        event.preventDefault();
        buildConfigs.push(lastBuild?.duplicate() ?? new BuildConfig());
    }
</script>



<main>
    <div class="sheer champSpecs">
        <ChampSpecUI bind:champConfig/>
        <TargetSpecUI bind:targetBaseStats/>
    </div>

    <div class="sheer buildsAndSequences">
        <!-- <div class="sheer"></div> -->
        <div class="sheer effectSequencer"
        style:grid-column-end={`span ${champConfig.champ.abilities.length}`}
        >
            {#each champConfig.champ.abilities as ability, i (ability.name)}
            <img src={ability.iconURL} alt={ability.name}
            style:width={"80px"}
            style:height={"80px"}
            >
             <!-- <AbilitySelectorUI playerConfig={initialPlayerConfig}/> -->
            {/each}
        </div>

        <div class="sheer buildSpecs"
        style:grid-row-end={`span ${buildConfigs.length + 1}`}
        >
            {#each buildConfigs as buildConfig, i}
            <BuildSpecUI bind:itemConfigSet={buildConfigs[i].itemConfigs}/>
            {/each}

            <button style:display="grid"
            onmousedown={(event) => handleOnClickAddBuild(event, buildConfigs[buildConfigs.length - 1] ?? null)}
            >
            +
            </button>
        </div>
        
        <div class="sheer abilityOutcomesPerBuild" 
        style:grid-row-end={`span ${buildConfigs.length}`}
        style:grid-column-end={`span ${champConfig.champ.abilities.length}`}
        >
            {#each buildConfigs as buildConfig, i}
            <div class="sheer abilityOutcomesForBuild"
            style:grid-column={`span ${champConfig.champ.abilities.length}`}
            >
                {#each champConfig.champ.abilities as ability, j (ability.name)}
                <div class="sheer effectOutcome">
                    <span>
                        ＋ {Math.round(1000 * (damageAddedPerGold_perBuild_perAbility.get(ability)?.get(buildConfig) ?? 0))} / kG
                    </span>

                    {#if zeroORminNonZeroDamageAddedPerGoldPerBuild_perAbility.get(ability) != 0}
                    <span>
                        ｘ {(damageAddedPerGold_perBuild_perAbility.get(ability)!.get(buildConfig) / zeroORminNonZeroDamageAddedPerGoldPerBuild_perAbility.get(ability)).toFixed(2)}
                    </span>
                    {/if}
                </div>
                {/each}
            </div>
            {/each}
        </div>
        
        <div class="sheer sequenceOutcomesPerBuild" 
        style:grid-row-end={`span ${buildConfigs.length}`}
        style:grid-column-start={2 + champConfig.champ.abilities.length}
        >
            {#each buildConfigs as buildConfig, i}
            <div class="sheer sequenceOutcomeForBuild">
                <div class="sheer effectOutcome">
                    <span>
                        ＋ {Math.round(1000 * damageAddedPerGold_perBuildSequence.get(buildConfig))} / kG
                    </span>

                    {#if zeroORminNonZeroDamageAddedPerGold_perBuildSequence != 0}
                    <span>
                        ｘ {(damageAddedPerGold_perBuildSequence.get(buildConfig) / zeroORminNonZeroDamageAddedPerGold_perBuildSequence).toFixed(2)}
                    </span>
                    {/if}
                </div>
            </div>

            <AffectorSequenceUI 
            bind:affectorSequence={buildConfig.affectorSequence}
            affectorOptions={[...champConfig.champ.abilities, ...buildConfig.items.filter(item => item.effectsPerRank.length > 0)]}
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
        display: grid;

        gap: 10px;
        grid-template-rows: max-content;
    }

    .champSpecs {
        display: grid;

        grid-auto-flow: column;
        grid-template-columns: repeat(auto-fit, minmax(0,auto));
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

        .sequenceOutcomeForBuild {
            display: grid;

            grid-template-rows: subgrid;
            grid-template-columns: subgrid;
        }
    }

    .effectOutcome {
        display: flex;

        flex-flow: column nowrap;
    }
</style>