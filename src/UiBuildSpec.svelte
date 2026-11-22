<script lang="ts">
    import { BuildConfig, GameConfig, Item, ItemSlot, Keystone, Rune, Runestone, RuneTree, StatType } from "$lib/types.svelte";
    import UiAffectorIcon from "./UiAffectorIcon.svelte";
    import UiIcon from "./UiIcon.svelte";
    import UiNamedValueList from "./UiNamedValueList.svelte";
    import UiTooltip from "./UiTooltip.svelte";

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

    let tooltip = $state<UiTooltip>();

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
    {#if runes.length > 0}
    <div class="runeIconList">
        {#each runes as rune}
        <img src={rune.icon} alt={rune.name} class={`icon size-${size}`}>
        {/each}
    </div>
    {/if}
    {/snippet}

    <button class="keystoneAndPriceButton unround" interestfor={tooltip?.uid} {...priceButtonAttributes}>
        {#if buildConfig.runeSet.primaries[0] != Rune.nothing}
        {@render runeIconList([buildConfig.runeSet.primaries[0]], 7)}
        {/if}

        <span class="price">
            <span class="amount text-math">{buildConfig.totalCost.toFixed(0)}</span>
            <span class="unit">g</span>
        </span>
    </button>

    <UiTooltip
    bind:this={tooltip}
    header={"Initial Stat Totals"}
    positionPriorities={["bottom span-right", "top span-right", "right", "left"]}
    >
        <UiNamedValueList entries={[
            [],
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
        ]}
        />
    </UiTooltip>

    <div class="runesSpec">
        <button class="runeSpecButton unround" popovertarget={`build-${buildIndex}-runesSelector`}>
            {#if buildConfig.runeSet.runes.filter(rune => rune != Rune.nothing && !(rune instanceof Keystone)).length > 0}
                {@render runeIconList(buildConfig.runeSet.primaries.slice(1).filter(rune => rune !== Rune.nothing), 1)}
                {@render runeIconList(buildConfig.runeSet.secondaries.filter(rune => rune !== Rune.nothing), 1)}
                {@render runeIconList(buildConfig.runeSet.shards.filter(rune => rune !== Rune.nothing), 1)}
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
                    <div class={`treeSlot ${(tree == "primary" ? buildConfig.runeSet.primaryTree : tree == "secondary" ? buildConfig.runeSet.secondaryTree : RuneTree.shardTree).name.toLowerCase()}`}
                    class:equipped={(tree == "primary" ? buildConfig.runeSet.primaryTree : buildConfig.runeSet.secondaryTree) == runeTree}
                    >
                        <div class="slotIconWrapper">
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
                    </div>
                    {/each}
                </div>
                {/if}

                <div class={`runeSelectors ${(tree == "primary" ? buildConfig.runeSet.primaryTree : tree == "secondary" ? buildConfig.runeSet.secondaryTree : RuneTree.shardTree).name.toLowerCase()}`}>
                    {#each (tree == "primary" ? buildConfig.runeSet.primaryTree.branches : tree == "secondary" ? buildConfig.runeSet.secondaryTree.branches.slice(1) : RuneTree.shardTree.branches) as branch, branchIndex}
                    <div class={`runeSelector ${branch.tree.name.toLowerCase()}`} class:keystoneSelector={branch.runes.some(rune => rune instanceof Keystone)}>
                        {#each (tree == "primary" ? buildConfig.runeSet.primaryTree : tree == "secondary" ? buildConfig.runeSet.secondaryTree : RuneTree.shardTree).branches[branchIndex + (tree == "primary" || tree == "shards" ? 0 : 1)].runes as rune, runeIndex}
                        <div class="runeSlot round" class:equipped={(tree == "primary" ? buildConfig.runeSet.primaries : tree == "secondary" ? buildConfig.runeSet.secondaries : buildConfig.runeSet.shards).includes(rune)}>
                            <div class="slotIconWrapper">
                                <UiIcon 
                                src={rune.icon}
                                alt={rune.name}
                                size={(rune instanceof Keystone ? Math.min(9, iconSize + 2) : iconSize)} 
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
                        </div>
                        {/each}
                    </div>
                    {/each}
                </div>
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
        padding: 0 6px;
        gap: 0 8px;
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
        display: flex;
        flex-flow: column nowrap;
        width: max-content;
        height: stretch;

        &:not(&:last-of-type) {
            border-right: 2px solid colors.gray(12);
        }
    }

    .precision {
        $-hue-precision: 108;
        $-color-precision: colors.hcl(108, 2, 2);
        --rune-color: $-color-precision;
    }
    .domination {
        $-hue-domination: 28;
        // --rune-color: colors.hcl($-hue-domination, 2, 2);
    }
    .sorcery {
        $-hue-sorcery: 268;
        // --rune-color: colors.hcl($-hue-sorcery, 2, 2);
    }
    .resolve {
        $-hue-resolve: 148;
        // --rune-color: colors.hcl($-hue-resolve, 2, 2);
    }
    .inspiration {
        $-hue-inspiration: 208;
        // --rune-color: colors.hcl($-hue-inspiration, 2, 2);
    }
    .precision,
    .domination,
    .sorcery,
    .resolve,
    .inspiration {
    }

    .runeSelectors {
        display: flex;
        flex-flow: column nowrap;
        height: stretch;
        width: stretch;
        gap: 8px;
        // justify-content: center;
    }

    .treeSelector, .runeSelector {
        width: stretch;
        height: max-content;
        display: flex;
        flex-flow: row nowrap;
        justify-content: center;
    }

    .treeSelector {
    }

    .runeSlot, .treeSlot {
        .slotIconWrapper {
            width: max-content;
            height: max-content;
            display: flex;
        }

        &:not(.equipped) {
            .slotIconWrapper {
                filter: opacity(74%);
            }

            &:hover .slotIconWrapper {
                filter: opacity(86%);
            }
        }
    }

    .treeSlot {
        width: stretch;
        height: stretch;
        justify-items: center;
        padding: 8px 8px;
        // border: 2px solid transparent;
        // margin: 0 -4px;

        &.equipped {
            // border-color: #7771;
        }

        &:not(&.equipped) {
            background: colors.gray(2);
        }
    }

    .runeSelector {
        width: stretch;
        // justify-content: space-evenly;
        // background: colors.gray(2);

        &.precision, &.domination, &.sorcery, &.resolve, &.inspiration {
            background: var(--rune-color);
        }

        .runeSlot {
            width: max-content;
            height: max-content;
            border: 2px solid transparent;
            margin: 0 4px;

            &.equipped {
                border-color: #dca;
            }
        }

        &.keystoneSelector .runeSlot {
            margin: 0 -4px;
        }
    }
</style>