/**
 * Knowledge pack: SQL fundamentals (proof domain).
 */

import type { InstructionalKnowledgePack } from "@/lib/learning/knowledge/instructional-library";
import { registerInstructionalPack } from "@/lib/learning/knowledge/instructional-library";
import { klConcept } from "@/lib/learning/knowledge/packs/helpers";

export const SQL_FUNDAMENTALS_PACK: InstructionalKnowledgePack = {
  id: "sql-fundamentals",
  match: [
    "sql",
    "sql joins",
    "teach me sql joins",
    "inner join",
    "left join",
    "sql fundamentals",
    "relational databases sql",
  ],
  domain: "programming",
  subject: "sql",
  displayTitle: "SQL fundamentals",
  learningFrame:
    "Relational SQL: tables and keys, then joins that combine related rows, with attention to NULL and result sets.",
  cheatSheet:
    "Tables → Keys → Relationships → INNER JOIN → LEFT JOIN → Result sets / NULL",
  concepts: [
    klConcept({
      id: "sql-tables",
      title: "SQL tables",
      aliases: ["database tables", "relations sql"],
      definition:
        "A table is a named set of rows and columns storing structured data in a relational database.",
      explanation:
        "Each column has a name and type. Each row is one record. Tables model entities (customers, orders). Good table design separates concerns and supports keys and joins.",
      purpose: "Store structured relational data.",
      example: "customers(id, name, email)",
      vocabulary: ["row", "column", "schema", "relation"],
      relatedConcepts: ["sql-keys", "sql-joins"],
      practiceForms: ["explain", "schema"],
      assessmentForms: ["describe a table"],
      completeness: "teachable",
      checkPrompt: "What is a row in a SQL table?",
    }),
    klConcept({
      id: "sql-keys",
      title: "Primary and foreign keys",
      aliases: ["primary key", "foreign key", "sql keys"],
      definition:
        "A primary key uniquely identifies each row; a foreign key references a primary key in another table to express relationships.",
      explanation:
        "Primary keys must be unique and not null. Foreign keys enforce referential integrity so child rows point to existing parents (unless nullable and permitted). Keys are the backbone of joins.",
      purpose: "Identify rows and link tables.",
      example: "orders.customer_id REFERENCES customers(id)",
      examples: ["PRIMARY KEY (id)", "FOREIGN KEY (customer_id) REFERENCES customers(id)"],
      misconceptions: ["Any unique column is automatically a primary key — designation matters."],
      misconception: "Assuming uniqueness alone creates a primary key constraint.",
      vocabulary: ["primary key", "foreign key", "referential integrity"],
      prerequisites: ["sql-tables"],
      relatedConcepts: ["sql-joins", "sql-tables"],
      relationships: [
        { kind: "prerequisite", targetConceptId: "sql-tables" },
        { kind: "leads_to", targetConceptId: "sql-joins" },
      ],
      practiceForms: ["identify", "schema", "explain"],
      assessmentForms: ["identify PK/FK", "explain a relationship"],
      completeness: "teachable",
      checkPrompt: "What does a foreign key reference?",
    }),
    klConcept({
      id: "sql-joins",
      title: "SQL joins",
      aliases: [
        "SQL JOIN",
        "teach me SQL joins",
        "joining tables",
        "sql join types",
      ],
      definition:
        "A join combines rows from two or more tables based on a related column, usually a key relationship.",
      explanation:
        "INNER JOIN returns only matching rows. LEFT JOIN returns all rows from the left table and matches from the right (NULLs when no match). Join conditions typically compare primary/foreign keys. Understanding the result set shape — which rows appear and when columns are NULL — is as important as the syntax.",
      purpose: "Combine related table data into one result set.",
      example:
        "SELECT c.name, o.id\nFROM customers c\nINNER JOIN orders o ON c.id = o.customer_id;",
      examples: [
        "LEFT JOIN to list all customers including those with no orders",
      ],
      nonExamples: [
        "Cartesian product without an ON condition (usually accidental)",
      ],
      nonExample: "Filtering with WHERE alone when you meant to LEFT JOIN",
      representation:
        "customers ⋈ orders on customer_id — Venn: INNER = intersection; LEFT = left circle + matches",
      breakdown:
        "tables → keys → join condition → INNER vs LEFT → NULL behavior → result set",
      misconceptions: [
        "JOIN always means INNER JOIN in many dialects when JOIN is written alone.",
      ],
      misconception: "Assuming LEFT JOIN drops unmatched left rows.",
      misconceptionDetails: [
        {
          misconception: "LEFT JOIN only returns rows that match on both sides.",
          why: "Confused with INNER JOIN.",
          correction:
            "LEFT JOIN keeps all left rows; right-side columns are NULL when there is no match.",
          contrast: "INNER (matches only) vs LEFT (all left + matches)",
          diagnosticClue: "Student expects customers without orders to disappear in a LEFT JOIN",
        },
      ],
      vocabulary: [
        "INNER JOIN",
        "LEFT JOIN",
        "ON",
        "result set",
        "NULL",
        "match",
      ],
      prerequisites: ["sql-tables", "sql-keys"],
      relatedConcepts: ["sql-inner-join", "sql-left-join", "sql-keys"],
      relationships: [
        { kind: "prerequisite", targetConceptId: "sql-tables" },
        { kind: "prerequisite", targetConceptId: "sql-keys" },
        { kind: "contains", targetConceptId: "sql-inner-join" },
        { kind: "contains", targetConceptId: "sql-left-join" },
      ],
      childConceptIds: ["sql-inner-join", "sql-left-join"],
      visualModels: [
        "Venn diagram for INNER vs LEFT",
        "Two tables with lines on customer_id",
      ],
      procedures: [
        "Identify the key columns",
        "Choose INNER vs LEFT based on whether unmatched left rows are needed",
        "Write ON left.key = right.key",
        "Predict NULL columns for non-matches",
      ],
      scenarios: [
        "List all products and any sales; include products never sold (LEFT JOIN)",
      ],
      applications: ["Reporting", "Data analysis", "Application query layers"],
      transferPrompts: [
        "Given students and enrollments, write a LEFT JOIN that lists students with no courses.",
      ],
      workedExamples: [
        "Trace an INNER JOIN result for 3 customers / 2 orders step by step",
      ],
      practiceForms: ["code", "predict", "explain", "schema"],
      assessmentForms: [
        "write INNER JOIN",
        "write LEFT JOIN",
        "predict NULL rows",
        "explain key relationship",
      ],
      masteryCriteria: [
        "Can write INNER and LEFT joins on a key",
        "Can predict which rows appear and when columns are NULL",
      ],
      difficulty: 2,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "intro-databases",
          label: "Intro Databases",
          unit: "Joins",
          conceptId: "sql-joins",
        },
      ],
      checkPrompt: "When does a LEFT JOIN produce NULL in right-table columns?",
    }),
    klConcept({
      id: "sql-inner-join",
      title: "INNER JOIN",
      aliases: ["inner join sql", "SQL INNER JOIN"],
      parentConceptId: "sql-joins",
      definition:
        "INNER JOIN returns only rows where the join condition matches in both tables.",
      explanation:
        "Non-matching rows from either side are excluded. Use when you only want related pairs (e.g., customers who placed orders).",
      purpose: "Keep matching pairs only.",
      example: "INNER JOIN orders o ON c.id = o.customer_id",
      relatedConcepts: ["sql-joins", "sql-left-join"],
      relationships: [
        { kind: "part_of", targetConceptId: "sql-joins" },
        { kind: "contrasts_with", targetConceptId: "sql-left-join" },
      ],
      practiceForms: ["code", "predict"],
      assessmentForms: ["predict INNER result"],
      completeness: "teachable",
      checkPrompt: "Does INNER JOIN keep unmatched left rows?",
    }),
    klConcept({
      id: "sql-left-join",
      title: "LEFT JOIN",
      aliases: ["left outer join", "SQL LEFT JOIN"],
      parentConceptId: "sql-joins",
      definition:
        "LEFT JOIN returns all rows from the left table and matching rows from the right; non-matches yield NULL on the right.",
      explanation:
        "Use when the left entity must appear even without related rows (all customers, including those with zero orders).",
      purpose: "Preserve the left table’s full set.",
      example: "LEFT JOIN orders o ON c.id = o.customer_id",
      misconceptions: ["LEFT JOIN does not remove unmatched left rows."],
      misconception: "Expecting INNER JOIN behavior from LEFT JOIN.",
      relatedConcepts: ["sql-joins", "sql-inner-join"],
      relationships: [
        { kind: "part_of", targetConceptId: "sql-joins" },
        { kind: "contrasts_with", targetConceptId: "sql-inner-join" },
      ],
      practiceForms: ["code", "predict", "explain"],
      assessmentForms: ["predict LEFT result with NULLs"],
      completeness: "teachable",
      checkPrompt: "What appears on the right side when there is no match in a LEFT JOIN?",
    }),
  ],
};

registerInstructionalPack(SQL_FUNDAMENTALS_PACK);
