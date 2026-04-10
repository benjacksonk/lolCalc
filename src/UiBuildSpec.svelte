<script lang="ts">
    import { BuildConfig, GameConfig, Item, ItemSlotConfig } from "$lib/types.svelte";
    import UiAffectorIcon from "./UiAffectorIcon.svelte";
    import UiStatsTooltip from "./UiStatsTooltip.svelte";

    let {
        buildConfig = $bindable(),
        buildIndex,
        derivedGameConfig
    } : {
        buildConfig: BuildConfig,
        buildIndex: number,
        derivedGameConfig: GameConfig
    } = $props();

    let statsTooltip = $state<UiStatsTooltip>();

    function handleMouseDownOnItemOption(event: MouseEvent, itemConfig: ItemSlotConfig, item: Item) {
        event.preventDefault();
        itemConfig.item = item;
    }
</script>



<div class="UiBuildSpec">
    <button class="price" interestfor={statsTooltip?.uid}>
        <span class="priceAmount">{buildConfig.totalCost.toFixed(0)}</span>
        <span class="priceUnit">g</span>
    </button>

    <UiStatsTooltip
    bind:this={statsTooltip}
    stats={derivedGameConfig.statsPostEval}
    edgeAlignment="left"
    header={"Initial Stat Totals"}
    />

    <div class="itemSlotGrid">
        {#each buildConfig.itemSlots as itemConfig, i}
        <div>
            <button class="plain affectorButton slotButton" popovertarget={`itemSelector-${buildIndex}-${i}`}>
                <UiAffectorIcon affector={itemConfig.item} size="min" showNameOnHover={true} showStatsOnHover={true}/>
            </button>
            
            <div popover id={`itemSelector-${buildIndex}-${i}`} class="itemSelector alignLeftEdge">
                {#each Item.all as item, j (item.name)}
                <button class="plain affectorButton optionButton" 
                onmousedown={(event) => handleMouseDownOnItemOption(event, itemConfig, item)}
                >
                    <UiAffectorIcon affector={item} size="sml" showNameOnHover={true} showStatsOnHover={true}/>
                </button>
                {/each}
            </div>
        </div>
        {/each}
    </div>
</div>



<style>
    .UiBuildSpec {
        display: grid;
        grid-auto-flow: column;
        grid-template-columns: auto;
        grid-auto-columns: max-content;
        align-content: center;
        gap: 1px;
    }
    
    .price {
        background-color: #1e1e1e;
        display: grid;
        grid-auto-flow: column;
        grid-template-columns: auto;
        grid-auto-columns: max-content;
        align-content: center;
        text-align: right;
        padding: 0 5px;
        gap: 0 0.2em;
    }

    .itemSlotGrid {
        display: grid;
        grid-auto-flow: column;
        grid-template: repeat(2, minmax(0,1fr)) / repeat(3, minmax(0,1fr));
        gap: 1px;
    }

    .affectorButton {
        display: flex;
		transform-origin: bottom center;
    }

    .itemSelector {
        background: #111;
        border: 2px solid #2e2e2e;
		box-shadow:	var(--box-shadow);
        grid-auto-rows: max-content;
        grid-template-columns: repeat(11, max-content);
        gap: 1px;
        overflow: visible;

        &:popover-open {
            display: grid;
        }
    }
</style>