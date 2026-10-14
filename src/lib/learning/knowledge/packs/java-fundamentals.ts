/**
 * Knowledge pack: Java fundamentals (expanded Phase 6).
 * Preserves java-arraylist, java-exceptions, java-inheritance.
 * Knowledge only — not a lesson generator.
 */

import type { InstructionalKnowledgePack } from "@/lib/learning/knowledge/instructional-library";
import { registerInstructionalPack } from "@/lib/learning/knowledge/instructional-library";
import { klConcept } from "@/lib/learning/knowledge/packs/helpers";

export const JAVA_FUNDAMENTALS_PACK: InstructionalKnowledgePack = {
  id: "java-fundamentals",
  match: [
    "java arraylist",
    "arraylist in java",
    "java exceptions",
    "exception handling in java",
    "java inheritance",
    "inheritance in java",
    "java variables",
    "java primitives",
    "java control flow",
    "java methods",
    "java strings",
    "java arrays",
    "java classes and objects",
    "java polymorphism",
    "java interfaces",
    "java fundamentals",
    "intro to java programming",
  ],
  domain: "programming",
  subject: "java",
  displayTitle: "Java fundamentals",
  learningFrame:
    "Core Java: values and control flow, methods and collections, then objects, inheritance, and exceptions.",
  cheatSheet:
    "Variables → Control → Methods → Strings/Arrays → ArrayList → Classes → Inheritance → Polymorphism → Exceptions",
  concepts: [
    klConcept({
      id: "java-variables",
      title: "Java variables",
      aliases: ["variables in Java", "Java variable declaration", "Java local variables"],
      definition:
        "A Java variable is a typed name that stores a value (primitive) or a reference (object) in a scope.",
      explanation:
        "You declare a variable with a type and name, then assign a value. Primitives (int, double, boolean, char, …) hold the value itself. Reference types hold a pointer to an object. Scope rules decide where the name is visible (method, block, class field). Final variables cannot be reassigned. Clear names and correct types prevent many bugs before runtime.",
      purpose: "Store and reuse values under typed names.",
      example: "int age = 20;\ndouble gpa = 3.7;\nboolean ready = true;\nString name = \"Ada\";",
      examples: ["final int MAX = 100;", "int count; count = 0;"],
      misconceptions: [
        "Java variables must have a declared type (unlike Python).",
        "Reassigning a reference does not always copy the object's contents.",
      ],
      misconception: "Thinking Java names can change type freely like untyped scripting languages.",
      vocabulary: ["declaration", "assignment", "scope", "final", "primitive", "reference"],
      relatedConcepts: ["java-primitives", "java-operators"],
      practiceForms: ["code", "explain"],
      masteryCriteria: [
        "Can declare and assign typed locals",
        "Can explain primitive vs reference at a basic level",
      ],
      difficulty: 1,
      checkPrompt: "What two pieces of information do you give when declaring a Java variable?",
    }),
    klConcept({
      id: "java-primitives",
      title: "Java primitive types",
      aliases: ["primitive data types in Java", "Java int double boolean", "Java primitives"],
      definition:
        "Primitives are built-in value types (byte, short, int, long, float, double, char, boolean) stored directly.",
      explanation:
        "Choose primitives for numbers, characters, and true/false without object overhead. int is the default integer; double for most decimals; boolean for conditions; char for a single Unicode character. Wrapper classes (Integer, Double) exist when you need objects (e.g. ArrayList). Mixing types may require casting.",
      purpose: "Pick the right built-in value type for data.",
      example: "int n = 42;\ndouble pi = 3.14;\nboolean ok = n > 0;\nchar grade = 'A';",
      misconceptions: ["String is not a primitive — it is a reference type."],
      misconception: "Treating String like int as a primitive value type.",
      vocabulary: ["int", "double", "boolean", "char", "wrapper"],
      relatedConcepts: ["java-variables", "java-type-casting"],
      practiceForms: ["code", "identify"],
      masteryCriteria: ["Can name common primitives and when to use int vs double"],
      difficulty: 1,
      checkPrompt: "Name three Java primitive types and one non-primitive type.",
    }),
    klConcept({
      id: "java-operators",
      title: "Java operators",
      aliases: ["operators in Java", "Java arithmetic operators", "Java comparison operators"],
      definition:
        "Operators combine or compare values (+, -, *, /, %, ==, !=, <, >, &&, ||, !).",
      explanation:
        "Arithmetic operators compute numbers; relational operators compare and yield boolean; logical operators combine booleans. Integer division truncates. == on primitives compares values; on objects it compares references unless equals is used. Precedence and parentheses matter.",
      purpose: "Express calculations and decisions.",
      example: "int sum = a + b;\nboolean both = x > 0 && y > 0;\nint rem = 17 % 5; // 2",
      misconceptions: ["== on Strings often fails to compare text content — prefer equals."],
      misconception: "Using == to compare String contents.",
      vocabulary: ["operand", "precedence", "modulo", "short-circuit"],
      relatedConcepts: ["java-expressions", "java-strings"],
      practiceForms: ["predict-output", "code"],
      masteryCriteria: ["Can predict integer division and && short-circuit basics"],
      difficulty: 1,
      checkPrompt: "What is the result type of a < b in Java?",
    }),
    klConcept({
      id: "java-expressions",
      title: "Java expressions",
      aliases: ["expressions in Java", "Java expression evaluation"],
      definition:
        "An expression is a combination of values, variables, and operators that evaluates to a result.",
      explanation:
        "Expressions appear in assignments, method arguments, and conditions. Types must be compatible. Side effects (++, method calls) can change state while computing a value. Prefer clear expressions over clever nesting.",
      purpose: "Compute values used by statements.",
      example: "int area = width * height;\nif (score >= 60) { /* pass */ }",
      misconceptions: ["An expression is not the same as a full statement ending in ;."],
      misconception: "Confusing expressions with entire statements.",
      vocabulary: ["evaluate", "result type", "side effect"],
      relatedConcepts: ["java-operators", "java-variables"],
      practiceForms: ["explain", "trace"],
      masteryCriteria: ["Can identify an expression vs a statement"],
      difficulty: 1,
      checkPrompt: "Is `x + 1` an expression or a statement? Why?",
    }),
    klConcept({
      id: "java-type-casting",
      title: "Java type casting",
      aliases: ["casting in Java", "type conversion Java", "Java widen narrow cast"],
      definition:
        "Casting converts a value from one type to another; widening is safe, narrowing may lose information.",
      explanation:
        "int to long is widening (automatic). double to int needs an explicit cast and truncates. Casting references checks the actual object type at runtime (ClassCastException if wrong). Prefer clearer APIs over frequent casts.",
      purpose: "Convert between compatible types deliberately.",
      example: "double d = 3.9;\nint n = (int) d; // 3\nlong big = n; // widening",
      misconceptions: ["Casting does not round — it truncates toward zero for integers."],
      misconception: "Expecting (int)3.9 to become 4.",
      vocabulary: ["widen", "narrow", "explicit cast"],
      relatedConcepts: ["java-primitives"],
      practiceForms: ["predict-output", "code"],
      masteryCriteria: ["Can explain why narrowing casts need (type)"],
      difficulty: 2,
      checkPrompt: "What happens to the fractional part when casting double to int?",
    }),
    klConcept({
      id: "java-io-basics",
      title: "Java console I/O",
      aliases: ["Java input output", "Scanner input Java", "System.out.println"],
      definition:
        "Console I/O prints with System.out and commonly reads with Scanner on System.in.",
      explanation:
        "println writes a line; print writes without newline. Scanner nextInt/nextDouble/nextLine read tokens or lines. Mixing nextInt and nextLine needs care with leftover newlines. Always close scanners on files; for System.in, closing can close the input stream.",
      purpose: "Communicate with the user at the console.",
      example:
        "Scanner in = new Scanner(System.in);\nSystem.out.print(\"Age: \");\nint age = in.nextInt();",
      misconceptions: ["nextLine after nextInt often returns an empty string because of the leftover newline."],
      misconception: "Ignoring newline leftovers when mixing Scanner methods.",
      vocabulary: ["Scanner", "token", "System.in", "System.out"],
      relatedConcepts: ["java-variables"],
      practiceForms: ["code"],
      masteryCriteria: ["Can read an int and print a response"],
      difficulty: 1,
      checkPrompt: "Which class is commonly used to read from System.in?",
    }),
    klConcept({
      id: "java-if-else",
      title: "Java if/else",
      aliases: ["if else in Java", "Java conditional statements", "Java branching"],
      definition:
        "if/else chooses which block runs based on a boolean condition.",
      explanation:
        "Evaluate a condition; if true, run the if block; otherwise optionally run else or else-if chains. Conditions must be boolean — no C-style if(1). Brace style avoids dangling-else bugs. Keep conditions readable.",
      purpose: "Branch program flow on true/false decisions.",
      example:
        "if (score >= 90) {\n  grade = 'A';\n} else if (score >= 80) {\n  grade = 'B';\n} else {\n  grade = 'C';\n}",
      misconceptions: ["Assignment = inside a condition is usually a bug; use == for comparison of primitives."],
      misconception: "Writing if (x = 5) like C.",
      vocabulary: ["condition", "branch", "else-if"],
      relatedConcepts: ["java-operators", "java-switch"],
      practiceForms: ["code", "trace"],
      masteryCriteria: ["Can write a correct if/else-if/else chain"],
      difficulty: 1,
      checkPrompt: "What type must an if condition expression have in Java?",
    }),
    klConcept({
      id: "java-switch",
      title: "Java switch",
      aliases: ["switch statement Java", "Java switch case"],
      definition:
        "switch selects among discrete case labels for a value (int, String, enum, …).",
      explanation:
        "Match the switch expression against case labels. break prevents fall-through (unless intentional). default handles unmatched values. Modern switch expressions can yield values; classic switch statements use cases and breaks.",
      purpose: "Multi-way branch on discrete values.",
      example:
        "switch (day) {\n  case \"Mon\": return 1;\n  case \"Tue\": return 2;\n  default: return 0;\n}",
      misconceptions: ["Forgetting break causes fall-through into the next case."],
      misconception: "Omitting break accidentally.",
      vocabulary: ["case", "break", "fall-through", "default"],
      relatedConcepts: ["java-if-else"],
      practiceForms: ["code", "trace"],
      masteryCriteria: ["Can write a switch with break and default"],
      difficulty: 2,
      checkPrompt: "What does break do inside a classic switch?",
    }),
    klConcept({
      id: "java-while",
      title: "Java while loops",
      aliases: ["while loop Java", "Java while"],
      definition:
        "while repeats a block as long as its condition is true.",
      explanation:
        "Check the condition before each iteration. If initially false, the body never runs. Update loop variables inside the body or you risk infinite loops. Use for clear counting; while for unknown repetition counts.",
      purpose: "Repeat work until a condition fails.",
      example: "int i = 0;\nwhile (i < 3) {\n  System.out.println(i);\n  i++;\n}",
      misconceptions: ["The condition is rechecked every iteration, not only once."],
      misconception: "Thinking the condition is evaluated only at the start once.",
      vocabulary: ["iteration", "infinite loop", "sentinel"],
      relatedConcepts: ["java-for", "java-do-while"],
      practiceForms: ["trace", "code"],
      masteryCriteria: ["Can write a while that terminates"],
      difficulty: 1,
      checkPrompt: "When is a while body skipped entirely?",
    }),
    klConcept({
      id: "java-do-while",
      title: "Java do-while loops",
      aliases: ["do while Java", "Java do-while"],
      definition:
        "do-while runs the body once, then repeats while the condition remains true.",
      explanation:
        "Unlike while, the body always executes at least once. Useful for menus: show options, then ask whether to continue. Still requires a path that makes the condition false.",
      purpose: "Guarantee one execution before testing.",
      example:
        "int n;\ndo {\n  n = in.nextInt();\n} while (n < 0);",
      misconceptions: ["do-while still needs a terminating condition."],
      misconception: "Assuming do-while cannot loop forever.",
      vocabulary: ["post-test loop"],
      relatedConcepts: ["java-while"],
      practiceForms: ["code"],
      masteryCriteria: ["Can contrast while vs do-while"],
      difficulty: 2,
      checkPrompt: "How does do-while differ from while on the first iteration?",
    }),
    klConcept({
      id: "java-for",
      title: "Java for loops",
      aliases: ["for loop Java", "Java for", "Java nested loops"],
      definition:
        "for packs initialization, condition, and update into one header for counted loops.",
      explanation:
        "Classic for(init; condition; update) is ideal for index-based traversal. Enhanced for (for-each) walks arrays/collections without an index. Nested loops combine dimensions (rows/columns). Prefer clear bounds to off-by-one errors.",
      purpose: "Repeat with an explicit counter or for-each traversal.",
      example:
        "for (int i = 0; i < a.length; i++) {\n  System.out.println(a[i]);\n}",
      examples: ["for (String s : list) { System.out.println(s); }"],
      misconceptions: ["Array indices run 0 .. length-1, not 1 .. length."],
      misconception: "Looping to <= a.length on arrays.",
      vocabulary: ["index", "for-each", "off-by-one"],
      relatedConcepts: ["java-arrays", "java-while"],
      practiceForms: ["trace", "code"],
      masteryCriteria: ["Can traverse an array with for without going out of bounds"],
      difficulty: 1,
      checkPrompt: "What are the three parts of a classic for header?",
    }),
    klConcept({
      id: "java-methods",
      title: "Java methods",
      aliases: ["methods in Java", "Java method declaration", "Java void methods"],
      definition:
        "A method is a named block with a signature (name, parameters, return type) that performs a task.",
      explanation:
        "Declare methods inside a class. Parameters receive inputs; return sends a result (or void for none). Call methods with arguments matching parameter types. Overloading allows same name with different parameter lists. Local variables live only during the call.",
      purpose: "Package reusable behavior.",
      example:
        "static int add(int a, int b) {\n  return a + b;\n}\nint s = add(2, 3);",
      misconceptions: ["Parameter names in the declaration are not the same as argument expressions at the call site."],
      misconception: "Confusing parameters with arguments.",
      vocabulary: ["signature", "parameter", "argument", "return", "void"],
      relatedConcepts: ["java-method-overloading", "java-scope"],
      practiceForms: ["code", "explain"],
      masteryCriteria: ["Can write and call a method with parameters and return"],
      difficulty: 2,
      checkPrompt: "What does void mean on a method?",
    }),
    klConcept({
      id: "java-method-overloading",
      title: "Java method overloading",
      aliases: ["overloading in Java", "Java overloaded methods"],
      definition:
        "Overloading means multiple methods share a name but differ in parameter lists.",
      explanation:
        "The compiler picks the overload by argument types/count. Return type alone cannot distinguish overloads. Overloading is compile-time; overriding is runtime polymorphism on subclasses.",
      purpose: "Offer convenient variants of an operation.",
      example:
        "void print(int x) { }\nvoid print(String s) { }\nprint(3);\nprint(\"hi\");",
      misconceptions: ["Overloading is not the same as overriding."],
      misconception: "Calling overload and override the same thing.",
      vocabulary: ["overload", "signature"],
      relatedConcepts: ["java-methods", "java-overriding"],
      practiceForms: ["identify", "code"],
      masteryCriteria: ["Can explain how the compiler chooses an overload"],
      difficulty: 2,
      checkPrompt: "Can two methods overload if they differ only by return type?",
    }),
    klConcept({
      id: "java-scope",
      title: "Java variable scope",
      aliases: ["scope in Java", "Java local scope", "Java block scope"],
      definition:
        "Scope is the region of code where a name is visible.",
      explanation:
        "Local variables exist from declaration to end of their block. Parameters are local to the method. Fields belong to the instance or class. Shadowing occurs when a local hides a field — use this.field to access the field.",
      purpose: "Know where names can be used.",
      example:
        "void f(int x) {\n  int y = x + 1;\n  // y not visible outside\n}",
      misconceptions: ["A variable declared inside a loop block is not visible after the loop."],
      misconception: "Using a loop variable after its for-header scope.",
      vocabulary: ["local", "field", "shadowing", "this"],
      relatedConcepts: ["java-methods", "java-classes-basics"],
      practiceForms: ["trace", "explain"],
      masteryCriteria: ["Can identify whether a name is in scope at a line"],
      difficulty: 2,
      checkPrompt: "Where is a method parameter visible?",
    }),
    klConcept({
      id: "java-strings",
      title: "Java Strings",
      aliases: ["String in Java", "Java String methods", "Java string concatenation"],
      definition:
        "String is an immutable sequence of characters; operations return new strings.",
      explanation:
        "Create with literals \"text\". Concatenate with + or concat. Compare content with equals, not ==. Common methods: length, charAt, substring, indexOf, trim, toLowerCase, matches. Because Strings are immutable, seemingly “changing” one creates another object.",
      purpose: "Work with text safely and clearly.",
      example:
        "String s = \" Hello \";\nString t = s.trim();\nboolean same = t.equals(\"Hello\");",
      misconceptions: ["== compares references for String objects, not always the characters."],
      misconception: "Using == to test String equality of content.",
      vocabulary: ["immutable", "equals", "charAt", "substring", "trim"],
      relatedConcepts: ["java-operators"],
      practiceForms: ["code", "predict-output"],
      masteryCriteria: ["Can use equals, length, and substring correctly"],
      difficulty: 2,
      checkPrompt: "Why prefer equals over == for String content?",
    }),
    klConcept({
      id: "java-arrays",
      title: "Java arrays",
      aliases: ["arrays in Java", "Java array indexing", "Java array traversal"],
      definition:
        "An array is a fixed-length, indexed sequence of elements of one type.",
      explanation:
        "Create with new Type[n] or an initializer. Indices run 0 .. length-1. length is a field, not a method. Arrays of objects store references. Passing an array to a method passes the reference — the callee can mutate elements. Prefer ArrayList when size must grow.",
      purpose: "Store a fixed number of values efficiently.",
      example:
        "int[] a = new int[3];\na[0] = 10;\nfor (int i = 0; i < a.length; i++) {\n  System.out.println(a[i]);\n}",
      misconceptions: ["Arrays do not grow with add — that is ArrayList."],
      misconception: "Calling a.add on an array.",
      vocabulary: ["index", "length", "initializer"],
      relatedConcepts: ["java-arraylist", "java-for"],
      practiceForms: ["code", "trace"],
      masteryCriteria: ["Can create, index, and traverse an array safely"],
      difficulty: 2,
      checkPrompt: "What is the valid index range for an array of length n?",
    }),
    // Preserved & strengthened
    klConcept({
      id: "java-arraylist",
      title: "ArrayList",
      aliases: [
        "Java ArrayList",
        "Java ArrayLists",
        "ArrayList in Java",
        "array lists in java",
      ],
      role: "concept",
      definition:
        "ArrayList is a resizable array-backed list in java.util that stores objects in order and grows as you add elements.",
      explanation:
        "A plain Java array has a fixed length set when you create it. ArrayList solves the everyday need for a list whose size can change: you add items with add, read them with get, replace with set, remove with remove, and ask how many items exist with size. indexOf finds a value; iteration uses for-each or indexed for. Internally it still uses an array, but it allocates a larger one when capacity runs out. ArrayList stores reference types (use Integer, not int). You can convert arrays ↔ ArrayList with Arrays.asList / toArray patterns.",
      purpose: "Hold an ordered, growable collection without manual array resizing.",
      example:
        "ArrayList<String> names = new ArrayList<>();\nnames.add(\"Ada\");\nnames.add(\"Grace\");\nString first = names.get(0);\nnames.set(1, \"Alan\");\nnames.remove(0);\nint n = names.size();\nint at = names.indexOf(\"Alan\");",
      examples: [
        "ArrayList<Integer> scores = new ArrayList<>(); scores.add(95); scores.add(88);",
        "for (String s : names) { System.out.println(s); }",
      ],
      nonExamples: [
        "String[] fixed = new String[2]; // length cannot grow after creation",
      ],
      misconceptions: [
        "ArrayList is not the same as a fixed-length array — capacity can grow.",
        "You cannot store primitive int directly; use Integer (autoboxing helps).",
      ],
      misconception:
        "Thinking ArrayList and array are interchangeable — arrays do not grow with add().",
      vocabulary: ["element", "index", "capacity", "size", "generic type", "indexOf"],
      prerequisites: ["java-classes-basics"],
      relatedConcepts: ["java-arrays", "java-exceptions", "java-inheritance"],
      workedExamples: [
        "Create ArrayList<String>, add two names, print get(0), then remove index 0 and check size().",
      ],
      practiceForms: ["code", "trace", "explain"],
      masteryCriteria: [
        "Can create an ArrayList, add/get/set/remove elements, and use size()/indexOf",
        "Can explain how ArrayList differs from a fixed array",
      ],
      difficulty: 2,
      checkPrompt: "Name one ArrayList method that a fixed array does not have.",
    }),
    klConcept({
      id: "java-classes-basics",
      title: "Java classes and objects",
      aliases: [
        "classes and objects in Java",
        "Java class basics",
        "Java objects",
        "Java fields and methods",
      ],
      definition:
        "A class is a blueprint; an object is an instance created with new.",
      explanation:
        "Classes group fields (state) and methods (behavior). new ClassName(...) allocates an object and runs a constructor. Each object has its own field values. Access modifiers (public/private) control visibility. Static members belong to the class, not an instance.",
      purpose: "Model real-world entities with state and behavior.",
      example:
        "class Dog {\n  String name;\n  void bark() { System.out.println(name + \" says woof\"); }\n}\nDog d = new Dog();\nd.name = \"Rex\";\nd.bark();",
      misconceptions: ["A class is not an object — new creates the object."],
      misconception: "Calling methods on the class name when they are instance methods.",
      vocabulary: ["class", "object", "instance", "field", "constructor", "new"],
      relatedConcepts: ["java-constructors", "java-access-modifiers"],
      practiceForms: ["code", "explain"],
      masteryCriteria: ["Can define a simple class and construct an object"],
      difficulty: 2,
      checkPrompt: "What keyword creates a new object from a class?",
    }),
    klConcept({
      id: "java-constructors",
      title: "Java constructors",
      aliases: ["constructors in Java", "Java constructor"],
      definition:
        "A constructor initializes a new object; it shares the class name and has no return type.",
      explanation:
        "If you write no constructor, Java provides a default no-arg constructor (until you add any constructor). Overloaded constructors offer different setup paths. this(...) can chain constructors. Constructors establish valid initial state.",
      purpose: "Initialize objects safely at creation.",
      example:
        "class Point {\n  int x, y;\n  Point(int x, int y) { this.x = x; this.y = y; }\n}",
      misconceptions: ["Constructors are not ordinary methods — they do not return values."],
      misconception: "Writing void Point() as a constructor.",
      vocabulary: ["constructor", "overload", "this"],
      relatedConcepts: ["java-classes-basics"],
      practiceForms: ["code"],
      masteryCriteria: ["Can write a constructor that sets fields"],
      difficulty: 2,
      checkPrompt: "How can you tell a constructor apart from a method in code?",
    }),
    klConcept({
      id: "java-access-modifiers",
      title: "Java access modifiers",
      aliases: ["public private Java", "Java encapsulation", "Java access levels"],
      definition:
        "Access modifiers (public, protected, package-private, private) control who can see members.",
      explanation:
        "private hides fields/methods inside the class — prefer for encapsulation. public is visible everywhere. protected includes subclasses. Package-private (no modifier) shares within the package. Getters/setters expose controlled access.",
      purpose: "Protect object state and clarify APIs.",
      example: "private int balance;\npublic int getBalance() { return balance; }",
      misconceptions: ["Making everything public is not good design — it breaks encapsulation."],
      misconception: "Public fields as the default habit.",
      vocabulary: ["private", "public", "protected", "encapsulation"],
      relatedConcepts: ["java-classes-basics"],
      practiceForms: ["explain", "code"],
      masteryCriteria: ["Can choose private fields with public getters when appropriate"],
      difficulty: 2,
      checkPrompt: "Why are fields often private?",
    }),
    klConcept({
      id: "java-inheritance",
      title: "Java inheritance",
      aliases: [
        "inheritance in Java",
        "Java extends",
        "superclass subclass Java",
        "Java inheritance",
        "class inheritance in Java",
      ],
      role: "concept",
      definition:
        "Inheritance lets a subclass reuse and extend a superclass with extends; subclasses inherit accessible members.",
      explanation:
        "A subclass is-a specialized superclass. Use super to call superclass constructors/methods. Single class inheritance in Java (one extends). Shared behavior lives in the superclass; specialized behavior overrides methods. Prefer composition when “has-a” fits better than “is-a”.",
      purpose: "Share and specialize behavior across related types.",
      example:
        "class Animal { void speak() { } }\nclass Dog extends Animal {\n  @Override void speak() { System.out.println(\"woof\"); }\n}",
      examples: [
        "super(args) in a subclass constructor",
        "class SavingsAccount extends BankAccount { /* specialized withdraw rules */ }",
      ],
      nonExamples: [
        "Putting unrelated utility methods on a class just to reuse them without an is-a relationship",
      ],
      nonExample:
        "Extending ArrayList solely to add one helper method with no conceptual specialization",
      representation:
        "UML: subclass hollow-arrow points to superclass; label the extends edge",
      breakdown:
        "superclass → subclass → extends → inherited members → constructors/super → overriding → toward polymorphism",
      misconceptions: [
        "Inheritance is not for code reuse alone — the is-a relationship should hold.",
      ],
      misconception: "Extending unrelated classes just to reuse a method.",
      misconceptionDetails: [
        {
          misconception:
            "Inheritance means a subclass automatically gets private fields as if they were public.",
          why: "Learners see fields listed in diagrams and assume full access.",
          correction:
            "Subclasses inherit accessible members; private fields are not directly accessible — use getters or protected carefully.",
          contrast: "private vs protected vs public inheritance visibility",
          diagnosticClue: "Student writes subclass code that reads superclass private fields directly",
        },
        {
          misconception:
            "Overriding means creating another method with a different parameter list.",
          why: "Confused with overloading.",
          correction:
            "Overriding keeps the same signature in a subclass; overloading changes the parameter list.",
          contrast: "overriding vs overloading",
        },
      ],
      vocabulary: [
        "extends",
        "superclass",
        "subclass",
        "super",
        "is-a",
        "inherited members",
        "overriding",
      ],
      prerequisites: ["java-classes-basics", "java-methods", "java-constructors"],
      relatedConcepts: [
        "java-overriding",
        "java-polymorphism",
        "java-classes-basics",
        "java-method-overloading",
      ],
      relationships: [
        { kind: "prerequisite", targetConceptId: "java-classes-basics", reason: "Need class/object model first" },
        { kind: "prerequisite", targetConceptId: "java-methods", reason: "Methods are what subclasses inherit and override" },
        { kind: "leads_to", targetConceptId: "java-overriding", reason: "Specialize inherited behavior" },
        { kind: "leads_to", targetConceptId: "java-polymorphism", reason: "Runtime dispatch via inheritance hierarchy" },
        { kind: "commonly_confused_with", targetConceptId: "java-method-overloading", reason: "Overload ≠ override" },
        { kind: "related_to", targetConceptId: "java-constructors", reason: "Subclass constructors call super" },
      ],
      childConceptIds: ["java-overriding"],
      visualModels: [
        "UML generalization arrow from subclass to superclass",
        "Stack of inherited members: public/protected available; private encapsulated",
      ],
      procedures: [
        "Declare class Sub extends Super",
        "Call super(...) as first constructor statement when needed",
        "Override with @Override and same signature",
      ],
      scenarios: [
        "Model Animal → Dog → Puppy where shared speak() lives high in the hierarchy",
      ],
      applications: [
        "GUI widget hierarchies",
        "Domain models (Account → CheckingAccount)",
      ],
      transferPrompts: [
        "Given a new domain (vehicles), sketch a 3-level inheritance hierarchy with one override.",
      ],
      workedExamples: [
        "Trace which speak() runs when Animal a = new Dog(); a.speak();",
      ],
      practiceForms: ["code", "explain", "predict", "identify", "uml"],
      assessmentForms: [
        "recognize inheritance",
        "explain inheritance",
        "identify superclass/subclass",
        "predict inherited behavior",
        "write extends",
        "distinguish overriding vs overloading",
      ],
      masteryCriteria: [
        "Can declare a subclass with extends and call super",
        "Can explain is-a vs has-a at a basic level",
        "Can predict which method runs under a superclass reference",
      ],
      difficulty: 2,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "pearson-java-intro",
          label: "Intro Java / OOP unit",
          unit: "Inheritance",
          chapter: "Chapter 11-style inheritance",
          conceptId: "java-inheritance",
        },
      ],
      checkPrompt: "What keyword creates a subclass relationship?",
    }),
    klConcept({
      id: "java-overriding",
      title: "Java method overriding",
      aliases: ["overriding in Java", "Java @Override"],
      definition:
        "Overriding replaces a superclass instance method with a subclass implementation.",
      explanation:
        "Same signature, covariant returns allowed carefully. Use @Override to catch mistakes. Runtime dispatch picks the object's actual type. private/static methods are not overridden the same way.",
      purpose: "Specialize behavior while keeping a shared API.",
      example:
        "@Override\npublic String toString() {\n  return \"Point(\" + x + \",\" + y + \")\";\n}",
      misconceptions: ["Overriding ≠ overloading."],
      misconception: "Changing only the parameter list and calling it override.",
      vocabulary: ["override", "dispatch", "@Override"],
      relatedConcepts: ["java-inheritance", "java-polymorphism"],
      practiceForms: ["code", "identify"],
      masteryCriteria: ["Can override a method and use @Override"],
      difficulty: 2,
      checkPrompt: "What annotation helps catch override mistakes?",
    }),
    klConcept({
      id: "java-polymorphism",
      title: "Java polymorphism",
      aliases: ["polymorphism in Java", "Java dynamic dispatch"],
      definition:
        "Polymorphism lets you use a superclass type to refer to subclass objects; calls dispatch to the actual override.",
      explanation:
        "Animal a = new Dog(); a.speak(); runs Dog's speak. APIs accept general types and work with many subclasses. Interfaces and abstract classes enable polymorphic design. Casting may be needed to access subclass-only members.",
      purpose: "Write flexible code against general types.",
      example:
        "List<String> list = new ArrayList<>();\nlist.add(\"x\"); // List reference, ArrayList object",
      misconceptions: ["The reference type limits which members you can call without casting."],
      misconception: "Expecting subclass-only methods on a superclass reference without cast.",
      vocabulary: ["polymorphism", "dynamic dispatch", "upcast"],
      relatedConcepts: ["java-inheritance", "java-interfaces"],
      practiceForms: ["trace", "explain"],
      masteryCriteria: ["Can explain why Animal a = new Dog() then a.speak() runs Dog code"],
      difficulty: 3,
      checkPrompt: "If Animal a = new Dog(), whose speak() runs?",
    }),
    klConcept({
      id: "java-abstract-classes",
      title: "Java abstract classes",
      aliases: ["abstract class Java", "Java abstract methods"],
      definition:
        "An abstract class cannot be instantiated; it may declare abstract methods subclasses must implement.",
      explanation:
        "Use abstract classes to share fields/methods and force subclasses to fill in gaps. Abstract methods have no body. Concrete subclasses implement all abstract methods. Prefer interfaces when you only need a capability contract without shared state.",
      purpose: "Partial blueprints for related subclasses.",
      example:
        "abstract class Shape {\n  abstract double area();\n}\nclass Circle extends Shape {\n  double r;\n  double area() { return Math.PI * r * r; }\n}",
      misconceptions: ["You cannot write new Shape() if Shape is abstract."],
      misconception: "Instantiating an abstract class.",
      vocabulary: ["abstract", "concrete subclass"],
      relatedConcepts: ["java-inheritance", "java-interfaces"],
      practiceForms: ["code", "explain"],
      masteryCriteria: ["Can declare an abstract method and implement it in a subclass"],
      difficulty: 3,
      checkPrompt: "Can you construct an abstract class with new?",
    }),
    klConcept({
      id: "java-interfaces",
      title: "Java interfaces",
      aliases: ["interfaces in Java", "Java implements"],
      definition:
        "An interface declares a contract of methods a class can implement (implements).",
      explanation:
        "Classes may implement multiple interfaces. Interfaces enable polymorphism without single-class inheritance limits. Default/static methods exist in modern Java, but start with abstract instance methods. Program to the interface (List) not the concrete type when possible.",
      purpose: "Define capabilities classes can share.",
      example:
        "interface Drawable { void draw(); }\nclass Icon implements Drawable {\n  public void draw() { /* ... */ }\n}",
      misconceptions: ["implements is for interfaces; extends is for classes."],
      misconception: "Using extends for an interface.",
      vocabulary: ["interface", "implements", "contract"],
      relatedConcepts: ["java-polymorphism", "java-abstract-classes"],
      practiceForms: ["code", "explain"],
      masteryCriteria: ["Can implement a simple interface"],
      difficulty: 3,
      checkPrompt: "Which keyword does a class use to take on an interface?",
    }),
    // Keep existing exceptions concept id for compatibility
    klConcept({
      id: "java-exceptions",
      title: "Java exceptions",
      aliases: [
        "exceptions in Java",
        "Java exception handling",
        "exception handling in Java",
        "try catch in Java",
      ],
      role: "concept",
      definition:
        "An exception is an object that signals an abnormal condition during program execution so calling code can handle it or fail clearly.",
      explanation:
        "When a Java operation cannot continue normally (missing file, bad cast, null dereference), the runtime can throw an exception. try marks risky work; catch handles a matching exception type; finally runs cleanup. Checked vs unchecked exceptions differ in compile-time requirements. throw creates/raises; throws declares checked exceptions on methods. Multiple catch blocks handle different types. Input validation often prevents exceptions before they happen.",
      purpose: "Respond deliberately when something goes wrong instead of failing silently.",
      example:
        "try {\n  int value = Integer.parseInt(text);\n} catch (NumberFormatException e) {\n  System.out.println(\"Not a number\");\n} finally {\n  System.out.println(\"done\");\n}",
      examples: [
        "throw new IllegalArgumentException(\"age must be >= 0\");",
        "catch (IOException e) { /* recover */ }",
      ],
      nonExamples: [
        "Swallowing every failure with catch (Exception e) {} and doing nothing",
      ],
      misconceptions: [
        "Empty catch blocks hide bugs instead of handling them.",
        "Exceptions are not compile typos — they are runtime signals.",
      ],
      misconception:
        "Catching Exception and ignoring it is not handling — it conceals failures.",
      vocabulary: [
        "throw",
        "try",
        "catch",
        "finally",
        "checked",
        "unchecked",
        "throws",
      ],
      relatedConcepts: ["java-arraylist"],
      workedExamples: [
        "Wrap Integer.parseInt in try/catch and print a friendly message on NumberFormatException.",
      ],
      practiceForms: ["code", "trace", "debug"],
      masteryCriteria: [
        "Can write try/catch/finally for a specific exception type",
        "Can explain why empty catch blocks are harmful",
      ],
      difficulty: 2,
      checkPrompt: "What does catch do when the matching exception is thrown?",
    }),
  ],
};

registerInstructionalPack(JAVA_FUNDAMENTALS_PACK);
