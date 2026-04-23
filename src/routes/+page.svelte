<script lang="ts">
    import { Ability, BuildConfig, DefiniteNumberMap, StatType, type GameDiff, Champion, DiffAtlas, Affector, Rune, DiffMap } from "$lib/types.svelte";
    import { SvelteSet } from "svelte/reactivity";
    import UiAffectorSequence from "../UiAffectorSequence.svelte";
    import UiBuildSpec from "../UiBuildSpec.svelte";
    import UiChampSpec from "../UiChampSpec.svelte";
    import UiTargetSpec from "../UiTargetSpec.svelte";

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

    let absoluteDiffsToShow 
    = $state(new SvelteSet<GameDiff>());

    function duplicateBuild(insertionIndex: number,buildConfig: BuildConfig) {
        buildConfigs.splice(insertionIndex, 0, new BuildConfig(buildConfig));
    }

    function deleteBuild(lastBuild: BuildConfig) {
        buildConfigs.splice(buildConfigs.indexOf(lastBuild), 1);
    }

    function setAbsoluteDiffs(focalDiffMap: DiffMap, focalDiff: GameDiff) {
        let focalBuild 
        = focalDiff.builtInitialGameConfig.origin.build;

        let diffsSharingBuild
        = [diffAtlas.get(null), ...diffAtlas.values()]
        .flatMap((diffMap: DiffMap) => diffMap.entries().toArray())
        .filter(([build, diff]: [BuildConfig, GameDiff]) => build == focalBuild)
        .map(([build, diff]: [BuildConfig, GameDiff]) => diff);

        absoluteDiffsToShow = new SvelteSet([focalDiff, ...focalDiffMap.values(), ...diffsSharingBuild]);
    }
    
    function clearAbsoluteDiffs() {
        absoluteDiffsToShow.clear();
    }
</script>



