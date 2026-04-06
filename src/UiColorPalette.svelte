<script lang="ts">
    let colorNames = $state<string[]>(["grey", "aqua", "blue", "honey", "coral"]);
</script>



<div class="UiColorPalette">
    {#each colorNames as colorName}
    <div class="hue">
        <p class="name">{colorName}</p>
        
        {#each Array(31) as undefinedItem, i}
        <div class="color" style:background-color={`var(--color-${colorName}-${30 - i})`}></div>
        {/each}
    </div>
    {/each}
</div>



<style>
    .UiColorPalette {
        height: stretch;
        display: grid;
        grid-template-rows: repeat(32, minmax(0,1fr));
        grid-auto-columns: minmax(0,1fr);
    }

    .hue, .name, .color {
        display: grid;
        grid-template: subgrid / subgrid;
    } 

    .hue {
        grid-row: 1 / -1;
    }

    .name {
    }

    .color {
    }
</style>