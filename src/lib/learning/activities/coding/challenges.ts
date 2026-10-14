/**
 * 2G-71 WS C — Coding challenge catalog + language evaluator abstraction.
 * Safe evaluation: Node vm for JavaScript only. No arbitrary host commands.
 * 2P-7: objective / domainTag / conceptHints for content↔concept alignment.
 */

import type { ContentEnrichmentFields } from "@/lib/learning/content-production/enrichment";

export type CodingLanguage = "javascript" | "python" | "java";

export type CodingTestCase = {
  id: string;
  /** Expression or call args for JS harness. */
  args: unknown[];
  expected: unknown;
};

/** Optional learner scaffolds authored on the challenge (2P-12). */
export type CodingChallengeScaffold = {
  kind: "HINT" | "STEP" | "EXAMPLE" | "CHECKLIST" | "CONSTRAINT";
  label: string;
  content: string;
  level?: 1 | 2 | 3;
  revealPolicy?: "ON_REQUEST" | "ALWAYS";
  doesNotRevealAnswer?: boolean;
};

export type CodingChallenge = {
  id: string;
  language: CodingLanguage;
  title: string;
  /** What the learner will demonstrate (2P-7). */
  objective: string;
  prompt: string;
  starter: string;
  /** Entry function name required in submission. */
  entryFunction: string;
  tests: CodingTestCase[];
  /** For non-JS: required substrings for structural pass ratio. */
  requiredPatterns?: string[];
  domainTag?: string;
  conceptHints?: readonly string[];
  /** Content-authored learner support — not an answer key (2P-12). */
  scaffolds?: readonly CodingChallengeScaffold[];
  /** Optional authored success description (2P-12). */
  successLooksLike?: string;
} & ContentEnrichmentFields;

