// User-authorized canonical live map; layout and provenance remain in docs/design/maps/mist-bamboo.
// Tea adoption retains original geometry and snapshots in revision02.
import type{MapDefinition}from'../world.js';
export const MIST_BAMBOO:MapDefinition={
  "id": "mist-bamboo",
  "name": "หุบไผ่หมอกคราม",
  "nameEn": "Indigo Mist Bamboo Valley",
  "width": 82,
  "height": 62,
  "spawn": {
    "x": 4,
    "y": 45
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
        "x": 39,
        "y": 10,
        "r": 6
      },
      {
        "terrain": "water",
        "shape": "path",
        "points": [
          [
            39,
            10
          ],
          [
            35,
            23
          ],
          [
            40,
            35
          ],
          [
            36,
            47
          ],
          [
            43,
            62
          ]
        ],
        "r": 2.2
      },
      {
        "terrain": "dirt",
        "shape": "path",
        "points": [
          [
            2,
            45
          ],
          [
            13,
            44
          ],
          [
            22,
            42
          ],
          [
            28,
            39
          ],
          [
            35,
            35
          ],
          [
            45,
            35
          ],
          [
            52,
            34
          ],
          [
            59,
            30
          ],
          [
            64,
            22
          ],
          [
            72,
            19
          ],
          [
            80,
            17
          ]
        ],
        "r": 1.8
      },
      {
        "terrain": "dirt",
        "shape": "path",
        "points": [
          [
            13,
            44
          ],
          [
            16,
            32
          ],
          [
            23,
            20
          ]
        ],
        "r": 1.8
      },
      {
        "terrain": "dirt",
        "shape": "path",
        "points": [
          [
            52,
            34
          ],
          [
            54,
            42
          ],
          [
            58,
            49
          ]
        ],
        "r": 1.8
      },
      {
        "terrain": "dirt",
        "shape": "path",
        "points": [
          [
            64,
            22
          ],
          [
            69,
            30
          ]
        ],
        "r": 1.8
      },
      {
        "terrain": "dirt",
        "shape": "path",
        "points": [
          [
            52,
            34
          ],
          [
            49,
            24
          ],
          [
            48,
            14
          ]
        ],
        "r": 1.8
      },
      {
        "terrain": "grass",
        "shape": "path",
        "points": [
          [
            33,
            35
          ],
          [
            46,
            35
          ]
        ],
        "r": 3
      },
      {
        "terrain": "road",
        "shape": "path",
        "points": [
          [
            34,
            35
          ],
          [
            45,
            35
          ]
        ],
        "r": 2.4
      },
      {
        "terrain": "road",
        "shape": "circle",
        "x": 52,
        "y": 34,
        "r": 3.4
      },
      {
        "terrain": "dirt",
        "shape": "path",
        "points": [
          [
            78,
            17
          ],
          [
            81,
            17
          ]
        ],
        "r": 1.8
      }
    ]
  },
  "objects": [
    {
      "id": "west-shelter",
      "asset": "village-thatched-hut",
      "x": 13,
      "y": 42,
      "footprint": {
        "w": 7,
        "h": 5
      }
    },
    {
      "id": "valley-seal",
      "asset": "village-sacred-totem",
      "x": 52,
      "y": 31,
      "footprint": {
        "w": 4,
        "h": 3
      }
    },
    {
      "id": "spring-marker",
      "asset": "ruined-shrine",
      "x": 48,
      "y": 12,
      "footprint": {
        "w": 2,
        "h": 2
      }
    },
    {
      "id": "tea-waypost",
      "asset": "talisman-lantern",
      "x": 78,
      "y": 14,
      "footprint": null
    },
    {
      "id": "northwest-bamboo-1",
      "asset": "bamboo",
      "x": 4,
      "y": 8,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northwest-bamboo-2",
      "asset": "bamboo",
      "x": 8,
      "y": 12,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northwest-bamboo-3",
      "asset": "bamboo",
      "x": 13,
      "y": 8,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northwest-bamboo-4",
      "asset": "bamboo",
      "x": 17,
      "y": 11,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northwest-bamboo-5",
      "asset": "bamboo",
      "x": 6,
      "y": 18,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northwest-bamboo-6",
      "asset": "bamboo",
      "x": 11,
      "y": 23,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northwest-bamboo-7",
      "asset": "bamboo",
      "x": 8,
      "y": 29,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northwest-bamboo-8",
      "asset": "bamboo",
      "x": 3,
      "y": 33,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northwest-bamboo-9",
      "asset": "bamboo",
      "x": 15,
      "y": 27,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northwest-bamboo-10",
      "asset": "bamboo",
      "x": 21,
      "y": 8,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northwest-bamboo-11",
      "asset": "bamboo",
      "x": 26,
      "y": 5,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northwest-bamboo-12",
      "asset": "bamboo",
      "x": 29,
      "y": 11,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "springRim-bamboo-1",
      "asset": "bamboo",
      "x": 30,
      "y": 4,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "springRim-bamboo-2",
      "asset": "bamboo",
      "x": 33,
      "y": 7,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "springRim-bamboo-3",
      "asset": "bamboo",
      "x": 46,
      "y": 5,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "springRim-bamboo-4",
      "asset": "bamboo",
      "x": 51,
      "y": 8,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "springRim-bamboo-5",
      "asset": "bamboo",
      "x": 54,
      "y": 13,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "springRim-bamboo-6",
      "asset": "bamboo",
      "x": 58,
      "y": 9,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "springRim-bamboo-7",
      "asset": "bamboo",
      "x": 60,
      "y": 15,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northeast-bamboo-1",
      "asset": "bamboo",
      "x": 65,
      "y": 5,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northeast-bamboo-2",
      "asset": "bamboo",
      "x": 70,
      "y": 9,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northeast-bamboo-3",
      "asset": "bamboo",
      "x": 75,
      "y": 6,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northeast-bamboo-4",
      "asset": "bamboo",
      "x": 79,
      "y": 12,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northeast-bamboo-5",
      "asset": "bamboo",
      "x": 67,
      "y": 16,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northeast-bamboo-6",
      "asset": "bamboo",
      "x": 73,
      "y": 14,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northeast-bamboo-7",
      "asset": "bamboo",
      "x": 78,
      "y": 24,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northeast-bamboo-8",
      "asset": "bamboo",
      "x": 81,
      "y": 29,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southwest-bamboo-1",
      "asset": "bamboo",
      "x": 5,
      "y": 53,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southwest-bamboo-2",
      "asset": "bamboo",
      "x": 9,
      "y": 57,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southwest-bamboo-3",
      "asset": "bamboo",
      "x": 15,
      "y": 55,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southwest-bamboo-4",
      "asset": "bamboo",
      "x": 19,
      "y": 59,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southwest-bamboo-5",
      "asset": "bamboo",
      "x": 23,
      "y": 54,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southwest-bamboo-6",
      "asset": "bamboo",
      "x": 27,
      "y": 58,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southwest-bamboo-7",
      "asset": "bamboo",
      "x": 30,
      "y": 52,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southwest-bamboo-8",
      "asset": "bamboo",
      "x": 26,
      "y": 47,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southeast-bamboo-1",
      "asset": "bamboo",
      "x": 47,
      "y": 58,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southeast-bamboo-2",
      "asset": "bamboo",
      "x": 51,
      "y": 55,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southeast-bamboo-3",
      "asset": "bamboo",
      "x": 57,
      "y": 59,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southeast-bamboo-4",
      "asset": "bamboo",
      "x": 64,
      "y": 58,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southeast-bamboo-5",
      "asset": "bamboo",
      "x": 69,
      "y": 54,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southeast-bamboo-6",
      "asset": "bamboo",
      "x": 75,
      "y": 58,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southeast-bamboo-7",
      "asset": "bamboo",
      "x": 79,
      "y": 52,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southeast-bamboo-8",
      "asset": "bamboo",
      "x": 74,
      "y": 44,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southeast-bamboo-9",
      "asset": "bamboo",
      "x": 78,
      "y": 39,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southeast-bamboo-10",
      "asset": "bamboo",
      "x": 69,
      "y": 40,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southeast-bamboo-11",
      "asset": "bamboo",
      "x": 66,
      "y": 46,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "westScreen-bamboo-1",
      "asset": "bamboo",
      "x": 3,
      "y": 14,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "westScreen-bamboo-2",
      "asset": "bamboo",
      "x": 5,
      "y": 22,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "westScreen-bamboo-3",
      "asset": "bamboo",
      "x": 10,
      "y": 16,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "westScreen-bamboo-4",
      "asset": "bamboo",
      "x": 13,
      "y": 19,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "westScreen-bamboo-5",
      "asset": "bamboo",
      "x": 16,
      "y": 15,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "westScreen-bamboo-6",
      "asset": "bamboo",
      "x": 9,
      "y": 26,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "westScreen-bamboo-7",
      "asset": "bamboo",
      "x": 5,
      "y": 30,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "westScreen-bamboo-8",
      "asset": "bamboo",
      "x": 12,
      "y": 30,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "westScreen-bamboo-9",
      "asset": "bamboo",
      "x": 3,
      "y": 37,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "westScreen-bamboo-10",
      "asset": "bamboo",
      "x": 7,
      "y": 35,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "westScreen-bamboo-11",
      "asset": "bamboo",
      "x": 10,
      "y": 34,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northRim-bamboo-1",
      "asset": "bamboo",
      "x": 18,
      "y": 5,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northRim-bamboo-2",
      "asset": "bamboo",
      "x": 22,
      "y": 3,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northRim-bamboo-3",
      "asset": "bamboo",
      "x": 24,
      "y": 9,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northRim-bamboo-4",
      "asset": "bamboo",
      "x": 28,
      "y": 7,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northRim-bamboo-5",
      "asset": "bamboo",
      "x": 31,
      "y": 2,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northRim-bamboo-6",
      "asset": "bamboo",
      "x": 34,
      "y": 3,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northRim-bamboo-7",
      "asset": "bamboo",
      "x": 49,
      "y": 3,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northRim-bamboo-8",
      "asset": "bamboo",
      "x": 52,
      "y": 5,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northRim-bamboo-9",
      "asset": "bamboo",
      "x": 56,
      "y": 6,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northRim-bamboo-10",
      "asset": "bamboo",
      "x": 59,
      "y": 4,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northRim-bamboo-11",
      "asset": "bamboo",
      "x": 62,
      "y": 8,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northRim-bamboo-12",
      "asset": "bamboo",
      "x": 65,
      "y": 10,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northRim-bamboo-13",
      "asset": "bamboo",
      "x": 68,
      "y": 4,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northRim-bamboo-14",
      "asset": "bamboo",
      "x": 71,
      "y": 3,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northRim-bamboo-15",
      "asset": "bamboo",
      "x": 75,
      "y": 3,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "northRim-bamboo-16",
      "asset": "bamboo",
      "x": 78,
      "y": 7,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southScreen-bamboo-1",
      "asset": "bamboo",
      "x": 3,
      "y": 57,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southScreen-bamboo-2",
      "asset": "bamboo",
      "x": 6,
      "y": 60,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southScreen-bamboo-3",
      "asset": "bamboo",
      "x": 10,
      "y": 54,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southScreen-bamboo-4",
      "asset": "bamboo",
      "x": 12,
      "y": 59,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southScreen-bamboo-5",
      "asset": "bamboo",
      "x": 17,
      "y": 57,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southScreen-bamboo-6",
      "asset": "bamboo",
      "x": 21,
      "y": 56,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southScreen-bamboo-7",
      "asset": "bamboo",
      "x": 24,
      "y": 60,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southScreen-bamboo-8",
      "asset": "bamboo",
      "x": 28,
      "y": 55,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southScreen-bamboo-9",
      "asset": "bamboo",
      "x": 31,
      "y": 57,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southScreen-bamboo-10",
      "asset": "bamboo",
      "x": 48,
      "y": 61,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southScreen-bamboo-11",
      "asset": "bamboo",
      "x": 53,
      "y": 58,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southScreen-bamboo-12",
      "asset": "bamboo",
      "x": 58,
      "y": 56,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southScreen-bamboo-13",
      "asset": "bamboo",
      "x": 61,
      "y": 60,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southScreen-bamboo-14",
      "asset": "bamboo",
      "x": 65,
      "y": 56,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southScreen-bamboo-15",
      "asset": "bamboo",
      "x": 68,
      "y": 59,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southScreen-bamboo-16",
      "asset": "bamboo",
      "x": 72,
      "y": 60,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southScreen-bamboo-17",
      "asset": "bamboo",
      "x": 76,
      "y": 55,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "southScreen-bamboo-18",
      "asset": "bamboo",
      "x": 79,
      "y": 58,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "eastScreen-bamboo-1",
      "asset": "bamboo",
      "x": 79,
      "y": 33,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "eastScreen-bamboo-2",
      "asset": "bamboo",
      "x": 76,
      "y": 35,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "eastScreen-bamboo-3",
      "asset": "bamboo",
      "x": 80,
      "y": 43,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "eastScreen-bamboo-4",
      "asset": "bamboo",
      "x": 77,
      "y": 47,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "eastScreen-bamboo-5",
      "asset": "bamboo",
      "x": 73,
      "y": 46,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "eastScreen-bamboo-6",
      "asset": "bamboo",
      "x": 71,
      "y": 43,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "eastScreen-bamboo-7",
      "asset": "bamboo",
      "x": 68,
      "y": 44,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "eastScreen-bamboo-8",
      "asset": "bamboo",
      "x": 72,
      "y": 51,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "eastScreen-bamboo-9",
      "asset": "bamboo",
      "x": 76,
      "y": 50,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "eastScreen-bamboo-10",
      "asset": "bamboo",
      "x": 80,
      "y": 55,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "springScreen-bamboo-1",
      "asset": "bamboo",
      "x": 29,
      "y": 15,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "springScreen-bamboo-2",
      "asset": "bamboo",
      "x": 28,
      "y": 18,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "springScreen-bamboo-3",
      "asset": "bamboo",
      "x": 27,
      "y": 22,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "springScreen-bamboo-4",
      "asset": "bamboo",
      "x": 55,
      "y": 24,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "springScreen-bamboo-5",
      "asset": "bamboo",
      "x": 51,
      "y": 17,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "springScreen-bamboo-6",
      "asset": "bamboo",
      "x": 54,
      "y": 19,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "campEdges-bamboo-1",
      "asset": "bamboo",
      "x": 17,
      "y": 14,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "campEdges-bamboo-2",
      "asset": "bamboo",
      "x": 17,
      "y": 19,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "campEdges-bamboo-3",
      "asset": "bamboo",
      "x": 30,
      "y": 17,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "campEdges-bamboo-4",
      "asset": "bamboo",
      "x": 30,
      "y": 21,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "campEdges-bamboo-5",
      "asset": "bamboo",
      "x": 51,
      "y": 48,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "campEdges-bamboo-6",
      "asset": "bamboo",
      "x": 51,
      "y": 52,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "campEdges-bamboo-7",
      "asset": "bamboo",
      "x": 67,
      "y": 51,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "campEdges-bamboo-8",
      "asset": "bamboo",
      "x": 66,
      "y": 42,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "campEdges-bamboo-9",
      "asset": "bamboo",
      "x": 62,
      "y": 38,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "campEdges-bamboo-10",
      "asset": "bamboo",
      "x": 77,
      "y": 26,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "campEdges-bamboo-11",
      "asset": "bamboo",
      "x": 77,
      "y": 31,
      "footprint": {
        "w": 0.8,
        "h": 0.65
      }
    },
    {
      "id": "grove-understory-1",
      "asset": "garden-understory",
      "x": 4,
      "y": 10,
      "footprint": null
    },
    {
      "id": "grove-understory-2",
      "asset": "garden-understory",
      "x": 17,
      "y": 9,
      "footprint": null
    },
    {
      "id": "grove-understory-3",
      "asset": "garden-understory",
      "x": 29,
      "y": 5,
      "footprint": null
    },
    {
      "id": "grove-understory-4",
      "asset": "garden-understory",
      "x": 54,
      "y": 10,
      "footprint": null
    },
    {
      "id": "grove-understory-5",
      "asset": "garden-understory",
      "x": 76,
      "y": 8,
      "footprint": null
    },
    {
      "id": "grove-understory-6",
      "asset": "garden-understory",
      "x": 7,
      "y": 58,
      "footprint": null
    },
    {
      "id": "grove-understory-7",
      "asset": "garden-understory",
      "x": 24,
      "y": 56,
      "footprint": null
    },
    {
      "id": "grove-understory-8",
      "asset": "garden-understory",
      "x": 49,
      "y": 59,
      "footprint": null
    },
    {
      "id": "grove-understory-9",
      "asset": "garden-understory",
      "x": 72,
      "y": 57,
      "footprint": null
    },
    {
      "id": "valley-rock-1",
      "asset": "mossy-rock",
      "x": 31,
      "y": 17,
      "footprint": {
        "w": 1.5,
        "h": 1
      }
    },
    {
      "id": "valley-rock-2",
      "asset": "mossy-rock",
      "x": 29,
      "y": 24,
      "footprint": {
        "w": 1.5,
        "h": 1
      }
    },
    {
      "id": "valley-rock-3",
      "asset": "mossy-rock",
      "x": 44,
      "y": 24,
      "footprint": {
        "w": 1.5,
        "h": 1
      }
    },
    {
      "id": "valley-rock-4",
      "asset": "mossy-rock",
      "x": 44,
      "y": 42,
      "footprint": {
        "w": 1.5,
        "h": 1
      }
    },
    {
      "id": "valley-rock-5",
      "asset": "mossy-rock",
      "x": 31,
      "y": 48,
      "footprint": {
        "w": 1.5,
        "h": 1
      }
    },
    {
      "id": "valley-rock-6",
      "asset": "mossy-rock",
      "x": 45,
      "y": 55,
      "footprint": {
        "w": 1.5,
        "h": 1
      }
    },
    {
      "id": "valley-rock-7",
      "asset": "mossy-rock",
      "x": 70,
      "y": 36,
      "footprint": {
        "w": 1.5,
        "h": 1
      }
    },
    {
      "id": "valley-rock-8",
      "asset": "mossy-rock",
      "x": 61,
      "y": 9,
      "footprint": {
        "w": 1.5,
        "h": 1
      }
    },
    {
      "id": "trail-lamp-1",
      "asset": "talisman-lantern",
      "x": 4,
      "y": 41,
      "footprint": null
    },
    {
      "id": "trail-lamp-2",
      "asset": "talisman-lantern",
      "x": 4,
      "y": 49,
      "footprint": null
    },
    {
      "id": "trail-lamp-3",
      "asset": "talisman-lantern",
      "x": 19,
      "y": 43,
      "footprint": null
    },
    {
      "id": "trail-lamp-4",
      "asset": "talisman-lantern",
      "x": 33,
      "y": 32,
      "footprint": null
    },
    {
      "id": "trail-lamp-5",
      "asset": "talisman-lantern",
      "x": 46,
      "y": 32,
      "footprint": null
    },
    {
      "id": "trail-lamp-6",
      "asset": "talisman-lantern",
      "x": 49,
      "y": 36,
      "footprint": null
    },
    {
      "id": "trail-lamp-7",
      "asset": "talisman-lantern",
      "x": 57,
      "y": 36,
      "footprint": null
    },
    {
      "id": "trail-lamp-8",
      "asset": "talisman-lantern",
      "x": 74,
      "y": 16,
      "footprint": null
    },
    {
      "id": "trail-lamp-9",
      "asset": "talisman-lantern",
      "x": 79,
      "y": 20,
      "footprint": null
    }
  ],
  "blockers": [
    {
      "x": 37.499,
      "y": 3.999,
      "w": 3.002,
      "h": 0.502
    },
    {
      "x": 35.999,
      "y": 4.499,
      "w": 6.002,
      "h": 0.502
    },
    {
      "x": 35.499,
      "y": 4.999,
      "w": 7.002,
      "h": 0.502
    },
    {
      "x": 34.999,
      "y": 5.499,
      "w": 8.002,
      "h": 0.502
    },
    {
      "x": 34.499,
      "y": 5.999,
      "w": 9.002,
      "h": 0.502
    },
    {
      "x": 33.999,
      "y": 6.499,
      "w": 10.002,
      "h": 0.502
    },
    {
      "x": 33.499,
      "y": 6.999,
      "w": 11.002,
      "h": 0.502
    },
    {
      "x": 33.499,
      "y": 7.499,
      "w": 11.002,
      "h": 0.502
    },
    {
      "x": 33.499,
      "y": 7.999,
      "w": 11.002,
      "h": 0.502
    },
    {
      "x": 32.999,
      "y": 8.499,
      "w": 12.002,
      "h": 0.502
    },
    {
      "x": 32.999,
      "y": 8.999,
      "w": 12.002,
      "h": 0.502
    },
    {
      "x": 32.999,
      "y": 9.499,
      "w": 12.002,
      "h": 0.502
    },
    {
      "x": 32.999,
      "y": 9.999,
      "w": 12.002,
      "h": 0.502
    },
    {
      "x": 32.999,
      "y": 10.499,
      "w": 12.002,
      "h": 0.502
    },
    {
      "x": 32.999,
      "y": 10.999,
      "w": 12.002,
      "h": 0.502
    },
    {
      "x": 33.499,
      "y": 11.499,
      "w": 11.002,
      "h": 0.502
    },
    {
      "x": 33.499,
      "y": 11.999,
      "w": 11.002,
      "h": 0.502
    },
    {
      "x": 33.499,
      "y": 12.499,
      "w": 11.002,
      "h": 0.502
    },
    {
      "x": 33.999,
      "y": 12.999,
      "w": 10.002,
      "h": 0.502
    },
    {
      "x": 34.499,
      "y": 13.499,
      "w": 9.002,
      "h": 0.502
    },
    {
      "x": 34.999,
      "y": 13.999,
      "w": 8.002,
      "h": 0.502
    },
    {
      "x": 34.999,
      "y": 14.499,
      "w": 7.502,
      "h": 0.502
    },
    {
      "x": 34.999,
      "y": 14.999,
      "w": 7.002,
      "h": 0.502
    },
    {
      "x": 34.999,
      "y": 15.499,
      "w": 5.502,
      "h": 0.502
    },
    {
      "x": 34.999,
      "y": 15.999,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 34.499,
      "y": 16.499,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 34.499,
      "y": 16.999,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 34.499,
      "y": 17.499,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 33.999,
      "y": 17.999,
      "w": 5.002,
      "h": 0.502
    },
    {
      "x": 33.999,
      "y": 18.499,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 33.999,
      "y": 18.999,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 33.499,
      "y": 19.499,
      "w": 5.002,
      "h": 0.502
    },
    {
      "x": 33.499,
      "y": 19.999,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 33.499,
      "y": 20.499,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 32.999,
      "y": 20.999,
      "w": 5.002,
      "h": 0.502
    },
    {
      "x": 32.999,
      "y": 21.499,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 32.999,
      "y": 21.999,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 32.999,
      "y": 22.499,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 32.999,
      "y": 22.999,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 32.999,
      "y": 23.499,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 32.999,
      "y": 23.999,
      "w": 5.002,
      "h": 0.502
    },
    {
      "x": 33.499,
      "y": 24.499,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 33.499,
      "y": 24.999,
      "w": 5.002,
      "h": 0.502
    },
    {
      "x": 33.999,
      "y": 25.499,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 33.999,
      "y": 25.999,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 33.999,
      "y": 26.499,
      "w": 5.002,
      "h": 0.502
    },
    {
      "x": 34.499,
      "y": 26.999,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 34.499,
      "y": 27.499,
      "w": 5.002,
      "h": 0.502
    },
    {
      "x": 34.999,
      "y": 27.999,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 34.999,
      "y": 28.499,
      "w": 5.002,
      "h": 0.502
    },
    {
      "x": 34.999,
      "y": 28.999,
      "w": 5.002,
      "h": 0.502
    },
    {
      "x": 35.499,
      "y": 29.499,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 35.499,
      "y": 29.999,
      "w": 5.002,
      "h": 0.502
    },
    {
      "x": 35.999,
      "y": 30.499,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 35.999,
      "y": 30.999,
      "w": 5.002,
      "h": 0.502
    },
    {
      "x": 36.499,
      "y": 31.499,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 36.499,
      "y": 37.999,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 36.499,
      "y": 38.499,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 36.499,
      "y": 38.999,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 35.999,
      "y": 39.499,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 35.999,
      "y": 39.999,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 35.999,
      "y": 40.499,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 35.499,
      "y": 40.999,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 35.499,
      "y": 41.499,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 35.499,
      "y": 41.999,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 34.999,
      "y": 42.499,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 34.999,
      "y": 42.999,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 34.999,
      "y": 43.499,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 34.499,
      "y": 43.999,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 34.499,
      "y": 44.499,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 34.499,
      "y": 44.999,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 33.999,
      "y": 45.499,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 33.999,
      "y": 45.999,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 33.999,
      "y": 46.499,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 33.999,
      "y": 46.999,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 33.999,
      "y": 47.499,
      "w": 5.002,
      "h": 0.502
    },
    {
      "x": 33.999,
      "y": 47.999,
      "w": 5.002,
      "h": 0.502
    },
    {
      "x": 34.499,
      "y": 48.499,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 34.499,
      "y": 48.999,
      "w": 5.002,
      "h": 0.502
    },
    {
      "x": 34.999,
      "y": 49.499,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 34.999,
      "y": 49.999,
      "w": 5.002,
      "h": 0.502
    },
    {
      "x": 35.499,
      "y": 50.499,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 35.499,
      "y": 50.999,
      "w": 5.002,
      "h": 0.502
    },
    {
      "x": 35.999,
      "y": 51.499,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 35.999,
      "y": 51.999,
      "w": 5.002,
      "h": 0.502
    },
    {
      "x": 36.499,
      "y": 52.499,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 36.499,
      "y": 52.999,
      "w": 5.002,
      "h": 0.502
    },
    {
      "x": 36.499,
      "y": 53.499,
      "w": 5.002,
      "h": 0.502
    },
    {
      "x": 36.999,
      "y": 53.999,
      "w": 5.002,
      "h": 0.502
    },
    {
      "x": 36.999,
      "y": 54.499,
      "w": 5.002,
      "h": 0.502
    },
    {
      "x": 37.499,
      "y": 54.999,
      "w": 5.002,
      "h": 0.502
    },
    {
      "x": 37.499,
      "y": 55.499,
      "w": 5.002,
      "h": 0.502
    },
    {
      "x": 37.999,
      "y": 55.999,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 37.999,
      "y": 56.499,
      "w": 5.002,
      "h": 0.502
    },
    {
      "x": 38.499,
      "y": 56.999,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 38.499,
      "y": 57.499,
      "w": 5.002,
      "h": 0.502
    },
    {
      "x": 38.999,
      "y": 57.999,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 38.999,
      "y": 58.499,
      "w": 5.002,
      "h": 0.502
    },
    {
      "x": 39.499,
      "y": 58.999,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 39.499,
      "y": 59.499,
      "w": 5.002,
      "h": 0.502
    },
    {
      "x": 39.999,
      "y": 59.999,
      "w": 4.502,
      "h": 0.502
    },
    {
      "x": 39.999,
      "y": 60.499,
      "w": 5.002,
      "h": 0.502
    },
    {
      "x": 39.999,
      "y": 60.999,
      "w": 5.002,
      "h": 0.502
    },
    {
      "x": 40.499,
      "y": 61.499,
      "w": 4.502,
      "h": 0.502
    }
  ],
  "npcs": [],
  "portals": [
    {
      "id": "sanctuary-gate",
      "area": {
        "x": 0,
        "y": 44.4,
        "w": 2,
        "h": 1.2
      },
      "arrival": {
        "x": 4,
        "y": 45
      },
      "to": {
        "mapId": "mountain-spirit-sanctuary",
        "portalId": "bamboo-gate"
      },
      "label": {
        "th": "กลับสำนักผนึกบนภูเขา · ตะวันตก",
        "en": "Mountain sanctuary"
      }
    },
    {
      "id": "tea-gate",
      "area": {
        "x": 80,
        "y": 16.4,
        "w": 2,
        "h": 1.2
      },
      "arrival": {
        "x": 78,
        "y": 17
      },
      "to": {
        "mapId": "cloud-tea-slopes",
        "portalId": "bamboo-gate"
      },
      "label": {
        "th": "ไปไร่ชาสันเมฆ · ตะวันออก",
        "en": "Cloud Tea Slopes"
      }
    }
  ],
  "safeZones": [
    {
      "x": 0,
      "y": 39,
      "w": 19,
      "h": 11
    },
    {
      "x": 74,
      "y": 12,
      "w": 8,
      "h": 11
    },
    {
      "x": 47,
      "y": 30,
      "w": 10,
      "h": 9
    }
  ],
  "spawnRegions": [
    {
      "id": "watcher-clearing",
      "area": {
        "x": 18,
        "y": 14,
        "w": 11,
        "h": 11
      },
      "respawnMs": 18000,
      "monsters": [
        {
          "kind": "bamboo-wisp",
          "count": 4
        }
      ]
    },
    {
      "id": "lower-grove",
      "area": {
        "x": 53,
        "y": 44,
        "w": 13,
        "h": 10
      },
      "respawnMs": 21000,
      "monsters": [
        {
          "kind": "bamboo-shadow",
          "count": 4
        }
      ]
    },
    {
      "id": "east-wardens",
      "area": {
        "x": 65,
        "y": 25,
        "w": 10,
        "h": 10
      },
      "respawnMs": 24000,
      "monsters": [
        {
          "kind": "bamboo-guardian",
          "count": 3
        }
      ]
    }
  ]
};
