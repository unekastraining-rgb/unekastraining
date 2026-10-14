"use client";

export type SqlChallengeView = {
  id: string;
  title: string;
  prompt: string;
  starter?: string;
  objective?: string;
  schemaPreview?: string;
};

/**
 * SQL writing practice — schema context + editor.
 * Does not invent query results client-side; results checked on submit.
 */
export function SqlWorkspacePanel(props: {
  challenge: SqlChallengeView;
  value: string;
  onChange: (sql: string) => void;
  onReset: () => void;
}) {
  const { challenge, value, onChange, onReset } = props;

  return (
    <div
      data-sql-workspace
      className="grid gap-4 lg:grid-cols-[minmax(14rem,20rem)_minmax(0,1fr)]"
    >
      <aside className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Schema / context
          </h2>
          <p className="mt-1 text-sm font-medium text-stone-900">
            {challenge.title}
          </p>
          {challenge.objective ? (
            <p className="mt-2 text-sm text-stone-700">
              Goal: {challenge.objective}
            </p>
          ) : null}
        </div>
        {challenge.schemaPreview ? (
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl border border-stone-200 bg-white p-3 font-mono text-xs text-stone-800">
            {challenge.schemaPreview}
          </pre>
        ) : (
          <p className="text-sm text-stone-600">
            Use the task prompt to infer the tables and columns you need.
          </p>
        )}
        <p
          className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950"
          data-sql-honesty
        >
          SQL writing practice — results checked on submit
        </p>
      </aside>

      <div className="space-y-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Task
          </h2>
          <p className="mt-1 whitespace-pre-wrap text-sm text-stone-700">
            {challenge.prompt}
          </p>
        </div>

        <label className="block text-sm font-medium text-stone-700">
          Your SQL
          <textarea
            className="mt-1 min-h-[14rem] w-full rounded-xl border border-stone-200 bg-white px-3 py-2 font-mono text-sm text-stone-900"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            aria-label="SQL editor"
          />
        </label>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50 touch-manipulation"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
