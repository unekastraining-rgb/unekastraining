"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Download,
  HelpCircle,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";

import {
  HaulWritingProposal,
  useHaulWritingAi,
} from "@/components/haul/HaulWritingProposal";
import { ClientIcon } from "@/components/ui/ClientIcon";
import {
  addRepeatableSection,
  composeSectionPlainText,
  exportHaulWritingAsPlainText,
  moveWritingSection,
  removeWritingSection,
  sectionHasContent,
  upsertHaulWritingDocument,
} from "@/lib/haul/writing/document";
import {
  isSubstantialHaulWriting,
  type HaulWritingEvidenceSignal,
} from "@/lib/haul/writing/evidence";
import { getHaulWritingType } from "@/lib/haul/writing/registry";
import {
  getCanonicalConceptsForSection,
  getCanonicalConceptsForWritingType,
} from "@/lib/haul/writing/knowledge-map";
import { inferHaulWritingPhase } from "@/lib/haul/writing/loop-phases";
import { HaulWritingPhaseStrip } from "@/components/haul/HaulWritingPhaseStrip";
import { findInstructionalConceptById } from "@/lib/learning/knowledge/instructional-library";
import { teachMeHref } from "@/lib/study/loop-hrefs";
import type {
  HaulWritingDocument,
  HaulWritingSectionContent,
} from "@/lib/haul/writing/types";

function notifyHaulWritingEvidence(
  signal: HaulWritingEvidenceSignal,
  textSample?: string,
) {
  if (typeof window === "undefined") return;
  void fetch("/api/haul/writing/evidence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signal, textSample }),
  }).catch(() => {
    /* evidence is best-effort; writing must not depend on it */
  });
}

/**
 * Haul writing studio — three-zone desktop/iPad landscape workspace.
 * Structure | Writing canvas | Contextual tools
 * Portrait/phone: canvas primary; structure/tools as drawers.
 */
