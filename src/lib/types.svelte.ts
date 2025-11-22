import { SvelteMap } from "svelte/reactivity";

export enum AbilityType { P="P", Q="Q", W="W", E="E", R="R" }

export enum DamageType { True="True", Physical="Physical", Magic="Magic" }

export enum StatType {
    AbilityHaste                    = "Ability Haste",
    AbilityPower                    = "Ability Power",
    AbilityPowerAmpRatio            = "Ability Power Amp Ratio",
    AttackDamageBase                = "Base Attack Damage",
    AttackDamageBonus               = "Bonus Attack Damage",
    Armor                           = "Armor",
    ArmorPenetrationFlat            = "Lethality (Armor Penetration Flat)",
    ArmorPenetrationRatio           = "Armor Penetration Ratio",
    ArmorReductionDebuffFlat        = "Armor Reduction Flat",
    ArmorReductionDebuffRatio       = "Armor Reduction Ratio",
    BaseAttackDamage                = "Base Attack Damage",
    BonusAttackDamage               = "Bonus Attack Damage",
    HealAndShieldPowerRatio         = "Heal & Shield Power Ratio",
    Health                          = "Health",
    HealthRegenPer5sec              = "Health Regeneration per 5 sec",
    ChampionLevelUps                = "Champ Level Ups",
    MagicPenetrationFlat            = "Magic Penetration Flat",
    MagicPenetrationRatio           = "Magic Penetration Ratio",
    MagicResistReductionDebuffFlat  = "Magic Reduction Flat",
    MagicResistReductionDebuffRatio = "Magic Reduction Ratio",
    MagicResistance                 = "Magic Resistance",
    Mana                            = "Mana",
    ManaRegenPer5sec                = "Mana Regeneration per 5 sec",
    ManaRegenRatio                  = "Mana Regeneration Ratio",
    MoveSpeedFlat                   = "Move Speed",
    MoveSpeedRatio                  = "Move Speed Ratio",
}

export class DefiniteMap<K,V> extends SvelteMap<K,V> {
    protected readonly defaultValue: V;

    constructor(defaultValue: V, ...params: ConstructorParameters<typeof SvelteMap<K, V>>) {
        super(...params);
        this.defaultValue = $state(defaultValue);
    }

    get(key: K): V {
        return super.get(key) ?? this.defaultValue;
    }

    set(key: K, value: V): this {
        value == this.defaultValue ? super.delete(key) : super.set(key, value);
        return this;
    }
}

export class DefiniteNumberMap<K> extends DefiniteMap<K,number> {
    constructor(entries: Iterable<readonly [K, number]> = []) {
        super(0, entries);
    }

    static sumPerKey<K>(...summandMaps: DefiniteNumberMap<K>[]): DefiniteNumberMap<K> {
        return summandMaps.reduce((a,b) => {
            b.keys().forEach(bKey => a.set(bKey, a.get(bKey) + b.get(bKey)));
            return a;
        }, new DefiniteNumberMap<K>());
    }

    get total(): number {
        return this.values().toArray().reduce((a,b) => a + b, 0);
    }
}

export class Damage extends DefiniteNumberMap<DamageType> {
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

    static calculateDefenseCoefficient(
        resistance: number,
        resistanceReductionFlat: number,
        resistanceReductionRatio: number,
        penetrationRatio: number,
        penetrationFlat: number,
    ): number {
        let defenseSubtotal: number 
        = (resistance - resistanceReductionFlat) * (1 - resistanceReductionRatio);
        defenseSubtotal = Math.max(0, defenseSubtotal * (1 - penetrationRatio));
        defenseSubtotal = Math.max(0, defenseSubtotal - penetrationFlat);
        
        return defenseSubtotal == 0 ? 1 :
        defenseSubtotal < 0 ? (2 - (1 / (1 + (defenseSubtotal / 100)))) : 
        (1 / (1 + (defenseSubtotal / 100)));
    }
}

export class Effect {
    // implement/process
    readonly implement: (gameConfig: GameConfig, ...params: any[]) => GameConfig;
    readonly aftereffects: Effect[];

    constructor(
        implementation: typeof this.implement,
        ...aftereffects: typeof this.aftereffects
    ) {
        this.implement = implementation;
        this.aftereffects = aftereffects;
    }
    
    static createDamageEffect(
        damageType: DamageType, 
        baseAmount: number, 
        ratios: [StatType, number][],
        ...aftereffects: Effect[]
    ): Effect {
        return new Effect(
            (gameConfig: GameConfig): GameConfig => {
                let recentDamageAmountRaw: number
                = ratios.map(stat_ratio => gameConfig.statsPostEval.get(stat_ratio[0]) * stat_ratio[1])
                .reduce((a,b) => a + b, baseAmount);
                
                let recentDamage: Damage;
                switch (damageType) {
                    case DamageType.Magic:
                        recentDamage = new Damage(0, 0, recentDamageAmountRaw);
                        break;
                    case DamageType.Physical:
                        recentDamage = new Damage(0, recentDamageAmountRaw, 0);
                        break;
                    default:
                        recentDamage = new Damage(recentDamageAmountRaw, 0, 0);
                        break;
                }

                recentDamage = Damage.multiply(recentDamage, gameConfig.defenseCoefficients);

                return new GameConfig(gameConfig, {
                    damageAggregate: gameConfig.damageAggregate + recentDamage.total
                });
            },
            ...aftereffects
        )
    }
}

