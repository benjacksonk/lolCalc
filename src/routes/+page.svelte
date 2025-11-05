<script lang="ts">
    import { Ability, ChampConfig, Champion, BuildConfig, GameConfig, Stats, DefiniteNumberSvelteMap } from "$lib/types.svelte";
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



    let damageDiffVsUnbuilt_perBuild_perAbility
    = $derived(new SvelteMap(champConfig.champ.abilities.map((ability) => {

        let damageDiffVsUnbuilt
        = new SvelteMap(buildConfigs.map((buildConfig) => {

            let gameConfig = new GameConfig(
                null, 
                champConfig, 
                buildConfig.duplicate(), 
                targetBaseStats
            );
            gameConfig.buildConfig.affectorSequence = [ability];

            return [buildConfig, gameConfig.evaluateSequencedDamageDiffVsUnbuilt()];
        }));

        return [ability, damageDiffVsUnbuilt];
    })));

    let zeroOrMinDamageDiffsVsUnbuilt_perAbility
    : Map<Ability, ReturnType<typeof GameConfig.evaluateSequencedDamageDiffVsUnbuilt>>
    = $derived(new SvelteMap(
        champConfig.champ.abilities.map(
            (ability) => {
                let nonzeroMinTotalDamages = damageDiffVsUnbuilt_perBuild_perAbility.get(ability)!.values().map(value => value.totalDamage).filter(value => value > 0).toArray();
                let minTotalDamage = nonzeroMinTotalDamages.length > 0 ? Math.min(...nonzeroMinTotalDamages) : 0;

                let nonzeroMinTotalDamagesPerGold = damageDiffVsUnbuilt_perBuild_perAbility.get(ability)!.values().map(value => value.totalDamagePerGold).filter(value => value > 0).toArray();
                let minTotalDamagePerGold = nonzeroMinTotalDamagesPerGold.length > 0 ? Math.min(...nonzeroMinTotalDamagesPerGold) : 0;

                let nonzeroMinAddedDamages = damageDiffVsUnbuilt_perBuild_perAbility.get(ability)!.values().map(value => value.addedDamage).filter(value => value > 0).toArray();
                let minAddedDamage = nonzeroMinAddedDamages.length > 0 ? Math.min(...nonzeroMinAddedDamages) : 0;

                let nonzeroMinAddedDamagesPerGold = damageDiffVsUnbuilt_perBuild_perAbility.get(ability)!.values().map(value => value.addedDamagePerGold).filter(value => value > 0).toArray();
                let minAddedDamagePerGold = nonzeroMinAddedDamagesPerGold.length > 0 ? Math.min(...nonzeroMinAddedDamagesPerGold) : 0;

                return [ability, {
                    totalDamage: minTotalDamage,
                    totalDamagePerGold: minTotalDamagePerGold,
                    addedDamage: minAddedDamage,
                    addedDamagePerGold: minAddedDamagePerGold
                }];
            }
        )
    ));



    let damageDiffVsUnbuilt_perBuildConfigSequence
    = $derived(new SvelteMap(buildConfigs.map(buildConfig => {
        let gameConfig = new GameConfig(null, champConfig, buildConfig, targetBaseStats);
        return [buildConfig, gameConfig.evaluateSequencedDamageDiffVsUnbuilt()];
    })));

    let zeroOrMinDamageDiffsVsUnbuiltOfSequences
    : ReturnType<typeof GameConfig.evaluateSequencedDamageDiffVsUnbuilt>
    = $derived.by(() => {
        let nonzeroMinTotalDamages = damageDiffVsUnbuilt_perBuildConfigSequence.values().map(value => value.totalDamage).filter(value => value > 0).toArray();
        let minTotalDamage = nonzeroMinTotalDamages.length > 0 ? Math.min(...nonzeroMinTotalDamages) : 0;

        let nonzeroMinTotalDamagesPerGold = damageDiffVsUnbuilt_perBuildConfigSequence.values().map(value => value.totalDamagePerGold).filter(value => value > 0).toArray();
        let minTotalDamagePerGold = nonzeroMinTotalDamagesPerGold.length > 0 ? Math.min(...nonzeroMinTotalDamagesPerGold) : 0;

        let nonzeroMinAddedDamages = damageDiffVsUnbuilt_perBuildConfigSequence.values().map(value => value.addedDamage).filter(value => value > 0).toArray();
        let minAddedDamage = nonzeroMinAddedDamages.length > 0 ? Math.min(...nonzeroMinAddedDamages) : 0;

        let nonzeroMinAddedDamagesPerGold = damageDiffVsUnbuilt_perBuildConfigSequence.values().map(value => value.addedDamagePerGold).filter(value => value > 0).toArray();
        let minAddedDamagePerGold = nonzeroMinAddedDamagesPerGold.length > 0 ? Math.min(...nonzeroMinAddedDamagesPerGold) : 0;

        return {
            totalDamage: minTotalDamage,
            totalDamagePerGold: minTotalDamagePerGold,
            addedDamage: minAddedDamage,
            addedDamagePerGold: minAddedDamagePerGold
        };
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
                    {#if damageDiffVsUnbuilt_perBuild_perAbility.get(ability)?.get(buildConfig)}
                    
                    <span>＝ {Math.round(damageDiffVsUnbuilt_perBuild_perAbility.get(ability)!.get(buildConfig)!.totalDamagePerGold * 1000)} / kG</span>
                    {#if zeroOrMinDamageDiffsVsUnbuilt_perAbility.get(ability)!.totalDamagePerGold != 0}
                    <span>(ｘ {(damageDiffVsUnbuilt_perBuild_perAbility.get(ability)!.get(buildConfig)!.totalDamagePerGold / zeroOrMinDamageDiffsVsUnbuilt_perAbility.get(ability)!.totalDamagePerGold).toFixed(2)})</span>
                    {/if}

                    <span>＋ {Math.round(damageDiffVsUnbuilt_perBuild_perAbility.get(ability)!.get(buildConfig)!.addedDamagePerGold * 1000)} / kG</span>
                    {#if zeroOrMinDamageDiffsVsUnbuilt_perAbility.get(ability)!.addedDamagePerGold != 0}
                    <span>(ｘ {(damageDiffVsUnbuilt_perBuild_perAbility.get(ability)!.get(buildConfig)!.addedDamagePerGold / zeroOrMinDamageDiffsVsUnbuilt_perAbility.get(ability)!.addedDamagePerGold).toFixed(2)})</span>
                    {/if}

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
                    {#if damageDiffVsUnbuilt_perBuildConfigSequence.get(buildConfig)}
                    
                    <span>＝ {Math.round(damageDiffVsUnbuilt_perBuildConfigSequence.get(buildConfig)!.totalDamagePerGold * 1000)} / kG</span>
                    {#if zeroOrMinDamageDiffsVsUnbuiltOfSequences.totalDamagePerGold != 0}
                    <span>(ｘ {(damageDiffVsUnbuilt_perBuildConfigSequence.get(buildConfig)!.totalDamagePerGold / zeroOrMinDamageDiffsVsUnbuiltOfSequences.totalDamagePerGold).toFixed(2)})</span>
                    {/if}

                    <span>＋ {Math.round(damageDiffVsUnbuilt_perBuildConfigSequence.get(buildConfig)!.addedDamagePerGold * 1000)} / kG</span>
                    {#if zeroOrMinDamageDiffsVsUnbuiltOfSequences.addedDamagePerGold != 0}
                    <span>(ｘ {(damageDiffVsUnbuilt_perBuildConfigSequence.get(buildConfig)!.addedDamagePerGold / zeroOrMinDamageDiffsVsUnbuiltOfSequences.addedDamagePerGold).toFixed(2)})</span>
                    {/if}

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