// Reviewed starter set from the January 2026 LBFA event specifications. Codes include
// equipment dimensions so a later rule change creates a new Discipline identity.
// https://www.lbfa.be/uploads/pdf/2026/Epreuves_autorisees_et_caracteristiques_060126.pdf
type Translation = { EN: string; FR: string; NL: string };
type CatalogueDiscipline = {
  code: string;
  measurement: "TIME" | "DISTANCE" | "HEIGHT";
  names: Translation;
};

const metres = [50, 60, 80, 100, 150, 200, 300, 400, 600, 800, 1000, 1500, 2000, 3000, 5000, 10000];
const races: CatalogueDiscipline[] = metres.map((distance) => ({
  code: `${distance}M`,
  measurement: "TIME",
  names: { EN: `${distance} metres`, FR: `${distance} mètres`, NL: `${distance} meter` },
}));

// Distance, hurdle height (mm), number of hurdles, start to first hurdle (cm),
// spacing (cm). The full specification is part of the immutable code and name.
const hurdles: CatalogueDiscipline[] = (
  [
    [50, 686, 4, 1100, 700],
    [50, 762, 4, 1200, 800],
    [50, 838, 4, 1300, 850],
    [50, 838, 4, 1200, 800],
    [50, 914, 4, 1372, 914],
    [50, 914, 4, 1300, 850],
    [50, 991, 4, 1372, 914],
    [50, 1067, 4, 1372, 914],
    [60, 686, 5, 1100, 700],
    [60, 686, 5, 1100, 600],
    [60, 762, 5, 1200, 800],
    [60, 762, 5, 1200, 700],
    [60, 762, 5, 1300, 850],
    [60, 838, 5, 1300, 850],
    [60, 838, 5, 1200, 800],
    [60, 914, 5, 1372, 914],
    [60, 914, 5, 1300, 850],
    [60, 991, 5, 1372, 914],
    [60, 1067, 5, 1372, 914],
    [80, 686, 8, 1200, 700],
    [80, 686, 8, 1100, 600],
    [80, 762, 8, 1200, 800],
    [80, 762, 8, 1200, 700],
    [100, 762, 10, 1300, 850],
    [100, 838, 10, 1300, 850],
    [100, 838, 10, 1200, 800],
    [100, 914, 10, 1300, 850],
    [110, 914, 10, 1372, 914],
    [110, 991, 10, 1372, 914],
    [110, 1067, 10, 1372, 914],
    [150, 686, 3, 4000, 3500],
    [150, 762, 3, 4000, 3500],
    [200, 686, 5, 2000, 3500],
    [300, 686, 7, 5000, 3500],
    [300, 762, 7, 5000, 3500],
    [400, 762, 10, 4500, 3500],
    [400, 838, 10, 4500, 3500],
    [400, 914, 10, 4500, 3500],
  ] as const
).map(([distance, height, count, start, spacing]) => ({
  code: `${distance}MH-${height}MM-${count}H-${start}CM-${spacing}CM`,
  measurement: "TIME",
  names: {
    EN: `${distance} metres hurdles (${height} mm, ${count} hurdles, ${start / 100} m start, ${spacing / 100} m spacing)`,
    FR: `${distance} mètres haies (${height} mm, ${count} haies, départ ${start / 100} m, intervalle ${spacing / 100} m)`,
    NL: `${distance} meter horden (${height} mm, ${count} horden, start ${start / 100} m, tussenafstand ${spacing / 100} m)`,
  },
}));

const steeple: CatalogueDiscipline[] = [
  [1500, 762],
  [2000, 762],
  [2000, 914],
  [3000, 762],
  [3000, 914],
].map(([distance, height]) => ({
  code: `${distance}MST-${height}MM`,
  measurement: "TIME",
  names: {
    EN: `${distance} metres steeplechase (${height} mm)`,
    FR: `${distance} mètres steeple (${height} mm)`,
    NL: `${distance} meter steeple (${height} mm)`,
  },
}));

const throws: CatalogueDiscipline[] = (
  [
    ["SHOT", "Shot put", "Lancer du poids", "Kogelstoten", [2000, 3000, 4000, 5000, 6000, 7260]],
    ["DISCUS", "Discus throw", "Lancer du disque", "Discuswerpen", [750, 1000, 1500, 1750, 2000]],
    [
      "HAMMER",
      "Hammer throw",
      "Lancer du marteau",
      "Kogelslingeren",
      [2000, 3000, 4000, 5000, 6000, 7260],
    ],
    ["JAVELIN", "Javelin throw", "Lancer du javelot", "Speerwerpen", [400, 500, 600, 700, 800]],
  ] as const
).flatMap(([prefix, en, fr, nl, weights]) =>
  weights.map((grams) => ({
    code: `${prefix}-${grams}G`,
    measurement: "DISTANCE" as const,
    names: { EN: `${en} (${grams} g)`, FR: `${fr} (${grams} g)`, NL: `${nl} (${grams} g)` },
  })),
);

export const disciplines: CatalogueDiscipline[] = [
  ...races,
  ...hurdles,
  ...steeple,
  ...throws,
  {
    code: "HIGH-JUMP",
    measurement: "HEIGHT",
    names: { EN: "High jump", FR: "Saut en hauteur", NL: "Hoogspringen" },
  },
  {
    code: "POLE-VAULT",
    measurement: "HEIGHT",
    names: { EN: "Pole vault", FR: "Saut à la perche", NL: "Polsstokspringen" },
  },
  {
    code: "LONG-JUMP",
    measurement: "DISTANCE",
    names: { EN: "Long jump", FR: "Saut en longueur", NL: "Verspringen" },
  },
  {
    code: "TRIPLE-JUMP",
    measurement: "DISTANCE",
    names: { EN: "Triple jump", FR: "Triple saut", NL: "Hink-stap-springen" },
  },
  ...[100, 200, 400, 800, 1500].map((distance): CatalogueDiscipline => ({
    code: `4X${distance}M`,
    measurement: "TIME",
    names: {
      EN: `4 × ${distance} metres relay`,
      FR: `Relais 4 × ${distance} mètres`,
      NL: `4 × ${distance} meter estafette`,
    },
  })),
];

export const ageBands = [
  ["KAN", 6, 7, "Kangaroo", "Kangourou", "Kangoeroe"],
  ["BEN", 8, 9, "Benjamin", "Benjamin", "Benjamin"],
  ["PUP", 10, 11, "Pupil", "Pupille", "Pupil"],
  ["MIN", 12, 13, "Minime", "Minime", "Miniem"],
  ["CAD", 14, 15, "Cadet", "Cadet", "Cadet"],
  ["SCO", 16, 17, "Scholastic", "Scolaire", "Scholier"],
  ["JUN", 18, 19, "Junior", "Junior", "Junior"],
  ["ESP", 20, 22, "Under 23", "Espoir", "Belofte"],
  ["SEN", 23, 34, "Senior", "Senior", "Senior"],
] as const;
