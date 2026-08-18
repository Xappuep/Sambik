export const ENEMY_TYPES = Object.freeze({
  BF109: 'bf109',
  FW190: 'fw190',
  FW200: 'fw200',
  SHIP: 'ship',
  BOAT: 'boat',
  SUBMARINE: 'submarine',
  BATTERY: 'battery',
  BUNKER: 'bunker',
  FORMATION: 'formation',
  BOSS: 'boss',
});

export const ENEMY_SCORES = Object.freeze({
  bf109: 500,
  fw190: 800,
  fw200: 5000,
  fw200Engine: 800,
  ship: 1200,
  boat: 400,
  submarine: 1500,
  battery: 600,
  bunker: 300,
  formation: 300,
  boss: 10000,
});

export const FW200_ENGINES = [
  'engineLeftOuter',
  'engineLeftInner',
  'engineRightInner',
  'engineRightOuter',
];
