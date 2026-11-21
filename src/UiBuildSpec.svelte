<script lang="ts">
    import { BuildConfig, GameConfig, Item, ItemSlot, Keystone, Rune, Runestone, RuneTree, StatType } from "$lib/types.svelte";
    import UiAffectorIcon from "./UiAffectorIcon.svelte";
    import UiIcon from "./UiIcon.svelte";
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

    function equipItem(itemSlot: ItemSlot, item: Item) {
        itemSlot.item = item;
    }
</script>



<div class="UiBuildSpec">
    <div class="itemSlotGrid">
        {#each buildConfig.itemSet as itemConfig, i}
        <UiAffectorIcon 
        affector={itemConfig.item} 
        size={4}
        showNameOnHover={true} 
        showStatsOnHover={true} 
        popovertarget={`itemSelector-${buildIndex}-${i}`}
        >
            <div popover id={`itemSelector-${buildIndex}-${i}`} class="itemSelector">
                {#each Item.all
                .sort((a, b) => a.name.localeCompare(b.name))
                .sort((a, b) => a.specialRecipe == b.id || a.from.includes(b.id) || b.into.includes(a.id) ? 1 : b.specialRecipe == a.id || b.from.includes(a.id) || a.into.includes(b.id) ? -1 : 0)
                .sort((a, b) => a.depth() - b.depth())
                .sort((a, b) => a.price - b.price)
                .sort((a, b) => a == Item.nothing ? -1 : b == Item.nothing ? 1 : 0) as item, j (item.name)
                }
                <UiAffectorIcon affector={item} size={4} showNameOnHover={true} showStatsOnHover={true} onmousedown={(e) => { e.preventDefault(); equipItem(itemConfig, item); }}/>
                {/each}
            </div>
        </UiAffectorIcon>
        {/each}
    </div>
    
    {#snippet runeIconList(runes: ReadonlyArray<Rune>, size: 0|1|2|3|4|5|6|7|8|9)}
    <div class="runeIconList">
        {#each runes.filter(rune => rune !== Rune.nothing) as rune}
        <img src={rune.icon} alt={rune.name} class={`icon size-${size}`}>
        {/each}
    </div>
    {/snippet}

    <button class="keystoneAndPriceButton" interestfor={statsTooltip?.uid} {...priceButtonAttributes}>
        {#if buildConfig.runeSet.primaries[0] != Rune.nothing}
        {@render runeIconList([buildConfig.runeSet.primaries[0]], 7)}
        {/if}

        <span class="price">
            <span class="amount text-math">{buildConfig.totalCost.toFixed(0)}</span>
            <span class="unit">g</span>
        </span>
    </button>

    <UiStatsTooltip
    bind:this={statsTooltip}
    stats={
        derivedGameConfig.statsPostEval.entries().filter(
            ([statType, magnitude]: [StatType, number]) => 
            ![
                StatType.AttackDamageBase,
                StatType.AttackDamageBonusFlat,
                StatType.AttackDamageBonusFlatAmpRatio,
                StatType.AbilityPowerAmpRatio, 
                StatType.MoveSpeedBase,
                StatType.MoveSpeedBonusFlat,
                StatType.MoveSpeedAmpRatio,
            ].includes(statType)
        )
    }
    edgeAlignment="left"
    header={"Initial Stat Totals"}
    positionPriorities={["bottom span-right", "top span-right", "right", "left"]}
    />

    <div class="runesSpec">
        <button class="runeSpecButton" popovertarget={`build-${buildIndex}-runesSelector`}>
            {#snippet runeIconList(runes: ReadonlyArray<Rune>, size: 0|1|2|3|4|5|6|7|8|9)}
            <div class="runeIconList">
                {#each runes.filter(rune => rune !== Rune.nothing) as rune}
                <img src={rune.icon} alt={rune.name} class={`icon size-${size}`}>
                {/each}
            </div>
            {/snippet}

            {#if buildConfig.runeSet.runes.filter(rune => rune != Rune.nothing && !(rune instanceof Keystone)).length > 0}
                {@render runeIconList(buildConfig.runeSet.primaries.slice(1), 1)}
                {@render runeIconList(buildConfig.runeSet.secondaries, 1)}
                {@render runeIconList(buildConfig.runeSet.shards, 1)}
            {:else}
                <div class="genericRuneIconWrapper">
                    <img src={"dragontail-img/perk-images/Styles/RunesIcon.png"} alt={"No runes"} class="icon size-0">
                </div>
            {/if}
        </button>
        
        <div popover id={`build-${buildIndex}-runesSelector`} class="runeTreesSpec">
            {#snippet runeTreeSpec(tree:"primary"|"secondary"|"shards", iconSize: 0|1|2|3|4|5|6|7|8|9)}
            <div class="runeTreeSpec">
                {#if tree != "shards"}
                <div class="treeSelector">
                    {#each RuneTree.all.filter(tree => (tree.branches[0].runes[0] instanceof Runestone)) as runeTree}
                    <div class="treeSlot" class:equipped={(tree == "primary" ? buildConfig.runeSet.primaryTree : buildConfig.runeSet.secondaryTree) == runeTree}>
                        <UiIcon 
                        src={runeTree.icon}
                        alt={runeTree.name}
                        size={1} 
                        header={runeTree.name}
                        caption={""}
                        background={"transparent"}
                        onmousedown={(e) => {
                            e.preventDefault();
                            tree == "primary" ? (buildConfig.runeSet.primaryTree = runeTree) : (buildConfig.runeSet.secondaryTree = runeTree);
                        }}
                        />
                    </div>
                    {/each}
                </div>
                {/if}

                {#each (tree == "primary" ? buildConfig.runeSet.primaryTree.branches : tree == "secondary" ? buildConfig.runeSet.secondaryTree.branches.slice(1) : RuneTree.shardTree.branches) as branch, branchIndex}
                <div class="runeSelector">
                    {#each (tree == "primary" ? buildConfig.runeSet.primaryTree : tree == "secondary" ? buildConfig.runeSet.secondaryTree : RuneTree.shardTree).branches[branchIndex + (tree == "primary" || tree == "shards" ? 0 : 1)].runes as rune, runeIndex}
                    <div class="runeSlot round" class:equipped={(tree == "primary" ? buildConfig.runeSet.primaries : tree == "secondary" ? buildConfig.runeSet.secondaries : buildConfig.runeSet.shards).includes(rune)}>
                        <UiIcon 
                        src={rune.icon}
                        alt={rune.name}
                        size={iconSize} 
                        header={rune.name}
                        caption={""}
                        background={"transparent"}
                        round={true}
                        onmousedown={(e) => {
                            e.preventDefault();
                            tree == "primary" ? buildConfig.runeSet.togglePrimaryRune(rune) : tree == "secondary" ? buildConfig.runeSet.toggleSecondaryRune(rune) : buildConfig.runeSet.toggleShard(rune);
                        }}
                        />
                    </div>
                    {/each}
                </div>
                {/each}
            </div>
            {/snippet}

            {@render runeTreeSpec("primary", 4)}
            {@render runeTreeSpec("secondary", 4)}
            {@render runeTreeSpec("shards", 3)}
        </div>
    </div>
</div>



<style lang="scss">
    .UiBuildSpec {
        grid-column: span 3;
        background: linear-gradient(in oklab to bottom,
            colors.hcl("blue", 0, 3),
            colors.$lol-darkness,
        );
        display: grid;
        grid-template: 1fr / subgrid;
        align-content: center;
    }

    .keystoneAndPriceButton {
        width: stretch;
        height: stretch;
        background: none;
        border: none;
        border-radius: 0;
        display: flex;
        flex-flow: column nowrap;
    }
    
    .price {
        height: stretch;
        display: grid;
        grid-auto-flow: column;
        grid-template-columns: auto;
        grid-auto-columns: max-content;
        align-content: center;
        justify-content: center;
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
        padding: 1px 0 1px 2px;
        display: grid;
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
    
    .runesSpec {
        display: grid;
    }

    .runeSpecButton {
        display: flex;
        flex-flow: row nowrap;
        justify-content: stretch;
        background: none;
        border: none;
        border-radius: 0;
        padding: 0 4px;
        gap: 8px;
    }

    .genericRuneIconWrapper {
        width: stretch;
        height: stretch;
        display: grid;
        align-content: center;
        justify-content: center;
    }

    .runeIconList {
        height: stretch;
        width: max-content;
        display: flex;
        flex-flow: column nowrap;
        justify-content: space-evenly;
        pointer-events: none;
    }

    .runeTreesSpec {
        width: max-content;
        height: max-content;
        flex-flow: row nowrap;
        overflow: visible;
		box-shadow:	shadows.$box-shadow-sup;
        background: colors.gray(2);
        border: 2px solid colors.gray(12);
        border-radius: 3px;
        position-area: bottom span-right;
        position-try-fallbacks: top span-right, right, left;

        &:popover-open {
            display: flex;
        }
    }

    .runeTreeSpec {
        flex-flow: column nowrap;
        width: max-content;
        height: max-content;
        gap: 2px;
    }

    .treeSelector, .runeSelector {
        width: stretch;
        height: max-content;
        display: flex;
        flex-flow: row nowrap;
        justify-content: center;

        .runeSlot:not(.equipped) {
            filter: opacity(64%);

            &:hover {
                filter: opacity(80%);
            }
        }
    }

    .treeSelector {
        .treeSlot:not(.equipped) {
            filter: opacity(64%);

            &:hover {
                filter: opacity(80%);
            }
        }
    }

    .treeSlot {
        width: stretch;
        height: max-content;
        justify-items: center;
        padding: 2px;
        border: 2px solid transparent;

        &.equipped {
            background: #7773;
            border-color: #7771;
        }
    }

    .runeSelector {
        gap: 6px;

        .runeSlot:not(.equipped) {
            filter: opacity(64%);

            &:hover {
                filter: opacity(80%);
            }
        }
    }

    .runeSlot {
        width: max-content;
        height: max-content;
        border: 2px solid transparent;

        &.equipped {
            border-color: #dca;
        }
    }
</style>