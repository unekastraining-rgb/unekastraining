/**
 * Knowledge pack: Python fundamentals (expanded Phase 6).
 * Preserves python-variables, python-conditionals, python-functions.
 */

import type { InstructionalKnowledgePack } from "@/lib/learning/knowledge/instructional-library";
import { registerInstructionalPack } from "@/lib/learning/knowledge/instructional-library";
import { klConcept } from "@/lib/learning/knowledge/packs/helpers";

export const PYTHON_FUNDAMENTALS_PACK: InstructionalKnowledgePack = {
  id: "python-fundamentals",
  match: [
    "python variables",
    "variables in python",
    "python conditionals",
    "conditionals in python",
    "python if statements",
    "python functions",
    "functions in python",
    "def in python",
    "python loops",
    "python lists",
    "python dictionaries",
    "python fundamentals",
    "python programming fundamentals",
    "intro to python programming",
  ],
  domain: "programming",
  subject: "python",
  displayTitle: "Python fundamentals",
  learningFrame:
    "Introductory Python: values, branching, loops, functions, collections, and basic exceptions.",
  cheatSheet:
    "Variables → Conditionals → Loops → Functions → Lists/Dicts → Exceptions",
  concepts: [
    klConcept({
      id: "python-variables",
      title: "Python variables",
      aliases: [
        "variables in Python",
        "Python variable assignment",
        "Python variable",
      ],
      role: "concept",
      definition:
        "A Python variable is a name that refers to a value in memory; assignment binds the name with =.",
      explanation:
        "Create a variable by assigning: x = 10. Names are case-sensitive. Values have types (int, float, str, bool); Python tracks the object's type. You can reassign freely. Multiple names can refer to the same object. Prefer descriptive names.",
      purpose: "Remember and reuse values under clear names.",
      example: 'age = 20\nname = "Ada"\nready = True\nprint(name, age, ready)',
      examples: ["total = 3.5 + 2.5", 'message = "Hello, " + name'],
      nonExamples: [
        "Declaring a type like int age; before assignment (not Python syntax)",
      ],
      misconceptions: [
        "Variables do not need a type declaration in Python.",
        "x = y copies a reference for mutable objects — later changes can be shared.",
      ],
      misconception:
        "Thinking Python variables must be declared with a type keyword first.",
      vocabulary: ["assignment", "name", "value", "int", "str", "bool", "float"],
      relatedConcepts: ["python-conditionals", "python-functions", "python-type-conversion"],
      workedExamples: [
        "Assign name and age, then print a sentence using both variables.",
      ],
      practiceForms: ["code", "predict-output", "explain"],
      masteryCriteria: [
        "Can assign int/str/bool values and use them in print or expressions",
        "Can explain that = binds a name to a value",
      ],
      difficulty: 1,
      completeness: "teachable",
      curriculumMappings: [
        {
          curriculumId: "intro-python",
          label: "Intro Python",
          unit: "Variables and types",
          conceptId: "python-variables",
        },
      ],
      checkPrompt: "What does the = operator do in Python?",
    }),
    klConcept({
      id: "python-numbers-strings-bools",
      title: "Python numbers, strings, and booleans",
      aliases: ["Python data types basics", "Python str int bool"],
      definition:
        "int/float store numbers, str stores text, bool stores True/False.",
      explanation:
        "Use int for whole numbers, float for decimals, str with quotes for text, bool for conditions. Many operations convert implicitly; be careful mixing str and int without conversion.",
      purpose: "Choose the right basic value kinds.",
      example: 'n = 3\npi = 3.14\nmsg = "hi"\nok = True',
      misconceptions: ["True/False are capitalized in Python."],
      misconception: "Writing true/false like JavaScript.",
      vocabulary: ["int", "float", "str", "bool"],
      relatedConcepts: ["python-variables", "python-type-conversion"],
      practiceForms: ["identify", "code"],
      masteryCriteria: ["Can create examples of each basic type"],
      difficulty: 1,
      checkPrompt: "Which type stores True or False?",
    }),
    klConcept({
      id: "python-io",
      title: "Python input and output",
      aliases: ["Python print input", "input() Python"],
      definition:
        "print writes output; input reads a line of text from the user.",
      explanation:
        "input always returns a str — convert with int()/float() when you need numbers. print can take multiple arguments. f-strings format values clearly.",
      purpose: "Talk to the user.",
      example: 'name = input("Name: ")\nprint(f"Hello, {name}")',
      misconceptions: ["Forgetting to convert input before arithmetic."],
      misconception: "Adding input results as if they were ints.",
      vocabulary: ["input", "print", "f-string"],
      relatedConcepts: ["python-type-conversion"],
      practiceForms: ["code"],
      masteryCriteria: ["Can read input and print a formatted response"],
      difficulty: 1,
      checkPrompt: "What type does input() return?",
    }),
    klConcept({
      id: "python-type-conversion",
      title: "Python type conversion",
      aliases: ["casting in Python", "int() str() Python"],
      definition:
        "Conversion functions like int(), float(), and str() build a value of another type.",
      explanation:
        "Convert user text to numbers before math. Failed conversions raise ValueError. str(x) makes printable text. Conversion creates a new object; it does not change the old one in place.",
      purpose: "Move between text and numbers safely.",
      example: 'n = int("42")\ntext = str(n)',
      misconceptions: ["int(\"3.14\") fails — use float first or a different approach."],
      misconception: "Expecting int(\"3.14\") to truncate successfully.",
      vocabulary: ["int()", "float()", "str()", "ValueError"],
      relatedConcepts: ["python-io", "python-variables"],
      practiceForms: ["code", "predict-output"],
      masteryCriteria: ["Can convert input strings to int/float with error awareness"],
      difficulty: 1,
      checkPrompt: "How do you turn the string \"10\" into an integer?",
    }),
    klConcept({
      id: "python-conditionals",
      title: "Python conditionals",
      aliases: [
        "conditionals in Python",
        "Python if else",
        "Python if statements",
        "if elif else Python",
      ],
      role: "concept",
      definition:
        "Conditionals run different code paths using if / elif / else based on boolean tests.",
      explanation:
        "Compare with ==, !=, <, >, <=, >=. Combine with and, or, not. Indentation defines blocks. elif chains exclusive alternatives. else runs when no prior branch matched.",
      purpose: "Make decisions in a program.",
      example:
        "if score >= 90:\n    grade = \"A\"\nelif score >= 80:\n    grade = \"B\"\nelse:\n    grade = \"C\"",
      misconceptions: ["= assigns; == compares."],
      misconception: "Using = inside an if condition.",
      vocabulary: ["if", "elif", "else", "boolean", "and", "or", "not"],
      relatedConcepts: ["python-variables", "python-loops"],
      practiceForms: ["code", "trace"],
      masteryCriteria: ["Can write a correct if/elif/else chain"],
      difficulty: 1,
      completeness: "teachable",
      curriculumMappings: [
        {
          curriculumId: "intro-python",
          label: "Intro Python",
          unit: "Control flow",
          conceptId: "python-conditionals",
        },
      ],
      checkPrompt: "What keyword starts an alternate condition after if?",
    }),
    klConcept({
      id: "python-loops",
      title: "Python loops",
      aliases: ["loops in Python", "Python for while", "Python range"],
      definition:
        "Loops repeat code: for walks an iterable; while repeats while a condition holds.",
      explanation:
        "for x in sequence: visits each item. range(n) yields 0..n-1. while needs a condition that eventually becomes false. break exits early; continue skips to the next iteration.",
      purpose: "Repeat work over collections or until done.",
      example:
        "for i in range(3):\n    print(i)\nn = 0\nwhile n < 3:\n    n += 1",
      misconceptions: ["range(3) yields 0,1,2 — not 1,2,3."],
      misconception: "Expecting range(3) to include 3.",
      vocabulary: ["for", "while", "range", "iterable", "break"],
      relatedConcepts: ["python-lists", "python-conditionals"],
      practiceForms: ["trace", "code"],
      masteryCriteria: ["Can write for-range and a terminating while"],
      difficulty: 2,
      checkPrompt: "What numbers does range(3) produce?",
    }),
    klConcept({
      id: "python-functions",
      title: "Python functions",
      aliases: [
        "functions in Python",
        "Python def",
        "def in python",
        "Python function parameters",
      ],
      role: "concept",
      definition:
        "A function is a reusable named block defined with def; it may take parameters and return a value.",
      explanation:
        "def name(params): starts a function. return sends a result (None if omitted). Parameters receive arguments. Locals exist only during the call. Prefer small functions with clear names.",
      purpose: "Package reusable logic.",
      example:
        "def add(a, b):\n    return a + b\nprint(add(2, 3))",
      misconceptions: ["Code after return in the same block does not run."],
      misconception: "Expecting statements after return to execute.",
      vocabulary: ["def", "parameter", "argument", "return", "None"],
      relatedConcepts: ["python-variables", "python-conditionals"],
      practiceForms: ["code", "explain"],
      masteryCriteria: ["Can define and call a function with parameters and return"],
      difficulty: 2,
      completeness: "teachable",
      curriculumMappings: [
        {
          curriculumId: "intro-python",
          label: "Intro Python",
          unit: "Functions",
          conceptId: "python-functions",
        },
      ],
      checkPrompt: "What keyword sends a value back to the caller?",
    }),
    klConcept({
      id: "python-lists",
      title: "Python lists",
      aliases: ["lists in Python", "Python list indexing"],
      definition:
        "A list is an ordered, mutable sequence written with square brackets.",
      explanation:
        "Index with lst[i] (0-based). Slice with lst[a:b]. append/extend/pop mutate. for x in lst: iterates. Membership with in. Lists can hold mixed types but prefer consistent types.",
      purpose: "Store ordered collections that can change.",
      example: 'nums = [10, 20, 30]\nnums.append(40)\nprint(nums[0], nums[-1])',
      misconceptions: ["lst[1:3] excludes index 3."],
      misconception: "Thinking slices include the end index.",
      vocabulary: ["index", "slice", "append", "mutable"],
      relatedConcepts: ["python-loops", "python-tuples"],
      practiceForms: ["code", "trace"],
      masteryCriteria: ["Can index, slice, and append"],
      difficulty: 2,
      checkPrompt: "How do you add an item to the end of a list?",
    }),
    klConcept({
      id: "python-tuples",
      title: "Python tuples",
      aliases: ["tuples in Python", "Python tuple"],
      definition:
        "A tuple is an ordered, immutable sequence written with parentheses.",
      explanation:
        "Tuples are like lists that cannot change after creation. Useful for fixed records and dictionary keys (when elements are hashable). Indexing and unpacking work similarly to lists.",
      purpose: "Hold fixed sequences of values.",
      example: 'point = (3, 4)\nx, y = point',
      misconceptions: ["You cannot append to a tuple."],
      misconception: "Calling append on a tuple.",
      vocabulary: ["immutable", "unpacking"],
      relatedConcepts: ["python-lists"],
      practiceForms: ["identify", "code"],
      masteryCriteria: ["Can create and unpack a tuple"],
      difficulty: 2,
      checkPrompt: "How does a tuple differ from a list?",
    }),
    klConcept({
      id: "python-dictionaries",
      title: "Python dictionaries",
      aliases: ["dictionaries in Python", "Python dict"],
      definition:
        "A dict maps keys to values with {key: value} pairs.",
      explanation:
        "Lookup with d[key] or d.get(key). Keys must be hashable (strings, numbers, tuples of immutables). Iterate keys, values, or items. Mutate with assignment or pop.",
      purpose: "Associate labels with values for fast lookup.",
      example: 'ages = {"Ada": 36}\nages["Grace"] = 40\nprint(ages["Ada"])',
      misconceptions: ["Dicts are not indexed by position like lists."],
      misconception: "Using ages[0] expecting the first inserted pair.",
      vocabulary: ["key", "value", "hashable", "get"],
      relatedConcepts: ["python-lists", "python-sets"],
      practiceForms: ["code", "explain"],
      masteryCriteria: ["Can insert and look up by key"],
      difficulty: 2,
      checkPrompt: "How do you retrieve a value for a key in a dict?",
    }),
    klConcept({
      id: "python-sets",
      title: "Python sets",
      aliases: ["sets in Python", "Python set"],
      definition:
        "A set is an unordered collection of unique hashable elements.",
      explanation:
        "Use sets for membership tests and removing duplicates. Support union/intersection differences. No indexing by position.",
      purpose: "Store unique items and compare groups.",
      example: "nums = {1, 2, 2, 3}  # {1, 2, 3}\nprint(2 in nums)",
      misconceptions: ["Sets do not preserve insertion order for indexing purposes."],
      misconception: "Expecting set[0] to work like a list.",
      vocabulary: ["unique", "membership", "union"],
      relatedConcepts: ["python-dictionaries"],
      practiceForms: ["code"],
      masteryCriteria: ["Can create a set and test membership"],
      difficulty: 2,
      checkPrompt: "What happens to duplicate values when creating a set?",
    }),
    klConcept({
      id: "python-exceptions",
      title: "Python exceptions",
      aliases: ["try except Python", "exceptions in Python", "raise Python"],
      definition:
        "Exceptions signal errors; try/except/finally handle them; raise starts one.",
      explanation:
        "Wrap risky code in try. except catches matching types. finally always runs for cleanup. raise Exception(\"msg\") signals failure. Prefer specific exception types over bare except.",
      purpose: "Handle failures without crashing silently.",
      example:
        'try:\n    n = int(text)\nexcept ValueError:\n    print("Not an int")\nfinally:\n    print("done")',
      misconceptions: ["Bare except: can hide bugs."],
      misconception: "Using except: without a type everywhere.",
      vocabulary: ["try", "except", "finally", "raise", "ValueError"],
      relatedConcepts: ["python-type-conversion"],
      practiceForms: ["code", "debug"],
      masteryCriteria: ["Can write try/except for ValueError"],
      difficulty: 2,
      checkPrompt: "Which block runs whether an exception occurred or not?",
    }),
  ],
};

registerInstructionalPack(PYTHON_FUNDAMENTALS_PACK);
