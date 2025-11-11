<script lang="ts">
    import { DefiniteNumberMap, StatType } from "$lib/types.svelte";

    let {
        targetBaseStats = $bindable()
    } : {
        targetBaseStats: DefiniteNumberMap<StatType>
    } = $props();
</script>



<div class="TargetSpecUI">
    <div class="dummyIconWrapper">
        <img src="https://wiki.leagueoflegends.com/en-us/images/On_Duty%21.png" alt="Target Dummy" class="icon max dummyIcon">
        <div class="dummyIconOverlay"></div>
    </div>

    <div class="targetSpecControls">
        <div class="control">
            <input type="number" min="0" max="9999" 
            bind:value={() => targetBaseStats.get(StatType.Health), (v) => targetBaseStats.set(StatType.Health, v)}
            /> Health
        </div>
        
        <div class="control">
            <input type="number" min="0" max="999" 
            bind:value={() => targetBaseStats.get(StatType.Armor), (v) => targetBaseStats.set(StatType.Armor, v)}
            /> Armor
        </div>
        
        <div class="control">
            <input type="number" min="0" max="999" 
            bind:value={() => targetBaseStats.get(StatType.MagicResistance), (v) => targetBaseStats.set(StatType.MagicResistance, v)}
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

    .dummyIconWrapper {
        width: max-content;
        height: max-content;
        position: relative;

        .dummyIconOverlay {
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