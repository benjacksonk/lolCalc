import { SvelteMap } from "svelte/reactivity";
import itemsJSON from '$lib/dragontail-data/en_US/item.json';

export enum AbilityType { P="P", Q="Q", W="W", E="E", R="R" }

export enum DamageType { True="True", Physical="Physical", Magic="Magic" }

export enum StatType {
    AbilityHaste                    = "Ability Haste",
    AbilityPower                    = "Ability Power",
    AbilityPowerAmpRatio            = "% Ability Power",
    AttackDamageBase                = "Base Attack Damage",
    AttackDamageBonus               = "Attack Damage",
    Armor                           = "Armor",
    ArmorPenetrationFlat            = "Lethality",
    ArmorPenetrationRatio           = "% Armor Penetration",
    ArmorReductionDebuffFlat        = "Armor Reduction",
    ArmorReductionDebuffRatio       = "% Armor Reduction",
    BaseAttackDamage                = "Base Attack Damage",
    BonusAttackDamage               = "Bonus Attack Damage",
    DamageMagicAmpRatio             = "% Magic Damage",
    DamagePhysicalAmpRatio          = "% Physical Damage",
    DamageTrueAmpRatio              = "% True Damage",
    HealAndShieldPowerRatio         = "% Heal and Shield Power",
    Health                          = "Health",
    HealthRegenPer5sec              = "Health Regeneration per 5 sec",
    ChampionLevelUps                = "Champ Level Ups",
    MagicPenetrationFlat            = "Magic Penetration",
    MagicPenetrationRatio           = "% Magic Penetration",
    MagicResistReductionDebuffFlat  = "Magic Reduction",
    MagicResistReductionDebuffRatio = "% Magic Reduction",
    MagicResistance                 = "Magic Resistance",
    Mana                            = "Mana",
    ManaRegenPer5sec                = "Mana Regeneration per 5 sec",
    ManaRegenRatio                  = "% Mana Regeneration",
    MoveSpeedFlat                   = "Move Speed",
    MoveSpeedRatio                  = "% Move Speed",
    Omnivamp                        = "% Omnivamp",
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

                recentDamage = Damage.multiply(
                    recentDamage, 
                    new Damage(
                        1 + gameConfig.statsPostEval.get(StatType.DamageTrueAmpRatio),
                        1 + gameConfig.statsPostEval.get(StatType.DamagePhysicalAmpRatio),
                        1 + gameConfig.statsPostEval.get(StatType.DamageMagicAmpRatio)
                    )
                );

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
    stats: DefiniteNumberMap<StatType>;
    effectsPerRank: Effect[][];
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
        new Affector("Ignite", "https://wiki.leagueoflegends.com/en-us/images/Ignite.png", [], [
            [
                new Effect((gameConfig: GameConfig): GameConfig => {
                    let levelUps = gameConfig.statsPostEval.get(StatType.ChampionLevelUps);
                    let lateLevelUps = Math.max(0, levelUps - 4);
                    let earlyLevelUps = levelUps - lateLevelUps;
                    let trueDamage = 70 + (20 * earlyLevelUps) + (25 * lateLevelUps);
                    
                    return new GameConfig(gameConfig, {
                        damageAggregate: gameConfig.damageAggregate + trueDamage
                    });
                })
            ],
        ]),
    ] as const;
}

export class Ability extends Affector {
    constructor(...affectorParams: ConstructorParameters<typeof Affector>) {
        super(...affectorParams);
    }
}

type ItemData = {
    name: string,
    description: string,
    colloq: string,
    plaintext: string,
    specialRecipe: number|null,
    from: string[],
    into: string[],
    image: {
        full: string,
        sprite: string,
        group: string,
        x: number,
        y: number,
        w: number,
        h: number
    },
    gold: {
        base: number,
        purchasable: boolean,
        total: number,
        sell: number,
    },
    tags: string[],
    maps: { [key: string]: boolean },
    stats: { [key: string]: number },
    depth: number,
}

export class Item extends Affector {
    readonly id: number;
    readonly price: number;
    readonly specialRecipe: number|null;
    readonly from: number[];
    readonly into: number[];
    // readonly depth: number;

