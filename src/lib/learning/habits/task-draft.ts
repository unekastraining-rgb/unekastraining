import type { SupportLevel } from "@/lib/learning/habits/document";

export type DraftPiece = { id: string; label: string };

/**
 * The answer and support that will be saved. Updates are synchronous so a
 * submit cannot read an older render.
 * Support stays "none" until the learner opens a hint or example.
 */
export function createTaskDraft(input: { order: DraftPiece[] }) {
  let order = input.order.map((piece) => ({ ...piece }));
  let support: SupportLevel = "none";
  const placed: Record<string, string> = {};
  let choice = "";

  return {
    move(id: string, direction: -1 | 1) {
      const index = order.findIndex((piece) => piece.id === id);
      if (index < 0) return order.map((piece) => ({ ...piece }));
      const target = index + direction;
      if (target < 0 || target >= order.length) return order.map((piece) => ({ ...piece }));
      const next = [...order];
      const current = next[index]!;
      next[index] = next[target]!;
      next[target] = current;
      order = next;
      return order.map((piece) => ({ ...piece }));
    },
    markSupport(level: Exclude<SupportLevel, "none">) {
      support = level;
    },
    place(pieceId: string, slotId: string) {
      placed[pieceId] = slotId;
    },
    choose(id: string) {
      choice = id;
    },
    snapshot() {
      const assignment = Object.keys(placed)
        .sort()
        .map((id) => `${id}:${placed[id] ?? ""}`)
        .join("|");
      return {
        order: order.map((piece) => ({ ...piece })),
        orderId: order.map((piece) => piece.id).join(">"),
        support,
        placed: { ...placed },
        assignment,
        choice,
      };
    },
  };
}
