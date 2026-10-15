// Authored independent geography; no whole-layout scaling.
// User-authorized canonical live map; layout and provenance remain in docs/design/maps/mountain-spirit-sanctuary.
import type{MapDefinition}from'../world.js';
export const MOUNTAIN_SPIRIT_SANCTUARY:MapDefinition={
  "id": "mountain-spirit-sanctuary",
  "name": "สำนักผนึกบนภูเขา",
  "nameEn": "Mountain Spirit Sanctuary",
  "width": 74,
  "height": 64,
  "spawn": {
    "x": 4,
    "y": 54
  },
  "ground": {
    "base": "dark-grass",
    "regions": []
  },
  "terrain": {
    "base": "grass",
    "paint": [
      {
        "terrain": "water",
        "shape": "circle",
        "x": 62,
        "y": 54,
        "r": 5
      },
      {
        "terrain": "water",
        "shape": "path",
        "points": [
          [
            62,
            57
          ],
          [
            66,
            61
          ],
          [
            67,
            64
          ]
        ],
        "r": 2
      },
      {
        "terrain": "dirt",
        "shape": "path",
        "points": [
          [
            1,
            54
          ],
          [
            4,
            54
          ],
          [
            11,
            53
          ],
          [
            18,
            54
          ],
          [
            24,
            52
          ],
          [
            30,
            50
          ],
          [
            30,
            46
          ],
          [
            30,
            38
          ],
          [
            34,
            36
          ],
          [
            38,
            35
          ],
          [
            37,
            32
          ],
          [
            35,
            30
          ],
          [
            35,
            22
          ],
          [
            38,
            18
          ]
        ],
        "r": 1.5
      },
      {
        "terrain": "dirt",
        "shape": "path",
        "points": [
          [
            18,
            54
          ],
          [
            40,
            56
          ],
          [
            51,
            53
          ]
        ],
        "r": 1.5
      },
      {
        "terrain": "dirt",
        "shape": "path",
        "points": [
          [
            38,
            35
          ],
          [
            52,
            35
          ],
          [
            60,
            35
          ]
        ],
        "r": 1.5
      },
      {
        "terrain": "dirt",
        "shape": "path",
        "points": [
          [
            30,
            38
          ],
          [
            19,
            35
          ],
          [
            13,
            37
          ]
        ],
        "r": 1.5
      },
      {
        "terrain": "dirt",
        "shape": "path",
        "points": [
          [
            38,
            18
          ],
          [
            49,
            20
          ]
        ],
        "r": 1.5
      },
      {
        "terrain": "road",
        "shape": "circle",
        "x": 38,
        "y": 35,
        "r": 4
      },
      {
        "terrain": "road",
        "shape": "rect",
        "x": 31,
        "y": 17,
        "w": 14,
        "h": 5
      },
      {
        "terrain": "dirt",
        "shape": "path",
        "points": [
          [
            51,
            53
          ],
          [
            55,
            48
          ],
          [
            61,
            45
          ],
          [
            66,
            43
          ],
          [
            73,
            43
          ]
        ],
        "r": 1.5
      },
      {
        "terrain": "dirt",
        "shape": "path",
        "points": [
          [
            40,
            56
          ],
          [
            42,
            59
          ],
          [
            42,
            63
          ]
        ],
        "r": 1.8
      }
    ]
  },
  "elevation": {
    "risePx": 64,
    "terraces": [],
    "regions": [
      {
        "id": "summit",
        "level": 2,
        "points": [
          [
            18,
            8
          ],
          [
            27,
            5
          ],
          [
            48,
            6
          ],
          [
            56,
            14
          ],
          [
            54,
            21
          ],
          [
            50,
            24
          ],
          [
            43,
            27
          ],
          [
            38,
            26
          ],
          [
            32,
            26
          ],
          [
            25,
            25
          ],
          [
            21,
            27
          ],
          [
            18,
            20
          ]
        ]
      },
      {
        "id": "middle",
        "level": 1,
        "points": [
          [
            8,
            14
          ],
          [
            18,
            8
          ],
          [
            52,
            7
          ],
          [
            64,
            19
          ],
          [
            64,
            36
          ],
          [
            59,
            40
          ],
          [
            52,
            43
          ],
          [
            44,
            41
          ],
          [
            36,
            42
          ],
          [
            33,
            42
          ],
          [
            27,
            42
          ],
          [
            22,
            40
          ],
          [
            16,
            43
          ],
          [
            10,
            39
          ],
          [
            8,
            34
          ]
        ]
      }
    ],
    "transitions": [
      {
        "id": "lower-stairs",
        "kind": "stairs",
        "axis": "y",
        "x": 27,
        "y": 38,
        "w": 6,
        "h": 8,
        "start": 1,
        "end": 0,
        "middleLanding": 0.25
      },
      {
        "id": "upper-stairs",
        "kind": "stairs",
        "axis": "y",
        "x": 32,
        "y": 22,
        "w": 6,
        "h": 8,
        "start": 2,
        "end": 1,
        "middleLanding": 0.25
      }
    ]
  },
  "objects": [
    {
      "id": "seal-academy",
      "asset": "temple",
      "x": 38,
      "y": 16,
      "footprint": {
        "w": 8,
        "h": 4
      }
    },
    {
      "id": "seal-altar",
      "asset": "village-sacred-totem",
      "x": 49,
      "y": 18,
      "footprint": {
        "w": 2,
        "h": 1
      }
    },
    {
      "id": "foothill-lodge",
      "asset": "village-thatched-lodge",
      "x": 18,
      "y": 49,
      "footprint": {
        "w": 6,
        "h": 3
      }
    },
    {
      "id": "ritual-rest",
      "asset": "village-thatched-hut",
      "x": 13,
      "y": 35,
      "footprint": {
        "w": 3,
        "h": 2
      }
    },
    {
      "id": "old-shrine",
      "asset": "ruined-shrine",
      "x": 19,
      "y": 32,
      "footprint": {
        "w": 3,
        "h": 2
      }
    },
    {
      "id": "north-canopy-0",
      "asset": "village-tropical-tree",
      "x": 20,
      "y": 10,
      "footprint": null
    },
    {
      "id": "north-canopy-1",
      "asset": "village-tropical-tree",
      "x": 25,
      "y": 8,
      "footprint": null
    },
    {
      "id": "north-canopy-2",
      "asset": "village-tropical-tree",
      "x": 30,
      "y": 6,
      "footprint": null
    },
    {
      "id": "north-canopy-3",
      "asset": "village-tropical-tree",
      "x": 43,
      "y": 7,
      "footprint": null
    },
    {
      "id": "north-canopy-4",
      "asset": "village-tropical-tree",
      "x": 49,
      "y": 10,
      "footprint": null
    },
    {
      "id": "north-canopy-5",
      "asset": "village-tropical-tree",
      "x": 53,
      "y": 14,
      "footprint": null
    },
    {
      "id": "north-canopy-6",
      "asset": "village-tropical-tree",
      "x": 51,
      "y": 24,
      "footprint": null
    },
    {
      "id": "north-canopy-7",
      "asset": "village-tropical-tree",
      "x": 22,
      "y": 21,
      "footprint": null
    },
    {
      "id": "north-canopy-8",
      "asset": "village-tropical-tree",
      "x": 20,
      "y": 17,
      "footprint": null
    },
    {
      "id": "west-canopy-0",
      "asset": "village-tropical-tree",
      "x": 4,
      "y": 17,
      "footprint": null
    },
    {
      "id": "west-canopy-1",
      "asset": "village-tropical-tree",
      "x": 7,
      "y": 22,
      "footprint": null
    },
    {
      "id": "west-canopy-2",
      "asset": "village-tropical-tree",
      "x": 4,
      "y": 28,
      "footprint": null
    },
    {
      "id": "west-canopy-3",
      "asset": "village-tropical-tree",
      "x": 7,
      "y": 33,
      "footprint": null
    },
    {
      "id": "west-canopy-4",
      "asset": "village-tropical-tree",
      "x": 6,
      "y": 40,
      "footprint": null
    },
    {
      "id": "west-canopy-5",
      "asset": "village-tropical-tree",
      "x": 9,
      "y": 45,
      "footprint": null
    },
    {
      "id": "west-canopy-6",
      "asset": "village-tropical-tree",
      "x": 5,
      "y": 48,
      "footprint": null
    },
    {
      "id": "west-canopy-7",
      "asset": "village-tropical-tree",
      "x": 9,
      "y": 53,
      "footprint": null
    },
    {
      "id": "west-canopy-8",
      "asset": "village-tropical-tree",
      "x": 9,
      "y": 63,
      "footprint": null
    },
    {
      "id": "west-canopy-9",
      "asset": "village-tropical-tree",
      "x": 20,
      "y": 63,
      "footprint": null
    },
    {
      "id": "west-canopy-10",
      "asset": "village-tropical-tree",
      "x": 27,
      "y": 63,
      "footprint": null
    },
    {
      "id": "west-canopy-11",
      "asset": "village-tropical-tree",
      "x": 34,
      "y": 63,
      "footprint": null
    },
    {
      "id": "east-canopy-0",
      "asset": "village-tropical-tree",
      "x": 65,
      "y": 15,
      "footprint": null
    },
    {
      "id": "east-canopy-1",
      "asset": "village-tropical-tree",
      "x": 69,
      "y": 20,
      "footprint": null
    },
    {
      "id": "east-canopy-2",
      "asset": "village-tropical-tree",
      "x": 66,
      "y": 26,
      "footprint": null
    },
    {
      "id": "east-canopy-3",
      "asset": "village-tropical-tree",
      "x": 70,
      "y": 31,
      "footprint": null
    },
    {
      "id": "east-canopy-4",
      "asset": "village-tropical-tree",
      "x": 66,
      "y": 37,
      "footprint": null
    },
    {
      "id": "east-canopy-5",
      "asset": "village-tropical-tree",
      "x": 69,
      "y": 38,
      "footprint": null
    },
    {
      "id": "east-canopy-6",
      "asset": "village-tropical-tree",
      "x": 57,
      "y": 47,
      "footprint": null
    },
    {
      "id": "east-canopy-7",
      "asset": "village-tropical-tree",
      "x": 53,
      "y": 50,
      "footprint": null
    },
    {
      "id": "east-canopy-8",
      "asset": "village-tropical-tree",
      "x": 70,
      "y": 52,
      "footprint": null
    },
    {
      "id": "east-canopy-9",
      "asset": "village-tropical-tree",
      "x": 71,
      "y": 58,
      "footprint": null
    },
    {
      "id": "middle-canopy-0",
      "asset": "village-tropical-tree",
      "x": 11,
      "y": 16,
      "footprint": null
    },
    {
      "id": "middle-canopy-1",
      "asset": "village-tropical-tree",
      "x": 14,
      "y": 22,
      "footprint": null
    },
    {
      "id": "middle-canopy-2",
      "asset": "village-tropical-tree",
      "x": 15,
      "y": 27,
      "footprint": null
    },
    {
      "id": "middle-canopy-3",
      "asset": "village-tropical-tree",
      "x": 24,
      "y": 31,
      "footprint": null
    },
    {
      "id": "middle-canopy-4",
      "asset": "village-tropical-tree",
      "x": 26,
      "y": 36,
      "footprint": null
    },
    {
      "id": "middle-canopy-5",
      "asset": "village-tropical-tree",
      "x": 45,
      "y": 29,
      "footprint": null
    },
    {
      "id": "middle-canopy-6",
      "asset": "village-tropical-tree",
      "x": 50,
      "y": 31,
      "footprint": null
    },
    {
      "id": "middle-canopy-7",
      "asset": "village-tropical-tree",
      "x": 59,
      "y": 30,
      "footprint": null
    },
    {
      "id": "middle-canopy-8",
      "asset": "village-tropical-tree",
      "x": 58,
      "y": 39,
      "footprint": null
    },
    {
      "id": "middle-canopy-9",
      "asset": "village-tropical-tree",
      "x": 46,
      "y": 40,
      "footprint": null
    },
    {
      "id": "understory-0",
      "asset": "garden-understory",
      "x": 8,
      "y": 20,
      "footprint": null
    },
    {
      "id": "understory-1",
      "asset": "garden-understory",
      "x": 10,
      "y": 30,
      "footprint": null
    },
    {
      "id": "understory-2",
      "asset": "garden-understory",
      "x": 12,
      "y": 44,
      "footprint": null
    },
    {
      "id": "understory-3",
      "asset": "garden-understory",
      "x": 25,
      "y": 59,
      "footprint": null
    },
    {
      "id": "understory-4",
      "asset": "garden-understory",
      "x": 54,
      "y": 48,
      "footprint": null
    },
    {
      "id": "understory-5",
      "asset": "garden-understory",
      "x": 68,
      "y": 48,
      "footprint": null
    },
    {
      "id": "understory-6",
      "asset": "garden-understory",
      "x": 58,
      "y": 57,
      "footprint": null
    },
    {
      "id": "understory-7",
      "asset": "garden-understory",
      "x": 71,
      "y": 61,
      "footprint": null
    },
    {
      "id": "landing-light-0",
      "asset": "talisman-lantern",
      "x": 4,
      "y": 51,
      "footprint": null
    },
    {
      "id": "landing-light-1",
      "asset": "talisman-lantern",
      "x": 8,
      "y": 58,
      "footprint": null
    },
    {
      "id": "landing-light-2",
      "asset": "talisman-lantern",
      "x": 27,
      "y": 47,
      "footprint": null
    },
    {
      "id": "landing-light-3",
      "asset": "talisman-lantern",
      "x": 33,
      "y": 47,
      "footprint": null
    },
    {
      "id": "landing-light-4",
      "asset": "talisman-lantern",
      "x": 27,
      "y": 37,
      "footprint": null
    },
    {
      "id": "landing-light-5",
      "asset": "talisman-lantern",
      "x": 33,
      "y": 37,
      "footprint": null
    },
    {
      "id": "landing-light-6",
      "asset": "talisman-lantern",
      "x": 32,
      "y": 31,
      "footprint": null
    },
    {
      "id": "landing-light-7",
      "asset": "talisman-lantern",
      "x": 38,
      "y": 31,
      "footprint": null
    },
    {
      "id": "landing-light-8",
      "asset": "talisman-lantern",
      "x": 32,
      "y": 21,
      "footprint": null
    },
    {
      "id": "landing-light-9",
      "asset": "talisman-lantern",
      "x": 41,
      "y": 21,
      "footprint": null
    },
    {
      "id": "landing-light-10",
      "asset": "talisman-lantern",
      "x": 45,
      "y": 19,
      "footprint": null
    },
    {
      "id": "landing-light-11",
      "asset": "talisman-lantern",
      "x": 52,
      "y": 19,
      "footprint": null
    },
    {
      "id": "outcrop-0",
      "asset": "mossy-rock",
      "x": 7,
      "y": 56,
      "footprint": {
        "w": 1.1,
        "h": 0.5
      }
    },
    {
      "id": "outcrop-1",
      "asset": "mossy-rock",
      "x": 22,
      "y": 58,
      "footprint": {
        "w": 1.1,
        "h": 0.5
      }
    },
    {
      "id": "outcrop-2",
      "asset": "mossy-rock",
      "x": 25,
      "y": 48,
      "footprint": {
        "w": 1.1,
        "h": 0.5
      }
    },
    {
      "id": "outcrop-3",
      "asset": "mossy-rock",
      "x": 40,
      "y": 51,
      "footprint": {
        "w": 1.1,
        "h": 0.5
      }
    },
    {
      "id": "outcrop-4",
      "asset": "mossy-rock",
      "x": 50,
      "y": 55,
      "footprint": {
        "w": 1.1,
        "h": 0.5
      }
    },
    {
      "id": "outcrop-5",
      "asset": "mossy-rock",
      "x": 54,
      "y": 60,
      "footprint": {
        "w": 1.1,
        "h": 0.5
      }
    },
    {
      "id": "outcrop-6",
      "asset": "mossy-rock",
      "x": 67,
      "y": 46,
      "footprint": {
        "w": 1.1,
        "h": 0.5
      }
    },
    {
      "id": "outcrop-7",
      "asset": "mossy-rock",
      "x": 57,
      "y": 32,
      "footprint": {
        "w": 1.1,
        "h": 0.5
      }
    },
    {
      "id": "bamboo-boundary-lamp-n",
      "asset": "talisman-lantern",
      "x": 73,
      "y": 40,
      "footprint": null
    },
    {
      "id": "bamboo-boundary-lamp-s",
      "asset": "talisman-lantern",
      "x": 73,
      "y": 46,
      "footprint": null
    }
  ],
  "blockers": [
    {
      "x": 60.499,
      "y": 48.999,
      "w": 3.002,
      "h": 0.502
    },
    {
      "x": 59.499,
      "y": 49.499,
      "w": 5.002,
      "h": 0.502
    },
    {
      "x": 58.499,
      "y": 49.999,
      "w": 7.002,
      "h": 0.502
    },
    {
      "x": 57.999,
      "y": 50.499,
      "w": 8.002,
      "h": 0.502
    },
    {
      "x": 57.999,
      "y": 50.999,
      "w": 8.002,
      "h": 0.502
    },
    {
      "x": 57.499,
      "y": 51.499,
      "w": 9.002,
      "h": 0.502
    },
    {
      "x": 57.499,
      "y": 51.999,
      "w": 9.002,
      "h": 0.502
    },
    {
      "x": 56.999,
      "y": 52.499,
      "w": 10.002,
      "h": 0.502
    },
    {
      "x": 56.999,
      "y": 52.999,
      "w": 10.002,
      "h": 0.502
    },
    {
      "x": 56.999,
      "y": 53.499,
      "w": 10.002,
      "h": 0.502
    },
    {
      "x": 56.999,
      "y": 53.999,
      "w": 10.002,
      "h": 0.502
    },
    {
      "x": 56.999,
      "y": 54.499,
      "w": 10.002,
      "h": 0.502
    },
    {
      "x": 56.999,
      "y": 54.999,
      "w": 10.002,
      "h": 0.502
    },
    {
      "x": 57.499,
      "y": 55.499,
      "w": 9.002,
      "h": 0.502
    },
    {
      "x": 57.499,
      "y": 55.999,
      "w": 9.002,
      "h": 0.502
    },
    {
      "x": 57.999,
      "y": 56.499,
      "w": 8.002,
      "h": 0.502
    },
    {
      "x": 57.999,
      "y": 56.999,
      "w": 8.002,
      "h": 0.502
    },
    {
      "x": 58.499,
      "y": 57.499,
      "w": 7.002,
      "h": 0.502
    },
    {
      "x": 59.499,
      "y": 57.999,
      "w": 6.502,
      "h": 0.502
    },
    {
      "x": 60.499,
      "y": 58.499,
      "w": 6.002,
      "h": 0.502
    },
    {
      "x": 61.499,
      "y": 58.999,
      "w": 5.502,
      "h": 0.502
    },
    {
      "x": 61.999,
      "y": 59.499,
      "w": 5.502,
      "h": 0.502
    },
    {
      "x": 62.499,
      "y": 59.999,
      "w": 5.502,
      "h": 0.502
    },
    {
      "x": 62.999,
      "y": 60.499,
      "w": 5.002,
      "h": 0.502
    },
    {
      "x": 63.499,
      "y": 60.999,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 63.999,
      "y": 61.499,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 64.499,
      "y": 61.999,
      "w": 4.002,
      "h": 0.502
    },
    {
      "x": 64.499,
      "y": 62.499,
      "w": 4.002,
      "h": 0.502
    },
    {
      "x": 64.499,
      "y": 62.999,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 64.999,
      "y": 63.499,
      "w": 4.002,
      "h": 0.502
    }
  ],
  "portals": [
    {
      "id": "marsh-gate",
      "area": {
        "x": 0,
        "y": 53.4,
        "w": 2,
        "h": 1.2
      },
      "arrival": {
        "x": 4,
        "y": 54
      },
      "to": {
        "mapId": "monsoon-marsh",
        "portalId": "mountain-gate"
      },
      "label": {
        "th": "กลับบึงฝนลืมวิญญาณ · ตะวันตก",
        "en": "Monsoon Marsh"
      }
    },
    {
      "id": "bamboo-gate",
      "area": {
        "x": 72,
        "y": 42.4,
        "w": 2,
        "h": 1.2
      },
      "arrival": {
        "x": 70,
        "y": 43
      },
      "to": {
        "mapId": "mist-bamboo",
        "portalId": "sanctuary-gate"
      },
      "label": {
        "th": "ไปหุบไผ่หมอกคราม · ตะวันออก",
        "en": "Mist bamboo valley"
      }
    },
    {
      "id": "ashwind-gate",
      "area": {
        "x": 41,
        "y": 62,
        "w": 2,
        "h": 2
      },
      "arrival": {
        "x": 42,
        "y": 60
      },
      "to": {
        "mapId": "ashwind-volcano",
        "portalId": "sanctuary-gate"
      },
      "label": {
        "th": "ไปภูเขาไฟเถ้าลม · ใต้",
        "en": "ashwind-volcano"
      }
    }
  ],
  "npcs": [
    {
      "id": "mountain-healer",
      "sprite": "npc-herbalist",
      "name": {
        "th": "แม่เฒ่าสายหมอก",
        "en": "Mist Healer"
      },
      "title": "รักษาเชิงเขา",
      "role": "healer",
      "x": 20,
      "y": 53,
      "greeting": "พักฟื้นก่อนขึ้นสำนัก ทางภูเขามีชานพักให้หยุดระหว่างบันได"
    },
    {
      "id": "mountain-keeper",
      "sprite": "npc-elder",
      "name": {
        "th": "ครูเฒ่าผนึกหิน",
        "en": "Stone Seal Keeper"
      },
      "title": "ผู้ดูแลสำนัก",
      "role": "guide",
      "x": 41,
      "y": 20,
      "greeting": "เจ้ามาถึงสำนักผนึกบนภูเขาแล้ว ตาน้ำอยู่เชิงเขาตะวันออก ส่วนทางข้ามสันเขายังปิด"
    },
    {
      "id": "mountain-watch",
      "sprite": "npc-guard",
      "name": {
        "th": "พรานยอดดอย",
        "en": "Ridge Watcher"
      },
      "title": "ผู้เฝ้าสันเขา",
      "role": "guard",
      "x": 57,
      "y": 35,
      "greeting": "ภูตดอยกับเงาสันเขาอยู่รอบลาน ระวังทวารบาลผนึกหินในป่าสูง"
    }
  ],
  "spawnRegions": [
    {
      "id": "foothill-wisps",
      "area": {
        "x": 30,
        "y": 51,
        "w": 16,
        "h": 9
      },
      "respawnMs": 18000,
      "monsters": [
        {
          "kind": "highland-wisp",
          "count": 4
        }
      ]
    },
    {
      "id": "ridge-shadows",
      "area": {
        "x": 47,
        "y": 32,
        "w": 8,
        "h": 7
      },
      "respawnMs": 20000,
      "monsters": [
        {
          "kind": "ridge-shadow",
          "count": 4
        }
      ]
    },
    {
      "id": "summit-guardians",
      "area": {
        "x": 23,
        "y": 12,
        "w": 7,
        "h": 8
      },
      "respawnMs": 25000,
      "monsters": [
        {
          "kind": "seal-guardian",
          "count": 3
        }
      ]
    }
  ],
  "landmarks": [
    {
      "id": "west-entry",
      "name": {
        "th": "ทางเชิงเขา",
        "en": "west-entry"
      },
      "x": 4,
      "y": 54,
      "kind": "forest"
    },
    {
      "id": "foothill-rest",
      "name": {
        "th": "ลานพักเชิงเขา",
        "en": "foothill-rest"
      },
      "x": 18,
      "y": 54,
      "kind": "forest"
    },
    {
      "id": "lower-foot",
      "name": {
        "th": "เชิงบันได",
        "en": "lower-foot"
      },
      "x": 30,
      "y": 46,
      "kind": "forest"
    },
    {
      "id": "lower-top",
      "name": {
        "th": "ชานพักกลาง",
        "en": "lower-top"
      },
      "x": 30,
      "y": 38,
      "kind": "forest"
    },
    {
      "id": "middle-court",
      "name": {
        "th": "ลานพิธี",
        "en": "middle-court"
      },
      "x": 38,
      "y": 35,
      "kind": "forest"
    },
    {
      "id": "upper-foot",
      "name": {
        "th": "บันไดสำนัก",
        "en": "upper-foot"
      },
      "x": 35,
      "y": 30,
      "kind": "forest"
    },
    {
      "id": "upper-top",
      "name": {
        "th": "ชานพักสำนัก",
        "en": "upper-top"
      },
      "x": 35,
      "y": 22,
      "kind": "forest"
    },
    {
      "id": "academy-door",
      "name": {
        "th": "หน้าสำนักผนึก",
        "en": "academy-door"
      },
      "x": 38,
      "y": 18,
      "kind": "forest"
    },
    {
      "id": "altar-approach",
      "name": {
        "th": "ลานเสาผนึก",
        "en": "altar-approach"
      },
      "x": 49,
      "y": 20,
      "kind": "forest"
    },
    {
      "id": "shrine-approach",
      "name": {
        "th": "ศาลร้าง",
        "en": "shrine-approach"
      },
      "x": 19,
      "y": 35,
      "kind": "shrine"
    },
    {
      "id": "hut-approach",
      "name": {
        "th": "เรือนพักพิธี",
        "en": "hut-approach"
      },
      "x": 13,
      "y": 37,
      "kind": "forest"
    },
    {
      "id": "spring-pool",
      "name": {
        "th": "ตาน้ำหุบเขา",
        "en": "spring-pool"
      },
      "x": 51,
      "y": 53,
      "kind": "forest"
    },
    {
      "id": "east-lookout",
      "name": {
        "th": "สันเขาตะวันออก · ยังปิด",
        "en": "east-lookout"
      },
      "x": 60,
      "y": 35,
      "kind": "forest"
    }
  ],
  "safeZones": [
    {
      "x": 0,
      "y": 50,
      "w": 10,
      "h": 9
    },
    {
      "x": 14,
      "y": 50,
      "w": 10,
      "h": 7
    },
    {
      "x": 27,
      "y": 38,
      "w": 6,
      "h": 8
    },
    {
      "x": 32,
      "y": 22,
      "w": 6,
      "h": 8
    },
    {
      "x": 30,
      "y": 17,
      "w": 15,
      "h": 5
    },
    {
      "x": 65,
      "y": 40,
      "w": 9,
      "h": 7
    }
  ]
};