    constructor(itemData: ItemData, id: number = -1) {
        const imageFull = itemData.image.full;
        const imageURL = imageFull.startsWith("http") ? imageFull : `dragontail-img/item/${imageFull}`;
        
        const statTypes = new Set(Object.values(StatType));

        const validStats = 
        Object.entries(itemData.stats)
        .filter(([key]) => statTypes.has(key as StatType))
        .map(([key, value]) => [key as StatType, value] as [StatType, number]);

        super(itemData.name, imageURL, validStats);

        this.id = id;
        this.price = itemData.gold.total;
        this.from = itemData.from?.map(Number) ?? [];
        this.into = itemData.into?.map(Number) ?? [];
        this.specialRecipe = itemData.specialRecipe;
        // this.depth = itemData.depth ?? 1;
    }

    depth(): number {
        if (Item.all == undefined) {
            console.error("Item.all is undefined");
            return 1;
        }

        const depthOfSpecialRecipeComponent 
        = this.specialRecipe == null ? 0 : 
        (Item.all.find(item => this.specialRecipe == item.id)?.depth() ?? 1);

        const maxDepthOfComponents 
        = this.from
        .map(id => Item.all.find(item => item.id == id)?.depth() ?? 1)
        .reduce((a,b) => Math.max(a,b), depthOfSpecialRecipeComponent);

        return 1 + maxDepthOfComponents;
    }

    static readonly nothing = new Item({
        name: "Nothing",
        description: "",
        colloq: "",
        plaintext: "",
        specialRecipe: null,
        from: [],
        into: [],
        image: {
            full: "https://wiki.leagueoflegends.com/en-us/images/Enemy_Missing_ping.png",
            sprite: "",
            group: "",
            x: 0,
            y: 0,
            w: 0,
            h: 0
        },
        gold: {
            base: 0,
            purchasable: true,
            total: 0,
            sell: 0,
        },
        tags: [],
        maps: {},
        stats: {},
        depth: 1
    });