export interface Entity {
    name: string;
    iconURL: string;
}

export class Affector implements Entity {
    readonly name: string;
    readonly iconURL: string;
    readonly stats: DefiniteNumberMap<StatType>;
    readonly effectsPerRank: Effect[][];
    // singleStats or multiStats ?
    // when stats are dynamic, maybe that can be a StatEffect?

    constructor(
        name: typeof this.name, 
        iconURL: typeof this.iconURL,
        stats: Iterable<readonly [StatType,number]> = [],
        effectsPerRank: typeof this.effectsPerRank = []
    ) {
        this.name = name;
        this.iconURL = iconURL;
        this.stats = new DefiniteNumberMap(stats);
        this.effectsPerRank = effectsPerRank;
    }

    static allBasicAffectors = [
        new Affector("Basic Attack", "https://wiki.leagueoflegends.com/en-us/images/Attack_damage_icon.png", [], [
            [
                Effect.createDamageEffect(
                    DamageType.Physical, 
                    0,
                    [
                        [StatType.BaseAttackDamage, 1],
                        [StatType.BonusAttackDamage, 0],
                    ]
                )
            ],
        ]),
    ] as const;
}

export class Ability extends Affector {
    constructor(...affectorParams: ConstructorParameters<typeof Affector>) {
        super(...affectorParams);
    }
}

export class Item extends Affector {
    readonly price: number;

    constructor(
        price: number,
        ...affectorParams: ConstructorParameters<typeof Affector>
    ) {
        super(...affectorParams);
        this.price = price;

        Item.all.push(this);
    }

    static readonly all: Item[] = [];

