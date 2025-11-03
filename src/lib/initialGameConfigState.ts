import { BuildConfig, ChampConfig, Champion, GameConfig, Stats, StatType } from "./types.svelte";

export const initialGameConfig = $state(generateInitialGameConfig());

function generateInitialGameConfig() {
    return new GameConfig(
        new ChampConfig(Champion.champs.Ahri),
        new BuildConfig([null, null, null, null, null, null]),
        new Stats([
            [StatType.Health, 1000],
            [StatType.Armor, 0],
            [StatType.MagicResistance, 0]
        ])
    );
}