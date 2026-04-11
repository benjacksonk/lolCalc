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
    $lr-subdivision-0:   1 / 52;
    $lr-subdivision-1:   2 / 52;
    $lr-subdivision-2:   3 / 52;
    $lr-subdivision-3:   4 / 52;
    $lr-subdivision-4:   5 / 52;
    $lr-subdivision-5:   6 / 52;
    $lr-subdivision-6:   7 / 52;
    $lr-subdivision-7:   8 / 52;
    $lr-subdivision-8:   9 / 52;
    $lr-subdivision-9:  10 / 52;
    $lr-subdivision-10: 11 / 52;
    $lr-subdivision-11: 12 / 52;
    $lr-subdivision-12: 13 / 52;
    $lr-subdivision-13: 14 / 52;
    $lr-subdivision-14: 15 / 52;
    $lr-subdivision-15: 16 / 52;
    $lr-subdivision-16: 17 / 52;
    $lr-subdivision-17: 18 / 52;
    $lr-subdivision-18: 19 / 52;
    $lr-subdivision-19: 20 / 52;
    $lr-subdivision-20: 21 / 52;
    $lr-subdivision-21: 22 / 52;
    $lr-subdivision-22: 23 / 52;
    $lr-subdivision-23: 24 / 52;
    $lr-subdivision-24: 25 / 52;
    $lr-subdivision-25: 26 / 52;
    $lr-subdivision-26: 27 / 52;
    $lr-subdivision-27: 28 / 52;
    $lr-subdivision-28: 29 / 52;
    $lr-subdivision-29: 30 / 52;
    $lr-subdivision-30: 31 / 52;
    $lr-subdivision-31: 32 / 52;
    $lr-subdivision-32: 33 / 52;
    $lr-subdivision-33: 34 / 52;
    $lr-subdivision-34: 35 / 52;
    $lr-subdivision-35: 36 / 52;
    $lr-subdivision-36: 37 / 52;
    $lr-subdivision-37: 38 / 52;
    $lr-subdivision-38: 39 / 52;
    $lr-subdivision-39: 40 / 52;
    $lr-subdivision-40: 41 / 52;
    $lr-subdivision-41: 42 / 52;
    $lr-subdivision-42: 43 / 52;
    $lr-subdivision-43: 44 / 52;
    $lr-subdivision-44: 45 / 52;
    $lr-subdivision-45: 46 / 52;
    $lr-subdivision-46: 47 / 52;
    $lr-subdivision-47: 48 / 52;
    $lr-subdivision-48: 49 / 52;
    $lr-subdivision-49: 50 / 52;
    $lr-subdivision-50: 51 / 52;

    $lr-vertex: sqrt(1 / 2); // relative lightness point [0-1] where chroma is max
    $lr-min: 0;
    $lr-max: 1;
    $lr-range: $lr-max - $lr-min;
    $lr-vertex-subdivision: $lr-subdivision-32; // coordinated with a chroma apex at lr-subdivision-32
    
    @function calculate-lr($lr-subdivision) {
        $lr-p: log(($lr-vertex - $lr-min) / $lr-range, $lr-vertex-subdivision);
        @return calc($lr-min + ($lr-range * pow($lr-subdivision, $lr-p)));
    }

    @function lr-to-l($lr) {
        $l-k1: 0.206;
        $l-k2: 0.03;
        $l-k3: calc((1 + $l-k1) / (1 + $l-k2));
        $l: calc(($lr * ($lr + $l-k1)) / ($l-k3 * ($lr + $l-k2)));
        @return $l;
    }
    
    $chroma-max: 0.13; // absolute chroma max for palette [0-1, but practically 0 - ~0.13]
    $anchor-lr: calculate-lr(14 / 52); // relative lightness point [0-1] of key color
    $anchor-cr: 0.642; // relative chroma point [0-1] of key color, at ok-lr-13, the max for silver(smallest c gamut with hue 230.8125) is ~0.67

    @function calculate-chroma-limit($lr) {
        $chroma-b: log($anchor-cr, $anchor-lr / $lr-vertex);
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

    $color-grey-0:  calculate-color($lr-subdivision-0,  0, 0);
    $color-grey-1:  calculate-color($lr-subdivision-1,  0, 0);
    $color-grey-2:  calculate-color($lr-subdivision-2,  0, 0);
    $color-grey-3:  calculate-color($lr-subdivision-3,  0, 0);
    $color-grey-4:  calculate-color($lr-subdivision-4,  0, 0);
    $color-grey-5:  calculate-color($lr-subdivision-5,  0, 0);
    $color-grey-6:  calculate-color($lr-subdivision-6,  0, 0);
    $color-grey-7:  calculate-color($lr-subdivision-7,  0, 0);
    $color-grey-8:  calculate-color($lr-subdivision-8,  0, 0);
    $color-grey-9:  calculate-color($lr-subdivision-9,  0, 0);
    $color-grey-10: calculate-color($lr-subdivision-10, 0, 0);
    $color-grey-11: calculate-color($lr-subdivision-11, 0, 0);
    $color-grey-12: calculate-color($lr-subdivision-12, 0, 0);
    $color-grey-13: calculate-color($lr-subdivision-13, 0, 0);
    $color-grey-14: calculate-color($lr-subdivision-14, 0, 0);
    $color-grey-15: calculate-color($lr-subdivision-15, 0, 0);
    $color-grey-16: calculate-color($lr-subdivision-16, 0, 0);
    $color-grey-17: calculate-color($lr-subdivision-17, 0, 0);
    $color-grey-18: calculate-color($lr-subdivision-18, 0, 0);
    $color-grey-19: calculate-color($lr-subdivision-19, 0, 0);
    $color-grey-20: calculate-color($lr-subdivision-20, 0, 0);
    $color-grey-21: calculate-color($lr-subdivision-21, 0, 0);
    $color-grey-22: calculate-color($lr-subdivision-22, 0, 0);
    $color-grey-23: calculate-color($lr-subdivision-23, 0, 0);
    $color-grey-24: calculate-color($lr-subdivision-24, 0, 0);
    $color-grey-25: calculate-color($lr-subdivision-25, 0, 0);
    $color-grey-26: calculate-color($lr-subdivision-26, 0, 0);
    $color-grey-27: calculate-color($lr-subdivision-27, 0, 0);
    $color-grey-28: calculate-color($lr-subdivision-28, 0, 0);
    $color-grey-29: calculate-color($lr-subdivision-29, 0, 0);
    $color-grey-30: calculate-color($lr-subdivision-30, 0, 0);
    $color-grey-31: calculate-color($lr-subdivision-31, 0, 0);
    $color-grey-32: calculate-color($lr-subdivision-32, 0, 0);
    $color-grey-33: calculate-color($lr-subdivision-33, 0, 0);
    $color-grey-34: calculate-color($lr-subdivision-34, 0, 0);
    $color-grey-35: calculate-color($lr-subdivision-35, 0, 0);
    $color-grey-36: calculate-color($lr-subdivision-36, 0, 0);
    $color-grey-37: calculate-color($lr-subdivision-37, 0, 0);
    $color-grey-38: calculate-color($lr-subdivision-38, 0, 0);
    $color-grey-39: calculate-color($lr-subdivision-39, 0, 0);
    $color-grey-40: calculate-color($lr-subdivision-40, 0, 0);
    $color-grey-41: calculate-color($lr-subdivision-41, 0, 0);
    $color-grey-42: calculate-color($lr-subdivision-42, 0, 0);
    $color-grey-43: calculate-color($lr-subdivision-43, 0, 0);
    $color-grey-44: calculate-color($lr-subdivision-44, 0, 0);
    $color-grey-45: calculate-color($lr-subdivision-45, 0, 0);
    $color-grey-46: calculate-color($lr-subdivision-46, 0, 0);
    $color-grey-47: calculate-color($lr-subdivision-47, 0, 0);
    $color-grey-48: calculate-color($lr-subdivision-48, 0, 0);
    $color-grey-49: calculate-color($lr-subdivision-49, 0, 0);
    $color-grey-50: calculate-color($lr-subdivision-50, 0, 0);

    $hue-aqua: 230.8125;
    $color-aqua-0:  calculate-color($lr-subdivision-0,  1, $hue-aqua);
    $color-aqua-1:  calculate-color($lr-subdivision-1,  1, $hue-aqua);
    $color-aqua-2:  calculate-color($lr-subdivision-2,  1, $hue-aqua);
    $color-aqua-3:  calculate-color($lr-subdivision-3,  1, $hue-aqua);
    $color-aqua-4:  calculate-color($lr-subdivision-4,  1, $hue-aqua);
    $color-aqua-5:  calculate-color($lr-subdivision-5,  1, $hue-aqua);
    $color-aqua-6:  calculate-color($lr-subdivision-6,  1, $hue-aqua);
    $color-aqua-7:  calculate-color($lr-subdivision-7,  1, $hue-aqua);
    $color-aqua-8:  calculate-color($lr-subdivision-8,  1, $hue-aqua);
    $color-aqua-9:  calculate-color($lr-subdivision-9,  1, $hue-aqua);
    $color-aqua-10: calculate-color($lr-subdivision-10, 1, $hue-aqua);
    $color-aqua-11: calculate-color($lr-subdivision-11, 1, $hue-aqua);
    $color-aqua-12: calculate-color($lr-subdivision-12, 1, $hue-aqua);
    $color-aqua-13: calculate-color($lr-subdivision-13, 1, $hue-aqua);
    $color-aqua-14: calculate-color($lr-subdivision-14, 1, $hue-aqua);
    $color-aqua-15: calculate-color($lr-subdivision-15, 1, $hue-aqua);
    $color-aqua-16: calculate-color($lr-subdivision-16, 1, $hue-aqua);
    $color-aqua-17: calculate-color($lr-subdivision-17, 1, $hue-aqua);
    $color-aqua-18: calculate-color($lr-subdivision-18, 1, $hue-aqua);
    $color-aqua-19: calculate-color($lr-subdivision-19, 1, $hue-aqua);
    $color-aqua-20: calculate-color($lr-subdivision-20, 1, $hue-aqua);
    $color-aqua-21: calculate-color($lr-subdivision-21, 1, $hue-aqua);
    $color-aqua-22: calculate-color($lr-subdivision-22, 1, $hue-aqua);
    $color-aqua-23: calculate-color($lr-subdivision-23, 1, $hue-aqua);
    $color-aqua-24: calculate-color($lr-subdivision-24, 1, $hue-aqua);
    $color-aqua-25: calculate-color($lr-subdivision-25, 1, $hue-aqua);
    $color-aqua-26: calculate-color($lr-subdivision-26, 1, $hue-aqua);
    $color-aqua-27: calculate-color($lr-subdivision-27, 1, $hue-aqua);
    $color-aqua-28: calculate-color($lr-subdivision-28, 1, $hue-aqua);
    $color-aqua-29: calculate-color($lr-subdivision-29, 1, $hue-aqua);
    $color-aqua-30: calculate-color($lr-subdivision-30, 1, $hue-aqua);
    $color-aqua-31: calculate-color($lr-subdivision-31, 1, $hue-aqua);
    $color-aqua-32: calculate-color($lr-subdivision-32, 1, $hue-aqua);
    $color-aqua-33: calculate-color($lr-subdivision-33, 1, $hue-aqua);
    $color-aqua-34: calculate-color($lr-subdivision-34, 1, $hue-aqua);
    $color-aqua-35: calculate-color($lr-subdivision-35, 1, $hue-aqua);
    $color-aqua-36: calculate-color($lr-subdivision-36, 1, $hue-aqua);
    $color-aqua-37: calculate-color($lr-subdivision-37, 1, $hue-aqua);
    $color-aqua-38: calculate-color($lr-subdivision-38, 1, $hue-aqua);
    $color-aqua-39: calculate-color($lr-subdivision-39, 1, $hue-aqua);
    $color-aqua-40: calculate-color($lr-subdivision-40, 1, $hue-aqua);
    $color-aqua-41: calculate-color($lr-subdivision-41, 1, $hue-aqua);
    $color-aqua-42: calculate-color($lr-subdivision-42, 1, $hue-aqua);
    $color-aqua-43: calculate-color($lr-subdivision-43, 1, $hue-aqua);
    $color-aqua-44: calculate-color($lr-subdivision-44, 1, $hue-aqua);
    $color-aqua-45: calculate-color($lr-subdivision-45, 1, $hue-aqua);
    $color-aqua-46: calculate-color($lr-subdivision-46, 1, $hue-aqua);
    $color-aqua-47: calculate-color($lr-subdivision-47, 1, $hue-aqua);
    $color-aqua-48: calculate-color($lr-subdivision-48, 1, $hue-aqua);
    $color-aqua-49: calculate-color($lr-subdivision-49, 1, $hue-aqua);
    $color-aqua-50: calculate-color($lr-subdivision-50, 1, $hue-aqua);

    $hue-blue: 245.5;
    $color-blue-0:  calculate-color($lr-subdivision-0,  1, $hue-blue);
    $color-blue-1:  calculate-color($lr-subdivision-1,  1, $hue-blue);
    $color-blue-2:  calculate-color($lr-subdivision-2,  1, $hue-blue);
    $color-blue-3:  calculate-color($lr-subdivision-3,  1, $hue-blue);
    $color-blue-4:  calculate-color($lr-subdivision-4,  1, $hue-blue);
    $color-blue-5:  calculate-color($lr-subdivision-5,  1, $hue-blue);
    $color-blue-6:  calculate-color($lr-subdivision-6,  1, $hue-blue);
    $color-blue-7:  calculate-color($lr-subdivision-7,  1, $hue-blue);
    $color-blue-8:  calculate-color($lr-subdivision-8,  1, $hue-blue);
    $color-blue-9:  calculate-color($lr-subdivision-9,  1, $hue-blue);
    $color-blue-10: calculate-color($lr-subdivision-10, 1, $hue-blue);
    $color-blue-11: calculate-color($lr-subdivision-11, 1, $hue-blue);
    $color-blue-12: calculate-color($lr-subdivision-12, 1, $hue-blue);
    $color-blue-13: calculate-color($lr-subdivision-13, 1, $hue-blue);
    $color-blue-14: calculate-color($lr-subdivision-14, 1, $hue-blue);
    $color-blue-15: calculate-color($lr-subdivision-15, 1, $hue-blue);
    $color-blue-16: calculate-color($lr-subdivision-16, 1, $hue-blue);
    $color-blue-17: calculate-color($lr-subdivision-17, 1, $hue-blue);
    $color-blue-18: calculate-color($lr-subdivision-18, 1, $hue-blue);
    $color-blue-19: calculate-color($lr-subdivision-19, 1, $hue-blue);
    $color-blue-20: calculate-color($lr-subdivision-20, 1, $hue-blue);
    $color-blue-21: calculate-color($lr-subdivision-21, 1, $hue-blue);
    $color-blue-22: calculate-color($lr-subdivision-22, 1, $hue-blue);
    $color-blue-23: calculate-color($lr-subdivision-23, 1, $hue-blue);
    $color-blue-24: calculate-color($lr-subdivision-24, 1, $hue-blue);
    $color-blue-25: calculate-color($lr-subdivision-25, 1, $hue-blue);
    $color-blue-26: calculate-color($lr-subdivision-26, 1, $hue-blue);
    $color-blue-27: calculate-color($lr-subdivision-27, 1, $hue-blue);
    $color-blue-28: calculate-color($lr-subdivision-28, 1, $hue-blue);
    $color-blue-29: calculate-color($lr-subdivision-29, 1, $hue-blue);
    $color-blue-30: calculate-color($lr-subdivision-30, 1, $hue-blue);
    $color-blue-31: calculate-color($lr-subdivision-31, 1, $hue-blue);
    $color-blue-32: calculate-color($lr-subdivision-32, 1, $hue-blue);
    $color-blue-33: calculate-color($lr-subdivision-33, 1, $hue-blue);
    $color-blue-34: calculate-color($lr-subdivision-34, 1, $hue-blue);
    $color-blue-35: calculate-color($lr-subdivision-35, 1, $hue-blue);
    $color-blue-36: calculate-color($lr-subdivision-36, 1, $hue-blue);
    $color-blue-37: calculate-color($lr-subdivision-37, 1, $hue-blue);
    $color-blue-38: calculate-color($lr-subdivision-38, 1, $hue-blue);
    $color-blue-39: calculate-color($lr-subdivision-39, 1, $hue-blue);
    $color-blue-40: calculate-color($lr-subdivision-40, 1, $hue-blue);
    $color-blue-41: calculate-color($lr-subdivision-41, 1, $hue-blue);
    $color-blue-42: calculate-color($lr-subdivision-42, 1, $hue-blue);
    $color-blue-43: calculate-color($lr-subdivision-43, 1, $hue-blue);
    $color-blue-44: calculate-color($lr-subdivision-44, 1, $hue-blue);
    $color-blue-45: calculate-color($lr-subdivision-45, 1, $hue-blue);
    $color-blue-46: calculate-color($lr-subdivision-46, 1, $hue-blue);
    $color-blue-47: calculate-color($lr-subdivision-47, 1, $hue-blue);
    $color-blue-48: calculate-color($lr-subdivision-48, 1, $hue-blue);
    $color-blue-49: calculate-color($lr-subdivision-49, 1, $hue-blue);
    $color-blue-50: calculate-color($lr-subdivision-50, 1, $hue-blue);

    $hue-honey: 78.625;
    $color-honey-0:  calculate-color($lr-subdivision-0,  1, $hue-honey);
    $color-honey-1:  calculate-color($lr-subdivision-1,  1, $hue-honey);
    $color-honey-2:  calculate-color($lr-subdivision-2,  1, $hue-honey);
    $color-honey-3:  calculate-color($lr-subdivision-3,  1, $hue-honey);
    $color-honey-4:  calculate-color($lr-subdivision-4,  1, $hue-honey);
    $color-honey-5:  calculate-color($lr-subdivision-5,  1, $hue-honey);
    $color-honey-6:  calculate-color($lr-subdivision-6,  1, $hue-honey);
    $color-honey-7:  calculate-color($lr-subdivision-7,  1, $hue-honey);
    $color-honey-8:  calculate-color($lr-subdivision-8,  1, $hue-honey);
    $color-honey-9:  calculate-color($lr-subdivision-9,  1, $hue-honey);
    $color-honey-10: calculate-color($lr-subdivision-10, 1, $hue-honey);
    $color-honey-11: calculate-color($lr-subdivision-11, 1, $hue-honey);
    $color-honey-12: calculate-color($lr-subdivision-12, 1, $hue-honey);
    $color-honey-13: calculate-color($lr-subdivision-13, 1, $hue-honey);
    $color-honey-14: calculate-color($lr-subdivision-14, 1, $hue-honey);
    $color-honey-15: calculate-color($lr-subdivision-15, 1, $hue-honey);
    $color-honey-16: calculate-color($lr-subdivision-16, 1, $hue-honey);
    $color-honey-17: calculate-color($lr-subdivision-17, 1, $hue-honey);
    $color-honey-18: calculate-color($lr-subdivision-18, 1, $hue-honey);
    $color-honey-19: calculate-color($lr-subdivision-19, 1, $hue-honey);
    $color-honey-20: calculate-color($lr-subdivision-20, 1, $hue-honey);
    $color-honey-21: calculate-color($lr-subdivision-21, 1, $hue-honey);
    $color-honey-22: calculate-color($lr-subdivision-22, 1, $hue-honey);
    $color-honey-23: calculate-color($lr-subdivision-23, 1, $hue-honey);
    $color-honey-24: calculate-color($lr-subdivision-24, 1, $hue-honey);
    $color-honey-25: calculate-color($lr-subdivision-25, 1, $hue-honey);
    $color-honey-26: calculate-color($lr-subdivision-26, 1, $hue-honey);
    $color-honey-27: calculate-color($lr-subdivision-27, 1, $hue-honey);
    $color-honey-28: calculate-color($lr-subdivision-28, 1, $hue-honey);
    $color-honey-29: calculate-color($lr-subdivision-29, 1, $hue-honey);
    $color-honey-30: calculate-color($lr-subdivision-30, 1, $hue-honey);
    $color-honey-31: calculate-color($lr-subdivision-31, 1, $hue-honey);
    $color-honey-32: calculate-color($lr-subdivision-32, 1, $hue-honey);
    $color-honey-33: calculate-color($lr-subdivision-33, 1, $hue-honey);
    $color-honey-34: calculate-color($lr-subdivision-34, 1, $hue-honey);
    $color-honey-35: calculate-color($lr-subdivision-35, 1, $hue-honey);
    $color-honey-36: calculate-color($lr-subdivision-36, 1, $hue-honey);
    $color-honey-37: calculate-color($lr-subdivision-37, 1, $hue-honey);
    $color-honey-38: calculate-color($lr-subdivision-38, 1, $hue-honey);
    $color-honey-39: calculate-color($lr-subdivision-39, 1, $hue-honey);
    $color-honey-40: calculate-color($lr-subdivision-40, 1, $hue-honey);
    $color-honey-41: calculate-color($lr-subdivision-41, 1, $hue-honey);
    $color-honey-42: calculate-color($lr-subdivision-42, 1, $hue-honey);
    $color-honey-43: calculate-color($lr-subdivision-43, 1, $hue-honey);
    $color-honey-44: calculate-color($lr-subdivision-44, 1, $hue-honey);
    $color-honey-45: calculate-color($lr-subdivision-45, 1, $hue-honey);
    $color-honey-46: calculate-color($lr-subdivision-46, 1, $hue-honey);
    $color-honey-47: calculate-color($lr-subdivision-47, 1, $hue-honey);
    $color-honey-48: calculate-color($lr-subdivision-48, 1, $hue-honey);
    $color-honey-49: calculate-color($lr-subdivision-49, 1, $hue-honey);
    $color-honey-50: calculate-color($lr-subdivision-50, 1, $hue-honey);

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

        --color-grey-0:  #{$color-grey-0};
        --color-grey-1:  #{$color-grey-1};
        --color-grey-2:  #{$color-grey-2};
        --color-grey-3:  #{$color-grey-3};
        --color-grey-4:  #{$color-grey-4};
        --color-grey-5:  #{$color-grey-5};
        --color-grey-6:  #{$color-grey-6};
        --color-grey-7:  #{$color-grey-7};
        --color-grey-8:  #{$color-grey-8};
        --color-grey-9:  #{$color-grey-9};
        --color-grey-10: #{$color-grey-10};
        --color-grey-11: #{$color-grey-11};
        --color-grey-12: #{$color-grey-12};
        --color-grey-13: #{$color-grey-13};
        --color-grey-14: #{$color-grey-14};
        --color-grey-15: #{$color-grey-15};
        --color-grey-16: #{$color-grey-16};
        --color-grey-17: #{$color-grey-17};
        --color-grey-18: #{$color-grey-18};
        --color-grey-19: #{$color-grey-19};
        --color-grey-20: #{$color-grey-20};
        --color-grey-21: #{$color-grey-21};
        --color-grey-22: #{$color-grey-22};
        --color-grey-23: #{$color-grey-23};
        --color-grey-24: #{$color-grey-24};
        --color-grey-25: #{$color-grey-25};
        --color-grey-26: #{$color-grey-26};
        --color-grey-27: #{$color-grey-27};
        --color-grey-28: #{$color-grey-28};
        --color-grey-29: #{$color-grey-29};
        --color-grey-30: #{$color-grey-30};
        --color-grey-31: #{$color-grey-31};
        --color-grey-32: #{$color-grey-32};
        --color-grey-33: #{$color-grey-33};
        --color-grey-34: #{$color-grey-34};
        --color-grey-35: #{$color-grey-35};
        --color-grey-36: #{$color-grey-36};
        --color-grey-37: #{$color-grey-37};
        --color-grey-38: #{$color-grey-38};
        --color-grey-39: #{$color-grey-39};
        --color-grey-40: #{$color-grey-40};
        --color-grey-41: #{$color-grey-41};
        --color-grey-42: #{$color-grey-42};
        --color-grey-43: #{$color-grey-43};
        --color-grey-44: #{$color-grey-44};
        --color-grey-45: #{$color-grey-45};
        --color-grey-46: #{$color-grey-46};
        --color-grey-47: #{$color-grey-47};
        --color-grey-48: #{$color-grey-48};
        --color-grey-49: #{$color-grey-49};
        --color-grey-50: #{$color-grey-50};

        --color-aqua-0:  #{$color-aqua-0};
        --color-aqua-1:  #{$color-aqua-1};
        --color-aqua-2:  #{$color-aqua-2};
        --color-aqua-3:  #{$color-aqua-3};
        --color-aqua-4:  #{$color-aqua-4};
        --color-aqua-5:  #{$color-aqua-5};
        --color-aqua-6:  #{$color-aqua-6};
        --color-aqua-7:  #{$color-aqua-7};
        --color-aqua-8:  #{$color-aqua-8};
        --color-aqua-9:  #{$color-aqua-9};
        --color-aqua-10: #{$color-aqua-10};
        --color-aqua-11: #{$color-aqua-11};
        --color-aqua-12: #{$color-aqua-12};
        --color-aqua-13: #{$color-aqua-13};
        --color-aqua-14: #{$color-aqua-14};
        --color-aqua-15: #{$color-aqua-15};
        --color-aqua-16: #{$color-aqua-16};
        --color-aqua-17: #{$color-aqua-17};
        --color-aqua-18: #{$color-aqua-18};
        --color-aqua-19: #{$color-aqua-19};
        --color-aqua-20: #{$color-aqua-20};
        --color-aqua-21: #{$color-aqua-21};
        --color-aqua-22: #{$color-aqua-22};
        --color-aqua-23: #{$color-aqua-23};
        --color-aqua-24: #{$color-aqua-24};
        --color-aqua-25: #{$color-aqua-25};
        --color-aqua-26: #{$color-aqua-26};
        --color-aqua-27: #{$color-aqua-27};
        --color-aqua-28: #{$color-aqua-28};
        --color-aqua-29: #{$color-aqua-29};
        --color-aqua-30: #{$color-aqua-30};
        --color-aqua-31: #{$color-aqua-31};
        --color-aqua-32: #{$color-aqua-32};
        --color-aqua-33: #{$color-aqua-33};
        --color-aqua-34: #{$color-aqua-34};
        --color-aqua-35: #{$color-aqua-35};
        --color-aqua-36: #{$color-aqua-36};
        --color-aqua-37: #{$color-aqua-37};
        --color-aqua-38: #{$color-aqua-38};
        --color-aqua-39: #{$color-aqua-39};
        --color-aqua-40: #{$color-aqua-40};
        --color-aqua-41: #{$color-aqua-41};
        --color-aqua-42: #{$color-aqua-42};
        --color-aqua-43: #{$color-aqua-43};
        --color-aqua-44: #{$color-aqua-44};
        --color-aqua-45: #{$color-aqua-45};
        --color-aqua-46: #{$color-aqua-46};
        --color-aqua-47: #{$color-aqua-47};
        --color-aqua-48: #{$color-aqua-48};
        --color-aqua-49: #{$color-aqua-49};
        --color-aqua-50: #{$color-aqua-50};

        --color-blue-0:  #{$color-blue-0};
        --color-blue-1:  #{$color-blue-1};
        --color-blue-2:  #{$color-blue-2};
        --color-blue-3:  #{$color-blue-3};
        --color-blue-4:  #{$color-blue-4};
        --color-blue-5:  #{$color-blue-5};
        --color-blue-6:  #{$color-blue-6};
        --color-blue-7:  #{$color-blue-7};
        --color-blue-8:  #{$color-blue-8};
        --color-blue-9:  #{$color-blue-9};
        --color-blue-10: #{$color-blue-10};
        --color-blue-11: #{$color-blue-11};
        --color-blue-12: #{$color-blue-12};
        --color-blue-13: #{$color-blue-13};
        --color-blue-14: #{$color-blue-14};
        --color-blue-15: #{$color-blue-15};
        --color-blue-16: #{$color-blue-16};
        --color-blue-17: #{$color-blue-17};
        --color-blue-18: #{$color-blue-18};
        --color-blue-19: #{$color-blue-19};
        --color-blue-20: #{$color-blue-20};
        --color-blue-21: #{$color-blue-21};
        --color-blue-22: #{$color-blue-22};
        --color-blue-23: #{$color-blue-23};
        --color-blue-24: #{$color-blue-24};
        --color-blue-25: #{$color-blue-25};
        --color-blue-26: #{$color-blue-26};
        --color-blue-27: #{$color-blue-27};
        --color-blue-28: #{$color-blue-28};
        --color-blue-29: #{$color-blue-29};
        --color-blue-30: #{$color-blue-30};
        --color-blue-31: #{$color-blue-31};
        --color-blue-32: #{$color-blue-32};
        --color-blue-33: #{$color-blue-33};
        --color-blue-34: #{$color-blue-34};
        --color-blue-35: #{$color-blue-35};
        --color-blue-36: #{$color-blue-36};
        --color-blue-37: #{$color-blue-37};
        --color-blue-38: #{$color-blue-38};
        --color-blue-39: #{$color-blue-39};
        --color-blue-40: #{$color-blue-40};
        --color-blue-41: #{$color-blue-41};
        --color-blue-42: #{$color-blue-42};
        --color-blue-43: #{$color-blue-43};
        --color-blue-44: #{$color-blue-44};
        --color-blue-45: #{$color-blue-45};
        --color-blue-46: #{$color-blue-46};
        --color-blue-47: #{$color-blue-47};
        --color-blue-48: #{$color-blue-48};
        --color-blue-49: #{$color-blue-49};
        --color-blue-50: #{$color-blue-50};

        --color-honey-0:  #{$color-honey-0};
        --color-honey-1:  #{$color-honey-1};
        --color-honey-2:  #{$color-honey-2};
        --color-honey-3:  #{$color-honey-3};
        --color-honey-4:  #{$color-honey-4};
        --color-honey-5:  #{$color-honey-5};
        --color-honey-6:  #{$color-honey-6};
        --color-honey-7:  #{$color-honey-7};
        --color-honey-8:  #{$color-honey-8};
        --color-honey-9:  #{$color-honey-9};
        --color-honey-10: #{$color-honey-10};
        --color-honey-11: #{$color-honey-11};
        --color-honey-12: #{$color-honey-12};
        --color-honey-13: #{$color-honey-13};
        --color-honey-14: #{$color-honey-14};
        --color-honey-15: #{$color-honey-15};
        --color-honey-16: #{$color-honey-16};
        --color-honey-17: #{$color-honey-17};
        --color-honey-18: #{$color-honey-18};
        --color-honey-19: #{$color-honey-19};
        --color-honey-20: #{$color-honey-20};
        --color-honey-21: #{$color-honey-21};
        --color-honey-22: #{$color-honey-22};
        --color-honey-23: #{$color-honey-23};
        --color-honey-24: #{$color-honey-24};
        --color-honey-25: #{$color-honey-25};
        --color-honey-26: #{$color-honey-26};
        --color-honey-27: #{$color-honey-27};
        --color-honey-28: #{$color-honey-28};
        --color-honey-29: #{$color-honey-29};
        --color-honey-30: #{$color-honey-30};
        --color-honey-31: #{$color-honey-31};
        --color-honey-32: #{$color-honey-32};
        --color-honey-33: #{$color-honey-33};
        --color-honey-34: #{$color-honey-34};
        --color-honey-35: #{$color-honey-35};
        --color-honey-36: #{$color-honey-36};
        --color-honey-37: #{$color-honey-37};
        --color-honey-38: #{$color-honey-38};
        --color-honey-39: #{$color-honey-39};
        --color-honey-40: #{$color-honey-40};
        --color-honey-41: #{$color-honey-41};
        --color-honey-42: #{$color-honey-42};
        --color-honey-43: #{$color-honey-43};
        --color-honey-44: #{$color-honey-44};
        --color-honey-45: #{$color-honey-45};
        --color-honey-46: #{$color-honey-46};
        --color-honey-47: #{$color-honey-47};
        --color-honey-48: #{$color-honey-48};
        --color-honey-49: #{$color-honey-49};
        --color-honey-50: #{$color-honey-50};
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