    static readonly items = {
        NoItem: new Item(0, "Itemless", "https://wiki.leagueoflegends.com/en-us/images/Enemy_Missing_ping.png"),
        AdaptiveForceShard: new Item (
            0, "Adaptive Force Shard", "https://wiki.leagueoflegends.com/en-us/images/Rune_shard_Adaptive_Force.png",
            [[StatType.AbilityPower, 9]]
        ),
        AdaptiveForceShardX2: new Item (
            0, "Adaptive Force Shard x 2", "https://wiki.leagueoflegends.com/en-us/images/Rune_shard_Adaptive_Force.png",
            [[StatType.AbilityPower, 18]]
        ),
        HealthPotionX2: new Item (
            100, "Health Potion x 2", "https://wiki.leagueoflegends.com/en-us/images/Health_Potion_item.png"
        ),
        DarkSeal: new Item(
            350, "Dark Seal", "https://wiki.leagueoflegends.com/en-us/images/Dark_Seal_item.png", 
            [[StatType.AbilityPower,15],[StatType.Health,50]]
        ),
        DoransRing: new Item(
            400, "Doran's Ring", "https://wiki.leagueoflegends.com/en-us/images/Doran%27s_Ring_item.png", 
            [[StatType.AbilityPower,18],[StatType.Health,90]]
        ),
        BootsOfSwiftness: new Item(
            1000, "Boots of Swiftness", "https://wiki.leagueoflegends.com/en-us/images/Boots_of_Swiftness_item.png", 
            [[StatType.MoveSpeedFlat,55]]
        ),
        PlatedSteelcaps: new Item(
            1200, "Plated Steelcaps", "https://wiki.leagueoflegends.com/en-us/images/Plated_Steelcaps_item.png", 
            [[StatType.Armor,25],[StatType.MoveSpeedFlat,45]]
        ),
        TriumphantPlatedSteelcaps: new Item(
            1200, "Triumphant Plated Steelcaps", "https://wiki.leagueoflegends.com/en-us/images/Triumphant_Plated_Steelcaps_item.png", 
            [[StatType.Armor,30],[StatType.MoveSpeedFlat,45]]
        ),
        ArmoredAdvance: new Item(
            1700, "Armored Advance", "https://wiki.leagueoflegends.com/en-us/images/Armored_Advance_item.png", 
            [[StatType.Armor,40],[StatType.MoveSpeedFlat,50]]
        ),
        MercurysTreads: new Item(
            1250, "Mercury's Treads", "https://wiki.leagueoflegends.com/en-us/images/Mercury%27s_Treads_item.png", 
            [[StatType.MagicResistance,20],[StatType.MoveSpeedFlat,45]]
        ),
        TriumphantMercurysTreads: new Item(
            1250, "Triumphant Mercury's Treads", "https://wiki.leagueoflegends.com/en-us/images/Triumphant_Mercury%27s_Treads_item.png", 
            [[StatType.MagicResistance,25],[StatType.MoveSpeedFlat,45]]
        ),
        ChainlacedCrushers: new Item(
            1750, "Chainlaced Crushers", "https://wiki.leagueoflegends.com/en-us/images/Chainlaced_Crushers_item.png", 
            [[StatType.MagicResistance,35],[StatType.MoveSpeedFlat,50]]
        ),
        IonianBootsOfLucidity: new Item(
            900, "Ionian Boots of Lucidity", "https://wiki.leagueoflegends.com/en-us/images/Ionian_Boots_of_Lucidity_item.png", 
            [[StatType.AbilityHaste,10],[StatType.MoveSpeedFlat,45]]
        ),
        TriumphantIonianBootsOfLucidity: new Item(
            900, "Triumphant Ionian Boots of Lucidity", "https://wiki.leagueoflegends.com/en-us/images/Triumphant_Ionian_Boots_of_Lucidity_item.png", 
            [[StatType.AbilityHaste,15],[StatType.MoveSpeedFlat,45]]
        ),
        CrimsonLucidity: new Item(
            1400, "Crimson Lucidity", "https://wiki.leagueoflegends.com/en-us/images/Crimson_Lucidity_item.png", 
            [[StatType.AbilityHaste,25],[StatType.MoveSpeedFlat,50]]
        ),
        SorcerersShoes: new Item(
            1100, "Sorcerer's Shoes", "https://wiki.leagueoflegends.com/en-us/images/Sorcerer%27s_Shoes_item.png", 
            [[StatType.MagicPenetrationFlat,12],[StatType.MoveSpeedFlat,45]]
        ),
        TriumphantSorcerersShoes: new Item(
            1100, "Triumphant Sorcerer's Shoes", "https://wiki.leagueoflegends.com/en-us/images/Triumphant_Sorcerer%27s_Shoes_item.png", 
            [[StatType.MagicPenetrationFlat,14],[StatType.MoveSpeedFlat,45]]
        ),
        SpellslingersShoes: new Item(
            1600, "Spellslinger's Shoes", "https://wiki.leagueoflegends.com/en-us/images/Spellslinger%27s_Shoes_item.png", 
            [[StatType.MagicPenetrationFlat,18],[StatType.MagicPenetrationRatio,0.07],[StatType.MoveSpeedFlat,50]]
        ),
        SapphireCrystal: new Item(
            300, "Sapphire Crystal", "https://wiki.leagueoflegends.com/en-us/images/Sapphire_Crystal_item.png", 
            [[StatType.Mana,300]]
        ),
        AmplifyingTome: new Item(
            400, "Amplifying Tome", "https://wiki.leagueoflegends.com/en-us/images/Amplifying_Tome_item.png", 
            [[StatType.AbilityPower,20]]
        ),
        BlastingWand: new Item(
            850, "Blasting Wand", "https://wiki.leagueoflegends.com/en-us/images/Blasting_Wand_item.png", 
            [[StatType.AbilityPower,45]]
        ),
        NeedlesslyLargeRod: new Item(
            1200, "Needlessly Large Rod", "https://wiki.leagueoflegends.com/en-us/images/Needlessly_Large_Rod_item.png", 
            [[StatType.AbilityPower,65]]
        ),
        LostChapter: new Item(
            1200, "Lost Chapter", "https://wiki.leagueoflegends.com/en-us/images/Lost_Chapter_item.png", 
            [[StatType.AbilityHaste,10],[StatType.AbilityPower,40],[StatType.Mana,300]]
        ),
        ArchangelsStaff: new Item(
            2900, "Archangel's Staff", "https://wiki.leagueoflegends.com/en-us/images/Archangel%27s_Staff_item.png", 
            [[StatType.AbilityHaste,25],[StatType.AbilityPower,70],[StatType.Mana,600]]
        ),
        SeraphsEmbrace: new Item(
            2900, "Seraph's Embrace", "https://wiki.leagueoflegends.com/en-us/images/Seraph%27s_Embrace_item.png", 
            [[StatType.AbilityHaste,25],[StatType.AbilityPower,70],[StatType.Mana,1000]]
        ),
        ArdentCenser: new Item(
            2200, "Ardent Censer", "https://wiki.leagueoflegends.com/en-us/images/Ardent_Censer_item.png", 
            [[StatType.AbilityPower,45],[StatType.HealAndShieldPowerRatio,0.1],[StatType.ManaRegenRatio,1.25],[StatType.MoveSpeedRatio,0.04]]
        ),
        BansheesVeil: new Item(
            3000, "Banshee's Veil", "https://wiki.leagueoflegends.com/en-us/images/Banshee%27s_Veil_item.png",
            [[StatType.AbilityPower,105],[StatType.MagicResistance,40]]
        ),
        BlackfireTorch: new Item(
            2800, "Blackfire Torch", "https://wiki.leagueoflegends.com/en-us/images/Blackfire_Torch_item.png", 
            [[StatType.AbilityHaste,20],[StatType.AbilityPower,80],[StatType.Mana,600]],
            [[
                Effect.createDamageEffect(DamageType.Magic, 60, [[StatType.AbilityPower,0.06]]),
                new Effect(
                    (gameConfig : GameConfig): GameConfig => {
                        return new GameConfig(gameConfig, {
                            champStatModifiers: new DefiniteNumberMap<StatType>([
                                [StatType.AbilityPowerAmpRatio, gameConfig.champStatModifiers.get(StatType.AbilityPowerAmpRatio) + 0.04]
                            ])
                        });
                    }
                )
            ]]
        ),
        BloodlettersCurse: new Item(
            2900, "Bloodletter's Curse", "https://wiki.leagueoflegends.com/en-us/images/Bloodletter%27s_Curse_item.png",
            [[StatType.AbilityHaste,15],[StatType.AbilityPower,65],[StatType.Health,400]]
        ),
        CosmicDrive: new Item(
            3000, "Cosmic Drive", "https://wiki.leagueoflegends.com/en-us/images/Cosmic_Drive_item.png",
            [[StatType.AbilityHaste,25],[StatType.AbilityPower,70],[StatType.Health,350],[StatType.MoveSpeedRatio,0.04]]
        ),
        Cryptbloom: new Item(
            3000, "Cryptbloom", "https://wiki.leagueoflegends.com/en-us/images/Cryptbloom_item.png",
            [[StatType.AbilityHaste,20],[StatType.AbilityPower,75],[StatType.MagicPenetrationRatio,0.3]]
        ),
        Dawncore: new Item(
            2500, "Dawncore", "https://wiki.leagueoflegends.com/en-us/images/Dawncore_item.png",
            [[StatType.AbilityPower,45],[StatType.HealAndShieldPowerRatio,0.16],[StatType.ManaRegenRatio,1]]
        ),
        EchoesOfHelia: new Item(
            2200, "Echoes of Helia", "https://wiki.leagueoflegends.com/en-us/images/Echoes_of_Helia_item.png",
            [[StatType.AbilityHaste,20],[StatType.AbilityPower,35],[StatType.Health,200],[StatType.HealAndShieldPowerRatio,1.25]]
        ),
        HextechRocketbelt: new Item(
            2650, "Hextech Rocketbelt", "https://wiki.leagueoflegends.com/en-us/images/Hextech_Rocketbelt_item.png",
            [[StatType.AbilityHaste,20],[StatType.AbilityPower,70],[StatType.Health,300]],
            [[Effect.createDamageEffect(DamageType.Magic, 100, [[StatType.AbilityPower,0.1]])]]
        ),
        HorizonFocus: new Item(
            2750, "Horizon Focus", "https://wiki.leagueoflegends.com/en-us/images/Horizon_Focus_item.png",
            [[StatType.AbilityHaste,25],[StatType.AbilityPower,125]]
        ),
        ImperialMandate: new Item(
            2250, "Imperial Mandate", "https://wiki.leagueoflegends.com/en-us/images/Imperial_Mandate_item.png",
            [[StatType.AbilityHaste,20],[StatType.AbilityPower,60],[StatType.ManaRegenRatio,1.25]]
        ),
        LiandrysTorment: new Item(
            3000, "Liandry's Torment", "https://wiki.leagueoflegends.com/en-us/images/Liandry%27s_Torment_item.png",
            [[StatType.AbilityPower,60],[StatType.Health,300]]
        ),
        LichBane: new Item(
            2900, "Lich Bane", "https://wiki.leagueoflegends.com/en-us/images/Lich_Bane_item.png",
            [[StatType.AbilityHaste,10],[StatType.AbilityPower,100],[StatType.MoveSpeedRatio,0.04]],
            [[Effect.createDamageEffect(DamageType.Magic,-22,[[StatType.AbilityPower,0.4]])]]
        ),
        LudensCompanion: new Item(
            2750, "Luden's Companion", "https://wiki.leagueoflegends.com/en-us/images/Luden%27s_Companion_item.png", 
            [[StatType.AbilityHaste,10],[StatType.AbilityPower,100],[StatType.Mana,600]],
            [[Effect.createDamageEffect(DamageType.Magic, 150, [[StatType.AbilityPower,0.1]])]]
        ),
        Malignance: new Item(
            2700, "Malignance", "https://wiki.leagueoflegends.com/en-us/images/Malignance_item.png", 
            [[StatType.AbilityHaste,15],[StatType.AbilityPower,90],[StatType.Mana,600]],
            [
                [
                    new Effect(
                        (gameConfig: GameConfig): GameConfig => {
                            return new GameConfig(gameConfig, {
                                targetStatModifiers: DefiniteNumberMap.sumPerKey(
                                    gameConfig.targetStatModifiers,
                                    new DefiniteNumberMap<StatType>([[StatType.MagicResistReductionDebuffFlat, 90]])
                                )
                            });
                        },
                        Effect.createDamageEffect(DamageType.Magic, 180, [[StatType.AbilityPower, 0.15]])
                    )
                ]
            ]
        ),
        MejaisSoulstealer: new Item(
            1500, "Mejai's Soulstealer", "https://wiki.leagueoflegends.com/en-us/images/Mejai%27s_Soulstealer_item.png",
            [[StatType.AbilityPower,20],[StatType.Health,100]]
        ),
        MoonstoneRenewer: new Item(
            2200, "Moonstone Renewer", "https://wiki.leagueoflegends.com/en-us/images/Moonstone_Renewer_item.png",
            [[StatType.AbilityHaste,20],[StatType.AbilityPower,25],[StatType.Health,200],[StatType.ManaRegenRatio,1.25]]
        ),
        Morellonomicon: new Item(
            2850, "Morellonomicon", "https://wiki.leagueoflegends.com/en-us/images/Morellonomicon_item.png",
            [[StatType.AbilityHaste,15],[StatType.AbilityPower,75],[StatType.Health,350]]
        ),
        RabadonsDeathcap: new Item(
            3500, "Rabadon's Deathcap", "https://wiki.leagueoflegends.com/en-us/images/Rabadon%27s_Deathcap_item.png",
            [[StatType.AbilityPower,130],[StatType.AbilityPowerAmpRatio,0.3]]
        ),
        Riftmaker: new Item(
            3100, "Riftmaker", "https://wiki.leagueoflegends.com/en-us/images/Riftmaker_item.png",
            [[StatType.AbilityHaste,15],[StatType.AbilityPower,70],[StatType.Health,350]]
        ),
        RylaisCrystalScepter: new Item(
            2600, "Rylai's Crystal Scepter", "https://wiki.leagueoflegends.com/en-us/images/Rylai%27s_Crystal_Scepter_item.png",
            [[StatType.AbilityPower,65],[StatType.Health,400]]
        ),
        Shadowflame: new Item(
            3200, "Shadowflame", "https://wiki.leagueoflegends.com/en-us/images/Shadowflame_item.png",
            [[StatType.AbilityPower,110],[StatType.MagicPenetrationFlat,15]]
        ),
        ShurelyasBattlesong: new Item(
            2200, "Shurelya's Battlesong", "https://wiki.leagueoflegends.com/en-us/images/Shurelya%27s_Battlesong_item.png",
            [[StatType.AbilityHaste,15],[StatType.AbilityPower,50],[StatType.ManaRegenRatio,1.25],[StatType.MoveSpeedRatio,0.04]]
        ),
        StaffOfFlowingWater: new Item(
            2250, "Staff of Flowing Water", "https://wiki.leagueoflegends.com/en-us/images/Staff_of_Flowing_Water_item.png",
            [[StatType.AbilityHaste,15],[StatType.AbilityPower,35],[StatType.HealAndShieldPowerRatio,0.1],[StatType.ManaRegenRatio,1.25]]
        ),
        Stormsurge: new Item(
            2800, "Stormsurge", "https://wiki.leagueoflegends.com/en-us/images/Stormsurge_item.png",
            [[StatType.AbilityPower,80],[StatType.MagicPenetrationFlat,15],[StatType.MoveSpeedRatio,0.06]],
            [[Effect.createDamageEffect(DamageType.Magic, 125, [[StatType.AbilityPower,0.1]])]]
        ),
        VoidStaff: new Item(
            3000, "Void Staff", "https://wiki.leagueoflegends.com/en-us/images/Void_Staff_item.png",
            [[StatType.AbilityPower,95],[StatType.MagicPenetrationRatio,0.4]]
        ),
        ZhonyasHourglass: new Item(
            3250, "Zhonya's Hourglass", "https://wiki.leagueoflegends.com/en-us/images/Zhonya%27s_Hourglass_item.png",
            [[StatType.AbilityPower,105],[StatType.Armor,50]]
        )
    } as const;
}

