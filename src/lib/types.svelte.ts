import { SvelteMap, SvelteSet } from "svelte/reactivity";

export enum AbilityType { P="P", Q="Q", W="W", E="E", R="R" }

export enum DamageType { True="True", Physical="Physical", Magic="Magic" }

export enum TargetType { Self, Ally, Enemy }

export enum StatType {
    AbilityHaste            = "Ability Haste",
    AbilityPower            = "Ability Power",
    AbilityPowerAmpRatio    = "Ability Power Amp Ratio",
    AttackDamageBase        = "Base Attack Damage",
    AttackDamageBonus       = "Bonus Attack Damage",
    Armor                   = "Armor",
    ArmorPenetrationFlat    = "Lethality (Armor Penetration Flat)",
    ArmorPenetrationRatio   = "Armor Penetration Ratio",
    ArmorReductionFlat      = "Armor Reduction Flat",
    ArmorReductionRatio     = "Armor Reduction Ratio",
    HealAndShieldPowerRatio = "Heal & Shield Power Ratio",
    Health                  = "Health",
    MagicPenetrationFlat    = "Magic Penetration Flat",
    MagicPenetrationRatio   = "Magic Penetration Ratio",
    MagicReductionFlat      = "Magic Reduction Flat",
    MagicReductionRatio     = "Magic Reduction Ratio",
    MagicResistance         = "Magic Resistance",
    Mana                    = "Mana",
    ManaRegenRatio          = "Mana Regeneration Ratio",
    MoveSpeedFlat           = "Move Speed",
    MoveSpeedRatio          = "Move Speed Ratio",
}

export class DefiniteNumberSvelteMap<K> extends SvelteMap<K, number> {
    constructor(entries: [K, number][] = []) {
        super(entries);
    }

    get(key: K): number {
        return super.get(key) ?? 0;
    }

    static sumPerKey<T>(...items: DefiniteNumberSvelteMap<T>[]): DefiniteNumberSvelteMap<T> {
        let sumEntries: [T, number][] 
        = items.flatMap(item => item.keys().toArray())
        .map(key => [key, items.map(item => item.get(key)).reduce((a,b) => a+b)]);
        
        return new DefiniteNumberSvelteMap<T>(sumEntries);
    }

    get total(): number {
        return this.values().toArray().reduce((a,b) => a + b);
    }
}

export class Stats extends DefiniteNumberSvelteMap<StatType> {
    constructor(items: [StatType, number][] = []) {
        super(items);
    }
}

export class Effect {
    trigger: () => boolean;
    // implementation/application/execution/process
    implement: (gameConfig: GameConfig, ...params: any[]) => GameConfig;
    aftereffects: Effect[];

    constructor(
        trigger: typeof this.trigger,
        implementation: typeof this.implement,
        ...aftereffects: typeof this.aftereffects
    ) {
        this.trigger = $state(trigger);
        this.implement = $state(implementation);
        this.aftereffects = $state(aftereffects);
    }

    static processEffects(gameConfig: GameConfig, effects: Effect[]): GameConfig {
        effects.forEach(effect => gameConfig = effect.implement(gameConfig));
        return gameConfig;
    }
}

