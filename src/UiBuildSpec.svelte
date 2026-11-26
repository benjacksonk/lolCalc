<script lang="ts">
    import { BuildConfig, GameConfig, Item, Keystone, Quest, Rune, Runestone, RuneTree, Shard, StatType } from "$lib/types.svelte";
    import UiAffectorPopTipButton from "./UiAffectorPopTipButton.svelte";
    import UiIcon from "./UiIcon.svelte";
    import UiNamedValueList from "./UiNamedValueList.svelte";
    import UiPopTipButton from "./UiPopTipButton.svelte";
    
    interface Props {
        buildConfigs: BuildConfig[];
        buildConfig: BuildConfig;
        buildIndex: number;
        derivedGameConfig: GameConfig;
    }

    let {
        buildConfigs = $bindable(),
        buildConfig = $bindable(),
        buildIndex,
        derivedGameConfig,
    }: Props = $props();

    let merchItems = $derived(Item.all
        .sort((a, b) => a.name.localeCompare(b.name))
        .sort((a, b) => a.specialRecipe == b.id || a.from.includes(b.id) || b.into.includes(a.id) ? 1 : b.specialRecipe == a.id || b.from.includes(a.id) || a.into.includes(b.id) ? -1 : 0)
        .sort((a, b) => a.depth() - b.depth())
        .sort((a, b) => a.price - b.price)
        .sort((a, b) => a == Item.nothing ? -1 : b == Item.nothing ? 1 : 0)
    );

    let initialStats = $derived<[ArrayLike<[string, number]>, ArrayLike<[string, number]>]>([
        new Array<[string, number]>(),
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
        ).toArray()
    ]);
</script>



