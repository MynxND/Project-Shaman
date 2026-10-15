export const SANCTUARY_LAYOUT = {
  "id": "mountain-sanctuary",
  "sourceId": "mountain-sanctuary-composition-01",
  "sourceSha256": "116c483976975422b24007c5d3a61fd0b84bdd0ae088ac387286683aa4caefd9",
  "coordinateSystem": {
    "width": 96,
    "height": 112,
    "unit": "world-unit",
    "origin": "northwest",
    "xPositive": "east",
    "yPositive": "south",
    "worldUnitPx": 32,
    "existingAssetScale": 2,
    "nativePixelsPerWorldUnit": 16,
    "walkSpeedUnitsPerSecond": 4,
    "presentation": "Plan diagram, not a game-camera render. Future camera: elevated three-quarter overhead, upright facades, continuous rectangular world.",
    "elevationInterpretation": "Ordinal terrace levels, not meters or Phaser depth. Preview does not offset plan coordinates by height.",
    "provisionalRiseRenderPxPerLevel": 112
  },
  "terrain": {
    "defaultLevel": 0,
    "regionPolicy": "Highest containing level wins; outer Z1 includes summit Z2. District boundaries are activity masks, not terrain boundaries.",
    "levels": [
      {
        "id": "Z0",
        "level": 0,
        "role": "foothill settlement"
      },
      {
        "id": "Z1",
        "level": 1,
        "role": "teaching and ritual shelf"
      },
      {
        "id": "Z2",
        "level": 2,
        "role": "summit sanctuary"
      }
    ],
    "regions": [
      {
        "id": "teaching-mass",
        "level": 1,
        "polygon": [
          [
            6,
            24
          ],
          [
            16,
            6
          ],
          [
            44,
            2
          ],
          [
            72,
            8
          ],
          [
            88,
            34
          ],
          [
            90,
            54
          ],
          [
            84,
            66
          ],
          [
            80,
            72
          ],
          [
            60,
            76
          ],
          [
            40,
            70
          ],
          [
            20,
            74
          ],
          [
            8,
            62
          ]
        ],
        "material": "dark-grass",
        "composition": "Broad asymmetric shoulder, not repeated rectangular platforms."
      },
      {
        "id": "summit-mass",
        "level": 2,
        "polygon": [
          [
            20,
            8
          ],
          [
            42,
            4
          ],
          [
            68,
            10
          ],
          [
            76,
            22
          ],
          [
            68,
            32
          ],
          [
            52,
            36
          ],
          [
            34,
            30
          ],
          [
            18,
            24
          ]
        ],
        "material": "dark-grass",
        "composition": "Compact crown set back from the ritual shelf; clear temple approach."
      }
    ],
    "cliffEdges": [
      {
        "id": "lower-south-face",
        "upperLevel": 1,
        "lowerLevel": 0,
        "points": [
          [
            8,
            62
          ],
          [
            20,
            74
          ],
          [
            40,
            70
          ],
          [
            60,
            76
          ],
          [
            80,
            72
          ],
          [
            84,
            66
          ]
        ],
        "crossingEdges": [
          "main-lower-stairs",
          "east-return-stairs"
        ],
        "exposure": "south-facing broken contour",
        "requiredModules": [
          "front-cap-body-base",
          "convex-corner",
          "concave-corner",
          "stair-cutout",
          "waterfall-join"
        ]
      },
      {
        "id": "summit-south-face",
        "upperLevel": 2,
        "lowerLevel": 1,
        "points": [
          [
            18,
            24
          ],
          [
            34,
            30
          ],
          [
            52,
            36
          ],
          [
            68,
            32
          ],
          [
            76,
            22
          ]
        ],
        "crossingEdges": [
          "main-upper-stairs"
        ],
        "exposure": "south-facing crown with two lateral returns",
        "requiredModules": [
          "front-cap-body-base",
          "natural-side-return",
          "stair-cutout",
          "waterfall-join"
        ]
      }
    ],
    "transitions": [
      {
        "id": "lower-stair",
        "roadEdge": "main-lower-stairs",
        "bottomNode": "lower-bottom",
        "topNode": "lower-top",
        "width": 4,
        "levels": [
          0,
          1
        ],
        "landingDepth": 3,
        "middleLandingAtFraction": 0.5,
        "geometryStatus": "proposed; stair flights and tread counts require graybox, never stretch a sprite"
      },
      {
        "id": "upper-stair",
        "roadEdge": "main-upper-stairs",
        "bottomNode": "upper-bottom",
        "topNode": "upper-top",
        "width": 4,
        "levels": [
          1,
          2
        ],
        "landingDepth": 3,
        "middleLandingAtFraction": 0.5,
        "geometryStatus": "proposed"
      },
      {
        "id": "east-stair",
        "roadEdge": "east-return-stairs",
        "bottomNode": "east-bottom",
        "topNode": "east-top",
        "width": 3,
        "levels": [
          0,
          1
        ],
        "landingDepth": 3,
        "geometryStatus": "proposed; short supporting spur needed at outer shelf edge"
      }
    ],
    "forbiddenTraversal": [
      "All cliff faces except the three named transition corridors",
      "river and plunge pools except the two named bridges",
      "north spring and outer forest matrix"
    ]
  },
  "districts": [
    {
      "id": "arrival-market",
      "label": "Arrival / Market",
      "level": 0,
      "polygon": [
        [
          34,
          80
        ],
        [
          60,
          80
        ],
        [
          63,
          97
        ],
        [
          56,
          109
        ],
        [
          35,
          109
        ],
        [
          32,
          98
        ]
      ],
      "purpose": "Arrival, provisioning and an unobstructed orientation pause.",
      "landmark": "arrival-gate",
      "adjacent": [
        "west-homes",
        "east-riverside",
        "ritual-court"
      ],
      "story": "Proposed pilgrim provisioning: stall fronts and worn paving; no canonical lore or implemented services."
    },
    {
      "id": "west-homes",
      "label": "West Homes",
      "level": 0,
      "polygon": [
        [
          8,
          79
        ],
        [
          32,
          79
        ],
        [
          32,
          109
        ],
        [
          8,
          109
        ]
      ],
      "purpose": "Three-house shared court and working garden, not a suburban row.",
      "landmark": null,
      "adjacent": [
        "arrival-market"
      ],
      "story": "Shared well/service clearing implied by space; a new well asset is not assumed available."
    },
    {
      "id": "east-riverside",
      "label": "River Quarter",
      "level": 0,
      "polygon": [
        [
          60,
          78
        ],
        [
          91,
          78
        ],
        [
          91,
          109
        ],
        [
          60,
          109
        ]
      ],
      "purpose": "Inn, two homes and riverbank return route.",
      "landmark": "lower-bridge",
      "adjacent": [
        "arrival-market",
        "east-grove"
      ],
      "story": "Raised house kit and fern banks suggest wet ground; flood history is provisional."
    },
    {
      "id": "ritual-court",
      "label": "Ritual Court",
      "level": 1,
      "polygon": [
        [
          35,
          46
        ],
        [
          59,
          46
        ],
        [
          61,
          64
        ],
        [
          37,
          65
        ]
      ],
      "purpose": "Open assembly court and the principal middle-level junction.",
      "landmark": "ritual-disc",
      "adjacent": [
        "training-quarter",
        "teacher-retreat",
        "west-shrine",
        "east-grove",
        "summit-sanctuary"
      ],
      "story": "Few paired ritual pillars frame a large usable floor; no combat mechanics assigned."
    },
    {
      "id": "training-quarter",
      "label": "Training Quarter",
      "level": 1,
      "polygon": [
        [
          17,
          36
        ],
        [
          34,
          36
        ],
        [
          34,
          57
        ],
        [
          17,
          59
        ]
      ],
      "purpose": "Hall and deliberately empty practice apron.",
      "landmark": "training-hall",
      "adjacent": [
        "ritual-court",
        "west-shrine"
      ],
      "story": "Dummy group, repeated wear near hall and restrained bamboo edge."
    },
    {
      "id": "teacher-retreat",
      "label": "Teacher Retreat",
      "level": 1,
      "polygon": [
        [
          55,
          37
        ],
        [
          69,
          37
        ],
        [
          69,
          48
        ],
        [
          55,
          48
        ]
      ],
      "purpose": "A single house, quiet forecourt and small garden.",
      "landmark": "teacher-home",
      "adjacent": [
        "ritual-court",
        "east-grove"
      ],
      "story": "Lower prop density signals privacy; teacher identity and quest remain unapproved."
    },
    {
      "id": "west-shrine",
      "label": "West Shrine",
      "level": 1,
      "polygon": [
        [
          9,
          51
        ],
        [
          18,
          51
        ],
        [
          18,
          63
        ],
        [
          11,
          63
        ]
      ],
      "purpose": "Short optional contemplation destination with visible return.",
      "landmark": "west-shrine-object",
      "adjacent": [
        "training-quarter",
        "ritual-court"
      ],
      "story": "One shrine and worn footpath, not a duplicate plaza."
    },
    {
      "id": "east-grove",
      "label": "Eastern Grove",
      "level": 1,
      "polygon": [
        [
          79,
          38
        ],
        [
          87,
          40
        ],
        [
          88,
          57
        ],
        [
          82,
          66
        ],
        [
          79,
          62
        ]
      ],
      "purpose": "Forest clearing, bridge overlook and descent circuit.",
      "landmark": "grove-tree",
      "adjacent": [
        "teacher-retreat",
        "ritual-court",
        "east-riverside"
      ],
      "story": "One sacred-tree focal specimen; sacred tree is not a repeated filler species."
    },
    {
      "id": "summit-sanctuary",
      "label": "Summit Sanctuary",
      "level": 2,
      "polygon": [
        [
          34,
          10
        ],
        [
          60,
          10
        ],
        [
          64,
          22
        ],
        [
          57,
          29
        ],
        [
          38,
          28
        ],
        [
          31,
          21
        ]
      ],
      "purpose": "Main temple, assembly forecourt and framed view toward the lower town.",
      "landmark": "summit-temple",
      "adjacent": [
        "ritual-court"
      ],
      "story": "Temple silhouette and quiet stone approach carry hierarchy rather than additional gold props."
    }
  ],
  "roadNetwork": {
    "nodes": [
      {
        "id": "spawn",
        "point": [
          48,
          108
        ],
        "level": 0,
        "role": "arrival"
      },
      {
        "id": "gate-pass",
        "point": [
          48,
          103
        ],
        "level": 0,
        "role": "gate clearance"
      },
      {
        "id": "market",
        "point": [
          48,
          89
        ],
        "level": 0,
        "role": "market junction"
      },
      {
        "id": "lower-bottom",
        "point": [
          30,
          76
        ],
        "level": 0,
        "role": "lower stair landing"
      },
      {
        "id": "lower-top",
        "point": [
          30,
          66
        ],
        "level": 1,
        "role": "lower stair landing"
      },
      {
        "id": "ritual",
        "point": [
          48,
          54
        ],
        "level": 1,
        "role": "open assembly junction"
      },
      {
        "id": "upper-bottom",
        "point": [
          40,
          36
        ],
        "level": 1,
        "role": "upper stair landing"
      },
      {
        "id": "upper-top",
        "point": [
          40,
          26
        ],
        "level": 2,
        "role": "upper stair landing"
      },
      {
        "id": "temple-door",
        "point": [
          48,
          22
        ],
        "level": 2,
        "role": "temple forecourt arrival; final door pixel remains unmeasured"
      },
      {
        "id": "training-door",
        "point": [
          26,
          50
        ],
        "level": 1,
        "role": "hall forecourt arrival"
      },
      {
        "id": "teacher-door",
        "point": [
          60,
          45
        ],
        "level": 1,
        "role": "house forecourt arrival"
      },
      {
        "id": "shrine-door",
        "point": [
          14,
          57
        ],
        "level": 1,
        "role": "shrine approach"
      },
      {
        "id": "upper-west-bank",
        "point": [
          68,
          54
        ],
        "level": 1,
        "role": "bridge abutment"
      },
      {
        "id": "upper-east-bank",
        "point": [
          80,
          54
        ],
        "level": 1,
        "role": "bridge abutment"
      },
      {
        "id": "grove",
        "point": [
          82,
          45
        ],
        "level": 1,
        "role": "clearing"
      },
      {
        "id": "east-top",
        "point": [
          82,
          66
        ],
        "level": 1,
        "role": "return stair landing"
      },
      {
        "id": "east-bottom",
        "point": [
          82,
          78
        ],
        "level": 0,
        "role": "return stair landing"
      },
      {
        "id": "lower-east-bank",
        "point": [
          85,
          90
        ],
        "level": 0,
        "role": "bridge abutment"
      },
      {
        "id": "lower-west-bank",
        "point": [
          69,
          90
        ],
        "level": 0,
        "role": "bridge abutment"
      },
      {
        "id": "west-court",
        "point": [
          24,
          98
        ],
        "level": 0,
        "role": "shared residential court"
      },
      {
        "id": "home-w1-door",
        "point": [
          17,
          92
        ],
        "level": 0,
        "role": "door"
      },
      {
        "id": "home-w2-door",
        "point": [
          29,
          93
        ],
        "level": 0,
        "role": "door"
      },
      {
        "id": "home-w3-door",
        "point": [
          17,
          104
        ],
        "level": 0,
        "role": "door"
      },
      {
        "id": "inn-door",
        "point": [
          62,
          84
        ],
        "level": 0,
        "role": "inn forecourt arrival"
      },
      {
        "id": "home-e1-door",
        "point": [
          66,
          102
        ],
        "level": 0,
        "role": "door"
      },
      {
        "id": "home-e2-door",
        "point": [
          86,
          102
        ],
        "level": 0,
        "role": "door"
      },
      {
        "id": "stall-w1-door",
        "point": [
          41,
          87
        ],
        "level": 0,
        "role": "stall approach"
      },
      {
        "id": "stall-e1-door",
        "point": [
          55,
          87
        ],
        "level": 0,
        "role": "stall approach"
      },
      {
        "id": "stall-w2-door",
        "point": [
          41,
          94
        ],
        "level": 0,
        "role": "stall approach"
      },
      {
        "id": "stall-e2-door",
        "point": [
          55,
          94
        ],
        "level": 0,
        "role": "stall approach"
      }
    ],
    "edges": [
      {
        "id": "main-arrival",
        "from": "spawn",
        "to": "gate-pass",
        "class": "main",
        "kind": "road",
        "width": 6,
        "points": [
          [
            48,
            108
          ],
          [
            48,
            103
          ]
        ]
      },
      {
        "id": "main-market",
        "from": "gate-pass",
        "to": "market",
        "class": "main",
        "kind": "road",
        "width": 6,
        "points": [
          [
            48,
            103
          ],
          [
            48,
            89
          ]
        ]
      },
      {
        "id": "main-foothill",
        "from": "market",
        "to": "lower-bottom",
        "class": "main",
        "kind": "road",
        "width": 5,
        "points": [
          [
            48,
            89
          ],
          [
            48,
            78
          ],
          [
            30,
            78
          ],
          [
            30,
            76
          ]
        ]
      },
      {
        "id": "main-lower-stairs",
        "from": "lower-bottom",
        "to": "lower-top",
        "class": "main",
        "kind": "stairs",
        "width": 4,
        "points": [
          [
            30,
            76
          ],
          [
            30,
            66
          ]
        ]
      },
      {
        "id": "main-ritual",
        "from": "lower-top",
        "to": "ritual",
        "class": "main",
        "kind": "road",
        "width": 5,
        "points": [
          [
            30,
            66
          ],
          [
            30,
            61
          ],
          [
            38,
            54
          ],
          [
            48,
            54
          ]
        ]
      },
      {
        "id": "main-summit-approach",
        "from": "ritual",
        "to": "upper-bottom",
        "class": "main",
        "kind": "road",
        "width": 5,
        "points": [
          [
            48,
            54
          ],
          [
            48,
            42
          ],
          [
            40,
            42
          ],
          [
            40,
            36
          ]
        ]
      },
      {
        "id": "main-upper-stairs",
        "from": "upper-bottom",
        "to": "upper-top",
        "class": "main",
        "kind": "stairs",
        "width": 4,
        "points": [
          [
            40,
            36
          ],
          [
            40,
            26
          ]
        ]
      },
      {
        "id": "main-temple",
        "from": "upper-top",
        "to": "temple-door",
        "class": "main",
        "kind": "road",
        "width": 5,
        "points": [
          [
            40,
            26
          ],
          [
            48,
            26
          ],
          [
            48,
            22
          ]
        ]
      },
      {
        "id": "training-link",
        "from": "ritual",
        "to": "training-door",
        "class": "secondary",
        "kind": "road",
        "width": 3,
        "points": [
          [
            48,
            54
          ],
          [
            26,
            54
          ],
          [
            26,
            50
          ]
        ]
      },
      {
        "id": "teacher-link",
        "from": "ritual",
        "to": "teacher-door",
        "class": "secondary",
        "kind": "road",
        "width": 3,
        "points": [
          [
            48,
            54
          ],
          [
            60,
            54
          ],
          [
            60,
            45
          ]
        ]
      },
      {
        "id": "west-shrine-path",
        "from": "lower-top",
        "to": "shrine-door",
        "class": "secondary",
        "kind": "path",
        "width": 2.5,
        "points": [
          [
            30,
            66
          ],
          [
            18,
            64
          ],
          [
            14,
            61
          ],
          [
            14,
            57
          ]
        ]
      },
      {
        "id": "west-shrine-return",
        "from": "shrine-door",
        "to": "training-door",
        "class": "secondary",
        "kind": "path",
        "width": 2.5,
        "points": [
          [
            14,
            57
          ],
          [
            18,
            54
          ],
          [
            26,
            54
          ],
          [
            26,
            50
          ]
        ]
      },
      {
        "id": "east-overlook",
        "from": "ritual",
        "to": "upper-west-bank",
        "class": "secondary",
        "kind": "road",
        "width": 3.5,
        "points": [
          [
            48,
            54
          ],
          [
            68,
            54
          ]
        ]
      },
      {
        "id": "upper-bridge",
        "from": "upper-west-bank",
        "to": "upper-east-bank",
        "class": "secondary",
        "kind": "bridge",
        "width": 3,
        "points": [
          [
            68,
            54
          ],
          [
            80,
            54
          ]
        ]
      },
      {
        "id": "grove-path",
        "from": "upper-east-bank",
        "to": "grove",
        "class": "secondary",
        "kind": "path",
        "width": 2.5,
        "points": [
          [
            80,
            54
          ],
          [
            82,
            50
          ],
          [
            82,
            45
          ]
        ]
      },
      {
        "id": "east-shelf-path",
        "from": "upper-east-bank",
        "to": "east-top",
        "class": "secondary",
        "kind": "path",
        "width": 3,
        "points": [
          [
            80,
            54
          ],
          [
            82,
            60
          ],
          [
            82,
            66
          ]
        ]
      },
      {
        "id": "east-return-stairs",
        "from": "east-top",
        "to": "east-bottom",
        "class": "secondary",
        "kind": "stairs",
        "width": 3,
        "points": [
          [
            82,
            66
          ],
          [
            82,
            78
          ]
        ]
      },
      {
        "id": "riverbank-path",
        "from": "east-bottom",
        "to": "lower-east-bank",
        "class": "secondary",
        "kind": "path",
        "width": 3,
        "points": [
          [
            82,
            78
          ],
          [
            86,
            84
          ],
          [
            85,
            90
          ]
        ]
      },
      {
        "id": "lower-bridge",
        "from": "lower-east-bank",
        "to": "lower-west-bank",
        "class": "secondary",
        "kind": "bridge",
        "width": 3,
        "points": [
          [
            85,
            90
          ],
          [
            69,
            90
          ]
        ]
      },
      {
        "id": "market-return",
        "from": "lower-west-bank",
        "to": "market",
        "class": "secondary",
        "kind": "road",
        "width": 3.5,
        "points": [
          [
            69,
            90
          ],
          [
            60,
            90
          ],
          [
            48,
            89
          ]
        ]
      },
      {
        "id": "west-court-lane",
        "from": "market",
        "to": "west-court",
        "class": "secondary",
        "kind": "road",
        "width": 3,
        "points": [
          [
            48,
            89
          ],
          [
            48,
            98
          ],
          [
            36,
            98
          ],
          [
            24,
            98
          ]
        ]
      },
      {
        "id": "home-w1-lane",
        "from": "west-court",
        "to": "home-w1-door",
        "class": "access",
        "kind": "path",
        "width": 2,
        "points": [
          [
            24,
            98
          ],
          [
            17,
            98
          ],
          [
            17,
            92
          ]
        ]
      },
      {
        "id": "home-w2-lane",
        "from": "west-court",
        "to": "home-w2-door",
        "class": "access",
        "kind": "path",
        "width": 2,
        "points": [
          [
            24,
            98
          ],
          [
            29,
            98
          ],
          [
            29,
            93
          ]
        ]
      },
      {
        "id": "home-w3-lane",
        "from": "west-court",
        "to": "home-w3-door",
        "class": "access",
        "kind": "path",
        "width": 2,
        "points": [
          [
            24,
            98
          ],
          [
            24,
            106
          ],
          [
            17,
            106
          ],
          [
            17,
            104
          ]
        ]
      },
      {
        "id": "inn-lane",
        "from": "lower-west-bank",
        "to": "inn-door",
        "class": "access",
        "kind": "path",
        "width": 2.5,
        "points": [
          [
            69,
            90
          ],
          [
            69,
            85
          ],
          [
            62,
            85
          ],
          [
            62,
            84
          ]
        ]
      },
      {
        "id": "home-e1-lane",
        "from": "lower-west-bank",
        "to": "home-e1-door",
        "class": "access",
        "kind": "path",
        "width": 2,
        "points": [
          [
            69,
            90
          ],
          [
            71,
            94
          ],
          [
            71,
            105
          ],
          [
            66,
            105
          ],
          [
            66,
            102
          ]
        ]
      },
      {
        "id": "home-e2-lane",
        "from": "lower-east-bank",
        "to": "home-e2-door",
        "class": "access",
        "kind": "path",
        "width": 2,
        "points": [
          [
            85,
            90
          ],
          [
            90,
            94
          ],
          [
            90,
            105
          ],
          [
            86,
            105
          ],
          [
            86,
            102
          ]
        ]
      },
      {
        "id": "stall-w1-lane",
        "from": "market",
        "to": "stall-w1-door",
        "class": "access",
        "kind": "path",
        "width": 2,
        "points": [
          [
            48,
            89
          ],
          [
            41,
            89
          ],
          [
            41,
            87
          ]
        ]
      },
      {
        "id": "stall-e1-lane",
        "from": "market",
        "to": "stall-e1-door",
        "class": "access",
        "kind": "path",
        "width": 2,
        "points": [
          [
            48,
            89
          ],
          [
            55,
            89
          ],
          [
            55,
            87
          ]
        ]
      },
      {
        "id": "stall-w2-lane",
        "from": "market",
        "to": "stall-w2-door",
        "class": "access",
        "kind": "path",
        "width": 2,
        "points": [
          [
            48,
            89
          ],
          [
            48,
            96
          ],
          [
            41,
            96
          ],
          [
            41,
            94
          ]
        ]
      },
      {
        "id": "stall-e2-lane",
        "from": "market",
        "to": "stall-e2-door",
        "class": "access",
        "kind": "path",
        "width": 2,
        "points": [
          [
            48,
            89
          ],
          [
            48,
            96
          ],
          [
            55,
            96
          ],
          [
            55,
            94
          ]
        ]
      }
    ],
    "edgeDefaults": {
      "direction": "bidirectional",
      "widthMeaning": "full usable corridor width in world units; excludes facade eaves, banks and props",
      "collisionStatus": "not implemented"
    }
  },
  "landmarks": [
    {
      "id": "summit-temple",
      "point": [
        48,
        19
      ],
      "level": 2,
      "rank": 1,
      "asset": "thai-temple",
      "district": "summit-sanctuary",
      "role": "Destination silhouette; never enlarge asset to fake prominence."
    },
    {
      "id": "ritual-disc",
      "point": [
        48,
        58
      ],
      "level": 1,
      "rank": 2,
      "asset": null,
      "district": "ritual-court",
      "role": "Owned ritual-disc renderer treatment; reserved diagram circle, no new disc PNG assumed."
    },
    {
      "id": "arrival-gate",
      "point": [
        48,
        102
      ],
      "level": 0,
      "rank": 3,
      "asset": "thai-gate",
      "district": "arrival-market",
      "role": "Arrival threshold; separate pillar collision needed in future."
    },
    {
      "id": "training-hall",
      "point": [
        26,
        48
      ],
      "level": 1,
      "rank": 3,
      "asset": "training-hall",
      "district": "training-quarter",
      "role": "Hall fronts a usable practice apron."
    },
    {
      "id": "teacher-home",
      "point": [
        60,
        43
      ],
      "level": 1,
      "rank": 4,
      "asset": "teak-house",
      "district": "teacher-retreat",
      "role": "Quiet retreat off public circulation."
    },
    {
      "id": "west-shrine-object",
      "point": [
        14,
        56
      ],
      "level": 1,
      "rank": 4,
      "asset": "spirit-house",
      "district": "west-shrine",
      "role": "Optional intimate stop."
    },
    {
      "id": "grove-tree",
      "point": [
        84,
        43
      ],
      "level": 1,
      "rank": 3,
      "asset": "sacred-tree",
      "district": "east-grove",
      "role": "Single focal specimen away from the path axis."
    },
    {
      "id": "lower-bridge",
      "point": [
        77,
        90
      ],
      "level": 0,
      "rank": 4,
      "asset": "bridge-h",
      "district": "east-riverside",
      "role": "Return-route threshold; span extension requires modular deck, not stretched art."
    }
  ],
  "buildingClusters": [
    {
      "id": "summit-group",
      "district": "summit-sanctuary",
      "organizer": "temple-door",
      "facadePolicy": "Existing south-facing facade; temple fronts the downhill court.",
      "members": [
        {
          "id": "summit-temple",
          "asset": "thai-temple",
          "base": [
            48,
            19
          ],
          "level": 2,
          "footprint": [
            9.2,
            4.2
          ],
          "entranceNode": "temple-door",
          "forecourtDepth": 6
        }
      ]
    },
    {
      "id": "teaching-group",
      "district": "training-quarter",
      "organizer": "training-door",
      "facadePolicy": "South-facing hall; no mirrored lighting or decorative facade rotation.",
      "members": [
        {
          "id": "training-hall",
          "asset": "training-hall",
          "base": [
            26,
            48
          ],
          "level": 1,
          "footprint": [
            7.6,
            3
          ],
          "entranceNode": "training-door",
          "forecourtDepth": 5
        }
      ]
    },
    {
      "id": "retreat-group",
      "district": "teacher-retreat",
      "organizer": "teacher-door",
      "facadePolicy": "South-facing house with side garden; path branches from court.",
      "members": [
        {
          "id": "teacher-home",
          "asset": "teak-house",
          "base": [
            60,
            43
          ],
          "level": 1,
          "footprint": [
            6.5,
            3
          ],
          "entranceNode": "teacher-door",
          "forecourtDepth": 3
        }
      ]
    },
    {
      "id": "west-court-group",
      "district": "west-homes",
      "organizer": "west-court",
      "facadePolicy": "Three south-facing houses share connected service lanes; offsets serve the courtyard rather than jittering a grid.",
      "members": [
        {
          "id": "home-w1",
          "asset": "teak-house",
          "base": [
            17,
            91
          ],
          "level": 0,
          "footprint": [
            5.8,
            3
          ],
          "entranceNode": "home-w1-door",
          "forecourtDepth": 3
        },
        {
          "id": "home-w2",
          "asset": "stilt-house",
          "base": [
            29,
            92
          ],
          "level": 0,
          "footprint": [
            5.8,
            3
          ],
          "entranceNode": "home-w2-door",
          "forecourtDepth": 3
        },
        {
          "id": "home-w3",
          "asset": "stilt-house",
          "base": [
            17,
            103
          ],
          "level": 0,
          "footprint": [
            5.8,
            3
          ],
          "entranceNode": "home-w3-door",
          "forecourtDepth": 2
        }
      ]
    },
    {
      "id": "river-group",
      "district": "east-riverside",
      "organizer": "lower-west-bank",
      "facadePolicy": "Inn on west bank, two homes share bank routes. Doors and drying yards face lanes, not water.",
      "members": [
        {
          "id": "river-inn",
          "asset": "row-house",
          "base": [
            62,
            82
          ],
          "level": 0,
          "footprint": [
            7.4,
            3
          ],
          "entranceNode": "inn-door",
          "forecourtDepth": 3
        },
        {
          "id": "home-e1",
          "asset": "stilt-house",
          "base": [
            66,
            101
          ],
          "level": 0,
          "footprint": [
            5.8,
            3
          ],
          "entranceNode": "home-e1-door",
          "forecourtDepth": 3
        },
        {
          "id": "home-e2",
          "asset": "stilt-house",
          "base": [
            86,
            101
          ],
          "level": 0,
          "footprint": [
            5.8,
            3
          ],
          "entranceNode": "home-e2-door",
          "forecourtDepth": 3
        }
      ]
    },
    {
      "id": "market-group",
      "district": "arrival-market",
      "organizer": "market",
      "facadePolicy": "Four unchanged south-facing stall fronts on two cross-aisles; two service pockets flank a six-unit central street. Do not pretend these front sprites face east/west.",
      "members": [
        {
          "id": "stall-w1",
          "asset": "market-stall",
          "base": [
            41,
            86
          ],
          "level": 0,
          "footprint": [
            2.6,
            1.4
          ],
          "entranceNode": "stall-w1-door",
          "forecourtDepth": 2
        },
        {
          "id": "stall-e1",
          "asset": "market-stall",
          "base": [
            55,
            86
          ],
          "level": 0,
          "footprint": [
            2.6,
            1.4
          ],
          "entranceNode": "stall-e1-door",
          "forecourtDepth": 2
        },
        {
          "id": "stall-w2",
          "asset": "market-stall",
          "base": [
            41,
            93
          ],
          "level": 0,
          "footprint": [
            2.6,
            1.4
          ],
          "entranceNode": "stall-w2-door",
          "forecourtDepth": 2
        },
        {
          "id": "stall-e2",
          "asset": "market-stall",
          "base": [
            55,
            93
          ],
          "level": 0,
          "footprint": [
            2.6,
            1.4
          ],
          "entranceNode": "stall-e2-door",
          "forecourtDepth": 2
        }
      ]
    }
  ],
  "forestDensityZones": [
    {
      "id": "north-backdrop",
      "polygon": [
        [
          5,
          2
        ],
        [
          31,
          2
        ],
        [
          30,
          13
        ],
        [
          18,
          20
        ],
        [
          8,
          28
        ],
        [
          3,
          22
        ]
      ],
      "canopyCoverageTarget": [
        0.65,
        0.8
      ],
      "walkability": "background matrix; no required routes",
      "speciesRoles": {
        "jungle-tree": "dominant mass",
        "bamboo": "edge accent",
        "sacred-tree": "excluded"
      },
      "understory": "Grouped fern pockets; not one bush per tree."
    },
    {
      "id": "east-backdrop",
      "polygon": [
        [
          89,
          10
        ],
        [
          96,
          10
        ],
        [
          96,
          76
        ],
        [
          91,
          77
        ],
        [
          90,
          58
        ],
        [
          92,
          34
        ]
      ],
      "canopyCoverageTarget": [
        0.65,
        0.8
      ],
      "walkability": "nontraversal matrix",
      "speciesRoles": {
        "jungle-tree": "dominant mass",
        "bamboo": "river-adjacent accent",
        "blossom-tree": "rare accent"
      },
      "understory": "Keep overhanging canopy away from bridge landings."
    },
    {
      "id": "west-edge",
      "polygon": [
        [
          2,
          33
        ],
        [
          8,
          31
        ],
        [
          10,
          47
        ],
        [
          7,
          64
        ],
        [
          11,
          76
        ],
        [
          3,
          78
        ]
      ],
      "canopyCoverageTarget": [
        0.35,
        0.5
      ],
      "walkability": "edge pockets only",
      "speciesRoles": {
        "jungle-tree": "frame",
        "bamboo": "small groves"
      },
      "understory": "Repeated species in irregular lobes with clear gaps."
    },
    {
      "id": "grove-fringe",
      "polygon": [
        [
          80,
          36
        ],
        [
          87,
          38
        ],
        [
          88,
          50
        ],
        [
          85,
          53
        ],
        [
          79,
          49
        ],
        [
          79,
          40
        ]
      ],
      "canopyCoverageTarget": [
        0.25,
        0.4
      ],
      "walkability": "clearing and designed path remain open",
      "speciesRoles": {
        "bamboo": "quiet fringe",
        "sacred-tree": "one landmark at 84,43"
      },
      "understory": "No canopy across grove arrival."
    },
    {
      "id": "foothill-pockets",
      "polygon": [
        [
          4,
          110
        ],
        [
          4,
          82
        ],
        [
          10,
          81
        ],
        [
          10,
          108
        ],
        [
          91,
          108
        ],
        [
          91,
          82
        ],
        [
          95,
          82
        ],
        [
          95,
          112
        ]
      ],
      "canopyCoverageTarget": [
        0.15,
        0.3
      ],
      "walkability": "settlement edge, never service lanes",
      "speciesRoles": {
        "jungle-tree": "clustered edge",
        "blossom-tree": "one accent per selected court, not rainbow checkerboard"
      },
      "understory": "Small fern masses near drainage."
    }
  ],
  "water": {
    "source": {
      "id": "spring",
      "point": [
        67,
        12
      ],
      "level": 2,
      "status": "proposed original geography"
    },
    "segments": [
      {
        "id": "upper-stream",
        "kind": "river",
        "level": 2,
        "width": 3,
        "points": [
          [
            67,
            12
          ],
          [
            68,
            20
          ],
          [
            70,
            27
          ],
          [
            68,
            31
          ]
        ]
      },
      {
        "id": "upper-fall",
        "kind": "waterfall",
        "fromLevel": 2,
        "toLevel": 1,
        "width": 3,
        "points": [
          [
            68,
            31
          ],
          [
            72,
            37
          ]
        ],
        "basin": {
          "center": [
            72,
            39
          ],
          "radii": [
            4,
            3
          ]
        },
        "presentation": "Existing static module candidate only; animation and mist deferred."
      },
      {
        "id": "shelf-stream",
        "kind": "river",
        "level": 1,
        "width": 4,
        "points": [
          [
            72,
            39
          ],
          [
            74,
            47
          ],
          [
            74,
            54
          ],
          [
            73,
            63
          ],
          [
            76,
            72
          ]
        ]
      },
      {
        "id": "lower-fall",
        "kind": "waterfall",
        "fromLevel": 1,
        "toLevel": 0,
        "width": 4,
        "points": [
          [
            76,
            72
          ],
          [
            78,
            79
          ]
        ],
        "basin": {
          "center": [
            78,
            81
          ],
          "radii": [
            4,
            3
          ]
        },
        "presentation": "Static candidate; lip, face and basin joins require review."
      },
      {
        "id": "foothill-river",
        "kind": "river",
        "level": 0,
        "width": 4,
        "points": [
          [
            78,
            81
          ],
          [
            77,
            90
          ],
          [
            78,
            100
          ],
          [
            81,
            112
          ]
        ]
      }
    ],
    "outlet": {
      "point": [
        81,
        112
      ],
      "level": 0
    },
    "bridges": [
      {
        "id": "upper-crossing",
        "roadEdge": "upper-bridge",
        "waterSegment": "shelf-stream",
        "level": 1,
        "crossingPoint": [
          74,
          54
        ],
        "abutments": [
          [
            68,
            54
          ],
          [
            80,
            54
          ]
        ],
        "deckWidth": 3,
        "status": "Proposed same-level banks; graybox support and deck modules required."
      },
      {
        "id": "lower-crossing",
        "roadEdge": "lower-bridge",
        "waterSegment": "foothill-river",
        "level": 0,
        "crossingPoint": [
          77,
          90
        ],
        "abutments": [
          [
            85,
            90
          ],
          [
            69,
            90
          ]
        ],
        "deckWidth": 3,
        "status": "Proposed same-level banks; do not scale one bridge sprite to sixteen units."
      }
    ],
    "banks": "Two-unit no-building margin outside wetted boundary; rock and fern clusters follow bends, not uniform twin strips.",
    "hydrologyStatus": "Conceptual downhill connectivity only; not simulated water, engineered gradients or final collision."
  },
  "reservedNegativeSpace": [
    {
      "id": "arrival-pause",
      "polygon": [
        [
          43,
          104
        ],
        [
          53,
          104
        ],
        [
          53,
          111
        ],
        [
          43,
          111
        ]
      ],
      "purpose": "Uncluttered spawn and initial orientation."
    },
    {
      "id": "market-spine",
      "polygon": [
        [
          45,
          80
        ],
        [
          51,
          80
        ],
        [
          51,
          101
        ],
        [
          45,
          101
        ]
      ],
      "purpose": "Six-unit primary street; stalls and trees remain outside."
    },
    {
      "id": "west-shared-court",
      "polygon": [
        [
          20,
          95
        ],
        [
          27,
          95
        ],
        [
          27,
          102
        ],
        [
          20,
          102
        ]
      ],
      "purpose": "Shared service court and turning room."
    },
    {
      "id": "ritual-floor",
      "polygon": [
        [
          39,
          51
        ],
        [
          57,
          51
        ],
        [
          57,
          63
        ],
        [
          39,
          63
        ]
      ],
      "purpose": "Assembly and crossing; disc is ground detail, not a blocker."
    },
    {
      "id": "practice-apron",
      "polygon": [
        [
          20,
          50
        ],
        [
          32,
          50
        ],
        [
          32,
          57
        ],
        [
          20,
          57
        ]
      ],
      "purpose": "Practice space; dummies only at perimeter in later dressing."
    },
    {
      "id": "temple-forecourt",
      "polygon": [
        [
          39,
          20
        ],
        [
          58,
          20
        ],
        [
          58,
          28
        ],
        [
          39,
          28
        ]
      ],
      "purpose": "Primary hierarchy, assembly and approach; no foreground canopy."
    },
    {
      "id": "grove-clearing",
      "polygon": [
        [
          80,
          45
        ],
        [
          86,
          45
        ],
        [
          86,
          50
        ],
        [
          80,
          50
        ]
      ],
      "purpose": "Quiet arrival; landmark tree is outside this empty floor."
    }
  ],
  "sightlines": [
    {
      "id": "market-to-ascent",
      "from": [
        48,
        89
      ],
      "to": [
        30,
        74
      ],
      "halfWidth": 2,
      "intent": "Road departure and lower stair are legible; no claim temple is visible from spawn."
    },
    {
      "id": "ritual-to-crown",
      "from": [
        48,
        54
      ],
      "to": [
        48,
        19
      ],
      "halfWidth": 3,
      "intent": "Temple roof and upper stair reveal above the shelf; game-camera verification still required."
    },
    {
      "id": "upper-landing-to-temple",
      "from": [
        40,
        26
      ],
      "to": [
        48,
        19
      ],
      "halfWidth": 3,
      "intent": "Full primary facade after final ascent."
    },
    {
      "id": "bridge-to-fall",
      "from": [
        80,
        54
      ],
      "to": [
        71,
        36
      ],
      "halfWidth": 2,
      "intent": "Optional waterfall overlook; grove canopy must not hide the landing."
    }
  ],
  "playerTraversalRoutes": [
    {
      "id": "pilgrim-main",
      "start": "spawn",
      "edges": [
        "main-arrival",
        "main-market",
        "main-foothill",
        "main-lower-stairs",
        "main-ritual",
        "main-summit-approach",
        "main-upper-stairs",
        "main-temple"
      ],
      "experience": "Threshold, working market, west turn, first climb, ritual reveal, final climb, quiet temple court."
    },
    {
      "id": "east-return-loop",
      "start": "market",
      "edges": [
        "main-foothill",
        "main-lower-stairs",
        "main-ritual",
        "east-overlook",
        "upper-bridge",
        "east-shelf-path",
        "east-return-stairs",
        "riverbank-path",
        "lower-bridge",
        "market-return"
      ],
      "experience": "Both sides of the river connected; an alternative descent instead of a decorative bridge."
    },
    {
      "id": "west-contemplation-loop",
      "start": "lower-top",
      "edges": [
        "west-shrine-path",
        "west-shrine-return",
        "training-link",
        "main-ritual"
      ],
      "experience": "Small shrine, practice quarter, ritual court; no duplicate monumental plaza."
    },
    {
      "id": "grove-detour",
      "start": "upper-east-bank",
      "edges": [
        "grove-path"
      ],
      "experience": "Intentional short destination spur; return along the same path."
    }
  ],
  "assetCatalog": [
    {
      "id": "thai-temple",
      "path": "apps/client/public/assets/umbral/objects/thai-temple.png",
      "nativeSize": [
        168,
        173
      ],
      "role": "summit landmark"
    },
    {
      "id": "training-hall",
      "path": "apps/client/public/assets/umbral/objects/training-hall.png",
      "nativeSize": [
        138,
        147
      ],
      "role": "teaching landmark"
    },
    {
      "id": "teak-house",
      "path": "apps/client/public/assets/umbral/objects/teak-house.png",
      "nativeSize": [
        133,
        144
      ],
      "role": "homes and retreat"
    },
    {
      "id": "stilt-house",
      "path": "apps/client/public/assets/umbral/objects/stilt-house.png",
      "nativeSize": [
        91,
        111
      ],
      "role": "homes"
    },
    {
      "id": "row-house",
      "path": "apps/client/public/assets/umbral/objects/row-house.png",
      "nativeSize": [
        150,
        98
      ],
      "role": "inn exterior proposal"
    },
    {
      "id": "market-stall",
      "path": "apps/client/public/assets/umbral/objects/market-stall.png",
      "nativeSize": [
        53,
        48
      ],
      "role": "market"
    },
    {
      "id": "thai-gate",
      "path": "apps/client/public/assets/umbral/objects/thai-gate.png",
      "nativeSize": [
        134,
        150
      ],
      "role": "arrival threshold"
    },
    {
      "id": "spirit-house",
      "path": "apps/client/public/assets/umbral/objects/spirit-house.png",
      "nativeSize": [
        26,
        45
      ],
      "role": "west shrine"
    },
    {
      "id": "sacred-tree",
      "path": "apps/client/public/assets/umbral/objects/sacred-tree.png",
      "nativeSize": [
        115,
        153
      ],
      "role": "one grove landmark"
    },
    {
      "id": "jungle-tree",
      "path": "apps/client/public/assets/umbral/objects/jungle-tree.png",
      "nativeSize": [
        93,
        110
      ],
      "role": "forest mass"
    },
    {
      "id": "bamboo",
      "path": "apps/client/public/assets/umbral/objects/bamboo.png",
      "nativeSize": [
        47,
        78
      ],
      "role": "grove accent"
    },
    {
      "id": "blossom-tree",
      "path": "apps/client/public/assets/umbral/objects/blossom-tree.png",
      "nativeSize": [
        77,
        88
      ],
      "role": "rare settlement accent"
    },
    {
      "id": "bridge-h",
      "path": "apps/client/public/assets/umbral/objects/bridge-h.png",
      "nativeSize": [
        61,
        41
      ],
      "role": "bridge material reference; proposed spans need modular deck"
    },
    {
      "id": "cliff-front",
      "path": "apps/client/public/assets/umbral/candidates/mountain-sanctuary-phase-c/front-module-01.png",
      "nativeSize": [
        64,
        96
      ],
      "role": "candidate cliff material; repetitive and corners incomplete"
    },
    {
      "id": "stairs",
      "path": "apps/client/public/assets/umbral/candidates/mountain-sanctuary-phase-c/stairs-01.png",
      "nativeSize": [
        48,
        64
      ],
      "role": "straight material proof, not finished flight geometry"
    },
    {
      "id": "waterfall",
      "path": "apps/client/public/assets/umbral/candidates/mountain-sanctuary-phase-c/waterfall-01.png",
      "nativeSize": [
        32,
        96
      ],
      "role": "static candidate, not animation"
    }
  ]
} as const;
