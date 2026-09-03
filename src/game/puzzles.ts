export type AffixKind = "affix" | "suffix";

export type Puzzle = {
  root: string;
  rootGloss: string;
  correct: string;
  correctType: AffixKind;
  correctGloss: string;
  wrong: { marker: string; gloss: string }[];
  resultWord: string;
  resultGloss: string;
  firstStepComplete: boolean;
};

/** First-step pairs from retr-oq morph-puzzles — verified Kalaallisut. */
export const PUZZLES: Puzzle[] = [
  {
    root: "illu",
    rootGloss: "house, home",
    correct: "qaq",
    correctType: "affix",
    correctGloss: "to have a ___",
    wrong: [
      { marker: "mi", gloss: "in/at" },
      { marker: "t", gloss: "plural" },
    ],
    resultWord: "illoqarpoq",
    resultGloss: "he/she/it has a house",
    firstStepComplete: false,
  },
  {
    root: "nuna",
    rootGloss: "land, country, ground",
    correct: "mi",
    correctType: "suffix",
    correctGloss: "in/at",
    wrong: [{ marker: "qaq", gloss: "to have a ___" }],
    resultWord: "nunami",
    resultGloss: "in/at the land",
    firstStepComplete: true,
  },
  {
    root: "angut",
    rootGloss: "man, male",
    correct: "t",
    correctType: "suffix",
    correctGloss: "plural",
    wrong: [{ marker: "qaq", gloss: "to have a ___" }],
    resultWord: "angutit",
    resultGloss: "men",
    firstStepComplete: true,
  },
  {
    root: "qimmeq",
    rootGloss: "dog",
    correct: "qaq",
    correctType: "affix",
    correctGloss: "to have a ___",
    wrong: [{ marker: "mi", gloss: "in/at" }],
    resultWord: "qimmeqarpunga",
    resultGloss: "I have a dog",
    firstStepComplete: false,
  },
  {
    root: "inuk",
    rootGloss: "person",
    correct: "t",
    correctType: "suffix",
    correctGloss: "plural",
    wrong: [{ marker: "qaq", gloss: "to have a ___" }],
    resultWord: "inuit",
    resultGloss: "people, Inuit",
    firstStepComplete: true,
  },
  {
    root: "inuuik",
    rootGloss: "birthday",
    correct: "sior",
    correctType: "affix",
    correctGloss: "to celebrate ___",
    wrong: [{ marker: "qaq", gloss: "to have a ___" }],
    resultWord: "inuuissiortoq",
    resultGloss: "birthday person",
    firstStepComplete: false,
  },
  {
    root: "illu",
    rootGloss: "house, home",
    correct: "t",
    correctType: "suffix",
    correctGloss: "plural",
    wrong: [{ marker: "qaq", gloss: "to have a ___" }],
    resultWord: "illut",
    resultGloss: "houses",
    firstStepComplete: true,
  },
  {
    root: "illu",
    rootGloss: "house, home",
    correct: "sior",
    correctType: "affix",
    correctGloss: "to look for ___",
    wrong: [{ marker: "qaq", gloss: "to have a ___" }],
    resultWord: "illusiortoq",
    resultGloss: "house-seeker (one looking for a house)",
    firstStepComplete: false,
  },
  {
    root: "nuna",
    rootGloss: "land, country, ground",
    correct: "t",
    correctType: "suffix",
    correctGloss: "plural",
    wrong: [{ marker: "mi", gloss: "in/at" }],
    resultWord: "nunat",
    resultGloss: "lands, countries",
    firstStepComplete: true,
  },
  {
    root: "nuna",
    rootGloss: "land, country, ground",
    correct: "qaq",
    correctType: "affix",
    correctGloss: "to have a ___",
    wrong: [{ marker: "mi", gloss: "in/at" }],
    resultWord: "nunaqarpunga",
    resultGloss: "I have land",
    firstStepComplete: false,
  },
  {
    root: "angut",
    rootGloss: "man, male",
    correct: "mi",
    correctType: "suffix",
    correctGloss: "in/at",
    wrong: [{ marker: "t", gloss: "plural" }],
    resultWord: "angutimi",
    resultGloss: "at/on the man",
    firstStepComplete: true,
  },
  {
    root: "angut",
    rootGloss: "man, male",
    correct: "qaq",
    correctType: "affix",
    correctGloss: "to have a ___",
    wrong: [{ marker: "t", gloss: "plural" }],
    resultWord: "anguteqarpunga",
    resultGloss: "I have a man (with us)",
    firstStepComplete: false,
  },
  {
    root: "qimmeq",
    rootGloss: "dog",
    correct: "mi",
    correctType: "suffix",
    correctGloss: "in/at",
    wrong: [{ marker: "qaq", gloss: "to have a ___" }],
    resultWord: "qimmermi",
    resultGloss: "at/on the dog",
    firstStepComplete: true,
  },
  {
    root: "qimmeq",
    rootGloss: "dog",
    correct: "sior",
    correctType: "affix",
    correctGloss: "to travel on/through ___",
    wrong: [{ marker: "qaq", gloss: "to have a ___" }],
    resultWord: "qimmersiortoq",
    resultGloss: "dog-sledder (one who travels by dog[sled])",
    firstStepComplete: false,
  },
  {
    root: "inuk",
    rootGloss: "person",
    correct: "mi",
    correctType: "suffix",
    correctGloss: "in/at",
    wrong: [{ marker: "t", gloss: "plural" }],
    resultWord: "inummi",
    resultGloss: "at/on the person",
    firstStepComplete: true,
  },
  {
    root: "inuk",
    rootGloss: "person",
    correct: "qaq",
    correctType: "affix",
    correctGloss: "to have a ___",
    wrong: [{ marker: "mi", gloss: "in/at" }],
    resultWord: "inoqarpoq",
    resultGloss: "there are people (it's inhabited)",
    firstStepComplete: false,
  },
  {
    root: "inuuik",
    rootGloss: "birthday",
    correct: "mi",
    correctType: "suffix",
    correctGloss: "in/at",
    wrong: [{ marker: "sior", gloss: "to celebrate ___" }],
    resultWord: "inuuimmi",
    resultGloss: "at/on the birthday",
    firstStepComplete: true,
  },
  {
    root: "inuuik",
    rootGloss: "birthday",
    correct: "qaq",
    correctType: "affix",
    correctGloss: "to have a ___",
    wrong: [{ marker: "sior", gloss: "to celebrate ___" }],
    resultWord: "inuueqarpoq",
    resultGloss: "there's a birthday/occasion",
    firstStepComplete: false,
  },
];

