/**
 * Instructional pack: Exception Handling and File I/O (Java-oriented, reusable).
 * Registered into the instructional knowledge library — not a second engine.
 */

import type { InstructionalKnowledgePack } from "@/lib/learning/knowledge/instructional-library";
import { registerInstructionalPack } from "@/lib/learning/knowledge/instructional-library";

export const EXCEPTION_HANDLING_FILE_IO_PACK: InstructionalKnowledgePack = {
  id: "java-exception-handling-file-io",
  match: [
    "exception handling and file i/o",
    "exception handling and file io",
    "exception handling",
    "file i/o",
    "file io",
    "try/catch",
    "checked exception",
    "unchecked exception",
  ],
  domain: "programming",
  subject: "java",
  displayTitle: "Exception Handling and File I/O",
  learningFrame:
    "You're learning Exception Handling and File I/O as a real Java teaching sequence — why failures happen → exceptions → try/catch/finally → checked vs unchecked → file streams → safe open/read/close.",
  cheatSheet:
    "WHY (failures) → EXCEPTION (signal) → try/catch → finally / try-with-resources → checked vs unchecked → File I/O streams → open/read/write/close → apply",
  concepts: [
    {
      id: "why-exceptions",
      title: "Why do programs need exception handling?",
      role: "context",
      purpose: "Survive unexpected failure without silent corruption or crashes.",
      explanation:
        "Real programs talk to files, networks, and users. Disks fill up, files go missing, and bad input arrives. Without a clear way to signal and handle those failures, a program either crashes or continues with bad data. Exception handling is the language's structured way to say “something went wrong here” and decide what to do next.",
      example:
        "You try to open grades.txt to compute an average. The file was deleted. Without handling, the program dies mid-run. With handling, you can tell the user the file is missing and stop cleanly.",
      representation:
        "happy path: open → read → compute → done\nfailure path: open fails → exception → catch → message / recovery",
      checkPrompt:
        "In one sentence: what problem does exception handling solve that an if-check alone often cannot?",
    },
    {
      id: "what-is-exception",
      title: "What an exception is",
      role: "concept",
      definition:
        "An exception is an object that represents an abnormal condition during execution.",
      explanation:
        "In Java, when something goes wrong that the normal flow cannot continue through, the runtime can create an exception object and throw it. Throwing interrupts the normal line-by-line flow and looks for a matching handler. If none is found, the program (or thread) fails with a stack trace. Exceptions are not “errors in your typing” — they are runtime signals about conditions.",
      example:
        'throw new IllegalArgumentException("score must be 0–100");',
      misconception:
        "An exception is not the same as a compile error. Compile errors stop you before the program runs; exceptions happen while it runs.",
      checkPrompt: "Is a missing semicolon an exception or a compile-time error?",
    },
    {
      id: "try-catch",
      title: "try / catch — handle the failure",
      role: "explain",
      explanation:
        "Put risky work in a try block. If that work throws a matching exception type, control jumps to the catch block. You can recover, log, or translate the failure into a user-facing message. Matching is by type: catch (FileNotFoundException e) handles that type (and subtypes), not unrelated exceptions.",
      example:
        'try {\n  // risky work\n} catch (FileNotFoundException e) {\n  System.out.println("File missing: " + e.getMessage());\n}',
      breakdown:
        "try → statements that might throw\ncatch (Type e) → runs only if that type (or subtype) was thrown\ne → the exception object with a message and stack trace",
      representation:
        "try { … }\n  ↓ throws FileNotFoundException\ncatch (FileNotFoundException e) { … }",
      checkPrompt:
        "If try throws IOException and you only catch FileNotFoundException, what happens?",
    },
    {
      id: "finally-twr",
      title: "finally and try-with-resources",
      role: "explain",
      explanation:
        "Cleanup must happen whether the work succeeds or fails — especially closing files. A finally block runs after try/catch in most normal paths. Modern Java prefers try-with-resources: declare AutoCloseable resources in the try header so they close automatically.",
      example:
        'try (Scanner in = new Scanner(Paths.get("data.txt"))) {\n  while (in.hasNextLine()) {\n    System.out.println(in.nextLine());\n  }\n} // Scanner closed automatically',
      breakdown:
        "try (Resource r = …) → create resource\nbody → use it\nend of try → close() called even if an exception occurred",
      misconception:
        "finally is not “only for errors.” It is for cleanup that must run on both success and failure (with a few edge-case caveats).",
      checkPrompt: "Why is forgetting to close a file dangerous even if reading succeeded?",
    },
    {
      id: "checked-unchecked",
      title: "Checked vs unchecked exceptions",
      role: "clarify",
      explanation:
        "Java splits exceptions into checked (must be caught or declared with throws — often recoverable I/O and similar) and unchecked (RuntimeException and Error — often programming bugs). FileNotFoundException is checked; NullPointerException is unchecked. The point of checked exceptions is to force callers to confront likely external failures.",
      example:
        "void read() throws IOException { … }  // caller must handle or declare\nint n = Integer.parseInt(s); // NumberFormatException is unchecked",
      misconception:
        "“Unchecked means unimportant.” Unchecked often means “your code has a bug,” which is very important — just handled differently.",
      related: ["throws", "throw"],
      checkPrompt:
        "Name one checked and one unchecked exception you might see in file or parsing code.",
    },
    {
      id: "throw-throws",
      title: "throw vs throws",
      role: "explain",
      explanation:
        "throw creates/raises an exception at a specific line. throws declares that a method may pass a checked exception to its caller. Propagation means you do not catch locally — you let the caller decide. Use propagation when the caller has better context to recover.",
      example:
        'void load(String path) throws IOException {\n  if (path == null) throw new IllegalArgumentException("path required");\n  Files.readString(Paths.get(path));\n}',
      breakdown:
        "throw new … → actually raise now\nthrows IOException → method signature: callers must deal with IOException\nIllegalArgumentException → unchecked; often not declared",
      checkPrompt: "Which keyword goes in a method signature — throw or throws?",
    },
    {
      id: "file-io-model",
      title: "File I/O — streams and readers",
      role: "visualize",
      explanation:
        "File I/O moves bytes or characters between your program and storage. Java historically uses streams (InputStream/OutputStream for bytes) and readers/writers (for text). Paths and Files (NIO.2) give a modern way to read and write. Always think: open → use → close.",
      example:
        'String text = Files.readString(Paths.get("notes.txt"));\nFiles.writeString(Paths.get("out.txt"), text);',
      representation:
        "Disk file\n   ↕  (stream / Files API)\nYour program (String, bytes, objects)",
      checkPrompt: "What are the three phases of safe file use?",
    },
    {
      id: "worked-read-file",
      title: "Worked example — read a file safely",
      role: "worked",
      explanation:
        "Combine File I/O with exception handling. Try to read a file; if it is missing, catch FileNotFoundException (or IOException) and report clearly; ensure the resource closes.",
      example:
        'Path path = Paths.get("scores.txt");\ntry {\n  List<String> lines = Files.readAllLines(path);\n  System.out.println("Lines: " + lines.size());\n} catch (NoSuchFileException e) {\n  System.out.println("Missing file: " + path);\n} catch (IOException e) {\n  System.out.println("Could not read: " + e.getMessage());\n}',
      breakdown:
        "Paths.get → locate the file\nFiles.readAllLines → read text lines (may throw)\ncatch NoSuchFileException → specific missing-file case\ncatch IOException → other I/O failures",
      checkPrompt:
        "Why catch the more specific exception before the more general IOException?",
    },
    {
      id: "apply-exceptions-io",
      title: "Apply — design a tiny utility",
      role: "apply",
      explanation:
        "Design a method that copies the first line of an input file to an output file. Decide which exceptions to catch vs declare, how to message the user, and how resources close. Then state two tests: happy path and missing input file.",
      example:
        "String copyFirstLine(Path in, Path out) throws IOException { … }",
      practiceForms: ["code", "trace", "debug", "apply"],
      assessmentForms: ["quiz", "code challenge", "predict output"],
      checkPrompt:
        "What should the method do if the input file exists but is empty?",
    },
  ],
  practicePrompts: [
    {
      title: "Recognize",
      prompt:
        "Given a try/catch/finally snippet, label which block runs on success, on FileNotFoundException, and always for cleanup.",
      tip: "Trace the control flow out loud.",
    },
    {
      title: "Explain",
      prompt:
        "Explain checked vs unchecked exceptions to a classmate using file reading as the example.",
      tip: "External failure vs programming bug.",
    },
    {
      title: "Apply",
      prompt:
        "Write a method that reads all lines from a path and returns them, or returns an empty list if the file is missing — without swallowing unrelated errors.",
      tip: "Catch the specific missing-file case; let other IOExceptions propagate or wrap.",
    },
  ],
};

registerInstructionalPack(EXCEPTION_HANDLING_FILE_IO_PACK);
