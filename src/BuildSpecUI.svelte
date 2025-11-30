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



<div class="sheer BuildSpec">
    <div class="price">
        <span class="priceAmount">{buildConfig.totalCost.toFixed(0)}</span><span class="priceUnit">g</span>
        <StatsTooltip stats={derivedGameConfig.statsPostEval} position="right" header={"Initial Stat Totals"}/>
    </div>

    {#each buildConfig.itemSlots as itemConfig, i}
    <div>
        <button class="sheer affectorButton slotButton" onmousedown={
            (event) => handlemousedownOnPopupAnchor(event, popups[i]!)
        }
        >
            <AffectorIcon affector={itemConfig.item} size="min" hasTooltip={true}/>
        </button>
        
        <div 
        class="popup" 
        class:REMOVED={popupState.currentPopup != popups[i]}
        bind:this={popups[i]} style:display={popupState.currentPopup == popups[i] ? "grid" : "none"}
        >
            {#each Item.all as item, j (item.name)}
            <button class="sheer affectorButton optionButton" onmousedown={(event) => handleMouseDownOnItemOption(event, popups[i]!, itemConfig, item)}>
                <AffectorIcon affector={item} size="sml" hasTooltip={true}/>
            </button>
            {/each}
        </div>
    </div>
    {/each}
</div>



<style>
    .BuildSpec {
        display: grid;
        grid-auto-flow: column;
        grid-template-rows: repeat(2, minmax(0,1fr));
        grid-template-columns: 4em;
        grid-auto-columns: minmax(0,1fr);

        .popup {
            background: #111;
            border: 2px solid #555;
            grid-auto-rows: max-content;
            grid-template-columns: repeat(11, max-content);
            
            left: unset;
            transform: unset;
        }
    }

    .price {
        grid-row: span 2;
        display: grid;
        grid-auto-flow: column;
        grid-template-columns: auto;
        grid-auto-columns: max-content;
        align-content: center;
        text-align: right;
        padding: 0 5px;
        gap: 0 0.2em;
    }

    .affectorButton {
        display: flex;
    }
</style>