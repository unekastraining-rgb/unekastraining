/**
 * 2G-71 WS D — Educational SQL challenges (controlled datasets only).
 * 2P-7: objective / domainTag / conceptHints for content↔concept alignment.
 */

import type { ContentEnrichmentFields } from "@/lib/learning/content-production/enrichment";

/** Optional learner scaffolds authored on the challenge (2P-12). */
export type SqlChallengeScaffold = {
  kind: "HINT" | "STEP" | "EXAMPLE" | "CHECKLIST" | "CONSTRAINT";
  label: string;
  content: string;
  level?: 1 | 2 | 3;
  revealPolicy?: "ON_REQUEST" | "ALWAYS";
  doesNotRevealAnswer?: boolean;
};

export type SqlChallenge = {
  id: string;
  title: string;
  /** What the learner will demonstrate (2P-7). */
  objective: string;
  prompt: string;
  /** Seed SQL run before learner query (educational DB only). */
  seedSql: string;
  /** Expected row objects for SELECT result comparison (order-insensitive by default). */
  expectedRows: Array<Record<string, unknown>>;
  starter: string;
  domainTag?: string;
  conceptHints?: readonly string[];
  /** Content-authored learner support — not an answer key (2P-12). */
  scaffolds?: readonly SqlChallengeScaffold[];
  /** Optional authored success description (2P-12). */
  successLooksLike?: string;
} & ContentEnrichmentFields;

