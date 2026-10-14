"use client";

import { useState } from "react";

import { CoreChromeAction } from "@/components/core/CoreChromeAction";
import { InkColorControls } from "@/components/core/toolbar/InkColorControls";
import {
  CoreToolbarShell,
  NavRow,
  OptionChip,
  SliderRow,
  ToggleRow,
} from "@/components/core/toolbar/CoreToolbarShell";
import type { CoreToolbarState, PenMode } from "@/lib/core/core-toolbar-types";

type PenScreen =
  | "main"
  | "pen-picker"
  | "fountain"
  | "pen-settings"
  | "draw-hold"
  | "gestures"
  | "writing-aids"
  | "dictionary"
  | "pencil"
  | "colorPencil"
  | "chalk"
  | "crayon"
  | "marker"
  | "highlighter"
  | "tape"
  | "shape";

const PEN_VARIANTS: { id: PenMode; label: string }[] = [
  { id: "fountain", label: "Fountain pen" },
  { id: "ball", label: "Ball pen" },
  { id: "brush", label: "Brush pen" },
];

const WRITING_TOOLS: {
  id: PenMode | "pen-picker";
  label: string;
  hint: string;
  emoji: string;
}[] = [
  { id: "pencil", label: "Pencil", hint: "Graphite", emoji: "✏️" },
  { id: "colorPencil", label: "Color pencils", hint: "Soft colored leads", emoji: "🎨" },
  { id: "pen-picker", label: "Pen", hint: "Fountain, ball, brush", emoji: "🖊️" },
  { id: "marker", label: "Markers", hint: "Opaque felt tip", emoji: "🖋️" },
  { id: "highlighter", label: "Highlighters", hint: "Transparent wash", emoji: "🖍️" },
  { id: "crayon", label: "Crayons", hint: "Waxy sticks", emoji: "🧡" },
  { id: "chalk", label: "Chalk", hint: "Soft chalk sticks", emoji: "🤍" },
  { id: "tape", label: "Tape", hint: "Straight tape", emoji: "📎" },
];

