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
        <span class="amount text-math">{buildConfig.totalCost.toFixed(0)}</span>
        <span class="unit">g</span>
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
                    <UiAffectorIcon affector={item} size="min" showNameOnHover={true} showStatsOnHover={true}/>
                </button>
                {/each}
            </div>
        </div>
        {/each}
    </div>
</div>



<style lang="scss">
    .UiBuildSpec {
        display: grid;
        grid-auto-flow: column;
        grid-template-columns: auto;
        grid-auto-columns: max-content;
        align-content: center;
        // background-color: colors.hcl("blue", 1, 3);
        // border-color: colors.hcl("blue", 1, 3);
        // border-style: solid;
        gap: 0 2px;
        // margin-left: 2px;
    }
    
    .price {
        background: #{colors.$lol-darkness};
        display: grid;
        grid-auto-flow: column;
        grid-template-columns: auto;
        grid-auto-columns: max-content;
        align-content: center;
        text-align: right;
        padding: 0 0.5em;
        gap: 0 0.125em;
        border-radius: 0;
        border-style: solid;
        border-color: colors.hcl("blue", 0, 4);
        border-width: 2px 0;
        color: colors.hcl("honey", 5, 42);
        font-weight: 500;
    }

    .itemSlotGrid {
        display: grid;
        grid-auto-flow: column;
        grid-template: repeat(2, minmax(0,1fr)) / repeat(3, minmax(0,1fr));
        gap: 2px;
    }

    .affectorButton {
        display: flex;
		transform-origin: bottom center;
    }

    .itemSelector {
		box-shadow:	var(--box-shadow);
        background: colors.gray(2);
        border: 2px solid colors.gray(12);
        border-radius: 3px;
        grid-auto-rows: max-content;
        grid-template-columns: repeat(11, max-content);
        gap: 2px;
        overflow: visible;

        &:popover-open {
            display: grid;
        }
    }
</style>