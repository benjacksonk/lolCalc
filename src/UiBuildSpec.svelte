<script lang="ts">
    import { BuildConfig, GameConfig, Item, ItemSlotConfig } from "$lib/types.svelte";
    import UiAffectorIcon from "./UiAffectorIcon.svelte";
    import UiStatsTooltip from "./UiStatsTooltip.svelte";

    let {
        buildConfig = $bindable(),
        buildIndex,
        derivedGameConfig,
        ...priceButtonAttributes
    } : {
        buildConfig: BuildConfig,
        buildIndex: number,
        derivedGameConfig: GameConfig,
        priceButtonAttributes: any
    } = $props();

    let statsTooltip = $state<UiStatsTooltip>();

    function equipItem(itemConfig: ItemSlotConfig, item: Item) {
        itemConfig.item = item;
    }
</script>



<div class="UiBuildSpec">
    <div class="itemSlotGrid">
        {#each buildConfig.itemSlots as itemConfig, i}
        <UiAffectorIcon 
        affector={itemConfig.item} 
        size="min" 
        showNameOnHover={true} 
        showStatsOnHover={true} 
        popovertarget={`itemSelector-${buildIndex}-${i}`}
        >
            <div popover id={`itemSelector-${buildIndex}-${i}`} class="itemSelector">
                {#each Item.all as item, j (item.name)}
                <UiAffectorIcon affector={item} size="min" showNameOnHover={true} showStatsOnHover={true} onmousedown={(e) => { e.preventDefault(); equipItem(itemConfig, item); }}/>
                {/each}
            </div>
        </UiAffectorIcon>
        {/each}
    </div>

    <button class="price" interestfor={statsTooltip?.uid} {...priceButtonAttributes}>
        <span class="amount text-math">{buildConfig.totalCost.toFixed(0)}</span>
        <span class="unit">g</span>
    </button>

    <UiStatsTooltip
    bind:this={statsTooltip}
    stats={derivedGameConfig.statsPostEval}
    edgeAlignment="left"
    header={"Initial Stat Totals"}
    positionPriorities={["bottom span-right", "top span-right", "right", "left"]}
    />
</div>



<style lang="scss">
    .UiBuildSpec {
        background: linear-gradient(in oklab to bottom,
            colors.hcl("blue", 0, 3),
            colors.$lol-darkness,
        );
        border: none;
        display: grid;
        grid-auto-flow: column;
        grid-template-columns: auto;
        grid-auto-columns: 1fr;
        align-content: center;
        gap: 0 2px;
    }
    
    .price {
        display: grid;
        grid-auto-flow: column;
        grid-template-columns: auto;
        grid-auto-columns: max-content;
        align-content: center;
        text-align: right;
        padding: 0 0.5em;
        border: none;
        background: none;
        gap: 0 0.125em;
        border-radius: 0;
        color: colors.hcl("honey", 5, 42);
        font-weight: 500;
    }

    .itemSlotGrid {
        display: grid;
        padding: 1px;
        grid-template: repeat(2, minmax(0,1fr)) / repeat(3, minmax(0,1fr));
        gap: 2px;
    }

    .affectorButton {
        display: flex;
		transform-origin: bottom center;
    }

    .itemSelector {
		box-shadow:	shadows.$box-shadow-sup;
        background: colors.gray(2);
        border: 2px solid colors.gray(12);
        border-radius: 3px;
        grid-auto-rows: max-content;
        grid-template-columns: repeat(11, max-content);
        gap: 2px;
        overflow: visible;
        position-area: bottom span-right;
        position-try-fallbacks: top span-right, right, left;

        &:popover-open {
            display: grid;
        }
    }
</style>