export const SQL_CHALLENGES: SqlChallenge[] = [
  {
    id: "sql-select-students",
    title: "Select all students",
    objective: "Retrieve all rows from a table with a SELECT query.",
    prompt: "Write a SELECT that returns every row from the `students` table.",
    seedSql: `
      CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT, grade INTEGER);
      INSERT INTO students (id, name, grade) VALUES (1, 'Ada', 95);
      INSERT INTO students (id, name, grade) VALUES (2, 'Grace', 88);
      INSERT INTO students (id, name, grade) VALUES (3, 'Alan', 91);
    `,
    expectedRows: [
      { id: 1, name: "Ada", grade: 95 },
      { id: 2, name: "Grace", grade: 88 },
      { id: 3, name: "Alan", grade: 91 },
    ],
    starter: "-- Return every row from the students table\nSELECT ",
    domainTag: "computer science",
    conceptHints: ["select", "sql", "table", "query", "projection"],
    misconceptionTargets: [
      "omitting FROM when selecting from a table",
    ],
    successLooksLike:
      "SELECT * FROM students (or explicit columns) returns all three student rows.",
    scaffolds: [
      {
        kind: "HINT",
        label: "Table name",
        content: "Name the table after FROM — the prompt says students.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    accessibility: {
      altDescription: "Write a SELECT that returns every row from students.",
      reducedComplexity: true,
    },
  },
  {
    id: "sql-high-grades",
    title: "Students with grade >= 90",
    objective:
      "Retrieve records matching specified filter conditions with WHERE.",
    prompt: "Return `name` and `grade` for students with grade >= 90.",
    seedSql: `
      CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT, grade INTEGER);
      INSERT INTO students (id, name, grade) VALUES (1, 'Ada', 95);
      INSERT INTO students (id, name, grade) VALUES (2, 'Grace', 88);
      INSERT INTO students (id, name, grade) VALUES (3, 'Alan', 91);
    `,
    expectedRows: [
      { name: "Ada", grade: 95 },
      { name: "Alan", grade: 91 },
    ],
    // Incomplete scaffold — not the solution (2P-6 learning depth).
    starter: "-- Return name and grade where grade >= 90\nSELECT ",
    domainTag: "computer science",
    conceptHints: [
      "filter",
      "filtering",
      "where",
      "sql",
      "condition",
      "predicate",
    ],
    successLooksLike:
      "Your SELECT should return only the requested columns for rows that match the grade filter.",
    scaffolds: [
      {
        kind: "HINT",
        label: "Filtering",
        content:
          "You need both a column list and a condition that keeps only high grades.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
      {
        kind: "STEP",
        label: "Query shape",
        content:
          "1) SELECT the columns named in the prompt. 2) FROM students. 3) Add a WHERE clause for the grade threshold — do not invent extra columns.",
        level: 2,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
  },
  {
    id: "sql-join-enrollments",
    title: "Join students to enrollments",
    objective:
      "Combine related rows from two tables with an INNER JOIN on matching keys.",
    prompt:
      "Return each student's `name` and the `course` they enrolled in. Use an INNER JOIN between `students` and `enrollments` on student id.",
    seedSql: `
      CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT);
      CREATE TABLE enrollments (id INTEGER PRIMARY KEY, student_id INTEGER, course TEXT);
      INSERT INTO students (id, name) VALUES (1, 'Ada');
      INSERT INTO students (id, name) VALUES (2, 'Grace');
      INSERT INTO enrollments (id, student_id, course) VALUES (1, 1, 'CS101');
      INSERT INTO enrollments (id, student_id, course) VALUES (2, 1, 'MATH20');
      INSERT INTO enrollments (id, student_id, course) VALUES (3, 2, 'CS101');
    `,
    expectedRows: [
      { name: "Ada", course: "CS101" },
      { name: "Ada", course: "MATH20" },
      { name: "Grace", course: "CS101" },
    ],
    starter:
      "-- Return name and course via INNER JOIN\nSELECT ",
    domainTag: "computer science",
    conceptHints: [
      "join",
      "inner join",
      "sql",
      "enrollment",
      "relational",
      "foreign key",
    ],
    misconceptionTargets: [
      "selecting from one table only when rows span two tables",
      "joining on the wrong key column",
    ],
    successLooksLike:
      "Your query should INNER JOIN students to enrollments and project name + course for every matching enrollment.",
    accessibility: {
      altDescription:
        "Write a SQL INNER JOIN that lists each student name with their enrolled course.",
      reducedComplexity: true,
    },
    scaffolds: [
      {
        kind: "HINT",
        label: "Two tables",
        content:
          "Student names live in students; course names live in enrollments — you need both.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
      {
        kind: "STEP",
        label: "Join shape",
        content:
          "1) SELECT name, course 2) FROM students 3) INNER JOIN enrollments ON the matching id columns.",
        level: 2,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
  },
  {
    id: "sql-group-by-having",
    title: "GROUP BY with HAVING",
    objective:
      "Aggregate rows and filter groups with HAVING (not WHERE).",
    prompt:
      "Return each `course` and its average `grade` (alias `avg_grade`) for courses whose average grade is at least 90. Use GROUP BY and HAVING.",
    seedSql: `
      CREATE TABLE enrollments (id INTEGER PRIMARY KEY, course TEXT, grade INTEGER);
      INSERT INTO enrollments (id, course, grade) VALUES (1, 'CS101', 95);
      INSERT INTO enrollments (id, course, grade) VALUES (2, 'CS101', 92);
      INSERT INTO enrollments (id, course, grade) VALUES (3, 'MATH20', 80);
      INSERT INTO enrollments (id, course, grade) VALUES (4, 'MATH20', 85);
      INSERT INTO enrollments (id, course, grade) VALUES (5, 'HIST10', 91);
      INSERT INTO enrollments (id, course, grade) VALUES (6, 'HIST10', 93);
    `,
    expectedRows: [
      { course: "CS101", avg_grade: 93.5 },
      { course: "HIST10", avg_grade: 92 },
    ],
    starter:
      "-- Average grade by course where average >= 90\nSELECT course, AVG(grade) AS avg_grade\nFROM enrollments\n",
    domainTag: "computer science",
    conceptHints: [
      "group by",
      "having",
      "aggregate",
      "sql",
      "average",
    ],
    misconceptionTargets: [
      "filtering aggregates with WHERE instead of HAVING",
    ],
    successLooksLike:
      "GROUP BY course, compute AVG(grade), HAVING AVG(grade) >= 90.",
    scaffolds: [
      {
        kind: "HINT",
        label: "WHERE vs HAVING",
        content:
          "WHERE filters rows before aggregation; HAVING filters groups after AVG/COUNT.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
  },
  {
    id: "sql-null-is-null",
    title: "Find NULL emails with IS NULL",
    objective:
      "Select rows where a column is NULL using IS NULL (not = NULL).",
    prompt:
      "Return `name` for students whose `email` is NULL.",
    seedSql: `
      CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT, email TEXT);
      INSERT INTO students (id, name, email) VALUES (1, 'Ada', 'ada@example.com');
      INSERT INTO students (id, name, email) VALUES (2, 'Grace', NULL);
      INSERT INTO students (id, name, email) VALUES (3, 'Alan', NULL);
    `,
    expectedRows: [{ name: "Grace" }, { name: "Alan" }],
    starter: "-- Names where email is NULL\nSELECT name FROM students WHERE ",
    domainTag: "computer science",
    conceptHints: ["null", "is null", "sql", "missing", "three-valued"],
    misconceptionTargets: ["using = NULL which never matches"],
    successLooksLike: "WHERE email IS NULL returns Grace and Alan.",
    scaffolds: [
      {
        kind: "HINT",
        label: "NULL is not a value",
        content:
          "In SQL, comparisons with = NULL do not work the way beginners expect — use IS NULL.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
  },
  {
    id: "sql-left-join-missing",
    title: "LEFT JOIN students without courses",
    objective:
      "Preserve students with no enrollments using LEFT JOIN and IS NULL.",
    prompt:
      "Return each student `name` who has no enrollment row. Use LEFT JOIN from students to enrollments and keep rows where the enrollment key is NULL.",
    seedSql: `
      CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT);
      CREATE TABLE enrollments (id INTEGER PRIMARY KEY, student_id INTEGER, course TEXT);
      INSERT INTO students (id, name) VALUES (1, 'Ada');
      INSERT INTO students (id, name) VALUES (2, 'Grace');
      INSERT INTO students (id, name) VALUES (3, 'Alan');
      INSERT INTO enrollments (id, student_id, course) VALUES (1, 1, 'CS101');
      INSERT INTO enrollments (id, student_id, course) VALUES (2, 2, 'MATH20');
    `,
    expectedRows: [{ name: "Alan" }],
    starter:
      "-- Students with no enrollments via LEFT JOIN\nSELECT students.name\nFROM students\nLEFT JOIN enrollments ON ",
    domainTag: "computer science",
    conceptHints: [
      "left join",
      "outer join",
      "sql",
      "missing match",
      "is null",
    ],
    misconceptionTargets: [
      "using INNER JOIN when unmatched left rows are required",
    ],
    successLooksLike:
      "LEFT JOIN then filter WHERE enrollments.student_id IS NULL (or equivalent) yields Alan.",
    scaffolds: [
      {
        kind: "STEP",
        label: "Shape",
        content:
          "1) FROM students 2) LEFT JOIN enrollments ON students.id = enrollments.student_id 3) WHERE enrollment side IS NULL.",
        level: 2,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
  },
  {
    id: "sql-join-customers-orders",
    title: "Join customers to orders",
    objective:
      "Combine related rows from customers and orders with an INNER JOIN on matching keys.",
    prompt:
      "Return each customer's `name` and the `product` they ordered. Use an INNER JOIN between `customers` and `orders` on customer id.",
    seedSql: `
      CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT);
      CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, product TEXT);
      INSERT INTO customers (id, name) VALUES (1, 'Nia');
      INSERT INTO customers (id, name) VALUES (2, 'Omar');
      INSERT INTO orders (id, customer_id, product) VALUES (1, 1, 'Laptop');
      INSERT INTO orders (id, customer_id, product) VALUES (2, 1, 'Mouse');
      INSERT INTO orders (id, customer_id, product) VALUES (3, 2, 'Keyboard');
    `,
    expectedRows: [
      { name: "Nia", product: "Laptop" },
      { name: "Nia", product: "Mouse" },
      { name: "Omar", product: "Keyboard" },
    ],
    starter: "-- Return name and product via INNER JOIN\nSELECT ",
    domainTag: "computer science",
    conceptHints: [
      "join",
      "inner join",
      "sql",
      "orders",
      "customers",
      "foreign key",
    ],
    misconceptionTargets: [
      "joining on product name instead of customer id",
      "selecting from one table only when rows span two tables",
    ],
    successLooksLike:
      "INNER JOIN customers to orders on id/customer_id and project name + product.",
    accessibility: {
      altDescription:
        "Write an INNER JOIN listing each customer name with ordered products.",
      reducedComplexity: true,
    },
    scaffolds: [
      {
        kind: "HINT",
        label: "Same join idea",
        content:
          "Same INNER JOIN pattern as students/enrollments — only table and column names changed.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
  },
  {
    id: "sql-subquery-above-avg",
    title: "Orders above average amount",
    objective:
      "Filter rows using a subquery that compares to an aggregate average.",
    prompt:
      "Return `id` and `amount` for orders whose amount is greater than the average amount of all orders. Use a subquery in the WHERE clause.",
    seedSql: `
      CREATE TABLE orders (id INTEGER PRIMARY KEY, amount INTEGER);
      INSERT INTO orders (id, amount) VALUES (1, 100);
      INSERT INTO orders (id, amount) VALUES (2, 200);
      INSERT INTO orders (id, amount) VALUES (3, 50);
      INSERT INTO orders (id, amount) VALUES (4, 150);
    `,
    expectedRows: [
      { id: 2, amount: 200 },
      { id: 4, amount: 150 },
    ],
    starter:
      "-- Orders with amount > average amount\nSELECT id, amount FROM orders WHERE amount > ",
    domainTag: "computer science",
    conceptHints: [
      "subquery",
      "aggregate",
      "average",
      "sql",
      "where",
      "join",
    ],
    misconceptionTargets: [
      "filtering groups with WHERE after thinking AVG runs per row without a subquery",
    ],
    successLooksLike:
      "WHERE amount > (SELECT AVG(amount) FROM orders) returns the above-average orders.",
    scaffolds: [
      {
        kind: "HINT",
        label: "Compare to a set aggregate",
        content:
          "You need a scalar subquery that computes AVG(amount) over the whole table.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
  },
  {
    id: "sql-filter-products-retain",
    title: "Filter products in stock (retain)",
    objective:
      "Retrieve WHERE filtering on a new products table without relying on the students dataset.",
    prompt:
      "Retain: Return `name` and `price` for products with `stock` > 0.",
    seedSql: `
      CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price INTEGER, stock INTEGER);
      INSERT INTO products (id, name, price, stock) VALUES (1, 'Pen', 2, 10);
      INSERT INTO products (id, name, price, stock) VALUES (2, 'Notebook', 5, 0);
      INSERT INTO products (id, name, price, stock) VALUES (3, 'Eraser', 1, 4);
    `,
    expectedRows: [
      { name: "Pen", price: 2 },
      { name: "Eraser", price: 1 },
    ],
    starter: "-- In-stock products\nSELECT ",
    domainTag: "computer science",
    conceptHints: ["filter", "where", "sql", "retain", "products"],
    misconceptionTargets: [
      "forgetting WHERE when only a subset of rows is required",
    ],
    successLooksLike:
      "SELECT name, price FROM products WHERE stock > 0 returns Pen and Eraser.",
  },
  {
    id: "sql-order-by-grade",
    title: "Sort students by grade",
    objective: "Use ORDER BY to sort query results descending by a numeric column.",
    prompt: "Return `name` and `grade` for all students ordered by grade highest-first.",
    seedSql: `
      CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT, grade INTEGER);
      INSERT INTO students (id, name, grade) VALUES (1, 'Ada', 95);
      INSERT INTO students (id, name, grade) VALUES (2, 'Grace', 88);
      INSERT INTO students (id, name, grade) VALUES (3, 'Alan', 91);
    `,
    expectedRows: [
      { name: "Ada", grade: 95 },
      { name: "Alan", grade: 91 },
      { name: "Grace", grade: 88 },
    ],
    starter: "-- Highest grade first\nSELECT ",
    domainTag: "computer science",
    conceptHints: ["order by", "sort", "descending", "sql"],
    misconceptionTargets: ["assuming SELECT order is guaranteed without ORDER BY"],
    successLooksLike:
      "SELECT name, grade FROM students ORDER BY grade DESC returns Ada, Alan, Grace.",
    scaffolds: [
      {
        kind: "HINT",
        label: "DESC keyword",
        content: "ORDER BY grade DESC puts the largest grades first.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
  },
  {
    id: "sql-count-by-dept",
    title: "Count employees per department",
    objective: "Aggregate with GROUP BY to count rows per category.",
    prompt: "Return `dept` and `n` (COUNT of employees) grouped by department.",
    seedSql: `
      CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, dept TEXT);
      INSERT INTO employees (id, name, dept) VALUES (1, 'Ava', 'Eng');
      INSERT INTO employees (id, name, dept) VALUES (2, 'Ben', 'Eng');
      INSERT INTO employees (id, name, dept) VALUES (3, 'Cara', 'HR');
    `,
    expectedRows: [
      { dept: "Eng", n: 2 },
      { dept: "HR", n: 1 },
    ],
    starter: "-- Count per department\nSELECT ",
    domainTag: "computer science",
    conceptHints: ["group by", "count", "aggregate", "sql"],
    misconceptionTargets: [
      "selecting non-aggregated columns without grouping them",
    ],
    successLooksLike:
      "SELECT dept, COUNT(*) AS n FROM employees GROUP BY dept.",
    scaffolds: [
      {
        kind: "HINT",
        label: "GROUP BY the category",
        content: "GROUP BY dept when you want one row per department.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
  },
  {
    id: "sql-inner-join-orders",
    title: "Join customers to orders",
    objective: "Combine related tables with an INNER JOIN on a key.",
    prompt:
      "Return `customers.name` and `orders.amount` for matching customer_id joins.",
    seedSql: `
      CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT);
      CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, amount INTEGER);
      INSERT INTO customers (id, name) VALUES (1, 'Ada');
      INSERT INTO customers (id, name) VALUES (2, 'Grace');
      INSERT INTO orders (id, customer_id, amount) VALUES (10, 1, 40);
      INSERT INTO orders (id, customer_id, amount) VALUES (11, 1, 15);
      INSERT INTO orders (id, customer_id, amount) VALUES (12, 2, 22);
    `,
    expectedRows: [
      { name: "Ada", amount: 40 },
      { name: "Ada", amount: 15 },
      { name: "Grace", amount: 22 },
    ],
    starter: "-- Join customers to orders\nSELECT ",
    domainTag: "computer science",
    conceptHints: ["join", "inner join", "foreign key", "sql", "relationship"],
    misconceptionTargets: [
      "cartesian products when forgetting the ON condition",
    ],
    successLooksLike:
      "JOIN on customers.id = orders.customer_id returns three amount rows.",
    scaffolds: [
      {
        kind: "HINT",
        label: "ON the key",
        content: "Match customers.id to orders.customer_id in the ON clause.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
  },
];

export function getSqlChallenge(id: string): SqlChallenge | null {
  return SQL_CHALLENGES.find((c) => c.id === id) ?? null;
}

export function listSqlChallenges(): Array<
  Pick<
    SqlChallenge,
    "id" | "title" | "prompt" | "starter" | "objective" | "domainTag"
  >
> {
  return SQL_CHALLENGES.map(
    ({ id, title, prompt, starter, objective, domainTag }) => ({
      id,
      title,
      prompt,
      starter,
      objective,
      domainTag,
    }),
  );
}

/** Reject destructive / multi-statement / non-SELECT educational queries. */
export function isSafeEducationalSelect(sql: string): {
  ok: boolean;
  reason?: string;
} {
  const trimmed = sql.trim().replace(/;+\s*$/, "");
  if (!trimmed) return { ok: false, reason: "empty_sql" };
  if (trimmed.includes(";")) {
    return { ok: false, reason: "multiple_statements_rejected" };
  }
  const upper = trimmed.toUpperCase();
  if (!upper.startsWith("SELECT") && !upper.startsWith("WITH")) {
    return { ok: false, reason: "only_select_allowed" };
  }
  const banned =
    /\b(DROP|DELETE|UPDATE|INSERT|ALTER|ATTACH|DETACH|PRAGMA|REPLACE|CREATE|TRUNCATE|GRANT|REVOKE|EXEC|EXECUTE)\b/i;
  if (banned.test(trimmed)) {
    return { ok: false, reason: "destructive_or_mutating_rejected" };
  }
  return { ok: true };
}
