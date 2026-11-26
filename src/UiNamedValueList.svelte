<script lang="ts">
    type NamedValuePair = [string, number];

    let {
        entries,
    } : {
        entries: [ArrayLike<NamedValuePair>, ArrayLike<NamedValuePair>],
    } = $props();
</script>



{#snippet tableEntry(isPriority: boolean, [name, value]: [string, number], isPercent: boolean = false)}
<span class="entry" class:prominentEntry={isPriority}>
    <span class="entryValue text-math">
        {#if isPercent}
            {parseFloat((value * 100).toFixed(2))}%
        {:else}
            {parseFloat((value).toFixed(2))}
        {/if}
    </span>

    {#if isPriority}
        <b class="entryName">{name}</b>
    {:else}
        <span class="entryName text-passage">{name}</span>
    {/if}
</span>
{/snippet}

{#if entries.flat().length > 0}
<div class="UiNamedValueList">
    {#each entries[0] as priorityEntry}
    {@render tableEntry(true, priorityEntry, priorityEntry[0].includes("%"))}
    {/each}

    {#each entries[1] as nonpriorityEntry}
    {@render tableEntry(false, nonpriorityEntry, nonpriorityEntry[0].includes("%"))}
    {/each}
</div>
{/if}



<style lang="scss">
    .UiNamedValueList {
        display: grid;
        grid-template-columns: auto auto;
        gap: 5px;

        color: colors.hcl("aqua", 5, 47);
		overflow: visible;
    }

    .prominentEntry {
        font-weight: 600;
        color: colors.hcl("honey", 5, 44);
    }

    .entry {
        grid-column: span 2;
        display: grid;
        gap: 20px;
        
        grid-template-columns: subgrid;
        grid-template-rows: subgrid;
        align-items: baseline;
    }

    .entryValue {
        text-align: right;
        display: grid;
    }

    .entryName {
        text-align: left;
        display: grid;
    }
</style>