function createDamageEffect(
    damageType: DamageType, 
    baseAmount: number, 
    ratios: [StatType, number][],
    trigger: () => boolean,
    ...aftereffects: Effect[]
): Effect {
    return new Effect(
        trigger,
        (gameConfig: GameConfig): GameConfig => {
            let damageFromStats: Array<Damage> 
            = ratios.map(
                stattype_ratio => {
                    let damageAmount: number 
                    = gameConfig.statsPostEval.get(stattype_ratio[0]) * stattype_ratio[1];
                    
                    switch (damageType) {
                        case DamageType.Magic:
                            return new Damage(0, 0, damageAmount);
                            break;
                        case DamageType.Physical:
                            return new Damage(0, damageAmount, 0);
                            break;
                        default:
                            return new Damage(damageAmount, 0, 0);
                            break;
                    }
                }
            );

            let baseDamage: Damage;
            switch (damageType) {
                case DamageType.Magic:
                    baseDamage = new Damage(0, 0, baseAmount);
                    break;
                case DamageType.Physical:
                    baseDamage = new Damage(0, baseAmount, 0);
                    break;
                default:
                    baseDamage = new Damage(baseAmount, 0, 0);
                    break;
            }

            let recentDamageSubtotals = Damage.sumPerKey(baseDamage, ...damageFromStats);
            let recentDamageTotals 
            = Damage.calculatePostMitigationDamage(
                recentDamageSubtotals, 
                gameConfig.statsPostEval,
                gameConfig.targetBaseStats
            );

            let newGameConfig = gameConfig.duplicate();
            newGameConfig.previousGameConfig = gameConfig;
            newGameConfig.recentDamageDealt = recentDamageTotals;

            return newGameConfig;
        },
        ...aftereffects
    )
}

export class Damage extends DefiniteNumberSvelteMap<DamageType> {
    constructor(trueDmg: number, physicalDmg: number, magicDmg: number) {
        super([
            [DamageType.True, trueDmg],
            [DamageType.Physical, physicalDmg],
            [DamageType.Magic, magicDmg]
        ]);
    }

    static multiply(original: Damage, multiplier: number|Damage): Damage {
        return multiplier instanceof Damage ?
        new Damage(
            multiplier.get(DamageType.True) * original.get(DamageType.True), 
            multiplier.get(DamageType.Physical) * original.get(DamageType.Physical), 
            multiplier.get(DamageType.Magic) * original.get(DamageType.Magic)
        ) :
        new Damage(
            multiplier * original.get(DamageType.True), 
            multiplier * original.get(DamageType.Physical), 
            multiplier * original.get(DamageType.Magic)
        );
    }

    static calculatePostMitigationDamage(inputDamage: Damage, attackerStats: Stats, defenderStats: Stats): Damage {
        let coefficientsPerType = inputDamage.entries().map(entry => {
            let damageType = entry[0];
            
            let resistance: number;
            let resistanceReductionFlat: number;
            let resistanceReductionRatio: number;
            let penetrationRatio: number;
            let penetrationFlat: number;
            [
                resistance,
                resistanceReductionFlat,
                resistanceReductionRatio,
                penetrationRatio,
                penetrationFlat
            ] = damageType == DamageType.Physical ? [
                defenderStats.get(StatType.Armor),
                attackerStats.get(StatType.ArmorReductionFlat),
                attackerStats.get(StatType.ArmorReductionRatio),
                attackerStats.get(StatType.ArmorPenetrationRatio),
                attackerStats.get(StatType.ArmorPenetrationFlat)
            ] : damageType == DamageType.Magic ? [
                defenderStats.get(StatType.MagicResistance),
                attackerStats.get(StatType.MagicReductionFlat),
                attackerStats.get(StatType.MagicReductionRatio),
                attackerStats.get(StatType.MagicPenetrationRatio),
                attackerStats.get(StatType.MagicPenetrationFlat)
            ] : [0,0,0,0,0];
        
            let defenseSubtotal: number = (resistance - resistanceReductionFlat) * (1 - resistanceReductionRatio);
            defenseSubtotal = Math.max(0, defenseSubtotal * (1 - penetrationRatio));
            defenseSubtotal = Math.max(0, defenseSubtotal - penetrationFlat);
            
            return defenseSubtotal < 0 ? 
            (2 - (1 / (1 + (defenseSubtotal / 100)))) : 
            (1 / (1 + (defenseSubtotal / 100)));
        }).toArray() as [number,number,number];

        let damageScalar = new Damage(...coefficientsPerType);

        return Damage.multiply(inputDamage, damageScalar);
    }
}

export interface Entity {
    name: string;
    iconURL: string;
}