export class Rune extends Affector {
    constructor(...affectorParams: ConstructorParameters<typeof Affector>) {
        super(...affectorParams);

        Rune.all.push(this);
    }

    static readonly all: Rune[] = [];

    static readonly runes = {
        // still ought to work out adaptive damage
        ArcaneComet: new Rune("Arcane Comet", "https://wiki.leagueoflegends.com/en-us/images/Arcane_Comet_rune.png", [], [
            [
                Effect.createDamageEffect(
                    DamageType.Magic, 
                    30,
                    [
                        [StatType.ChampionLevelUps, (130-30)/17],
                        [StatType.BonusAttackDamage, 0.1],
                        [StatType.AbilityPower, 0.05]
                    ]
                )
            ],
        ]),
        Electrocute: new Rune("Electrocute", "https://wiki.leagueoflegends.com/en-us/images/Electrocute_rune.png", [], [
            [
                Effect.createDamageEffect(
                    DamageType.Magic, 
                    70,
                    [
                        [StatType.ChampionLevelUps, (240-70)/17],
                        [StatType.BonusAttackDamage, 0.1],
                        [StatType.AbilityPower, 0.05]
                    ]
                )
            ],
        ]),
        SummonAery: new Rune("Summon Aery", "https://wiki.leagueoflegends.com/en-us/images/Summon_Aery_rune.png", [], [
            [
                Effect.createDamageEffect(
                    DamageType.Magic, 
                    10,
                    [
                        [StatType.ChampionLevelUps, (50-10)/17],
                        [StatType.BonusAttackDamage, 0.1],
                        [StatType.AbilityPower, 0.05]
                    ]
                )
            ],
        ]),
        Scorch: new Rune("Scorch", "https://wiki.leagueoflegends.com/en-us/images/Scorch_rune.png", [], [
            [
                Effect.createDamageEffect(
                    DamageType.Magic, 
                    20,
                    [
                        [StatType.ChampionLevelUps, (40-20)/17],
                    ]
                )
            ],
        ])
    } as const;
}

