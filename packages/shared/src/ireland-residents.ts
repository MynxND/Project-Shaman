// Provisional Ireland variants reuse owned leaf/strawling/guardian animation; original species unchanged.
import type{MonsterDefinition}from'./combat.js';
export const IRELAND_RESIDENTS:Readonly<Record<string,MonsterDefinition>>={
  "grove-wisp": {
    "kind": "grove-wisp",
    "name": {
      "th": "ภูตใบผลัด",
      "en": "grove-wisp"
    },
    "level": 40,
    "race": "spirit",
    "behavior": "passive",
    "hp": 1520,
    "atk": 105,
    "def": 25,
    "mdef": 25,
    "speed": 1.2,
    "aggroRange": 0,
    "leash": 4,
    "attackRange": 1.3,
    "attackDelayMs": 1700,
    "attackWindupMs": 450,
    "exp": 880,
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
  "grove-shadow": {
    "kind": "grove-shadow",
    "name": {
      "th": "พยนต์รวงใบไม้",
      "en": "grove-shadow"
    },
    "level": 48,
    "race": "brute",
    "behavior": "aggressive",
    "hp": 1924,
    "atk": 131,
    "def": 35,
    "mdef": 33,
    "speed": 2.2,
    "aggroRange": 3.5,
    "leash": 4,
    "attackRange": 1.3,
    "attackDelayMs": 2000,
    "attackWindupMs": 600,
    "exp": 1236,
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
  "grove-guardian": {
    "kind": "grove-guardian",
    "name": {
      "th": "ผู้เฝ้ารากไม้",
      "en": "grove-guardian"
    },
    "level": 55,
    "race": "formless",
    "behavior": "aggressive",
    "hp": 2300,
    "atk": 155,
    "def": 45,
    "mdef": 41,
    "speed": 0.9,
    "aggroRange": 3.5,
    "leash": 4,
    "attackRange": 1.3,
    "attackDelayMs": 2300,
    "attackWindupMs": 750,
    "exp": 1570,
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
  "oath-wisp": {
    "kind": "oath-wisp",
    "name": {
      "th": "ภูตหินหม่น",
      "en": "oath-wisp"
    },
    "level": 50,
    "race": "spirit",
    "behavior": "passive",
    "hp": 1800,
    "atk": 125,
    "def": 25,
    "mdef": 25,
    "speed": 1.2,
    "aggroRange": 0,
    "leash": 4,
    "attackRange": 1.3,
    "attackDelayMs": 1700,
    "attackWindupMs": 450,
    "exp": 1100,
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
  "oath-shadow": {
    "kind": "oath-shadow",
    "name": {
      "th": "พยนต์คำสัตย์",
      "en": "oath-shadow"
    },
    "level": 58,
    "race": "brute",
    "behavior": "aggressive",
    "hp": 2204,
    "atk": 151,
    "def": 35,
    "mdef": 33,
    "speed": 2.2,
    "aggroRange": 3.5,
    "leash": 4,
    "attackRange": 1.3,
    "attackDelayMs": 2000,
    "attackWindupMs": 600,
    "exp": 1456,
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
  "oath-guardian": {
    "kind": "oath-guardian",
    "name": {
      "th": "ผู้เฝ้าหินโบราณ",
      "en": "oath-guardian"
    },
    "level": 65,
    "race": "formless",
    "behavior": "aggressive",
    "hp": 2580,
    "atk": 175,
    "def": 45,
    "mdef": 41,
    "speed": 0.9,
    "aggroRange": 3.5,
    "leash": 4,
    "attackRange": 1.3,
    "attackDelayMs": 2300,
    "attackWindupMs": 750,
    "exp": 1790,
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
  "willow-wisp": {
    "kind": "willow-wisp",
    "name": {
      "th": "ภูตวิลโลว์",
      "en": "willow-wisp"
    },
    "level": 45,
    "race": "spirit",
    "behavior": "passive",
    "hp": 1660,
    "atk": 115,
    "def": 25,
    "mdef": 25,
    "speed": 1.2,
    "aggroRange": 0,
    "leash": 4,
    "attackRange": 1.3,
    "attackDelayMs": 1700,
    "attackWindupMs": 450,
    "exp": 990,
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
  "willow-shadow": {
    "kind": "willow-shadow",
    "name": {
      "th": "พยนต์ม่านฝน",
      "en": "willow-shadow"
    },
    "level": 52,
    "race": "brute",
    "behavior": "aggressive",
    "hp": 2036,
    "atk": 139,
    "def": 35,
    "mdef": 33,
    "speed": 2.2,
    "aggroRange": 3.5,
    "leash": 4,
    "attackRange": 1.3,
    "attackDelayMs": 2000,
    "attackWindupMs": 600,
    "exp": 1324,
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
  "willow-guardian": {
    "kind": "willow-guardian",
    "name": {
      "th": "ผู้เฝ้าชายบึง",
      "en": "willow-guardian"
    },
    "level": 60,
    "race": "formless",
    "behavior": "aggressive",
    "hp": 2440,
    "atk": 165,
    "def": 45,
    "mdef": 41,
    "speed": 0.9,
    "aggroRange": 3.5,
    "leash": 4,
    "attackRange": 1.3,
    "attackDelayMs": 2300,
    "attackWindupMs": 750,
    "exp": 1680,
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
