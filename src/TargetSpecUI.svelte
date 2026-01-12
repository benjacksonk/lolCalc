<script lang="ts">
    import { CalculateBaseStats, Champion, DefiniteNumberMap, StatType } from "$lib/types.svelte";

    let {
        targetBaseStats = $bindable()
    } : {
        targetBaseStats: DefiniteNumberMap<StatType>
    } = $props();

    let targetChampProfile: Champion|null
    = $state(null);

    let targetLevel: number
    = $state(1);

    let usesCustomProfile: boolean
    = $derived(targetChampProfile == null);

    function UpdateTargetProfileStats() {
        if (targetChampProfile == null) {
            return;
        }
        
        targetBaseStats = CalculateBaseStats(targetChampProfile, targetLevel);
    }
</script>



<div class="TargetSpecUI">
    <div class="targetChampIconWrapper">
        <img src={targetChampProfile?.iconURL ?? "https://wiki.leagueoflegends.com/en-us/images/On_Duty%21.png"} alt={targetChampProfile?.name ?? "Target Dummy"} class="icon max targetChampIcon">
        <div class="targetChampIconOverlay" style:visibility={usesCustomProfile ? "visible" : "hidden"}></div>
    </div>

    <div class="targetSpecControls">
        <div class="control">
            <label>
                <span>Target:</span>

                <select bind:value={
                    () => targetChampProfile,
                    (v) => {
                        targetChampProfile = v;
                        UpdateTargetProfileStats();
                    }
                }>
                    <option value={null}>Custom</option>

                    {#each Champion.all as champ}
                    <option value={champ}>{champ.name}</option>
                    {/each}
                </select>

                Lv

                <input type="number" min="1" max="20" 
                bind:value={
                    () => targetLevel, 
                    (v) => {
                        targetLevel = v;
                        UpdateTargetProfileStats();
                    }
                }
                disabled={usesCustomProfile}
                />
            </label>
        </div>

        <div class="control">
            <input type="number" min="0" max="9999" 
            bind:value={() => targetBaseStats.get(StatType.Health), (v) => targetBaseStats.set(StatType.Health, v)}
            disabled={!usesCustomProfile}
            /> Health
        </div>
        
        <div class="control">
            <input type="number" min="0" max="999" 
            bind:value={() => targetBaseStats.get(StatType.Armor), (v) => targetBaseStats.set(StatType.Armor, v)}
            disabled={!usesCustomProfile}
            /> Armor
        </div>
        
        <div class="control">
            <input type="number" min="0" max="999" 
            bind:value={() => targetBaseStats.get(StatType.MagicResistance), (v) => targetBaseStats.set(StatType.MagicResistance, v)}
            disabled={!usesCustomProfile}
            /> Magic Resistance
        </div>
    </div>
</div>



<style>
    .TargetSpecUI {
        display: flex;

        flex-flow: row nowrap;
        gap: 20px;
        justify-content: start;
    }

    .targetSpecControls {
        display: flex;

        flex-flow: column nowrap;
        gap: 5px;
        justify-content: center;
    }

    .control {
        display: flex;
        
        flex-flow: row nowrap;
    }

    .targetChampIconWrapper {
        width: max-content;
        height: max-content;
        position: relative;

        .targetChampIconOverlay {
            z-index: 1;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;

            box-shadow: inset 0 0 6px 6px black;
        }
    }
</style>