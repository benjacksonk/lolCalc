<script lang="ts">
    import { Ability, BuildConfig, DefiniteNumberMap, StatType, type GameDiff, Champion, DiffAtlas, Affector, Rune, DiffMap } from "$lib/types.svelte";
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
        <UiChampSpec bind:champ bind:abilityRanks/>
        vs
        <UiTargetSpec bind:targetBaseStats/>
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

                <UiBuildSpec 
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
                <UiAffectorSequence bind:affectorQueue={buildConfig.affectorQueue}
                affectorOptions={[...Affector.allBasicAffectors, ...champ.abilities, ...buildConfig.items.filter(item => item.effectsPerRank.length > 0), ...Rune.all]}
                />
                {/each}
            </div>
        </div>
    </div>
</main>



<style lang="scss">
    $lr-vertex: sqrt(1 / 2); // [0-1] lightness (relative to white) where chromas are max
    $lr-min: 0;
    $lr-max: 1;
    $lr-range: $lr-max - $lr-min;
    $lr-vertex-subdivision: calc(33 / 52); // coordinated with a chroma apex at lr-subdivision-32
    @function calculate-lr($lr-subdivision) {
        $lr-p: log(($lr-vertex - $lr-min) / $lr-range, $lr-vertex-subdivision);
        @return calc($lr-min + ($lr-range * pow($lr-subdivision, $lr-p)));
    }

    $l-k1: 0.206;
    $l-k2: 0.03;
    $l-k3: calc((1 + $l-k1) / (1 + $l-k2));
    @function lr-to-l($lr) {
        $l: calc(($lr * ($lr + $l-k1)) / ($l-k3 * ($lr + $l-k2)));
        @return $l;
    }
    
    $chroma-max: 0.147;                      // [0-1] max chroma safe within all hues of chosen palette
    $anchor-lr: calculate-lr(calc(11 / 52)); // [0-1] anchor point color's lightness (relative to white)
    $anchor-cr: 0.52;                        // [0-1] anchor point color's max chroma at $anchor-lr (relative to $chroma-max)
    $chroma-b: log($anchor-cr, $anchor-lr / $lr-vertex);
    @function calculate-chroma-limit($lr) {
        $isBright: $lr-vertex > $lr;
        $c-ratio: if(
            sass($isBright): pow($lr / $lr-vertex, $chroma-b);
            else: sqrt(abs(((1 - $lr) / (1 - $lr-vertex)) * (1 - pow(abs(($lr - $lr-vertex) / (1 - $lr-vertex)), $chroma-b))));
        );
        $chroma-limit: $chroma-max * $c-ratio;
        @return $chroma-limit;
    }

    @function calculate-color($lr-subdivision, $saturation-mult, $hue) {
        $lr: calculate-lr($lr-subdivision);
        $lightness: lr-to-l($lr);
        $chroma: calculate-chroma-limit($lr) * $saturation-mult;
        @return oklch($lightness $chroma $hue);
    }

    @mixin create-spectrum($name, $hue, $saturation-mult, $subdivisions) {
        @for $i from 1 through $subdivisions {
            --color-#{$name}-#{$i - 1}: #{calculate-color(calc($i / ($subdivisions + 1)), $saturation-mult, $hue)};
        }
    }

    $l-divisions: 51;
    :global(body) {
        @include create-spectrum("grey", 0, 0, $l-divisions);
        @include create-spectrum("red", 23, 1, $l-divisions);
        @include create-spectrum("coral", 50.8125, 1, $l-divisions);
        @include create-spectrum("honey", 78.625, 1, $l-divisions);
        @include create-spectrum("green", 134.25, 1, $l-divisions);
        @include create-spectrum("aqua", 230.8125, 1, $l-divisions);
        @include create-spectrum("blue", 245.5, 1, $l-divisions);
    }

    main {
        width: 100%;
        height: 100dvh;
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