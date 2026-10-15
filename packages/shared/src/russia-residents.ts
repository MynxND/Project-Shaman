// Provisional Russia variants reuse owned wisp/strawling/guardian animation; original species unchanged.
import type{MonsterDefinition}from'./combat.js';
export const RUSSIA_RESIDENTS:Readonly<Record<string,MonsterDefinition>>={
  "frost-wisp": {
    "kind": "frost-wisp",
    "name": {
      "th": "ภูตสนหนาว",
      "en": "frost-wisp"
    },
    "level": 60,
    "race": "spirit",
    "behavior": "passive",
    "hp": 2080,
    "atk": 145,
    "def": 25,
    "mdef": 25,
    "speed": 1.2,
    "aggroRange": 0,
    "leash": 4,
    "attackRange": 1.3,
    "attackDelayMs": 1700,
    "attackWindupMs": 450,
    "exp": 1320,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.25
      },
      {
        "itemId": "dark-ore",
        "chance": 0.2
      }
    ],
    "wander": {
      "pauseMs": [
        2000,
        4500
      ],
      "radius": 1.4
    }
  },
  "frost-shadow": {
    "kind": "frost-shadow",
    "name": {
      "th": "พยนต์เงาหิมะ",
      "en": "frost-shadow"
    },
    "level": 67,
    "race": "brute",
    "behavior": "aggressive",
    "hp": 2456,
    "atk": 169,
    "def": 35,
    "mdef": 33,
    "speed": 2.2,
    "aggroRange": 3.5,
    "leash": 4,
    "attackRange": 1.3,
    "attackDelayMs": 2000,
    "attackWindupMs": 600,
    "exp": 1654,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.25
      },
      {
        "itemId": "dark-ore",
        "chance": 0.2
      }
    ],
    "wander": {
      "pauseMs": [
        2000,
        4500
      ],
      "radius": 1.4
    }
  },
  "frost-guardian": {
    "kind": "frost-guardian",
    "name": {
      "th": "ผู้เฝ้าบึงเหมันต์",
      "en": "frost-guardian"
    },
    "level": 75,
    "race": "formless",
    "behavior": "aggressive",
    "hp": 2860,
    "atk": 195,
    "def": 45,
    "mdef": 41,
    "speed": 0.9,
    "aggroRange": 3.5,
    "leash": 4,
    "attackRange": 1.3,
    "attackDelayMs": 2300,
    "attackWindupMs": 750,
    "exp": 2010,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.25
      },
      {
        "itemId": "dark-ore",
        "chance": 0.2
      }
    ],
    "wander": {
      "pauseMs": [
        2000,
        4500
      ],
      "radius": 1.4
    }
  },
  "taiga-wisp": {
    "kind": "taiga-wisp",
    "name": {
      "th": "ภูตรอยล่า",
      "en": "taiga-wisp"
    },
    "level": 70,
    "race": "spirit",
    "behavior": "passive",
    "hp": 2360,
    "atk": 165,
    "def": 25,
    "mdef": 25,
    "speed": 1.2,
    "aggroRange": 0,
    "leash": 4,
    "attackRange": 1.3,
    "attackDelayMs": 1700,
    "attackWindupMs": 450,
    "exp": 1540,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.25
      },
      {
        "itemId": "dark-ore",
        "chance": 0.2
      }
    ],
    "wander": {
      "pauseMs": [
        2000,
        4500
      ],
      "radius": 1.4
    }
  },
  "taiga-shadow": {
    "kind": "taiga-shadow",
    "name": {
      "th": "พยนต์พรานหลงทาง",
      "en": "taiga-shadow"
    },
    "level": 78,
    "race": "brute",
    "behavior": "aggressive",
    "hp": 2764,
    "atk": 191,
    "def": 35,
    "mdef": 33,
    "speed": 2.2,
    "aggroRange": 3.5,
    "leash": 4,
    "attackRange": 1.3,
    "attackDelayMs": 2000,
    "attackWindupMs": 600,
    "exp": 1896,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.25
      },
      {
        "itemId": "dark-ore",
        "chance": 0.2
      }
    ],
    "wander": {
      "pauseMs": [
        2000,
        4500
      ],
      "radius": 1.4
    }
  },
  "taiga-guardian": {
    "kind": "taiga-guardian",
    "name": {
      "th": "ผู้เฝ้ารากไทกา",
      "en": "taiga-guardian"
    },
    "level": 85,
    "race": "formless",
    "behavior": "aggressive",
    "hp": 3140,
    "atk": 215,
    "def": 45,
    "mdef": 41,
    "speed": 0.9,
    "aggroRange": 3.5,
    "leash": 4,
    "attackRange": 1.3,
    "attackDelayMs": 2300,
    "attackWindupMs": 750,
    "exp": 2230,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.25
      },
      {
        "itemId": "dark-ore",
        "chance": 0.2
      }
    ],
    "wander": {
      "pauseMs": [
        2000,
        4500
      ],
      "radius": 1.4
    }
  },
  "winter-wisp": {
    "kind": "winter-wisp",
    "name": {
      "th": "ภูตโคมเหมันต์",
      "en": "winter-wisp"
    },
    "level": 75,
    "race": "spirit",
    "behavior": "passive",
    "hp": 2500,
    "atk": 175,
    "def": 25,
    "mdef": 25,
    "speed": 1.2,
    "aggroRange": 0,
    "leash": 4,
    "attackRange": 1.3,
    "attackDelayMs": 1700,
    "attackWindupMs": 450,
    "exp": 1650,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.25
      },
      {
        "itemId": "dark-ore",
        "chance": 0.2
      }
    ],
    "wander": {
      "pauseMs": [
        2000,
        4500
      ],
      "radius": 1.4
    }
  },
  "winter-shadow": {
    "kind": "winter-shadow",
    "name": {
      "th": "พยนต์เฝ้าป้อม",
      "en": "winter-shadow"
    },
    "level": 83,
    "race": "brute",
    "behavior": "aggressive",
    "hp": 2904,
    "atk": 201,
    "def": 35,
    "mdef": 33,
    "speed": 2.2,
    "aggroRange": 3.5,
    "leash": 4,
    "attackRange": 1.3,
    "attackDelayMs": 2000,
    "attackWindupMs": 600,
    "exp": 2006,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.25
      },
      {
        "itemId": "dark-ore",
        "chance": 0.2
      }
    ],
    "wander": {
      "pauseMs": [
        2000,
        4500
      ],
      "radius": 1.4
    }
  },
  "winter-guardian": {
    "kind": "winter-guardian",
    "name": {
      "th": "ผู้พิทักษ์ผนึกหนาว",
      "en": "winter-guardian"
    },
    "level": 90,
    "race": "formless",
    "behavior": "aggressive",
    "hp": 3280,
    "atk": 225,
    "def": 45,
    "mdef": 41,
    "speed": 0.9,
    "aggroRange": 3.5,
    "leash": 4,
    "attackRange": 1.3,
    "attackDelayMs": 2300,
    "attackWindupMs": 750,
    "exp": 2340,
    "drops": [
      {
        "itemId": "bone",
        "chance": 0.25
      },
      {
        "itemId": "dark-ore",
        "chance": 0.2
      }
    ],
    "wander": {
      "pauseMs": [
        2000,
        4500
      ],
      "radius": 1.4
    }
  }
};
