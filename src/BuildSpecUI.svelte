<script lang="ts">
    import { popupState } from "$lib/popupState.svelte";
    import { BuildConfig, GameConfig, Item, ItemSlotConfig } from "$lib/types.svelte";
    import AffectorIcon from "./AffectorIcon.svelte";
    import StatsTooltip from "./StatsTooltip.svelte";

    let {
        buildConfig = $bindable(),
        derivedGameConfig
    } : {
        buildConfig: BuildConfig,
        derivedGameConfig: GameConfig
    } = $props();

    let popups
    : [Node|null,Node|null,Node|null,Node|null,Node|null,Node|null] 
    = $state([null,null,null,null,null,null]);

    function handlemousedownOnPopupAnchor(event: MouseEvent, popup: Node) {
        event.preventDefault();
        popupState.currentPopup = (popupState.currentPopup == popup ? null : popup);
    }

    function handleMouseDownOnItemOption(event: MouseEvent, popup: Node, itemConfig: ItemSlotConfig, item: Item) {
        event.preventDefault();
        itemConfig.item = item;
        if (popupState.currentPopup = popup) {
            popupState.currentPopup = null;
        }
    }
</script>



<div class="BuildSpec">
    <div class="price">
        <span class="priceAmount">{buildConfig.totalCost.toFixed(0)}</span><span class="priceUnit">g</span>
        <StatsTooltip
        stats={derivedGameConfig.statsPostEval}
        edgeAlignment="left"
        header={"Initial Stat Totals"}
        />
    </div>

    <div class="itemSlotGrid">
        {#each buildConfig.itemSlots as itemConfig, i}
        <div>
            <button class="plain affectorButton slotButton" onmousedown={
                (event) => handlemousedownOnPopupAnchor(event, popups[i]!)
            }
            >
                <AffectorIcon affector={itemConfig.item} size="min" showNameOnHover={true} showStatsOnHover={true}/>
            </button>
            
            <div 
            class="onPopup alignLeftEdge" 
            class:REMOVED={popupState.currentPopup != popups[i]}
            bind:this={popups[i]} style:display={popupState.currentPopup == popups[i] ? "grid" : "none"}
            >
                <div class="itemGrid">
                    {#each Item.all as item, j (item.name)}
                    <button 
                    class="plain affectorButton optionButton" 
                    onmousedown={(event) => handleMouseDownOnItemOption(event, popups[i]!, itemConfig, item)}
                    >
                        <AffectorIcon affector={item} size="sml" showNameOnHover={true} showStatsOnHover={true}/>
                    </button>
                    {/each}
                </div>
            </div>
        </div>
        {/each}
    </div>
</div>



<style>
    .BuildSpec {
        display: grid;
        grid-auto-flow: column;
        grid-template-columns: auto;
        grid-auto-columns: max-content;
        align-content: center;
    }

    .price {
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
    }

    .itemGrid {
        background: #111;
        border: 2px solid #2e2e2e;
        display: grid;
        grid-auto-rows: max-content;
        grid-template-columns: repeat(11, max-content);
        gap: 1px;
    }
</style>