export const ROOTS = [
  { marker: "illu", gloss: "house, home" },
  { marker: "nuna", gloss: "land, country, ground" },
  { marker: "angut", gloss: "man, male" },
  { marker: "qimmeq", gloss: "dog" },
  { marker: "inuk", gloss: "person" },
  { marker: "inuuik", gloss: "birthday" },
] as const;

export const AFFIXES = [
  { marker: "qaq", gloss: "to have a ___" },
  { marker: "mi", gloss: "in/at" },
  { marker: "t", gloss: "plural" },
  { marker: "sior", gloss: "varies with the root" },
] as const;

function unique(items: string[]): string[] {
  return [...new Set(items)];
}

export function puzzleFor(root: string, affix: string): Puzzle | undefined {
  return PUZZLES.find((p) => p.root === root && p.correct === affix);
}

export function partnersFor(kind: "root" | "affix", marker: string): string[] {
  if (kind === "root") {
    return unique(PUZZLES.filter((p) => p.root === marker).map((p) => p.correct));
  }
  return unique(PUZZLES.filter((p) => p.correct === marker).map((p) => p.root));
}

export function pairPuzzle(
  a: { kind: string; marker: string },
  b: { kind: string; marker: string },
): Puzzle | undefined {
  if (a.kind === "root" && b.kind === "affix") return puzzleFor(a.marker, b.marker);
  if (a.kind === "affix" && b.kind === "root") return puzzleFor(b.marker, a.marker);
  return undefined;
}