    static readonly all: Item[] = (() => {
        try {
            const filterTags: string[] = [
                "Boots", 
                "BootsOfSpeed", 
                "Consumable", 
                "SpellDamage",
            ];

            const filterStats: string[] = [
                "FlatMagicDamageMod",
            ];

            const itemsObject = JSON.parse(JSON.stringify(itemsJSON));
            
            let riftItemDataEntries: [string, ItemData][] 
            = Object.entries<ItemData>(itemsObject["data"])
            .filter(([id, itemData]) => itemData.maps["11"] && id.length <= 4);

            // Parse item descriptions to set their stat data accordingly.
            riftItemDataEntries.forEach(([id, itemData]) => {
                itemData.description
                .match(/<stats>(?<content>[\s\S]*?)<\/stats>/)?.groups?.content
                .split("<br>")
                .forEach(s => {
                    let valueString = s.match(/<attention>(?<content>[\s\S]*?)<\/attention>/)?.groups?.content;
                    
                    if (valueString != undefined) {
                        let amount: number;
                        let statName: string;

                        if (valueString.endsWith("%")) {
                            amount = parseFloat(valueString.slice(0, -1)) / 100;
                            statName = `% ${s.split("</attention>")[1].trim()}`;
                        }
                        else {
                            amount = parseFloat(valueString);
                            statName = s.split("</attention>")[1].trim();
                        }

                        itemData.stats[statName] = amount;
                    }
                });
            });
            
            let primaryItemDataEntries: [string, ItemData][] 
            = riftItemDataEntries.filter(([id, itemData]) => 
                filterTags.some(tag => itemData.tags.includes(tag)) || filterStats.some(stat => Object.keys(itemData.stats).includes(stat)) 
                && (itemData.gold.purchasable || itemData.specialRecipe != null)
            );

            let secondaryItemDataEntries: [string, ItemData][]
            = riftItemDataEntries.filter(([id, itemData]) => 
                !primaryItemDataEntries.some(([pid, pitemData]) => id === pid) && 
                primaryItemDataEntries.some(([pid, pitemData]) => pitemData.specialRecipe == Number.parseInt(id) || itemData.specialRecipe == Number.parseInt(pid) || itemData.into?.includes(pid) || pitemData.from?.includes(id))
            );
            
            let tertiaryItemDataEntries: [string, ItemData][]
            = riftItemDataEntries.filter(([id, itemData]) => 
                !primaryItemDataEntries.some(([pid, pitemData]) => id === pid) 
                && !secondaryItemDataEntries.some(([sid, sitemData]) => id === sid) 
                && secondaryItemDataEntries.some(([sid, sitemData]) => sitemData.specialRecipe == Number.parseInt(id) || itemData.specialRecipe == Number.parseInt(sid) || itemData.into?.includes(sid) || sitemData.from?.includes(id))
            );

            let relevantItems = 
            [...primaryItemDataEntries, ...secondaryItemDataEntries, ...tertiaryItemDataEntries];
            
            const items: Item[] = (() => {
                let itemMap: { [key: string]: Item } 
                = relevantItems.reduce((acc, [id, itemData]) => {
                    acc[itemData.name] = new Item(itemData, Number.parseInt(id));
                    return acc;
                }, {} as { [key: string]: Item });

                // Add unique item stats/effects not captured by described stats alone.
                try {
                    itemMap["Immortal Path"].stats.set(StatType.DamageMagicAmpRatio, 0.05)
                    itemMap["Immortal Path"].stats.set(StatType.DamagePhysicalAmpRatio, 0.05);
                    itemMap["Immortal Path"].stats.set(StatType.DamageTrueAmpRatio, 0.05);
                    
                    itemMap["Swiftmarch"].stats.set(StatType.AbilityPower, 20); // practical estimate
                    
                    itemMap["Actualizer"].effectsPerRank = [
                        [
                            new Effect((gameConfig: GameConfig): GameConfig => {
                                let damageAmp = 0.15 + 0.00005 * gameConfig.champStatModifiers.get(StatType.Mana);

                                return new GameConfig(gameConfig, {
                                    champStatModifiers: DefiniteNumberMap.sumPerKey(
                                        gameConfig.champStatModifiers,
                                        new DefiniteNumberMap<StatType>([
                                            [StatType.DamageMagicAmpRatio, damageAmp],
                                            [StatType.DamagePhysicalAmpRatio, damageAmp],
                                            [StatType.DamageTrueAmpRatio, damageAmp]
                                        ])
                                    )
                                });
                            })
                        ]
                    ];

                    itemMap["Blackfire Torch"].effectsPerRank = [
                        [
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
                        ]
                    ];

                    itemMap["Dusk and Dawn"].effectsPerRank = [
                        [Effect.createDamageEffect(DamageType.Magic, 0, [[StatType.BaseAttackDamage,0.75],[StatType.AbilityPower,0.1]])]
                    ];

                    itemMap["Hextech Gunblade"].effectsPerRank = [
                        [Effect.createDamageEffect(DamageType.Magic, 175, [[StatType.ChampionLevelUps,(253-175)/17],[StatType.AbilityPower,0.3]])]
                    ];

                    itemMap["Hextech Rocketbelt"].effectsPerRank = [
                        [Effect.createDamageEffect(DamageType.Magic, 100, [[StatType.AbilityPower,0.1]])]
                    ];

                    itemMap["Horizon Focus"].effectsPerRank = [
                        [
                            new Effect(
                                (gameConfig : GameConfig): GameConfig => {
                                    return new GameConfig(gameConfig, {
                                        damageAggregate: gameConfig.damageAggregate * 1.1
                                    });
                                }
                            )
                        ]
                    ];

                    itemMap["Liandry's Torment"].effectsPerRank = [
                        [
                            new Effect((gameConfig: GameConfig): GameConfig => {
                                let rawDamage = new Damage(0, 0, gameConfig.targetStatsPostEval.get(StatType.Health) * 0.06);
                                let effectiveDamage = Damage.multiply(rawDamage, gameConfig.defenseCoefficients);
                                
                                return new GameConfig(gameConfig, {
                                    damageAggregate: gameConfig.damageAggregate + effectiveDamage.total
                                });
                            })
                        ]
                    ];

                    itemMap["Lich Bane"].effectsPerRank = [
                        [Effect.createDamageEffect(DamageType.Magic, 0, [[StatType.AbilityPower,0.45],[StatType.BaseAttackDamage,0.75]])]
                    ];

                    itemMap["Luden's Echo"].effectsPerRank = [
                        [Effect.createDamageEffect(DamageType.Magic, 150, [[StatType.AbilityPower,0.1]])]
                    ];

                    itemMap["Malignance"].effectsPerRank = [
                        [
                            new Effect(
                                (gameConfig: GameConfig): GameConfig => {
                                    return new GameConfig(gameConfig, {
                                        targetStatModifiers: DefiniteNumberMap.sumPerKey(
                                            gameConfig.targetStatModifiers,
                                            new DefiniteNumberMap<StatType>([[StatType.MagicResistReductionDebuffFlat, 10]])
                                        )
                                    });
                                },
                                Effect.createDamageEffect(DamageType.Magic, 180, [[StatType.AbilityPower, 0.15]])
                            )
                        ]
                    ];

                    itemMap["Rabadon's Deathcap"].stats.set(StatType.AbilityPowerAmpRatio, 0.30);

                    itemMap["Redemption"].effectsPerRank = [
                        [
                            new Effect((gameConfig: GameConfig): GameConfig => {
                                let rawDamage = new Damage(gameConfig.targetStatsPostEval.get(StatType.Health) * 0.1, 0, 0);
                                let effectiveDamage = Damage.multiply(rawDamage, gameConfig.defenseCoefficients);
                                
                                return new GameConfig(gameConfig, {
                                    damageAggregate: gameConfig.damageAggregate + effectiveDamage.total
                                });
                            })
                        ]
                    ];

                    itemMap["Shadowflame"].effectsPerRank = [
                        [
                            new Effect((gameConfig: GameConfig): GameConfig => {
                                let damageAmp = 0.2;

                                return new GameConfig(gameConfig, {
                                    champStatModifiers: DefiniteNumberMap.sumPerKey(
                                        gameConfig.champStatModifiers,
                                        new DefiniteNumberMap<StatType>([
                                            [StatType.DamageMagicAmpRatio, damageAmp],
                                            [StatType.DamageTrueAmpRatio, damageAmp]
                                        ])
                                    )
                                });
                            })
                        ]
                    ];

                    itemMap["Stormsurge"].effectsPerRank = [
                        [Effect.createDamageEffect(DamageType.Magic, 125, [[StatType.AbilityPower,0.1]])]
                    ];

                    itemMap["Zhonya's Hourglass"].effectsPerRank = [];
                }
                catch (error) {
                    console.error('Error adding unique item stats/effects:', error);
                }

                return Object.entries(itemMap).map<Item>(([id, item]) => item);
            })();
            
            const runesData: ItemData[] = [
                {
                    name: "Adaptive Force Shards 1/2",
                    description: "",
                    colloq: "",
                    plaintext: "",
                    specialRecipe: null,
                    from: [],
                    into: [],
                    image: {
                        full: "https://wiki.leagueoflegends.com/en-us/images/Rune_shard_Adaptive_Force.png",
                        sprite: "",
                        group: "",
                        x: 0,
                        y: 0,
                        w: 0,
                        h: 0
                    },
                    gold: {
                        base: 0,
                        purchasable: true,
                        total: 0,
                        sell: 0,
                    },
                    tags: [],
                    maps: {  },
                    stats: {
                        "Ability Power": 9
                    },
                    depth: 1,
                },
                {
                    name: "Adaptive Force Shards 2/2",
                    description: "",
                    colloq: "",
                    plaintext: "",
                    specialRecipe: null,
                    from: [],
                    into: [],
                    image: {
                        full: "https://wiki.leagueoflegends.com/en-us/images/Rune_shard_Adaptive_Force.png",
                        sprite: "",
                        group: "",
                        x: 0,
                        y: 0,
                        w: 0,
                        h: 0
                    },
                    gold: {
                        base: 0,
                        purchasable: true,
                        total: 0,
                        sell: 0,
                    },
                    tags: [],
                    maps: {  },
                    stats: {
                        "Ability Power": 18
                    },
                    depth: 1,
                },
                {
                    name: "Jack of All Trades 05/10",
                    description: "",
                    colloq: "",
                    plaintext: "",
                    specialRecipe: null,
                    from: [],
                    into: [],
                    image: {
                        full: "https://wiki.leagueoflegends.com/en-us/images/Jack_of_All_Trades_rune.png",
                        sprite: "",
                        group: "",
                        x: 0,
                        y: 0,
                        w: 0,
                        h: 0
                    },
                    gold: {
                        base: 0,
                        purchasable: true,
                        total: 0,
                        sell: 0,
                    },
                    tags: [],
                    maps: {  },
                    stats: {
                        "Ability Haste": 5,
                        "Ability Power": 8
                    },
                    depth: 1,
                },
                {
                    name: "Jack of All Trades 10/10",
                    description: "",
                    colloq: "",
                    plaintext: "",
                    specialRecipe: null,
                    from: [],
                    into: [],
                    image: {
                        full: "https://wiki.leagueoflegends.com/en-us/images/Jack_of_All_Trades_rune.png",
                        sprite: "",
                        group: "",
                        x: 0,
                        y: 0,
                        w: 0,
                        h: 0
                    },
                    gold: {
                        base: 0,
                        purchasable: true,
                        total: 0,
                        sell: 0,
                    },
                    tags: [],
                    maps: {  },
                    stats: {
                        "Ability Haste": 10,
                        "Ability Power": 20
                    },
                    depth: 1,
                },
            ];

            items.push(Item.nothing, ...runesData.map<Item>(runeData => new Item(runeData)));

            return items.filter(item => 
                item == Item.nothing || item.stats.size > 0 || item.effectsPerRank.length > 0
            );
        }
        catch (error) {
            console.error('Error parsing items JSON:', error);
            return [];
        }
    })();
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
            "https://wiki.leagueoflegends.com/en-us/images/Ahri_OriginalSquare.png", 
            [
                new Ability("Orb of Deception", "https://wiki.leagueoflegends.com/en-us/images/Ahri_Orb_of_Deception_HD.png", [], [
                    [
                        Effect.createDamageEffect(DamageType.Magic, 35, [[StatType.AbilityPower, 0.5]], 
                            Effect.createDamageEffect(DamageType.True, 35, [[StatType.AbilityPower, 0.5]])
                        )
                    ],
                    [
                        Effect.createDamageEffect(DamageType.Magic, 60, [[StatType.AbilityPower, 0.5]],
                            Effect.createDamageEffect(DamageType.True, 60, [[StatType.AbilityPower, 0.5]])
                        )
                    ],
                    [
                        Effect.createDamageEffect(DamageType.Magic, 85, [[StatType.AbilityPower, 0.5]],
                            Effect.createDamageEffect(DamageType.True, 85, [[StatType.AbilityPower, 0.5]])
                        )
                    ],
                    [
                        Effect.createDamageEffect(DamageType.Magic, 110, [[StatType.AbilityPower, 0.5]],
                            Effect.createDamageEffect(DamageType.True, 110, [[StatType.AbilityPower, 0.5]])
                        )
                    ],
                    [
                        Effect.createDamageEffect(DamageType.Magic, 135, [[StatType.AbilityPower, 0.5]],
                            Effect.createDamageEffect(DamageType.True, 135, [[StatType.AbilityPower, 0.5]])
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
        Sylas: new Champion(
            "Sylas", 
            "https://wiki.leagueoflegends.com/en-us/images/Sylas_OriginalSquare.png", 
            [], 
            [
                [StatType.Health, 600],
                [StatType.HealthRegenPer5sec, 9],
                [StatType.Mana, 400],
                [StatType.ManaRegenPer5sec, 8],
                [StatType.Armor, 29],
                [StatType.MagicResistance, 32],
                [StatType.AttackDamageBase, 61]
            ], 
            [
                [StatType.Health, 122],
                [StatType.HealthRegenPer5sec, 0.9],
                [StatType.Mana, 70],
                [StatType.ManaRegenPer5sec, 0.8],
                [StatType.Armor, 5.2],
                [StatType.MagicResistance, 2.55],
                [StatType.AttackDamageBase, 3],
            ]
        ),
    } as const;
}

export class ItemSlotConfig {
    item: Item;
    rank: number;

    constructor(blueprint: ItemSlotConfig|null = null, newValues: Partial<ItemSlotConfig> = {}) {
        let oldValues 
        = blueprint instanceof ItemSlotConfig ? {
            item: blueprint.item,
            rank: blueprint.rank
        } : {
            item: Item.nothing,
            rank: 0
        };

        this.item = $state(newValues.item ?? oldValues.item);
        this.rank = $state(newValues.rank ?? oldValues.rank);
    }
}

export type ItemSlotConfigSet
= [ ItemSlotConfig, ItemSlotConfig, ItemSlotConfig, ItemSlotConfig, ItemSlotConfig, ItemSlotConfig ];

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

export class GameOrigin {constructor(
        public readonly build: BuildConfig,
        public readonly champBaseStats: DefiniteNumberMap<StatType>,
        public readonly targetBaseStats: DefiniteNumberMap<StatType>
    ) {
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
                new BuildConfig(),
                new DefiniteNumberMap<StatType>(),
                new DefiniteNumberMap<StatType>()
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
        DefiniteNumberMap.sumPerKey(this.origin.champBaseStats, this.champStatModifiers, this.origin.build.buildStats) : 
        blueprint.statsPostEval;
        
        if (newValues.champStatModifiers || !blueprint) {
            this.statsPostEval.set(StatType.AbilityPower, this.statsPostEval.get(StatType.AbilityPower) * (1 + this.statsPostEval.get(StatType.AbilityPowerAmpRatio)));
        }


        this.targetStatsPostEval 
        = newValues.targetStatModifiers || !blueprint ?
        DefiniteNumberMap.sumPerKey(this.origin.targetBaseStats, this.targetStatModifiers) :
        blueprint.targetStatsPostEval;
        
        if (newValues.targetStatModifiers || !blueprint) {
            this.targetStatsPostEval.set(StatType.AbilityPower, this.targetStatsPostEval.get(StatType.AbilityPower) * (1 + this.targetStatsPostEval.get(StatType.AbilityPowerAmpRatio)));
        }


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

    static processEffects(origin: GameOrigin, effectQueue: Effect[]) {
        let initialGameConfig = new GameConfig(null, {
            origin: origin
        });

        let gameConfig = initialGameConfig;
        
        effectQueue.forEach(effect => {
            gameConfig = effect.implement(gameConfig);
            effect.aftereffects.forEach(aftereffect => {
                gameConfig = aftereffect.implement(gameConfig);
            });
        });

        return {
            initialGameConfig: initialGameConfig, 
            endGameConfig: gameConfig
        };
    }
}

export class DiffMap extends DefiniteMap<BuildConfig,GameDiff> {
    static readonly zeroDiff: GameDiff = {
        builtInitialGameConfig: new GameConfig(),
        unbuiltEndGameConfig: new GameConfig(),
        builtEndGameConfig: new GameConfig(),
        costDiff: 0,
        damageDiff: 0,
        damage_perGold: 0,
        absoluteDamageDiff_perGold: 0,
        relativeDamageDiff_perGold: 0,
    }

    readonly min_damage_perGold: number;
    readonly min_absoluteDamageDiff_perGold: number;
    readonly min_relativeDamageDiff_perGold: number;
    
    constructor(entries: Iterable<readonly [BuildConfig, GameDiff]>) {
        super(DiffMap.zeroDiff, entries);
        
        let diffs = this.values().toArray();

        this.min_damage_perGold = DiffMap.#calculatePositiveMinOrZero(diffs.map(diff => diff.damage_perGold));
        this.min_absoluteDamageDiff_perGold = DiffMap.#calculatePositiveMinOrZero(diffs.map(diff => diff.absoluteDamageDiff_perGold));
        this.min_relativeDamageDiff_perGold = DiffMap.#calculatePositiveMinOrZero(diffs.map(diff => diff.relativeDamageDiff_perGold));
    }

    static #calculatePositiveMinOrZero(values: number[]) {
        let nonzeroValues = values.filter(value => value > 0);
        return nonzeroValues.length > 1 ? Math.min(...nonzeroValues) : nonzeroValues[0] ?? 0;
    }
}

export function CalculateBaseStats(champ: Champion, level: number): DefiniteNumberMap<StatType> {
    let champLevelUps = Math.max(0, level - 1);
    let growthCoeffecient = champLevelUps * (0.7025 + (0.0175 * champLevelUps));
    
    let growthStats 
    = new DefiniteNumberMap(champ.statGrowthCoefficients.entries().map(statType_statCoefficient => {
        let statType = statType_statCoefficient[0];
        let statCoefficient = statType_statCoefficient[1];
        
        return [statType, statCoefficient * growthCoeffecient]
    }));
    
    let champBaseStats 
    = DefiniteNumberMap.sumPerKey(new DefiniteNumberMap<StatType>([[StatType.ChampionLevelUps, champLevelUps]]), champ.baseStats, growthStats);

    return champBaseStats;
}

export class DiffAtlas extends DefiniteMap<Affector|null, DiffMap> {
    constructor(
        champ: Champion,
        abilityRanks: DefiniteNumberMap<Ability>,
        targetBaseStats: DefiniteNumberMap<StatType>,
        buildConfigs: BuildConfig[]
    ) {
        let champLevel = abilityRanks.values().reduce((a,b) => a+b, 0);
        let champBaseStats = CalculateBaseStats(champ, champLevel);
        
        let effectsPerAbility 
        = new DefiniteMap<Ability,Effect[]>([], champ.abilities.map(
            ability => [ability, ability.effectsPerRank[Math.max(0, abilityRanks.get(ability) - 1)]]
        ));

        let unbuiltOrigin = new GameOrigin(new BuildConfig(), champBaseStats, targetBaseStats);
        
        let affectorQueueDiffMap 
        = new DiffMap(buildConfigs.map(
            (buildConfig): [BuildConfig, GameDiff] => {

                let builtEffects 
                = buildConfig.affectorQueue.flatMap((affector): Effect[] => 
                    affector instanceof Ability ? effectsPerAbility.get(affector) : 
                    affector instanceof Item ? affector.effectsPerRank[buildConfig.itemSlots.find(itemConfig => itemConfig.item == affector)?.rank ?? 0] : 
                    affector.effectsPerRank[0]
                );

                let unbuiltEffects 
                = buildConfig.affectorQueue
                .filter(affector => !(affector instanceof Item))
                .flatMap(affector => 
                    affector instanceof Ability ? effectsPerAbility.get(affector) :
                    affector.effectsPerRank[0]
                );

                let builtGameConfigProcess = GameConfig.processEffects(new GameOrigin(buildConfig, champBaseStats, targetBaseStats), builtEffects);
                let unbuiltGameConfigProcess = GameConfig.processEffects(unbuiltOrigin, unbuiltEffects);
                
                return [buildConfig, DiffAtlas.calculateDiff(unbuiltGameConfigProcess.endGameConfig, builtGameConfigProcess.endGameConfig, builtGameConfigProcess.initialGameConfig)];
            }
        ));

        let entries 
        = champ.abilities.map((ability): [Ability, DiffMap] => {
            let abilityEffects = effectsPerAbility.get(ability);
            
            let diffMap = new DiffMap( 
                buildConfigs.map((buildConfig): [BuildConfig, GameDiff] => {
                    let endBuiltGameConfig = GameConfig.processEffects(new GameOrigin(buildConfig, champBaseStats, targetBaseStats), abilityEffects);
                    let endUnbuiltGameConfig = GameConfig.processEffects(unbuiltOrigin, abilityEffects);
                    
                    return [buildConfig, DiffAtlas.calculateDiff(endUnbuiltGameConfig.endGameConfig, endBuiltGameConfig.endGameConfig, endBuiltGameConfig.initialGameConfig)];
                })
            );

            return [ability, diffMap];
        });

        super(affectorQueueDiffMap, entries);
    }

    static calculateDiff(unbuiltEndGameConfig: GameConfig, builtEndGameConfig: GameConfig, builtInitialGameConfig: GameConfig) {
        let costBuilt       = builtEndGameConfig.origin.build.totalCost;
        let costUnbuilt     = unbuiltEndGameConfig.origin.build.totalCost;
        let costDiff        = costBuilt - costUnbuilt
        let damageBuilt     = builtEndGameConfig.damageAggregate;
        let damageUnbuilt   = unbuiltEndGameConfig.damageAggregate;
        let damageDiff      = damageBuilt - damageUnbuilt;
        
        return {
            builtInitialGameConfig,
            unbuiltEndGameConfig,
            builtEndGameConfig,
            costDiff,
            damageDiff,
            
            damage_perGold: damageBuilt / costBuilt,
            absoluteDamageDiff_perGold: damageDiff / costDiff,
            relativeDamageDiff_perGold: (damageBuilt - damageUnbuilt) / damageUnbuilt / costDiff
        };
    }
}

export type GameDiff = ReturnType<typeof DiffAtlas.calculateDiff>;

/**
export class RunesConfig implements Config {
    duplicate(): RunesConfig {}
}
/**/