export abstract class Affector implements Entity {
    name: string;
    iconURL: string;
    stats: Stats;
    effectsPerRank: Effect[][];
    // singleStats or multiStats ?
    // when stats are dynamic, maybe that can be a StatEffect?

    constructor(
        name: typeof this.name, 
        iconURL: typeof this.iconURL,
        stats: [StatType, number][] = [],
        effectsPerRank: typeof this.effectsPerRank = []
    ) {
        this.name = name;
        this.iconURL = iconURL;
        this.stats = new Stats(stats);
        this.effectsPerRank = effectsPerRank;
    }
}

export class Ability extends Affector {
    constructor(...affectorParams: ConstructorParameters<typeof Affector>) {
        super(...affectorParams);
    }
}

export class Item extends Affector {
    price: number;

    constructor(
        price: number,
        ...affectorParams: ConstructorParameters<typeof Affector>
    ) {
        super(...affectorParams);
        this.price = price;

        Item.all.push(this);
    }

    static all: Item[] = [];

    static items = {
        DarkSeal: new Item(
            350,
            "Dark Seal", 
            "https://wiki.leagueoflegends.com/en-us/images/Dark_Seal_item.png", 
            [[StatType.AbilityPower,15],[StatType.Health,50]]
        ),
        DoransRing: new Item(
            400,
            "Doran's Ring",  
            "https://wiki.leagueoflegends.com/en-us/images/Doran%27s_Ring_item.png", 
            [[StatType.AbilityPower,18],[StatType.Health,90]]
        ),
        SorcerersShoes: new Item(
            1100,
            "Sorcerer's Shoes",  
            "https://wiki.leagueoflegends.com/en-us/images/Sorcerer%27s_Shoes_item.png", 
            [[StatType.MagicPenetrationFlat,12],[StatType.MoveSpeedFlat,45]]
        ),
        TriumphantSorcerersShoes: new Item(
            1100,
            "Triumphant Sorcerer's Shoes",  
            "https://wiki.leagueoflegends.com/en-us/images/Triumphant_Sorcerer%27s_Shoes_item.png", 
            [[StatType.MagicPenetrationFlat,14],[StatType.MoveSpeedFlat,45]]
        ),
        SpellslingersShoes: new Item(
            1600,
            "Spellslinger's Shoes",  
            "https://wiki.leagueoflegends.com/en-us/images/Spellslinger%27s_Shoes_item.png", 
            [[StatType.MagicPenetrationFlat,18],[StatType.MagicPenetrationRatio,0.07],[StatType.MoveSpeedFlat,50]]
        ),
        ArchangelsStaff: new Item(
            2900,
            "Archangel's Staff",  
            "https://wiki.leagueoflegends.com/en-us/images/Archangel%27s_Staff_item.png", 
            [[StatType.AbilityHaste,25],[StatType.AbilityPower,70],[StatType.Mana,600]]
        ),
        SeraphsEmbrace: new Item(
            2900,
            "Seraph's Embrace",  
            "https://wiki.leagueoflegends.com/en-us/images/Seraph%27s_Embrace_item.png", 
            [[StatType.AbilityHaste,25],[StatType.AbilityPower,70],[StatType.Mana,1000]]
        ),
        ArdentCenser: new Item(
            2200,
            "Ardent Censer",  
            "https://wiki.leagueoflegends.com/en-us/images/Ardent_Censer_item.png", 
            [[StatType.AbilityPower,45],[StatType.HealAndShieldPowerRatio,0.1],[StatType.ManaRegenRatio,1.25],[StatType.MoveSpeedRatio,0.04]]
        ),
        BansheesVeil: new Item(
            3000,
            "Banshee's Veil",
            "https://wiki.leagueoflegends.com/en-us/images/Banshee%27s_Veil_item.png",
            [[StatType.AbilityPower,105],[StatType.MagicResistance,40]]
        ),
        BlackfireTorch: new Item(
            2800,
            "Blackfire Torch", 
            "https://wiki.leagueoflegends.com/en-us/images/Blackfire_Torch_item.png", 
            [[StatType.AbilityHaste,20],[StatType.AbilityPower,80],[StatType.Mana,600]]
        ),
        BloodlettersCurse: new Item(
            2900,
            "Bloodletter's Curse",
            "https://wiki.leagueoflegends.com/en-us/images/Bloodletter%27s_Curse_item.png",
            [[StatType.AbilityHaste,15],[StatType.AbilityPower,65],[StatType.Health,400]]
        ),
        CosmicDrive: new Item(
            3000,
            "Cosmic Drive",
            "https://wiki.leagueoflegends.com/en-us/images/Cosmic_Drive_item.png",
            [[StatType.AbilityHaste,25],[StatType.AbilityPower,70],[StatType.Health,350],[StatType.MoveSpeedRatio,0.04]]
        ),
        Cryptbloom: new Item(
            3000,
            "Cryptbloom",
            "https://wiki.leagueoflegends.com/en-us/images/Cryptbloom_item.png",
            [[StatType.AbilityHaste,20],[StatType.AbilityPower,75],[StatType.MagicPenetrationRatio,30]]
        ),
        Dawncore: new Item(
            2500,
            "Dawncore",
            "https://wiki.leagueoflegends.com/en-us/images/Dawncore_item.png",
            [[StatType.AbilityPower,45],[StatType.HealAndShieldPowerRatio,0.16],[StatType.ManaRegenRatio,1]]
        ),
        EchoesOfHelia: new Item(
            2200,
            "Echoes of Helia",
            "https://wiki.leagueoflegends.com/en-us/images/Echoes_of_Helia_item.png",
            [[StatType.AbilityHaste,20],[StatType.AbilityPower,35],[StatType.Health,200],[StatType.HealAndShieldPowerRatio,1.25]]
        ),
        HextechRocketbelt: new Item(
            2650,
            "Hextech Rocketbelt",
            "https://wiki.leagueoflegends.com/en-us/images/Hextech_Rocketbelt_item.png",
            [[StatType.AbilityHaste,20],[StatType.AbilityPower,70],[StatType.Health,300]]
        ),
        HorizonFocus: new Item(
            2750,
            "Horizon Focus",
            "https://wiki.leagueoflegends.com/en-us/images/Horizon_Focus_item.png",
            [[StatType.AbilityHaste,25],[StatType.AbilityPower,125]]
        ),
        ImperialMandate: new Item(
            2250,
            "Imperial Mandate",
            "https://wiki.leagueoflegends.com/en-us/images/Imperial_Mandate_item.png",
            [[StatType.AbilityHaste,20],[StatType.AbilityPower,60],[StatType.ManaRegenRatio,1.25]]
        ),
        LiandrysTorment: new Item(
            3000,
            "Liandry's Torment",
            "https://wiki.leagueoflegends.com/en-us/images/Liandry%27s_Torment_item.png",
            [[StatType.AbilityPower,60],[StatType.Health,300]]
        ),
        LichBane: new Item(
            2900,
            "Lich Bane",
            "https://wiki.leagueoflegends.com/en-us/images/Lich_Bane_item.png",
            [[StatType.AbilityHaste,10],[StatType.AbilityPower,100],[StatType.MoveSpeedRatio,0.04]]
        ),
        LudensCompanion: new Item(
            2750,
            "Luden's Companion", 
            "https://wiki.leagueoflegends.com/en-us/images/Luden%27s_Companion_item.png", 
            [[StatType.AbilityHaste,10],[StatType.AbilityPower,100],[StatType.Mana,600]]
        ),
        Malignance: new Item(
            2700,
            "Malignance", 
            "https://wiki.leagueoflegends.com/en-us/images/Malignance_item.png", 
            [[StatType.AbilityHaste,15],[StatType.AbilityPower,90],[StatType.Mana,600]]
        ),
        MejaisSoulstealer: new Item(
            1500,
            "Mejai's Soulstealer",
            "https://wiki.leagueoflegends.com/en-us/images/Mejai%27s_Soulstealer_item.png",
            [[StatType.AbilityPower,20],[StatType.Health,100]]
        ),
        MoonstoneRenewer: new Item(
            2200,
            "Moonstone Renewer",
            "https://wiki.leagueoflegends.com/en-us/images/Moonstone_Renewer_item.png",
            [[StatType.AbilityHaste,20],[StatType.AbilityPower,25],[StatType.Health,200],[StatType.ManaRegenRatio,1.25]]
        ),
        Morellonomicon: new Item(
            2850,
            "Morellonomicon",
            "https://wiki.leagueoflegends.com/en-us/images/Morellonomicon_item.png",
            [[StatType.AbilityHaste,15],[StatType.AbilityPower,75],[StatType.Health,350]]
        ),
        RabadonsDeathcap: new Item(
            3500,
            "Rabadon's Deathcap",
            "https://wiki.leagueoflegends.com/en-us/images/Rabadon%27s_Deathcap_item.png",
            [[StatType.AbilityPower,130],[StatType.AbilityPowerAmpRatio,0.3]]
        ),
        Riftmaker: new Item(
            3100,
            "Riftmaker",
            "https://wiki.leagueoflegends.com/en-us/images/Riftmaker_item.png",
            [[StatType.AbilityHaste,15],[StatType.AbilityPower,70],[StatType.Health,350]]
        ),
        RylaisCrystalScepter: new Item(
            2600,
            "Rylai's Crystal Scepter",
            "https://wiki.leagueoflegends.com/en-us/images/Rylai%27s_Crystal_Scepter_item.png",
            [[StatType.AbilityPower,65],[StatType.Health,400]]
        ),
        Shadowflame: new Item(
            3200,
            "Shadowflame",
            "https://wiki.leagueoflegends.com/en-us/images/Shadowflame_item.png",
            [[StatType.AbilityPower,110],[StatType.MagicPenetrationFlat,15]]
        ),
        ShurelyasBattlesong: new Item(
            2200,
            "Shurelya's Battlesong",
            "https://wiki.leagueoflegends.com/en-us/images/Shurelya%27s_Battlesong_item.png",
            [[StatType.AbilityHaste,15],[StatType.AbilityPower,50],[StatType.ManaRegenRatio,1.25],[StatType.MoveSpeedRatio,0.04]]
        ),
        StaffOfFlowingWater: new Item(
            2250,
            "Staff of Flowing Water",
            "https://wiki.leagueoflegends.com/en-us/images/Staff_of_Flowing_Water_item.png",
            [[StatType.AbilityHaste,15],[StatType.AbilityPower,35],[StatType.HealAndShieldPowerRatio,0.1],[StatType.ManaRegenRatio,1.25]]
        ),
        Stormsurge: new Item(
            2800,
            "Stormsurge",
            "https://wiki.leagueoflegends.com/en-us/images/Stormsurge_item.png",
            [[StatType.AbilityPower,80],[StatType.MagicPenetrationFlat,15],[StatType.MoveSpeedRatio,0.06]]
        ),
        VoidStaff: new Item(
            3000,
            "Void Staff",
            "https://wiki.leagueoflegends.com/en-us/images/Void_Staff_item.png",
            [[StatType.AbilityPower,95],[StatType.MagicPenetrationRatio,0.4]]
        ),
        ZhonyasHourglass: new Item(
            3250,
            "Zhonya's Hourglass",
            "https://wiki.leagueoflegends.com/en-us/images/Zhonya%27s_Hourglass_item.png",
            [[StatType.AbilityPower,105],[StatType.Armor,50]]
        )
    } as const;
}

