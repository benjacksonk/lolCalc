<script lang="ts">
    import { Ability, ChampConfig, BuildConfig, DefiniteDiffMap, DefiniteNumberMap, StatType, OriginGameConfig } from "$lib/types.svelte";
    import { SvelteMap } from "svelte/reactivity";
    import BuildSpecUI from "../BuildSpecUI.svelte";
    import ChampSpecUI from "../ChampSpecUI.svelte";
    import TargetSpecUI from "../TargetSpecUI.svelte";
    import AffectorSequenceUI from "../AffectorSequenceUI.svelte";

    let champConfig: ChampConfig 
    = $state(new ChampConfig());

    let buildConfigs: BuildConfig[] 
    = $state([new BuildConfig()]);

    let targetBaseStats: DefiniteNumberMap<StatType>
    = $state(new DefiniteNumberMap<StatType>());

    let damageDiffPerBuildConfig_perAbility: SvelteMap<Ability, DefiniteDiffMap>
    = $derived(new SvelteMap(champConfig.champ.abilities.map(
        ability => {
            let build_diff_map: DefiniteDiffMap 
            = new DefiniteDiffMap(buildConfigs.map(
                buildConfig => {
                    let originGameConfig: OriginGameConfig
                    = new OriginGameConfig(null, {
                        champConfig: champConfig,
                        buildConfig: new BuildConfig(buildConfig, {
                            affectorQueue: [ability]
                        }),
                        targetBaseStats: targetBaseStats
                    });

                    return [buildConfig, originGameConfig.evaluateSequencedDamageDiffVsUnbuilt()];
                }
            ));
            
            return [ability, build_diff_map];
        }
    )));

    let damageDiffPerBuildConfigSequence: DefiniteDiffMap
    = $derived(new DefiniteDiffMap(
        buildConfigs.map(buildConfig => {
            let originGameConfig: OriginGameConfig
            = new OriginGameConfig(null, {
                champConfig: champConfig,
                buildConfig: buildConfig,
                targetBaseStats: targetBaseStats
            });

            return [buildConfig, originGameConfig.evaluateSequencedDamageDiffVsUnbuilt()]
        })
    ));

    function handleOnClickAddBuild(
        event: MouseEvent, 
        lastBuild: BuildConfig|null
    ) {
        event.preventDefault();
        buildConfigs.push(new BuildConfig(lastBuild));
    }
</script>



<main>
    <div class="sheer champSpecs">
        <ChampSpecUI bind:champConfig/>
        <TargetSpecUI bind:targetBaseStats/>
    </div>

    <div class="sheer buildsAndSequences">
        {#snippet damageDiff(definiteDamageDiffSvelteMap: DefiniteDiffMap, buildConfig: BuildConfig)}
        <div class="sheer effectOutcome">
            <span>＋{Math.round(definiteDamageDiffSvelteMap.get(buildConfig).addedDamagePerGold * 1000)} /kG
            {#if definiteDamageDiffSvelteMap.minsOrZeros.addedDamagePerGold != 0
              && definiteDamageDiffSvelteMap.minsOrZeros.addedDamagePerGold != definiteDamageDiffSvelteMap.get(buildConfig).addedDamagePerGold
            }
            ∶{(definiteDamageDiffSvelteMap.get(buildConfig).addedDamagePerGold / definiteDamageDiffSvelteMap.minsOrZeros.addedDamagePerGold).toFixed(2)}
            {/if}
            </span>

            <span>＝{Math.round(definiteDamageDiffSvelteMap.get(buildConfig).totalDamagePerGold * 1000)} /kG
            {#if definiteDamageDiffSvelteMap.minsOrZeros.totalDamagePerGold != 0
              && definiteDamageDiffSvelteMap.minsOrZeros.totalDamagePerGold != definiteDamageDiffSvelteMap.get(buildConfig).totalDamagePerGold
            }
            ∶{(definiteDamageDiffSvelteMap.get(buildConfig).totalDamagePerGold / definiteDamageDiffSvelteMap.minsOrZeros.totalDamagePerGold).toFixed(2)}
            {/if}
            </span>
        </div>
        {/snippet}

        <!-- <div class="sheer"></div> -->
        <div class="sheer effectSequencer"
        style:grid-column-end={`span ${champConfig.champ.abilities.length}`}
        >
            {#each champConfig.champ.abilities as ability, i (ability.name)}
            <img src={ability.iconURL} alt={ability.name} class="icon med">
             <!-- <AbilitySelectorUI playerConfig={initialPlayerConfig}/> -->
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
        style:grid-column-end={`span ${champConfig.champ.abilities.length}`}
        >
            {#each buildConfigs as buildConfig, i}
            <div class="sheer abilityOutcomesForBuild"
            style:grid-column={`span ${champConfig.champ.abilities.length}`}
            >
                {#each champConfig.champ.abilities as ability, j (ability.name)}
                {#if damageDiffPerBuildConfig_perAbility.has(ability)}
                {@render damageDiff(damageDiffPerBuildConfig_perAbility.get(ability)!, buildConfig)}
                {:else}
                <div class="sheer"></div>
                {/if}
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
                {@render damageDiff(damageDiffPerBuildConfigSequence, buildConfig)}
            </div>

            <AffectorSequenceUI 
            bind:affectorSequence={buildConfig.affectorQueue}
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