export function HaulWritingWorkspace({
  document: initialDoc,
  onBack,
  onChange,
}: {
  document: HaulWritingDocument;
  onBack: () => void;
  onChange: (doc: HaulWritingDocument) => void;
}) {
  const [doc, setDoc] = useState(initialDoc);
  const [activeSectionId, setActiveSectionId] = useState(
    initialDoc.sections[0]?.sectionId ?? "",
  );
  const [structureOpen, setStructureOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);
  const [selection, setSelection] = useState("");
  const ai = useHaulWritingAi();

  const writingType = getHaulWritingType(doc.writingTypeId);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    setDoc(initialDoc);
  }, [initialDoc.id]);

  useEffect(() => {
    upsertHaulWritingDocument(doc);
    onChange(doc);
  }, [doc]);

  const activeSection = doc.sections.find((s) => s.sectionId === activeSectionId);
  const typeSection = writingType?.sections.find(
    (s) =>
      s.id === activeSection?.sectionId ||
      activeSection?.sectionId.startsWith(s.id),
  );

  const updateSection = (sectionId: string, patch: Partial<HaulWritingSectionContent>) => {
    setDoc((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      sections: current.sections.map((s) =>
        s.sectionId === sectionId ? { ...s, ...patch } : s,
      ),
    }));
  };

  const runAi = async (action: string, extra?: Record<string, unknown>) => {
    if (!writingType || !activeSection) return;
    const text =
      (extra?.selectedText as string | undefined) ??
      (selection || composeSectionPlainText(activeSection));
    await ai.run({
      action,
      writingTypeId: writingType.id,
      writingTypeTitle: writingType.title,
      sectionId: activeSection.sectionId,
      sectionTitle: activeSection.title,
      sectionPurpose: typeSection?.purpose,
      sectionPrompt: typeSection?.prompt,
      currentText: composeSectionPlainText(activeSection),
      selectedText: text,
      documentTitle: doc.title,
      assignmentPrompt: doc.assignmentPrompt,
      ...extra,
    });
  };

  const applyReplace = () => {
    if (!ai.proposal || !activeSection) return;
    updateSection(activeSection.sectionId, { body: ai.proposal });
    notifyHaulWritingEvidence({
      action: "revision_applied",
      writingTypeId: doc.writingTypeId,
      sectionId: activeSection.sectionId,
      knowledgeConceptIds: typeSection?.knowledgeConceptIds,
      documentId: doc.id,
    });
    ai.clear();
  };

  const applyInsertBelow = () => {
    if (!ai.proposal || !activeSection) return;
    const current = composeSectionPlainText(activeSection);
    updateSection(activeSection.sectionId, {
      body: current ? `${current}\n\n${ai.proposal}` : ai.proposal,
    });
    notifyHaulWritingEvidence({
      action: "revision_applied",
      writingTypeId: doc.writingTypeId,
      sectionId: activeSection.sectionId,
      knowledgeConceptIds: typeSection?.knowledgeConceptIds,
      documentId: doc.id,
    });
    ai.clear();
  };

  const maybeRecordSubstantialWrite = (sectionId: string, text: string) => {
    if (!isSubstantialHaulWriting(text)) return;
    notifyHaulWritingEvidence(
      {
        action: "section_substantial_write",
        writingTypeId: doc.writingTypeId,
        sectionId,
        knowledgeConceptIds: typeSection?.knowledgeConceptIds,
        documentId: doc.id,
      },
      text,
    );
  };

  const studyTopic =
    typeSection?.knowledgeConceptIds?.[0] ??
    writingType?.sections
      .flatMap((s) => s.knowledgeConceptIds ?? [])
      .find(Boolean);

  const learnConceptIds = getCanonicalConceptsForSection(
    doc.writingTypeId,
    activeSection?.sectionId,
  );
  const genreConceptIds = getCanonicalConceptsForWritingType(doc.writingTypeId);

  const structureRail = (
    <nav
      data-haul-writing-structure
      className="flex h-full flex-col"
      aria-label="Writing structure"
    >
      <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">
        {writingType?.title ?? "Structure"}
      </p>
      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {doc.sections.map((s) => {
          const done = sectionHasContent(s);
          const active = s.sectionId === activeSectionId;
          return (
            <button
              key={s.sectionId}
              type="button"
              onClick={() => {
                setActiveSectionId(s.sectionId);
                setStructureOpen(false);
              }}
              className={`flex w-full min-h-11 items-start gap-2 rounded-lg px-2 py-2 text-left text-sm touch-manipulation ${
                active
                  ? "bg-stone-900 text-white"
                  : "text-stone-700 hover:bg-stone-100"
              }`}
            >
              <span className="mt-0.5 text-xs" aria-hidden>
                {done ? "✓" : "○"}
              </span>
              <span className="min-w-0 flex-1 leading-snug">{s.title}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );

  const learnPanel =
    learnOpen && writingType ? (
      <div className="space-y-3 text-sm text-stone-700">
        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
          Learn this type
        </p>
        <div>
          <p className="font-bold text-stone-900">What is this?</p>
          <p className="mt-1 text-xs leading-relaxed">
            {writingType.pedagogy?.whatIsThis ?? writingType.description}
          </p>
        </div>
        {writingType.pedagogy?.howStructured ? (
          <div>
            <p className="font-bold text-stone-900">How is it structured?</p>
            <p className="mt-1 text-xs leading-relaxed">
              {writingType.pedagogy.howStructured}
            </p>
          </div>
        ) : null}
        {writingType.commonMistakes?.length ? (
          <div>
            <p className="font-bold text-stone-900">Common mistakes</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-xs">
              {writingType.commonMistakes.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {writingType.pedagogy?.beforeFinish?.length ? (
          <div>
            <p className="font-bold text-stone-900">Before you finish</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-xs">
              {writingType.pedagogy.beforeFinish.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {(learnConceptIds.length > 0 || genreConceptIds.length > 0) ? (
          <div data-haul-learn-concepts>
            <p className="font-bold text-stone-900">Learn this</p>
            <ul className="mt-2 space-y-1.5">
              {[...new Set([...learnConceptIds, ...genreConceptIds.slice(0, 6)])]
                .slice(0, 8)
                .map((id) => {
                  const title =
                    findInstructionalConceptById(id)?.concept.title ?? id;
                  return (
                    <li key={id}>
                      <a
                        href={teachMeHref(null, null, title)}
                        data-haul-learn-concept={id}
                        className="inline-flex min-h-11 items-center text-xs font-semibold text-orange-800 underline-offset-2 hover:underline"
                      >
                        {title} — Learn
                      </a>
                    </li>
                  );
                })}
            </ul>
          </div>
        ) : null}
        {studyTopic ? (
          <a
            href={teachMeHref(
              null,
              null,
              findInstructionalConceptById(studyTopic)?.concept.title ??
                studyTopic,
            )}
            className="inline-flex min-h-11 items-center text-xs font-bold text-orange-700 underline-offset-2 hover:underline"
          >
            Open in Learning Studio →
          </a>
        ) : null}
        {writingType.specialization !== "full" ? (
          <p className="text-[10px] text-stone-500">
            Structured template; deeper pedagogy may grow later.
          </p>
        ) : null}
      </div>
    ) : null;

  const tools = writingType?.availableTools ?? [];

  const toolsPanel = (
    <div className="flex h-full flex-col gap-4 overflow-y-auto px-3 py-3">
      {learnPanel}
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
          Writing tools
        </p>
        {tools.includes("outline") ? (
          <ToolButton full label="Create outline" onClick={() => void runAi("outline")} />
        ) : null}
        {tools.includes("brainstorm") ? (
          <ToolButton
            full
            label="Brainstorm ideas"
            onClick={() => void runAi("brainstorm")}
          />
        ) : null}
        {tools.includes("continue") ? (
          <ToolButton full label="Continue this" onClick={() => void runAi("continue")} />
        ) : null}
        {tools.includes("expand") ? (
          <ToolButton full label="Expand" onClick={() => void runAi("expand")} />
        ) : null}
        {tools.includes("shorten") ? (
          <ToolButton full label="Shorten" onClick={() => void runAi("shorten")} />
        ) : null}
        {tools.includes("simplify") ? (
          <ToolButton full label="Simplify" onClick={() => void runAi("simplify")} />
        ) : null}
        <p className="pt-1 text-[10px] leading-relaxed text-stone-400">
          AI proposes text. You choose replace, insert, or copy. Writing works without AI.
        </p>
      </div>
      {selection ? (
        <div className="space-y-2 border-t border-stone-200 pt-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-orange-700">
            Selection
          </p>
          <p className="line-clamp-4 text-xs text-stone-700">{selection}</p>
          <div className="flex flex-col gap-1">
            {(
              [
                ["keep-meaning", "Paraphrase"],
                ["simplify", "Simplify"],
                ["more-academic", "More academic"],
                ["more-concise", "More concise"],
                ["more-natural", "More natural"],
              ] as const
            ).map(([style, label]) => (
              <ToolButton
                key={style}
                full
                label={label}
                onClick={() =>
                  void runAi("paraphrase", {
                    selectedText: selection,
                    paraphraseStyle: style,
                  })
                }
              />
            ))}
          </div>
        </div>
      ) : null}
      {typeSection?.knowledgeConceptIds?.length && !learnOpen ? (
        <a
          href={teachMeHref(
            null,
            null,
            findInstructionalConceptById(typeSection.knowledgeConceptIds[0]!)
              ?.concept.title ?? typeSection.knowledgeConceptIds[0]!,
          )}
          className="text-xs font-semibold text-orange-700 underline-offset-2 hover:underline"
        >
          Study this concept →
        </a>
      ) : null}
    </div>
  );

  const writingPhase = inferHaulWritingPhase(doc);

  return (
    <div
      data-haul-writing-workspace
      className="flex min-h-[calc(100dvh-5.5rem)] w-full flex-col bg-stone-100/80"
    >
      {/* Application header — full width, not a centered card */}
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-stone-200 bg-white px-3 py-2 sm:px-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-stone-600 touch-manipulation hover:text-stone-900"
        >
          <ClientIcon icon={ArrowLeft} className="h-4 w-4" />
          Haul
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-600">
            {writingType?.title ?? "Writing"} · {doc.mode}
          </p>
          <input
            value={doc.title}
            onChange={(e) =>
              setDoc((c) => ({
                ...c,
                title: e.target.value,
                updatedAt: new Date().toISOString(),
              }))
            }
            className="w-full max-w-xl bg-transparent text-lg font-black text-stone-900 outline-none sm:text-xl"
            placeholder="Document title"
            aria-label="Document title"
          />
        </div>
        <p className="hidden text-[10px] text-stone-400 md:block">
          Saved locally · outline ≠ mastery
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setLearnOpen((v) => !v)}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold touch-manipulation ${
              learnOpen
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-200 bg-white text-stone-700"
            }`}
          >
            <ClientIcon icon={BookOpen} className="h-4 w-4" />
            Learn
          </button>
          <button
            type="button"
            onClick={() => {
              const text = exportHaulWritingAsPlainText(doc);
              const blob = new Blob([text], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${doc.title.replace(/\s+/g, "-").toLowerCase() || "haul-writing"}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-700 touch-manipulation"
          >
            <ClientIcon icon={Download} className="h-4 w-4" />
            Export
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-700 xl:hidden touch-manipulation"
            onClick={() => {
              setStructureOpen((v) => !v);
              setToolsOpen(false);
            }}
          >
            Outline
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-700 xl:hidden touch-manipulation"
            onClick={() => {
              setToolsOpen((v) => !v);
              setStructureOpen(false);
            }}
          >
            Tools
          </button>
        </div>
      </header>

      <HaulWritingPhaseStrip phase={writingPhase} />

      {/* Mobile drawers */}
      {structureOpen ? (
        <div className="border-b border-stone-200 bg-white xl:hidden">
          <div className="max-h-56 overflow-y-auto py-2">{structureRail}</div>
        </div>
      ) : null}
      {toolsOpen ? (
        <div className="border-b border-stone-200 bg-white xl:hidden">
          <div className="max-h-64 overflow-y-auto">{toolsPanel}</div>
        </div>
      ) : null}

      {/* Three-zone studio: Structure | Canvas | Tools */}
      <div
        data-haul-writing-stage
        className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[240px_minmax(0,1fr)_280px]"
      >
        <aside className="hidden min-h-0 border-r border-stone-200 bg-white xl:block">
          {structureRail}
        </aside>

        <main className="min-h-0 min-w-0 overflow-y-auto bg-stone-50/90">
          {activeSection ? (
            <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-8 sm:py-8">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-stone-900 sm:text-2xl">
                    {activeSection.title}
                  </h2>
                  {typeSection?.purpose ? (
                    <p className="mt-1 text-sm text-stone-500">{typeSection.purpose}</p>
                  ) : null}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label="Move section up"
                    onClick={() =>
                      setDoc((d) => moveWritingSection(d, activeSection.sectionId, -1))
                    }
                    className="min-h-11 min-w-11 rounded-lg border border-stone-200 bg-white p-2 text-stone-500 touch-manipulation"
                  >
                    <ClientIcon icon={ChevronUp} className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Move section down"
                    onClick={() =>
                      setDoc((d) => moveWritingSection(d, activeSection.sectionId, 1))
                    }
                    className="min-h-11 min-w-11 rounded-lg border border-stone-200 bg-white p-2 text-stone-500 touch-manipulation"
                  >
                    <ClientIcon icon={ChevronDown} className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Remove section"
                    onClick={() =>
                      setDoc((d) => removeWritingSection(d, activeSection.sectionId))
                    }
                    className="min-h-11 min-w-11 rounded-lg border border-rose-100 bg-white p-2 text-rose-500 touch-manipulation"
                  >
                    <ClientIcon icon={Trash2} className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {typeSection?.fields?.length ? (
                <div className="mt-6 space-y-6">
                  {typeSection.fields.map((field) => (
                    <div key={field.id}>
                      <label className="text-sm font-bold text-stone-900">
                        {field.label}
                      </label>
                      {field.placeholder ? (
                        <p className="mt-0.5 text-xs text-stone-500">{field.placeholder}</p>
                      ) : null}
                      <textarea
                        value={activeSection.fieldValues?.[field.id] ?? ""}
                        onChange={(e) =>
                          updateSection(activeSection.sectionId, {
                            fieldValues: {
                              ...(activeSection.fieldValues ?? {}),
                              [field.id]: e.target.value,
                            },
                          })
                        }
                        onSelect={(e) => {
                          const t = e.currentTarget;
                          setSelection(
                            t.value.slice(t.selectionStart, t.selectionEnd),
                          );
                        }}
                        onBlur={(e) =>
                          maybeRecordSubstantialWrite(
                            activeSection.sectionId,
                            composeSectionPlainText({
                              ...activeSection,
                              fieldValues: {
                                ...(activeSection.fieldValues ?? {}),
                                [field.id]: e.target.value,
                              },
                            }),
                          )
                        }
                        rows={field.multiline === false ? 2 : 5}
                        className="mt-2 w-full resize-y rounded-lg border border-stone-200 bg-white px-3 py-3 text-sm leading-relaxed text-stone-900 outline-none focus:border-orange-300"
                        placeholder="Write here…"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="text-sm font-bold text-stone-900">
                      Additional notes
                    </label>
                    <textarea
                      value={activeSection.body}
                      onChange={(e) =>
                        updateSection(activeSection.sectionId, {
                          body: e.target.value,
                        })
                      }
                      onSelect={(e) => {
                        const t = e.currentTarget;
                        setSelection(
                          t.value.slice(t.selectionStart, t.selectionEnd),
                        );
                      }}
                      onBlur={(e) =>
                        maybeRecordSubstantialWrite(
                          activeSection.sectionId,
                          composeSectionPlainText({
                            ...activeSection,
                            body: e.target.value,
                          }),
                        )
                      }
                      rows={4}
                      className="mt-2 w-full resize-y rounded-lg border border-stone-200 bg-white px-3 py-3 text-sm leading-relaxed text-stone-900 outline-none focus:border-orange-300"
                      placeholder="Optional free writing for this section…"
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-6">
                  {typeSection?.prompt ? (
                    <p className="mb-2 text-xs text-stone-500">{typeSection.prompt}</p>
                  ) : null}
                  <textarea
                    value={activeSection.body}
                    onChange={(e) =>
                      updateSection(activeSection.sectionId, {
                        body: e.target.value,
                      })
                    }
                    onSelect={(e) => {
                      const t = e.currentTarget;
                      setSelection(t.value.slice(t.selectionStart, t.selectionEnd));
                    }}
                    onBlur={(e) =>
                      maybeRecordSubstantialWrite(
                        activeSection.sectionId,
                        e.target.value,
                      )
                    }
                    rows={16}
                    className="min-h-[280px] w-full resize-y rounded-lg border border-stone-200 bg-white px-4 py-4 text-base leading-relaxed text-stone-900 outline-none focus:border-orange-300"
                    placeholder="Write here…"
                  />
                </div>
              )}

              {/* Contextual help stays in the writing stage */}
              <div className="mt-5 flex flex-wrap gap-2 border-t border-stone-200/80 pt-4">
                <span className="w-full text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Need help with this section?
                </span>
                <ToolButton
                  label="Explain"
                  onClick={() => void runAi("explain-section")}
                />
                <ToolButton
                  label="See example"
                  onClick={() => void runAi("examples")}
                />
                <ToolButton
                  label="Help me build"
                  onClick={() => void runAi("help-build")}
                />
                <ToolButton
                  label="Write for me"
                  onClick={() => void runAi("write-for-me")}
                />
                {typeSection?.id === "introduction" ||
                typeSection?.fields?.some((f) => f.id === "thesis" || f.id === "claim") ? (
                  <ToolButton
                    label="Generate thesis"
                    onClick={() => void runAi("generate-thesis")}
                  />
                ) : null}
                <ToolButton
                  label="Paraphrase selection"
                  onClick={() =>
                    void runAi("paraphrase", {
                      selectedText: selection,
                      paraphraseStyle: "keep-meaning",
                    })
                  }
                />
                <ToolButton
                  label="Improve clarity"
                  onClick={() => void runAi("improve-clarity")}
                />
                <ToolButton
                  label="Feedback"
                  onClick={() => {
                    notifyHaulWritingEvidence({
                      action: "feedback_requested",
                      writingTypeId: doc.writingTypeId,
                      sectionId: activeSection.sectionId,
                      knowledgeConceptIds: typeSection?.knowledgeConceptIds,
                      documentId: doc.id,
                    });
                    void runAi("feedback");
                  }}
                />
              </div>

              {typeSection?.help?.explain ? (
                <p className="mt-4 flex gap-2 text-xs text-stone-500">
                  <ClientIcon icon={HelpCircle} className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {typeSection.help.explain}
                </p>
              ) : null}

              {typeSection?.examples?.[0] ? (
                <details className="mt-3 text-xs text-stone-600">
                  <summary className="cursor-pointer font-semibold">
                    {typeSection.examples[0].label ?? "Example"}
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap border-l-2 border-stone-200 pl-3">
                    {typeSection.examples[0].text}
                  </p>
                </details>
              ) : null}

              <HaulWritingProposal
                original={selection || composeSectionPlainText(activeSection)}
                proposal={ai.proposal}
                busy={ai.busy}
                error={ai.error}
                onReplace={applyReplace}
                onInsertBelow={applyInsertBelow}
                onCopy={() => {
                  if (ai.proposal) void navigator.clipboard.writeText(ai.proposal);
                }}
                onTryAnother={() => void ai.retry()}
                onDismiss={ai.clear}
              />

              {typeSection?.repeatable ? (
                <button
                  type="button"
                  onClick={() =>
                    setDoc((d) => addRepeatableSection(d, typeSection.id))
                  }
                  className="mt-4 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-stone-600 touch-manipulation"
                >
                  <ClientIcon icon={Plus} className="h-3.5 w-3.5" />
                  Add another paragraph
                </button>
              ) : null}
            </div>
          ) : (
            <p className="px-6 py-12 text-sm text-stone-500">
              Select a section to begin writing.
            </p>
          )}
        </main>

        <aside className="hidden min-h-0 border-l border-stone-200 bg-white xl:block">
          {toolsPanel}
        </aside>
      </div>
    </div>
  );
}

function ToolButton({
  label,
  onClick,
  full,
}: {
  label: string;
  onClick: () => void;
  full?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 touch-manipulation hover:bg-stone-50 ${
        full ? "w-full justify-start" : ""
      }`}
    >
      <ClientIcon icon={Sparkles} className="h-3.5 w-3.5 text-orange-500" />
      {label}
    </button>
  );
}