export const CODING_CHALLENGES: CodingChallenge[] = [
  {
    id: "js-sum-two",
    language: "javascript",
    title: "Sum two numbers",
    objective: "Implement a function that correctly adds two numbers.",
    prompt: "Write `add(a, b)` that returns the sum of two numbers.",
    starter: "function add(a, b) {\n  // your code\n}\n",
    entryFunction: "add",
    tests: [
      { id: "t1", args: [2, 3], expected: 5 },
      { id: "t2", args: [0, 0], expected: 0 },
      { id: "t3", args: [-1, 4], expected: 3 },
    ],
    domainTag: "computer science",
    conceptHints: ["add", "sum", "function", "javascript", "arithmetic"],
  },
  {
    id: "js-is-even",
    language: "javascript",
    title: "Is even",
    objective: "Implement a predicate that detects even integers.",
    prompt: "Write `isEven(n)` returning true when n is even.",
    starter: "function isEven(n) {\n  // your code\n}\n",
    entryFunction: "isEven",
    tests: [
      { id: "t1", args: [2], expected: true },
      { id: "t2", args: [3], expected: false },
      { id: "t3", args: [0], expected: true },
    ],
    domainTag: "computer science",
    conceptHints: ["even", "modulo", "boolean", "javascript"],
  },
  {
    id: "py-add",
    language: "python",
    title: "Add (Python sketch)",
    objective: "Sketch a Python function that returns the sum of two values.",
    prompt: "Define `def add(a, b):` returning a + b.",
    starter: "def add(a, b):\n    # your code\n    pass\n",
    entryFunction: "add",
    tests: [],
    requiredPatterns: ["def add", "return"],
    domainTag: "computer science",
    conceptHints: ["python", "add", "function"],
  },
  {
    id: "java-add",
    language: "java",
    title: "Add (Java sketch)",
    objective: "Sketch a Java method that returns the sum of two integers.",
    prompt: "Sketch `int add(int a, int b)` returning a + b.",
    starter:
      "class Solution {\n  public int add(int a, int b) {\n    // your code\n  }\n}\n",
    entryFunction: "add",
    tests: [],
    requiredPatterns: ["int add", "return"],
    domainTag: "computer science",
    conceptHints: ["java", "add", "method"],
  },
  {
    id: "java-inheritance-subclass",
    language: "java",
    title: "Subclass behavior with inheritance",
    objective:
      "Use inheritance to implement behavior in a Java subclass.",
    prompt:
      "Complete `class Dog extends Animal` so `bark()` returns \"woof\". Keep the inheritance relationship (`extends`) and a method body with `return`.",
    starter:
      "class Animal {\n  public String speak() {\n    // superclass behavior\n  }\n}\n\nclass Dog extends Animal {\n  public String bark() {\n    // your code\n  }\n}\n",
    entryFunction: "bark",
    tests: [],
    requiredPatterns: ["extends", "class Dog", "bark", "return"],
    domainTag: "computer science",
    conceptHints: [
      "inheritance",
      "subclass",
      "extends",
      "java",
      "oop",
      "polymorphism",
    ],
    successLooksLike:
      "Your subclass should inherit from the superclass and implement bark() with the required return behavior.",
    misconceptionTargets: [
      "subclass automatically inherits private fields directly",
      "thinking inheritance copies methods without an extends relationship",
    ],
    accessibility: {
      altDescription:
        "Complete a Dog subclass that extends Animal and implements bark().",
      reducedComplexity: true,
    },
    scaffolds: [
      {
        kind: "HINT",
        label: "Inheritance relationship",
        content:
          "Decide which class is the superclass and which is the subclass before writing the method body.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
      {
        kind: "HINT",
        label: "Subclass keyword",
        content:
          "The prompt asks for a subclass that inherits behavior — look for the language keyword that expresses inheritance.",
        level: 2,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
      {
        kind: "STEP",
        label: "Approach",
        content:
          "1) Keep the Animal / Dog relationship from the starter. 2) Complete the bark() method body. 3) Return the value the prompt asks for — do not remove extends.",
        level: 3,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
  },
  {
    id: "java-exception-try-catch",
    language: "java",
    title: "Handle a checked exception with try/catch",
    objective:
      "Use try/catch so a method handles a failing operation without crashing the caller.",
    prompt:
      "Complete `safeParseInt(String raw)` so it uses try/catch around Integer.parseInt. On success return the parsed int; on NumberFormatException return -1. Keep the method signature and a catch for NumberFormatException.",
    starter:
      "class Parser {\n  public int safeParseInt(String raw) {\n    // your code: try Integer.parseInt(raw); catch NumberFormatException → -1\n  }\n}\n",
    entryFunction: "safeParseInt",
    tests: [],
    requiredPatterns: ["try", "catch", "NumberFormatException", "return"],
    domainTag: "computer science",
    conceptHints: [
      "exception",
      "exceptions",
      "try",
      "catch",
      "java",
      "error handling",
    ],
    misconceptionTargets: [
      "catching Exception hides all errors",
      "returning null instead of a sentinel for parse failure",
    ],
    successLooksLike:
      "Your method should attempt parsing inside try, catch NumberFormatException specifically, and return -1 on failure.",
    accessibility: {
      altDescription:
        "Write a Java method that safely parses a string to an integer using try and catch.",
      reducedComplexity: true,
      extendedTimeSuggested: true,
      interactionNote: "Text editor challenge; no timed auto-submit.",
    },
    scaffolds: [
      {
        kind: "HINT",
        label: "What can fail",
        content:
          "Integer.parseInt throws when the string is not a valid integer — catch that specific exception type.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
      {
        kind: "STEP",
        label: "Structure",
        content:
          "1) try { return Integer.parseInt(raw); } 2) catch NumberFormatException 3) return the failure sentinel from the prompt.",
        level: 2,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
  },
  {
    id: "js-debug-off-by-one",
    language: "javascript",
    title: "Debug an off-by-one sum",
    objective:
      "Fix a buggy loop so the sum includes every index from 0 through n-1 exactly once.",
    prompt:
      "The starter for `sumTo(n)` is wrong (off-by-one). Fix it so sumTo(3) returns 0+1+2 = 3, and sumTo(1) returns 0. Do not change the function name.",
    starter:
      "function sumTo(n) {\n  let total = 0;\n  // BUG: loop bound is wrong — fix the off-by-one\n  for (let i = 0; i <= n; i++) {\n    total += i;\n  }\n  return total;\n}\n",
    entryFunction: "sumTo",
    tests: [
      { id: "t1", args: [3], expected: 3 },
      { id: "t2", args: [1], expected: 0 },
      { id: "t3", args: [5], expected: 10 },
    ],
    domainTag: "computer science",
    conceptHints: [
      "debug",
      "debugging",
      "off-by-one",
      "loop",
      "javascript",
      "bug",
    ],
    misconceptionTargets: [
      "inclusive upper bound always includes n",
      "summing 1..n when the prompt asks for 0..n-1",
    ],
    successLooksLike:
      "After the fix, sumTo(n) should total integers from 0 inclusive to n exclusive.",
    accessibility: {
      altDescription:
        "Fix a JavaScript loop bug so the sum covers the correct range of indices.",
      extendedTimeSuggested: true,
    },
    scaffolds: [
      {
        kind: "HINT",
        label: "Read the expected cases",
        content:
          "sumTo(3) must be 3, not 6 — that tells you whether n itself should be included.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
      {
        kind: "CONSTRAINT",
        label: "Keep the harness",
        content: "Keep the function name sumTo so the test harness can call it.",
        level: 1,
        revealPolicy: "ALWAYS",
        doesNotRevealAnswer: true,
      },
    ],
  },
  {
    id: "java-equals-vs-eq",
    language: "java",
    title: "Prefer equals for string content",
    objective:
      "Compare string content with equals rather than == in a Java sketch.",
    prompt:
      "Complete `boolean sameText(String a, String b)` so it returns true when a and b have the same characters. Use equals (not ==). Handle null safely by returning false if either argument is null.",
    starter:
      "class TextCompare {\n  public boolean sameText(String a, String b) {\n    // prefer equals for content; avoid == for objects\n  }\n}\n",
    entryFunction: "sameText",
    tests: [],
    requiredPatterns: ["equals", "return", "null"],
    domainTag: "computer science",
    conceptHints: [
      "equals",
      "==",
      "string",
      "java",
      "identity",
      "oop",
    ],
    misconceptionTargets: [
      "using == to compare String contents",
      "forgetting null checks before equals",
    ],
    successLooksLike:
      "Your method should reject nulls and compare content with equals.",
    scaffolds: [
      {
        kind: "HINT",
        label: "== vs equals",
        content:
          "== asks whether two references point to the same object; equals asks about value/content for many types including String.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    accessibility: {
      altDescription:
        "Write a Java method that compares two strings by content using equals.",
      reducedComplexity: true,
    },
  },
  {
    id: "java-override-vs-overload",
    language: "java",
    title: "Override with matching signature",
    objective:
      "Override a superclass method with a matching signature (not an overload).",
    prompt:
      "Class Animal has `String speak()`. In `class Cat extends Animal`, override speak so it returns \"meow\". Keep @Override and the same parameter list — do not add extra parameters (that would overload, not override).",
    starter:
      "class Animal {\n  public String speak() {\n    return \"...\";\n  }\n}\n\nclass Cat extends Animal {\n  // override speak() — matching signature\n}\n",
    entryFunction: "speak",
    tests: [],
    requiredPatterns: ["extends", "@Override", "speak", "return"],
    domainTag: "computer science",
    conceptHints: [
      "override",
      "overload",
      "inheritance",
      "java",
      "polymorphism",
    ],
    misconceptionTargets: [
      "changing parameter lists and calling it an override",
    ],
    successLooksLike:
      "Cat.speak should override Animal.speak with the same signature and return meow.",
    scaffolds: [
      {
        kind: "HINT",
        label: "Signature match",
        content:
          "Overriding keeps the same method name and parameter types; adding parameters creates an overload instead.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
  },
  {
    id: "js-map-filter-pipeline",
    language: "javascript",
    title: "Map then filter",
    objective:
      "Transform an array with map, then keep matching values with filter.",
    prompt:
      "Write `evenDoubled(nums)` that doubles each number, then keeps only even results. Example: [1,2,3] → double to [2,4,6] → keep evens [2,4,6].",
    starter:
      "function evenDoubled(nums) {\n  // map then filter\n}\n",
    entryFunction: "evenDoubled",
    tests: [
      { id: "t1", args: [[1, 2, 3]], expected: [2, 4, 6] },
      { id: "t2", args: [[2, 5]], expected: [4] },
      { id: "t3", args: [[]], expected: [] },
    ],
    domainTag: "computer science",
    conceptHints: ["map", "filter", "array", "javascript", "pipeline"],
    successLooksLike:
      "Compose map for doubling and filter for even values without mutating incorrectly.",
    scaffolds: [
      {
        kind: "HINT",
        label: "Order",
        content: "Transform first, then decide what to keep — map before filter.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
  },
  {
    id: "java-inheritance-vehicle",
    language: "java",
    title: "Vehicle hierarchy inheritance",
    objective:
      "Apply inheritance so a Car subclass extends Vehicle and implements drive behavior.",
    prompt:
      "Complete `class Car extends Vehicle` so `drive()` returns \"rolling\". Keep `extends` and a method body with `return`. Do not remove the superclass.",
    starter:
      "class Vehicle {\n  public String move() {\n    return \"...\";\n  }\n}\n\nclass Car extends Vehicle {\n  public String drive() {\n    // your code\n  }\n}\n",
    entryFunction: "drive",
    tests: [],
    requiredPatterns: ["extends", "class Car", "drive", "return"],
    domainTag: "computer science",
    conceptHints: [
      "inheritance",
      "subclass",
      "extends",
      "java",
      "oop",
      "vehicle",
    ],
    misconceptionTargets: [
      "subclass automatically inherits private fields directly",
      "forgetting extends when creating a subclass",
    ],
    successLooksLike:
      "Car extends Vehicle and drive() returns the required string without dropping the inheritance relationship.",
    accessibility: {
      altDescription:
        "Complete a Car subclass that inherits from Vehicle and implements drive().",
      reducedComplexity: true,
    },
    scaffolds: [
      {
        kind: "HINT",
        label: "Same pattern, new names",
        content:
          "This is the same inheritance idea as Animal/Dog — only the type names changed to Vehicle/Car.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
  },
  {
    id: "java-polymorphism-challenge",
    language: "java",
    title: "Polymorphic speak challenge",
    objective:
      "Override speak() in two subclasses so polymorphic calls return distinct strings.",
    prompt:
      "Challenge (minimal scaffolding): Animal has `String speak()`. Complete Dog and Cat so each overrides speak() returning \"woof\" and \"meow\". Keep @Override and matching signatures. Do not add extra parameters.",
    starter:
      "class Animal {\n  public String speak() {\n    return \"...\";\n  }\n}\n\nclass Dog extends Animal {\n  // override speak → woof\n}\n\nclass Cat extends Animal {\n  // override speak → meow\n}\n",
    entryFunction: "speak",
    tests: [],
    requiredPatterns: ["extends", "@Override", "speak", "woof", "meow"],
    domainTag: "computer science",
    conceptHints: [
      "polymorphism",
      "override",
      "inheritance",
      "java",
      "oop",
    ],
    misconceptionTargets: [
      "changing parameter lists and calling it an override",
      "assuming the superclass speak body runs instead of the subclass override",
    ],
    successLooksLike:
      "Dog and Cat each override speak with matching signatures and return woof/meow respectively.",
    // Intentionally lean scaffolding for CHALLENGE difficulty
    scaffolds: [
      {
        kind: "HINT",
        label: "Signature reminder",
        content:
          "Override keeps the same method name and parameter list in each subclass.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    accessibility: {
      altDescription:
        "Override speak in Dog and Cat subclasses with matching signatures.",
    },
  },
  {
    id: "java-interface-drawable",
    language: "java",
    title: "Implement a Drawable interface",
    objective:
      "Implement an interface contract so a class provides required methods.",
    prompt:
      "Interface Drawable declares void draw(). Complete class Circle so it implements Drawable and defines draw() containing the word circle (any body). Keep implements and the method signature.",
    starter:
      "interface Drawable {\n  void draw();\n}\n\nclass Circle {\n  // implement Drawable\n}\n",
    entryFunction: "draw",
    tests: [],
    requiredPatterns: ["implements", "Drawable", "void draw", "circle"],
    domainTag: "computer science",
    conceptHints: ["interface", "implements", "abstraction", "java", "oop"],
    misconceptionTargets: [
      "using extends instead of implements for an interface",
      "changing the draw signature and calling it a valid implementation",
    ],
    successLooksLike:
      "Circle implements Drawable and defines draw() with a circle-related body.",
    scaffolds: [
      {
        kind: "HINT",
        label: "Implements keyword",
        content: "Classes use implements for interfaces; keep draw() with no parameters.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
  },
  {
    id: "java-recursion-factorial",
    language: "java",
    title: "Recursive factorial",
    objective: "Implement a recursive base case and recursive step.",
    prompt:
      "Complete factorial(n) that returns 1 when n <= 1, otherwise n * factorial(n - 1). Include the recursive call.",
    starter:
      "int factorial(int n) {\n  // base + recursive step\n  return 0;\n}\n",
    entryFunction: "factorial",
    tests: [],
    requiredPatterns: ["factorial", "return", "n - 1", "*"],
    domainTag: "computer science",
    conceptHints: ["recursion", "base case", "factorial", "java", "algorithm"],
    misconceptionTargets: [
      "missing the base case and recursing forever",
      "using a loop and calling it recursion",
    ],
    successLooksLike:
      "Base case returns 1 for n<=1; otherwise multiplies by factorial(n-1).",
    scaffolds: [
      {
        kind: "HINT",
        label: "Base case first",
        content: "Decide what happens when n is 0 or 1 before writing the recursive call.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
  },
  {
    id: "js-array-reduce-sum",
    language: "javascript",
    title: "Sum with reduce",
    objective: "Use array reduction to accumulate a total.",
    prompt: "Write `sum(nums)` that returns the sum of numbers using reduce (or an equivalent loop).",
    starter: "function sum(nums) {\n  // your code\n}\n",
    entryFunction: "sum",
    tests: [
      { id: "t1", args: [[1, 2, 3]], expected: 6 },
      { id: "t2", args: [[]], expected: 0 },
      { id: "t3", args: [[-1, 5]], expected: 4 },
    ],
    domainTag: "computer science",
    conceptHints: ["reduce", "array", "accumulate", "javascript", "collections"],
    misconceptionTargets: ["forgetting the initial value of 0 for an empty array"],
    successLooksLike: "sum([1,2,3]) is 6; empty array sums to 0.",
    scaffolds: [
      {
        kind: "HINT",
        label: "Initial value",
        content: "Start the accumulator at 0 so empty arrays still return 0.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
  },
];

export function getCodingChallenge(id: string): CodingChallenge | null {
  return CODING_CHALLENGES.find((c) => c.id === id) ?? null;
}

export function listCodingChallenges(): Array<
  Pick<
    CodingChallenge,
    | "id"
    | "language"
    | "title"
    | "prompt"
    | "starter"
    | "objective"
    | "domainTag"
  >
> {
  return CODING_CHALLENGES.map(
    ({ id, language, title, prompt, starter, objective, domainTag }) => ({
      id,
      language,
      title,
      prompt,
      starter,
      objective,
      domainTag,
    }),
  );
}
