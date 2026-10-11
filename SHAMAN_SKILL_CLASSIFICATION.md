# Shaman skill classification

Mandatory behavior taxonomy: `ACTIVE_CAST`, `ACTIVE_INSTANT`, `ACTIVE_CHANNEL`, `PASSIVE_STAT`, `PASSIVE_TRIGGER`, `PASSIVE_AURA`, `TOGGLE_BUFF`.

Audit covers all **370** source entries. Machine-readable source excerpts, exact line numbers and provisional suggestions: [classification.json](docs/design/skill-system/classification.json). Rebuild with `node tools/skills/audit-skills.mjs`. Unknown behavior is explicitly unresolved, never defaulted to a cast. Non-Medium suggestions require design review before generation or runtime migration. Source kind and formulas remain unchanged; explicit toggle descriptions can supersede the source label for a proposed behavior.

Medium: four ACTIVE_CAST, Ghost Sight ACTIVE_INSTANT, all five passives PASSIVE_STAT. Conditional weapon/race stat modifiers are still stat modifiers, not activation animations. Meditation is out-of-combat regeneration, not a timed aura. Sacred Aura/Crimson Aura naming alone does not justify aura art. Chilling Aura and Death Aura are candidate spatial auras; prototype appearance does not approve their gameplay.

| Source line | Class | Skill | Behavior suggestion | Review |
|---|---|---|---|---|
| 5 | Medium | Spirit Bolt | ACTIVE_CAST | source-backed |
| 11 | Medium | Soul Heal | ACTIVE_CAST | source-backed |
| 16 | Medium | Amulet Blast | ACTIVE_CAST | source-backed |
| 21 | Medium | Ghost Sight | ACTIVE_INSTANT | source-backed |
| 26 | Medium | Binding Thread | ACTIVE_CAST | source-backed |
| 31 | Medium | Spirit Sense | PASSIVE_STAT | source-backed |
| 35 | Medium | Amulet Mastery | PASSIVE_STAT | source-backed |
| 39 | Medium | Meditation | PASSIVE_STAT | source-backed |
| 43 | Medium | Vessel Body | PASSIVE_STAT | source-backed |
| 47 | Medium | Soul Resonance | PASSIVE_STAT | source-backed |
| 58 | 🟢 สาย A: Achan Saiyasat (อาจารย์ไสยเวท) | Summon Hun Phayon | ACTIVE_CAST | needs-design-review |
| 64 | 🟢 สาย A: Achan Saiyasat (อาจารย์ไสยเวท) | Sacred Thread Barrier | ACTIVE_CAST | needs-design-review |
| 69 | 🟢 สาย A: Achan Saiyasat (อาจารย์ไสยเวท) | Curse Breaking | ACTIVE_CAST | needs-design-review |
| 74 | 🟢 สาย A: Achan Saiyasat (อาจารย์ไสยเวท) | Phayon Repair | ACTIVE_CAST | needs-design-review |
| 79 | 🟢 สาย A: Achan Saiyasat (อาจารย์ไสยเวท) | Achan’s Command | ACTIVE_INSTANT | needs-design-review |
| 84 | 🟢 สาย A: Achan Saiyasat (อาจารย์ไสยเวท) | Phayon Durability | PASSIVE_STAT | needs-design-review |
| 88 | 🟢 สาย A: Achan Saiyasat (อาจารย์ไสยเวท) | Sacred Aura | PASSIVE_STAT | needs-design-review |
| 92 | 🟢 สาย A: Achan Saiyasat (อาจารย์ไสยเวท) | Guardian Link | PASSIVE_STAT | needs-design-review |
| 96 | 🟢 สาย A: Achan Saiyasat (อาจารย์ไสยเวท) | Ward Mastery | PASSIVE_STAT | needs-design-review |
| 100 | 🟢 สาย A: Achan Saiyasat (อาจารย์ไสยเวท) | Iron Shield Incantation | PASSIVE_STAT | needs-design-review |
| 106 | Grand Necromancer | Giant Phayon Colossus | ACTIVE_CAST | needs-design-review |
| 111 | Grand Necromancer | Fortress of Sacred Thread | ACTIVE_CAST | needs-design-review |
| 116 | Grand Necromancer | Underworld Soul Pull | ACTIVE_CAST | needs-design-review |
| 121 | Grand Necromancer | Colossus Resonance | PASSIVE_STAT | needs-design-review |
| 125 | Grand Necromancer | Transcendent Medium | PASSIVE_STAT | needs-design-review |
| 134 | 🔴 สาย B: Mor Phhee (หมอผีสายพราย) | Ghost Possession | ACTIVE_INSTANT | needs-design-review |
| 139 | 🔴 สาย B: Mor Phhee (หมอผีสายพราย) | Prai Whispering Curse | ACTIVE_CAST | needs-design-review |
| 144 | 🔴 สาย B: Mor Phhee (หมอผีสายพราย) | Soul Drain | ACTIVE_CAST | needs-design-review |
| 150 | 🔴 สาย B: Mor Phhee (หมอผีสายพราย) | Terrorize Howl | ACTIVE_CAST | needs-design-review |
| 155 | 🔴 สาย B: Mor Phhee (หมอผีสายพราย) | Shadow Snare | ACTIVE_INSTANT | needs-design-review |
| 160 | 🔴 สาย B: Mor Phhee (หมอผีสายพราย) | Dark Affinity | PASSIVE_STAT | needs-design-review |
| 164 | 🔴 สาย B: Mor Phhee (หมอผีสายพราย) | Vampiric Instinct | PASSIVE_STAT | needs-design-review |
| 168 | 🔴 สาย B: Mor Phhee (หมอผีสายพราย) | Soul Harvest | PASSIVE_STAT | needs-design-review |
| 172 | 🔴 สาย B: Mor Phhee (หมอผีสายพราย) | Agile Spirit | PASSIVE_STAT | needs-design-review |
| 176 | 🔴 สาย B: Mor Phhee (หมอผีสายพราย) | Blood Oil Coating | PASSIVE_TRIGGER | needs-design-review |
| 182 | Prai Phhee Lord | Prai Curse Explosion | ACTIVE_CAST | needs-design-review |
| 188 | Prai Phhee Lord | Shadow Ghost Avatar | ACTIVE_INSTANT | needs-design-review |
| 193 | Prai Phhee Lord | Mass Fear | ACTIVE_CAST | needs-design-review |
| 198 | Prai Phhee Lord | Soul Harvester | PASSIVE_TRIGGER | needs-design-review |
| 202 | Prai Phhee Lord | Absolute Soul Defense | PASSIVE_TRIGGER | needs-design-review |
| 213 | 🟢 สาย A: Maoshan Exorcist (นักพรตเหมาซาน) | Control Paper Talisman | ACTIVE_CAST | needs-design-review |
| 219 | 🟢 สาย A: Maoshan Exorcist (นักพรตเหมาซาน) | Jiangshi Summon | ACTIVE_CAST | needs-design-review |
| 224 | 🟢 สาย A: Maoshan Exorcist (นักพรตเหมาซาน) | Underworld Seal | ACTIVE_CAST | needs-design-review |
| 229 | 🟢 สาย A: Maoshan Exorcist (นักพรตเหมาซาน) | Corpse Explosion | ACTIVE_INSTANT | needs-design-review |
| 234 | 🟢 สาย A: Maoshan Exorcist (นักพรตเหมาซาน) | Talisman Trap | ACTIVE_CAST | needs-design-review |
| 239 | 🟢 สาย A: Maoshan Exorcist (นักพรตเหมาซาน) | Talisman Mastery | PASSIVE_STAT | needs-design-review |
| 243 | 🟢 สาย A: Maoshan Exorcist (นักพรตเหมาซาน) | Corpse Control | PASSIVE_STAT | needs-design-review |
| 247 | 🟢 สาย A: Maoshan Exorcist (นักพรตเหมาซาน) | Exorcist Body | PASSIVE_STAT | needs-design-review |
| 251 | 🟢 สาย A: Maoshan Exorcist (นักพรตเหมาซาน) | Yin Yang Balance | PASSIVE_TRIGGER | needs-design-review |
| 255 | 🟢 สาย A: Maoshan Exorcist (นักพรตเหมาซาน) | Dead Weight | PASSIVE_STAT | needs-design-review |
| 261 | Netherworld Sovereign | Jiangshi Army | ACTIVE_CAST | needs-design-review |
| 266 | Netherworld Sovereign | Underworld Gate | ACTIVE_CAST | needs-design-review |
| 271 | Netherworld Sovereign | Soul Sealing Array | ACTIVE_CAST | needs-design-review |
| 276 | Netherworld Sovereign | Necrotic Mastery | PASSIVE_STAT | needs-design-review |
| 280 | Netherworld Sovereign | Sovereign’s Will | PASSIVE_STAT | needs-design-review |
| 289 | 🔴 สาย B: Daoist Immortal (เซียนเต๋า) | Flying Sword | ACTIVE_CAST | needs-design-review |
| 294 | 🔴 สาย B: Daoist Immortal (เซียนเต๋า) | Lightning Talisman | ACTIVE_CAST | needs-design-review |
| 300 | 🔴 สาย B: Daoist Immortal (เซียนเต๋า) | Taoist Chi Barrier | ACTIVE_CAST | needs-design-review |
| 305 | 🔴 สาย B: Daoist Immortal (เซียนเต๋า) | Fire Trigram | ACTIVE_INSTANT | needs-design-review |
| 310 | 🔴 สาย B: Daoist Immortal (เซียนเต๋า) | Wind Steps | ACTIVE_INSTANT | needs-design-review |
| 315 | 🔴 สาย B: Daoist Immortal (เซียนเต๋า) | Sword Ki | PASSIVE_TRIGGER | needs-design-review |
| 319 | 🔴 สาย B: Daoist Immortal (เซียนเต๋า) | Elemental Chi | PASSIVE_STAT | needs-design-review |
| 323 | 🔴 สาย B: Daoist Immortal (เซียนเต๋า) | Immortal Focus | PASSIVE_TRIGGER | needs-design-review |
| 327 | 🔴 สาย B: Daoist Immortal (เซียนเต๋า) | Inner Peace | PASSIVE_STAT | needs-design-review |
| 331 | 🔴 สาย B: Daoist Immortal (เซียนเต๋า) | Chi Flow | PASSIVE_STAT | needs-design-review |
| 337 | Celestial Immortal | Sword Rain Array | ACTIVE_CAST | needs-design-review |
| 342 | Celestial Immortal | Ascension State | ACTIVE_CAST | needs-design-review |
| 347 | Celestial Immortal | Heavenly Strike | ACTIVE_CAST | needs-design-review |
| 352 | Celestial Immortal | Infinite Chi | PASSIVE_STAT | needs-design-review |
| 356 | Celestial Immortal | Sword Master | PASSIVE_TRIGGER | needs-design-review |
| 369 | 🟢 สาย A: Onmyoji Master (อองเมียวจิ) | Summon Shikigami: Fox | ACTIVE_CAST | needs-design-review |
| 375 | 🟢 สาย A: Onmyoji Master (อองเมียวจิ) | Boundary Ward | ACTIVE_CAST | needs-design-review |
| 380 | 🟢 สาย A: Onmyoji Master (อองเมียวจิ) | Binding Paper | ACTIVE_CAST | needs-design-review |
| 385 | 🟢 สาย A: Onmyoji Master (อองเมียวจิ) | Spirit Swallow | ACTIVE_CAST | needs-design-review |
| 391 | 🟢 สาย A: Onmyoji Master (อองเมียวจิ) | Yin Yang Shift | ACTIVE_INSTANT | needs-design-review |
| 396 | 🟢 สาย A: Onmyoji Master (อองเมียวจิ) | Spirit Link | PASSIVE_STAT | needs-design-review |
| 400 | 🟢 สาย A: Onmyoji Master (อองเมียวจิ) | Origami Craft | PASSIVE_STAT | needs-design-review |
| 404 | 🟢 สาย A: Onmyoji Master (อองเมียวจิ) | Ward Mastery | PASSIVE_STAT | needs-design-review |
| 408 | 🟢 สาย A: Onmyoji Master (อองเมียวจิ) | Demon Bane | PASSIVE_STAT | needs-design-review |
| 412 | 🟢 สาย A: Onmyoji Master (อองเมียวจิ) | Shikigami Armor | PASSIVE_STAT | needs-design-review |
| 418 | Grand Onmyoji Master | Four Divine Beasts Summons | ACTIVE_CAST | needs-design-review |
| 423 | Grand Onmyoji Master | Absolute Mandala Barrier | ACTIVE_CAST | needs-design-review |
| 428 | Grand Onmyoji Master | Kikyo Seal | ACTIVE_CAST | needs-design-review |
| 433 | Grand Onmyoji Master | Mandala Resonance | PASSIVE_STAT | needs-design-review |
| 437 | Grand Onmyoji Master | Grand Master | PASSIVE_STAT | needs-design-review |
| 448 | 🔴 สาย B: Miko / Shinto Priest (มิโกะ / นักบวชชินโต) | Kagura Purification Dance | ACTIVE_CAST | needs-design-review |
| 454 | 🔴 สาย B: Miko / Shinto Priest (มิโกะ / นักบวชชินโต) | Shinto Bell Blessing | ACTIVE_INSTANT | needs-design-review |
| 459 | 🔴 สาย B: Miko / Shinto Priest (มิโกะ / นักบวชชินโต) | Divine Light Heal | ACTIVE_CAST | needs-design-review |
| 464 | 🔴 สาย B: Miko / Shinto Priest (มิโกะ / นักบวชชินโต) | Evil Warding Arrow | ACTIVE_CAST | needs-design-review |
| 469 | 🔴 สาย B: Miko / Shinto Priest (มิโกะ / นักบวชชินโต) | Cleansing Rain | ACTIVE_CAST | needs-design-review |
| 474 | 🔴 สาย B: Miko / Shinto Priest (มิโกะ / นักบวชชินโต) | Holy Ward | PASSIVE_STAT | needs-design-review |
| 478 | 🔴 สาย B: Miko / Shinto Priest (มิโกะ / นักบวชชินโต) | Priestess Grace | PASSIVE_STAT | needs-design-review |
| 482 | 🔴 สาย B: Miko / Shinto Priest (มิโกะ / นักบวชชินโต) | Divine Protection | PASSIVE_TRIGGER | needs-design-review |
| 486 | 🔴 สาย B: Miko / Shinto Priest (มิโกะ / นักบวชชินโต) | Purify | PASSIVE_AURA | needs-design-review |
| 490 | 🔴 สาย B: Miko / Shinto Priest (มิโกะ / นักบวชชินโต) | Sacred Steps | PASSIVE_STAT | needs-design-review |
| 496 | High Oracle Priestess | Divine Miracle Resurrection | ACTIVE_CAST | needs-design-review |
| 501 | High Oracle Priestess | Kotodama Sacred Song | ACTIVE_CAST | needs-design-review |
| 506 | High Oracle Priestess | Amaterasu's Light | ACTIVE_CAST | needs-design-review |
| 511 | High Oracle Priestess | Divine Grace | PASSIVE_TRIGGER | needs-design-review |
| 515 | High Oracle Priestess | Oracle’s Vision | PASSIVE_TRIGGER | needs-design-review |
| 526 | 🟢 สาย A: Gut Shaman (มูดัง - คนทรงเจ้า) | Divine Possession | ACTIVE_INSTANT | needs-design-review |
| 531 | 🟢 สาย A: Gut Shaman (มูดัง - คนทรงเจ้า) | Gut Blessing | ACTIVE_CHANNEL | needs-design-review |
| 537 | 🟢 สาย A: Gut Shaman (มูดัง - คนทรงเจ้า) | Spirit Ward | ACTIVE_CAST | needs-design-review |
| 542 | 🟢 สาย A: Gut Shaman (มูดัง - คนทรงเจ้า) | Trance Dance | ACTIVE_INSTANT | needs-design-review |
| 547 | 🟢 สาย A: Gut Shaman (มูดัง - คนทรงเจ้า) | Ancestral Buff | ACTIVE_CAST | needs-design-review |
| 552 | 🟢 สาย A: Gut Shaman (มูดัง - คนทรงเจ้า) | Rhythm Mastery | PASSIVE_STAT | needs-design-review |
| 556 | 🟢 สาย A: Gut Shaman (มูดัง - คนทรงเจ้า) | Iron Trance | PASSIVE_TRIGGER | needs-design-review |
| 560 | 🟢 สาย A: Gut Shaman (มูดัง - คนทรงเจ้า) | Spiritual Echo | PASSIVE_TRIGGER | needs-design-review |
| 564 | 🟢 สาย A: Gut Shaman (มูดัง - คนทรงเจ้า) | Shamanic Vigor | PASSIVE_STAT | needs-design-review |
| 568 | 🟢 สาย A: Gut Shaman (มูดัง - คนทรงเจ้า) | Drummer's Focus | PASSIVE_STAT | needs-design-review |
| 574 | Mudang Patriarch | Godly Incarnation | ACTIVE_CAST | needs-design-review |
| 579 | Mudang Patriarch | Divine Blessing Field | ACTIVE_CAST | needs-design-review |
| 584 | Mudang Patriarch | Heavenly Strike | ACTIVE_INSTANT | needs-design-review |
| 589 | Mudang Patriarch | Aura Resonance | PASSIVE_AURA | needs-design-review |
| 593 | Mudang Patriarch | Patriarch’s Will | PASSIVE_STAT | needs-design-review |
| 604 | 🔴 สาย B: Jeoseung Saja (ยมทูต) | Soul Harvest | ACTIVE_INSTANT | needs-design-review |
| 610 | 🔴 สาย B: Jeoseung Saja (ยมทูต) | Chain Scythe | ACTIVE_CAST | needs-design-review |
| 615 | 🔴 สาย B: Jeoseung Saja (ยมทูต) | Shadow Step | ACTIVE_INSTANT | needs-design-review |
| 620 | 🔴 สาย B: Jeoseung Saja (ยมทูต) | Death Spin | ACTIVE_INSTANT | needs-design-review |
| 625 | 🔴 สาย B: Jeoseung Saja (ยมทูต) | Soul Shackles | ACTIVE_CAST | needs-design-review |
| 630 | 🔴 สาย B: Jeoseung Saja (ยมทูต) | Death Mark | PASSIVE_TRIGGER | needs-design-review |
| 634 | 🔴 สาย B: Jeoseung Saja (ยมทูต) | Grim Reaper | PASSIVE_TRIGGER | needs-design-review |
| 638 | 🔴 สาย B: Jeoseung Saja (ยมทูต) | Shadow Evasion | PASSIVE_STAT | needs-design-review |
| 642 | 🔴 สาย B: Jeoseung Saja (ยมทูต) | Soul Collector | PASSIVE_STAT | needs-design-review |
| 646 | 🔴 สาย B: Jeoseung Saja (ยมทูต) | Dark Blade | PASSIVE_STAT | needs-design-review |
| 652 | Reaper of the Abyss | Soul Execute | ACTIVE_INSTANT | needs-design-review |
| 657 | Reaper of the Abyss | Abyss Rift | ACTIVE_CAST | needs-design-review |
| 662 | Reaper of the Abyss | Reaper’s Domain | ACTIVE_CAST | needs-design-review |
| 667 | Reaper of the Abyss | Death Scythe Mastery | PASSIVE_STAT | needs-design-review |
| 671 | Reaper of the Abyss | Abyssal Form | PASSIVE_STAT | needs-design-review |
| 684 | 🟢 สาย A: Santet Master (จอมมนต์ดำซันเตท) | Black Magic Dart | ACTIVE_CAST | needs-design-review |
| 690 | 🟢 สาย A: Santet Master (จอมมนต์ดำซันเตท) | Curse of Agony | ACTIVE_CAST | needs-design-review |
| 695 | 🟢 สาย A: Santet Master (จอมมนต์ดำซันเตท) | Soul Pluck | ACTIVE_CAST | needs-design-review |
| 701 | 🟢 สาย A: Santet Master (จอมมนต์ดำซันเตท) | Poison Cloud | ACTIVE_CAST | needs-design-review |
| 706 | 🟢 สาย A: Santet Master (จอมมนต์ดำซันเตท) | Voodoo Link | ACTIVE_CAST | needs-design-review |
| 711 | 🟢 สาย A: Santet Master (จอมมนต์ดำซันเตท) | Dark Aura | PASSIVE_STAT | needs-design-review |
| 715 | 🟢 สาย A: Santet Master (จอมมนต์ดำซันเตท) | Santet Reach | PASSIVE_STAT | needs-design-review |
| 719 | 🟢 สาย A: Santet Master (จอมมนต์ดำซันเตท) | Hex Amplify | PASSIVE_STAT | needs-design-review |
| 723 | 🟢 สาย A: Santet Master (จอมมนต์ดำซันเตท) | Malice | PASSIVE_TRIGGER | needs-design-review |
| 727 | 🟢 สาย A: Santet Master (จอมมนต์ดำซันเตท) | Shadow Ward | PASSIVE_STAT | needs-design-review |
| 733 | Santet Overlord | Curse of the Archipelago | ACTIVE_CAST | needs-design-review |
| 738 | Santet Overlord | Mass Decay | ACTIVE_CAST | needs-design-review |
| 743 | Santet Overlord | Heart Stop | ACTIVE_INSTANT | needs-design-review |
| 748 | Santet Overlord | Overlord’s Curse | PASSIVE_STAT | needs-design-review |
| 752 | Santet Overlord | Endless Agony | PASSIVE_TRIGGER | needs-design-review |
| 763 | 🔴 สาย B: Keris Master (นักรบกริช) | Poison Blade | ACTIVE_INSTANT | needs-design-review |
| 768 | 🔴 สาย B: Keris Master (นักรบกริช) | Keris Thrust | ACTIVE_INSTANT | needs-design-review |
| 774 | 🔴 สาย B: Keris Master (นักรบกริช) | Shadow Stealth | ACTIVE_INSTANT | needs-design-review |
| 779 | 🔴 สาย B: Keris Master (นักรบกริช) | Venom Spit | ACTIVE_INSTANT | needs-design-review |
| 784 | 🔴 สาย B: Keris Master (นักรบกริช) | Assassinate | ACTIVE_INSTANT | needs-design-review |
| 789 | 🔴 สาย B: Keris Master (นักรบกริช) | Venom Mastery | PASSIVE_STAT | needs-design-review |
| 793 | 🔴 สาย B: Keris Master (นักรบกริช) | Keris Mastery | PASSIVE_STAT | needs-design-review |
| 797 | 🔴 สาย B: Keris Master (นักรบกริช) | Silent Step | PASSIVE_TRIGGER | needs-design-review |
| 801 | 🔴 สาย B: Keris Master (นักรบกริช) | Toxic Blood | PASSIVE_TRIGGER | needs-design-review |
| 805 | 🔴 สาย B: Keris Master (นักรบกริช) | Backstab Expert | PASSIVE_TRIGGER | needs-design-review |
| 811 | Keris Shadow Blade | Shadow Flash Strike | ACTIVE_INSTANT | needs-design-review |
| 817 | Keris Shadow Blade | Fatal Assassination | ACTIVE_CAST | needs-design-review |
| 823 | Keris Shadow Blade | Shadow Clone | ACTIVE_CAST | needs-design-review |
| 828 | Keris Shadow Blade | Shadow Master | PASSIVE_TRIGGER | needs-design-review |
| 832 | Keris Shadow Blade | Venomous Overdrive | PASSIVE_TRIGGER | needs-design-review |
| 845 | 🟢 สาย A: Mystic Merchant (บาบายลัน - สายการค้าและสนับสนุน) | Charm Crafting | ACTIVE_CAST | needs-design-review |
| 850 | 🟢 สาย A: Mystic Merchant (บาบายลัน - สายการค้าและสนับสนุน) | Divine Divination | ACTIVE_CAST | needs-design-review |
| 859 | 🟢 สาย A: Mystic Merchant (บาบายลัน - สายการค้าและสนับสนุน) | Voodoo Merchant Shop | ACTIVE_INSTANT | needs-design-review |
| 864 | 🟢 สาย A: Mystic Merchant (บาบายลัน - สายการค้าและสนับสนุน) | Coin Toss (Mammonite) | ACTIVE_INSTANT | needs-design-review |
| 870 | 🟢 สาย A: Mystic Merchant (บาบายลัน - สายการค้าและสนับสนุน) | Identify | ACTIVE_CAST | needs-design-review |
| 875 | 🟢 สาย A: Mystic Merchant (บาบายลัน - สายการค้าและสนับสนุน) | Bargain Blessing | PASSIVE_STAT | needs-design-review |
| 879 | 🟢 สาย A: Mystic Merchant (บาบายลัน - สายการค้าและสนับสนุน) | Weight Training | PASSIVE_STAT | needs-design-review |
| 883 | 🟢 สาย A: Mystic Merchant (บาบายลัน - สายการค้าและสนับสนุน) | Lucky Coin | PASSIVE_TRIGGER | needs-design-review |
| 887 | 🟢 สาย A: Mystic Merchant (บาบายลัน - สายการค้าและสนับสนุน) | Pushcart | PASSIVE_STAT | needs-design-review |
| 891 | 🟢 สาย A: Mystic Merchant (บาบายลัน - สายการค้าและสนับสนุน) | Merchant's Eye | PASSIVE_STAT | needs-design-review |
| 897 | High Mystic Merchant Lord | Fortune’s Favor | ACTIVE_CAST | needs-design-review |
| 902 | High Mystic Merchant Lord | Global Auction Network | ACTIVE_INSTANT | needs-design-review |
| 907 | High Mystic Merchant Lord | Make it Rain | ACTIVE_CAST | needs-design-review |
| 913 | High Mystic Merchant Lord | Merchant King | PASSIVE_STAT | needs-design-review |
| 917 | High Mystic Merchant Lord | Golden Rule | PASSIVE_STAT | needs-design-review |
| 928 | 🔴 สาย B: Mangkukulam (มังกูกูลัม) | Voodoo Doll Hex | ACTIVE_CAST | needs-design-review |
| 934 | 🔴 สาย B: Mangkukulam (มังกูกูลัม) | Mind Confusion | ACTIVE_CAST | needs-design-review |
| 939 | 🔴 สาย B: Mangkukulam (มังกูกูลัม) | Doll Substitution | ACTIVE_CAST | needs-design-review |
| 944 | 🔴 สาย B: Mangkukulam (มังกูกูลัม) | Leech Seed | ACTIVE_CAST | needs-design-review |
| 949 | 🔴 สาย B: Mangkukulam (มังกูกูลัม) | Puppet Dance | ACTIVE_CAST | needs-design-review |
| 954 | 🔴 สาย B: Mangkukulam (มังกูกูลัม) | Psych Ward | PASSIVE_STAT | needs-design-review |
| 958 | 🔴 สาย B: Mangkukulam (มังกูกูลัม) | Doll Mastery | PASSIVE_STAT | needs-design-review |
| 962 | 🔴 สาย B: Mangkukulam (มังกูกูลัม) | Hex Extension | PASSIVE_STAT | needs-design-review |
| 966 | 🔴 สาย B: Mangkukulam (มังกูกูลัม) | Mental Fortitude | PASSIVE_STAT | needs-design-review |
| 970 | 🔴 สาย B: Mangkukulam (มังกูกูลัม) | Vengeful Spirit | PASSIVE_STAT | needs-design-review |
| 976 | Grand Illusionist & Puppet Master | Mind Control | ACTIVE_CAST | needs-design-review |
| 981 | Grand Illusionist & Puppet Master | Mass Hallucination | ACTIVE_CAST | needs-design-review |
| 986 | Grand Illusionist & Puppet Master | Brain Wash | ACTIVE_CAST | needs-design-review |
| 991 | Grand Illusionist & Puppet Master | Puppet Domain | PASSIVE_STAT | needs-design-review |
| 995 | Grand Illusionist & Puppet Master | Illusionist Escape | PASSIVE_STAT | needs-design-review |
| 1008 | 🟢 สาย A: Rune Seer (แม่มดรูน) | Blizzard Storm | ACTIVE_CAST | needs-design-review |
| 1014 | 🟢 สาย A: Rune Seer (แม่มดรูน) | Rune Trap | ACTIVE_CAST | needs-design-review |
| 1019 | 🟢 สาย A: Rune Seer (แม่มดรูน) | Prophecy | ACTIVE_CAST | needs-design-review |
| 1024 | 🟢 สาย A: Rune Seer (แม่มดรูน) | Frost Bolt | ACTIVE_CAST | needs-design-review |
| 1030 | 🟢 สาย A: Rune Seer (แม่มดรูน) | Ice Wall | ACTIVE_CAST | needs-design-review |
| 1035 | 🟢 สาย A: Rune Seer (แม่มดรูน) | Frost Mastery | PASSIVE_STAT | needs-design-review |
| 1039 | 🟢 สาย A: Rune Seer (แม่มดรูน) | Rune Reading | PASSIVE_STAT | needs-design-review |
| 1043 | 🟢 สาย A: Rune Seer (แม่มดรูน) | Chilling Aura | PASSIVE_AURA | needs-design-review |
| 1047 | 🟢 สาย A: Rune Seer (แม่มดรูน) | Winter's Grasp | PASSIVE_STAT | needs-design-review |
| 1051 | 🟢 สาย A: Rune Seer (แม่มดรูน) | Cold Blood | PASSIVE_STAT | needs-design-review |
| 1057 | Frost Rune Archmage | Fimbulwinter | ACTIVE_CAST | needs-design-review |
| 1063 | Frost Rune Archmage | Absolute Zero Field | ACTIVE_CAST | needs-design-review |
| 1068 | Frost Rune Archmage | Shatter Rune | ACTIVE_INSTANT | needs-design-review |
| 1074 | Frost Rune Archmage | Rune Mastery | PASSIVE_STAT | needs-design-review |
| 1078 | Frost Rune Archmage | Frost Penetration | PASSIVE_STAT | needs-design-review |
| 1089 | 🔴 สาย B: Seidr Witch (แม่มดเซดร์) | Seidr Vision | ACTIVE_INSTANT | needs-design-review |
| 1094 | 🔴 สาย B: Seidr Witch (แม่มดเซดร์) | Wind Agility | ACTIVE_CAST | needs-design-review |
| 1099 | 🔴 สาย B: Seidr Witch (แม่มดเซดร์) | Fate Shield | ACTIVE_CAST | needs-design-review |
| 1104 | 🔴 สาย B: Seidr Witch (แม่มดเซดร์) | Mist Cover | ACTIVE_CAST | needs-design-review |
| 1109 | 🔴 สาย B: Seidr Witch (แม่มดเซดร์) | Thread of Life | ACTIVE_CAST | needs-design-review |
| 1114 | 🔴 สาย B: Seidr Witch (แม่มดเซดร์) | Mist Veil | PASSIVE_TRIGGER | needs-design-review |
| 1118 | 🔴 สาย B: Seidr Witch (แม่มดเซดร์) | Destiny Weaver | PASSIVE_STAT | needs-design-review |
| 1122 | 🔴 สาย B: Seidr Witch (แม่มดเซดร์) | Fate's Fortune | PASSIVE_TRIGGER | needs-design-review |
| 1126 | 🔴 สาย B: Seidr Witch (แม่มดเซดร์) | Wind Walker | PASSIVE_STAT | needs-design-review |
| 1130 | 🔴 สาย B: Seidr Witch (แม่มดเซดร์) | Seer's Mind | PASSIVE_STAT | needs-design-review |
| 1136 | Seer of Destiny | Fate Reversal | ACTIVE_INSTANT | needs-design-review |
| 1141 | Seer of Destiny | Time Echo | ACTIVE_CAST | needs-design-review |
| 1146 | Seer of Destiny | Destiny Weave | ACTIVE_INSTANT | needs-design-review |
| 1151 | Seer of Destiny | Destiny Mastery | PASSIVE_STAT | needs-design-review |
| 1155 | Seer of Destiny | Oracle’s Grace | PASSIVE_TRIGGER | needs-design-review |
| 1168 | 🟢 สาย A: Arch Druid (อาร์ชดรูอิด) | Nature Healing | ACTIVE_CAST | needs-design-review |
| 1173 | 🟢 สาย A: Arch Druid (อาร์ชดรูอิด) | Root Bind | ACTIVE_CAST | needs-design-review |
| 1178 | 🟢 สาย A: Arch Druid (อาร์ชดรูอิด) | Thorn Shield | ACTIVE_CAST | needs-design-review |
| 1183 | 🟢 สาย A: Arch Druid (อาร์ชดรูอิด) | Cure Poison | ACTIVE_CAST | needs-design-review |
| 1188 | 🟢 สาย A: Arch Druid (อาร์ชดรูอิด) | Fairy Light | ACTIVE_CAST | needs-design-review |
| 1193 | 🟢 สาย A: Arch Druid (อาร์ชดรูอิด) | Rejuvenation | PASSIVE_TRIGGER | needs-design-review |
| 1197 | 🟢 สาย A: Arch Druid (อาร์ชดรูอิด) | Nature's Blessing | PASSIVE_STAT | needs-design-review |
| 1201 | 🟢 สาย A: Arch Druid (อาร์ชดรูอิด) | Earth Connection | PASSIVE_STAT | needs-design-review |
| 1205 | 🟢 สาย A: Arch Druid (อาร์ชดรูอิด) | Staff Mastery | PASSIVE_STAT | needs-design-review |
| 1209 | 🟢 สาย A: Arch Druid (อาร์ชดรูอิด) | Thorn Mastery | PASSIVE_STAT | needs-design-review |
| 1215 | Archdruid of the Elder Forest | World Tree Blessing | ACTIVE_CAST | needs-design-review |
| 1220 | Archdruid of the Elder Forest | Mass Resurrection | ACTIVE_CAST | needs-design-review |
| 1225 | Archdruid of the Elder Forest | Forest Wrath | ACTIVE_CAST | needs-design-review |
| 1230 | Archdruid of the Elder Forest | Nature's Embrace | PASSIVE_STAT | needs-design-review |
| 1234 | Archdruid of the Elder Forest | Elder Wisdom | PASSIVE_STAT | needs-design-review |
| 1245 | 🔴 สาย B: Wild Shape Warden (ดรูอิดแปลงร่าง) | Shape: Bear | TOGGLE_BUFF | needs-design-review |
| 1250 | 🔴 สาย B: Wild Shape Warden (ดรูอิดแปลงร่าง) | Shape: Eagle | ACTIVE_CAST | needs-design-review |
| 1255 | 🔴 สาย B: Wild Shape Warden (ดรูอิดแปลงร่าง) | Primal Roar | ACTIVE_INSTANT | needs-design-review |
| 1260 | 🔴 สาย B: Wild Shape Warden (ดรูอิดแปลงร่าง) | Claw Swipe | ACTIVE_INSTANT | needs-design-review |
| 1265 | 🔴 สาย B: Wild Shape Warden (ดรูอิดแปลงร่าง) | Feral Charge | ACTIVE_INSTANT | needs-design-review |
| 1270 | 🔴 สาย B: Wild Shape Warden (ดรูอิดแปลงร่าง) | Thick Hide | PASSIVE_STAT | needs-design-review |
| 1274 | 🔴 สาย B: Wild Shape Warden (ดรูอิดแปลงร่าง) | Beast Form Mastery | PASSIVE_STAT | needs-design-review |
| 1278 | 🔴 สาย B: Wild Shape Warden (ดรูอิดแปลงร่าง) | Animal Instinct | PASSIVE_STAT | needs-design-review |
| 1282 | 🔴 สาย B: Wild Shape Warden (ดรูอิดแปลงร่าง) | Savage Strike | PASSIVE_TRIGGER | needs-design-review |
| 1286 | 🔴 สาย B: Wild Shape Warden (ดรูอิดแปลงร่าง) | Natural Regeneration | PASSIVE_TRIGGER | needs-design-review |
| 1292 | Wild Alpha Beast King | Primal Rage | ACTIVE_INSTANT | needs-design-review |
| 1297 | Wild Alpha Beast King | Colossal Slam | ACTIVE_CAST | needs-design-review |
| 1302 | Wild Alpha Beast King | Alpha Howl | ACTIVE_CAST | needs-design-review |
| 1307 | Wild Alpha Beast King | Beast King Mastery | PASSIVE_TRIGGER | needs-design-review |
| 1311 | Wild Alpha Beast King | Apex Predator | PASSIVE_STAT | needs-design-review |
| 1324 | 🟢 สาย A: Juggernaut Volkhv (โวล์ฟ - นักเวทสลาฟสายประจันบาน) | Wolf Spirit Armor | ACTIVE_INSTANT | needs-design-review |
| 1329 | 🟢 สาย A: Juggernaut Volkhv (โวล์ฟ - นักเวทสลาฟสายประจันบาน) | Taunting Howl | ACTIVE_INSTANT | needs-design-review |
| 1334 | 🟢 สาย A: Juggernaut Volkhv (โวล์ฟ - นักเวทสลาฟสายประจันบาน) | Siberian Frost Step | ACTIVE_CAST | needs-design-review |
| 1340 | 🟢 สาย A: Juggernaut Volkhv (โวล์ฟ - นักเวทสลาฟสายประจันบาน) | Shield Bash | ACTIVE_INSTANT | needs-design-review |
| 1346 | 🟢 สาย A: Juggernaut Volkhv (โวล์ฟ - นักเวทสลาฟสายประจันบาน) | Snow Fort | ACTIVE_CAST | needs-design-review |
| 1351 | 🟢 สาย A: Juggernaut Volkhv (โวล์ฟ - นักเวทสลาฟสายประจันบาน) | Iron Will | PASSIVE_STAT | needs-design-review |
| 1355 | 🟢 สาย A: Juggernaut Volkhv (โวล์ฟ - นักเวทสลาฟสายประจันบาน) | Vitality Boost | PASSIVE_STAT | needs-design-review |
| 1359 | 🟢 สาย A: Juggernaut Volkhv (โวล์ฟ - นักเวทสลาฟสายประจันบาน) | Heavy Armor Mastery | PASSIVE_STAT | needs-design-review |
| 1363 | 🟢 สาย A: Juggernaut Volkhv (โวล์ฟ - นักเวทสลาฟสายประจันบาน) | Taiga Survivor | PASSIVE_TRIGGER | needs-design-review |
| 1367 | 🟢 สาย A: Juggernaut Volkhv (โวล์ฟ - นักเวทสลาฟสายประจันบาน) | Aggro Mastery | PASSIVE_STAT | needs-design-review |
| 1373 | Juggernaut Warlord of Taiga | Taiga’s Absolute Fortress | ACTIVE_INSTANT | needs-design-review |
| 1378 | Juggernaut Warlord of Taiga | Titan Stomp | ACTIVE_CAST | needs-design-review |
| 1383 | Juggernaut Warlord of Taiga | Warlord's Command | ACTIVE_CAST | needs-design-review |
| 1388 | Juggernaut Warlord of Taiga | Unstoppable Will | PASSIVE_STAT | needs-design-review |
| 1392 | Juggernaut Warlord of Taiga | Colossus Blood | PASSIVE_TRIGGER | needs-design-review |
| 1403 | 🔴 สาย B: Taiga Shaman (ชาแมนแห่งไทกา) | Slavic Axe Strike | ACTIVE_INSTANT | needs-design-review |
| 1409 | 🔴 สาย B: Taiga Shaman (ชาแมนแห่งไทกา) | Berserker Blood | ACTIVE_INSTANT | needs-design-review |
| 1414 | 🔴 สาย B: Taiga Shaman (ชาแมนแห่งไทกา) | Wolf Pack Call | ACTIVE_CAST | needs-design-review |
| 1419 | 🔴 สาย B: Taiga Shaman (ชาแมนแห่งไทกา) | Leap Strike | ACTIVE_INSTANT | needs-design-review |
| 1424 | 🔴 สาย B: Taiga Shaman (ชาแมนแห่งไทกา) | Blood Scent | ACTIVE_INSTANT | needs-design-review |
| 1429 | 🔴 สาย B: Taiga Shaman (ชาแมนแห่งไทกา) | Rend | PASSIVE_STAT | needs-design-review |
| 1433 | 🔴 สาย B: Taiga Shaman (ชาแมนแห่งไทกา) | Axe Mastery | PASSIVE_STAT | needs-design-review |
| 1437 | 🔴 สาย B: Taiga Shaman (ชาแมนแห่งไทกา) | Frenzy ASPD | PASSIVE_STAT | needs-design-review |
| 1441 | 🔴 สาย B: Taiga Shaman (ชาแมนแห่งไทกา) | Pain Killer | PASSIVE_TRIGGER | needs-design-review |
| 1445 | 🔴 สาย B: Taiga Shaman (ชาแมนแห่งไทกา) | Hunter's Mark | PASSIVE_STAT | needs-design-review |
| 1451 | Berserker Wolf Shaman | Bloodthirsty Wolf Frenzy | ACTIVE_INSTANT | needs-design-review |
| 1456 | Berserker Wolf Shaman | Decapitate | ACTIVE_CAST | needs-design-review |
| 1462 | Berserker Wolf Shaman | Blood Moon | ACTIVE_CAST | needs-design-review |
| 1467 | Berserker Wolf Shaman | Wolf Blood Mastery | PASSIVE_TRIGGER | needs-design-review |
| 1471 | Berserker Wolf Shaman | Undying Rage | PASSIVE_TRIGGER | needs-design-review |
| 1484 | 🟢 สาย A: Totem Guardian (โทเท็มชาแมน - ผู้พิทักษ์เสาอาคม) | Healing Totem | ACTIVE_CAST | needs-design-review |
| 1489 | 🟢 สาย A: Totem Guardian (โทเท็มชาแมน - ผู้พิทักษ์เสาอาคม) | Lightning Totem | ACTIVE_CAST | needs-design-review |
| 1494 | 🟢 สาย A: Totem Guardian (โทเท็มชาแมน - ผู้พิทักษ์เสาอาคม) | Armor Totem | ACTIVE_CAST | needs-design-review |
| 1499 | 🟢 สาย A: Totem Guardian (โทเท็มชาแมน - ผู้พิทักษ์เสาอาคม) | Earthbind Totem | ACTIVE_CAST | needs-design-review |
| 1504 | 🟢 สาย A: Totem Guardian (โทเท็มชาแมน - ผู้พิทักษ์เสาอาคม) | Relocate Totem | ACTIVE_INSTANT | needs-design-review |
| 1509 | 🟢 สาย A: Totem Guardian (โทเท็มชาแมน - ผู้พิทักษ์เสาอาคม) | Totem Mastery | PASSIVE_STAT | needs-design-review |
| 1513 | 🟢 สาย A: Totem Guardian (โทเท็มชาแมน - ผู้พิทักษ์เสาอาคม) | Woodcraft | PASSIVE_STAT | needs-design-review |
| 1517 | 🟢 สาย A: Totem Guardian (โทเท็มชาแมน - ผู้พิทักษ์เสาอาคม) | Spirit Ward | PASSIVE_STAT | needs-design-review |
| 1521 | 🟢 สาย A: Totem Guardian (โทเท็มชาแมน - ผู้พิทักษ์เสาอาคม) | Earth Resonance | PASSIVE_STAT | needs-design-review |
| 1525 | 🟢 สาย A: Totem Guardian (โทเท็มชาแมน - ผู้พิทักษ์เสาอาคม) | Multi-Totem | PASSIVE_STAT | needs-design-review |
| 1531 | Spirit Totem High Shaman | Totem Grid Network | ACTIVE_CAST | needs-design-review |
| 1536 | Spirit Totem High Shaman | Sanctuary Dome | ACTIVE_CAST | needs-design-review |
| 1541 | Spirit Totem High Shaman | Earthquake Totem | ACTIVE_CAST | needs-design-review |
| 1546 | Spirit Totem High Shaman | Spiritual Connection | PASSIVE_STAT | needs-design-review |
| 1550 | Spirit Totem High Shaman | Totem Overload | PASSIVE_STAT | needs-design-review |
| 1561 | 🔴 สาย B: Spirit Archer (นักธนูวิญญาณ) | Eagle Eye Shot | ACTIVE_CAST | needs-design-review |
| 1566 | 🔴 สาย B: Spirit Archer (นักธนูวิญญาณ) | Spirit Arrow | ACTIVE_INSTANT | needs-design-review |
| 1571 | 🔴 สาย B: Spirit Archer (นักธนูวิญญาณ) | Wind Walk | ACTIVE_CAST | needs-design-review |
| 1576 | 🔴 สาย B: Spirit Archer (นักธนูวิญญาณ) | Multi-Shot | ACTIVE_INSTANT | needs-design-review |
| 1581 | 🔴 สาย B: Spirit Archer (นักธนูวิญญาณ) | Trap Arrow | ACTIVE_CAST | needs-design-review |
| 1586 | 🔴 สาย B: Spirit Archer (นักธนูวิญญาณ) | Archery Mastery | PASSIVE_STAT | needs-design-review |
| 1590 | 🔴 สาย B: Spirit Archer (นักธนูวิญญาณ) | Wind Arrows | PASSIVE_TRIGGER | needs-design-review |
| 1594 | 🔴 สาย B: Spirit Archer (นักธนูวิญญาณ) | Crit Eye | PASSIVE_STAT | needs-design-review |
| 1598 | 🔴 สาย B: Spirit Archer (นักธนูวิญญาณ) | Vulture's Sight | PASSIVE_STAT | needs-design-review |
| 1602 | 🔴 สาย B: Spirit Archer (นักธนูวิญญาณ) | Swift Bow | PASSIVE_TRIGGER | needs-design-review |
| 1608 | Eagle-Eye Spirit Archer | Spirit Eagle Barrage | ACTIVE_CAST | needs-design-review |
| 1613 | Eagle-Eye Spirit Archer | Infinite Range Shot | ACTIVE_CAST | needs-design-review |
| 1618 | Eagle-Eye Spirit Archer | Rain of Arrows | ACTIVE_CAST | needs-design-review |
| 1623 | Eagle-Eye Spirit Archer | Eagle Eye Focus | PASSIVE_STAT | needs-design-review |
| 1627 | Eagle-Eye Spirit Archer | Wind Rider | PASSIVE_STAT | needs-design-review |
| 1640 | 🟢 สาย A: Voodoo Master (นักบวชวูดู) | Voodoo Curse | ACTIVE_CAST | needs-design-review |
| 1645 | 🟢 สาย A: Voodoo Master (นักบวชวูดู) | Pain Reflection | ACTIVE_CAST | needs-design-review |
| 1650 | 🟢 สาย A: Voodoo Master (นักบวชวูดู) | Zombie Minion | ACTIVE_CAST | needs-design-review |
| 1655 | 🟢 สาย A: Voodoo Master (นักบวชวูดู) | Needle Stab | ACTIVE_INSTANT | needs-design-review |
| 1661 | 🟢 สาย A: Voodoo Master (นักบวชวูดู) | Soul Bind | ACTIVE_CAST | needs-design-review |
| 1666 | 🟢 สาย A: Voodoo Master (นักบวชวูดู) | Dark Curse Mastery | PASSIVE_TRIGGER | needs-design-review |
| 1670 | 🟢 สาย A: Voodoo Master (นักบวชวูดู) | Cruelty | PASSIVE_TRIGGER | needs-design-review |
| 1674 | 🟢 สาย A: Voodoo Master (นักบวชวูดู) | Death Aura | PASSIVE_AURA | needs-design-review |
| 1678 | 🟢 สาย A: Voodoo Master (นักบวชวูดู) | Blood Magic | TOGGLE_BUFF | needs-design-review |
| 1682 | 🟢 สาย A: Voodoo Master (นักบวชวูดู) | Voodoo Immunity | PASSIVE_STAT | needs-design-review |
| 1688 | Voodoo Arch-High Priest | Ultimate Voodoo Retribution | ACTIVE_CAST | needs-design-review |
| 1693 | Voodoo Arch-High Priest | Soul Decay | ACTIVE_CAST | needs-design-review |
| 1698 | Voodoo Arch-High Priest | Curse of Death | ACTIVE_CAST | needs-design-review |
| 1703 | Voodoo Arch-High Priest | Voodoo Mastered | PASSIVE_TRIGGER | needs-design-review |
| 1707 | Voodoo Arch-High Priest | Soul Linker | PASSIVE_STAT | needs-design-review |
| 1718 | 🔴 สาย B: Necromancer Shaman (หมอผีคืนชีพ) | Skeleton Raise | ACTIVE_CAST | needs-design-review |
| 1723 | 🔴 สาย B: Necromancer Shaman (หมอผีคืนชีพ) | Undead Command | ACTIVE_INSTANT | needs-design-review |
| 1728 | 🔴 สาย B: Necromancer Shaman (หมอผีคืนชีพ) | Corpse Explosion | ACTIVE_CAST | needs-design-review |
| 1733 | 🔴 สาย B: Necromancer Shaman (หมอผีคืนชีพ) | Bone Spear | ACTIVE_CAST | needs-design-review |
| 1738 | 🔴 สาย B: Necromancer Shaman (หมอผีคืนชีพ) | Bone Armor | ACTIVE_CAST | needs-design-review |
| 1743 | 🔴 สาย B: Necromancer Shaman (หมอผีคืนชีพ) | Undead Pact | PASSIVE_STAT | needs-design-review |
| 1747 | 🔴 สาย B: Necromancer Shaman (หมอผีคืนชีพ) | Commander | PASSIVE_STAT | needs-design-review |
| 1751 | 🔴 สาย B: Necromancer Shaman (หมอผีคืนชีพ) | Life Tap | PASSIVE_STAT | needs-design-review |
| 1755 | 🔴 สาย B: Necromancer Shaman (หมอผีคืนชีพ) | Corpse Collector | PASSIVE_TRIGGER | needs-design-review |
| 1759 | 🔴 สาย B: Necromancer Shaman (หมอผีคืนชีพ) | Dark Summoning | PASSIVE_STAT | needs-design-review |
| 1765 | Lord of the Undead Legion | Undead Army Summon | ACTIVE_CAST | needs-design-review |
| 1770 | Lord of the Undead Legion | Lich Transformation | ACTIVE_CAST | needs-design-review |
| 1775 | Lord of the Undead Legion | Mass Explosion | ACTIVE_CAST | needs-design-review |
| 1780 | Lord of the Undead Legion | Legion Commander | PASSIVE_STAT | needs-design-review |
| 1784 | Lord of the Undead Legion | Undying Legion | PASSIVE_TRIGGER | needs-design-review |
| 1795 | 🟢 สาย A: Jaguar Berserker (นาฮัวล - หมอผีแปลงร่างแอซเท็ก) | Jaguar Transformation | TOGGLE_BUFF | needs-design-review |
| 1800 | 🟢 สาย A: Jaguar Berserker (นาฮัวล - หมอผีแปลงร่างแอซเท็ก) | Blood Shield | ACTIVE_CAST | needs-design-review |
| 1805 | 🟢 สาย A: Jaguar Berserker (นาฮัวล - หมอผีแปลงร่างแอซเท็ก) | Pounce & Slash | ACTIVE_INSTANT | needs-design-review |
| 1811 | 🟢 สาย A: Jaguar Berserker (นาฮัวล - หมอผีแปลงร่างแอซเท็ก) | Jaguar Roar | ACTIVE_CAST | needs-design-review |
| 1816 | 🟢 สาย A: Jaguar Berserker (นาฮัวล - หมอผีแปลงร่างแอซเท็ก) | Sun Strike | ACTIVE_INSTANT | needs-design-review |
| 1822 | 🟢 สาย A: Jaguar Berserker (นาฮัวล - หมอผีแปลงร่างแอซเท็ก) | Feline Agility | PASSIVE_TRIGGER | needs-design-review |
| 1826 | 🟢 สาย A: Jaguar Berserker (นาฮัวล - หมอผีแปลงร่างแอซเท็ก) | Thick Fur | PASSIVE_STAT | needs-design-review |
| 1830 | 🟢 สาย A: Jaguar Berserker (นาฮัวล - หมอผีแปลงร่างแอซเท็ก) | Jungle Predator | PASSIVE_TRIGGER | needs-design-review |
| 1834 | 🟢 สาย A: Jaguar Berserker (นาฮัวล - หมอผีแปลงร่างแอซเท็ก) | Blood Price | PASSIVE_TRIGGER | needs-design-review |
| 1838 | 🟢 สาย A: Jaguar Berserker (นาฮัวล - หมอผีแปลงร่างแอซเท็ก) | Solar Affinity | PASSIVE_STAT | needs-design-review |
| 1844 | Divine Jaguar Lord | Solar Jaguar Wrath | ACTIVE_CAST | needs-design-review |
| 1850 | Divine Jaguar Lord | Sun Amulet | ACTIVE_CAST | needs-design-review |
| 1855 | Divine Jaguar Lord | Eclipse Form | ACTIVE_INSTANT | needs-design-review |
| 1860 | Divine Jaguar Lord | Solar Power | PASSIVE_TRIGGER | needs-design-review |
| 1864 | Divine Jaguar Lord | Nine Lives | PASSIVE_STAT | needs-design-review |
| 1875 | 🔴 สาย B: Blood Mage (จอมเวทโลหิต) | Blood Sacrifice | ACTIVE_INSTANT | needs-design-review |
| 1880 | 🔴 สาย B: Blood Mage (จอมเวทโลหิต) | Crimson Spear | ACTIVE_CAST | needs-design-review |
| 1886 | 🔴 สาย B: Blood Mage (จอมเวทโลหิต) | Blood Drain Hex | ACTIVE_CAST | needs-design-review |
| 1891 | 🔴 สาย B: Blood Mage (จอมเวทโลหิต) | Hemorrhage | ACTIVE_CAST | needs-design-review |
| 1896 | 🔴 สาย B: Blood Mage (จอมเวทโลหิต) | Blood Pool | ACTIVE_CAST | needs-design-review |
| 1901 | 🔴 สาย B: Blood Mage (จอมเวทโลหิต) | Hemomancy Mastery | PASSIVE_TRIGGER | needs-design-review |
| 1905 | 🔴 สาย B: Blood Mage (จอมเวทโลหิต) | Pain Tolerance | PASSIVE_TRIGGER | needs-design-review |
| 1909 | 🔴 สาย B: Blood Mage (จอมเวทโลหิต) | Boiling Blood | PASSIVE_TRIGGER | needs-design-review |
| 1913 | 🔴 สาย B: Blood Mage (จอมเวทโลหิต) | Sanguine Pact | PASSIVE_STAT | needs-design-review |
| 1917 | 🔴 สาย B: Blood Mage (จอมเวทโลหิต) | Crimson Aura | PASSIVE_STAT | needs-design-review |
| 1923 | Blood Moon High Mage | Blood Moon Annihilation | ACTIVE_CAST | needs-design-review |
| 1928 | Blood Moon High Mage | Vampiric Field | ACTIVE_CAST | needs-design-review |
| 1933 | Blood Moon High Mage | Blood Clone | ACTIVE_CAST | needs-design-review |
| 1938 | Blood Moon High Mage | Blood Moon Blessing | PASSIVE_STAT | needs-design-review |
| 1942 | Blood Moon High Mage | Scarlet Rot | PASSIVE_TRIGGER | needs-design-review |