<main>
    <div class="bg">
        <div class="bg-noisy-luminosity"></div>
    </div>

    <div class="content">
        <div class="champSpecs">
            <UiChampSpec bind:champ bind:abilityRanks/>
            vs
            <UiTargetSpec bind:targetBaseStats/>
        </div>

        <div class="diffTable"
        style:grid-template-rows={`max-content repeat(${buildConfigs.length}, max-content)`}
        style:grid-template-columns={`max-content max-content repeat(${(champ.abilities.length + 1) * 4}, max-content) auto`}
        >
            <div class="abilities">
                {#each champ.abilities as ability, i (ability.name)}
                <img src={ability.iconURL} alt={ability.name} class="icon med abilityIcon rounded">
                {/each}
            </div>

            <div class="builds">
                {#each buildConfigs as buildConfig, i}
                <div class="buildRow">
                    <button class="button_deleteBuild"
                    onmousedown={(e) => { e.preventDefault(); deleteBuild(buildConfig); }}
                    disabled={buildConfigs.length <= 1}
                    >𐌢</button>
                    
                    <div class="buildConfigAndDiffs" style:grid-column={`span ${1 + ((champ.abilities.length + 1) * 4)}`}>
                        <UiBuildSpec 
                        bind:buildConfig={buildConfigs[i]} buildIndex={i}
                        derivedGameConfig={diffAtlas.get(null).get(buildConfig).builtInitialGameConfig}
                        onclick={(e) => { e.preventDefault(); duplicateBuild(i, buildConfig)}}
                        />
                        
                        <div class="buildDiffs" style:grid-column={`span ${(champ.abilities.length + 1) * 4}`}>
                            {#snippet damageDiff(diffMap: DiffMap, diff: GameDiff)}
                            <button class="effectOutcome"
                            class:absolute={absoluteDiffsToShow.has(diff)}
                            onmouseenter={(e) => { e.preventDefault(); setAbsoluteDiffs(diffMap, diff); }}
                            onmouseleave={(e) => { e.preventDefault(); clearAbsoluteDiffs(); }}
                            >
                                <div class="absoluteDamagePerGold">
                                    <span class="diffPart deltaDiff">
                                        <span class="operator" class:negative={diff.damageDiff < 0}>{diff.damageDiff < 0 ? '－' : '＋'}</span>
                                        <span class="amount text-math">{diff.damageDiff.toFixed(0)}</span>
                                    </span>
                                    
                                    <span class="diffPart totalDiff">
                                        <span class="operator">＝</span>
                                        <span class="amount text-math">{diff.builtEndGameConfig.damageAggregate.toFixed(0)}</span>
                                    </span>
                                    
                                    <span class="unit">Damage</span>
                                </div>

                                <div class="relativeDamagePerGold">
                                    <span class="diffPart deltaDiff">
                                        <span class="operator" class:negative={diff.absoluteDamageDiff_perGold - diffMap.min_absoluteDamageDiff_perGold < 0}>{diff.absoluteDamageDiff_perGold - diffMap.min_absoluteDamageDiff_perGold < 0 ? "－" : "＋"}</span>
                                        <span class="amount text-math" class:negative={(diff.absoluteDamageDiff_perGold - diffMap.min_absoluteDamageDiff_perGold) / diffMap.min_absoluteDamageDiff_perGold < 0}>{Math.abs(100 * ((diff.absoluteDamageDiff_perGold - diffMap.min_absoluteDamageDiff_perGold) / diffMap.min_absoluteDamageDiff_perGold)).toFixed(0)}</span>
                                        <span class="context">% Δ</span>
                                    </span>

                                    <span class="diffPart totalDiff">
                                        <span class="operator" class:negative={diff.damage_perGold < 0}>{diff.damage_perGold < 0 ? "－" : "＋"}</span>
                                        <span class="amount text-math" class:negative={(diff.damage_perGold - diffMap.min_damage_perGold) / diffMap.min_damage_perGold < 0}>{Math.abs(100 * ((diff.damage_perGold - diffMap.min_damage_perGold) / diffMap.min_damage_perGold)).toFixed(0)}</span>
                                        <span class="context">% Σ</span>
                                    </span>

                                    <span class="unit">Dmg:G</span>
                                </div>
                            </button>
                            {/snippet}
                            
                            {#each champ.abilities as ability}
                            {@render damageDiff(diffAtlas.get(ability), diffAtlas.get(ability).get(buildConfig))}
                            {/each}
                            
                            {@render damageDiff(diffAtlas.get(null), diffAtlas.get(null).get(buildConfig))}
                        </div>
                    </div>
                    
                    <UiAffectorSequence bind:affectorQueue={buildConfig.affectorQueue}
                    affectorOptions={[...Affector.allBasicAffectors, ...champ.abilities, ...buildConfig.items.filter(item => item.effectsPerRank.length > 0), ...Rune.all]}
                    />
                </div>
                {/each}
            </div>
        </div>
    </div>
</main>



<style lang="scss">
    main {
        width: 100%;
        height: 100dvh;
        color: #ccc;
        overflow: hidden hidden;
        display: grid;
        grid-template: 100% / 100%;
    }

    .bg, .bg::before, .bg::after, .bg *, .bg *::before, .bg *::after, .content {
        grid-row: 1 / -1; grid-column: 1 / -1;
    }
	.bg {
        --champSplash: url(https://wiki.leagueoflegends.com/en-us/images/Ahri_OriginalCentered.jpg);
        
        --noise: url("data:image/svg+xml,%3Csvg viewBox='0 0 500 500' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        --paint: var(--champSplash);
        --paintBlur: 5.5px;
        --paintFilter: 
        contrast(40%)
        brightness(85%)
        blur(var(--paintBlur));

        z-index: -1;
        background: black;
        background-position: center;
        background-size: cover;
        
        &, &::before, &::after, *, *::before, *::after {
            border-radius: inherit;
            position: absolute;
            inset: 0;
        }
        
        .bg-noisy-luminosity {
            z-index: -1;
            mix-blend-mode: luminosity;
            background: 
				var(--noise) 0 0 / 500px 500px repeat fixed, // semitransparent noise
				linear-gradient(in oklab to bottom, #464646) 0 0 / cover fixed // base underlies noise to create 128 grey average
            ;

            &::before, 
            &::after 
            {
                content: '';
                background: var(--paint);
                background-position: center;
                background-size: cover;
                filter: var(--paintFilter);
            }
            &::before {
                mix-blend-mode: hard-light;
            }
            &::after {
                opacity: 85%; // denoise as desired
            }
        }

        &::before, 
        &::after {
            content: '';
        }
        &::before {
            mix-blend-mode: color;
            background: var(--paint);
            background-position: center;
            background-size: cover;
            filter: var(--paintFilter);
            //opacity: 50%; // saturate as desired
        }
        &::after {
            background: radial-gradient(in oklab, transparent, colors.hcl("blue", 4, 1));
            box-shadow: inset 0 0 calc(2 * var(--paintBlur)) var(--paintBlur) colors.gray(1);
        }
    }
    
    .content {
        display: flex;

        flex-flow: column nowrap;
        overflow: hidden hidden;
    }

    .champSpecs {
        padding: 10px;
        border-bottom: 1px solid #fff1;
        display: grid;
        background: radial-gradient(at top in oklab, colors.hcl("blue", 1, 11), transparent);

        grid-auto-flow: column;
        grid-template-columns: minmax(0,1fr) max-content minmax(0,1fr);
        justify-content: center;
        align-items: center;
        gap: 18px;
    }
    
    .diffTable {
        height: stretch;
        overflow: hidden auto;
        padding: 10px 10px;
        background: linear-gradient(in oklab to top, colors.hcl("blue", 4, 1), transparent);
        display: grid;
        
        gap: 8px 0;
        grid-auto-rows: max-content;
        // grid-auto-columns: max-content;
        // justify-content: stretch;
    }

    .abilities {
        grid-column: 3 / -1;
        display: grid;

        grid-auto-flow: column;
        grid-template: subgrid / subgrid;
        justify-items: center;

        & > * {
            grid-column: span 4;
        }
    }

    .builds {
        width: 100%;
        grid-row: 2 / -1;
        grid-column: 1 / -1;
        display: grid;
        
        grid-template: subgrid / subgrid;
    }

    .buildRow {
        grid-column: 1 / -1;
        display: grid;
        grid-auto-flow: column;
        grid-template: subgrid / subgrid;
        align-content: center;
    }

    .buildConfigAndDiffs {
        margin-right: 5px;
        background: linear-gradient(in oklab to bottom, 
            colors.hcl("blue", 2, 8), 
            colors.hcl("aqua", 2, 11), 
            colors.hcl("blue", 2, 7)
        );
        border-style: solid;
        border-width: 2px 2px 2px 0;
        border-radius: 0 3px 3px 0;
        border-color: colors.hcl("blue", 2, 9);
        box-shadow: shadows.$box-shadow-min;
        display: grid;
        grid-template: subgrid / subgrid;
    }

    .buildDiffs {
        display: grid;
        gap: 0 1px;
        grid-template: subgrid / subgrid;
    }

    .button_deleteBuild {
        display: grid;
        padding: 0 5px;
        color: colors.hcl("red", 5, 28);
        background-color: colors.hcl("red", 5, 12);
        border-width: 2px 0 2px 2px;
        border-style: solid;
        border-color: colors.hcl("red", 5, 13) colors.hcl("red", 5, 15);
        border-radius: 50% 0 0 50%;
        align-content: center;
        text-align: center;

        &[disabled] {
            background-color: colors.gray(2);
            border-color: colors.gray(4);
            color: colors.gray(5);
        }

        &:not([disabled]):hover {
            background-color: colors.hcl("red", 5, 15);
            border-color: colors.hcl("red", 5, 16) colors.hcl("red", 5, 18);
            color: colors.hcl("red", 5, 32);
        }
    }
    
    &:not(:hover) .absoluteDamagePerGold,
    &:hover .relativeDamagePerGold {
        // visibility: hidden;
    }

    .effectOutcome {
        cursor: default;
        height: 100%;
        width: 100%;
        grid-column: span 4;
        display: grid;
        padding: 0 0.5em;
        border-radius: 0;
        border: none;
        color: colors.hcl("aqua", 1, 45);
        background: linear-gradient(in oklab to bottom,
            colors.hcl("blue", 2, 8),
            colors.hcl("blue", 2, 7),
        );
        grid-template-columns: subgrid;
        grid-template-rows: repeat(2, minmax(0,1fr));
        gap: 0;
        align-content: center;

        &.absolute {
            color: colors.hcl("aqua", 5, 49);
            background: linear-gradient(in oklab to bottom,
                colors.hcl("blue", 2, 12),
                colors.hcl("blue", 2, 10),
            );
        }

        &:not(.absolute) .absoluteDamagePerGold,
        &.absolute .relativeDamagePerGold {
            visibility: hidden;
        }

        &:hover::after {
            box-shadow: none;
        }
    }

    .absoluteDamagePerGold,
    .relativeDamagePerGold {
        grid-row: 1 / -1;
        grid-column: 1 / -1;
        display: grid;
        grid-template: subgrid / subgrid;
        align-items: center;
    }

    .diffPart {
        grid-column: span 3;
        display: grid;
        grid-template: subgrid / subgrid;
        align-items: baseline;

        &:first-child { align-items: end; }
        &:last-child { align-items: start; }
    }
    
    .operator {
    }
    
    .amount {
    }
    
    .context {
        grid-column: 3;
    }

    .operator,
    .context,
    .unit {
        color: colors.hcl("aqua", 0, 34);
    }
    
    .unit {
        grid-row: 1 / -1;
        grid-column: 4;
    }



    .sequencesPerBuild {
        display: grid;
        grid-template: subgrid / subgrid;
    }

    .negative {
        color: #f88;
    }
    
    .abilityIcon {
        border: 2px solid #fff1;
    }
</style>