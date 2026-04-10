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
    $ok-lr-vertex: sqrt(1 / 2); /* relative lightness point [0-1] where chroma is max */;
    $ok-lr-min: 0;
    $ok-lr-max: 1;
    $ok-lr-range: calc($ok-lr-max - $ok-lr-min);
    $ok-lr-p: log(($ok-lr-vertex - $ok-lr-min) / $ok-lr-range, 33 / 52); /* currently set to make $ok-lr-32 match the lr at chroma apex */
    $ok-lr-0:  calc($ok-lr-min + ($ok-lr-range * pow( 1 / 52, $ok-lr-p)));
    $ok-lr-1:  calc($ok-lr-min + ($ok-lr-range * pow( 2 / 52, $ok-lr-p)));
    $ok-lr-2:  calc($ok-lr-min + ($ok-lr-range * pow( 3 / 52, $ok-lr-p)));
    $ok-lr-3:  calc($ok-lr-min + ($ok-lr-range * pow( 4 / 52, $ok-lr-p)));
    $ok-lr-4:  calc($ok-lr-min + ($ok-lr-range * pow( 5 / 52, $ok-lr-p)));
    $ok-lr-5:  calc($ok-lr-min + ($ok-lr-range * pow( 6 / 52, $ok-lr-p)));
    $ok-lr-6:  calc($ok-lr-min + ($ok-lr-range * pow( 7 / 52, $ok-lr-p)));
    $ok-lr-7:  calc($ok-lr-min + ($ok-lr-range * pow( 8 / 52, $ok-lr-p)));
    $ok-lr-8:  calc($ok-lr-min + ($ok-lr-range * pow( 9 / 52, $ok-lr-p)));
    $ok-lr-9:  calc($ok-lr-min + ($ok-lr-range * pow(10 / 52, $ok-lr-p)));
    $ok-lr-10: calc($ok-lr-min + ($ok-lr-range * pow(11 / 52, $ok-lr-p)));
    $ok-lr-11: calc($ok-lr-min + ($ok-lr-range * pow(12 / 52, $ok-lr-p)));
    $ok-lr-12: calc($ok-lr-min + ($ok-lr-range * pow(13 / 52, $ok-lr-p)));
    $ok-lr-13: calc($ok-lr-min + ($ok-lr-range * pow(14 / 52, $ok-lr-p)));
    $ok-lr-14: calc($ok-lr-min + ($ok-lr-range * pow(15 / 52, $ok-lr-p)));
    $ok-lr-15: calc($ok-lr-min + ($ok-lr-range * pow(16 / 52, $ok-lr-p)));
    $ok-lr-16: calc($ok-lr-min + ($ok-lr-range * pow(17 / 52, $ok-lr-p)));
    $ok-lr-17: calc($ok-lr-min + ($ok-lr-range * pow(18 / 52, $ok-lr-p)));
    $ok-lr-18: calc($ok-lr-min + ($ok-lr-range * pow(19 / 52, $ok-lr-p)));
    $ok-lr-19: calc($ok-lr-min + ($ok-lr-range * pow(20 / 52, $ok-lr-p)));
    $ok-lr-20: calc($ok-lr-min + ($ok-lr-range * pow(21 / 52, $ok-lr-p)));
    $ok-lr-21: calc($ok-lr-min + ($ok-lr-range * pow(22 / 52, $ok-lr-p)));
    $ok-lr-22: calc($ok-lr-min + ($ok-lr-range * pow(23 / 52, $ok-lr-p)));
    $ok-lr-23: calc($ok-lr-min + ($ok-lr-range * pow(24 / 52, $ok-lr-p)));
    $ok-lr-24: calc($ok-lr-min + ($ok-lr-range * pow(25 / 52, $ok-lr-p)));
    $ok-lr-25: calc($ok-lr-min + ($ok-lr-range * pow(26 / 52, $ok-lr-p)));
    $ok-lr-26: calc($ok-lr-min + ($ok-lr-range * pow(27 / 52, $ok-lr-p)));
    $ok-lr-27: calc($ok-lr-min + ($ok-lr-range * pow(28 / 52, $ok-lr-p)));
    $ok-lr-28: calc($ok-lr-min + ($ok-lr-range * pow(29 / 52, $ok-lr-p)));
    $ok-lr-29: calc($ok-lr-min + ($ok-lr-range * pow(30 / 52, $ok-lr-p)));
    $ok-lr-30: calc($ok-lr-min + ($ok-lr-range * pow(31 / 52, $ok-lr-p)));
    $ok-lr-31: calc($ok-lr-min + ($ok-lr-range * pow(32 / 52, $ok-lr-p)));
    $ok-lr-32: calc($ok-lr-min + ($ok-lr-range * pow(33 / 52, $ok-lr-p)));
    $ok-lr-33: calc($ok-lr-min + ($ok-lr-range * pow(34 / 52, $ok-lr-p)));
    $ok-lr-34: calc($ok-lr-min + ($ok-lr-range * pow(35 / 52, $ok-lr-p)));
    $ok-lr-35: calc($ok-lr-min + ($ok-lr-range * pow(36 / 52, $ok-lr-p)));
    $ok-lr-36: calc($ok-lr-min + ($ok-lr-range * pow(37 / 52, $ok-lr-p)));
    $ok-lr-37: calc($ok-lr-min + ($ok-lr-range * pow(38 / 52, $ok-lr-p)));
    $ok-lr-38: calc($ok-lr-min + ($ok-lr-range * pow(39 / 52, $ok-lr-p)));
    $ok-lr-39: calc($ok-lr-min + ($ok-lr-range * pow(40 / 52, $ok-lr-p)));
    $ok-lr-40: calc($ok-lr-min + ($ok-lr-range * pow(41 / 52, $ok-lr-p)));
    $ok-lr-41: calc($ok-lr-min + ($ok-lr-range * pow(42 / 52, $ok-lr-p)));
    $ok-lr-42: calc($ok-lr-min + ($ok-lr-range * pow(43 / 52, $ok-lr-p)));
    $ok-lr-43: calc($ok-lr-min + ($ok-lr-range * pow(44 / 52, $ok-lr-p)));
    $ok-lr-44: calc($ok-lr-min + ($ok-lr-range * pow(45 / 52, $ok-lr-p)));
    $ok-lr-45: calc($ok-lr-min + ($ok-lr-range * pow(46 / 52, $ok-lr-p)));
    $ok-lr-46: calc($ok-lr-min + ($ok-lr-range * pow(47 / 52, $ok-lr-p)));
    $ok-lr-47: calc($ok-lr-min + ($ok-lr-range * pow(48 / 52, $ok-lr-p)));
    $ok-lr-48: calc($ok-lr-min + ($ok-lr-range * pow(49 / 52, $ok-lr-p)));
    $ok-lr-49: calc($ok-lr-min + ($ok-lr-range * pow(50 / 52, $ok-lr-p)));
    $ok-lr-50: calc($ok-lr-min + ($ok-lr-range * pow(51 / 52, $ok-lr-p)));
    
    $ok-l-k1: 0.206;
    $ok-l-k2: 0.03;
    $ok-l-k3: calc((1 + $ok-l-k1) / (1 + $ok-l-k2));
    $ok-l-0:  calc(($ok-lr-0  * ($ok-lr-0  + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-0  + $ok-l-k2)));
    $ok-l-1:  calc(($ok-lr-1  * ($ok-lr-1  + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-1  + $ok-l-k2)));
    $ok-l-2:  calc(($ok-lr-2  * ($ok-lr-2  + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-2  + $ok-l-k2)));
    $ok-l-3:  calc(($ok-lr-3  * ($ok-lr-3  + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-3  + $ok-l-k2)));
    $ok-l-4:  calc(($ok-lr-4  * ($ok-lr-4  + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-4  + $ok-l-k2)));
    $ok-l-5:  calc(($ok-lr-5  * ($ok-lr-5  + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-5  + $ok-l-k2)));
    $ok-l-6:  calc(($ok-lr-6  * ($ok-lr-6  + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-6  + $ok-l-k2)));
    $ok-l-7:  calc(($ok-lr-7  * ($ok-lr-7  + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-7  + $ok-l-k2)));
    $ok-l-8:  calc(($ok-lr-8  * ($ok-lr-8  + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-8  + $ok-l-k2)));
    $ok-l-9:  calc(($ok-lr-9  * ($ok-lr-9  + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-9  + $ok-l-k2)));
    $ok-l-10: calc(($ok-lr-10 * ($ok-lr-10 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-10 + $ok-l-k2)));
    $ok-l-11: calc(($ok-lr-11 * ($ok-lr-11 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-11 + $ok-l-k2)));
    $ok-l-12: calc(($ok-lr-12 * ($ok-lr-12 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-12 + $ok-l-k2)));
    $ok-l-13: calc(($ok-lr-13 * ($ok-lr-13 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-13 + $ok-l-k2)));
    $ok-l-14: calc(($ok-lr-14 * ($ok-lr-14 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-14 + $ok-l-k2)));
    $ok-l-15: calc(($ok-lr-15 * ($ok-lr-15 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-15 + $ok-l-k2)));
    $ok-l-16: calc(($ok-lr-16 * ($ok-lr-16 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-16 + $ok-l-k2)));
    $ok-l-17: calc(($ok-lr-17 * ($ok-lr-17 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-17 + $ok-l-k2)));
    $ok-l-18: calc(($ok-lr-18 * ($ok-lr-18 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-18 + $ok-l-k2)));
    $ok-l-19: calc(($ok-lr-19 * ($ok-lr-19 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-19 + $ok-l-k2)));
    $ok-l-20: calc(($ok-lr-20 * ($ok-lr-20 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-20 + $ok-l-k2)));
    $ok-l-21: calc(($ok-lr-21 * ($ok-lr-21 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-21 + $ok-l-k2)));
    $ok-l-22: calc(($ok-lr-22 * ($ok-lr-22 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-22 + $ok-l-k2)));
    $ok-l-23: calc(($ok-lr-23 * ($ok-lr-23 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-23 + $ok-l-k2)));
    $ok-l-24: calc(($ok-lr-24 * ($ok-lr-24 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-24 + $ok-l-k2)));
    $ok-l-25: calc(($ok-lr-25 * ($ok-lr-25 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-25 + $ok-l-k2)));
    $ok-l-26: calc(($ok-lr-26 * ($ok-lr-26 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-26 + $ok-l-k2)));
    $ok-l-27: calc(($ok-lr-27 * ($ok-lr-27 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-27 + $ok-l-k2)));
    $ok-l-28: calc(($ok-lr-28 * ($ok-lr-28 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-28 + $ok-l-k2)));
    $ok-l-29: calc(($ok-lr-29 * ($ok-lr-29 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-29 + $ok-l-k2)));
    $ok-l-30: calc(($ok-lr-30 * ($ok-lr-30 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-30 + $ok-l-k2)));
    $ok-l-31: calc(($ok-lr-31 * ($ok-lr-31 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-31 + $ok-l-k2)));
    $ok-l-32: calc(($ok-lr-32 * ($ok-lr-32 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-32 + $ok-l-k2)));
    $ok-l-33: calc(($ok-lr-33 * ($ok-lr-33 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-33 + $ok-l-k2)));
    $ok-l-34: calc(($ok-lr-34 * ($ok-lr-34 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-34 + $ok-l-k2)));
    $ok-l-35: calc(($ok-lr-35 * ($ok-lr-35 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-35 + $ok-l-k2)));
    $ok-l-36: calc(($ok-lr-36 * ($ok-lr-36 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-36 + $ok-l-k2)));
    $ok-l-37: calc(($ok-lr-37 * ($ok-lr-37 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-37 + $ok-l-k2)));
    $ok-l-38: calc(($ok-lr-38 * ($ok-lr-38 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-38 + $ok-l-k2)));
    $ok-l-39: calc(($ok-lr-39 * ($ok-lr-39 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-39 + $ok-l-k2)));
    $ok-l-40: calc(($ok-lr-40 * ($ok-lr-40 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-40 + $ok-l-k2)));
    $ok-l-41: calc(($ok-lr-41 * ($ok-lr-41 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-41 + $ok-l-k2)));
    $ok-l-42: calc(($ok-lr-42 * ($ok-lr-42 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-42 + $ok-l-k2)));
    $ok-l-43: calc(($ok-lr-43 * ($ok-lr-43 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-43 + $ok-l-k2)));
    $ok-l-44: calc(($ok-lr-44 * ($ok-lr-44 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-44 + $ok-l-k2)));
    $ok-l-45: calc(($ok-lr-45 * ($ok-lr-45 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-45 + $ok-l-k2)));
    $ok-l-46: calc(($ok-lr-46 * ($ok-lr-46 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-46 + $ok-l-k2)));
    $ok-l-47: calc(($ok-lr-47 * ($ok-lr-47 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-47 + $ok-l-k2)));
    $ok-l-48: calc(($ok-lr-48 * ($ok-lr-48 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-48 + $ok-l-k2)));
    $ok-l-49: calc(($ok-lr-49 * ($ok-lr-49 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-49 + $ok-l-k2)));
    $ok-l-50: calc(($ok-lr-50 * ($ok-lr-50 + $ok-l-k1)) / ($ok-l-k3 * ($ok-lr-50 + $ok-l-k2)));

    $ok-c-max: 0.13; /* absolute chroma max for palette [0-1, but practically 0 - ~0.13] */
    $my-z-lr: $ok-lr-13; /* relative lightness point [0-1] of key color */
    $my-z-cr: 0.642; /* relative chroma point [0-1] of key color, at ok-lr-13, the max for silver(smallest c gamut with hue 230.8125) is ~0.67 */
    $ok-c-b: log($my-z-cr, $my-z-lr / $ok-lr-vertex);
    $ok-c-0switch:  sign((1 + sign($ok-lr-vertex - $ok-lr-0))  / 2);
    $ok-c-1switch:  sign((1 + sign($ok-lr-vertex - $ok-lr-1))  / 2);
    $ok-c-2switch:  sign((1 + sign($ok-lr-vertex - $ok-lr-2))  / 2);
    $ok-c-3switch:  sign((1 + sign($ok-lr-vertex - $ok-lr-3))  / 2);
    $ok-c-4switch:  sign((1 + sign($ok-lr-vertex - $ok-lr-4))  / 2);
    $ok-c-5switch:  sign((1 + sign($ok-lr-vertex - $ok-lr-5))  / 2);
    $ok-c-6switch:  sign((1 + sign($ok-lr-vertex - $ok-lr-6))  / 2);
    $ok-c-7switch:  sign((1 + sign($ok-lr-vertex - $ok-lr-7))  / 2);
    $ok-c-8switch:  sign((1 + sign($ok-lr-vertex - $ok-lr-8))  / 2);
    $ok-c-9switch:  sign((1 + sign($ok-lr-vertex - $ok-lr-9))  / 2);
    $ok-c-10switch: sign((1 + sign($ok-lr-vertex - $ok-lr-10)) / 2);
    $ok-c-11switch: sign((1 + sign($ok-lr-vertex - $ok-lr-11)) / 2);
    $ok-c-12switch: sign((1 + sign($ok-lr-vertex - $ok-lr-12)) / 2);
    $ok-c-13switch: sign((1 + sign($ok-lr-vertex - $ok-lr-13)) / 2);
    $ok-c-14switch: sign((1 + sign($ok-lr-vertex - $ok-lr-14)) / 2);
    $ok-c-15switch: sign((1 + sign($ok-lr-vertex - $ok-lr-15)) / 2);
    $ok-c-16switch: sign((1 + sign($ok-lr-vertex - $ok-lr-16)) / 2);
    $ok-c-17switch: sign((1 + sign($ok-lr-vertex - $ok-lr-17)) / 2);
    $ok-c-18switch: sign((1 + sign($ok-lr-vertex - $ok-lr-18)) / 2);
    $ok-c-19switch: sign((1 + sign($ok-lr-vertex - $ok-lr-19)) / 2);
    $ok-c-20switch: sign((1 + sign($ok-lr-vertex - $ok-lr-20)) / 2);
    $ok-c-21switch: sign((1 + sign($ok-lr-vertex - $ok-lr-21)) / 2);
    $ok-c-22switch: sign((1 + sign($ok-lr-vertex - $ok-lr-22)) / 2);
    $ok-c-23switch: sign((1 + sign($ok-lr-vertex - $ok-lr-23)) / 2);
    $ok-c-24switch: sign((1 + sign($ok-lr-vertex - $ok-lr-24)) / 2);
    $ok-c-25switch: sign((1 + sign($ok-lr-vertex - $ok-lr-25)) / 2);
    $ok-c-26switch: sign((1 + sign($ok-lr-vertex - $ok-lr-26)) / 2);
    $ok-c-27switch: sign((1 + sign($ok-lr-vertex - $ok-lr-27)) / 2);
    $ok-c-28switch: sign((1 + sign($ok-lr-vertex - $ok-lr-28)) / 2);
    $ok-c-29switch: sign((1 + sign($ok-lr-vertex - $ok-lr-29)) / 2);
    $ok-c-30switch: sign((1 + sign($ok-lr-vertex - $ok-lr-30)) / 2);
    $ok-c-31switch: sign((1 + sign($ok-lr-vertex - $ok-lr-31)) / 2);
    $ok-c-32switch: sign((1 + sign($ok-lr-vertex - $ok-lr-32)) / 2);
    $ok-c-33switch: sign((1 + sign($ok-lr-vertex - $ok-lr-33)) / 2);
    $ok-c-34switch: sign((1 + sign($ok-lr-vertex - $ok-lr-34)) / 2);
    $ok-c-35switch: sign((1 + sign($ok-lr-vertex - $ok-lr-35)) / 2);
    $ok-c-36switch: sign((1 + sign($ok-lr-vertex - $ok-lr-36)) / 2);
    $ok-c-37switch: sign((1 + sign($ok-lr-vertex - $ok-lr-37)) / 2);
    $ok-c-38switch: sign((1 + sign($ok-lr-vertex - $ok-lr-38)) / 2);
    $ok-c-39switch: sign((1 + sign($ok-lr-vertex - $ok-lr-39)) / 2);
    $ok-c-40switch: sign((1 + sign($ok-lr-vertex - $ok-lr-40)) / 2);
    $ok-c-41switch: sign((1 + sign($ok-lr-vertex - $ok-lr-41)) / 2);
    $ok-c-42switch: sign((1 + sign($ok-lr-vertex - $ok-lr-42)) / 2);
    $ok-c-43switch: sign((1 + sign($ok-lr-vertex - $ok-lr-43)) / 2);
    $ok-c-44switch: sign((1 + sign($ok-lr-vertex - $ok-lr-44)) / 2);
    $ok-c-45switch: sign((1 + sign($ok-lr-vertex - $ok-lr-45)) / 2);
    $ok-c-46switch: sign((1 + sign($ok-lr-vertex - $ok-lr-46)) / 2);
    $ok-c-47switch: sign((1 + sign($ok-lr-vertex - $ok-lr-47)) / 2);
    $ok-c-48switch: sign((1 + sign($ok-lr-vertex - $ok-lr-48)) / 2);
    $ok-c-49switch: sign((1 + sign($ok-lr-vertex - $ok-lr-49)) / 2);
    $ok-c-50switch: sign((1 + sign($ok-lr-vertex - $ok-lr-50)) / 2);
    $ok-c-0:  calc($ok-c-max * (($ok-c-0switch  * pow($ok-lr-0  / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-0switch)  * sqrt(abs(((1 - $ok-lr-0)  / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-0  - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-1:  calc($ok-c-max * (($ok-c-1switch  * pow($ok-lr-1  / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-1switch)  * sqrt(abs(((1 - $ok-lr-1)  / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-1  - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-2:  calc($ok-c-max * (($ok-c-2switch  * pow($ok-lr-2  / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-2switch)  * sqrt(abs(((1 - $ok-lr-2)  / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-2  - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-3:  calc($ok-c-max * (($ok-c-3switch  * pow($ok-lr-3  / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-3switch)  * sqrt(abs(((1 - $ok-lr-3)  / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-3  - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-4:  calc($ok-c-max * (($ok-c-4switch  * pow($ok-lr-4  / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-4switch)  * sqrt(abs(((1 - $ok-lr-4)  / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-4  - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-5:  calc($ok-c-max * (($ok-c-5switch  * pow($ok-lr-5  / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-5switch)  * sqrt(abs(((1 - $ok-lr-5)  / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-5  - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-6:  calc($ok-c-max * (($ok-c-6switch  * pow($ok-lr-6  / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-6switch)  * sqrt(abs(((1 - $ok-lr-6)  / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-6  - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-7:  calc($ok-c-max * (($ok-c-7switch  * pow($ok-lr-7  / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-7switch)  * sqrt(abs(((1 - $ok-lr-7)  / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-7  - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-8:  calc($ok-c-max * (($ok-c-8switch  * pow($ok-lr-8  / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-8switch)  * sqrt(abs(((1 - $ok-lr-8)  / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-8  - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-9:  calc($ok-c-max * (($ok-c-9switch  * pow($ok-lr-9  / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-9switch)  * sqrt(abs(((1 - $ok-lr-9)  / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-9  - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-10: calc($ok-c-max * (($ok-c-10switch * pow($ok-lr-10 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-10switch) * sqrt(abs(((1 - $ok-lr-10) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-10 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-11: calc($ok-c-max * (($ok-c-11switch * pow($ok-lr-11 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-11switch) * sqrt(abs(((1 - $ok-lr-11) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-11 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-12: calc($ok-c-max * (($ok-c-12switch * pow($ok-lr-12 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-12switch) * sqrt(abs(((1 - $ok-lr-12) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-12 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-13: calc($ok-c-max * (($ok-c-13switch * pow($ok-lr-13 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-13switch) * sqrt(abs(((1 - $ok-lr-13) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-13 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-14: calc($ok-c-max * (($ok-c-14switch * pow($ok-lr-14 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-14switch) * sqrt(abs(((1 - $ok-lr-14) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-14 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-15: calc($ok-c-max * (($ok-c-15switch * pow($ok-lr-15 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-15switch) * sqrt(abs(((1 - $ok-lr-15) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-15 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-16: calc($ok-c-max * (($ok-c-16switch * pow($ok-lr-16 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-16switch) * sqrt(abs(((1 - $ok-lr-16) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-16 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-17: calc($ok-c-max * (($ok-c-17switch * pow($ok-lr-17 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-17switch) * sqrt(abs(((1 - $ok-lr-17) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-17 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-18: calc($ok-c-max * (($ok-c-18switch * pow($ok-lr-18 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-18switch) * sqrt(abs(((1 - $ok-lr-18) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-18 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-19: calc($ok-c-max * (($ok-c-19switch * pow($ok-lr-19 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-19switch) * sqrt(abs(((1 - $ok-lr-19) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-19 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-20: calc($ok-c-max * (($ok-c-20switch * pow($ok-lr-20 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-20switch) * sqrt(abs(((1 - $ok-lr-20) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-20 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-21: calc($ok-c-max * (($ok-c-21switch * pow($ok-lr-21 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-21switch) * sqrt(abs(((1 - $ok-lr-21) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-21 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-22: calc($ok-c-max * (($ok-c-22switch * pow($ok-lr-22 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-22switch) * sqrt(abs(((1 - $ok-lr-22) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-22 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-23: calc($ok-c-max * (($ok-c-23switch * pow($ok-lr-23 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-23switch) * sqrt(abs(((1 - $ok-lr-23) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-23 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-24: calc($ok-c-max * (($ok-c-24switch * pow($ok-lr-24 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-24switch) * sqrt(abs(((1 - $ok-lr-24) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-24 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-25: calc($ok-c-max * (($ok-c-25switch * pow($ok-lr-25 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-25switch) * sqrt(abs(((1 - $ok-lr-25) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-25 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-26: calc($ok-c-max * (($ok-c-26switch * pow($ok-lr-26 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-26switch) * sqrt(abs(((1 - $ok-lr-26) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-26 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-27: calc($ok-c-max * (($ok-c-27switch * pow($ok-lr-27 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-27switch) * sqrt(abs(((1 - $ok-lr-27) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-27 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-28: calc($ok-c-max * (($ok-c-28switch * pow($ok-lr-28 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-28switch) * sqrt(abs(((1 - $ok-lr-28) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-28 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-29: calc($ok-c-max * (($ok-c-29switch * pow($ok-lr-29 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-29switch) * sqrt(abs(((1 - $ok-lr-29) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-29 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-30: calc($ok-c-max * (($ok-c-30switch * pow($ok-lr-30 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-30switch) * sqrt(abs(((1 - $ok-lr-30) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-30 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-31: calc($ok-c-max * (($ok-c-31switch * pow($ok-lr-31 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-31switch) * sqrt(abs(((1 - $ok-lr-31) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-31 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-32: calc($ok-c-max * (($ok-c-32switch * pow($ok-lr-32 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-32switch) * sqrt(abs(((1 - $ok-lr-32) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-32 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-33: calc($ok-c-max * (($ok-c-33switch * pow($ok-lr-33 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-33switch) * sqrt(abs(((1 - $ok-lr-33) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-33 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-34: calc($ok-c-max * (($ok-c-34switch * pow($ok-lr-34 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-34switch) * sqrt(abs(((1 - $ok-lr-34) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-34 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-35: calc($ok-c-max * (($ok-c-35switch * pow($ok-lr-35 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-35switch) * sqrt(abs(((1 - $ok-lr-35) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-35 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-36: calc($ok-c-max * (($ok-c-36switch * pow($ok-lr-36 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-36switch) * sqrt(abs(((1 - $ok-lr-36) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-36 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-37: calc($ok-c-max * (($ok-c-37switch * pow($ok-lr-37 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-37switch) * sqrt(abs(((1 - $ok-lr-37) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-37 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-38: calc($ok-c-max * (($ok-c-38switch * pow($ok-lr-38 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-38switch) * sqrt(abs(((1 - $ok-lr-38) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-38 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-39: calc($ok-c-max * (($ok-c-39switch * pow($ok-lr-39 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-39switch) * sqrt(abs(((1 - $ok-lr-39) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-39 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-40: calc($ok-c-max * (($ok-c-40switch * pow($ok-lr-40 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-40switch) * sqrt(abs(((1 - $ok-lr-40) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-40 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-41: calc($ok-c-max * (($ok-c-41switch * pow($ok-lr-41 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-41switch) * sqrt(abs(((1 - $ok-lr-41) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-41 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-42: calc($ok-c-max * (($ok-c-42switch * pow($ok-lr-42 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-42switch) * sqrt(abs(((1 - $ok-lr-42) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-42 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-43: calc($ok-c-max * (($ok-c-43switch * pow($ok-lr-43 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-43switch) * sqrt(abs(((1 - $ok-lr-43) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-43 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-44: calc($ok-c-max * (($ok-c-44switch * pow($ok-lr-44 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-44switch) * sqrt(abs(((1 - $ok-lr-44) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-44 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-45: calc($ok-c-max * (($ok-c-45switch * pow($ok-lr-45 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-45switch) * sqrt(abs(((1 - $ok-lr-45) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-45 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-46: calc($ok-c-max * (($ok-c-46switch * pow($ok-lr-46 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-46switch) * sqrt(abs(((1 - $ok-lr-46) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-46 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-47: calc($ok-c-max * (($ok-c-47switch * pow($ok-lr-47 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-47switch) * sqrt(abs(((1 - $ok-lr-47) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-47 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-48: calc($ok-c-max * (($ok-c-48switch * pow($ok-lr-48 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-48switch) * sqrt(abs(((1 - $ok-lr-48) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-48 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-49: calc($ok-c-max * (($ok-c-49switch * pow($ok-lr-49 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-49switch) * sqrt(abs(((1 - $ok-lr-49) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-49 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));
    $ok-c-50: calc($ok-c-max * (($ok-c-50switch * pow($ok-lr-50 / $ok-lr-vertex, $ok-c-b)) + ((1 - $ok-c-50switch) * sqrt(abs(((1 - $ok-lr-50) / (1 - $ok-lr-vertex)) * (1 - pow(abs(($ok-lr-50 - $ok-lr-vertex) / (1 - $ok-lr-vertex)), $ok-c-b)))))));

    $color-grey-0:  oklab($ok-l-0  0 0);
    $color-grey-1:  oklab($ok-l-1  0 0);
    $color-grey-2:  oklab($ok-l-2  0 0);
    $color-grey-3:  oklab($ok-l-3  0 0);
    $color-grey-4:  oklab($ok-l-4  0 0);
    $color-grey-5:  oklab($ok-l-5  0 0);
    $color-grey-6:  oklab($ok-l-6  0 0);
    $color-grey-7:  oklab($ok-l-7  0 0);
    $color-grey-8:  oklab($ok-l-8  0 0);
    $color-grey-9:  oklab($ok-l-9  0 0);
    $color-grey-10: oklab($ok-l-10 0 0);
    $color-grey-11: oklab($ok-l-11 0 0);
    $color-grey-12: oklab($ok-l-12 0 0);
    $color-grey-13: oklab($ok-l-13 0 0);
    $color-grey-14: oklab($ok-l-14 0 0);
    $color-grey-15: oklab($ok-l-15 0 0);
    $color-grey-16: oklab($ok-l-16 0 0);
    $color-grey-17: oklab($ok-l-17 0 0);
    $color-grey-18: oklab($ok-l-18 0 0);
    $color-grey-19: oklab($ok-l-19 0 0);
    $color-grey-20: oklab($ok-l-20 0 0);
    $color-grey-21: oklab($ok-l-21 0 0);
    $color-grey-22: oklab($ok-l-22 0 0);
    $color-grey-23: oklab($ok-l-23 0 0);
    $color-grey-24: oklab($ok-l-24 0 0);
    $color-grey-25: oklab($ok-l-25 0 0);
    $color-grey-26: oklab($ok-l-26 0 0);
    $color-grey-27: oklab($ok-l-27 0 0);
    $color-grey-28: oklab($ok-l-28 0 0);
    $color-grey-29: oklab($ok-l-29 0 0);
    $color-grey-30: oklab($ok-l-30 0 0);
    $color-grey-31: oklab($ok-l-31 0 0);
    $color-grey-32: oklab($ok-l-32 0 0);
    $color-grey-33: oklab($ok-l-33 0 0);
    $color-grey-34: oklab($ok-l-34 0 0);
    $color-grey-35: oklab($ok-l-35 0 0);
    $color-grey-36: oklab($ok-l-36 0 0);
    $color-grey-37: oklab($ok-l-37 0 0);
    $color-grey-38: oklab($ok-l-38 0 0);
    $color-grey-39: oklab($ok-l-39 0 0);
    $color-grey-40: oklab($ok-l-40 0 0);
    $color-grey-41: oklab($ok-l-41 0 0);
    $color-grey-42: oklab($ok-l-42 0 0);
    $color-grey-43: oklab($ok-l-43 0 0);
    $color-grey-44: oklab($ok-l-44 0 0);
    $color-grey-45: oklab($ok-l-45 0 0);
    $color-grey-46: oklab($ok-l-46 0 0);
    $color-grey-47: oklab($ok-l-47 0 0);
    $color-grey-48: oklab($ok-l-48 0 0);
    $color-grey-49: oklab($ok-l-49 0 0);
    $color-grey-50: oklab($ok-l-50 0 0);

    $hue-aqua: 230.8125;
    $color-aqua-0:  oklch($ok-l-0  $ok-c-0  calc($hue-aqua + 0));
    $color-aqua-1:  oklch($ok-l-1  $ok-c-1  calc($hue-aqua + 0));
    $color-aqua-2:  oklch($ok-l-2  $ok-c-2  calc($hue-aqua + 0));
    $color-aqua-3:  oklch($ok-l-3  $ok-c-3  calc($hue-aqua + 0));
    $color-aqua-4:  oklch($ok-l-4  $ok-c-4  calc($hue-aqua + 0));
    $color-aqua-5:  oklch($ok-l-5  $ok-c-5  calc($hue-aqua + 0));
    $color-aqua-6:  oklch($ok-l-6  $ok-c-6  calc($hue-aqua + 0));
    $color-aqua-7:  oklch($ok-l-7  $ok-c-7  calc($hue-aqua + 0));
    $color-aqua-8:  oklch($ok-l-8  $ok-c-8  calc($hue-aqua + 0));
    $color-aqua-9:  oklch($ok-l-9  $ok-c-9  calc($hue-aqua + 0));
    $color-aqua-10: oklch($ok-l-10 $ok-c-10 calc($hue-aqua + 0));
    $color-aqua-11: oklch($ok-l-11 $ok-c-11 calc($hue-aqua + 0));
    $color-aqua-12: oklch($ok-l-12 $ok-c-12 calc($hue-aqua + 0));
    $color-aqua-13: oklch($ok-l-13 $ok-c-13 calc($hue-aqua + 0));
    $color-aqua-14: oklch($ok-l-14 $ok-c-14 calc($hue-aqua + 0));
    $color-aqua-15: oklch($ok-l-15 $ok-c-15 calc($hue-aqua + 0));
    $color-aqua-16: oklch($ok-l-16 $ok-c-16 calc($hue-aqua + 0));
    $color-aqua-17: oklch($ok-l-17 $ok-c-17 calc($hue-aqua + 0));
    $color-aqua-18: oklch($ok-l-18 $ok-c-18 calc($hue-aqua + 0));
    $color-aqua-19: oklch($ok-l-19 $ok-c-19 calc($hue-aqua + 0));
    $color-aqua-20: oklch($ok-l-20 $ok-c-20 calc($hue-aqua + 0));
    $color-aqua-21: oklch($ok-l-21 $ok-c-21 calc($hue-aqua + 0));
    $color-aqua-22: oklch($ok-l-22 $ok-c-22 calc($hue-aqua + 0));
    $color-aqua-23: oklch($ok-l-23 $ok-c-23 calc($hue-aqua + 0));
    $color-aqua-24: oklch($ok-l-24 $ok-c-24 calc($hue-aqua + 0));
    $color-aqua-25: oklch($ok-l-25 $ok-c-25 calc($hue-aqua + 0));
    $color-aqua-26: oklch($ok-l-26 $ok-c-26 calc($hue-aqua + 0));
    $color-aqua-27: oklch($ok-l-27 $ok-c-27 calc($hue-aqua + 0));
    $color-aqua-28: oklch($ok-l-28 $ok-c-28 calc($hue-aqua + 0));
    $color-aqua-29: oklch($ok-l-29 $ok-c-29 calc($hue-aqua + 0));
    $color-aqua-30: oklch($ok-l-30 $ok-c-30 calc($hue-aqua + 0));
    $color-aqua-31: oklch($ok-l-31 $ok-c-31 calc($hue-aqua + 0));
    $color-aqua-32: oklch($ok-l-32 $ok-c-32 calc($hue-aqua + 0));
    $color-aqua-33: oklch($ok-l-33 $ok-c-33 calc($hue-aqua + 0));
    $color-aqua-34: oklch($ok-l-34 $ok-c-34 calc($hue-aqua + 0));
    $color-aqua-35: oklch($ok-l-35 $ok-c-35 calc($hue-aqua + 0));
    $color-aqua-36: oklch($ok-l-36 $ok-c-36 calc($hue-aqua + 0));
    $color-aqua-37: oklch($ok-l-37 $ok-c-37 calc($hue-aqua + 0));
    $color-aqua-38: oklch($ok-l-38 $ok-c-38 calc($hue-aqua + 0));
    $color-aqua-39: oklch($ok-l-39 $ok-c-39 calc($hue-aqua + 0));
    $color-aqua-40: oklch($ok-l-40 $ok-c-40 calc($hue-aqua + 0));
    $color-aqua-41: oklch($ok-l-41 $ok-c-41 calc($hue-aqua + 0));
    $color-aqua-42: oklch($ok-l-42 $ok-c-42 calc($hue-aqua + 0));
    $color-aqua-43: oklch($ok-l-43 $ok-c-43 calc($hue-aqua + 0));
    $color-aqua-44: oklch($ok-l-44 $ok-c-44 calc($hue-aqua + 0));
    $color-aqua-45: oklch($ok-l-45 $ok-c-45 calc($hue-aqua + 0));
    $color-aqua-46: oklch($ok-l-46 $ok-c-46 calc($hue-aqua + 0));
    $color-aqua-47: oklch($ok-l-47 $ok-c-47 calc($hue-aqua + 0));
    $color-aqua-48: oklch($ok-l-48 $ok-c-48 calc($hue-aqua + 0));
    $color-aqua-49: oklch($ok-l-49 $ok-c-49 calc($hue-aqua + 0));
    $color-aqua-50: oklch($ok-l-50 $ok-c-50 calc($hue-aqua + 0));

    $hue-blue: 245.5;
    $color-blue-0:  oklch($ok-l-0  $ok-c-0  calc($hue-blue + 0));
    $color-blue-1:  oklch($ok-l-1  $ok-c-1  calc($hue-blue + 0));
    $color-blue-2:  oklch($ok-l-2  $ok-c-2  calc($hue-blue + 0));
    $color-blue-3:  oklch($ok-l-3  $ok-c-3  calc($hue-blue + 0));
    $color-blue-4:  oklch($ok-l-4  $ok-c-4  calc($hue-blue + 0));
    $color-blue-5:  oklch($ok-l-5  $ok-c-5  calc($hue-blue + 0));
    $color-blue-6:  oklch($ok-l-6  $ok-c-6  calc($hue-blue + 0));
    $color-blue-7:  oklch($ok-l-7  $ok-c-7  calc($hue-blue + 0));
    $color-blue-8:  oklch($ok-l-8  $ok-c-8  calc($hue-blue + 0));
    $color-blue-9:  oklch($ok-l-9  $ok-c-9  calc($hue-blue + 0));
    $color-blue-10: oklch($ok-l-10 $ok-c-10 calc($hue-blue + 0));
    $color-blue-11: oklch($ok-l-11 $ok-c-11 calc($hue-blue + 0));
    $color-blue-12: oklch($ok-l-12 $ok-c-12 calc($hue-blue + 0));
    $color-blue-13: oklch($ok-l-13 $ok-c-13 calc($hue-blue + 0));
    $color-blue-14: oklch($ok-l-14 $ok-c-14 calc($hue-blue + 0));
    $color-blue-15: oklch($ok-l-15 $ok-c-15 calc($hue-blue + 0));
    $color-blue-16: oklch($ok-l-16 $ok-c-16 calc($hue-blue + 0));
    $color-blue-17: oklch($ok-l-17 $ok-c-17 calc($hue-blue + 0));
    $color-blue-18: oklch($ok-l-18 $ok-c-18 calc($hue-blue + 0));
    $color-blue-19: oklch($ok-l-19 $ok-c-19 calc($hue-blue + 0));
    $color-blue-20: oklch($ok-l-20 $ok-c-20 calc($hue-blue + 0));
    $color-blue-21: oklch($ok-l-21 $ok-c-21 calc($hue-blue + 0));
    $color-blue-22: oklch($ok-l-22 $ok-c-22 calc($hue-blue + 0));
    $color-blue-23: oklch($ok-l-23 $ok-c-23 calc($hue-blue + 0));
    $color-blue-24: oklch($ok-l-24 $ok-c-24 calc($hue-blue + 0));
    $color-blue-25: oklch($ok-l-25 $ok-c-25 calc($hue-blue + 0));
    $color-blue-26: oklch($ok-l-26 $ok-c-26 calc($hue-blue + 0));
    $color-blue-27: oklch($ok-l-27 $ok-c-27 calc($hue-blue + 0));
    $color-blue-28: oklch($ok-l-28 $ok-c-28 calc($hue-blue + 0));
    $color-blue-29: oklch($ok-l-29 $ok-c-29 calc($hue-blue + 0));
    $color-blue-30: oklch($ok-l-30 $ok-c-30 calc($hue-blue + 0));
    $color-blue-31: oklch($ok-l-31 $ok-c-31 calc($hue-blue + 0));
    $color-blue-32: oklch($ok-l-32 $ok-c-32 calc($hue-blue + 0));
    $color-blue-33: oklch($ok-l-33 $ok-c-33 calc($hue-blue + 0));
    $color-blue-34: oklch($ok-l-34 $ok-c-34 calc($hue-blue + 0));
    $color-blue-35: oklch($ok-l-35 $ok-c-35 calc($hue-blue + 0));
    $color-blue-36: oklch($ok-l-36 $ok-c-36 calc($hue-blue + 0));
    $color-blue-37: oklch($ok-l-37 $ok-c-37 calc($hue-blue + 0));
    $color-blue-38: oklch($ok-l-38 $ok-c-38 calc($hue-blue + 0));
    $color-blue-39: oklch($ok-l-39 $ok-c-39 calc($hue-blue + 0));
    $color-blue-40: oklch($ok-l-40 $ok-c-40 calc($hue-blue + 0));
    $color-blue-41: oklch($ok-l-41 $ok-c-41 calc($hue-blue + 0));
    $color-blue-42: oklch($ok-l-42 $ok-c-42 calc($hue-blue + 0));
    $color-blue-43: oklch($ok-l-43 $ok-c-43 calc($hue-blue + 0));
    $color-blue-44: oklch($ok-l-44 $ok-c-44 calc($hue-blue + 0));
    $color-blue-45: oklch($ok-l-45 $ok-c-45 calc($hue-blue + 0));
    $color-blue-46: oklch($ok-l-46 $ok-c-46 calc($hue-blue + 0));
    $color-blue-47: oklch($ok-l-47 $ok-c-47 calc($hue-blue + 0));
    $color-blue-48: oklch($ok-l-48 $ok-c-48 calc($hue-blue + 0));
    $color-blue-49: oklch($ok-l-49 $ok-c-49 calc($hue-blue + 0));
    $color-blue-50: oklch($ok-l-50 $ok-c-50 calc($hue-blue + 0));

    $hue-honey: 78.625;
    $color-honey-0:  oklch($ok-l-0  $ok-c-0  calc($hue-honey + 0));
    $color-honey-1:  oklch($ok-l-1  $ok-c-1  calc($hue-honey + 0));
    $color-honey-2:  oklch($ok-l-2  $ok-c-2  calc($hue-honey + 0));
    $color-honey-3:  oklch($ok-l-3  $ok-c-3  calc($hue-honey + 0));
    $color-honey-4:  oklch($ok-l-4  $ok-c-4  calc($hue-honey + 0));
    $color-honey-5:  oklch($ok-l-5  $ok-c-5  calc($hue-honey + 0));
    $color-honey-6:  oklch($ok-l-6  $ok-c-6  calc($hue-honey + 0));
    $color-honey-7:  oklch($ok-l-7  $ok-c-7  calc($hue-honey + 0));
    $color-honey-8:  oklch($ok-l-8  $ok-c-8  calc($hue-honey + 0));
    $color-honey-9:  oklch($ok-l-9  $ok-c-9  calc($hue-honey + 0));
    $color-honey-10: oklch($ok-l-10 $ok-c-10 calc($hue-honey + 0));
    $color-honey-11: oklch($ok-l-11 $ok-c-11 calc($hue-honey + 0));
    $color-honey-12: oklch($ok-l-12 $ok-c-12 calc($hue-honey + 0));
    $color-honey-13: oklch($ok-l-13 $ok-c-13 calc($hue-honey + 0));
    $color-honey-14: oklch($ok-l-14 $ok-c-14 calc($hue-honey + 0));
    $color-honey-15: oklch($ok-l-15 $ok-c-15 calc($hue-honey + 0));
    $color-honey-16: oklch($ok-l-16 $ok-c-16 calc($hue-honey + 0));
    $color-honey-17: oklch($ok-l-17 $ok-c-17 calc($hue-honey + 0));
    $color-honey-18: oklch($ok-l-18 $ok-c-18 calc($hue-honey + 0));
    $color-honey-19: oklch($ok-l-19 $ok-c-19 calc($hue-honey + 0));
    $color-honey-20: oklch($ok-l-20 $ok-c-20 calc($hue-honey + 0));
    $color-honey-21: oklch($ok-l-21 $ok-c-21 calc($hue-honey + 0));
    $color-honey-22: oklch($ok-l-22 $ok-c-22 calc($hue-honey + 0));
    $color-honey-23: oklch($ok-l-23 $ok-c-23 calc($hue-honey + 0));
    $color-honey-24: oklch($ok-l-24 $ok-c-24 calc($hue-honey + 0));
    $color-honey-25: oklch($ok-l-25 $ok-c-25 calc($hue-honey + 0));
    $color-honey-26: oklch($ok-l-26 $ok-c-26 calc($hue-honey + 0));
    $color-honey-27: oklch($ok-l-27 $ok-c-27 calc($hue-honey + 0));
    $color-honey-28: oklch($ok-l-28 $ok-c-28 calc($hue-honey + 0));
    $color-honey-29: oklch($ok-l-29 $ok-c-29 calc($hue-honey + 0));
    $color-honey-30: oklch($ok-l-30 $ok-c-30 calc($hue-honey + 0));
    $color-honey-31: oklch($ok-l-31 $ok-c-31 calc($hue-honey + 0));
    $color-honey-32: oklch($ok-l-32 $ok-c-32 calc($hue-honey + 0));
    $color-honey-33: oklch($ok-l-33 $ok-c-33 calc($hue-honey + 0));
    $color-honey-34: oklch($ok-l-34 $ok-c-34 calc($hue-honey + 0));
    $color-honey-35: oklch($ok-l-35 $ok-c-35 calc($hue-honey + 0));
    $color-honey-36: oklch($ok-l-36 $ok-c-36 calc($hue-honey + 0));
    $color-honey-37: oklch($ok-l-37 $ok-c-37 calc($hue-honey + 0));
    $color-honey-38: oklch($ok-l-38 $ok-c-38 calc($hue-honey + 0));
    $color-honey-39: oklch($ok-l-39 $ok-c-39 calc($hue-honey + 0));
    $color-honey-40: oklch($ok-l-40 $ok-c-40 calc($hue-honey + 0));
    $color-honey-41: oklch($ok-l-41 $ok-c-41 calc($hue-honey + 0));
    $color-honey-42: oklch($ok-l-42 $ok-c-42 calc($hue-honey + 0));
    $color-honey-43: oklch($ok-l-43 $ok-c-43 calc($hue-honey + 0));
    $color-honey-44: oklch($ok-l-44 $ok-c-44 calc($hue-honey + 0));
    $color-honey-45: oklch($ok-l-45 $ok-c-45 calc($hue-honey + 0));
    $color-honey-46: oklch($ok-l-46 $ok-c-46 calc($hue-honey + 0));
    $color-honey-47: oklch($ok-l-47 $ok-c-47 calc($hue-honey + 0));
    $color-honey-48: oklch($ok-l-48 $ok-c-48 calc($hue-honey + 0));
    $color-honey-49: oklch($ok-l-49 $ok-c-49 calc($hue-honey + 0));
    $color-honey-50: oklch($ok-l-50 $ok-c-50 calc($hue-honey + 0));

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