export class Champion implements Entity {
    readonly baseStats: DefiniteNumberMap<StatType>;
    readonly statGrowthCoefficients: DefiniteNumberMap<StatType>;

    constructor(
        readonly name: string,
        readonly iconURL: string,
        readonly abilities: Ability[],
        baseStats: Iterable<readonly [StatType, number]>,
        statGrowthCoefficients: Iterable<readonly [StatType, number]>
    ) {
        this.baseStats = new DefiniteNumberMap<StatType>(baseStats);
        this.statGrowthCoefficients = new DefiniteNumberMap<StatType>(statGrowthCoefficients);

        Champion.all.push(this);
    }

    static readonly all: Champion[] = [];

    static readonly champs = {
        Ahri: new Champion(
            "Ahri", 
            "https://wiki.leagueoflegends.com/en-us/images/thumb/Ahri_OriginalSquare.png/92px-Ahri_OriginalSquare.png", 
            [
                new Ability("Orb of Deception", "https://wiki.leagueoflegends.com/en-us/images/Ahri_Orb_of_Deception_HD.png", [], [
                    [
                        Effect.createDamageEffect(DamageType.Magic, 40, [[StatType.AbilityPower, 0.5]], 
                            Effect.createDamageEffect(DamageType.True, 40, [[StatType.AbilityPower, 0.5]])
                        )
                    ],
                    [
                        Effect.createDamageEffect(DamageType.Magic, 65, [[StatType.AbilityPower, 0.5]],
                            Effect.createDamageEffect(DamageType.True, 65, [[StatType.AbilityPower, 0.5]])
                        )
                    ],
                    [
                        Effect.createDamageEffect(DamageType.Magic, 90, [[StatType.AbilityPower, 0.5]],
                            Effect.createDamageEffect(DamageType.True, 90, [[StatType.AbilityPower, 0.5]])
                        )
                    ],
                    [
                        Effect.createDamageEffect(DamageType.Magic, 115, [[StatType.AbilityPower, 0.5]],
                            Effect.createDamageEffect(DamageType.True, 115, [[StatType.AbilityPower, 0.5]])
                        )
                    ],
                    [
                        Effect.createDamageEffect(DamageType.Magic, 140, [[StatType.AbilityPower, 0.5]],
                            Effect.createDamageEffect(DamageType.True, 140, [[StatType.AbilityPower, 0.5]])
                        )
                    ]
                ]),
                new Ability("Fox-Fire", "https://wiki.leagueoflegends.com/en-us/images/Ahri_Fox-Fire_HD.png", [], [
                    [ Effect.createDamageEffect(DamageType.Magic, 64, [[StatType.AbilityPower, 0.72]]) ],
                    [ Effect.createDamageEffect(DamageType.Magic, 96, [[StatType.AbilityPower, 0.72]]) ],
                    [ Effect.createDamageEffect(DamageType.Magic, 128, [[StatType.AbilityPower, 0.72]]) ],
                    [ Effect.createDamageEffect(DamageType.Magic, 160, [[StatType.AbilityPower, 0.72]]) ],
                    [ Effect.createDamageEffect(DamageType.Magic, 192, [[StatType.AbilityPower, 0.72]]) ]
                ]),
                new Ability("Charm", "https://wiki.leagueoflegends.com/en-us/images/Ahri_Charm_HD.png", [], [
                    [ Effect.createDamageEffect(DamageType.Magic, 80, [[StatType.AbilityPower, 0.85]]) ],
                    [ Effect.createDamageEffect(DamageType.Magic, 120, [[StatType.AbilityPower, 0.85]]) ],
                    [ Effect.createDamageEffect(DamageType.Magic, 160, [[StatType.AbilityPower, 0.85]]) ],
                    [ Effect.createDamageEffect(DamageType.Magic, 200, [[StatType.AbilityPower, 0.85]]) ],
                    [ Effect.createDamageEffect(DamageType.Magic, 240, [[StatType.AbilityPower, 0.85]]) ]
                ]),
                new Ability("Spirit Rush", "https://wiki.leagueoflegends.com/en-us/images/Ahri_Spirit_Rush_HD.png", [], [
                    [ Effect.createDamageEffect(DamageType.Magic, 75, [[StatType.AbilityPower, 0.35]]) ],
                    [ Effect.createDamageEffect(DamageType.Magic, 125, [[StatType.AbilityPower, 0.35]]) ],
                    [ Effect.createDamageEffect(DamageType.Magic, 175, [[StatType.AbilityPower, 0.35]]) ]
                ]),
            ], 
            [
                [StatType.Health, 590],
                [StatType.HealthRegenPer5sec, 2.5],
                [StatType.Mana, 418],
                [StatType.ManaRegenPer5sec, 8],
                [StatType.Armor, 21],
                [StatType.MagicResistance, 30],
                [StatType.AttackDamageBase, 53]
            ], 
            [
                [StatType.Health, 104],
                [StatType.HealthRegenPer5sec, 0.6],
                [StatType.Mana, 25],
                [StatType.ManaRegenPer5sec, 0.8],
                [StatType.Armor, 4.2],
                [StatType.MagicResistance, 1.3],
                [StatType.AttackDamageBase, 3],
            ]
        ),
    } as const;
}