export class Champion implements Entity {
    readonly name: string;
    readonly iconURL: string;
    readonly abilities: Ability[];

    static readonly all: Champion[] = [];

    constructor(
        name: typeof this.name, 
        iconURL: typeof this.iconURL, 
        abilities: typeof this.abilities
    ) {
        this.name = name;
        this.iconURL = iconURL;
        this.abilities = abilities;

        Champion.all.push(this);
    }

    static readonly champs = {
        Ahri: new Champion("Ahri", "https://wiki.leagueoflegends.com/en-us/images/thumb/Ahri_OriginalSquare.png/92px-Ahri_OriginalSquare.png", [
            new Ability("Orb of Deception", "https://wiki.leagueoflegends.com/en-us/images/Ahri_Orb_of_Deception_HD.png", [], [
                [
                    createDamageEffect(DamageType.Magic, 40, [[StatType.AbilityPower, 0.5]], () => true),
                    createDamageEffect(DamageType.True, 40, [[StatType.AbilityPower, 0.5]], () => true)
                ],
                [
                    createDamageEffect(DamageType.Magic, 65, [[StatType.AbilityPower, 0.5]], () => true),
                    createDamageEffect(DamageType.True, 65, [[StatType.AbilityPower, 0.5]], () => true)
                ],
                [
                    createDamageEffect(DamageType.Magic, 90, [[StatType.AbilityPower, 0.5]], () => true),
                    createDamageEffect(DamageType.True, 90, [[StatType.AbilityPower, 0.5]], () => true)
                ],
                [
                    createDamageEffect(DamageType.Magic, 115, [[StatType.AbilityPower, 0.5]], () => true),
                    createDamageEffect(DamageType.True, 115, [[StatType.AbilityPower, 0.5]], () => true)
                ],
                [
                    createDamageEffect(DamageType.Magic, 140, [[StatType.AbilityPower, 0.5]], () => true),
                    createDamageEffect(DamageType.True, 140, [[StatType.AbilityPower, 0.5]], () => true)
                ]
            ]),
            new Ability("Fox-Fire", "https://wiki.leagueoflegends.com/en-us/images/Ahri_Fox-Fire_HD.png", [], [
                [
                    createDamageEffect(DamageType.Magic, 64, [[StatType.AbilityPower, 0.64]], () => true)
                ],
                [
                    createDamageEffect(DamageType.Magic, 96, [[StatType.AbilityPower, 0.64]], () => true)
                ],
                [
                    createDamageEffect(DamageType.Magic, 128, [[StatType.AbilityPower, 0.64]], () => true)
                ],
                [
                    createDamageEffect(DamageType.Magic, 160, [[StatType.AbilityPower, 0.64]], () => true)
                ],
                [
                    createDamageEffect(DamageType.Magic, 192, [[StatType.AbilityPower, 0.64]], () => true)
                ]
            ]),
            new Ability("Charm", "https://wiki.leagueoflegends.com/en-us/images/Ahri_Charm_HD.png", [], [
                [
                    createDamageEffect(DamageType.Magic, 80, [[StatType.AbilityPower, 0.85]], () => true)
                ],
                [
                    createDamageEffect(DamageType.Magic, 120, [[StatType.AbilityPower, 0.85]], () => true)
                ],
                [
                    createDamageEffect(DamageType.Magic, 160, [[StatType.AbilityPower, 0.85]], () => true)
                ],
                [
                    createDamageEffect(DamageType.Magic, 200, [[StatType.AbilityPower, 0.85]], () => true)
                ],
                [
                    createDamageEffect(DamageType.Magic, 240, [[StatType.AbilityPower, 0.85]], () => true)
                ]
            ]),
        ]),
    } as const;
}

