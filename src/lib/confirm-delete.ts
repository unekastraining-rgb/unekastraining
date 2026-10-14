export function confirmDelete(label: string): boolean {
  return window.confirm(
    `Delete "${label}"? This cannot be undone.`,
  );
}

/** Confirm deleting one or many items. */
export function confirmDeleteMany(
  count: number,
  options?: { noun?: string; nounPlural?: string; detail?: string },
): boolean {
  const noun = options?.noun ?? "item";
  const plural = options?.nounPlural ?? `${noun}s`;
  if (count <= 0) return false;
  if (count === 1) {
    return window.confirm(
      `Delete this ${noun}${options?.detail ? ` (${options.detail})` : ""}? This cannot be undone.`,
    );
  }
  return window.confirm(
    `Delete ${count} ${plural}${options?.detail ? ` (${options.detail})` : ""}? This cannot be undone.`,
  );
}
