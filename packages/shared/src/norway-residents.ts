// Provisional Norway residents. Reuses owned wisp/shadow/guardian animation sheets; existing species/stats stay unchanged.
import type{MonsterDefinition}from'./combat.js';
export const NORWAY_RESIDENTS:Readonly<Record<string,MonsterDefinition>>={
  "fjord-wisp": {
    "kind": "fjord-wisp",
    "name": {
      "th": "ภูตคลื่นคราม",
      "en": "fjord-wisp"
    },
    "level": 55,
    "race": "spirit",
    "behavior": "passive",
    "hp": 1940,
    "atk": 135,
    "def": 25,
    "mdef": 25,
    "speed": 1.2,
    "aggroRange": 0,
    "leash": 4,
    "attackRange": 1.3,
    "attackDelayMs": 1700,
    "attackWindupMs": 450,
    "exp": 1210,
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
  "fjord-shadow": {
    "kind": "fjord-shadow",
    "name": {
      "th": "เงาสัตว์พายุ",
      "en": "fjord-shadow"
    },
    "level": 60,
    "race": "brute",
    "behavior": "aggressive",
    "hp": 2260,
    "atk": 155,
    "def": 35,
    "mdef": 33,
    "speed": 2.2,
    "aggroRange": 3.5,
    "leash": 4,
    "attackRange": 1.3,
    "attackDelayMs": 2000,
    "attackWindupMs": 600,
    "exp": 1500,
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
  "fjord-guardian": {
    "kind": "fjord-guardian",
    "name": {
      "th": "ผู้เฝ้าประภาคาร",
      "en": "fjord-guardian"
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
  "timber-wisp": {
    "kind": "timber-wisp",
    "name": {
      "th": "ภูตเรือแตก",
      "en": "timber-wisp"
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
  "timber-shadow": {
    "kind": "timber-shadow",
    "name": {
      "th": "เงาท่าไม้",
      "en": "timber-shadow"
    },
    "level": 65,
    "race": "brute",
    "behavior": "aggressive",
    "hp": 2400,
    "atk": 165,
    "def": 35,
    "mdef": 33,
    "speed": 2.2,
    "aggroRange": 3.5,
    "leash": 4,
    "attackRange": 1.3,
    "attackDelayMs": 2000,
    "attackWindupMs": 600,
    "exp": 1610,
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
  "timber-guardian": {
    "kind": "timber-guardian",
    "name": {
      "th": "ผู้เฝ้าเรือนวิญญาณ",
      "en": "timber-guardian"
    },
    "level": 70,
    "race": "formless",
    "behavior": "aggressive",
    "hp": 2720,
    "atk": 185,
    "def": 45,
    "mdef": 41,
    "speed": 0.9,
    "aggroRange": 3.5,
    "leash": 4,
    "attackRange": 1.3,
    "attackDelayMs": 2300,
    "attackWindupMs": 750,
    "exp": 1900,
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
  "aurora-wisp": {
    "kind": "aurora-wisp",
    "name": {
      "th": "ภูตทะเลสาบหนาว",
      "en": "aurora-wisp"
    },
    "level": 65,
    "race": "spirit",
    "behavior": "passive",
    "hp": 2220,
    "atk": 155,
    "def": 25,
    "mdef": 25,
    "speed": 1.2,
    "aggroRange": 0,
    "leash": 4,
    "attackRange": 1.3,
    "attackDelayMs": 1700,
    "attackWindupMs": 450,
    "exp": 1430,
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
  "aurora-shadow": {
    "kind": "aurora-shadow",
    "name": {
      "th": "เงาพรานช่องเขา",
      "en": "aurora-shadow"
    },
    "level": 72,
    "race": "brute",
    "behavior": "aggressive",
    "hp": 2596,
    "atk": 179,
    "def": 35,
    "mdef": 33,
    "speed": 2.2,
    "aggroRange": 3.5,
    "leash": 4,
    "attackRange": 1.3,
    "attackDelayMs": 2000,
    "attackWindupMs": 600,
    "exp": 1764,
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
  "aurora-guardian": {
    "kind": "aurora-guardian",
    "name": {
      "th": "ผู้เฝ้าลานแสงเหนือ",
      "en": "aurora-guardian"
    },
    "level": 80,
    "race": "formless",
    "behavior": "aggressive",
    "hp": 3000,
    "atk": 205,
    "def": 45,
    "mdef": 41,
    "speed": 0.9,
    "aggroRange": 3.5,
    "leash": 4,
    "attackRange": 1.3,
    "attackDelayMs": 2300,
    "attackWindupMs": 750,
    "exp": 2120,
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