export class GameOrigin {
    constructor(
        public readonly buildPrice: number,
        public readonly buildStats: DefiniteNumberMap<StatType>,
        public readonly champBaseStats: DefiniteNumberMap<StatType>,
        public readonly targetBaseStats: DefiniteNumberMap<StatType>,
        public readonly effectQueue: Effect[]
    ) {
    }

    processEffects(): GameConfig {
        let gameConfig = new GameConfig(null, { origin: this });
        
        this.effectQueue.forEach(effect => {
            gameConfig = effect.implement(gameConfig);
            effect.aftereffects.forEach(aftereffect => {
                gameConfig = aftereffect.implement(gameConfig);
            });
        });

        return gameConfig;
    }
}

export class GameConfig {
    readonly origin: GameOrigin;
    readonly champStatModifiers: DefiniteNumberMap<StatType>;
    readonly targetStatModifiers: DefiniteNumberMap<StatType>;
    readonly damageAggregate: number;

    readonly statsPostEval: DefiniteNumberMap<StatType>;
    readonly targetStatsPostEval: DefiniteNumberMap<StatType>;
    readonly defenseCoefficients: Damage;

    constructor(blueprint: GameConfig|null = null, newValues: Partial<GameConfig> = {}) {
        let oldValues
        = blueprint instanceof GameConfig ? {
            originGameConfig: blueprint.origin,
            champStatModifiers: blueprint.champStatModifiers,
            targetStatModifiers: blueprint.targetStatModifiers,
            damageAggregate: blueprint.damageAggregate
        } : {
            originGameConfig: new GameOrigin(
                0,
                new DefiniteNumberMap<StatType>(), 
                new DefiniteNumberMap<StatType>(),
                new DefiniteNumberMap<StatType>(),
                []
            ),
            champStatModifiers: new DefiniteNumberMap<StatType>(),
            targetStatModifiers: new DefiniteNumberMap<StatType>(),
            damageAggregate: 0
        };

        this.origin = newValues.origin ?? oldValues.originGameConfig;
        this.champStatModifiers = newValues.champStatModifiers ?? oldValues.champStatModifiers;
        this.targetStatModifiers = newValues.targetStatModifiers ?? oldValues.targetStatModifiers;
        this.damageAggregate = newValues.damageAggregate ?? oldValues.damageAggregate;
        

        this.statsPostEval 
        = newValues.champStatModifiers || !blueprint ? 
        DefiniteNumberMap.sumPerKey(this.origin.champBaseStats, this.champStatModifiers, this.origin.buildStats) : 
        blueprint.statsPostEval;
        
        this.statsPostEval.set(StatType.AbilityPower, this.statsPostEval.get(StatType.AbilityPower) * (1 + this.statsPostEval.get(StatType.AbilityPowerAmpRatio)));


        this.targetStatsPostEval 
        = newValues.targetStatModifiers || !blueprint ?
        DefiniteNumberMap.sumPerKey(this.origin.targetBaseStats, this.targetStatModifiers) :
        blueprint.targetStatsPostEval;
        
        this.targetStatsPostEval.set(StatType.AbilityPower, this.targetStatsPostEval.get(StatType.AbilityPower) * (1 + this.targetStatsPostEval.get(StatType.AbilityPowerAmpRatio)));


        this.defenseCoefficients 
        = (newValues.champStatModifiers || newValues.targetStatModifiers) || !blueprint ?
        new Damage(
            1, 
            Damage.calculateDefenseCoefficient(
                this.targetStatsPostEval.get(StatType.Armor),
                this.targetStatsPostEval.get(StatType.ArmorReductionDebuffFlat),
                this.targetStatsPostEval.get(StatType.ArmorReductionDebuffRatio),
                this.statsPostEval.get(StatType.ArmorPenetrationRatio),
                this.statsPostEval.get(StatType.ArmorPenetrationFlat)
            ),
            Damage.calculateDefenseCoefficient(
                this.targetStatsPostEval.get(StatType.MagicResistance),
                this.targetStatsPostEval.get(StatType.MagicResistReductionDebuffFlat),
                this.targetStatsPostEval.get(StatType.MagicResistReductionDebuffRatio),
                this.statsPostEval.get(StatType.MagicPenetrationRatio),
                this.statsPostEval.get(StatType.MagicPenetrationFlat)
            )
        ) : blueprint.defenseCoefficients;
    }
}