export class Rune {
}

export interface Config {
    duplicate(): Config;
}

export class GameConfig implements Config { 
    previousGameConfig: GameConfig|null;
    champConfig: ChampConfig;
    buildConfig: BuildConfig;
    targetBaseStats: Stats;
    recentDamageDealt: Damage;

    constructor(
        previousGameConfig: typeof this.previousGameConfig,
        champConfig: typeof this.champConfig,
        buildConfig: typeof this.buildConfig,
        targetBaseStats: typeof this.targetBaseStats,
        recentDamageDealt: typeof this.recentDamageDealt = new Damage(0,0,0),
    ) {
        this.previousGameConfig = $state(previousGameConfig);
        this.champConfig = $state(champConfig);
        this.buildConfig = $state(buildConfig);
        this.targetBaseStats = $state(targetBaseStats);
        this.recentDamageDealt = $state(recentDamageDealt);
    }

    duplicate(): GameConfig {
        return new GameConfig(
            this.previousGameConfig?.duplicate() ?? null,
            this.champConfig.duplicate(),
            this.buildConfig.duplicate(),
            Stats.sumPerKey(this.targetBaseStats),
            Damage.sumPerKey(this.recentDamageDealt)
        );
    }

    get statsPostEval(): Stats {
        let itemStats = this.buildConfig.itemConfigs.map(itemConfig => itemConfig.item?.stats ?? new Stats());
        let preStats = Stats.sumPerKey(...itemStats);
        return preStats;
    }

