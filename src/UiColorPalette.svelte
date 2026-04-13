<script lang="ts">
    let isZeroIndexed = $state<boolean>(true);
    let maxIndex = $state<number>(50);
    let hueNames = $state<string[]>(["grey","red","coral","honey","green","aqua","blue"]);
    let dummys = $derived(Array(maxIndex + (isZeroIndexed ? 1 : 0)));
</script>



<div class="UiColorPalette" style:grid-template-rows={`repeat(${dummys.length + 2}, minmax(0,1fr))`};>
    {#each hueNames as hueName, i}
    <div class="hue">
        <div class="name" style:color="#777" style:background-color={"white"}></div>
        
        {#each dummys as dummy, j}
        <div class="color" style:background-color={`var(--color-${hueName}-${dummys.length - j - (isZeroIndexed ? 1 : 0)})`}></div>
        {/each}

        <div class="color" style:color="#7778" style:background-color={"black"}></div>
    </div>
    {/each}
</div>



<style>
    .UiColorPalette {
        height: stretch;
        display: grid;
        grid-auto-columns: minmax(0,1fr);
    }

    .hue, .name, .color {
        text-align: center;
        display: grid;
        grid-template: subgrid / subgrid;
        font-weight: 500;
    } 

    .hue {
        grid-row: 1 / -1;
    }

    .name {
    }

    .color {
    }
</style>