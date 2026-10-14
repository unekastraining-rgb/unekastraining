"use client";

import type { InstructionalBlock } from "@/lib/learning/workspace";

/**
 * Bundle F — Learning Stage instructional blocks.
 * Distinct treatments by content kind — not identical card clones.
 */
export function LearningStageBlocks({
  blocks,
}: {
  blocks: InstructionalBlock[];
}) {
  if (blocks.length === 0) return null;

  return (
    <div data-learning-stage-blocks className="space-y-5">
      {blocks.map((block, i) => (
        <InstructionalBlockView key={`${block.kind}-${i}`} block={block} />
      ))}
    </div>
  );
}

function InstructionalBlockView({ block }: { block: InstructionalBlock }) {
  const label = (
    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
      {block.label}
    </p>
  );

  if (block.treatment === "code") {
    return (
      <section
        data-instructional-block={block.kind}
        data-block-treatment="code"
        className="overflow-x-auto border border-stone-800/15 bg-stone-950 px-4 py-3"
      >
        {label}
        {block.title ? (
          <h3 className="mt-1 text-sm font-semibold text-stone-200">
            {block.title}
          </h3>
        ) : null}
        <pre className="mt-2 whitespace-pre-wrap font-mono text-sm leading-relaxed text-teal-100">
          {block.body}
        </pre>
      </section>
    );
  }

  if (block.treatment === "diagram") {
    return (
      <section
        data-instructional-block={block.kind}
        data-block-treatment="diagram"
        className="border-l-4 border-teal-600 bg-teal-50/40 px-4 py-3"
      >
        {label}
        <pre className="mt-2 whitespace-pre-wrap font-mono text-sm leading-relaxed text-stone-800">
          {block.body}
        </pre>
      </section>
    );
  }

  if (block.treatment === "callout") {
    return (
      <section
        data-instructional-block={block.kind}
        data-block-treatment="callout"
        className={`border px-4 py-3 ${
          block.kind === "common-trap"
            ? "border-amber-300 bg-amber-50 text-amber-950"
            : "border-stone-300 bg-stone-50 text-stone-800"
        }`}
      >
        {label}
        <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">
          {block.body}
        </p>
      </section>
    );
  }

  if (block.treatment === "steps") {
    return (
      <section
        data-instructional-block={block.kind}
        data-block-treatment="steps"
        className="border border-stone-200 bg-white px-4 py-3"
      >
        {label}
        <pre className="mt-2 whitespace-pre-wrap font-mono text-sm leading-relaxed text-stone-800">
          {block.body}
        </pre>
      </section>
    );
  }

  if (block.treatment === "definition") {
    return (
      <section
        data-instructional-block={block.kind}
        data-block-treatment="definition"
        data-learn-concept-content
        className="space-y-2"
      >
        {label}
        {block.title ? (
          <h3 className="text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
            {block.title}
          </h3>
        ) : null}
        <p className="text-base leading-relaxed text-stone-700 whitespace-pre-wrap">
          {block.body}
        </p>
      </section>
    );
  }

  if (block.treatment === "scenario") {
    return (
      <section
        data-instructional-block={block.kind}
        data-block-treatment="scenario"
        className="border border-stone-300 bg-white px-4 py-3 shadow-sm"
      >
        {label}
        <p className="mt-2 text-sm leading-relaxed text-stone-800 whitespace-pre-wrap">
          {block.body}
        </p>
      </section>
    );
  }

  return (
    <section
      data-instructional-block={block.kind}
      data-block-treatment="prose"
      className="space-y-1"
    >
      {label}
      {block.title ? (
        <h3 className="text-lg font-semibold text-stone-900">{block.title}</h3>
      ) : null}
      <p className="text-sm leading-relaxed text-stone-700 whitespace-pre-wrap">
        {block.body}
      </p>
    </section>
  );
}