    get initialGameConfig(): GameConfig {
        return this.previousGameConfig?.initialGameConfig ?? this;
    }

    get recentDamageDealtSum(): number {
        return this.recentDamageDealt.values().toArray().reduce((a,b) => a+b);
    }

    get netDamageDealt(): Damage {
        return Damage.sumPerKey(this.recentDamageDealt, this.previousGameConfig?.netDamageDealt ?? new Damage(0,0,0));
    }

    get netDamageDealtSum(): number {
        return this.netDamageDealt.values().toArray().reduce((a,b) => a+b);
    }
}

export class ChampConfig implements Config {
    champ: Champion;
    abilityRanks: DefiniteNumberSvelteMap<Ability>;

    constructor(
        champion: typeof this.champ,
        abilityRanks: [Ability, number][] = []
    ) {
        this.champ = $state(champion);
        this.abilityRanks = new DefiniteNumberSvelteMap<Ability>(abilityRanks);
    }

    duplicate(): ChampConfig {
        return new ChampConfig(
            this.champ,
            this.abilityRanks.entries().toArray(),
        );
    }
};

export class BuildConfig implements Config {
    itemConfigs: ItemConfigSet;
    // runes: RuneSet;
    affectorSequence: Affector[];
    
    constructor(
        items: typeof this.itemConfigs = [
            new ItemConfig(),
            new ItemConfig(),
            new ItemConfig(),
            new ItemConfig(),
            new ItemConfig(),
            new ItemConfig()
        ],
        // runes: typeof this.runes,
        affectorSequence: typeof this.affectorSequence = []
    ) {
        this.itemConfigs = $state(items);
        // this.runes = $state(runes);
        this.affectorSequence = $state(affectorSequence);
    }

    duplicate(): BuildConfig {
        return new BuildConfig(
            [...(this.itemConfigs.map(itemConfig => itemConfig.duplicate()))] as ItemConfigSet,
            [...this.affectorSequence]
        );
    }

    get items(): Item[] {
        return this.itemConfigs.map(itemConfig => itemConfig.item).filter(item => item != null);
    }

    get totalCost(): number {
        return this.itemConfigs.map(itemConfig => itemConfig.item?.price ?? 0).reduce((a,b) => a + b);
    }
}

export type ItemConfigSet
= [ ItemConfig, ItemConfig, ItemConfig, ItemConfig, ItemConfig, ItemConfig ];

export class ItemConfig implements Config {
    item: Item|null;
    rank: number;

    constructor(item: typeof this.item = null, rank: typeof this.rank = 0) {
        this.item = $state(item);
        this.rank = $state(rank);
    }

    duplicate(): ItemConfig {
        return new ItemConfig(this.item, this.rank);
    }
}

/**
export class RunesConfig implements Config {
    duplicate(): RunesConfig {}
}
/**/