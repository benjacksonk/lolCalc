<script lang="ts">
    import { Ability, BuildConfig, DefiniteNumberMap, StatType, type GameDiff, Champion, DiffAtlas, Affector, Rune, DiffMap } from "$lib/types.svelte";
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

    function handleOnClickDeleteBuild(
        event: MouseEvent, 
        lastBuild: BuildConfig
    ) {
        event.preventDefault();
        buildConfigs.splice(buildConfigs.indexOf(lastBuild), 1);
    }
</script>



<main>
    <div class="sheerBackground champSpecs">
        <ChampSpecUI bind:champ bind:abilityRanks/>
        vs
        <TargetSpecUI bind:targetBaseStats/>
    </div>

    <div class="sheerBackground diffTable">
        {#snippet damageDiff(diffMap: DiffMap, diff: GameDiff)}
        <div class="sheerBackground effectOutcome">
            <div class="absoluteDamagePerGold">
                <span class="diffPart deltaDiff"><span class="operator">＋</span><span class="amount">{diff.damageDiff.toFixed(0)}</span></span>
                <span class="diffPart totalDiff"><span class="operator">＝</span><span class="amount">{diff.builtEndGameConfig.damageAggregate.toFixed(0)}</span></span>
                <span class="unit">damage</span>
            </div>

            <div class="relativeDamagePerGold">
                <span class="diffPart deltaDiff">
                    <span class="operator" class:negative={diff.absoluteDamageDiff_perGold - diffMap.min_absoluteDamageDiff_perGold < 0}>{diff.absoluteDamageDiff_perGold - diffMap.min_absoluteDamageDiff_perGold < 0 ? "－" : "＋"}</span>
                    <span class="amount" class:negative={(diff.absoluteDamageDiff_perGold - diffMap.min_absoluteDamageDiff_perGold) / diffMap.min_absoluteDamageDiff_perGold < 0}>{Math.abs(100 * ((diff.absoluteDamageDiff_perGold - diffMap.min_absoluteDamageDiff_perGold) / diffMap.min_absoluteDamageDiff_perGold)).toFixed(0)} % <span class="totalDiff">Δ</span></span>
                </span>

                <span class="diffPart totalDiff">
                    <span class="operator" class:negative={diff.damage_perGold < 0}>{diff.damage_perGold < 0 ? "－" : "＋"}</span>
                    <span class="amount" class:negative={(diff.damage_perGold - diffMap.min_damage_perGold) / diffMap.min_damage_perGold < 0}>{Math.abs(100 * ((diff.damage_perGold - diffMap.min_damage_perGold) / diffMap.min_damage_perGold)).toFixed(0)} %  Σ </span>
                </span>
                <span class="unit"> d∕kg</span>
            </div>
        </div>
        {/snippet}

        <div class="diffTableAbilities"
        style:grid-column-end={`span ${champ.abilities.length}`}
        >
            {#each champ.abilities as ability, i (ability.name)}
            <img src={ability.iconURL} alt={ability.name} class="sheerBackground icon med">
            {/each}
        </div>

        <div class="diffTableBuilds"
        style:grid-row-end={`span ${buildConfigs.length + 1}`}
        >
            {#each buildConfigs as buildConfig, i}
            <div class="buildContainer">
                <button class="button_deleteBuild plainTextButton"
                onmousedown={(event) => handleOnClickDeleteBuild(event, buildConfig)}
                disabled={buildConfigs.length <= 1}
                >𐌢</button>

                <BuildSpecUI 
                bind:buildConfig={buildConfigs[i]} buildIndex={i}
                derivedGameConfig={diffAtlas.get(null).get(buildConfig).builtInitialGameConfig}
                />
            </div>
            {/each}

            <button class="plainTextButton" style:display="grid"
            onmousedown={(event) => handleOnClickAddBuild(event, buildConfigs[buildConfigs.length - 1] ?? null)}
            >
            ＋
            </button>
        </div>
        
        <div class="diffsPerBuildPerAbility" 
        style:grid-row-end={`span ${buildConfigs.length}`}
        style:grid-column-end={`span ${champ.abilities.length}`}
        >
            {#each champ.abilities as ability}
            <div class="sheer diffColumn"
            style:grid-row={`span ${buildConfigs.length}`}
            >
                {#each buildConfigs as buildConfig}
                {@render damageDiff(diffAtlas.get(ability), diffAtlas.get(ability).get(buildConfig))}
                {/each}
            </div>
            {/each}
        </div>
        
        <div class="sequenceDiffsPerBuild" 
        style:grid-row-end={`span ${buildConfigs.length}`}
        style:grid-column-start={2 + champ.abilities.length}
        >
            <div class="sheer diffColumn" style:grid-row={`span ${buildConfigs.length}`}>
                {#each buildConfigs as buildConfig}
                {@render damageDiff(diffAtlas.get(null), diffAtlas.get(null).get(buildConfig))}
                {/each}
            </div>

            <div class="sequencesPerBuild" style:grid-row={`span ${buildConfigs.length}`}>
                {#each buildConfigs as buildConfig}
                <AffectorSequenceUI bind:affectorQueue={buildConfig.affectorQueue}
                affectorOptions={[...Affector.allBasicAffectors, ...champ.abilities, ...buildConfig.items.filter(item => item.effectsPerRank.length > 0), ...Rune.all]}
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
		font-family: var(--font-family-sans);
        color: #ccc;
        background-color: #111;
        overflow: hidden hidden;
        display: grid;

        gap: 2px;
        grid-template-rows: max-content;
    }

    .champSpecs {
        padding: 10px;
        display: grid;

        grid-auto-flow: column;
        grid-template-columns: minmax(0,1fr) max-content minmax(0,1fr);
        justify-content: center;
        align-items: center;
        gap: 20px;
    }
    
    .diffTable {
        overflow: hidden auto;
        padding: 10px 10px;
        display: grid;

        gap: 10px;
        grid-auto-rows: max-content;
        grid-template-columns: repeat(6, max-content);
        justify-content: stretch;
    }

    .diffTableAbilities {
        grid-row: 1;
        grid-column-start: 2;
        display: grid;

        grid-auto-flow: column;
        grid-template-rows: subgrid;
        grid-template-columns: subgrid;
        justify-items: center;
    }

    .diffTableBuilds {
        grid-row-start: 2;
        grid-column: 1;
        display: grid;
        
        gap: 10px;
        grid-template-rows: subgrid;
        grid-template-columns: subgrid;
    }

    .buildContainer {
        display: grid;
        grid-auto-flow: column;
        grid-template-columns: max-content;
        grid-auto-columns: auto;
    }

    .button_deleteBuild {
        display: grid;
        padding: 0 5px;
        color: #500;
        background-color: #a55;
        border: 2px solid #944;
        align-content: center;
        text-align: center;

        &[disabled] {
            filter: saturate(0);
        }

        &:not([disabled]):hover {
            background-color: #722;
            border-color: #944;
            color: #faa;
        }
    }

    .diffsPerBuildPerAbility,
    .sequenceDiffsPerBuild {
        display: grid;

        grid-row-start: 2;
        grid-column-end: span 2;
        grid-template-rows: subgrid;
        grid-template-columns: subgrid;
    }
    
    .diffColumn {
        display: grid;
        grid-template-rows: subgrid;
        grid-template-columns: max-content 1fr max-content;

        &:not(:hover) .absoluteDamagePerGold,
        &:hover .relativeDamagePerGold {
            visibility: hidden;
        }

        .effectOutcome,
        .absoluteDamagePerGold,
        .relativeDamagePerGold {
            display: grid;
        }

        .effectOutcome {
            grid-column: span 3;
            grid-template-columns: subgrid;
            align-content: center;
        }

        .absoluteDamagePerGold,
        .relativeDamagePerGold {
            grid-row: 1;
            grid-column: 1 / span 3;
            grid-template-columns: max-content 1fr max-content;
        }
    }

    .sequencesPerBuild {
        display: grid;
        grid-template: subgrid / subgrid;
    }

    .diffPart {
        grid-column: span 2;
        width: 100%;
        text-align: end;
        display: grid;
        grid-auto-flow: column;
        align-self: baseline;
        align-items: baseline;
        align-content: center;
        justify-content: stretch;
    }

    .negative {
        color: #f88;
    }

    .operator {
        width: max-content;
    }

    .amount {
        width: 100%;
    }

    .unit {
        grid-row: 1 / span 2;
        grid-column: 3;
        margin-left: 0.8ch;
        display: grid;
        justify-items: right;
        align-content: center;
        align-items: baseline;
    }
    
    .deltaDiff {
        color: #e2e2e2;
    }

    .unit,
    .totalDiff {
        color: #595959;
    }
</style>