export function CoreToolbarPenPanel({
  state,
  inkColor,
  inkSize = 14,
  onInkColorChange,
  onInkSizeChange,
  fillPattern = "solid",
  onFillPatternChange,
  onChange,
  onSelectPenMode,
  onClose,
}: {
  state: CoreToolbarState;
  inkColor: string;
  inkSize?: number;
  onInkColorChange: (color: string) => void;
  onInkSizeChange?: (size: number) => void;
  fillPattern?: import("@/lib/core/ink-engine").InkFillPattern;
  onFillPatternChange?: (pattern: import("@/lib/core/ink-engine").InkFillPattern) => void;
  onChange: (patch: Partial<CoreToolbarState>) => void;
  onSelectPenMode: (mode: PenMode) => void;
  onClose: () => void;
}) {
  const [screen, setScreen] = useState<PenScreen>("main");
  const [dictionaryWord, setDictionaryWord] = useState("");

  function patchPenSettings(patch: Partial<CoreToolbarState["penSettings"]>) {
    onChange({ penSettings: { ...state.penSettings, ...patch } });
  }

  function patchDrawHold(patch: Partial<CoreToolbarState["penSettings"]["drawAndHold"]>) {
    patchPenSettings({
      drawAndHold: { ...state.penSettings.drawAndHold, ...patch },
    });
  }

  function patchGestures(patch: Partial<CoreToolbarState["penSettings"]["gestures"]>) {
    patchPenSettings({
      gestures: { ...state.penSettings.gestures, ...patch },
    });
  }

  function patchFountain(patch: Partial<CoreToolbarState["fountainPen"]>) {
    onChange({ fountainPen: { ...state.fountainPen, ...patch } });
  }

  function patchWritingAids(patch: Partial<CoreToolbarState["writingAids"]>) {
    onChange({ writingAids: { ...state.writingAids, ...patch } });
  }

  if (screen === "main") {
    return (
      <CoreToolbarShell title="Writing" onClose={onClose}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {WRITING_TOOLS.map((tool) => {
            const isPenGroup = tool.id === "pen-picker";
            const active = isPenGroup
              ? ["fountain", "ball", "brush"].includes(state.activePenMode)
              : state.activePenMode === tool.id;
            return (
              <CoreChromeAction
                key={tool.id}
                pressed={active}
                onActivate={() => {
                  if (isPenGroup) {
                    setScreen("pen-picker");
                    return;
                  }
                  onSelectPenMode(tool.id as PenMode);
                  if (tool.id === "pencil") setScreen("pencil");
                  else if (tool.id === "colorPencil") setScreen("colorPencil");
                  else if (tool.id === "chalk") setScreen("chalk");
                  else if (tool.id === "crayon") setScreen("crayon");
                  else if (tool.id === "marker") setScreen("marker");
                  else if (tool.id === "highlighter") setScreen("highlighter");
                  else if (tool.id === "tape") setScreen("tape");
                }}
                className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl border px-3 py-4 text-center transition touch-manipulation ${
                  active
                    ? "border-stone-900 bg-stone-900 text-white"
                    : "border-stone-200 bg-white hover:border-orange-200 hover:bg-orange-50"
                }`}
              >
                <span className="text-2xl">{tool.emoji}</span>
                <span className="text-xs font-bold">{tool.label}</span>
                <span className={`text-[10px] ${active ? "text-white/80" : "text-stone-500"}`}>
                  {tool.hint}
                </span>
              </CoreChromeAction>
            );
          })}
        </div>
        <div className="mt-3 border-t border-stone-100 pt-2">
          <NavRow label="Pen settings" onClick={() => setScreen("pen-settings")} />
          <NavRow label="Writing aids" onClick={() => setScreen("writing-aids")} />
        </div>
      </CoreToolbarShell>
    );
  }

  if (screen === "pen-picker") {
    return (
      <CoreToolbarShell title="Pen" onBack={() => setScreen("main")} onClose={onClose}>
        <div className="space-y-1">
          {PEN_VARIANTS.map((mode) => (
            <CoreChromeAction
              key={mode.id}
              pressed={state.activePenMode === mode.id}
              onActivate={() => {
                onSelectPenMode(mode.id);
                setScreen("fountain");
              }}
              className={`flex min-h-11 w-full items-center justify-between rounded-xl px-2 py-2.5 text-left touch-manipulation hover:bg-stone-50 ${
                state.activePenMode === mode.id ? "bg-orange-50 ring-1 ring-orange-200" : ""
              }`}
            >
              <span className="text-sm font-semibold text-stone-800">{mode.label}</span>
              {state.activePenMode === mode.id ? (
                <span className="text-[10px] font-bold text-orange-600">Active</span>
              ) : null}
            </CoreChromeAction>
          ))}
        </div>
      </CoreToolbarShell>
    );
  }

  if (screen === "fountain") {
    return (
      <CoreToolbarShell
        title={
          state.activePenMode === "ball"
            ? "Ball pen"
            : state.activePenMode === "brush"
              ? "Brush pen"
              : "Fountain pen"
        }
        onBack={() => setScreen("pen-picker")}
        onClose={onClose}
      >
        <SliderRow
          label="Thickness"
          value={state.fountainPen.thickness}
          min={1}
          max={16}
          onChange={(value) => {
            patchFountain({ thickness: value });
            onInkSizeChange?.(value);
          }}
        />
        <p className="mt-2 text-xs font-bold uppercase tracking-wider text-stone-400">Stroke type</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {(["solid", "dashed", "dotted"] as const).map((strokeType) => (
            <OptionChip
              key={strokeType}
              label={strokeType}
              active={state.fountainPen.strokeType === strokeType}
              onClick={() => patchFountain({ strokeType })}
            />
          ))}
        </div>
        <InkColorControls
          inkColor={inkColor}
          onInkColorChange={onInkColorChange}
          fillPattern={fillPattern}
          onFillPatternChange={onFillPatternChange}
        />
        <div className="mt-3 border-t border-stone-100 pt-2">
          <SliderRow
            label="Tip sharpness"
            value={state.fountainPen.tipSharpness}
            onChange={(value) => patchFountain({ tipSharpness: value })}
          />
          <SliderRow
            label="Pressure sensitivity"
            value={state.fountainPen.pressureSensitivity}
            onChange={(value) => patchFountain({ pressureSensitivity: value })}
          />
          <SliderRow
            label="Tip flatness"
            value={state.fountainPen.tipFlatness}
            onChange={(value) => patchFountain({ tipFlatness: value })}
          />
        </div>
      </CoreToolbarShell>
    );
  }

  if (screen === "pen-settings") {
    return (
      <CoreToolbarShell title="Pen settings" onBack={() => setScreen("main")} onClose={onClose}>
        <ToggleRow
          label="Adjust thickness by speed"
          checked={state.penSettings.thicknessBySpeed}
          onChange={(value) => patchPenSettings({ thicknessBySpeed: value })}
        />
        <ToggleRow
          label="Reduce latency"
          checked={state.penSettings.reduceLatency}
          onChange={(value) => patchPenSettings({ reduceLatency: value })}
        />
        <NavRow label="Draw and hold" onClick={() => setScreen("draw-hold")} />
        <NavRow label="Pen gestures" onClick={() => setScreen("gestures")} />
      </CoreToolbarShell>
    );
  }

  if (screen === "draw-hold") {
    return (
      <CoreToolbarShell title="Draw and hold" onBack={() => setScreen("pen-settings")} onClose={onClose}>
        <ToggleRow
          label="Draw and hold"
          checked={state.penSettings.drawAndHold.enabled}
          onChange={(value) => patchDrawHold({ enabled: value })}
        />
        <p className="mt-2 text-xs font-bold uppercase tracking-wider text-stone-400">
          Advanced options
        </p>
        <ToggleRow
          label="Snap to other shapes"
          checked={state.penSettings.drawAndHold.snapToShapes}
          onChange={(value) => patchDrawHold({ snapToShapes: value })}
        />
        <ToggleRow
          label="Fill color"
          checked={state.penSettings.drawAndHold.fillColor}
          onChange={(value) => patchDrawHold({ fillColor: value })}
        />
      </CoreToolbarShell>
    );
  }

  if (screen === "gestures") {
    return (
      <CoreToolbarShell title="Pen gestures" onBack={() => setScreen("pen-settings")} onClose={onClose}>
        <ToggleRow
          label="Scribble to erase"
          checked={state.penSettings.gestures.scribbleToErase}
          onChange={(value) => patchGestures({ scribbleToErase: value })}
        />
        <ToggleRow
          label="Erase shapes and highlighter"
          checked={state.penSettings.gestures.eraseShapesAndHighlighter}
          onChange={(value) => patchGestures({ eraseShapesAndHighlighter: value })}
        />
        <ToggleRow
          label="Circle to lasso"
          checked={state.penSettings.gestures.circleToLasso}
          onChange={(value) => patchGestures({ circleToLasso: value })}
        />
      </CoreToolbarShell>
    );
  }

  if (screen === "writing-aids") {
    return (
      <CoreToolbarShell title="Writing aids" onBack={() => setScreen("main")} onClose={onClose}>
        <label className="block px-2 py-2 text-sm">
          <span className="font-semibold text-stone-800">Recognition language</span>
          <select
            value={state.writingAids.recognitionLanguage}
            onChange={(event) => patchWritingAids({ recognitionLanguage: event.target.value })}
            className="mt-1 w-full rounded-lg border border-stone-200 px-2 py-1.5 text-sm"
          >
            <option value="auto">Auto detect</option>
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="es-ES">Spanish</option>
            <option value="fr-FR">French</option>
          </select>
        </label>
        <ToggleRow
          label="Check spelling"
          checked={state.writingAids.checkSpelling}
          onChange={(value) => patchWritingAids({ checkSpelling: value })}
        />
        <p className="mt-2 text-xs font-bold uppercase tracking-wider text-stone-400">
          Advanced settings
        </p>
        <ToggleRow
          label="Enable spellcheck for new documents"
          checked={state.writingAids.spellcheckNewDocuments}
          onChange={(value) => patchWritingAids({ spellcheckNewDocuments: value })}
        />
        <NavRow label="Personal dictionary" onClick={() => setScreen("dictionary")} />
      </CoreToolbarShell>
    );
  }

  if (screen === "dictionary") {
    return (
      <CoreToolbarShell
        title="Personal dictionary"
        onBack={() => setScreen("writing-aids")}
        onClose={onClose}
      >
        <div className="flex gap-2">
          <input
            value={dictionaryWord}
            onChange={(event) => setDictionaryWord(event.target.value)}
            placeholder="Add custom word…"
            className="flex-1 rounded-lg border border-stone-200 px-2 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={() => {
              const word = dictionaryWord.trim();
              if (!word) return;
              patchWritingAids({
                personalDictionary: [...state.writingAids.personalDictionary, word],
              });
              setDictionaryWord("");
            }}
            className="rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-bold text-white"
          >
            Add
          </button>
        </div>
        <ul className="mt-3 space-y-1">
          {state.writingAids.personalDictionary.map((word) => (
            <li
              key={word}
              className="flex items-center justify-between rounded-lg bg-stone-50 px-2 py-1.5 text-sm"
            >
              {word}
              <button
                type="button"
                onClick={() =>
                  patchWritingAids({
                    personalDictionary: state.writingAids.personalDictionary.filter(
                      (item) => item !== word,
                    ),
                  })
                }
                className="text-xs text-rose-600"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </CoreToolbarShell>
    );
  }

  if (screen === "pencil") {
    return (
      <CoreToolbarShell title="Standard pencil" onBack={() => setScreen("main")} onClose={onClose}>
        <InkColorControls inkColor={inkColor} onInkColorChange={onInkColorChange} label="Pencil color" />
        <ToggleRow
          label="Reduce latency"
          checked={state.pencilReduceLatency}
          onChange={(value) => onChange({ pencilReduceLatency: value })}
        />
        <NavRow label="Draw and hold" onClick={() => setScreen("draw-hold")} />
      </CoreToolbarShell>
    );
  }

  if (screen === "colorPencil") {
    return (
      <CoreToolbarShell title="Color pencils" onBack={() => setScreen("main")} onClose={onClose}>
        <InkColorControls
          inkColor={inkColor}
          onInkColorChange={onInkColorChange}
          label="Lead color"
          palette="colorPencil"
        />
        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-stone-400">
          Lead size
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          {[
            { id: "fine", label: "Fine", size: 2 },
            { id: "standard", label: "Standard", size: 3 },
            { id: "soft", label: "Soft", size: 5 },
            { id: "bold", label: "Bold", size: 7 },
          ].map((tip) => (
            <OptionChip
              key={tip.id}
              label={tip.label}
              active={inkSize === tip.size}
              onClick={() => onInkSizeChange?.(tip.size)}
            />
          ))}
        </div>
        <ToggleRow
          label="Reduce latency"
          checked={state.pencilReduceLatency}
          onChange={(value) => onChange({ pencilReduceLatency: value })}
        />
      </CoreToolbarShell>
    );
  }

  if (screen === "chalk") {
    return (
      <CoreToolbarShell title="Chalk" onBack={() => setScreen("main")} onClose={onClose}>
        <InkColorControls
          inkColor={inkColor}
          onInkColorChange={onInkColorChange}
          label="Chalk color"
          palette="chalk"
        />
        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-stone-400">
          Stick size
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          {[
            { id: "thin", label: "Thin", size: 4 },
            { id: "stick", label: "Stick", size: 6 },
            { id: "fat", label: "Fat", size: 10 },
            { id: "block", label: "Block", size: 16 },
          ].map((tip) => (
            <OptionChip
              key={tip.id}
              label={tip.label}
              active={inkSize === tip.size}
              onClick={() => onInkSizeChange?.(tip.size)}
            />
          ))}
        </div>
        <p className="mt-3 text-[10px] text-stone-500">
          Pairs with chalkboard paper — soft pastel sticks on a dark board.
        </p>
      </CoreToolbarShell>
    );
  }

  if (screen === "crayon") {
    return (
      <CoreToolbarShell title="Crayons" onBack={() => setScreen("main")} onClose={onClose}>
        <InkColorControls
          inkColor={inkColor}
          onInkColorChange={onInkColorChange}
          label="Crayon color"
          palette="crayon"
        />
        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-stone-400">
          Stick size
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          {[
            { id: "thin", label: "Thin", size: 6 },
            { id: "stick", label: "Stick", size: 9 },
            { id: "fat", label: "Fat", size: 14 },
            { id: "jumbo", label: "Jumbo", size: 20 },
          ].map((tip) => (
            <OptionChip
              key={tip.id}
              label={tip.label}
              active={inkSize === tip.size}
              onClick={() => onInkSizeChange?.(tip.size)}
            />
          ))}
        </div>
        <p className="mt-3 text-[10px] text-stone-500">
          Waxy coverage — great for diagrams and colorful notes.
        </p>
      </CoreToolbarShell>
    );
  }

  if (screen === "marker") {
    return (
      <CoreToolbarShell title="Markers" onBack={() => setScreen("main")} onClose={onClose}>
        <InkColorControls
          inkColor={inkColor}
          onInkColorChange={onInkColorChange}
          label="Marker color"
          palette="marker"
          fillPattern={fillPattern}
          onFillPatternChange={onFillPatternChange}
        />
        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-stone-400">
          Tip size
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          {[
            { id: "fine", label: "Fine", size: 5 },
            { id: "medium", label: "Medium", size: 10 },
            { id: "bold", label: "Bold", size: 16 },
            { id: "poster", label: "Poster", size: 24 },
          ].map((tip) => (
            <OptionChip
              key={tip.id}
              label={tip.label}
              active={inkSize === tip.size}
              onClick={() => onInkSizeChange?.(tip.size)}
            />
          ))}
        </div>
        <p className="mt-3 text-[10px] text-stone-500">
          Opaque felt tip — different from highlighters (those stay transparent wash).
        </p>
      </CoreToolbarShell>
    );
  }

  if (screen === "highlighter") {
    return (
      <CoreToolbarShell title="Highlighters" onBack={() => setScreen("main")} onClose={onClose}>
        <InkColorControls
          inkColor={inkColor}
          onInkColorChange={onInkColorChange}
          label="Highlighter color"
          palette="highlighter"
          fillPattern={fillPattern}
          onFillPatternChange={onFillPatternChange}
        />
        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-stone-400">
          Tip size
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          {[
            { id: "pen", label: "Pen tip", size: 8 },
            { id: "marker", label: "Marker", size: 14 },
            { id: "wide", label: "Wide", size: 22 },
            { id: "block", label: "Block", size: 32 },
          ].map((tip) => (
            <OptionChip
              key={tip.id}
              label={tip.label}
              active={inkSize === tip.size}
              onClick={() => onInkSizeChange?.(tip.size)}
            />
          ))}
        </div>
        <ToggleRow
          label="Reduce latency"
          checked={state.highlighterReduceLatency}
          onChange={(value) => onChange({ highlighterReduceLatency: value })}
        />
        <NavRow label="Draw and hold" onClick={() => setScreen("draw-hold")} />
      </CoreToolbarShell>
    );
  }

  if (screen === "tape") {
    return (
      <CoreToolbarShell title="Tape" onBack={() => setScreen("main")} onClose={onClose}>
        <InkColorControls inkColor={inkColor} onInkColorChange={onInkColorChange} label="Tape color" />
        <ToggleRow
          label="Straight tape"
          checked={state.tape.straightTape}
          onChange={(value) => onChange({ tape: { ...state.tape, straightTape: value } })}
        />
        <button
          type="button"
          onClick={() => onChange({ tape: { straightTape: state.tape.straightTape } })}
          className="mt-3 w-full rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700"
        >
          Remove all tape
        </button>
      </CoreToolbarShell>
    );
  }

  return (
    <CoreToolbarShell title="Draw shape" onBack={() => setScreen("main")} onClose={onClose}>
      <InkColorControls inkColor={inkColor} onInkColorChange={onInkColorChange} label="Shape stroke" />
      <ToggleRow
        label="Require hold to snap"
        checked={state.shapeDraw.requireHoldToSnap}
        onChange={(value) =>
          onChange({ shapeDraw: { ...state.shapeDraw, requireHoldToSnap: value } })
        }
      />
      <p className="mt-2 text-xs font-bold uppercase tracking-wider text-stone-400">
        Advanced options
      </p>
      <ToggleRow
        label="Snap to other shapes"
        checked={state.shapeDraw.snapToShapes}
        onChange={(value) => onChange({ shapeDraw: { ...state.shapeDraw, snapToShapes: value } })}
      />
      <ToggleRow
        label="Fill color"
        checked={state.shapeDraw.fillColor}
        onChange={(value) => onChange({ shapeDraw: { ...state.shapeDraw, fillColor: value } })}
      />
      <p className="mt-3 text-xs font-bold uppercase tracking-wider text-stone-400">Shape type</p>
      <div className="mt-1 flex flex-wrap gap-2">
        {(["rect", "ellipse", "triangle", "line", "arrow"] as const).map((kind) => (
          <OptionChip
            key={kind}
            label={kind}
            active={state.shapeKind === kind}
            onClick={() => onChange({ shapeKind: kind })}
          />
        ))}
      </div>
    </CoreToolbarShell>
  );
}
