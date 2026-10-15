// User-requested folklore enemies. ImageGen exception2026-10-15; stats/lore/map bindings provisional.
import type{MonsterDefinition}from'./combat.js';
export const FOLKLORE_RESIDENTS:Readonly<Record<string,MonsterDefinition>>={
  "phi-pret": {
    "kind": "phi-pret",
    "name": {
      "th": "ผีเปรต",
      "en": "Phi Pret"
    },
    "level": 18,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 660,
    "atk": 44,
    "def": 14,
    "mdef": 12,
    "speed": 1.6,
    "aggroRange": 3.5,
    "leash": 5,
    "attackRange": 1.8,
    "attackDelayMs": 1800,
    "attackWindupMs": 125,
    "exp": 432,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    }
  },
  "phi-pop": {
    "kind": "phi-pop",
    "name": {
      "th": "ผีปอบ",
      "en": "Phi Pop"
    },
    "level": 12,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 480,
    "atk": 32,
    "def": 11,
    "mdef": 9,
    "speed": 1.6,
    "aggroRange": 3.5,
    "leash": 5,
    "attackRange": 1.3,
    "attackDelayMs": 1800,
    "attackWindupMs": 125,
    "exp": 288,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    }
  },
  "phi-krasue": {
    "kind": "phi-krasue",
    "name": {
      "th": "ผีกระสือ",
      "en": "Phi Krasue"
    },
    "level": 20,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 720,
    "atk": 48,
    "def": 15,
    "mdef": 13,
    "speed": 2.1,
    "aggroRange": 3.9000000000000004,
    "leash": 5.9,
    "attackRange": 2.6,
    "attackDelayMs": 1800,
    "attackWindupMs": 250,
    "exp": 480,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    },
    "projectile": {
      "speed": 5,
      "family": "spirit",
      "motif": "krasue-embers",
      "originHeight": 0.48,
      "origins": {
        "south": {
          "x": 96,
          "y": 110
        },
        "south-west": {
          "x": 81,
          "y": 122
        },
        "west": {
          "x": 74,
          "y": 123
        },
        "north-west": {
          "x": 73,
          "y": 122
        },
        "north": {
          "x": 96,
          "y": 104
        },
        "north-east": {
          "x": 142,
          "y": 107
        },
        "east": {
          "x": 108,
          "y": 123
        },
        "south-east": {
          "x": 110,
          "y": 122
        }
      }
    }
  },
  "phi-krahang": {
    "kind": "phi-krahang",
    "name": {
      "th": "ผีกระหัง",
      "en": "Phi Krahang"
    },
    "level": 24,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 840,
    "atk": 56,
    "def": 17,
    "mdef": 14,
    "speed": 2.1,
    "aggroRange": 3.5,
    "leash": 5,
    "attackRange": 1.3,
    "attackDelayMs": 1800,
    "attackWindupMs": 250,
    "exp": 576,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    }
  },
  "onryo": {
    "kind": "onryo",
    "name": {
      "th": "วิญญาณอาฆาต",
      "en": "Onryō"
    },
    "level": 42,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 1380,
    "atk": 92,
    "def": 26,
    "mdef": 21,
    "speed": 1.6,
    "aggroRange": 3.5,
    "leash": 5,
    "attackRange": 1.3,
    "attackDelayMs": 1800,
    "attackWindupMs": 125,
    "exp": 1008,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    }
  },
  "yuki-onna": {
    "kind": "yuki-onna",
    "name": {
      "th": "หญิงหิมะ",
      "en": "Yuki-onna"
    },
    "level": 64,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 2040,
    "atk": 136,
    "def": 37,
    "mdef": 30,
    "speed": 1.6,
    "aggroRange": 6.5,
    "leash": 8.5,
    "attackRange": 5.2,
    "attackDelayMs": 1800,
    "attackWindupMs": 250,
    "exp": 1536,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    },
    "projectile": {
      "speed": 6,
      "family": "spirit",
      "motif": "frost-breath",
      "originHeight": 0.54,
      "origins": {
        "south": {
          "x": 96,
          "y": 90
        },
        "south-west": {
          "x": 84,
          "y": 85
        },
        "west": {
          "x": 84,
          "y": 88
        },
        "north-west": {
          "x": 82,
          "y": 88
        },
        "north": {
          "x": 96,
          "y": 89
        },
        "north-east": {
          "x": 109,
          "y": 87
        },
        "east": {
          "x": 107,
          "y": 88
        },
        "south-east": {
          "x": 108,
          "y": 85
        }
      }
    }
  },
  "kuchisake-onna": {
    "kind": "kuchisake-onna",
    "name": {
      "th": "หญิงปากฉีก",
      "en": "Kuchisake-onna"
    },
    "level": 55,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 1770,
    "atk": 118,
    "def": 32,
    "mdef": 27,
    "speed": 1.6,
    "aggroRange": 3.5,
    "leash": 5,
    "attackRange": 1.3,
    "attackDelayMs": 1800,
    "attackWindupMs": 125,
    "exp": 1320,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    }
  },
  "rokurokubi": {
    "kind": "rokurokubi",
    "name": {
      "th": "หญิงคอยาว",
      "en": "Rokurokubi"
    },
    "level": 48,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 1560,
    "atk": 104,
    "def": 29,
    "mdef": 24,
    "speed": 1.6,
    "aggroRange": 3.5,
    "leash": 5,
    "attackRange": 1.3,
    "attackDelayMs": 1800,
    "attackWindupMs": 250,
    "exp": 1152,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    }
  },
  "ubume": {
    "kind": "ubume",
    "name": {
      "th": "อุบุเมะ",
      "en": "Ubume"
    },
    "level": 46,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 1500,
    "atk": 100,
    "def": 28,
    "mdef": 23,
    "speed": 1.6,
    "aggroRange": 4.4,
    "leash": 6.4,
    "attackRange": 3.1,
    "attackDelayMs": 1800,
    "attackWindupMs": 250,
    "exp": 1104,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    },
    "projectile": {
      "speed": 4.5,
      "family": "spirit",
      "motif": "shroud-leaves",
      "originHeight": 0.38,
      "origins": {
        "south": {
          "x": 96,
          "y": 112
        },
        "south-west": {
          "x": 62,
          "y": 111
        },
        "west": {
          "x": 58,
          "y": 110
        },
        "north-west": {
          "x": 53,
          "y": 108
        },
        "north": {
          "x": 96,
          "y": 112
        },
        "north-east": {
          "x": 130,
          "y": 107
        },
        "east": {
          "x": 123,
          "y": 110
        },
        "south-east": {
          "x": 117,
          "y": 112
        }
      }
    }
  },
  "gashadokuro": {
    "kind": "gashadokuro",
    "name": {
      "th": "โครงกระดูกยักษ์",
      "en": "Gashadokuro"
    },
    "level": 65,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 2070,
    "atk": 138,
    "def": 37,
    "mdef": 31,
    "speed": 1.6,
    "aggroRange": 3.5,
    "leash": 5,
    "attackRange": 1.8,
    "attackDelayMs": 1800,
    "attackWindupMs": 250,
    "exp": 1560,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    }
  },
  "cheonyeo-gwishin": {
    "kind": "cheonyeo-gwishin",
    "name": {
      "th": "ผีสาวอาลัย",
      "en": "Cheonyeo Gwishin"
    },
    "level": 40,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 1320,
    "atk": 88,
    "def": 25,
    "mdef": 21,
    "speed": 1.6,
    "aggroRange": 4.7,
    "leash": 6.699999999999999,
    "attackRange": 3.4,
    "attackDelayMs": 1800,
    "attackWindupMs": 125,
    "exp": 960,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    },
    "projectile": {
      "speed": 6.5,
      "family": "binding",
      "motif": "mourning-hair",
      "originHeight": 0.38,
      "origins": {
        "south": {
          "x": 96,
          "y": 85
        },
        "south-west": {
          "x": 81,
          "y": 88
        },
        "west": {
          "x": 76,
          "y": 88
        },
        "north-west": {
          "x": 75,
          "y": 88
        },
        "north": {
          "x": 96,
          "y": 86
        },
        "north-east": {
          "x": 113,
          "y": 87
        },
        "east": {
          "x": 117,
          "y": 90
        },
        "south-east": {
          "x": 116,
          "y": 90
        }
      }
    }
  },
  "mulgwishin": {
    "kind": "mulgwishin",
    "name": {
      "th": "ผีน้ำเกาหลี",
      "en": "Mulgwishin"
    },
    "level": 48,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 1560,
    "atk": 104,
    "def": 29,
    "mdef": 24,
    "speed": 1.6,
    "aggroRange": 5.1,
    "leash": 7.1,
    "attackRange": 3.8,
    "attackDelayMs": 1800,
    "attackWindupMs": 250,
    "exp": 1152,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    },
    "projectile": {
      "speed": 5.5,
      "family": "spirit",
      "motif": "drowned-hand",
      "originHeight": 0.38,
      "origins": {
        "south": {
          "x": 96,
          "y": 110
        },
        "south-west": {
          "x": 71,
          "y": 112
        },
        "west": {
          "x": 73,
          "y": 111
        },
        "north-west": {
          "x": 65,
          "y": 109
        },
        "north": {
          "x": 96,
          "y": 111
        },
        "north-east": {
          "x": 126,
          "y": 109
        },
        "east": {
          "x": 117,
          "y": 111
        },
        "south-east": {
          "x": 123,
          "y": 110
        }
      }
    }
  },
  "dalgyal-gwishin": {
    "kind": "dalgyal-gwishin",
    "name": {
      "th": "ผีหน้าเรียบ",
      "en": "Dalgyal Gwishin"
    },
    "level": 45,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 1470,
    "atk": 98,
    "def": 27,
    "mdef": 23,
    "speed": 1.6,
    "aggroRange": 3.5,
    "leash": 5,
    "attackRange": 1.3,
    "attackDelayMs": 1800,
    "attackWindupMs": 250,
    "exp": 1080,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    }
  },
  "dokkaebi": {
    "kind": "dokkaebi",
    "name": {
      "th": "ทกแกบี",
      "en": "Dokkaebi"
    },
    "level": 52,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 1680,
    "atk": 112,
    "def": 31,
    "mdef": 25,
    "speed": 1.6,
    "aggroRange": 3.5,
    "leash": 5,
    "attackRange": 1.3,
    "attackDelayMs": 1800,
    "attackWindupMs": 250,
    "exp": 1248,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    }
  },
  "gumiho": {
    "kind": "gumiho",
    "name": {
      "th": "จิ้งจอกเก้าหาง",
      "en": "Gumiho"
    },
    "level": 55,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 1770,
    "atk": 118,
    "def": 32,
    "mdef": 27,
    "speed": 1.6,
    "aggroRange": 7.3999999999999995,
    "leash": 9.399999999999999,
    "attackRange": 6.1,
    "attackDelayMs": 1800,
    "attackWindupMs": 250,
    "exp": 1320,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    },
    "projectile": {
      "speed": 8,
      "family": "yantra",
      "motif": "nine-fox-flames",
      "originHeight": 0.38,
      "origins": {
        "south": {
          "x": 96,
          "y": 112
        },
        "south-west": {
          "x": 55,
          "y": 112
        },
        "west": {
          "x": 54,
          "y": 114
        },
        "north-west": {
          "x": 53,
          "y": 116
        },
        "north": {
          "x": 96,
          "y": 116
        },
        "north-east": {
          "x": 142,
          "y": 116
        },
        "east": {
          "x": 137,
          "y": 113
        },
        "south-east": {
          "x": 140,
          "y": 113
        }
      }
    }
  },
  "chonggak-gwishin": {
    "kind": "chonggak-gwishin",
    "name": {
      "th": "ผีหนุ่มอาลัย",
      "en": "Chonggak Gwishin"
    },
    "level": 44,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 1440,
    "atk": 96,
    "def": 27,
    "mdef": 22,
    "speed": 1.6,
    "aggroRange": 4.5,
    "leash": 6.5,
    "attackRange": 3.2,
    "attackDelayMs": 1800,
    "attackWindupMs": 250,
    "exp": 1056,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    },
    "projectile": {
      "speed": 6,
      "family": "binding",
      "motif": "sleeve-knot",
      "originHeight": 0.38,
      "origins": {
        "south": {
          "x": 96,
          "y": 110
        },
        "south-west": {
          "x": 53,
          "y": 109
        },
        "west": {
          "x": 53,
          "y": 110
        },
        "north-west": {
          "x": 55,
          "y": 111
        },
        "north": {
          "x": 96,
          "y": 110
        },
        "north-east": {
          "x": 137,
          "y": 111
        },
        "east": {
          "x": 139,
          "y": 110
        },
        "south-east": {
          "x": 137,
          "y": 110
        }
      }
    }
  },
  "rusalka": {
    "kind": "rusalka",
    "name": {
      "th": "รูซัลกา",
      "en": "Rusalka"
    },
    "level": 66,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 2100,
    "atk": 140,
    "def": 38,
    "mdef": 31,
    "speed": 1.6,
    "aggroRange": 5.7,
    "leash": 7.7,
    "attackRange": 4.4,
    "attackDelayMs": 1800,
    "attackWindupMs": 125,
    "exp": 1584,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    },
    "projectile": {
      "speed": 5.8,
      "family": "spirit",
      "motif": "river-tresses",
      "originHeight": 0.38,
      "origins": {
        "south": {
          "x": 112,
          "y": 103
        },
        "south-west": {
          "x": 68,
          "y": 103
        },
        "west": {
          "x": 88,
          "y": 102
        },
        "north-west": {
          "x": 72,
          "y": 102
        },
        "north": {
          "x": 112,
          "y": 104
        },
        "north-east": {
          "x": 146,
          "y": 102
        },
        "east": {
          "x": 123,
          "y": 104
        },
        "south-east": {
          "x": 150,
          "y": 103
        }
      }
    }
  },
  "leshy": {
    "kind": "leshy",
    "name": {
      "th": "เลชี",
      "en": "Leshy"
    },
    "level": 78,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 2460,
    "atk": 164,
    "def": 44,
    "mdef": 36,
    "speed": 1.6,
    "aggroRange": 3.5,
    "leash": 5,
    "attackRange": 1.3,
    "attackDelayMs": 1800,
    "attackWindupMs": 250,
    "exp": 1872,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    }
  },
  "domovoi": {
    "kind": "domovoi",
    "name": {
      "th": "โดโมวอย",
      "en": "Domovoi"
    },
    "level": 60,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 1920,
    "atk": 128,
    "def": 35,
    "mdef": 29,
    "speed": 1.6,
    "aggroRange": 3.5,
    "leash": 5,
    "attackRange": 1.3,
    "attackDelayMs": 1800,
    "attackWindupMs": 250,
    "exp": 1440,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    }
  },
  "kikimora": {
    "kind": "kikimora",
    "name": {
      "th": "คิคิโมรา",
      "en": "Kikimora"
    },
    "level": 80,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 2520,
    "atk": 168,
    "def": 45,
    "mdef": 37,
    "speed": 1.6,
    "aggroRange": 3.5,
    "leash": 5,
    "attackRange": 1.3,
    "attackDelayMs": 1800,
    "attackWindupMs": 250,
    "exp": 1920,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    }
  },
  "vodyanoy": {
    "kind": "vodyanoy",
    "name": {
      "th": "โวดียานอย",
      "en": "Vodyanoy"
    },
    "level": 85,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 2670,
    "atk": 178,
    "def": 47,
    "mdef": 39,
    "speed": 1.6,
    "aggroRange": 6.1,
    "leash": 8.1,
    "attackRange": 4.8,
    "attackDelayMs": 1800,
    "attackWindupMs": 250,
    "exp": 2040,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    },
    "projectile": {
      "speed": 4.8,
      "family": "spirit",
      "motif": "river-surge",
      "originHeight": 0.38,
      "origins": {
        "south": {
          "x": 96,
          "y": 112
        },
        "south-west": {
          "x": 69,
          "y": 114
        },
        "west": {
          "x": 71,
          "y": 120
        },
        "north-west": {
          "x": 68,
          "y": 117
        },
        "north": {
          "x": 96,
          "y": 116
        },
        "north-east": {
          "x": 116,
          "y": 119
        },
        "east": {
          "x": 113,
          "y": 121
        },
        "south-east": {
          "x": 131,
          "y": 118
        }
      }
    }
  },
  "bannik": {
    "kind": "bannik",
    "name": {
      "th": "บันนิก",
      "en": "Bannik"
    },
    "level": 88,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 2760,
    "atk": 184,
    "def": 49,
    "mdef": 40,
    "speed": 1.6,
    "aggroRange": 3.5,
    "leash": 5,
    "attackRange": 1.3,
    "attackDelayMs": 1800,
    "attackWindupMs": 125,
    "exp": 2112,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    }
  },
  "draugur": {
    "kind": "draugur",
    "name": {
      "th": "ดรอยกูร์",
      "en": "Draugur"
    },
    "level": 62,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 1980,
    "atk": 132,
    "def": 36,
    "mdef": 29,
    "speed": 1.6,
    "aggroRange": 3.5,
    "leash": 5,
    "attackRange": 1.3,
    "attackDelayMs": 1800,
    "attackWindupMs": 250,
    "exp": 1488,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    }
  },
  "afturganga": {
    "kind": "afturganga",
    "name": {
      "th": "อัฟตูร์กังกา",
      "en": "Afturganga"
    },
    "level": 58,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 1860,
    "atk": 124,
    "def": 34,
    "mdef": 28,
    "speed": 1.6,
    "aggroRange": 3.5,
    "leash": 5,
    "attackRange": 1.3,
    "attackDelayMs": 1800,
    "attackWindupMs": 125,
    "exp": 1392,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    }
  },
  "utburdur": {
    "kind": "utburdur",
    "name": {
      "th": "อูตบูร์ดูร์",
      "en": "Útburður"
    },
    "level": 60,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 1920,
    "atk": 128,
    "def": 35,
    "mdef": 29,
    "speed": 1.6,
    "aggroRange": 5.3999999999999995,
    "leash": 7.3999999999999995,
    "attackRange": 4.1,
    "attackDelayMs": 1800,
    "attackWindupMs": 250,
    "exp": 1440,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    },
    "projectile": {
      "speed": 6.2,
      "family": "spirit",
      "motif": "shroud-wail",
      "originHeight": 0.3,
      "origins": {
        "south": {
          "x": 96,
          "y": 119
        },
        "south-west": {
          "x": 80,
          "y": 118
        },
        "west": {
          "x": 74,
          "y": 119
        },
        "north-west": {
          "x": 71,
          "y": 118
        },
        "north": {
          "x": 96,
          "y": 119
        },
        "north-east": {
          "x": 111,
          "y": 118
        },
        "east": {
          "x": 113,
          "y": 119
        },
        "south-east": {
          "x": 108,
          "y": 118
        }
      }
    }
  },
  "uppvakningur": {
    "kind": "uppvakningur",
    "name": {
      "th": "อุปป์วักนิงกูร์",
      "en": "Uppvakningur"
    },
    "level": 68,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 2160,
    "atk": 144,
    "def": 39,
    "mdef": 32,
    "speed": 1.6,
    "aggroRange": 3.5,
    "leash": 5,
    "attackRange": 1.3,
    "attackDelayMs": 1800,
    "attackWindupMs": 250,
    "exp": 1632,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    }
  },
  "sending": {
    "kind": "sending",
    "name": {
      "th": "เซนดิง",
      "en": "Sending"
    },
    "level": 70,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 2220,
    "atk": 148,
    "def": 40,
    "mdef": 33,
    "speed": 1.6,
    "aggroRange": 7.7,
    "leash": 9.7,
    "attackRange": 6.4,
    "attackDelayMs": 1800,
    "attackWindupMs": 250,
    "exp": 1680,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    },
    "projectile": {
      "speed": 8.5,
      "family": "binding",
      "motif": "sent-curse",
      "originHeight": 0.38,
      "origins": {
        "south": {
          "x": 92,
          "y": 87
        },
        "south-west": {
          "x": 94,
          "y": 87
        },
        "west": {
          "x": 101,
          "y": 111
        },
        "north-west": {
          "x": 101,
          "y": 111
        },
        "north": {
          "x": 112,
          "y": 104
        },
        "north-east": {
          "x": 150,
          "y": 109
        },
        "east": {
          "x": 146,
          "y": 110
        },
        "south-east": {
          "x": 136,
          "y": 88
        }
      }
    }
  },
  "tilberi": {
    "kind": "tilberi",
    "name": {
      "th": "ทิลเบริ",
      "en": "Tilberi"
    },
    "level": 64,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 2040,
    "atk": 136,
    "def": 37,
    "mdef": 30,
    "speed": 1.6,
    "aggroRange": 3.5,
    "leash": 5,
    "attackRange": 1.3,
    "attackDelayMs": 1800,
    "attackWindupMs": 250,
    "exp": 1536,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    }
  },
  "jiangshi": {
    "kind": "jiangshi",
    "name": {
      "th": "ผีดิบเจียงซือ",
      "en": "Jiangshi"
    },
    "level": 35,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 1170,
    "atk": 78,
    "def": 22,
    "mdef": 19,
    "speed": 1.6,
    "aggroRange": 3.5,
    "leash": 5,
    "attackRange": 1.3,
    "attackDelayMs": 1800,
    "attackWindupMs": 125,
    "exp": 840,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    }
  },
  "nu-gui": {
    "kind": "nu-gui",
    "name": {
      "th": "นฺหวี่กุ่ย",
      "en": "Nü Gui"
    },
    "level": 38,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 1260,
    "atk": 84,
    "def": 24,
    "mdef": 20,
    "speed": 1.6,
    "aggroRange": 5.5,
    "leash": 7.5,
    "attackRange": 4.2,
    "attackDelayMs": 1800,
    "attackWindupMs": 250,
    "exp": 912,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    },
    "projectile": {
      "speed": 6.4,
      "family": "binding",
      "motif": "crimson-silk",
      "originHeight": 0.38,
      "origins": {
        "south": {
          "x": 96,
          "y": 110
        },
        "south-west": {
          "x": 59,
          "y": 110
        },
        "west": {
          "x": 65,
          "y": 109
        },
        "north-west": {
          "x": 62,
          "y": 108
        },
        "north": {
          "x": 96,
          "y": 109
        },
        "north-east": {
          "x": 116,
          "y": 108
        },
        "east": {
          "x": 111,
          "y": 109
        },
        "south-east": {
          "x": 131,
          "y": 108
        }
      }
    }
  },
  "e-gui": {
    "kind": "e-gui",
    "name": {
      "th": "ผีหิวโหยจีน",
      "en": "E Gui"
    },
    "level": 42,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 1380,
    "atk": 92,
    "def": 26,
    "mdef": 21,
    "speed": 1.6,
    "aggroRange": 3.5,
    "leash": 5,
    "attackRange": 1.3,
    "attackDelayMs": 1800,
    "attackWindupMs": 250,
    "exp": 1008,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    }
  },
  "shui-gui": {
    "kind": "shui-gui",
    "name": {
      "th": "สุ่ยกุ่ย",
      "en": "Shui Gui"
    },
    "level": 36,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 1200,
    "atk": 80,
    "def": 23,
    "mdef": 19,
    "speed": 1.6,
    "aggroRange": 5.2,
    "leash": 7.199999999999999,
    "attackRange": 3.9,
    "attackDelayMs": 1800,
    "attackWindupMs": 250,
    "exp": 864,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    },
    "projectile": {
      "speed": 5.4,
      "family": "spirit",
      "motif": "drowning-grasp",
      "originHeight": 0.38,
      "origins": {
        "south": {
          "x": 96,
          "y": 109
        },
        "south-west": {
          "x": 55,
          "y": 108
        },
        "west": {
          "x": 55,
          "y": 107
        },
        "north-west": {
          "x": 59,
          "y": 107
        },
        "north": {
          "x": 96,
          "y": 109
        },
        "north-east": {
          "x": 122,
          "y": 108
        },
        "east": {
          "x": 125,
          "y": 107
        },
        "south-east": {
          "x": 129,
          "y": 108
        }
      }
    }
  },
  "wutou-gui": {
    "kind": "wutou-gui",
    "name": {
      "th": "ผีไร้หัวจีน",
      "en": "Wutou Gui"
    },
    "level": 44,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 1440,
    "atk": 96,
    "def": 27,
    "mdef": 22,
    "speed": 1.6,
    "aggroRange": 3.5,
    "leash": 5,
    "attackRange": 1.3,
    "attackDelayMs": 1800,
    "attackWindupMs": 250,
    "exp": 1056,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    }
  },
  "huli-jing": {
    "kind": "huli-jing",
    "name": {
      "th": "หูหลีจิง",
      "en": "Huli Jing"
    },
    "level": 45,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 1470,
    "atk": 98,
    "def": 27,
    "mdef": 23,
    "speed": 1.6,
    "aggroRange": 7,
    "leash": 9,
    "attackRange": 5.7,
    "attackDelayMs": 1800,
    "attackWindupMs": 250,
    "exp": 1080,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    },
    "projectile": {
      "speed": 7.8,
      "family": "yantra",
      "motif": "fox-mirage",
      "originHeight": 0.38,
      "origins": {
        "south": {
          "x": 96,
          "y": 98
        },
        "south-west": {
          "x": 52,
          "y": 98
        },
        "west": {
          "x": 49,
          "y": 96
        },
        "north-west": {
          "x": 47,
          "y": 95
        },
        "north": {
          "x": 96,
          "y": 95
        },
        "north-east": {
          "x": 135,
          "y": 96
        },
        "east": {
          "x": 143,
          "y": 96
        },
        "south-east": {
          "x": 130,
          "y": 98
        }
      }
    }
  },
  "draugen": {
    "kind": "draugen",
    "name": {
      "th": "ดรอยเกน",
      "en": "Draugen"
    },
    "level": 65,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 2070,
    "atk": 138,
    "def": 37,
    "mdef": 31,
    "speed": 1.6,
    "aggroRange": 3.5,
    "leash": 5,
    "attackRange": 1.3,
    "attackDelayMs": 1800,
    "attackWindupMs": 250,
    "exp": 1560,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    }
  },
  "huldra": {
    "kind": "huldra",
    "name": {
      "th": "ฮุลทรา",
      "en": "Huldra"
    },
    "level": 64,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 2040,
    "atk": 136,
    "def": 37,
    "mdef": 30,
    "speed": 1.6,
    "aggroRange": 3.5,
    "leash": 5,
    "attackRange": 1.3,
    "attackDelayMs": 1800,
    "attackWindupMs": 250,
    "exp": 1536,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    }
  },
  "nokken": {
    "kind": "nokken",
    "name": {
      "th": "เนิกเคน",
      "en": "Nøkken"
    },
    "level": 70,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 2220,
    "atk": 148,
    "def": 40,
    "mdef": 33,
    "speed": 1.6,
    "aggroRange": 6.7,
    "leash": 8.7,
    "attackRange": 5.4,
    "attackDelayMs": 1800,
    "attackWindupMs": 250,
    "exp": 1680,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    },
    "projectile": {
      "speed": 5.2,
      "family": "spirit",
      "motif": "reed-lure",
      "originHeight": 0.38,
      "origins": {
        "south": {
          "x": 96,
          "y": 109
        },
        "south-west": {
          "x": 61,
          "y": 103
        },
        "west": {
          "x": 59,
          "y": 103
        },
        "north-west": {
          "x": 50,
          "y": 106
        },
        "north": {
          "x": 96,
          "y": 110
        },
        "north-east": {
          "x": 137,
          "y": 105
        },
        "east": {
          "x": 115,
          "y": 103
        },
        "south-east": {
          "x": 114,
          "y": 107
        }
      }
    }
  },
  "fossegrim": {
    "kind": "fossegrim",
    "name": {
      "th": "ฟอสเซกริม",
      "en": "Fossegrim"
    },
    "level": 68,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 2160,
    "atk": 144,
    "def": 39,
    "mdef": 32,
    "speed": 1.6,
    "aggroRange": 8.1,
    "leash": 10.1,
    "attackRange": 6.8,
    "attackDelayMs": 1800,
    "attackWindupMs": 250,
    "exp": 1632,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    },
    "projectile": {
      "speed": 9,
      "family": "spirit",
      "motif": "fiddle-wave",
      "originHeight": 0.34,
      "origins": {
        "south": {
          "x": 105,
          "y": 83
        },
        "south-west": {
          "x": 98,
          "y": 85
        },
        "west": {
          "x": 60,
          "y": 95
        },
        "north-west": {
          "x": 62,
          "y": 90
        },
        "north": {
          "x": 100,
          "y": 100
        },
        "north-east": {
          "x": 113,
          "y": 82
        },
        "east": {
          "x": 102,
          "y": 99
        },
        "south-east": {
          "x": 110,
          "y": 90
        }
      }
    }
  },
  "nisse": {
    "kind": "nisse",
    "name": {
      "th": "นิสเซ",
      "en": "Nisse"
    },
    "level": 62,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 1980,
    "atk": 132,
    "def": 36,
    "mdef": 29,
    "speed": 1.6,
    "aggroRange": 3.5,
    "leash": 5,
    "attackRange": 1.3,
    "attackDelayMs": 1800,
    "attackWindupMs": 250,
    "exp": 1488,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    }
  },
  "mare": {
    "kind": "mare",
    "name": {
      "th": "มาเร",
      "en": "Mare"
    },
    "level": 76,
    "race": "undead",
    "behavior": "aggressive",
    "facingMode": "eight",
    "hp": 2400,
    "atk": 160,
    "def": 43,
    "mdef": 35,
    "speed": 1.6,
    "aggroRange": 5.8999999999999995,
    "leash": 7.8999999999999995,
    "attackRange": 4.6,
    "attackDelayMs": 1800,
    "attackWindupMs": 250,
    "exp": 1824,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.22
      },
      {
        "itemId": "dark-ore",
        "chance": 0.15
      }
    ],
    "wander": {
      "pauseMs": [
        2200,
        4800
      ],
      "radius": 1.3
    },
    "projectile": {
      "speed": 6.8,
      "family": "binding",
      "motif": "nightmare-claw",
      "originHeight": 0.38,
      "origins": {
        "south": {
          "x": 96,
          "y": 103
        },
        "south-west": {
          "x": 59,
          "y": 104
        },
        "west": {
          "x": 77,
          "y": 104
        },
        "north-west": {
          "x": 69,
          "y": 103
        },
        "north": {
          "x": 96,
          "y": 103
        },
        "north-east": {
          "x": 124,
          "y": 104
        },
        "east": {
          "x": 115,
          "y": 104
        },
        "south-east": {
          "x": 133,
          "y": 104
        }
      }
    }
  }
};
export const FOLKLORE_BINDINGS:Readonly<Record<string,{kind:string;campIndex:number;count:number}[]>>={
  "lantern-paddy": [
    {
      "kind": "phi-pret",
      "campIndex": 1,
      "count": 1
    },
    {
      "kind": "phi-pop",
      "campIndex": 0,
      "count": 1
    },
    {
      "kind": "phi-krahang",
      "campIndex": 2,
      "count": 1
    }
  ],
  "monsoon-marsh": [
    {
      "kind": "phi-pret",
      "campIndex": 2,
      "count": 1
    },
    {
      "kind": "phi-krasue",
      "campIndex": 1,
      "count": 1
    }
  ],
  "whispering-spiritwood": [
    {
      "kind": "phi-pop",
      "campIndex": 0,
      "count": 1
    }
  ],
  "moon-mangrove": [
    {
      "kind": "phi-krasue",
      "campIndex": 1,
      "count": 1
    }
  ],
  "mountain-spirit-sanctuary": [
    {
      "kind": "phi-krahang",
      "campIndex": 1,
      "count": 1
    }
  ],
  "cedar-torii-shrine": [
    {
      "kind": "onryo",
      "campIndex": 0,
      "count": 1
    },
    {
      "kind": "rokurokubi",
      "campIndex": 2,
      "count": 1
    }
  ],
  "monsoon-ruins": [
    {
      "kind": "onryo",
      "campIndex": 0,
      "count": 1
    },
    {
      "kind": "kuchisake-onna",
      "campIndex": 1,
      "count": 1
    },
    {
      "kind": "gashadokuro",
      "campIndex": 2,
      "count": 1
    }
  ],
  "snowbound-torii": [
    {
      "kind": "yuki-onna",
      "campIndex": 1,
      "count": 1
    }
  ],
  "spirit-waterfall": [
    {
      "kind": "rokurokubi",
      "campIndex": 0,
      "count": 1
    },
    {
      "kind": "ubume",
      "campIndex": 1,
      "count": 1
    }
  ],
  "frost-pine": [
    {
      "kind": "rusalka",
      "campIndex": 1,
      "count": 1
    },
    {
      "kind": "domovoi",
      "campIndex": 0,
      "count": 1
    }
  ],
  "taiga-blood-trail": [
    {
      "kind": "rusalka",
      "campIndex": 1,
      "count": 1
    },
    {
      "kind": "leshy",
      "campIndex": 2,
      "count": 1
    },
    {
      "kind": "kikimora",
      "campIndex": 0,
      "count": 1
    },
    {
      "kind": "vodyanoy",
      "campIndex": 1,
      "count": 1
    }
  ],
  "winter-seal-kremlin": [
    {
      "kind": "domovoi",
      "campIndex": 0,
      "count": 1
    },
    {
      "kind": "kikimora",
      "campIndex": 1,
      "count": 1
    },
    {
      "kind": "vodyanoy",
      "campIndex": 2,
      "count": 1
    },
    {
      "kind": "bannik",
      "campIndex": 0,
      "count": 1
    }
  ],
  "stone-oath-moor": [
    {
      "kind": "draugur",
      "campIndex": 1,
      "count": 1
    },
    {
      "kind": "uppvakningur",
      "campIndex": 2,
      "count": 1
    }
  ],
  "golden-spiritwood": [
    {
      "kind": "afturganga",
      "campIndex": 0,
      "count": 1
    },
    {
      "kind": "sending",
      "campIndex": 2,
      "count": 1
    }
  ],
  "willow-wake-village": [
    {
      "kind": "utburdur",
      "campIndex": 0,
      "count": 1
    },
    {
      "kind": "tilberi",
      "campIndex": 1,
      "count": 1
    }
  ],
  "mist-bamboo": [
    {
      "kind": "jiangshi",
      "campIndex": 0,
      "count": 1
    },
    {
      "kind": "nu-gui",
      "campIndex": 1,
      "count": 1
    },
    {
      "kind": "shui-gui",
      "campIndex": 2,
      "count": 1
    },
    {
      "kind": "huli-jing",
      "campIndex": 1,
      "count": 1
    }
  ],
  "cloud-tea-slopes": [
    {
      "kind": "jiangshi",
      "campIndex": 0,
      "count": 1
    },
    {
      "kind": "e-gui",
      "campIndex": 1,
      "count": 1
    },
    {
      "kind": "shui-gui",
      "campIndex": 2,
      "count": 1
    },
    {
      "kind": "wutou-gui",
      "campIndex": 1,
      "count": 1
    },
    {
      "kind": "huli-jing",
      "campIndex": 0,
      "count": 1
    }
  ],
  "storm-fjord": [
    {
      "kind": "draugen",
      "campIndex": 0,
      "count": 1
    },
    {
      "kind": "huldra",
      "campIndex": 2,
      "count": 1
    },
    {
      "kind": "nokken",
      "campIndex": 1,
      "count": 1
    },
    {
      "kind": "fossegrim",
      "campIndex": 1,
      "count": 1
    }
  ],
  "spirit-timber-harbor": [
    {
      "kind": "draugen",
      "campIndex": 1,
      "count": 1
    },
    {
      "kind": "nisse",
      "campIndex": 0,
      "count": 1
    }
  ],
  "aurora-pass": [
    {
      "kind": "huldra",
      "campIndex": 0,
      "count": 1
    },
    {
      "kind": "nokken",
      "campIndex": 1,
      "count": 1
    },
    {
      "kind": "mare",
      "campIndex": 2,
      "count": 1
    }
  ]
};