export class DiffMap extends DefiniteMap<BuildConfig,GameDiff> {
    static readonly zeroDiff: GameDiff = {
        unbuiltEndGameConfig: new GameConfig(),
        builtEndGameConfig: new GameConfig(),
        totalDamageDiff: 0,
        damageDiff_per_goldDiff: 0
    }

    readonly min_DamageDiffPerGoldDiff: number;
    
    constructor(entries: Iterable<readonly [BuildConfig, GameDiff]>) {
        super(DiffMap.zeroDiff, entries);
        
        let diffs = this.values().toArray();
        let nonzero_damageDiff_per_goldDiffs = diffs.map(diff => diff.damageDiff_per_goldDiff).filter(value => value > 0);

        this.min_DamageDiffPerGoldDiff = nonzero_damageDiff_per_goldDiffs.length > 1 ? Math.min(...nonzero_damageDiff_per_goldDiffs) : nonzero_damageDiff_per_goldDiffs[0] ?? 0;
    }
}

export class DiffAtlas extends DefiniteMap<Affector|null, DiffMap> {
    constructor(
        champ: Champion,
        abilityRanks: DefiniteNumberMap<Ability>,
        targetBaseStats: DefiniteNumberMap<StatType>,
        buildConfigs: BuildConfig[]
    ) {
        let champLevel = abilityRanks.values().reduce((a,b) => a+b, 0);
        let champLevelUps = Math.max(0, champLevel - 1);
        let growthCoeffecient = champLevelUps * (0.7025 + (0.0175 * champLevelUps));
        
        let growthStats 
        = new DefiniteNumberMap(champ.statGrowthCoefficients.entries().map(statType_statCoefficient => {
            let statType = statType_statCoefficient[0];
            let statCoefficient = statType_statCoefficient[1];
            
            return [statType, statCoefficient * growthCoeffecient]
        }));
        
        let totalBaseStats 
        = DefiniteNumberMap.sumPerKey(new DefiniteNumberMap<StatType>([[StatType.ChampionLevelUps, champLevelUps]]), champ.baseStats, growthStats);
        // totalBaseStats.set(StatType.ChampionLevel, champLevel);
        
        let effectsPerAbility 
        = new DefiniteMap<Ability,Effect[]>([], champ.abilities.map(
            ability => [ability, ability.effectsPerRank[Math.max(0, abilityRanks.get(ability) - 1)]]
        ));
        
        let affectorQueueDiffMap 
        = new DiffMap(buildConfigs.map(
            (buildConfig): [BuildConfig, GameDiff] => {

                let builtEffects 
                = buildConfig.affectorQueue.flatMap(
                    (affector): Effect[] => {
                        if (affector instanceof Ability) {
                            return effectsPerAbility.get(affector);
                        }
                        else if (affector instanceof Item) {
                            return affector.effectsPerRank[buildConfig.itemSlots.find(itemConfig => itemConfig.item == affector)?.rank ?? 0];
                        }
                        else return affector.effectsPerRank[0];
                    }
                );

                let endBuiltGameConfig 
                = new GameOrigin(
                    buildConfig.totalCost, 
                    buildConfig.buildStats, 
                    totalBaseStats,
                    targetBaseStats,
                    builtEffects
                ).processEffects();

                let unbuiltEffects 
                = buildConfig.affectorQueue
                .filter(affector => affector !instanceof Item)
                .flatMap(affector => 
                    affector instanceof Ability ? 
                    effectsPerAbility.get(affector) :
                    affector.effectsPerRank[0]
                );

                let endUnbuiltGameConfig 
                = new GameOrigin(
                    0, 
                    new DefiniteNumberMap<StatType>(), 
                    totalBaseStats,
                    targetBaseStats, 
                    unbuiltEffects
                ).processEffects();
                
                let effectQueueDiff = DiffAtlas.calculateDiff(endUnbuiltGameConfig, endBuiltGameConfig);
                return [buildConfig, effectQueueDiff];
            }
        ));

        let entries 
        = champ.abilities.map((ability): [Ability, DiffMap] => {
            let effects = effectsPerAbility.get(ability);
            
            let diffMap = new DiffMap( 
                buildConfigs.map((buildConfig): [BuildConfig, GameDiff] => {
                    let endBuiltGameConfig 
                    = new GameOrigin(
                        buildConfig.totalCost, 
                        buildConfig.buildStats, 
                        totalBaseStats,
                        targetBaseStats, 
                        effects
                    ).processEffects();

                    let endUnbuiltGameConfig 
                    = new GameOrigin(
                        0, 
                        new DefiniteNumberMap<StatType>(), 
                        totalBaseStats,
                        targetBaseStats, 
                        effects
                    ).processEffects();
                    
                    let effectQueueDiff = DiffAtlas.calculateDiff(endUnbuiltGameConfig, endBuiltGameConfig);
                    return [buildConfig, effectQueueDiff];
                })
            );

            return [ability, diffMap];
        });

        super(affectorQueueDiffMap, entries);
    }

