<script lang="ts">
    import { StatType, type Stats } from "$lib/types.svelte";

    let {
        targetBaseStats = $bindable()
    } : {
        targetBaseStats: Stats
    } = $props();
</script>



<div class="TargetSpecUI">
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



<style>
    .TargetSpecUI {
        display: flex;

        flex-flow: column nowrap;
    }

    .control {
        display: flex;
        
        flex-flow: row nowrap;
    }
</style>