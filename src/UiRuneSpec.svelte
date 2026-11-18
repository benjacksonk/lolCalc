<script lang="ts">
    import { BuildConfig, Rune, RuneTree } from "$lib/types.svelte";
    import UiIcon from "./UiIcon.svelte";

    let {
        buildConfig = $bindable(),
        buildIndex,
    } : {
        buildConfig: BuildConfig,
        buildIndex: number,
    } = $props();

    function handleClickPrimaryRune(rune: Rune) {
        if (!rune.branch) {
            return;
        }

        const branchIndex = buildConfig.runeSet.primaryTree.branches.indexOf(rune.branch);
        const hasRuneEquipped = buildConfig.runeSet.primaryRunes.includes(rune);
        buildConfig.runeSet.primaryRunes[branchIndex] = hasRuneEquipped ? Rune.nothing : rune;
    }

    function handleClickSecondaryRune(rune: Rune) {
        if (!rune.branch) {
            return;
        }
        const hasRuneEquipped = buildConfig.runeSet.secondaryRunes.includes(rune);

        if (hasRuneEquipped) {
            const runeSlotIndex = buildConfig.runeSet.secondaryRunes.indexOf(rune);
            buildConfig.runeSet.secondaryRunes[runeSlotIndex] = Rune.nothing;
        }
        else {
            const validSlotIndices = buildConfig.runeSet.secondaryRunes.map<[number, boolean]>((slot, i) => [i, slot == Rune.nothing || slot.branch == rune.branch]).filter(it => it[1]).map(it => it[0]);
            
            if (validSlotIndices.length > 0) {
                buildConfig.runeSet.secondaryRunes[validSlotIndices[0]] = rune;
            }
        }
    }
</script>



<div class="UiRuneSpec">
    <button class="runeIcons" popovertarget={`build-${buildIndex}-runesSelector`}>
        <div class="primaryRuneIcons">
            {#if buildConfig.runeSet.primaryRunes.filter(rune => rune != Rune.nothing).length > 0}
                {#each buildConfig.runeSet.primaryRunes.filter(rune => rune !== Rune.nothing) as rune}
                <img src={rune.icon} alt={rune.name} class="icon size-0">
                {/each}
            {:else}
                <img src={Rune.nothing.icon} alt={"No primary runes"} class="icon size-0">
            {/if}
        </div>

        <div class="secondaryRuneIcons">
            {#if buildConfig.runeSet.secondaryRunes.filter(rune => rune != Rune.nothing).length > 0}
                {#each buildConfig.runeSet.secondaryRunes.filter(rune => rune !== Rune.nothing) as rune}
                <img src={rune.icon} alt={rune.name} class="icon size-0">
                {/each}
            {:else}
                <img src={Rune.nothing.icon} alt={"No secondary runes"} class="icon size-0">
            {/if}
        </div>
    </button>
    
    <div popover id={`build-${buildIndex}-runesSelector`} class="runeTreesSpec">
        {#snippet runeTreeSpec(tree:"primary"|"secondary")}
        <div class="runeTreeSpec">
            <div class="treeSelector">
                {#each RuneTree.all as runeTree}
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

            {#each (tree == "primary" ? buildConfig.runeSet.primaryTree.branches : buildConfig.runeSet.secondaryTree.branches.slice(1)) as branch, branchIndex}
            <div class="runeSelector">
                {#each (tree == "primary" ? buildConfig.runeSet.primaryTree : buildConfig.runeSet.secondaryTree).branches[branchIndex + (tree == "primary" ? 0 : 1)].runes as rune, runeIndex}
                <div class="runeSlot round" class:equipped={(tree == "primary" ? buildConfig.runeSet.primaryRunes : buildConfig.runeSet.secondaryRunes).includes(rune)}>
                    <UiIcon 
                    src={rune.icon}
                    alt={rune.name}
                    size={4} 
                    header={rune.name}
                    caption={""}
                    background={"transparent"}
                    round={true}
                    onmousedown={(e) => {
                        e.preventDefault();
                        tree == "primary" ? handleClickPrimaryRune(rune) : handleClickSecondaryRune(rune);
                    }}
                    />
                </div>
                {/each}
            </div>
            {/each}
        </div>
        {/snippet}

        {@render runeTreeSpec("primary")}
        {@render runeTreeSpec("secondary")}
    </div>
</div>



<style lang="scss">
    .UiRuneSpec {
        background: linear-gradient(in oklab to bottom,
            colors.hcl("blue", 0, 3),
            colors.$lol-darkness,
        );
        height: stretch;
        width: max-content;
        display: grid;
    }

    .runeIcons {
        height: stretch;
        width: max-content;
        display: flex;
        flex-flow: row nowrap;
        background: none;
        border: none;
        border-radius: 0;
        padding: 0 4px;
        gap: 4px;
    }

    .primaryRuneIcons, .secondaryRuneIcons {
        height: stretch;
        width: max-content;
        display: flex;
        flex-flow: column nowrap;
        pointer-events: none;
        // justify-content: space-evenly;
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
        // gap: 6px;

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