    static calculateDiff(unbuiltEndGameConfig: GameConfig, builtEndGameConfig: GameConfig) {
        return {
            unbuiltEndGameConfig,
            builtEndGameConfig,
            totalDamageDiff: builtEndGameConfig.damageAggregate - unbuiltEndGameConfig.damageAggregate,
            damageDiff_per_goldDiff: (builtEndGameConfig.damageAggregate - unbuiltEndGameConfig.damageAggregate) / (builtEndGameConfig.origin.buildPrice - unbuiltEndGameConfig.origin.buildPrice),
        };
    }
}

export type GameDiff = ReturnType<typeof DiffAtlas.calculateDiff>;

export class BuildConfig {
    itemSlots: ItemSlotConfigSet;
    // runes: RuneSet;
    affectorQueue: Affector[];
    
    constructor(blueprint?: BuildConfig, newValues: Partial<BuildConfig> = {}) {
        let oldValues 
        = blueprint instanceof BuildConfig ? {
            itemSlots: [
                new ItemSlotConfig(blueprint.itemSlots[0]),
                new ItemSlotConfig(blueprint.itemSlots[1]),
                new ItemSlotConfig(blueprint.itemSlots[2]),
                new ItemSlotConfig(blueprint.itemSlots[3]),
                new ItemSlotConfig(blueprint.itemSlots[4]),
                new ItemSlotConfig(blueprint.itemSlots[5])
            ] as ItemSlotConfigSet,
            affectorQueue: blueprint.affectorQueue,
        } : {
            itemSlots: [
                new ItemSlotConfig(), 
                new ItemSlotConfig(), 
                new ItemSlotConfig(), 
                new ItemSlotConfig(), 
                new ItemSlotConfig(), 
                new ItemSlotConfig()
            ] as ItemSlotConfigSet,
            affectorQueue: [],
        };

        this.itemSlots = $state(newValues.itemSlots ?? oldValues.itemSlots);
        this.affectorQueue = $state([...(newValues.affectorQueue ?? oldValues.affectorQueue)]);
    }

    get items(): Item[] {
        return this.itemSlots.map(itemConfig => itemConfig.item).filter(item => item != null);
    }

    get totalCost(): number {
        return this.itemSlots.map(itemConfig => itemConfig.item.price).reduce((a,b) => a + b, 0);
    }

    get buildStats(): DefiniteNumberMap<StatType> {
        return DefiniteNumberMap.sumPerKey(...this.items.map(item => item.stats));
    }
}

export type ItemSlotConfigSet
= [ ItemSlotConfig, ItemSlotConfig, ItemSlotConfig, ItemSlotConfig, ItemSlotConfig, ItemSlotConfig ];

export class ItemSlotConfig {
    item: Item;
    rank: number;

    constructor(blueprint: ItemSlotConfig|null = null, newValues: Partial<ItemSlotConfig> = {}) {
        let oldValues 
        = blueprint instanceof ItemSlotConfig ? {
            item: blueprint.item,
            rank: blueprint.rank
        } : {
            item: Item.items.NoItem,
            rank: 0
        };

        this.item = $state(newValues.item ?? oldValues.item);
        this.rank = $state(newValues.rank ?? oldValues.rank);
    }
}

/**
export class RunesConfig implements Config {
    duplicate(): RunesConfig {}
}
/**/