<div class="UiBuildSpec">
    <div class="itemSlotGrid">
        {#each buildConfig.itemSlots as itemSlot, i}
        <UiAffectorPopTipButton affector={itemSlot.item} size={4} classes={"background-none border-none unround"}>
            <div class="merchItems">
                {#each merchItems as merchItem, j (merchItem.name)}
                <UiAffectorPopTipButton affector={merchItem} size={4} classes={"background-none border-none unround"} onmousedown={(e) => itemSlot.item = merchItem }/>
                {/each}
            </div>
        </UiAffectorPopTipButton>
        {/each}
    </div>
    
    {#snippet runeIconList(runes: ReadonlyArray<Rune>, size: 0|1|2|3|4|5|6|7|8|9)}
    {#if runes.length > 0}
    <div class="runeIconList height-stretch width-max display-column">
        {#each runes as rune}
        <UiIcon {size} src={rune.icon} alt={rune.name} background={"transparent"}/>
        {/each}
    </div>
    {/if}
    {/snippet}

    <UiPopTipButton tooltipHeader={"Initial Stat Totals"}>
        {#snippet trigger({ props })}
        <button { ...props }
        style:--zoom={1} 
        class="background-none border-none unround display-column size-stretch" 
        onclick={ (e) => buildConfigs.splice(buildIndex, 0, new BuildConfig(buildConfig)) }
        >
            {#if buildConfig.runeSet.primaries[0] != Rune.nothing}
            {@render runeIconList([buildConfig.runeSet.primaries[0]], 7)}
            {/if}

            <span class="price">
                <span class="amount text-math">{buildConfig.totalCost.toFixed(0)}</span>
                <span class="unit">g</span>
            </span>
        </button>
        {/snippet}

        {#snippet tooltipContent()}
        <UiNamedValueList entries={initialStats}/>
        {/snippet}
    </UiPopTipButton>

    <UiPopTipButton tooltipHeader={"Runes"}>
        {#snippet trigger({ props })}
        <button { ...props }
        style:--zoom={1}
        class={"runeSpecButtonContents display-row background-none border-none unround"}>
            {#if buildConfig.runeSet.equippedRunes.filter(rune => rune != Rune.nothing && !(rune instanceof Keystone)).length > 0}
                {@render runeIconList(buildConfig.runeSet.primaries.slice(1).filter(rune => rune !== Rune.nothing), 1)}
                {@render runeIconList(buildConfig.runeSet.secondaries.filter(rune => rune !== Rune.nothing), 1)}
                {@render runeIconList(buildConfig.runeSet.shards.filter(rune => rune !== Rune.nothing), 1)}
            {:else}
                <UiIcon size={1} src={"dragontail-img/perk-images/Styles/RunesIcon.png"} alt={"No runes"} background={"transparent"}/>
            {/if}
        </button>
        {/snippet}
        
        {#snippet popoverContent()}
        <div class="runeTreesSpec display-row size-max">
            {#snippet runeTreeSpec(tree:"primary"|"secondary"|"shards", iconSize: 0|1|2|3|4|5|6|7|8|9)}
            <div class="runeTreeSpec display-column width-max height-stretch">
                {#if tree == "shards"}
                <div class="questSelector display-row width-stretch height-max">
                    {#each Quest.all.filter(quest => quest != Quest.nothing) as quest}
                    <UiPopTipButton tooltipHeader={quest.name}>
                        {#snippet trigger({ props })}
                        <button {...props}
                        class={`questSlot background-none border-none unround size-stretch ${quest.name.toLowerCase()}`}
                        class:equipped={quest == buildConfig.quest}
                        onmousedown={(e) => buildConfig.quest = (buildConfig.quest == quest ? Quest.nothing : quest)}
                        >
                            <UiIcon size={2} src={quest.icon} alt={quest.name} background={"transparent"}/>
                        </button>
                        {/snippet}
                    </UiPopTipButton>
                    {/each}
                </div>
                {:else}
                <div class="treeSelector display-row width-stretch height-max">
                    {#each RuneTree.all.filter(tree => (tree.branches[0].runes[0] instanceof Runestone)) as runeTree}
                    <UiPopTipButton tooltipHeader={runeTree.name}>
                        {#snippet trigger({ props })}
                        <button {...props}
                        class={`treeSlot background-none border-none unround size-stretch ${runeTree.name.toLowerCase()}`}
                        class:equipped={runeTree == (tree == "primary" ? buildConfig.runeSet.primaryTree : buildConfig.runeSet.secondaryTree)}
                        onmousedown={(e) => (tree == "primary" ? (buildConfig.runeSet.primaryTree = runeTree) : (buildConfig.runeSet.secondaryTree = runeTree))}
                        >
                            <UiIcon size={2} src={runeTree.icon} alt={runeTree.name} background={"transparent"}/>
                        </button>
                        {/snippet}
                    </UiPopTipButton>
                    {/each}
                </div>
                {/if}

                <div class={`runeSelectors ${(tree == "primary" ? buildConfig.runeSet.primaryTree : tree == "secondary" ? buildConfig.runeSet.secondaryTree : RuneTree.shardTree).name.toLowerCase()}`}>
                    {#each (tree == "primary" ? buildConfig.runeSet.primaryTree.branches : tree == "secondary" ? buildConfig.runeSet.secondaryTree.branches.slice(1) : RuneTree.shardTree.branches) as branch, branchIndex}
                    <div class={`runeSelector display-row width-stretch height-max ${branch.tree.name.toLowerCase()}`} class:keystoneSelector={branch.runes.some(rune => rune instanceof Keystone)}>
                        {#each (tree == "primary" ? buildConfig.runeSet.primaryTree : tree == "secondary" ? buildConfig.runeSet.secondaryTree : RuneTree.shardTree).branches[branchIndex + (tree == "primary" || tree == "shards" ? 0 : 1)].runes as rune, runeIndex}
                        <UiPopTipButton tooltipHeader={rune.name}>
                            {#snippet trigger({ props })}
                            <button { ...props }
                            class={`runeSlot background-none border-none round`}
                            class:keystoneSlot={rune instanceof Keystone}
                            class:shardSlot={rune instanceof Shard}
                            class:equipped={(tree == "primary" ? buildConfig.runeSet.primaries : tree == "secondary" ? buildConfig.runeSet.secondaries : buildConfig.runeSet.shards).includes(rune)}
                            onmousedown={(e) => tree == "primary" ? buildConfig.runeSet.togglePrimaryRune(rune) : tree == "secondary" ? buildConfig.runeSet.toggleSecondaryRune(rune) : buildConfig.runeSet.toggleShard(rune) }>
                                <UiIcon 
                                size={(rune instanceof Keystone ? Math.min(9, iconSize + 2) : iconSize)} 
                                src={rune.icon} 
                                alt={rune.name} 
                                background={"transparent"}
                                classes={`round`}
                                />
                            </button>
                            {/snippet}
                        </UiPopTipButton>
                        {/each}
                    </div>
                    {/each}
                </div>
            </div>
            {/snippet}

            {@render runeTreeSpec("primary", 4)}
            {@render runeTreeSpec("secondary", 4)}
            {@render runeTreeSpec("shards", 4)}
        </div>
        {/snippet}

        {#snippet tooltipContent()}
        {#if buildConfig.runeSet.equippedRunes.length > 0}
        <div class="display-column">
        {#each buildConfig.runeSet.equippedRunes as rune}
            <span>{rune.name}</span>
        {/each}
        </div>
        {/if}
        {/snippet}
    </UiPopTipButton>
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
    
    .merchItems {
        background: colors.gray(2);
        padding: 1px;
        display: grid;
        grid-auto-rows: max-content;
        grid-template-columns: repeat(11, max-content);
        gap: 2px;
    }

    .runeSpecButtonContents {
        justify-content: stretch;
        padding: 0 6px;
        gap: 0 8px;
    }

    .runeIconList {
        justify-content: space-evenly;
        pointer-events: none;
    }

    .runeTreesSpec {
        overflow: visible;
		box-shadow:	shadows.$box-shadow-sup;
        background: colors.gray(2);
        border: 2px solid colors.gray(12);
        border-radius: 3px;
    }

    .runeTreeSpec {
        &:not(&:last-of-type) {
            border-right: 2px solid colors.gray(12);
        }
    }
    
    .treeSlot, .runeSelectors {
        &.precision {
            background: radial-gradient(in oklab, 
                colors.hcl(68, 5, 6) 40%,
                colors.hcl(88, 3, 2),
            );
            border-color: colors.hcl(68, 5, 6);
        }
        &.domination {
            background: radial-gradient(in oklab, 
                colors.hcl(28, 5, 6) 40%,
                colors.hcl(08, 3, 2),
            );
            border-color: colors.hcl(28, 5, 6);
        }
        &.sorcery {
            background: radial-gradient(in oklab, 
                colors.hcl(268, 5, 6) 40%,
                colors.hcl(248, 3, 2),
            );
            border-color: colors.hcl(268, 5, 6);
        }
        &.resolve {
            background: radial-gradient(in oklab, 
                colors.hcl(148, 5, 6) 40%,
                colors.hcl(168, 3, 2),
            );
            border-color: colors.hcl(148, 5, 6);
        }
        &.inspiration {
            background: radial-gradient(in oklab, 
                colors.hcl(208, 5, 6) 40%,
                colors.hcl(188, 3, 2),
            );
            border-color: colors.hcl(208, 5, 6);
        }
        &.shards {
            background: radial-gradient(in oklab, 
                colors.gray(3) 40%,
                colors.gray(1),
            );
            border-color: colors.gray(6);
        }
    }
    
    .questSlot {
        background: radial-gradient(in oklab, 
            colors.hcl(98, 5, 4) 40%,
            colors.hcl(78, 3, 2),
        );
        border-color: colors.hcl(98, 5, 6);
    }

    .runeSelectors {
        display: flex;
        flex-flow: column nowrap;
        justify-content: center;
        height: stretch;
        width: stretch;
        padding: 6px 0px 12px;
        gap: 8px;
    }

    .treeSelector, .questSelector, .runeSelector {
        justify-content: center;
    }

    .runeSlot, .questSlot, .treeSlot {
        transition: ease-out 0.09s;

        &.keystoneSlot {
            filter: drop-shadow(0 0 3px #0004);
        }

        &:not(.equipped):not(&:hover) {
            filter: opacity(84%);
        }

        &.equipped:hover {
            filter: brightness(109%);
        }
    }

    .treeSlot, .questSlot {
        padding: 8px;
        border-width: 2px;
        border-style: solid;

        &:not(&.equipped) {
            background: colors.gray(1);
            border-color: transparent;
        }
    }

    .runeSelector {
        width: stretch;
        // justify-content: space-evenly;
        background: transparent;

        .runeSlot {
            width: max-content;
            height: max-content;
            border: 3px solid #0002;
            margin: 0 4px;

            &.equipped {
                border-color: #dca;
            }

            &.keystoneSlot, &.shardSlot {
                &:not(&.equipped) {
                    border-color: transparent;
                }
            }
        }

        &.keystoneSelector .runeSlot {
            margin: 0 -4px;
        }
    }
</style>