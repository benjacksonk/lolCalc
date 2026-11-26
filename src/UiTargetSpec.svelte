<script lang="ts">
    import { calculateBaseStats, Champion, DefiniteNumberMap, StatType } from "$lib/types.svelte";
    import UiIcon from "./UiIcon.svelte";
    import UiPopTipButton from "./UiPopTipButton.svelte";

    let {
        targetBaseStats = $bindable()
    } : {
        targetBaseStats: DefiniteNumberMap<StatType>
    } = $props();

    let targetChampProfile
    = $state<Champion>();

    let targetLevel: number
    = $state(1);

    let usesCustomProfile: boolean
    = $derived(targetChampProfile == null);

    const customTargetChampName = "Custom Target";

    function UpdateTargetProfileStats() {
        if (targetChampProfile == null) {
            return;
        }
        
        targetBaseStats = calculateBaseStats(targetChampProfile, targetLevel);
    }
</script>



<div class="UiTargetSpec">
    <UiPopTipButton tooltipHeader={targetChampProfile?.name ?? customTargetChampName}>
        {#snippet trigger({ props })}
        <button { ...props } class="champButton background-none border-none semiround lightSheerBorder">
            <div class="champIconWrapper" class:targetChampIconOverlay={usesCustomProfile}>
                <UiIcon size={9} 
                src={targetChampProfile?.icon ?? "https://wiki.leagueoflegends.com/en-us/images/On_Duty%21.png"} 
                alt={targetChampProfile?.name ?? customTargetChampName}
                />
            </div>
        </button>
        {/snippet}

        {#snippet popoverContent()}
            {#each [undefined, ...Champion.all] as champ}
            <UiPopTipButton tooltipHeader={champ?.name ?? customTargetChampName}>
                {#snippet trigger({ props })}
                <button {...props}
                class="champButton border-none unround"
                style:background="black"
                onclick={(event) => {
                    event.preventDefault();
                    targetChampProfile = champ;
                    UpdateTargetProfileStats();
                }}>
                    <div class="champIconWrapper" class:targetChampIconOverlay={!champ}>
                        <UiIcon 
                        size={8}
                        src={champ?.icon ?? "https://wiki.leagueoflegends.com/en-us/images/On_Duty%21.png"} 
                        alt={targetChampProfile?.name ?? customTargetChampName} 
                        />
                    </div>
                </button>
                {/snippet}
            </UiPopTipButton>
            {/each}
        {/snippet}
    </UiPopTipButton>

    <div class="targetSpecControls">
        <label class="control">
            <input type="number" min="1" max="20" class="semiround"
            bind:value={
                () => targetLevel, 
                (v) => {
                    targetLevel = v;
                    UpdateTargetProfileStats();
                }
            }
            />
            Level
        </label>

        <label class="control">
            <input type="number" min="0" max="9999" class="semiround"
            bind:value={() => targetBaseStats.get(StatType.Health), (v) => targetBaseStats.set(StatType.Health, v)}
            disabled={!usesCustomProfile}
            />
            Health
        </label>
        
        <label class="control">
            <input type="number" min="0" max="999" class="semiround"
            bind:value={() => targetBaseStats.get(StatType.Armor), (v) => targetBaseStats.set(StatType.Armor, v)}
            disabled={!usesCustomProfile}
            />
            Armor
        </label>
        
        <label class="control">
            <input type="number" min="0" max="999" class="semiround"
            bind:value={() => targetBaseStats.get(StatType.MagicResistance), (v) => targetBaseStats.set(StatType.MagicResistance, v)}
            disabled={!usesCustomProfile}
            />
            Magic Resistance
        </label>
    </div>
</div>



<style lang="scss">
    .UiTargetSpec {
        display: flex;

        flex-flow: row nowrap;
        gap: 20px;
        justify-content: start;
        align-items: center;
    }

    #targetSelector {
        background: none;
        border: none;
    }

    #targetSelectorOptions {
        top: anchor(100%);
        left: anchor(50%);
        translate: -50%;
        overflow: visible;
        background: colors.gray(2);
        border: 2px solid colors.gray(12);
        border-radius: 3px;
        box-shadow: shadows.$box-shadow-sup;
        flex-flow: row nowrap;

        &:popover-open {
            display: flex;
        }
    }

    .champIconWrapper {
        overflow: hidden;
        border-radius: inherit;

        &.targetChampIconOverlay::before {
            contain: strict;
            content: '';
            position: absolute;
            inset: 0;
            box-shadow: inset 0 0 6px 6px black;
            overflow: hidden;
            border-radius: inherit;
        }
    }

    .targetSpecControls {
        display: grid;

        grid-template-columns: repeat(3, minmax(0, max-content));
        gap: 5px;
        justify-content: center;
    }

    .control {
        grid-column: span 2;
        display: grid;
        gap: 0.5em;
        align-items: center;
        
        grid-template-columns: subgrid;
    }
</style>